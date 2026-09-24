import { z } from 'zod';

export const preferredChannels = ['E-mail', 'Téléphone', 'Rendez-vous', 'LinkedIn'] as const;
export const influences = ['Décideur', 'Prescripteur', 'Utilisateur', 'Bloqueur'] as const;
export const relationships = ['Froide', 'Cordiale', 'Solide', 'Ambassadeur'] as const;

export const contactSchema = z.object({
  id: z.string(),
  accountId: z.string(),
  name: z.string().min(1).max(100),
  role: z.string().max(100),
  email: z.string().max(160),
  status: z.enum(['Vérifié', 'À revérifier', 'Parti']),
  verified: z.string().nullable(),
  phone: z.string().max(40),
  preferredChannel: z.enum(preferredChannels),
  bestTime: z.string().max(80),
  influence: z.enum(influences),
  relationship: z.enum(relationships),
  personalNote: z.string().max(1000),
  birthday: z.string().nullable(),
  revision: z.number().int(),
});

export type Contact = z.infer<typeof contactSchema>;
