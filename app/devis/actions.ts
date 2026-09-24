'use server';

import { and, eq, like } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { database } from '@/db';
import { accounts, deals, quotes, quoteItems } from '@/db/schema';
import { quoteInputSchema, quoteUpdateSchema, quoteSchema, quoteTotals, type QuoteItemInput } from '@/lib/schemas';
import { toCsv } from '@/lib/csv';

type ActionResult = { error: string } | { success: true; id: string };

/** Étape d'affaire induite par le statut du devis. `null` = ne pas toucher à l'affaire. */
function dealStageForQuoteStatus(status: string): 'Devis à préparer' | 'Devis envoyé' | 'Gagné' | 'Perdu' | null {
  switch (status) {
    case 'Brouillon': return 'Devis à préparer';
    case 'Envoyé': return 'Devis envoyé';
    case 'Accepté': return 'Gagné';
    case 'Refusé': return 'Perdu';
    default: return null;
  }
}

/** Aligne l'étape de l'affaire sur le statut du devis. Best effort : n'échoue jamais l'action. */
async function syncDealStage(db: ReturnType<typeof database>, dealId: string, status: string) {
  const stage = dealStageForQuoteStatus(status);
  if (!stage) return;
  try {
    await db.update(deals).set({ stage, updatedAt: new Date() }).where(eq(deals.id, dealId));
  } catch (e) {
    console.error('syncDealStage', e);
  }
}

/** Numéro séquentiel DEV-<année>-<NNN>, calculé sur les devis de l'année en cours. */
async function nextQuoteNumber(db: ReturnType<typeof database>) {
  const year = new Date().getFullYear();
  const prefix = `DEV-${year}-`;
  const rows = await db.select({ number: quotes.number }).from(quotes).where(like(quotes.number, `${prefix}%`));
  const highest = rows.reduce((max, r) => {
    const n = Number.parseInt(r.number.slice(prefix.length), 10);
    return Number.isFinite(n) && n > max ? n : max;
  }, 0);
  return `${prefix}${String(highest + 1).padStart(3, '0')}`;
}

function buildItemRows(quoteId: string, items: QuoteItemInput[]) {
  return items.map((item, index) => ({
    id: crypto.randomUUID(),
    quoteId,
    position: index,
    label: item.label,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    discount: item.discount,
  }));
}

export async function createQuote(input: unknown): Promise<ActionResult> {
  const parsed = quoteInputSchema.safeParse(input);
  if (!parsed.success) return { error: 'Vérifiez les informations saisies.' };

  const { items, ...data } = parsed.data;
  const id = crypto.randomUUID();
  const db = database();

  try {
    const number = await nextQuoteNumber(db);
    await db.insert(quotes).values({ id, number, ...data, revision: 0 });
    await db.insert(quoteItems).values(buildItemRows(id, items));
  } catch (e) {
    console.error('createQuote', e);
    return { error: 'Impossible de créer le devis. Réessayez.' };
  }

  await syncDealStage(db, data.dealId, data.status);

  revalidatePath('/devis');
  revalidatePath('/affaires');
  revalidatePath(`/comptes/${data.accountId}`);
  revalidatePath('/');
  return { success: true, id };
}

