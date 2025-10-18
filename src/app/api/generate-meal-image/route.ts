import { NextRequest, NextResponse } from "next/server";
import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from "@aws-sdk/client-bedrock-runtime";

// Configure client with bearer token authentication
const getBedrockClient = () => {
  const bearerToken = process.env.AWS_BEARER_TOKEN_BEDROCK;
  
  if (bearerToken) {
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
  } else {
    return new BedrockRuntimeClient({
      region: process.env.AWS_REGION || "us-east-1",
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
      },
    });
  }
};

const client = getBedrockClient();

// Retry logic helper
async function retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: Error | undefined;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      console.error(`Image generation attempt ${attempt} failed:`, error);
      
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, delay * attempt));
      }
    }
  }
  
  throw lastError || new Error("Image generation failed after retries");
}

export async function POST(request: NextRequest) {
  try {
    const { mealDescription, imageMetadata } = await request.json();

    if (!mealDescription && !imageMetadata) {
      return NextResponse.json(
        { error: "Meal description or image metadata is required" },
        { status: 400 }
      );
    }

    // Build enhanced prompt from structured metadata if available
    let enhancedPrompt: string;
    
    if (imageMetadata) {
      // Use structured metadata for precise image generation
      const {
        dishName,
        mainIngredients,
        cuisineStyle,
        cookingMethod,
        presentationStyle
      } = imageMetadata;
      
      enhancedPrompt = `A professional food photography shot of ${dishName}, featuring ${mainIngredients}. ${cuisineStyle} cuisine style, ${cookingMethod} cooking method. ${presentationStyle} presentation on a clean white plate. The dish is beautifully plated with perfect lighting from a 45-degree angle, appetizing colors, shallow depth of field, restaurant-quality styling, sharp focus on the food, high resolution, natural daylight.`;
    } else {
      // Fallback to basic description
      enhancedPrompt = `A professional food photography shot of ${mealDescription}. The dish is beautifully plated on a clean white plate, with perfect lighting, appetizing colors, and artistic presentation. The photo is taken from a 45-degree angle with shallow depth of field. High-resolution, restaurant-quality food styling.`;
    }

    // Call AWS Titan Image Generator G1 v2 with retry logic
    const imageResponse = await retryOperation(async () => {
      const input = {
        taskType: "TEXT_IMAGE",
        textToImageParams: {
          text: enhancedPrompt,
          negativeText: "blurry, low quality, dark, unappetizing, messy, dirty, amateur, cartoon, illustration, text, watermark, people, hands",
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

      return await client.send(command);
    }, 3, 1000);

    const responseBody = JSON.parse(new TextDecoder().decode(imageResponse.body));
    const base64Image = responseBody.images[0];
    const imageUrl = `data:image/png;base64,${base64Image}`;

    return NextResponse.json({
      imageUrl,
      mealDescription: imageMetadata?.dishName || mealDescription,
    });
  } catch (error) {
    console.error("Error generating meal image:", error);
    return NextResponse.json(
      {
        error: "Failed to generate image",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}