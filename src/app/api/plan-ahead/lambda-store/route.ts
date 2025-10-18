import { NextRequest, NextResponse } from "next/server";
import { LambdaClient, InvokeCommand } from "@aws-sdk/client-lambda";

// ============================================
// AWS LAMBDA CLIENT CONFIGURATION
// ============================================

const lambdaClient = new LambdaClient({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

const LAMBDA_FUNCTION_NAME = "storeMealPlanData";
const LAMBDA_ARN = "arn:aws:lambda:us-east-1:639261426100:function:storeMealPlanData";

// ============================================
// INVOKE LAMBDA WITH RETRY LOGIC
// ============================================

async function invokeLambda(payload: any, maxRetries: number = 3): Promise<any> {
  let lastError: Error | undefined;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[LAMBDA] Invoking storeMealPlanData (Attempt ${attempt}/${maxRetries})`);
      
      const command = new InvokeCommand({
        FunctionName: LAMBDA_FUNCTION_NAME,
        Payload: JSON.stringify(payload),
        InvocationType: "RequestResponse",
      });
      
      const response = await lambdaClient.send(command);
      
      // Check for function errors
      if (response.FunctionError) {
        throw new Error(`Lambda function error: ${response.FunctionError}`);
      }
      
      // Parse response
      const responsePayload = JSON.parse(
        new TextDecoder().decode(response.Payload)
      );
      
      console.log(`[LAMBDA] Success:`, responsePayload);
      
      return responsePayload;
      
    } catch (error) {
      lastError = error as Error;
      console.error(`[LAMBDA] Attempt ${attempt} failed:`, error);
      
      if (attempt < maxRetries) {
        const delay = 2000 * Math.pow(2, attempt - 1);
        console.log(`[LAMBDA] Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError || new Error("Lambda invocation failed after all retries");
}

// ============================================
// BATCH STORE MEALS VIA LAMBDA
// ============================================

async function batchStoreMeals(meals: any[]): Promise<any[]> {
  const results: any[] = [];
  const batchSize = 5; // Process 5 meals at a time to avoid Lambda timeouts
  
  console.log(`[LAMBDA BATCH] Storing ${meals.length} meals in batches of ${batchSize}`);
  
  for (let i = 0; i < meals.length; i += batchSize) {
    const batch = meals.slice(i, i + batchSize);
    console.log(`[LAMBDA BATCH] Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(meals.length / batchSize)}`);
    
    const batchResults = await Promise.all(
      batch.map(async (meal) => {
        try {
          // Invoke Lambda for this meal
          const lambdaPayload = {
            meal_name: meal.name,
            meal_type: meal.meal_type,
            ingredients: meal.ingredients,
            instructions: meal.instructions,
            nutrition: meal.nutrition,
            image_bytes: meal.image_base64, // Base64 image from Titan
            day: meal.day,
            prep_time: meal.prep_time,
            cook_time: meal.cook_time,
            servings: meal.servings,
            description: meal.description,
          };
          
          const lambdaResponse = await invokeLambda(lambdaPayload);
          
          // Lambda should return: { message, id, image_url }
          return {
            ...meal,
            id: lambdaResponse.id,
            image: lambdaResponse.image_url,
            stored: true,
          };
          
        } catch (error) {
          console.error(`[LAMBDA BATCH] Error storing ${meal.name}:`, error);
          return {
            ...meal,
            stored: false,
            error: error instanceof Error ? error.message : "Unknown error",
          };
        }
      })
    );
    
    results.push(...batchResults);
    
    // Small delay between batches
    if (i + batchSize < meals.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  return results;
}

// ============================================
// API ROUTE: STORE MEALS VIA LAMBDA
// ============================================

export async function POST(request: NextRequest) {
  console.log("[LAMBDA STORE] Request received");
  
  try {
    const { meals } = await request.json();
    
    if (!meals || !Array.isArray(meals)) {
      return NextResponse.json(
        { error: "Meals array is required" },
        { status: 400 }
      );
    }
    
    console.log(`[LAMBDA STORE] Storing ${meals.length} meals via Lambda`);
    
    // Store all meals via Lambda
    const storedMeals = await batchStoreMeals(meals);
    
    // Count successes
    const successCount = storedMeals.filter(m => m.stored).length;
    const failureCount = storedMeals.length - successCount;
    
    console.log(`[LAMBDA STORE] Complete: ${successCount} succeeded, ${failureCount} failed`);
    
    return NextResponse.json({
      status: "success",
      meals: storedMeals,
      summary: {
        total: meals.length,
        succeeded: successCount,
        failed: failureCount,
      },
    });
    
  } catch (error) {
    console.error("[LAMBDA STORE] Fatal error:", error);
    
    return NextResponse.json(
      {
        status: "error",
        message: "Failed to store meals via Lambda",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}