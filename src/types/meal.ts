export interface Meal {
  id: string;
  name: string;
  description: string;
  image: string;
  category: "breakfast" | "lunch" | "snack" | "dinner";
  prepTime: number; // in minutes
  cookTime: number;
  servings: number;
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