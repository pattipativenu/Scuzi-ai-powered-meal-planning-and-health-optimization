export interface Meal {
  id: string;
  meal_id?: string; // RDS meal ID like B-0001, LD-0003, etc.
  name: string;
  description: string;
  whyThisMeal?: string; // Why this meal explanation from RDS
  image: string;
  category: "breakfast" | "lunch" | "snack" | "dinner";
  prepTime: number; // in minutes
  cookTime: number;
  servings: number;
  tags?: string[]; // Meal tags like ["Better Sleep", "Omega-3", "Low-Carb"]
  ingredients: {
    name: string;
    amount: string;
    category: "freezer" | "fridge" | "cupboard";
  }[];
  instructions: string[];
  nutrition: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber?: number;
    sodium?: number;
    saturated_fat?: number;
    sugars?: number;
  };
}

export interface WeeklyMeals {
  [day: string]: {
    breakfast?: Meal;
    lunch?: Meal;
    snack?: Meal;
    dinner?: Meal;
  };
}