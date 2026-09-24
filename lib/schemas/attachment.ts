import { z } from 'zod';

export const attachmentSchema = z.object({
  id: z.string(),
  accountId: z.string().nullable(),
  dealId: z.string().nullable(),
  filename: z.string().min(1).max(200),
  url: z.string().url().max(2000),
  revision: z.number().int(),
});

export type Attachment = z.infer<typeof attachmentSchema>;
