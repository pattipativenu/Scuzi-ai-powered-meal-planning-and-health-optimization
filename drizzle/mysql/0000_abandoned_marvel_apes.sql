CREATE TABLE `ingredients` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`category` varchar(100),
	`common_unit` varchar(50),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ingredients_id` PRIMARY KEY(`id`),
	CONSTRAINT `ingredients_name_unique` UNIQUE(`name`)
);
--> statement-breakpoint
CREATE TABLE `meal_completions` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`meal_id` varchar(50) NOT NULL,
	`meal_name` varchar(255) NOT NULL,
	`week_type` varchar(20) NOT NULL,
	`day` varchar(20) NOT NULL,
	`meal_category` varchar(50),
	`completed_at` timestamp NOT NULL DEFAULT (now()),
	`user_id` varchar(255),
	CONSTRAINT `meal_completions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `meal_ingredients` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`meal_id` int NOT NULL,
	`ingredient_id` int NOT NULL,
	`quantity` varchar(100) NOT NULL,
	`is_optional` int DEFAULT 0,
	`notes` varchar(255),
	CONSTRAINT `meal_ingredients_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `meal_tags` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`meal_id` int NOT NULL,
	`tag_id` int NOT NULL,
	CONSTRAINT `meal_tags_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `meals` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`meal_id` varchar(50) NOT NULL,
	`meal_name` varchar(255) NOT NULL,
	`tagline` varchar(500),
	`prep_time` varchar(100),
	`meal_type` varchar(50) NOT NULL,
	`tags` json,
	`serving_size` varchar(100),
	`ingredients` json NOT NULL,
	`method` json NOT NULL,
	`nutrition_summary` text,
	`nutrition_details` json NOT NULL,
	`why_this_meal` text,
	`image_url` varchar(500),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `meals_id` PRIMARY KEY(`id`),
	CONSTRAINT `meals_meal_id_unique` UNIQUE(`meal_id`)
);
--> statement-breakpoint
CREATE TABLE `pantry_inventory` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`ingredient_name` varchar(255) NOT NULL,
	`quantity` decimal(10,2) NOT NULL DEFAULT '0',
	`category` varchar(50) NOT NULL,
	`unit` varchar(50),
	`last_updated` timestamp NOT NULL DEFAULT (now()),
	`user_id` varchar(255),
	CONSTRAINT `pantry_inventory_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `shopping_list` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`ingredient_name` varchar(255) NOT NULL,
	`quantity` decimal(10,2) NOT NULL,
	`category` varchar(50) NOT NULL,
	`unit` varchar(50),
	`is_purchased` int NOT NULL DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`user_id` varchar(255),
	CONSTRAINT `shopping_list_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tags` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`category` varchar(50),
	`description` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `tags_id` PRIMARY KEY(`id`),
	CONSTRAINT `tags_name_unique` UNIQUE(`name`)
);
--> statement-breakpoint
CREATE TABLE `user_preferences` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`user_id` varchar(255),
	`timestamp` timestamp NOT NULL DEFAULT (now()),
	`user_goal` json,
	`user_allergies` json,
	`preferred_cuisines` json,
	`prep_style` varchar(100),
	`equipment` json,
	`meals_per_day` int,
	`diet_type` varchar(50),
	`activity_level` varchar(50),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_preferences_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `whoop_health_data` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`user_id` varchar(255) NOT NULL,
	`date` varchar(20) NOT NULL,
	`recovery_score` int,
	`strain` decimal(5,2),
	`sleep_hours` decimal(4,2),
	`calories_burned` int,
	`avg_hr` int,
	`rhr` int,
	`hrv` int,
	`spo2` decimal(5,2),
	`skin_temp` decimal(5,2),
	`respiratory_rate` decimal(4,2),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `whoop_health_data_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `whoop_tokens` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`user_id` varchar(255) NOT NULL,
	`access_token` text NOT NULL,
	`refresh_token` text,
	`expires_at` timestamp NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `whoop_tokens_id` PRIMARY KEY(`id`),
	CONSTRAINT `whoop_tokens_user_id_unique` UNIQUE(`user_id`)
);
--> statement-breakpoint
CREATE INDEX `ingredient_name_idx` ON `ingredients` (`name`);--> statement-breakpoint
CREATE INDEX `ingredient_category_idx` ON `ingredients` (`category`);--> statement-breakpoint
CREATE INDEX `meal_ingredient_idx` ON `meal_ingredients` (`meal_id`,`ingredient_id`);--> statement-breakpoint
CREATE INDEX `meal_tag_idx` ON `meal_tags` (`meal_id`,`tag_id`);--> statement-breakpoint
CREATE INDEX `meal_id_idx` ON `meals` (`meal_id`);--> statement-breakpoint
CREATE INDEX `meal_type_idx` ON `meals` (`meal_type`);--> statement-breakpoint
CREATE INDEX `meal_name_idx` ON `meals` (`meal_name`);--> statement-breakpoint
CREATE INDEX `tag_name_idx` ON `tags` (`name`);--> statement-breakpoint
CREATE INDEX `tag_category_idx` ON `tags` (`category`);