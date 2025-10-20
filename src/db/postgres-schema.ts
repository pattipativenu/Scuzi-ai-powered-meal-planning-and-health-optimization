import { pgTable, serial, varchar, text, integer, jsonb, timestamp, decimal, index } from 'drizzle-orm/pg-core';

// Main meals table
export const meals = pgTable('meals', {
  id: serial('id').primaryKey(),
  mealId: varchar('meal_id', { length: 50 }).notNull().unique(), // B-0001, L-0001, etc.
  mealName: varchar('meal_name', { length: 255 }).notNull(),
  tagline: varchar('tagline', { length: 500 }),
  prepTime: varchar('prep_time', { length: 100 }), // "5 minutes (plus 6+ hours refrigeration)"
  mealType: varchar('meal_type', { length: 50 }).notNull(), // Breakfast, Lunch, Dinner, Snack
  tags: jsonb('tags'), // ["Recovery", "Energy", "Better Performance"]
  servingSize: varchar('serving_size', { length: 100 }), // "1 serving"
  ingredients: jsonb('ingredients').notNull(), // Full ingredients array
  method: jsonb('method').notNull(), // Array of cooking steps
  nutritionSummary: text('nutrition_summary'), // High-level nutrition description
  nutritionDetails: jsonb('nutrition_details').notNull(), // Detailed nutrition facts
  whyThisMeal: text('why_this_meal'), // Explanation of meal benefits
  imageUrl: varchar('image_url', { length: 500 }), // Optional meal image
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  mealIdIdx: index('meal_id_idx').on(table.mealId),
  mealTypeIdx: index('meal_type_idx').on(table.mealType),
  mealNameIdx: index('meal_name_idx').on(table.mealName),
}));

// Ingredients lookup table for better querying and inventory management
export const ingredients = pgTable('ingredients', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull().unique(),
  category: varchar('category', { length: 100 }), // dairy, protein, grain, vegetable, etc.
  commonUnit: varchar('common_unit', { length: 50 }), // cup, tablespoon, gram, etc.
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  nameIdx: index('ingredient_name_idx').on(table.name),
  categoryIdx: index('ingredient_category_idx').on(table.category),
}));

// Junction table for meal-ingredient relationships with quantities
export const mealIngredients = pgTable('meal_ingredients', {
  id: serial('id').primaryKey(),
  mealId: integer('meal_id').notNull().references(() => meals.id, { onDelete: 'cascade' }),
  ingredientId: integer('ingredient_id').notNull().references(() => ingredients.id),
  quantity: varchar('quantity', { length: 100 }).notNull(), // "1/2 cup", "1 tablespoon"
  isOptional: integer('is_optional').default(0), // 0 = required, 1 = optional
  notes: varchar('notes', { length: 255 }), // "for sweetness", "fresh or frozen"
}, (table) => ({
  mealIngredientIdx: index('meal_ingredient_idx').on(table.mealId, table.ingredientId),
}));

// Tags lookup table for better filtering and analytics
export const tags = pgTable('tags', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull().unique(),
  category: varchar('category', { length: 50 }), // performance, dietary, prep-style, etc.
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  nameIdx: index('tag_name_idx').on(table.name),
  categoryIdx: index('tag_category_idx').on(table.category),
}));

// Junction table for meal-tag relationships
export const mealTags = pgTable('meal_tags', {
  id: serial('id').primaryKey(),
  mealId: integer('meal_id').notNull().references(() => meals.id, { onDelete: 'cascade' }),
  tagId: integer('tag_id').notNull().references(() => tags.id),
}, (table) => ({
  mealTagIdx: index('meal_tag_idx').on(table.mealId, table.tagId),
}));

// User preferences (migrated from existing schema)
export const userPreferences = pgTable('user_preferences', {
  id: serial('id').primaryKey(),
  userId: varchar('user_id', { length: 255 }), // Can be null for unauthenticated users
  timestamp: timestamp('timestamp').defaultNow().notNull(),
  userGoal: jsonb('user_goal'), // JSON array
  userAllergies: jsonb('user_allergies'), // JSON array
  preferredCuisines: jsonb('preferred_cuisines'), // JSON array
  prepStyle: varchar('prep_style', { length: 100 }), // Single value
  equipment: jsonb('equipment'), // JSON array
  mealsPerDay: integer('meals_per_day'), // 3, 4, or 5
  dietType: varchar('diet_type', { length: 50 }), // vegetarian, non_veg, etc.
  activityLevel: varchar('activity_level', { length: 50 }), // sedentary, lightly_active, etc.
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Pantry inventory (migrated from existing schema)
export const pantryInventory = pgTable('pantry_inventory', {
  id: serial('id').primaryKey(),
  ingredientName: varchar('ingredient_name', { length: 255 }).notNull(),
  quantity: decimal('quantity', { precision: 10, scale: 2 }).default('0').notNull(),
  category: varchar('category', { length: 50 }).notNull(), // "freezer", "fridge", or "cupboard"
  unit: varchar('unit', { length: 50 }),
  lastUpdated: timestamp('last_updated').defaultNow().notNull(),
  userId: varchar('user_id', { length: 255 }),
});

// Shopping list (migrated from existing schema)
export const shoppingList = pgTable('shopping_list', {
  id: serial('id').primaryKey(),
  ingredientName: varchar('ingredient_name', { length: 255 }).notNull(),
  quantity: decimal('quantity', { precision: 10, scale: 2 }).notNull(),
  category: varchar('category', { length: 50 }).notNull(),
  unit: varchar('unit', { length: 50 }),
  isPurchased: integer('is_purchased').default(0).notNull(), // 0 = false, 1 = true
  createdAt: timestamp('created_at').defaultNow().notNull(),
  userId: varchar('user_id', { length: 255 }),
});

// Meal completions (migrated from existing schema)
export const mealCompletions = pgTable('meal_completions', {
  id: serial('id').primaryKey(),
  mealId: varchar('meal_id', { length: 50 }).notNull(),
  mealName: varchar('meal_name', { length: 255 }).notNull(),
  weekType: varchar('week_type', { length: 20 }).notNull(), // "current" or "next"
  day: varchar('day', { length: 20 }).notNull(),
  mealCategory: varchar('meal_category', { length: 50 }),
  completedAt: timestamp('completed_at').defaultNow().notNull(),
  userId: varchar('user_id', { length: 255 }),
});

// WHOOP health data (migrated from existing schema)
export const whoopHealthData = pgTable('whoop_health_data', {
  id: serial('id').primaryKey(),
  userId: varchar('user_id', { length: 255 }).notNull(),
  date: varchar('date', { length: 20 }).notNull(),
  recoveryScore: integer('recovery_score'),
  strain: decimal('strain', { precision: 5, scale: 2 }),
  sleepHours: decimal('sleep_hours', { precision: 4, scale: 2 }),
  caloriesBurned: integer('calories_burned'),
  avgHr: integer('avg_hr'),
  rhr: integer('rhr'),
  hrv: integer('hrv'),
  spo2: decimal('spo2', { precision: 5, scale: 2 }),
  skinTemp: decimal('skin_temp', { precision: 5, scale: 2 }),
  respiratoryRate: decimal('respiratory_rate', { precision: 4, scale: 2 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// WHOOP tokens (migrated from existing schema)
export const whoopTokens = pgTable('whoop_tokens', {
  id: serial('id').primaryKey(),
  userId: varchar('user_id', { length: 255 }).notNull().unique(),
  accessToken: text('access_token').notNull(),
  refreshToken: text('refresh_token'),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});