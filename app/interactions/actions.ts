'use server';

import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { database } from '@/db';
import { accounts, interactions } from '@/db/schema';
import { interactionSchema } from '@/lib/schemas';

type ActionResult = { error: string } | { success: true; id: string };

export async function createInteraction(input: unknown): Promise<ActionResult> {
  const parsed = interactionSchema.omit({ id: true, revision: true }).safeParse(input);
  if (!parsed.success) return { error: 'Vérifiez les informations saisies.' };

  const data = parsed.data;
  const id = crypto.randomUUID();
  const db = database();

  try {
    await db.insert(interactions).values({ id, ...data, revision: 0 });

    if (data.accountId) {
      await db
        .update(accounts)
        .set({ next: data.next, due: data.due, updatedAt: new Date() })
        .where(eq(accounts.id, data.accountId));
    }
  } catch (e) {
    console.error('createInteraction', e);
    return { error: 'Enregistrement impossible. Vos saisies sont conservées ; réessayez.' };
  }

  revalidatePath('/interactions');
  if (data.accountId) revalidatePath(`/comptes/${data.accountId}`);
  revalidatePath('/comptes');
  revalidatePath('/');
  return { success: true, id };
}
