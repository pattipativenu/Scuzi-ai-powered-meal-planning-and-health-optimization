CREATE TABLE "ingredients" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"category" varchar(100),
	"common_unit" varchar(50),
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "ingredients_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "meal_completions" (
	"id" serial PRIMARY KEY NOT NULL,
	"meal_id" varchar(50) NOT NULL,
	"meal_name" varchar(255) NOT NULL,
	"week_type" varchar(20) NOT NULL,
	"day" varchar(20) NOT NULL,
	"meal_category" varchar(50),
	"completed_at" timestamp DEFAULT now() NOT NULL,
	"user_id" varchar(255)
);
--> statement-breakpoint
CREATE TABLE "meal_ingredients" (
	"id" serial PRIMARY KEY NOT NULL,
	"meal_id" integer NOT NULL,
	"ingredient_id" integer NOT NULL,
	"quantity" varchar(100) NOT NULL,
	"is_optional" integer DEFAULT 0,
	"notes" varchar(255)
);
--> statement-breakpoint
CREATE TABLE "meal_tags" (
	"id" serial PRIMARY KEY NOT NULL,
	"meal_id" integer NOT NULL,
	"tag_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "meals" (
	"id" serial PRIMARY KEY NOT NULL,
	"meal_id" varchar(50) NOT NULL,
	"meal_name" varchar(255) NOT NULL,
	"tagline" varchar(500),
	"prep_time" varchar(100),
	"meal_type" varchar(50) NOT NULL,
	"tags" jsonb,
	"serving_size" varchar(100),
	"ingredients" jsonb NOT NULL,
	"method" jsonb NOT NULL,
	"nutrition_summary" text,
	"nutrition_details" jsonb NOT NULL,
	"why_this_meal" text,
	"image_url" varchar(500),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "meals_meal_id_unique" UNIQUE("meal_id")
);
--> statement-breakpoint
CREATE TABLE "pantry_inventory" (
	"id" serial PRIMARY KEY NOT NULL,
	"ingredient_name" varchar(255) NOT NULL,
	"quantity" numeric(10, 2) DEFAULT '0' NOT NULL,
	"category" varchar(50) NOT NULL,
	"unit" varchar(50),
	"last_updated" timestamp DEFAULT now() NOT NULL,
	"user_id" varchar(255)
);
--> statement-breakpoint
CREATE TABLE "shopping_list" (
	"id" serial PRIMARY KEY NOT NULL,
	"ingredient_name" varchar(255) NOT NULL,
	"quantity" numeric(10, 2) NOT NULL,
	"category" varchar(50) NOT NULL,
	"unit" varchar(50),
	"is_purchased" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"user_id" varchar(255)
);
--> statement-breakpoint
CREATE TABLE "tags" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"category" varchar(50),
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "tags_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "user_preferences" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar(255),
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"user_goal" jsonb,
	"user_allergies" jsonb,
	"preferred_cuisines" jsonb,
	"prep_style" varchar(100),
	"equipment" jsonb,
	"meals_per_day" integer,
	"diet_type" varchar(50),
	"activity_level" varchar(50),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "whoop_health_data" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"date" varchar(20) NOT NULL,
	"recovery_score" integer,
	"strain" numeric(5, 2),
	"sleep_hours" numeric(4, 2),
	"calories_burned" integer,
	"avg_hr" integer,
	"rhr" integer,
	"hrv" integer,
	"spo2" numeric(5, 2),
	"skin_temp" numeric(5, 2),
	"respiratory_rate" numeric(4, 2),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "whoop_tokens" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"access_token" text NOT NULL,
	"refresh_token" text,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "whoop_tokens_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
ALTER TABLE "meal_ingredients" ADD CONSTRAINT "meal_ingredients_meal_id_meals_id_fk" FOREIGN KEY ("meal_id") REFERENCES "public"."meals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meal_ingredients" ADD CONSTRAINT "meal_ingredients_ingredient_id_ingredients_id_fk" FOREIGN KEY ("ingredient_id") REFERENCES "public"."ingredients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meal_tags" ADD CONSTRAINT "meal_tags_meal_id_meals_id_fk" FOREIGN KEY ("meal_id") REFERENCES "public"."meals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meal_tags" ADD CONSTRAINT "meal_tags_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ingredient_name_idx" ON "ingredients" USING btree ("name");--> statement-breakpoint
CREATE INDEX "ingredient_category_idx" ON "ingredients" USING btree ("category");--> statement-breakpoint
CREATE INDEX "meal_ingredient_idx" ON "meal_ingredients" USING btree ("meal_id","ingredient_id");--> statement-breakpoint
CREATE INDEX "meal_tag_idx" ON "meal_tags" USING btree ("meal_id","tag_id");--> statement-breakpoint
CREATE INDEX "meal_id_idx" ON "meals" USING btree ("meal_id");--> statement-breakpoint
CREATE INDEX "meal_type_idx" ON "meals" USING btree ("meal_type");--> statement-breakpoint
CREATE INDEX "meal_name_idx" ON "meals" USING btree ("meal_name");--> statement-breakpoint
CREATE INDEX "tag_name_idx" ON "tags" USING btree ("name");--> statement-breakpoint
CREATE INDEX "tag_category_idx" ON "tags" USING btree ("category");