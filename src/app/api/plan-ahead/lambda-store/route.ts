import { NextRequest, NextResponse } from "next/server";
import { LambdaClient, InvokeCommand } from "@aws-sdk/client-lambda";
import { startOfWeek, format, addWeeks } from "date-fns";

const lambdaClient = new LambdaClient({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

// Retry logic with exponential backoff
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000
): Promise<T> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxRetries - 1) throw error;
      
      const delay = baseDelay * Math.pow(2, attempt);
      console.log(`Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw new Error("Max retries exceeded");
}

// Store a single meal with retry logic
async function storeMeal(meal: any, weekId: string) {
  return retryWithBackoff(async () => {
    const payload = {
      meal_name: meal.name,
      meal_type: meal.meal_type,
      day: meal.day,
      description: meal.description,
      ingredients: meal.ingredients,
      instructions: meal.instructions,
      nutrition: meal.nutrition,
      prep_time: meal.prep_time,
      cook_time: meal.cook_time,
      servings: meal.servings,
      image_bytes: meal.image_base64 || meal.image,
      week_id: `next_${weekId}`,
    };

    const command = new InvokeCommand({
      FunctionName: process.env.AWS_LAMBDA_FUNCTION_NAME || "storeMealPlanData",
      Payload: JSON.stringify(payload),
    });

    const response = await lambdaClient.send(command);
    const result = JSON.parse(new TextDecoder().decode(response.Payload));

    if (result.statusCode !== 200) {
      const errorBody = typeof result.body === 'string' ? JSON.parse(result.body) : result.body;
      throw new Error(errorBody?.message || `Lambda returned ${result.statusCode}`);
    }

    const body = typeof result.body === 'string' ? JSON.parse(result.body) : result.body;
    return {
      ...meal,
      image: body.image_url,
      id: body.id,
    };
  });
}

// Process meals sequentially to avoid concurrent Lambda execution limits
async function processMealsSequentially(meals: any[], weekId: string) {
  const storedMeals = [];
  const failedMeals = [];
  
  for (let i = 0; i < meals.length; i++) {
    const meal = meals[i];
    
    console.log(`Processing meal ${i + 1}/${meals.length}: ${meal.name}`);
    
    try {
      const result = await storeMeal(meal, weekId);
      storedMeals.push(result);
      console.log(`✓ Stored: ${meal.name}`);
    } catch (error) {
      console.error(`✗ Failed: ${meal.name} - ${error instanceof Error ? error.message : 'Unknown error'}`);
      failedMeals.push({
        meal: meal.name,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
    
    // Add small delay between meals to avoid throttling
    if (i < meals.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 300));
    }
  }

  return { storedMeals, failedMeals };
}

export async function POST(request: NextRequest) {
  try {
    const { meals } = await request.json();

    if (!meals || !Array.isArray(meals)) {
      return NextResponse.json(
        { status: "error", message: "Invalid meals data" },
        { status: 400 }
      );
    }

    console.log(`Starting to store ${meals.length} meals sequentially...`);

    // Calculate next week identifier
    const currentWeekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
    const nextWeekStart = addWeeks(currentWeekStart, 1);
    const nextWeekId = format(nextWeekStart, "yyyy-MM-dd");

    // Process meals sequentially to avoid concurrent Lambda execution limits
    const { storedMeals, failedMeals } = await processMealsSequentially(meals, nextWeekId);

    console.log(`Completed: ${storedMeals.length} successful, ${failedMeals.length} failed`);

    // Return success if at least some meals were stored
    if (storedMeals.length > 0) {
      return NextResponse.json({
        status: "success",
        meals: storedMeals,
        nextWeekId,
        message: `Successfully stored ${storedMeals.length}/${meals.length} meals`,
        failedCount: failedMeals.length,
        failures: failedMeals,
      });
    } else {
      // All meals failed
      return NextResponse.json(
        {
          status: "error",
          message: "Failed to store any meals",
          failures: failedMeals,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error storing meals via Lambda:", error);
    return NextResponse.json(
      {
        status: "error",
        message: error instanceof Error ? error.message : "Failed to store meals",
      },
      { status: 500 }
    );
  }
}