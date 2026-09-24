'use server';

import { and, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { database } from '@/db';
import { contacts } from '@/db/schema';
import { contactSchema } from '@/lib/schemas';
import { isoDay } from '@/lib/dashboard';

type ActionResult = { error: string } | { success: true; id: string };

export async function createContact(input: unknown): Promise<ActionResult> {
  const parsed = contactSchema.omit({ id: true, revision: true }).safeParse(input);
  if (!parsed.success) return { error: 'Vérifiez les informations saisies.' };

  const id = crypto.randomUUID();
  const data = parsed.data;
  try {
    await database()
      .insert(contacts)
      .values({
        id,
        ...data,
        verified: data.status === 'Vérifié' ? data.verified ?? isoDay() : null,
        revision: 0,
      });
  } catch (e) {
    console.error('createContact', e);
    return { error: 'Impossible de créer le contact. Réessayez.' };
  }

  revalidatePath('/contacts');
  revalidatePath(`/comptes/${data.accountId}`);
  revalidatePath('/');
  return { success: true, id };
}

export async function updateContact(input: unknown): Promise<ActionResult> {
  const parsed = contactSchema.safeParse(input);
  if (!parsed.success) return { error: 'Vérifiez les informations saisies.' };
  const data = parsed.data;

  const db = database();
  let changes = 0;
  try {
    const result = await db
      .update(contacts)
      .set({
        name: data.name,
        role: data.role,
        email: data.email,
        status: data.status,
        verified: data.status === 'Vérifié' ? data.verified ?? isoDay() : data.status === 'À revérifier' ? data.verified : null,
        revision: data.revision + 1,
        updatedAt: new Date(),
      })
      .where(and(eq(contacts.id, data.id), eq(contacts.revision, data.revision)));
    changes = result.count;
  } catch (e) {
    console.error('updateContact', e);
    return { error: 'Enregistrement impossible. Réessayez.' };
  }

  if (!changes) {
    return { error: 'Ce contact a changé. Actualisez la page avant de réessayer.' };
  }

  revalidatePath('/contacts');
  revalidatePath(`/comptes/${data.accountId}`);
  revalidatePath('/');
  return { success: true, id: data.id };
}
