import { z } from 'zod';

export const healthLevels = ['Bonne', 'À surveiller', 'À risque'] as const;

export const accountSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(100),
  city: z.string().max(100),
  sector: z.string().max(100),
  family: z.string().max(100),
  initials: z.string().max(4),
  color: z.string().max(30),
  summary: z.string().max(3000),
  orders: z.number().int().nonnegative(),
  revenue: z.number().nonnegative(),
  lastOrder: z.string().nullable(),
  next: z.string().max(300),
  due: z.string().nullable(),
  ownerId: z.string().nullable(),
  lat: z.number(),
  lng: z.number(),
  health: z.enum(healthLevels),
  paymentTerms: z.string().max(60),
  revision: z.number().int(),
});

export type Account = z.infer<typeof accountSchema>;
