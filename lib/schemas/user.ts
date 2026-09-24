import { z } from 'zod';

export const userRoles = ['Commercial', 'ADV', 'Dirigeant'] as const;
export type UserRole = (typeof userRoles)[number];

export const availabilities = ['Disponible', 'En tournée', 'En rendez-vous', 'Congés'] as const;

export const userSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(120),
  role: z.enum(userRoles),
  jobTitle: z.string().max(120),
  email: z.string().max(160),
  phone: z.string().max(40),
  initials: z.string().max(4),
  color: z.string().max(30),
  baseCity: z.string().max(100),
  territory: z.string().max(160),
  bio: z.string().max(2000),
  strengths: z.string().max(500),
  workingHours: z.string().max(60),
  availability: z.enum(availabilities),
  monthlyTarget: z.number().nonnegative(),
  startedAt: z.string().nullable(),
  active: z.boolean(),
  revision: z.number().int(),
});

export type User = z.infer<typeof userSchema>;

export const roleLabels: Record<UserRole, string> = {
  Commercial: 'Commercial terrain',
  ADV: 'Administration des ventes',
  Dirigeant: 'Direction',
};

export const roleDescriptions: Record<UserRole, string> = {
  Commercial: 'Tournées, portefeuille clients, affaires en cours et relances du jour.',
  ADV: 'Devis, commandes, facturation, litiges et fiabilité des données clients.',
  Dirigeant: 'Pilotage du chiffre, performance de l’équipe et santé du portefeuille.',
};
