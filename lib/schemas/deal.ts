import { z } from 'zod';

export const stages = ['À qualifier', 'Devis à préparer', 'Devis envoyé', 'Gagné', 'Perdu'] as const;

export const dealSchema = z.object({
  id: z.string(),
  accountId: z.string(),
  contactId: z.string().nullable(),
  name: z.string().min(1).max(150),
  amount: z.number().nonnegative(),
  stage: z.enum(stages),
  decisionMaker: z.string().max(100),
  deadline: z.string().nullable(),
  logo: z.boolean(),
  ownerId: z.string().nullable(),
  probability: z.number().int().min(0).max(100),
  lossReason: z.string().max(300),
  revision: z.number().int(),
});

export type Deal = z.infer<typeof dealSchema>;
