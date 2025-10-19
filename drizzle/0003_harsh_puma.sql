CREATE TABLE `meals_library` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`meal_type` text NOT NULL,
	`prep_time` integer NOT NULL,
	`cook_time` integer NOT NULL,
	`servings` integer NOT NULL,
	`ingredients` text NOT NULL,
	`instructions` text NOT NULL,
	`nutrition` text NOT NULL,
	`tags` text,
	`created_at` text NOT NULL
);
