import { NextRequest, NextResponse } from "next/server";
import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from "@aws-sdk/client-bedrock-runtime";

// ============================================
// AWS CLIENTS WITH BEARER TOKEN
// ============================================

const getBedrockClient = () => {
  const bearerToken = process.env.AWS_BEARER_TOKEN_BEDROCK;
  
  if (!bearerToken) {
    throw new Error("AWS_BEARER_TOKEN_BEDROCK is required");
  }
  
  const client = new BedrockRuntimeClient({
    region: process.env.AWS_REGION || "us-east-1",
  });

  client.middlewareStack.add(
    (next: any) => async (args: any) => {
      args.request.headers.Authorization = `Bearer ${bearerToken}`;
      return next(args);
    },
    {
      step: "build",
      name: "addBearerToken",
    }
  );

  return client;
};

const bedrockClient = getBedrockClient();

// ============================================
// DISHWARE MAPPING BY MEAL TYPE
// ============================================

const getDishware = (mealType: string): string => {
  const dishwareMap: Record<string, string> = {
    "Breakfast": "white ceramic bowl",
    "Lunch": "white ceramic plate",
    "Dinner": "white deep bowl",
    "Snack": "white ceramic plate",
  };
  return dishwareMap[mealType] || "white ceramic plate";
};

// ============================================
// ENHANCED RETRY LOGIC
// ============================================

async function retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 2000
): Promise<T> {
  let lastError: Error | undefined;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      console.error(`[RETRY] Attempt ${attempt} failed:`, error);
      
      if (attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt - 1);
        console.log(`[RETRY] Waiting ${delay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError || new Error("Operation failed after all retries");
}

// ============================================
// GENERATE SINGLE IMAGE WITH TITAN G1 V2
// ============================================

async function generateMealImage(meal: any): Promise<string> {
  console.log(`[IMAGE] Generating: ${meal.name}`);
  
  // Use meal's image_prompt if available, otherwise create one
  const basePrompt = meal.image_prompt || `${meal.name} - ${meal.description}`;
  const dishware = getDishware(meal.meal_type);
  
  // Enhance prompt for professional food photography
  const enhancedPrompt = `Professional food photography: ${basePrompt}, served on ${dishware}, natural daylight, 45-degree angle, shallow depth of field, sharp focus, restaurant quality, appetizing, high resolution`;
  
  const input = {
    taskType: "TEXT_IMAGE",
    textToImageParams: {
      text: enhancedPrompt,
      negativeText: "blurry, low quality, dark, unappetizing, messy, dirty, amateur, cartoon, illustration, text, watermark, logo, people, hands, fingers, utensils being held, poor lighting, oversaturated, artificial, plastic, fake",
    },
    imageGenerationConfig: {
      numberOfImages: 1,
      quality: "premium",
      height: 1024,
      width: 1024,
      cfgScale: 8.0,
      seed: Math.floor(Math.random() * 2147483647),
    },
  };

  const command = new InvokeModelCommand({
    modelId: "amazon.titan-image-generator-v2:0",
    body: JSON.stringify(input),
    contentType: "application/json",
    accept: "application/json",
  });

  const response = await retryOperation(() => bedrockClient.send(command), 3, 2000);
  const responseBody = JSON.parse(new TextDecoder().decode(response.body));
  const base64Image = responseBody.images[0];
  
  console.log(`[IMAGE] ✓ Generated: ${meal.name}`);
  return base64Image;
}

// ============================================
// BATCH PROCESS IMAGES WITH RATE LIMITING
// ============================================

async function batchGenerateImages(meals: any[]): Promise<any[]> {
  const results: any[] = [];
  const batchSize = 5;
  const delayBetweenBatches = 3000;
  
  console.log(`[BATCH] Processing ${meals.length} meals in batches of ${batchSize}`);
  
  for (let i = 0; i < meals.length; i += batchSize) {
    const batch = meals.slice(i, i + batchSize);
    const batchNumber = Math.floor(i / batchSize) + 1;
    const totalBatches = Math.ceil(meals.length / batchSize);
    
    console.log(`[BATCH] Processing batch ${batchNumber}/${totalBatches} (meals ${i + 1}-${Math.min(i + batchSize, meals.length)})`);
    
    const batchResults = await Promise.all(
      batch.map(async (meal) => {
        try {
          const base64Image = await generateMealImage(meal);
          
          return {
            ...meal,
            image_base64: base64Image,
            image: `data:image/png;base64,${base64Image}`,
          };
        } catch (error) {
          console.error(`[BATCH] ✗ Error processing ${meal.name}:`, error);
          return {
            ...meal,
            image_base64: null,
            image: "/placeholder-meal.jpg",
          };
        }
      })
    );
    
    results.push(...batchResults);
    
    if (i + batchSize < meals.length) {
      console.log(`[BATCH] Waiting ${delayBetweenBatches}ms before next batch...`);
      await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
    }
  }
  
  console.log(`[BATCH] ✓ Completed: ${results.length}/${meals.length} meals processed`);
  return results;
}

// ============================================
// MAIN API ROUTE
// ============================================

export async function POST(request: NextRequest) {
  console.log("[IMAGE BATCH] Request received");
  
  try {
    const { meals } = await request.json();
    
    if (!meals || !Array.isArray(meals)) {
      return NextResponse.json(
        { error: "Meals array is required" },
        { status: 400 }
      );
    }
    
    console.log(`[IMAGE BATCH] Processing ${meals.length} meals`);
    
    const mealsWithImages = await batchGenerateImages(meals);
    
    const successCount = mealsWithImages.filter(m => m.image_base64).length;
    const failCount = mealsWithImages.length - successCount;
    
    console.log(`[IMAGE BATCH] Complete: ${successCount} success, ${failCount} failed`);
    
    return NextResponse.json({
      status: "success",
      meals: mealsWithImages,
      totalImages: successCount,
      failedImages: failCount,
    });
    
  } catch (error) {
    console.error("[IMAGE BATCH] Fatal error:", error);
    
    return NextResponse.json(
      {
        status: "error",
        message: "Failed to generate images",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}