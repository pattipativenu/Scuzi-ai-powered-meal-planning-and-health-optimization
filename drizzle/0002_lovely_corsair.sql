CREATE TABLE `meal_completions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`meal_id` text NOT NULL,
	`meal_name` text NOT NULL,
	`week_type` text NOT NULL,
	`day` text NOT NULL,
	`meal_category` text,
	`completed_at` text NOT NULL,
	`user_id` integer
);
--> statement-breakpoint
CREATE TABLE `pantry_inventory` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`ingredient_name` text NOT NULL,
	`quantity` integer DEFAULT 0 NOT NULL,
	`category` text NOT NULL,
	`unit` text,
	`last_updated` text NOT NULL,
	`user_id` integer
);
--> statement-breakpoint
CREATE TABLE `shopping_list` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`ingredient_name` text NOT NULL,
	`quantity` integer NOT NULL,
	`category` text NOT NULL,
	`unit` text,
	`is_purchased` integer DEFAULT false NOT NULL,
	`created_at` text NOT NULL,
	`user_id` integer
);
