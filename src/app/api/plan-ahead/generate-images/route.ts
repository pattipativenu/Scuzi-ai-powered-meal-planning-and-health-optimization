import { NextRequest, NextResponse } from "next/server";
import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from "@aws-sdk/client-bedrock-runtime";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { randomUUID } from "crypto";

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

const s3Client = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

const bedrockClient = getBedrockClient();

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

async function generateMealImage(prompt: string, mealName: string): Promise<string> {
  console.log(`[IMAGE] Generating: ${mealName}`);
  
  // Enhance prompt for consistency
  const enhancedPrompt = `${prompt}, white plate, natural daylight, 45-degree angle, shallow depth of field, sharp focus, restaurant quality, appetizing, high resolution, professional food photography`;
  
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
  
  return base64Image;
}

// ============================================
// UPLOAD IMAGE TO S3
// ============================================

async function uploadToS3(base64Image: string, mealName: string): Promise<string> {
  const imageBuffer = Buffer.from(base64Image, "base64");
  const fileName = `meal-plans/${randomUUID()}-${mealName.toLowerCase().replace(/\s+/g, "-")}.png`;
  
  const command = new PutObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    Key: fileName,
    Body: imageBuffer,
    ContentType: "image/png",
  });
  
  await s3Client.send(command);
  
  const imageUrl = `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;
  console.log(`[S3] Uploaded: ${imageUrl}`);
  
  return imageUrl;
}

// ============================================
// BATCH PROCESS IMAGES WITH RATE LIMITING
// ============================================

async function batchGenerateImages(meals: any[]): Promise<any[]> {
  const results: any[] = [];
  const batchSize = 5; // Process 5 images at a time
  const delayBetweenBatches = 3000; // 3 seconds between batches
  
  console.log(`[BATCH] Processing ${meals.length} meals in batches of ${batchSize}`);
  
  for (let i = 0; i < meals.length; i += batchSize) {
    const batch = meals.slice(i, i + batchSize);
    console.log(`[BATCH] Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(meals.length / batchSize)}`);
    
    const batchResults = await Promise.all(
      batch.map(async (meal) => {
        try {
          // Generate image
          const base64Image = await generateMealImage(meal.image_prompt, meal.name);
          
          // Upload to S3
          const imageUrl = await uploadToS3(base64Image, meal.name);
          
          return {
            ...meal,
            image: imageUrl,
          };
        } catch (error) {
          console.error(`[BATCH] Error processing ${meal.name}:`, error);
          // Return meal with fallback image
          return {
            ...meal,
            image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80", // Fallback
          };
        }
      })
    );
    
    results.push(...batchResults);
    
    // Delay between batches to avoid rate limits
    if (i + batchSize < meals.length) {
      console.log(`[BATCH] Waiting ${delayBetweenBatches}ms before next batch...`);
      await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
    }
  }
  
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
    
    // Generate all images
    const mealsWithImages = await batchGenerateImages(meals);
    
    console.log(`[IMAGE BATCH] Successfully generated ${mealsWithImages.length} images`);
    
    return NextResponse.json({
      status: "success",
      meals: mealsWithImages,
      totalImages: mealsWithImages.length,
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