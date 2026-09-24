CREATE TABLE `pick_lists` (
	`id` text PRIMARY KEY NOT NULL,
	`list` text NOT NULL,
	`value` text NOT NULL,
	`position` integer DEFAULT 0 NOT NULL,
	`active` integer DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE `settings` (
	`key` text PRIMARY KEY NOT NULL,
	`section` text DEFAULT 'general' NOT NULL,
	`value` text DEFAULT '' NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`role` text DEFAULT 'Commercial' NOT NULL,
	`job_title` text DEFAULT '' NOT NULL,
	`email` text DEFAULT '' NOT NULL,
	`phone` text DEFAULT '' NOT NULL,
	`initials` text DEFAULT '' NOT NULL,
	`color` text DEFAULT 'blue' NOT NULL,
	`base_city` text DEFAULT '' NOT NULL,
	`territory` text DEFAULT '' NOT NULL,
	`bio` text DEFAULT '' NOT NULL,
	`strengths` text DEFAULT '' NOT NULL,
	`working_hours` text DEFAULT '9h – 18h' NOT NULL,
	`availability` text DEFAULT 'Disponible' NOT NULL,
	`monthly_target` real DEFAULT 0 NOT NULL,
	`started_at` text,
	`active` integer DEFAULT true NOT NULL,
	`revision` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `visits` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text,
	`account_id` text,
	`contact_id` text,
	`label` text DEFAULT '' NOT NULL,
	`city` text DEFAULT '' NOT NULL,
	`lat` real DEFAULT 0 NOT NULL,
	`lng` real DEFAULT 0 NOT NULL,
	`date` text NOT NULL,
	`start_time` text DEFAULT '' NOT NULL,
	`duration_min` integer DEFAULT 60 NOT NULL,
	`purpose` text DEFAULT 'Relance' NOT NULL,
	`status` text DEFAULT 'Planifiée' NOT NULL,
	`distance_km` real DEFAULT 0 NOT NULL,
	`notes` text DEFAULT '' NOT NULL,
	`revision` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`contact_id`) REFERENCES `contacts`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
ALTER TABLE `accounts` ADD `owner_id` text;--> statement-breakpoint
ALTER TABLE `accounts` ADD `lat` real DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `accounts` ADD `lng` real DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `accounts` ADD `health` text DEFAULT 'Bonne' NOT NULL;--> statement-breakpoint
ALTER TABLE `accounts` ADD `payment_terms` text DEFAULT '30 jours' NOT NULL;--> statement-breakpoint
ALTER TABLE `contacts` ADD `phone` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `contacts` ADD `preferred_channel` text DEFAULT 'E-mail' NOT NULL;--> statement-breakpoint
ALTER TABLE `contacts` ADD `best_time` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `contacts` ADD `influence` text DEFAULT 'Utilisateur' NOT NULL;--> statement-breakpoint
ALTER TABLE `contacts` ADD `relationship` text DEFAULT 'Cordiale' NOT NULL;--> statement-breakpoint
ALTER TABLE `contacts` ADD `personal_note` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `contacts` ADD `birthday` text;--> statement-breakpoint
ALTER TABLE `deals` ADD `owner_id` text;--> statement-breakpoint
ALTER TABLE `deals` ADD `probability` integer DEFAULT 50 NOT NULL;--> statement-breakpoint
ALTER TABLE `deals` ADD `loss_reason` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `tasks` ADD `priority` text DEFAULT 'Normale' NOT NULL;--> statement-breakpoint
ALTER TABLE `tasks` ADD `owner_id` text;