import { sqliteTable, integer, text, real } from 'drizzle-orm/sqlite-core';

// Add WHOOP health data table
export const whoopHealthData = sqliteTable('whoop_health_data', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: text('user_id').notNull(),
  date: text('date').notNull(),
  recoveryScore: integer('recovery_score'),
  strain: real('strain'),
  sleepHours: real('sleep_hours'),
  caloriesBurned: integer('calories_burned'),
  avgHr: integer('avg_hr'),
  rhr: integer('rhr'),
  hrv: integer('hrv'),
  spo2: real('spo2'),
  skinTemp: real('skin_temp'),
  respiratoryRate: real('respiratory_rate'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// Add WHOOP tokens table
export const whoopTokens = sqliteTable('whoop_tokens', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: text('user_id').notNull().unique(),
  accessToken: text('access_token').notNull(),
  refreshToken: text('refresh_token'),
  expiresAt: text('expires_at').notNull(),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// Add user_preferences table
export const userPreferences = sqliteTable('user_preferences', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: text('user_id'), // Can be null for unauthenticated users
  timestamp: text('timestamp').notNull(),
  userGoal: text('user_goal', { mode: 'json' }), // JSON array
  userAllergies: text('user_allergies', { mode: 'json' }), // JSON array
  preferredCuisines: text('preferred_cuisines', { mode: 'json' }), // JSON array
  prepStyle: text('prep_style'), // Single value
  equipment: text('equipment', { mode: 'json' }), // JSON array
  mealsPerDay: integer('meals_per_day'), // 3, 4, or 5
  dietType: text('diet_type'), // vegetarian, non_veg, etc.
  activityLevel: text('activity_level'), // sedentary, lightly_active, etc.
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});