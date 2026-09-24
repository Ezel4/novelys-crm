'use server';

import { and, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { database } from '@/db';
import { campaigns } from '@/db/schema';
import { campaignSchema } from '@/lib/schemas';

type ActionResult = { error: string } | { success: true; id: string };

export async function createCampaign(input: unknown): Promise<ActionResult> {
  const parsed = campaignSchema.omit({ id: true, revision: true }).safeParse(input);
  if (!parsed.success) return { error: 'Vérifiez les informations saisies.' };

  const id = crypto.randomUUID();
  try {
    await database()
      .insert(campaigns)
      .values({ id, ...parsed.data, revision: 0 });
  } catch (e) {
    console.error('createCampaign', e);
    return { error: 'Impossible de créer la campagne. Réessayez.' };
  }

  revalidatePath('/campagnes');
  return { success: true, id };
}

export async function updateCampaign(input: unknown): Promise<ActionResult> {
  const parsed = campaignSchema.safeParse(input);
  if (!parsed.success) return { error: 'Vérifiez les informations saisies.' };
  const data = parsed.data;

  const db = database();
  let changes = 0;
  try {
    const result = await db
      .update(campaigns)
      .set({
        name: data.name,
        type: data.type,
        status: data.status,
        startDate: data.startDate,
        endDate: data.endDate,
        budget: data.budget,
        accountId: data.accountId,
        revision: data.revision + 1,
        updatedAt: new Date(),
      })
      .where(and(eq(campaigns.id, data.id), eq(campaigns.revision, data.revision)));
    changes = result.meta.changes;
  } catch (e) {
    console.error('updateCampaign', e);
    return { error: 'Enregistrement impossible. Réessayez.' };
  }

  if (!changes) return { error: 'Cette campagne a changé. Actualisez la page avant de réessayer.' };

  revalidatePath('/campagnes');
  return { success: true, id: data.id };
}
