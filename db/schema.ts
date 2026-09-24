import { pgSchema, text, integer, doublePrecision, boolean, timestamp } from 'drizzle-orm/pg-core';

// Own schema so the CRM stays apart from other apps in the database and off Supabase's public API.
export const crm = pgSchema('novelys');

const timestamps = {
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
};

// --- Comptes (ex-Client) ---
export const accounts = crm.table('accounts', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  city: text('city').notNull().default(''),
  sector: text('sector').notNull().default(''),
  family: text('family').notNull().default(''),
  initials: text('initials').notNull().default(''),
  color: text('color').notNull().default('blue'),
  summary: text('summary').notNull().default(''),
  orders: integer('orders').notNull().default(0),
  revenue: doublePrecision('revenue').notNull().default(0),
  lastOrder: text('last_order'),
  next: text('next').notNull().default(''),
  due: text('due'),
  ownerId: text('owner_id'),
  lat: doublePrecision('lat').notNull().default(0),
  lng: doublePrecision('lng').notNull().default(0),
  health: text('health', { enum: ['Bonne', 'À surveiller', 'À risque'] }).notNull().default('Bonne'),
  paymentTerms: text('payment_terms').notNull().default('30 jours'),
  revision: integer('revision').notNull().default(0),
  ...timestamps,
});

// --- Contacts ---
export const contacts = crm.table('contacts', {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull().references(() => accounts.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  role: text('role').notNull().default(''),
  email: text('email').notNull().default(''),
  status: text('status', { enum: ['Vérifié', 'À revérifier', 'Parti'] }).notNull().default('À revérifier'),
  verified: text('verified'),
  phone: text('phone').notNull().default(''),
  preferredChannel: text('preferred_channel', { enum: ['E-mail', 'Téléphone', 'Rendez-vous', 'LinkedIn'] })
    .notNull().default('E-mail'),
  bestTime: text('best_time').notNull().default(''),
  influence: text('influence', { enum: ['Décideur', 'Prescripteur', 'Utilisateur', 'Bloqueur'] })
    .notNull().default('Utilisateur'),
  relationship: text('relationship', { enum: ['Froide', 'Cordiale', 'Solide', 'Ambassadeur'] })
    .notNull().default('Cordiale'),
  personalNote: text('personal_note').notNull().default(''),
  birthday: text('birthday'),
  revision: integer('revision').notNull().default(0),
  ...timestamps,
});

// --- Affaires / Deals ---
export const deals = crm.table('deals', {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull().references(() => accounts.id, { onDelete: 'cascade' }),
  contactId: text('contact_id').references(() => contacts.id, { onDelete: 'set null' }),
  name: text('name').notNull(),
  amount: doublePrecision('amount').notNull().default(0),
  stage: text('stage', { enum: ['À qualifier', 'Devis à préparer', 'Devis envoyé', 'Gagné', 'Perdu'] })
    .notNull().default('À qualifier'),
  decisionMaker: text('decision_maker').notNull().default(''),
  deadline: text('deadline'),
  logo: boolean('logo').notNull().default(false),
  ownerId: text('owner_id'),
  probability: integer('probability').notNull().default(50),
  lossReason: text('loss_reason').notNull().default(''),
  revision: integer('revision').notNull().default(0),
  ...timestamps,
});

// --- Campagnes ---
export const campaigns = crm.table('campaigns', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  type: text('type', { enum: ['Email', 'Salon', 'Publicité', 'Réseaux sociaux', 'Autre'] }).notNull().default('Autre'),
  status: text('status', { enum: ['Planifiée', 'Active', 'Terminée', 'Annulée'] }).notNull().default('Planifiée'),
  startDate: text('start_date'),
  endDate: text('end_date'),
  budget: doublePrecision('budget').notNull().default(0),
  accountId: text('account_id').references(() => accounts.id, { onDelete: 'set null' }),
  revision: integer('revision').notNull().default(0),
  ...timestamps,
});

// --- Leads ---
export const leads = crm.table('leads', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  company: text('company').notNull().default(''),
  email: text('email').notNull().default(''),
  phone: text('phone').notNull().default(''),
  status: text('status', { enum: ['Nouveau', 'Contacté', 'Qualifié', 'Non qualifié', 'Converti'] })
    .notNull().default('Nouveau'),
  source: text('source').notNull().default(''),
  campaignId: text('campaign_id').references(() => campaigns.id, { onDelete: 'set null' }),
  convertedAccountId: text('converted_account_id').references(() => accounts.id, { onDelete: 'set null' }),
  revision: integer('revision').notNull().default(0),
  ...timestamps,
});

// --- Interactions ---
export const interactions = crm.table('interactions', {
  id: text('id').primaryKey(),
  accountId: text('account_id').references(() => accounts.id, { onDelete: 'cascade' }),
  contactId: text('contact_id').references(() => contacts.id, { onDelete: 'set null' }),
  dealId: text('deal_id').references(() => deals.id, { onDelete: 'set null' }),
  leadId: text('lead_id').references(() => leads.id, { onDelete: 'set null' }),
  date: text('date').notNull(),
  type: text('type', { enum: ['Appel', 'E-mail', 'Rendez-vous', 'Note'] }).notNull(),
  contactName: text('contact_name').notNull().default(''),
  result: text('result').notNull(),
  next: text('next').notNull(),
  due: text('due').notNull(),
  revision: integer('revision').notNull().default(0),
  ...timestamps,
});

