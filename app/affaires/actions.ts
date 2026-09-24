'use server';

import { and, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { database } from '@/db';
import { accounts, deals } from '@/db/schema';
import { dealSchema } from '@/lib/schemas';
import { toCsv } from '@/lib/csv';

type ActionResult = { error: string } | { success: true; id: string };

export async function createDeal(input: unknown): Promise<ActionResult> {
  const parsed = dealSchema.omit({ id: true, revision: true }).safeParse(input);
  if (!parsed.success) return { error: 'Vérifiez les informations saisies.' };

  const id = crypto.randomUUID();
  const data = parsed.data;
  try {
    await database()
      .insert(deals)
      .values({ id, ...data, revision: 0 });
  } catch (e) {
    console.error('createDeal', e);
    return { error: 'Impossible de créer l\'affaire. Réessayez.' };
  }

  revalidatePath('/affaires');
  revalidatePath(`/comptes/${data.accountId}`);
  revalidatePath('/');
  return { success: true, id };
}

export async function updateDeal(input: unknown): Promise<ActionResult> {
  const parsed = dealSchema.safeParse(input);
  if (!parsed.success) return { error: 'Vérifiez les informations saisies.' };
  const data = parsed.data;

  const db = database();
  let changes = 0;
  try {
    const result = await db
      .update(deals)
      .set({
        contactId: data.contactId,
        name: data.name,
        amount: data.amount,
        stage: data.stage,
        decisionMaker: data.decisionMaker,
        deadline: data.deadline,
        logo: data.logo,
        revision: data.revision + 1,
        updatedAt: new Date(),
      })
      .where(and(eq(deals.id, data.id), eq(deals.revision, data.revision)));
    changes = result.meta.changes;
  } catch (e) {
    console.error('updateDeal', e);
    return { error: 'Enregistrement impossible. Réessayez.' };
  }

  if (!changes) return { error: 'Cette affaire a changé. Actualisez la page avant de réessayer.' };

  revalidatePath('/affaires');
  revalidatePath(`/comptes/${data.accountId}`);
  revalidatePath('/');
  return { success: true, id: data.id };
}

export async function updateDealStage(id: string, revision: number, stage: string, accountId: string): Promise<ActionResult> {
  const parsed = dealSchema.shape.stage.safeParse(stage);
  if (!parsed.success) return { error: 'Statut invalide.' };

  const db = database();
  let changes = 0;
  try {
    const result = await db
      .update(deals)
      .set({ stage: parsed.data, revision: revision + 1, updatedAt: new Date() })
      .where(and(eq(deals.id, id), eq(deals.revision, revision)));
    changes = result.meta.changes;
  } catch (e) {
    console.error('updateDealStage', e);
    return { error: 'Mise à jour impossible. Réessayez.' };
  }

  if (!changes) return { error: 'Cette affaire a changé. Actualisez la page avant de réessayer.' };

  revalidatePath('/affaires');
  revalidatePath(`/comptes/${accountId}`);
  revalidatePath('/');
  return { success: true, id };
}

export async function exportDealsCsv(): Promise<string> {
  const db = database();
  const [dealRows, accountRows] = await Promise.all([db.select().from(deals), db.select().from(accounts)]);
  const accountById = new Map(accountRows.map((a) => [a.id, a.name]));
  return toCsv(
    dealRows.map((d) => ({
      nom: d.name,
      compte: accountById.get(d.accountId) ?? '',
      montant: d.amount,
      statut: d.stage,
      decideur: d.decisionMaker,
      echeance: d.deadline ?? '',
    })),
    [
      { key: 'nom', label: 'Nom' },
      { key: 'compte', label: 'Compte' },
      { key: 'montant', label: 'Montant' },
      { key: 'statut', label: 'Statut' },
      { key: 'decideur', label: 'Décideur' },
      { key: 'echeance', label: 'Échéance' },
    ]
  );
}
