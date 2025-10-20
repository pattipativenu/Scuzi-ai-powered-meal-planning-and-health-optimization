import { mysqlTable, serial, varchar, text, int, json, timestamp, decimal, index } from 'drizzle-orm/mysql-core';

// Main meals table
export const meals = mysqlTable('meals', {
  id: serial('id').primaryKey(),
  mealId: varchar('meal_id', { length: 50 }).notNull().unique(), // B-0001, L-0001, etc.
  mealName: varchar('meal_name', { length: 255 }).notNull(),
  tagline: varchar('tagline', { length: 500 }),
  prepTime: varchar('prep_time', { length: 100 }), // "5 minutes (plus 6+ hours refrigeration)"
  mealType: varchar('meal_type', { length: 50 }).notNull(), // Breakfast, Lunch, Dinner, Snack
  tags: json('tags'), // ["Recovery", "Energy", "Better Performance"]
  servingSize: varchar('serving_size', { length: 100 }), // "1 serving"
  ingredients: json('ingredients').notNull(), // Full ingredients array
  method: json('method').notNull(), // Array of cooking steps
  nutritionSummary: text('nutrition_summary'), // High-level nutrition description
  nutritionDetails: json('nutrition_details').notNull(), // Detailed nutrition facts
  whyThisMeal: text('why_this_meal'), // Explanation of meal benefits
  imageUrl: varchar('image_url', { length: 500 }), // Optional meal image
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  mealIdIdx: index('meal_id_idx').on(table.mealId),
  mealTypeIdx: index('meal_type_idx').on(table.mealType),
  mealNameIdx: index('meal_name_idx').on(table.mealName),
}));

// Ingredients lookup table for better querying and inventory management
export const ingredients = mysqlTable('ingredients', {
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
export const mealIngredients = mysqlTable('meal_ingredients', {
  id: serial('id').primaryKey(),
  mealId: int('meal_id').notNull(),
  ingredientId: int('ingredient_id').notNull(),
  quantity: varchar('quantity', { length: 100 }).notNull(), // "1/2 cup", "1 tablespoon"
  isOptional: int('is_optional').default(0), // 0 = required, 1 = optional
  notes: varchar('notes', { length: 255 }), // "for sweetness", "fresh or frozen"
}, (table) => ({
  mealIngredientIdx: index('meal_ingredient_idx').on(table.mealId, table.ingredientId),
}));

// Tags lookup table for better filtering and analytics
export const tags = mysqlTable('tags', {
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
export const mealTags = mysqlTable('meal_tags', {
  id: serial('id').primaryKey(),
  mealId: int('meal_id').notNull(),
  tagId: int('tag_id').notNull(),
}, (table) => ({
  mealTagIdx: index('meal_tag_idx').on(table.mealId, table.tagId),
}));

// User preferences (migrated from existing schema)
export const userPreferences = mysqlTable('user_preferences', {
  id: serial('id').primaryKey(),
  userId: varchar('user_id', { length: 255 }), // Can be null for unauthenticated users
  timestamp: timestamp('timestamp').defaultNow().notNull(),
  userGoal: json('user_goal'), // JSON array
  userAllergies: json('user_allergies'), // JSON array
  preferredCuisines: json('preferred_cuisines'), // JSON array
  prepStyle: varchar('prep_style', { length: 100 }), // Single value
  equipment: json('equipment'), // JSON array
  mealsPerDay: int('meals_per_day'), // 3, 4, or 5
  dietType: varchar('diet_type', { length: 50 }), // vegetarian, non_veg, etc.
  activityLevel: varchar('activity_level', { length: 50 }), // sedentary, lightly_active, etc.
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
});

// Pantry inventory (migrated from existing schema)
export const pantryInventory = mysqlTable('pantry_inventory', {
  id: serial('id').primaryKey(),
  ingredientName: varchar('ingredient_name', { length: 255 }).notNull(),
  quantity: decimal('quantity', { precision: 10, scale: 2 }).default('0').notNull(),
  category: varchar('category', { length: 50 }).notNull(), // "freezer", "fridge", or "cupboard"
  unit: varchar('unit', { length: 50 }),
  lastUpdated: timestamp('last_updated').defaultNow().notNull(),
  userId: varchar('user_id', { length: 255 }),
});

// Shopping list (migrated from existing schema)
export const shoppingList = mysqlTable('shopping_list', {
  id: serial('id').primaryKey(),
  ingredientName: varchar('ingredient_name', { length: 255 }).notNull(),
  quantity: decimal('quantity', { precision: 10, scale: 2 }).notNull(),
  category: varchar('category', { length: 50 }).notNull(),
  unit: varchar('unit', { length: 50 }),
  isPurchased: int('is_purchased').default(0).notNull(), // 0 = false, 1 = true
  createdAt: timestamp('created_at').defaultNow().notNull(),
  userId: varchar('user_id', { length: 255 }),
});

// Meal completions (migrated from existing schema)
export const mealCompletions = mysqlTable('meal_completions', {
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
export const whoopHealthData = mysqlTable('whoop_health_data', {
  id: serial('id').primaryKey(),
  userId: varchar('user_id', { length: 255 }).notNull(),
  date: varchar('date', { length: 20 }).notNull(),
  recoveryScore: int('recovery_score'),
  strain: decimal('strain', { precision: 5, scale: 2 }),
  sleepHours: decimal('sleep_hours', { precision: 4, scale: 2 }),
  caloriesBurned: int('calories_burned'),
  avgHr: int('avg_hr'),
  rhr: int('rhr'),
  hrv: int('hrv'),
  spo2: decimal('spo2', { precision: 5, scale: 2 }),
  skinTemp: decimal('skin_temp', { precision: 5, scale: 2 }),
  respiratoryRate: decimal('respiratory_rate', { precision: 4, scale: 2 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
});

// WHOOP tokens (migrated from existing schema)
export const whoopTokens = mysqlTable('whoop_tokens', {
  id: serial('id').primaryKey(),
  userId: varchar('user_id', { length: 255 }).notNull().unique(),
  accessToken: text('access_token').notNull(),
  refreshToken: text('refresh_token'),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
});