'use server';

import { and, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { database } from '@/db';
import { accounts, contacts, deals, leads } from '@/db/schema';
import { leadSchema } from '@/lib/schemas/lead';
import { isoDay } from '@/lib/dashboard';
import { toCsv } from '@/lib/csv';

type ActionResult = { error: string } | { success: true; id: string };

export async function createLead(input: unknown): Promise<ActionResult> {
  const parsed = leadSchema.omit({ id: true, revision: true, convertedAccountId: true }).safeParse(input);
  if (!parsed.success) return { error: 'Vérifiez les informations saisies.' };

  const id = crypto.randomUUID();
  try {
    await database()
      .insert(leads)
      .values({ id, ...parsed.data, convertedAccountId: null, revision: 0 });
  } catch (e) {
    console.error('createLead', e);
    return { error: 'Impossible de créer le lead. Réessayez.' };
  }

  revalidatePath('/leads');
  return { success: true, id };
}

export async function updateLeadStatus(id: string, revision: number, status: string): Promise<ActionResult> {
  const parsed = leadSchema.shape.status.safeParse(status);
  if (!parsed.success) return { error: 'Statut invalide.' };

  const db = database();
  let changes = 0;
  try {
    const result = await db
      .update(leads)
      .set({ status: parsed.data, revision: revision + 1, updatedAt: new Date() })
      .where(and(eq(leads.id, id), eq(leads.revision, revision)));
    changes = result.meta.changes;
  } catch (e) {
    console.error('updateLeadStatus', e);
    return { error: 'Mise à jour impossible. Réessayez.' };
  }

  if (!changes) return { error: 'Ce lead a changé. Actualisez la page avant de réessayer.' };

  revalidatePath('/leads');
  return { success: true, id };
}

export async function convertLead(leadId: string): Promise<{ error: string } | { success: true; accountId: string }> {
  const db = database();

  const [lead] = await db.select().from(leads).where(eq(leads.id, leadId)).limit(1);
  if (!lead) return { error: 'Lead introuvable.' };
  if (lead.status === 'Converti' && lead.convertedAccountId) {
    return { success: true, accountId: lead.convertedAccountId };
  }

  const accountName = lead.company.trim() || lead.name;
  const accountId = crypto.randomUUID();
  const contactId = crypto.randomUUID();
  const dealId = crypto.randomUUID();

  try {
    await db.insert(accounts).values({
      id: accountId,
      name: accountName,
      city: '',
      sector: '',
      family: '',
      initials: accountName.slice(0, 2).toUpperCase(),
      color: 'blue',
      summary: `Compte créé à partir du lead ${lead.name}${lead.source ? ` (source : ${lead.source})` : ''}.`,
      orders: 0,
      revenue: 0,
      lastOrder: null,
      next: 'Qualifier le besoin',
      due: isoDay(1),
      revision: 0,
    });

    await db.insert(contacts).values({
      id: contactId,
      accountId,
      name: lead.name,
      role: '',
      email: lead.email,
      status: 'À revérifier',
      verified: null,
      revision: 0,
    });

    await db.insert(deals).values({
      id: dealId,
      accountId,
      contactId,
      name: `Projet ${accountName}`,
      amount: 0,
      stage: 'À qualifier',
      decisionMaker: '',
      deadline: null,
      logo: false,
      revision: 0,
    });

    const result = await db
      .update(leads)
      .set({ status: 'Converti', convertedAccountId: accountId, revision: lead.revision + 1, updatedAt: new Date() })
      .where(and(eq(leads.id, leadId), eq(leads.revision, lead.revision)));

    if (!result.meta.changes) {
      return { error: 'Ce lead a changé. Actualisez la page avant de réessayer.' };
    }
  } catch (e) {
    console.error('convertLead', e);
    return { error: 'Conversion impossible. Réessayez.' };
  }

  revalidatePath('/leads');
  revalidatePath('/comptes');
  revalidatePath(`/comptes/${accountId}`);
  revalidatePath('/affaires');
  revalidatePath('/contacts');
  revalidatePath('/');
  return { success: true, accountId };
}

export async function exportLeadsCsv(): Promise<string> {
  const rows = await database().select().from(leads);
  return toCsv(
    rows.map((l) => ({
      nom: l.name,
      entreprise: l.company,
      email: l.email,
      telephone: l.phone,
      statut: l.status,
      source: l.source,
    })),
    [
      { key: 'nom', label: 'Nom' },
      { key: 'entreprise', label: 'Entreprise' },
      { key: 'email', label: 'E-mail' },
      { key: 'telephone', label: 'Téléphone' },
      { key: 'statut', label: 'Statut' },
      { key: 'source', label: 'Source' },
    ]
  );
}

type ImportRow = { name: string; company?: string; email?: string; phone?: string; source?: string };
type ImportResult = { error: string } | { success: true; imported: number; skipped: number };

export async function importLeads(rows: ImportRow[]): Promise<ImportResult> {
  if (!Array.isArray(rows) || !rows.length) return { error: 'Aucune ligne à importer.' };

  const db = database();
  let imported = 0;
  let skipped = 0;

  for (const row of rows) {
    const parsed = leadSchema.omit({ id: true, revision: true, convertedAccountId: true, status: true, campaignId: true }).safeParse({
      name: row.name ?? '',
      company: row.company ?? '',
      email: row.email ?? '',
      phone: row.phone ?? '',
      source: row.source ?? '',
    });
    if (!parsed.success) {
      skipped++;
      continue;
    }
    try {
      await db.insert(leads).values({
        id: crypto.randomUUID(),
        ...parsed.data,
        status: 'Nouveau',
        campaignId: null,
        convertedAccountId: null,
        revision: 0,
      });
      imported++;
    } catch (e) {
      console.error('importLeads', e);
      skipped++;
    }
  }

  revalidatePath('/leads');
  return { success: true, imported, skipped };
}