// --- Tâches ---
export const tasks = crm.table('tasks', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description').notNull().default(''),
  dueDate: text('due_date'),
  status: text('status', { enum: ['À faire', 'Fait', 'Annulée'] }).notNull().default('À faire'),
  priority: text('priority', { enum: ['Basse', 'Normale', 'Haute'] }).notNull().default('Normale'),
  ownerId: text('owner_id'),
  accountId: text('account_id').references(() => accounts.id, { onDelete: 'set null' }),
  dealId: text('deal_id').references(() => deals.id, { onDelete: 'set null' }),
  revision: integer('revision').notNull().default(0),
  ...timestamps,
});

// --- Pièces jointes (liens) ---
export const attachments = crm.table('attachments', {
  id: text('id').primaryKey(),
  accountId: text('account_id').references(() => accounts.id, { onDelete: 'cascade' }),
  dealId: text('deal_id').references(() => deals.id, { onDelete: 'cascade' }),
  filename: text('filename').notNull(),
  url: text('url').notNull(),
  revision: integer('revision').notNull().default(0),
  ...timestamps,
});

// --- Devis ---
export const quotes = crm.table('quotes', {
  id: text('id').primaryKey(),
  number: text('number').notNull(),
  accountId: text('account_id').notNull().references(() => accounts.id, { onDelete: 'cascade' }),
  dealId: text('deal_id').notNull().references(() => deals.id, { onDelete: 'cascade' }),
  contactId: text('contact_id').references(() => contacts.id, { onDelete: 'set null' }),
  status: text('status', { enum: ['Brouillon', 'Envoyé', 'Accepté', 'Refusé', 'Expiré'] })
    .notNull().default('Brouillon'),
  issueDate: text('issue_date').notNull(),
  validUntil: text('valid_until'),
  vatRate: doublePrecision('vat_rate').notNull().default(20),
  notes: text('notes').notNull().default(''),
  revision: integer('revision').notNull().default(0),
  ...timestamps,
});

export const quoteItems = crm.table('quote_items', {
  id: text('id').primaryKey(),
  quoteId: text('quote_id').notNull().references(() => quotes.id, { onDelete: 'cascade' }),
  position: integer('position').notNull().default(0),
  label: text('label').notNull(),
  quantity: doublePrecision('quantity').notNull().default(1),
  unitPrice: doublePrecision('unit_price').notNull().default(0),
  discount: doublePrecision('discount').notNull().default(0),
});

// --- Utilisateurs / Équipe (couche humaine) ---
export const users = crm.table('users', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  role: text('role', { enum: ['Commercial', 'ADV', 'Dirigeant'] }).notNull().default('Commercial'),
  jobTitle: text('job_title').notNull().default(''),
  email: text('email').notNull().default(''),
  phone: text('phone').notNull().default(''),
  initials: text('initials').notNull().default(''),
  color: text('color').notNull().default('blue'),
  baseCity: text('base_city').notNull().default(''),
  territory: text('territory').notNull().default(''),
  bio: text('bio').notNull().default(''),
  strengths: text('strengths').notNull().default(''),
  workingHours: text('working_hours').notNull().default('9h – 18h'),
  availability: text('availability', { enum: ['Disponible', 'En tournée', 'En rendez-vous', 'Congés'] })
    .notNull().default('Disponible'),
  monthlyTarget: doublePrecision('monthly_target').notNull().default(0),
  startedAt: text('started_at'),
  active: boolean('active').notNull().default(true),
  revision: integer('revision').notNull().default(0),
  ...timestamps,
});

// --- Visites / Tournées commerciales ---
export const visits = crm.table('visits', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id, { onDelete: 'set null' }),
  accountId: text('account_id').references(() => accounts.id, { onDelete: 'cascade' }),
  contactId: text('contact_id').references(() => contacts.id, { onDelete: 'set null' }),
  label: text('label').notNull().default(''),
  city: text('city').notNull().default(''),
  lat: doublePrecision('lat').notNull().default(0),
  lng: doublePrecision('lng').notNull().default(0),
  date: text('date').notNull(),
  startTime: text('start_time').notNull().default(''),
  durationMin: integer('duration_min').notNull().default(60),
  purpose: text('purpose', { enum: ['Découverte', 'Relance', 'Présentation devis', 'Signature', 'Suivi livraison'] })
    .notNull().default('Relance'),
  status: text('status', { enum: ['Planifiée', 'Confirmée', 'Réalisée', 'Annulée'] })
    .notNull().default('Planifiée'),
  distanceKm: doublePrecision('distance_km').notNull().default(0),
  notes: text('notes').notNull().default(''),
  revision: integer('revision').notNull().default(0),
  ...timestamps,
});

// --- Paramètres du CRM (clé/valeur typée par section) ---
export const settings = crm.table('settings', {
  key: text('key').primaryKey(),
  section: text('section').notNull().default('general'),
  value: text('value').notNull().default(''),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// --- Valeurs de listes personnalisables (paramètres > listes) ---
export const pickLists = crm.table('pick_lists', {
  id: text('id').primaryKey(),
  list: text('list').notNull(),
  value: text('value').notNull(),
  position: integer('position').notNull().default(0),
  active: boolean('active').notNull().default(true),
});
