'use server';

import { and, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { database } from '@/db';
import { tasks } from '@/db/schema';
import { taskSchema } from '@/lib/schemas/task';

type ActionResult = { error: string } | { success: true; id: string };

export async function createTask(input: unknown): Promise<ActionResult> {
  const parsed = taskSchema.omit({ id: true, revision: true }).safeParse(input);
  if (!parsed.success) return { error: 'Vérifiez les informations saisies.' };

  const id = crypto.randomUUID();
  try {
    await database().insert(tasks).values({ id, ...parsed.data, revision: 0 });
  } catch (e) {
    console.error('createTask', e);
    return { error: 'Impossible de créer la tâche. Réessayez.' };
  }

  revalidatePath('/taches');
  revalidatePath('/');
  return { success: true, id };
}

export async function updateTask(input: unknown): Promise<ActionResult> {
  const parsed = taskSchema.safeParse(input);
  if (!parsed.success) return { error: 'Vérifiez les informations saisies.' };
  const data = parsed.data;

  const db = database();
  let changes = 0;
  try {
    const result = await db
      .update(tasks)
      .set({
        title: data.title,
        description: data.description,
        dueDate: data.dueDate,
        status: data.status,
        accountId: data.accountId,
        dealId: data.dealId,
        revision: data.revision + 1,
        updatedAt: new Date(),
      })
      .where(and(eq(tasks.id, data.id), eq(tasks.revision, data.revision)));
    changes = result.count;
  } catch (e) {
    console.error('updateTask', e);
    return { error: 'Enregistrement impossible. Réessayez.' };
  }

  if (!changes) return { error: 'Cette tâche a changé. Actualisez la page avant de réessayer.' };

  revalidatePath('/taches');
  revalidatePath('/');
  return { success: true, id: data.id };
}

export async function updateTaskStatus(id: string, revision: number, status: string): Promise<ActionResult> {
  const parsed = taskSchema.shape.status.safeParse(status);
  if (!parsed.success) return { error: 'Statut invalide.' };

  const db = database();
  let changes = 0;
  try {
    const result = await db
      .update(tasks)
      .set({ status: parsed.data, revision: revision + 1, updatedAt: new Date() })
      .where(and(eq(tasks.id, id), eq(tasks.revision, revision)));
    changes = result.count;
  } catch (e) {
    console.error('updateTaskStatus', e);
    return { error: 'Mise à jour impossible. Réessayez.' };
  }

  if (!changes) return { error: 'Cette tâche a changé. Actualisez la page avant de réessayer.' };

  revalidatePath('/taches');
  revalidatePath('/');
  return { success: true, id };
}
