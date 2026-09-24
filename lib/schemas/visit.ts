import { z } from 'zod';

export const visitPurposes = ['Découverte', 'Relance', 'Présentation devis', 'Signature', 'Suivi livraison'] as const;
export const visitStatuses = ['Planifiée', 'Confirmée', 'Réalisée', 'Annulée'] as const;

export const visitSchema = z.object({
  id: z.string(),
  userId: z.string().nullable(),
  accountId: z.string().nullable(),
  contactId: z.string().nullable(),
  label: z.string().max(160),
  city: z.string().max(100),
  lat: z.number(),
  lng: z.number(),
  date: z.string(),
  startTime: z.string().max(10),
  durationMin: z.number().int().nonnegative(),
  purpose: z.enum(visitPurposes),
  status: z.enum(visitStatuses),
  distanceKm: z.number().nonnegative(),
  notes: z.string().max(2000),
  revision: z.number().int(),
});

export type Visit = z.infer<typeof visitSchema>;
