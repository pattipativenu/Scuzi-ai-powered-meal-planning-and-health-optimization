export interface Recipe {
  recipe_id: string;
  meal_name: string;
  servings: number;
  meal_type: "Breakfast" | "Lunch" | "Snack" | "Dinner";
  ingredients: Ingredient[];
  instructions: string[];
  nutrition_table: NutritionTable;
  prep_time_minutes: number;
  cook_time_minutes: number;
  image_s3_url: string;
  created_at: string;
  generated_by: string;
}

export interface Ingredient {
  name: string;
  quantity: string;
  unit: string;
}

export interface NutritionTable {
  calories: string;
  protein: string;
  carbohydrates: string;
  fat: string;
  fiber: string;
  sugar: string;
}

export interface RecipeGenerationRequest {
  query: string;
  userId?: string;
}

export interface RecipeGenerationResponse {
  recipe: Recipe;
  message: string;
}