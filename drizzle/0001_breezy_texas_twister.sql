CREATE TABLE `user_preferences` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text,
	`timestamp` text NOT NULL,
	`user_goal` text,
	`user_allergies` text,
	`preferred_cuisines` text,
	`prep_style` text,
	`equipment` text,
	`meals_per_day` integer,
	`diet_type` text,
	`activity_level` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
