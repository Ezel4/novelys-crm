CREATE TABLE `accounts` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`city` text DEFAULT '' NOT NULL,
	`sector` text DEFAULT '' NOT NULL,
	`family` text DEFAULT '' NOT NULL,
	`initials` text DEFAULT '' NOT NULL,
	`color` text DEFAULT 'blue' NOT NULL,
	`summary` text DEFAULT '' NOT NULL,
	`orders` integer DEFAULT 0 NOT NULL,
	`revenue` real DEFAULT 0 NOT NULL,
	`last_order` text,
	`next` text DEFAULT '' NOT NULL,
	`due` text,
	`revision` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `campaigns` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`type` text DEFAULT 'Autre' NOT NULL,
	`status` text DEFAULT 'Planifiée' NOT NULL,
	`start_date` text,
	`end_date` text,
	`budget` real DEFAULT 0 NOT NULL,
	`account_id` text,
	`revision` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `contacts` (
	`id` text PRIMARY KEY NOT NULL,
	`account_id` text NOT NULL,
	`name` text NOT NULL,
	`role` text DEFAULT '' NOT NULL,
	`email` text DEFAULT '' NOT NULL,
	`status` text DEFAULT 'À revérifier' NOT NULL,
	`verified` text,
	`revision` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `deals` (
	`id` text PRIMARY KEY NOT NULL,
	`account_id` text NOT NULL,
	`contact_id` text,
	`name` text NOT NULL,
	`amount` real DEFAULT 0 NOT NULL,
	`stage` text DEFAULT 'À qualifier' NOT NULL,
	`decision_maker` text DEFAULT '' NOT NULL,
	`deadline` text,
	`logo` integer DEFAULT false NOT NULL,
	`revision` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`contact_id`) REFERENCES `contacts`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `interactions` (
	`id` text PRIMARY KEY NOT NULL,
	`account_id` text,
	`contact_id` text,
	`deal_id` text,
	`lead_id` text,
	`date` text NOT NULL,
	`type` text NOT NULL,
	`contact_name` text DEFAULT '' NOT NULL,
	`result` text NOT NULL,
	`next` text NOT NULL,
	`due` text NOT NULL,
	`revision` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`contact_id`) REFERENCES `contacts`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`deal_id`) REFERENCES `deals`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`lead_id`) REFERENCES `leads`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `leads` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`company` text DEFAULT '' NOT NULL,
	`email` text DEFAULT '' NOT NULL,
	`phone` text DEFAULT '' NOT NULL,
	`status` text DEFAULT 'Nouveau' NOT NULL,
	`source` text DEFAULT '' NOT NULL,
	`campaign_id` text,
	`converted_account_id` text,
	`revision` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`campaign_id`) REFERENCES `campaigns`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`converted_account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE set null
);
