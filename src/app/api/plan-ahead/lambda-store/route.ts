import { NextRequest, NextResponse } from "next/server";
import { LambdaClient, InvokeCommand } from "@aws-sdk/client-lambda";
import { startOfWeek, format } from "date-fns";

// Route segment config - extend API timeout for meal storage
export const maxDuration = 120;
export const dynamic = 'force-dynamic';

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
  maxRetries = 2,
  baseDelay = 500
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
      week_id: weekId, // Use current week ID without prefix
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

// Process meals in parallel batches for faster processing
async function processMealsInBatches(meals: any[], weekId: string) {
  const storedMeals = [];
  const failedMeals = [];
  const batchSize = 4;
  
  console.log(`Processing ${meals.length} meals in batches of ${batchSize}...`);
  
  for (let i = 0; i < meals.length; i += batchSize) {
    const batch = meals.slice(i, i + batchSize);
    const batchNumber = Math.floor(i / batchSize) + 1;
    const totalBatches = Math.ceil(meals.length / batchSize);
    
    console.log(`Processing batch ${batchNumber}/${totalBatches} (meals ${i + 1}-${Math.min(i + batchSize, meals.length)})`);
    
    const results = await Promise.allSettled(
      batch.map(meal => storeMeal(meal, weekId))
    );
    
    results.forEach((result, index) => {
      const meal = batch[index];
      if (result.status === 'fulfilled') {
        storedMeals.push(result.value);
        console.log(`✓ Stored: ${meal.name}`);
      } else {
        console.error(`✗ Failed: ${meal.name} - ${result.reason}`);
        failedMeals.push({
          meal: meal.name,
          error: result.reason?.message || "Unknown error",
        });
      }
    });
    
    if (i + batchSize < meals.length) {
      await new Promise(resolve => setTimeout(resolve, 200));
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

    console.log(`Starting to store ${meals.length} meals in parallel batches...`);

    // Calculate current week identifier (matching retrieve API)
    const currentWeekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
    const weekId = format(currentWeekStart, "yyyy-MM-dd");

    // Process meals in parallel batches
    const { storedMeals, failedMeals } = await processMealsInBatches(meals, weekId);

    console.log(`Completed: ${storedMeals.length} successful, ${failedMeals.length} failed`);

    if (storedMeals.length > 0) {
      return NextResponse.json({
        status: "success",
        meals: storedMeals,
        weekId,
        message: `Successfully stored ${storedMeals.length}/${meals.length} meals`,
        failedCount: failedMeals.length,
        failures: failedMeals,
      });
    } else {
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