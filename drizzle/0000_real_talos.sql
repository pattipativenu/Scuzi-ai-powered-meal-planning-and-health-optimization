CREATE TABLE `whoop_health_data` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`date` text NOT NULL,
	`recovery_score` integer,
	`strain` real,
	`sleep_hours` real,
	`calories_burned` integer,
	`avg_hr` integer,
	`rhr` integer,
	`hrv` integer,
	`spo2` real,
	`skin_temp` real,
	`respiratory_rate` real,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `whoop_tokens` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`access_token` text NOT NULL,
	`refresh_token` text,
	`expires_at` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `whoop_tokens_user_id_unique` ON `whoop_tokens` (`user_id`);