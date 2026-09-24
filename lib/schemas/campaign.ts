import { z } from 'zod';

export const campaignTypes = ['Email', 'Salon', 'Publicité', 'Réseaux sociaux', 'Autre'] as const;
export const campaignStatuses = ['Planifiée', 'Active', 'Terminée', 'Annulée'] as const;

export const campaignSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(150),
  type: z.enum(campaignTypes),
  status: z.enum(campaignStatuses),
  startDate: z.string().nullable(),
  endDate: z.string().nullable(),
  budget: z.number().nonnegative(),
  accountId: z.string().nullable(),
  revision: z.number().int(),
});

export type Campaign = z.infer<typeof campaignSchema>;
