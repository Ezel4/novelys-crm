'use server';

import { eq, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { database } from '@/db';
import { accounts } from '@/db/schema';
import { accountSchema } from '@/lib/schemas';
import { toCsv } from '@/lib/csv';

type ActionResult = { error: string } | { success: true; id: string };

export async function createAccount(input: unknown): Promise<ActionResult> {
  const parsed = accountSchema.omit({ id: true, revision: true }).safeParse(input);
  if (!parsed.success) return { error: 'Vérifiez les informations saisies.' };

  const id = crypto.randomUUID();
  const db = database();
  try {
    await db.insert(accounts).values({ id, ...parsed.data, revision: 0 });
  } catch (e) {
    console.error('createAccount', e);
    return { error: 'Impossible de créer le compte. Réessayez.' };
  }

  revalidatePath('/comptes');
  revalidatePath('/');
  return { success: true, id };
}

export async function updateAccount(input: unknown): Promise<ActionResult> {
  const parsed = accountSchema.safeParse(input);
  if (!parsed.success) return { error: 'Vérifiez les informations saisies.' };
  const data = parsed.data;

  const db = database();
  let changes = 0;
  try {
    const result = await db
      .update(accounts)
      .set({
        name: data.name,
        city: data.city,
        sector: data.sector,
        family: data.family,
        initials: data.initials,
        color: data.color,
        summary: data.summary,
        orders: data.orders,
        revenue: data.revenue,
        lastOrder: data.lastOrder,
        next: data.next,
        due: data.due,
        revision: data.revision + 1,
        updatedAt: new Date(),
      })
      .where(and(eq(accounts.id, data.id), eq(accounts.revision, data.revision)));
    changes = result.count;
  } catch (e) {
    console.error('updateAccount', e);
    return { error: 'Enregistrement impossible. Réessayez.' };
  }

  if (!changes) {
    return { error: 'Cette fiche a changé. Actualisez la page avant de réessayer.' };
  }

  revalidatePath('/comptes');
  revalidatePath(`/comptes/${data.id}`);
  revalidatePath('/');
  return { success: true, id: data.id };
}

export async function exportAccountsCsv(): Promise<string> {
  const rows = await database().select().from(accounts);
  return toCsv(
    rows.map((a) => ({
      nom: a.name,
      ville: a.city,
      secteur: a.sector,
      famille: a.family,
      commandes: a.orders,
      chiffre_affaires: a.revenue,
      prochaine_action: a.next,
      echeance: a.due ?? '',
    })),
    [
      { key: 'nom', label: 'Nom' },
      { key: 'ville', label: 'Ville' },
      { key: 'secteur', label: 'Secteur' },
      { key: 'famille', label: 'Famille' },
      { key: 'commandes', label: 'Commandes' },
      { key: 'chiffre_affaires', label: 'Chiffre d’affaires' },
      { key: 'prochaine_action', label: 'Prochaine action' },
      { key: 'echeance', label: 'Échéance' },
    ]
  );
}
