import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, QueryCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { MealWithImage } from "./ai-image-generator";
import { startOfWeek, format } from "date-fns";

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

const docClient = DynamoDBDocumentClient.from(client, {
  marshallOptions: {
    removeUndefinedValues: true,
  },
});

const MEALS_LIBRARY_TABLE = "meals_library";
const MEAL_PLAN_DATA_TABLE = process.env.DYNAMODB_MEALPLAN_TABLE || "MealPlanData";

export interface StoredMeal {
  id: string; // Primary key for DynamoDB
  meal_id: string;
  meal_type: string;
  name: string;
  description: string;
  ingredients: Array<{ name: string; amount: string }>;
  instructions: string[];
  prep_time: number;
  cook_time: number;
  servings: number;
  nutrition: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber?: number;
    sodium?: number;
  };
  imageUrl: string;
  imagePrompt?: string;
  whoop_rationale?: string;
  user_id?: string;
  created_at: string;
  updated_at: string;
}

export interface MealPlan {
  id: string; // Primary key for DynamoDB
  week_id: string;
  meals: Array<{
    day: string;
    meal_type: string;
    name: string;
    description: string;
    ingredients: Array<{ name: string; amount: string }>;
    instructions: string[];
    prep_time: number;
    cook_time: number;
    servings: number;
    nutrition: {
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
      fiber?: number;
      sodium?: number;
    };
    image: string;
    meal_id: string;
  }>;
  whoopSummary: string;
  dietaryPreferences: string;
  generated_at: string;
  user_id?: string;
}

export async function storeMealsInLibrary(meals: MealWithImage[], userId: string): Promise<void> {
  console.log(`[DB-STORE] Storing ${meals.length} meals in meals_library table`);
  
  const timestamp = new Date().toISOString();
  
  // Store meals in batches to avoid overwhelming DynamoDB
  const batchSize = 10;
  for (let i = 0; i < meals.length; i += batchSize) {
    const batch = meals.slice(i, i + batchSize);
    
    const batchPromises = batch.map(async (meal) => {
      const storedMeal: StoredMeal = {
        id: meal.meal_id, // Use id as primary key
        meal_id: meal.meal_id,
        meal_type: meal.meal_type,
        name: meal.name,
        description: meal.description,
        ingredients: meal.ingredients,
        instructions: meal.instructions,
        prep_time: meal.prep_time,
        cook_time: meal.cook_time,
        servings: meal.servings,
        nutrition: meal.nutrition,
        imageUrl: meal.imageUrl,
        imagePrompt: meal.image_prompt || "",
        whoop_rationale: meal.whoop_rationale || "",
        user_id: userId,
        created_at: timestamp,
        updated_at: timestamp,
      };

      const command = new PutCommand({
        TableName: MEALS_LIBRARY_TABLE,
        Item: storedMeal,
      });

      try {
        await docClient.send(command);
        console.log(`[DB-STORE] ✓ Stored meal: ${meal.name}`);
      } catch (error) {
        console.error(`[DB-STORE] ✗ Failed to store meal ${meal.name}:`, error);
        throw error;
      }
    });

    await Promise.all(batchPromises);
    console.log(`[DB-STORE] Completed batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(meals.length / batchSize)}`);
  }
  
  console.log(`[DB-STORE] ✓ Successfully stored all ${meals.length} meals in library`);
}

