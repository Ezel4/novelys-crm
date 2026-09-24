import { z } from 'zod';

export const interactionSchema = z.object({
  id: z.string(),
  accountId: z.string().nullable(),
  contactId: z.string().nullable(),
  dealId: z.string().nullable(),
  leadId: z.string().nullable(),
  date: z.string(),
  type: z.enum(['Appel', 'E-mail', 'Rendez-vous', 'Note']),
  contactName: z.string().max(100),
  result: z.string().min(1).max(3000),
  next: z.string().min(1).max(300),
  due: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  revision: z.number().int(),
});

export type Interaction = z.infer<typeof interactionSchema>;
