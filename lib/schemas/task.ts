import { z } from 'zod';

export const taskStatuses = ['À faire', 'Fait', 'Annulée'] as const;
export const taskPriorities = ['Basse', 'Normale', 'Haute'] as const;

export const taskSchema = z.object({
  id: z.string(),
  title: z.string().min(1).max(150),
  description: z.string().max(1000),
  dueDate: z.string().nullable(),
  status: z.enum(taskStatuses),
  priority: z.enum(taskPriorities),
  ownerId: z.string().nullable(),
  accountId: z.string().nullable(),
  dealId: z.string().nullable(),
  revision: z.number().int(),
});

export type Task = z.infer<typeof taskSchema>;
