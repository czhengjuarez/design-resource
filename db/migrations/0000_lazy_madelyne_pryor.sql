CREATE TABLE `categories` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`icon` text,
	`description` text,
	`parent_id` integer,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	`updated_at` text DEFAULT (current_timestamp) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `categories_slug_unique` ON `categories` (`slug`);--> statement-breakpoint
CREATE INDEX `categories_parent_idx` ON `categories` (`parent_id`);--> statement-breakpoint
CREATE TABLE `resources` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`url` text,
	`category_id` integer,
	`type` text DEFAULT 'article' NOT NULL,
	`author` text,
	`tags` text DEFAULT '[]',
	`image_url` text,
	`source` text DEFAULT 'manual' NOT NULL,
	`status` text DEFAULT 'published' NOT NULL,
	`submitter_name` text,
	`submitter_email` text,
	`coda_row_id` text,
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	`updated_at` text DEFAULT (current_timestamp) NOT NULL,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `resources_coda_row_id_unique` ON `resources` (`coda_row_id`);--> statement-breakpoint
CREATE INDEX `resources_category_idx` ON `resources` (`category_id`);--> statement-breakpoint
CREATE INDEX `resources_status_idx` ON `resources` (`status`);--> statement-breakpoint
CREATE INDEX `resources_type_idx` ON `resources` (`type`);