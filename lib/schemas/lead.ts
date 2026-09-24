import { z } from 'zod';

export const leadStatuses = ['Nouveau', 'Contacté', 'Qualifié', 'Non qualifié', 'Converti'] as const;

export const leadSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(100),
  company: z.string().max(100),
  email: z.string().max(160),
  phone: z.string().max(40),
  status: z.enum(leadStatuses),
  source: z.string().max(100),
  campaignId: z.string().nullable(),
  convertedAccountId: z.string().nullable(),
  revision: z.number().int(),
});

export type Lead = z.infer<typeof leadSchema>;
