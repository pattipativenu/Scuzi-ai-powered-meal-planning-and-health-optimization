import { NextRequest, NextResponse } from "next/server";
import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from "@aws-sdk/client-bedrock-runtime";
import { UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { dynamoDb, HISTORY_TABLE_NAME } from "@/lib/dynamodb-config";

// ============================================
// AWS BEDROCK CLIENT WITH STANDARD CREDENTIALS
// ============================================

const client = new BedrockRuntimeClient({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

// ============================================
// ENHANCED RETRY LOGIC WITH EXPONENTIAL BACKOFF
// ============================================

async function retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = 5,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error | undefined;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[IMAGE RETRY] Attempt ${attempt}/${maxRetries}`);
      return await operation();
    } catch (error) {
      lastError = error as Error;
      console.error(`[IMAGE RETRY] Attempt ${attempt} failed:`, error);
      
      if (attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt - 1);
        console.log(`[IMAGE RETRY] Waiting ${delay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError || new Error("Image generation failed after all retries");
}

// ============================================
// MAIN IMAGE GENERATION API
// ============================================

export async function POST(request: NextRequest) {
  console.log("[IMAGE API] Request received");
  
  try {
    const { mealDescription, imageMetadata } = await request.json();

    if (!mealDescription && !imageMetadata) {
      console.error("[IMAGE API] Missing required parameters");
      return NextResponse.json(
        { error: "Meal description or image metadata is required" },
        { status: 400 }
      );
    }

    // ============================================
    // BUILD ENHANCED PROMPT FROM METADATA
    // ============================================
    
    let enhancedPrompt: string;
    
    if (imageMetadata) {
      const {
        dishName,
        mainIngredients,
        cuisineStyle,
        cookingMethod,
        presentationStyle
      } = imageMetadata;
      
      console.log("[IMAGE API] Using structured metadata:", imageMetadata);
      
      // CRITICAL: Keep prompt under 512 characters for AWS Titan
      enhancedPrompt = `${dishName}, ${cuisineStyle} cuisine, ${mainIngredients}, ${cookingMethod}, ${presentationStyle} plating, white plate, 45-degree angle, natural daylight, shallow depth of field, sharp focus, restaurant quality, appetizing, high resolution`;
    } else {
      console.log("[IMAGE API] Using fallback description:", mealDescription);
      
      enhancedPrompt = `${mealDescription}, beautiful plating, white plate, natural daylight, 45-degree angle, shallow depth of field, sharp focus, restaurant quality, appetizing, high resolution`;
    }

    console.log("[IMAGE API] Generated prompt:", enhancedPrompt);
    console.log("[IMAGE API] Prompt length:", enhancedPrompt.length, "characters");

    // ============================================
    // CALL AWS TITAN G1 V2 WITH RETRY LOGIC
    // ============================================

    const imageResponse = await retryOperation(async () => {
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

      console.log("[TITAN] Sending image generation request...");
      return await client.send(command);
    }, 5, 1000);

    console.log("[TITAN] Image generated successfully");

    // ============================================
    // PROCESS AND RETURN IMAGE
    // ============================================

    const responseBody = JSON.parse(new TextDecoder().decode(imageResponse.body));
    const base64Image = responseBody.images[0];
    const imageUrl = `data:image/png;base64,${base64Image}`;

    console.log(`[IMAGE API] Returning image (${base64Image.length} chars)`);

    return NextResponse.json({
      imageUrl,
      mealDescription: imageMetadata?.dishName || mealDescription,
    });

  } catch (error) {
    console.error("[IMAGE API] Fatal error:", error);
    
    return NextResponse.json(
      {
        error: "Failed to generate image",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}