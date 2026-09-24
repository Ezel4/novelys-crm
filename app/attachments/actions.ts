'use server';

import { and, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { database } from '@/db';
import { attachments } from '@/db/schema';
import { attachmentSchema } from '@/lib/schemas/attachment';

type ActionResult = { error: string } | { success: true; id: string };

export async function addAttachment(input: unknown): Promise<ActionResult> {
  const parsed = attachmentSchema.omit({ id: true, revision: true }).safeParse(input);
  if (!parsed.success) return { error: 'Vérifiez le nom et l’URL saisis.' };

  const id = crypto.randomUUID();
  const data = parsed.data;
  try {
    await database().insert(attachments).values({ id, ...data, revision: 0 });
  } catch (e) {
    console.error('addAttachment', e);
    return { error: 'Impossible d’ajouter ce lien. Réessayez.' };
  }

  if (data.accountId) revalidatePath(`/comptes/${data.accountId}`);
  return { success: true, id };
}

export async function deleteAttachment(id: string, revision: number, accountId: string | null): Promise<ActionResult> {
  const db = database();
  let changes = 0;
  try {
    const result = await db.delete(attachments).where(and(eq(attachments.id, id), eq(attachments.revision, revision)));
    changes = result.count;
  } catch (e) {
    console.error('deleteAttachment', e);
    return { error: 'Suppression impossible. Réessayez.' };
  }

  if (!changes) return { error: 'Cette pièce jointe a changé. Actualisez la page avant de réessayer.' };

  if (accountId) revalidatePath(`/comptes/${accountId}`);
  return { success: true, id };
}
