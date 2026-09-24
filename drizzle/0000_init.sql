CREATE SCHEMA "novelys";
--> statement-breakpoint
CREATE TABLE "novelys"."accounts" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"city" text DEFAULT '' NOT NULL,
	"sector" text DEFAULT '' NOT NULL,
	"family" text DEFAULT '' NOT NULL,
	"initials" text DEFAULT '' NOT NULL,
	"color" text DEFAULT 'blue' NOT NULL,
	"summary" text DEFAULT '' NOT NULL,
	"orders" integer DEFAULT 0 NOT NULL,
	"revenue" double precision DEFAULT 0 NOT NULL,
	"last_order" text,
	"next" text DEFAULT '' NOT NULL,
	"due" text,
	"owner_id" text,
	"lat" double precision DEFAULT 0 NOT NULL,
	"lng" double precision DEFAULT 0 NOT NULL,
	"health" text DEFAULT 'Bonne' NOT NULL,
	"payment_terms" text DEFAULT '30 jours' NOT NULL,
	"revision" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "novelys"."attachments" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text,
	"deal_id" text,
	"filename" text NOT NULL,
	"url" text NOT NULL,
	"revision" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "novelys"."campaigns" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"type" text DEFAULT 'Autre' NOT NULL,
	"status" text DEFAULT 'Planifiée' NOT NULL,
	"start_date" text,
	"end_date" text,
	"budget" double precision DEFAULT 0 NOT NULL,
	"account_id" text,
	"revision" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "novelys"."contacts" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"name" text NOT NULL,
	"role" text DEFAULT '' NOT NULL,
	"email" text DEFAULT '' NOT NULL,
	"status" text DEFAULT 'À revérifier' NOT NULL,
	"verified" text,
	"phone" text DEFAULT '' NOT NULL,
	"preferred_channel" text DEFAULT 'E-mail' NOT NULL,
	"best_time" text DEFAULT '' NOT NULL,
	"influence" text DEFAULT 'Utilisateur' NOT NULL,
	"relationship" text DEFAULT 'Cordiale' NOT NULL,
	"personal_note" text DEFAULT '' NOT NULL,
	"birthday" text,
	"revision" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "novelys"."deals" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"contact_id" text,
	"name" text NOT NULL,
	"amount" double precision DEFAULT 0 NOT NULL,
	"stage" text DEFAULT 'À qualifier' NOT NULL,
	"decision_maker" text DEFAULT '' NOT NULL,
	"deadline" text,
	"logo" boolean DEFAULT false NOT NULL,
	"owner_id" text,
	"probability" integer DEFAULT 50 NOT NULL,
	"loss_reason" text DEFAULT '' NOT NULL,
	"revision" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "novelys"."interactions" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text,
	"contact_id" text,
	"deal_id" text,
	"lead_id" text,
	"date" text NOT NULL,
	"type" text NOT NULL,
	"contact_name" text DEFAULT '' NOT NULL,
	"result" text NOT NULL,
	"next" text NOT NULL,
	"due" text NOT NULL,
	"revision" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "novelys"."leads" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"company" text DEFAULT '' NOT NULL,
	"email" text DEFAULT '' NOT NULL,
	"phone" text DEFAULT '' NOT NULL,
	"status" text DEFAULT 'Nouveau' NOT NULL,
	"source" text DEFAULT '' NOT NULL,
	"campaign_id" text,
	"converted_account_id" text,
	"revision" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "novelys"."pick_lists" (
	"id" text PRIMARY KEY NOT NULL,
	"list" text NOT NULL,
	"value" text NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "novelys"."quote_items" (
	"id" text PRIMARY KEY NOT NULL,
	"quote_id" text NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"label" text NOT NULL,
	"quantity" double precision DEFAULT 1 NOT NULL,
	"unit_price" double precision DEFAULT 0 NOT NULL,
	"discount" double precision DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "novelys"."quotes" (
	"id" text PRIMARY KEY NOT NULL,
	"number" text NOT NULL,
	"account_id" text NOT NULL,
	"deal_id" text NOT NULL,
	"contact_id" text,
	"status" text DEFAULT 'Brouillon' NOT NULL,
	"issue_date" text NOT NULL,
	"valid_until" text,
	"vat_rate" double precision DEFAULT 20 NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"revision" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "novelys"."settings" (
	"key" text PRIMARY KEY NOT NULL,
	"section" text DEFAULT 'general' NOT NULL,
	"value" text DEFAULT '' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "novelys"."tasks" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"due_date" text,
	"status" text DEFAULT 'À faire' NOT NULL,
	"priority" text DEFAULT 'Normale' NOT NULL,
	"owner_id" text,
	"account_id" text,
	"deal_id" text,
	"revision" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "novelys"."users" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"role" text DEFAULT 'Commercial' NOT NULL,
	"job_title" text DEFAULT '' NOT NULL,
	"email" text DEFAULT '' NOT NULL,
	"phone" text DEFAULT '' NOT NULL,
	"initials" text DEFAULT '' NOT NULL,
	"color" text DEFAULT 'blue' NOT NULL,
	"base_city" text DEFAULT '' NOT NULL,
	"territory" text DEFAULT '' NOT NULL,
	"bio" text DEFAULT '' NOT NULL,
	"strengths" text DEFAULT '' NOT NULL,
	"working_hours" text DEFAULT '9h – 18h' NOT NULL,
	"availability" text DEFAULT 'Disponible' NOT NULL,
	"monthly_target" double precision DEFAULT 0 NOT NULL,
	"started_at" text,
	"active" boolean DEFAULT true NOT NULL,
	"revision" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "novelys"."visits" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text,
	"account_id" text,
	"contact_id" text,
	"label" text DEFAULT '' NOT NULL,
	"city" text DEFAULT '' NOT NULL,
	"lat" double precision DEFAULT 0 NOT NULL,
	"lng" double precision DEFAULT 0 NOT NULL,
	"date" text NOT NULL,
	"start_time" text DEFAULT '' NOT NULL,
	"duration_min" integer DEFAULT 60 NOT NULL,
	"purpose" text DEFAULT 'Relance' NOT NULL,
	"status" text DEFAULT 'Planifiée' NOT NULL,
	"distance_km" double precision DEFAULT 0 NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"revision" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "novelys"."attachments" ADD CONSTRAINT "attachments_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "novelys"."accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "novelys"."attachments" ADD CONSTRAINT "attachments_deal_id_deals_id_fk" FOREIGN KEY ("deal_id") REFERENCES "novelys"."deals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "novelys"."campaigns" ADD CONSTRAINT "campaigns_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "novelys"."accounts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "novelys"."contacts" ADD CONSTRAINT "contacts_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "novelys"."accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "novelys"."deals" ADD CONSTRAINT "deals_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "novelys"."accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "novelys"."deals" ADD CONSTRAINT "deals_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "novelys"."contacts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "novelys"."interactions" ADD CONSTRAINT "interactions_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "novelys"."accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "novelys"."interactions" ADD CONSTRAINT "interactions_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "novelys"."contacts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "novelys"."interactions" ADD CONSTRAINT "interactions_deal_id_deals_id_fk" FOREIGN KEY ("deal_id") REFERENCES "novelys"."deals"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "novelys"."interactions" ADD CONSTRAINT "interactions_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "novelys"."leads"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "novelys"."leads" ADD CONSTRAINT "leads_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "novelys"."campaigns"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "novelys"."leads" ADD CONSTRAINT "leads_converted_account_id_accounts_id_fk" FOREIGN KEY ("converted_account_id") REFERENCES "novelys"."accounts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "novelys"."quote_items" ADD CONSTRAINT "quote_items_quote_id_quotes_id_fk" FOREIGN KEY ("quote_id") REFERENCES "novelys"."quotes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "novelys"."quotes" ADD CONSTRAINT "quotes_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "novelys"."accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "novelys"."quotes" ADD CONSTRAINT "quotes_deal_id_deals_id_fk" FOREIGN KEY ("deal_id") REFERENCES "novelys"."deals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "novelys"."quotes" ADD CONSTRAINT "quotes_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "novelys"."contacts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "novelys"."tasks" ADD CONSTRAINT "tasks_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "novelys"."accounts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "novelys"."tasks" ADD CONSTRAINT "tasks_deal_id_deals_id_fk" FOREIGN KEY ("deal_id") REFERENCES "novelys"."deals"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "novelys"."visits" ADD CONSTRAINT "visits_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "novelys"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "novelys"."visits" ADD CONSTRAINT "visits_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "novelys"."accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "novelys"."visits" ADD CONSTRAINT "visits_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "novelys"."contacts"("id") ON DELETE set null ON UPDATE no action;