export async function saveMealPlan(
  meals: MealWithImage[], 
  userId: string, 
  whoopSummary: string,
  whoopInsights: string
): Promise<string> {
  console.log(`[DB-STORE] Saving meal plan for user ${userId}`);
  
  // Calculate current week identifier (this Monday)
  const currentWeekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const currentWeekId = format(currentWeekStart, "yyyy-MM-dd");
  const weekId = `next_${currentWeekId}`;

  // Convert meals to meal plan format
  const mealPlanMeals = meals.map(meal => ({
    day: meal.day,
    meal_type: meal.meal_type,
    name: meal.name,
    description: meal.description,
    ingredients: meal.ingredients,
    instructions: meal.instructions,
    prep_time: meal.prep_time,
    cook_time: meal.cook_time,
    servings: meal.servings,
    nutrition: meal.nutrition,
    image: meal.imageUrl,
    meal_id: meal.meal_id,
  }));

  const mealPlan: MealPlan = {
    id: weekId, // Add id as primary key
    week_id: weekId,
    meals: mealPlanMeals,
    whoopSummary: `${whoopSummary}\n\nWHOOP Insights: ${whoopInsights}`,
    dietaryPreferences: "AI-generated based on WHOOP health data",
    generated_at: new Date().toISOString(),
    user_id: userId,
  };

  const command = new PutCommand({
    TableName: MEAL_PLAN_DATA_TABLE,
    Item: mealPlan,
  });

  try {
    await docClient.send(command);
    console.log(`[DB-STORE] ✓ Saved meal plan with week_id: ${weekId}`);
    return weekId;
  } catch (error) {
    console.error(`[DB-STORE] ✗ Failed to save meal plan:`, error);
    throw error;
  }
}

export async function checkExistingMeals(userId: string, limit: number = 50): Promise<StoredMeal[]> {
  console.log(`[DB-CHECK] Checking existing meals for user ${userId}`);
  
  try {
    const command = new ScanCommand({
      TableName: MEALS_LIBRARY_TABLE,
      FilterExpression: "user_id = :userId",
      ExpressionAttributeValues: {
        ":userId": userId,
      },
      Limit: limit,
    });

    const response = await docClient.send(command);
    const meals = (response.Items || []) as StoredMeal[];
    
    console.log(`[DB-CHECK] Found ${meals.length} existing meals for user`);
    return meals;
  } catch (error) {
    console.error(`[DB-CHECK] Error checking existing meals:`, error);
    return [];
  }
}

export async function getRecentMealPlans(userId: string, limit: number = 5): Promise<MealPlan[]> {
  console.log(`[DB-CHECK] Getting recent meal plans for user ${userId}`);
  
  try {
    const command = new ScanCommand({
      TableName: MEAL_PLAN_DATA_TABLE,
      FilterExpression: "user_id = :userId",
      ExpressionAttributeValues: {
        ":userId": userId,
      },
      Limit: limit,
    });

    const response = await docClient.send(command);
    const plans = (response.Items || []) as MealPlan[];
    
    // Sort by generated_at descending
    plans.sort((a, b) => new Date(b.generated_at).getTime() - new Date(a.generated_at).getTime());
    
    console.log(`[DB-CHECK] Found ${plans.length} recent meal plans for user`);
    return plans;
  } catch (error) {
    console.error(`[DB-CHECK] Error getting recent meal plans:`, error);
    return [];
  }
}

export function shuffleMealsIntelligently(meals: MealWithImage[]): MealWithImage[] {
  console.log(`[SHUFFLE] Applying intelligent meal shuffling`);
  
  // Group meals by type
  const mealsByType = {
    Breakfast: meals.filter(m => m.meal_type === "Breakfast"),
    Lunch: meals.filter(m => m.meal_type === "Lunch"),
    Snack: meals.filter(m => m.meal_type === "Snack"),
    Dinner: meals.filter(m => m.meal_type === "Dinner"),
  };
  
  // Shuffle each type independently
  Object.keys(mealsByType).forEach(type => {
    const typeMeals = mealsByType[type as keyof typeof mealsByType];
    for (let i = typeMeals.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [typeMeals[i], typeMeals[j]] = [typeMeals[j], typeMeals[i]];
    }
  });
  
  // Reassemble meals with shuffled order but maintain day structure
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const shuffledMeals: MealWithImage[] = [];
  
  days.forEach((day, dayIndex) => {
    shuffledMeals.push({
      ...mealsByType.Breakfast[dayIndex],
      day,
    });
    shuffledMeals.push({
      ...mealsByType.Lunch[dayIndex],
      day,
    });
    shuffledMeals.push({
      ...mealsByType.Snack[dayIndex],
      day,
    });
    shuffledMeals.push({
      ...mealsByType.Dinner[dayIndex],
      day,
    });
  });
  
  console.log(`[SHUFFLE] ✓ Applied intelligent shuffling to ${shuffledMeals.length} meals`);
  return shuffledMeals;
}