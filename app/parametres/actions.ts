'use server';

import { and, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { database } from '@/db';
import { settings, pickLists, users } from '@/db/schema';
import { userSchema } from '@/lib/schemas/user';

type ActionResult = { error: string } | { success: true };

const settingsPayload = z.object({
  section: z.string().min(1).max(40),
  values: z.record(z.string().max(120), z.string().max(500)),
});

/** Enregistre en une passe toutes les clés d'une section de paramètres. */
export async function saveSettings(input: unknown): Promise<ActionResult> {
  const parsed = settingsPayload.safeParse(input);
  if (!parsed.success) return { error: 'Vérifiez les valeurs saisies.' };

  const db = database();
  try {
    for (const [key, value] of Object.entries(parsed.data.values)) {
      await db
        .insert(settings)
        .values({ key, section: parsed.data.section, value, updatedAt: new Date() })
        .onConflictDoUpdate({
          target: settings.key,
          set: { value, section: parsed.data.section, updatedAt: new Date() },
        });
    }
  } catch (e) {
    console.error('saveSettings', e);
    return { error: 'Impossible d’enregistrer les paramètres. Réessayez.' };
  }

  revalidatePath('/parametres');
  revalidatePath('/');
  return { success: true };
}

const pickListValue = z.object({
  list: z.string().min(1).max(40),
  value: z.string().min(1).max(120),
});

export async function addPickListValue(input: unknown): Promise<ActionResult> {
  const parsed = pickListValue.safeParse(input);
  if (!parsed.success) return { error: 'Valeur invalide.' };

  const db = database();
  try {
    const existing = await db.select().from(pickLists).where(eq(pickLists.list, parsed.data.list));
    if (existing.some((v) => v.value.toLowerCase() === parsed.data.value.toLowerCase())) {
      return { error: 'Cette valeur existe déjà dans la liste.' };
    }
    await db.insert(pickLists).values({
      id: crypto.randomUUID(),
      list: parsed.data.list,
      value: parsed.data.value,
      position: existing.length,
      active: true,
    });
  } catch (e) {
    console.error('addPickListValue', e);
    return { error: 'Impossible d’ajouter la valeur.' };
  }

  revalidatePath('/parametres');
  return { success: true };
}

export async function togglePickListValue(id: string, active: boolean): Promise<ActionResult> {
  try {
    await database().update(pickLists).set({ active }).where(eq(pickLists.id, id));
  } catch (e) {
    console.error('togglePickListValue', e);
    return { error: 'Impossible de modifier la valeur.' };
  }
  revalidatePath('/parametres');
  return { success: true };
}

export async function deletePickListValue(id: string): Promise<ActionResult> {
  try {
    await database().delete(pickLists).where(eq(pickLists.id, id));
  } catch (e) {
    console.error('deletePickListValue', e);
    return { error: 'Impossible de supprimer la valeur.' };
  }
  revalidatePath('/parametres');
  return { success: true };
}

/** Met à jour une fiche collaborateur, avec verrouillage optimiste. */
export async function updateUser(input: unknown): Promise<ActionResult> {
  const parsed = userSchema.safeParse(input);
  if (!parsed.success) return { error: 'Vérifiez les informations saisies.' };
  const data = parsed.data;

  const db = database();
  let changes = 0;
  try {
    const result = await db
      .update(users)
      .set({
        name: data.name,
        role: data.role,
        jobTitle: data.jobTitle,
        email: data.email,
        phone: data.phone,
        initials: data.initials,
        color: data.color,
        baseCity: data.baseCity,
        territory: data.territory,
        bio: data.bio,
        strengths: data.strengths,
        workingHours: data.workingHours,
        availability: data.availability,
        monthlyTarget: data.monthlyTarget,
        startedAt: data.startedAt,
        active: data.active,
        revision: data.revision + 1,
        updatedAt: new Date(),
      })
      .where(and(eq(users.id, data.id), eq(users.revision, data.revision)));
    changes = result.count;
  } catch (e) {
    console.error('updateUser', e);
    return { error: 'Impossible d’enregistrer la fiche. Réessayez.' };
  }

  if (changes === 0) {
    return { error: 'Cette fiche a été modifiée entre-temps. Rechargez la page.' };
  }

  revalidatePath('/parametres');
  revalidatePath('/commercial');
  revalidatePath('/adv');
  revalidatePath('/dirigeant');
  return { success: true };
}