export async function updateQuote(input: unknown): Promise<ActionResult> {
  const parsed = quoteUpdateSchema.safeParse(input);
  if (!parsed.success) return { error: 'Vérifiez les informations saisies.' };

  const { items, ...data } = parsed.data;
  const db = database();
  let changes = 0;

  try {
    const result = await db
      .update(quotes)
      .set({
        contactId: data.contactId,
        status: data.status,
        issueDate: data.issueDate,
        validUntil: data.validUntil,
        vatRate: data.vatRate,
        notes: data.notes,
        revision: data.revision + 1,
        updatedAt: new Date(),
      })
      .where(and(eq(quotes.id, data.id), eq(quotes.revision, data.revision)));
    changes = result.count;

    // Les lignes ne sont remplacées qu'une fois le verrou optimiste acquis.
    if (changes) {
      await db.delete(quoteItems).where(eq(quoteItems.quoteId, data.id));
      await db.insert(quoteItems).values(buildItemRows(data.id, items));
    }
  } catch (e) {
    console.error('updateQuote', e);
    return { error: 'Enregistrement impossible. Réessayez.' };
  }

  if (!changes) return { error: 'Ce devis a changé. Actualisez la page avant de réessayer.' };

  await syncDealStage(db, data.dealId, data.status);

  revalidatePath('/devis');
  revalidatePath(`/devis/${data.id}`);
  revalidatePath('/affaires');
  revalidatePath(`/comptes/${data.accountId}`);
  revalidatePath('/');
  return { success: true, id: data.id };
}

export async function updateQuoteStatus(
  id: string,
  revision: number,
  status: string,
  accountId: string,
  dealId: string
): Promise<ActionResult> {
  const parsed = quoteSchema.shape.status.safeParse(status);
  if (!parsed.success) return { error: 'Statut invalide.' };

  const db = database();
  let changes = 0;
  try {
    const result = await db
      .update(quotes)
      .set({ status: parsed.data, revision: revision + 1, updatedAt: new Date() })
      .where(and(eq(quotes.id, id), eq(quotes.revision, revision)));
    changes = result.count;
  } catch (e) {
    console.error('updateQuoteStatus', e);
    return { error: 'Mise à jour impossible. Réessayez.' };
  }

  if (!changes) return { error: 'Ce devis a changé. Actualisez la page avant de réessayer.' };

  await syncDealStage(db, dealId, parsed.data);

  revalidatePath('/devis');
  revalidatePath(`/devis/${id}`);
  revalidatePath('/affaires');
  revalidatePath(`/comptes/${accountId}`);
  revalidatePath('/');
  return { success: true, id };
}

export async function deleteQuote(id: string, accountId: string): Promise<ActionResult> {
  const db = database();
  try {
    // quote_items part en cascade via la clé étrangère.
    await db.delete(quotes).where(eq(quotes.id, id));
  } catch (e) {
    console.error('deleteQuote', e);
    return { error: 'Suppression impossible. Réessayez.' };
  }

  revalidatePath('/devis');
  revalidatePath('/affaires');
  revalidatePath(`/comptes/${accountId}`);
  revalidatePath('/');
  return { success: true, id };
}

export async function exportQuotesCsv(): Promise<string> {
  const db = database();
  const [quoteRows, allItems, accountRows] = await Promise.all([
    db.select().from(quotes),
    db.select().from(quoteItems),
    db.select().from(accounts),
  ]);

  const accountById = new Map(accountRows.map((a) => [a.id, a.name]));
  const itemsByQuote = new Map<string, typeof allItems>();
  for (const item of allItems) {
    const list = itemsByQuote.get(item.quoteId);
    if (list) list.push(item);
    else itemsByQuote.set(item.quoteId, [item]);
  }

  return toCsv(
    quoteRows.map((q) => {
      const items = itemsByQuote.get(q.id) ?? [];
      const totals = quoteTotals(items, q.vatRate);
      return {
        numero: q.number,
        compte: accountById.get(q.accountId) ?? '',
        statut: q.status,
        date: q.issueDate,
        validite: q.validUntil ?? '',
        lignes: items.length,
        ht: totals.subtotal,
        tva: totals.vat,
        ttc: totals.total,
      };
    }),
    [
      { key: 'numero', label: 'Numéro' },
      { key: 'compte', label: 'Compte' },
      { key: 'statut', label: 'Statut' },
      { key: 'date', label: 'Date' },
      { key: 'validite', label: 'Validité' },
      { key: 'lignes', label: 'Lignes' },
      { key: 'ht', label: 'Total HT' },
      { key: 'tva', label: 'TVA' },
      { key: 'ttc', label: 'Total TTC' },
    ]
  );
}
