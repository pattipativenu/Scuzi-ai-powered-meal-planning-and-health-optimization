import { NextRequest, NextResponse } from "next/server";
import { DynamoDBClient, ScanCommand } from "@aws-sdk/client-dynamodb";
import { unmarshall } from "@aws-sdk/util-dynamodb";

const dynamoClient = new DynamoDBClient({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const MEALS_TABLE = "meals_library";
const DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const MEAL_TYPES = ["Breakfast", "Lunch", "Snack", "Dinner"];

interface MealFromLibrary {
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
  };
  imageUrl?: string;
  imagePrompt?: string;
}

interface GeneratedMeal {
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
  };
  image: string;
  meal_id: string;
}

/**
 * Intelligent meal selection algorithm:
 * - Prioritizes using maximum variety from dataset
 * - Enforces max 2 repeats per meal across the week
 * - Ensures balanced distribution
 */
function selectMealsWithRepeatLimit(
  meals: MealFromLibrary[],
  mealType: string,
  count: number = 7
): MealFromLibrary[] {
  const typeMeals = meals.filter(
    (m) => m.meal_type.toLowerCase() === mealType.toLowerCase()
  );

  if (typeMeals.length === 0) {
    throw new Error(`No ${mealType} meals found in library`);
  }

  // Shuffle for randomness
  const shuffled = [...typeMeals].sort(() => Math.random() - 0.5);
  
  const selected: MealFromLibrary[] = [];
  const usageCount = new Map<string, number>();

  // First pass: Use each meal once
  for (const meal of shuffled) {
    if (selected.length >= count) break;
    selected.push(meal);
    usageCount.set(meal.meal_id, 1);
  }

  // Second pass: If still need more meals, repeat (max 2 times per meal)
  let attempts = 0;
  while (selected.length < count && attempts < 100) {
    for (const meal of shuffled) {
      if (selected.length >= count) break;
      const currentCount = usageCount.get(meal.meal_id) || 0;
      if (currentCount < 2) {
        selected.push(meal);
        usageCount.set(meal.meal_id, currentCount + 1);
      }
    }
    attempts++;
  }

  // Final pass: If still not enough (very rare), allow more repeats
  while (selected.length < count) {
    const randomMeal = shuffled[Math.floor(Math.random() * shuffled.length)];
    selected.push(randomMeal);
    const currentCount = usageCount.get(randomMeal.meal_id) || 0;
    usageCount.set(randomMeal.meal_id, currentCount + 1);
  }

  return selected.slice(0, count);
}

export async function POST(req: NextRequest) {
  try {
    console.log("Starting meal generation from library...");

    // Step 1: Fetch all meals from DynamoDB
    const scanCommand = new ScanCommand({
      TableName: MEALS_TABLE,
    });

    const scanResult = await dynamoClient.send(scanCommand);
    
    if (!scanResult.Items || scanResult.Items.length === 0) {
      return NextResponse.json(
        {
          status: "error",
          message: "No meals found in library. Please seed the meals_library table first.",
        },
        { status: 404 }
      );
    }

    const allMeals: MealFromLibrary[] = scanResult.Items.map((item) => {
      const meal = unmarshall(item);
      return {
        meal_id: meal.meal_id,
        meal_type: meal.meal_type,
        name: meal.name,
        description: meal.description,
        ingredients: meal.ingredients || [],
        instructions: meal.instructions || [],
        prep_time: meal.prep_time || 0,
        cook_time: meal.cook_time || 0,
        servings: meal.servings || 1,
        nutrition: meal.nutrition || { calories: 0, protein: 0, carbs: 0, fat: 0 },
        imageUrl: meal.imageUrl || "",
        imagePrompt: meal.imagePrompt || "",
      };
    });

    console.log(`Fetched ${allMeals.length} meals from library`);

    // Step 2: Select meals for each type with repeat limit
    const generatedMeals: GeneratedMeal[] = [];

    for (const mealType of MEAL_TYPES) {
      try {
        const selectedMeals = selectMealsWithRepeatLimit(allMeals, mealType, 7);
        
        // Assign to days of week
        selectedMeals.forEach((meal, index) => {
          generatedMeals.push({
            day: DAYS_OF_WEEK[index],
            meal_type: mealType,
            name: meal.name,
            description: meal.description,
            ingredients: meal.ingredients,
            instructions: meal.instructions,
            prep_time: meal.prep_time,
            cook_time: meal.cook_time,
            servings: meal.servings,
            nutrition: meal.nutrition,
            image: meal.imageUrl || "/placeholder-meal.jpg",
            meal_id: meal.meal_id,
          });
        });
      } catch (error) {
        console.error(`Error selecting ${mealType} meals:`, error);
        return NextResponse.json(
          {
            status: "error",
            message: `Failed to select ${mealType} meals: ${error instanceof Error ? error.message : "Unknown error"}`,
          },
          { status: 500 }
        );
      }
    }

    // Step 3: Verify we have 28 meals (7 days × 4 meal types)
    if (generatedMeals.length !== 28) {
      console.warn(`Generated ${generatedMeals.length} meals instead of expected 28`);
    }

    console.log(`Successfully generated ${generatedMeals.length} meals from library`);

    return NextResponse.json({
      status: "success",
      meals: generatedMeals,
      message: `Generated ${generatedMeals.length} meals from library`,
      librarySize: allMeals.length,
    });
  } catch (error) {
    console.error("Error generating meals from library:", error);
    return NextResponse.json(
      {
        status: "error",
        message: error instanceof Error ? error.message : "Failed to generate meals from library",
      },
      { status: 500 }
    );
  }
}