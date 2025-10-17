import { NextRequest, NextResponse } from "next/server";
import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from "@aws-sdk/client-bedrock-runtime";

// Configure client with bearer token authentication
const getBedrockClient = () => {
  const bearerToken = process.env.AWS_BEARER_TOKEN_BEDROCK;
  
  if (bearerToken) {
    // Use bearer token authentication for AWS Bedrock serverless
    const client = new BedrockRuntimeClient({
      region: process.env.AWS_REGION || "us-east-1",
    });

    // Add middleware to inject bearer token in Authorization header
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
    // Fallback to standard AWS credentials
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

export async function POST(request: NextRequest) {
  try {
    const { mealDescription } = await request.json();

    if (!mealDescription) {
      return NextResponse.json(
        { error: "Meal description is required" },
        { status: 400 }
      );
    }

    // Enhanced prompt for food photography
    const enhancedPrompt = `A professional food photography shot of ${mealDescription}. The dish is beautifully plated on a clean white plate, with perfect lighting, appetizing colors, and artistic presentation. The photo is taken from a 45-degree angle with shallow depth of field. High-resolution, restaurant-quality food styling.`;

    // Call AWS Titan Image Generator G1 v2
    const input = {
      taskType: "TEXT_IMAGE",
      textToImageParams: {
        text: enhancedPrompt,
        negativeText: "blurry, low quality, dark, unappetizing, messy, dirty, amateur, cartoon, illustration",
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

    const response = await client.send(command);
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));

    // Extract base64 image
    const base64Image = responseBody.images[0];
    const imageUrl = `data:image/png;base64,${base64Image}`;

    return NextResponse.json({
      imageUrl,
      mealDescription,
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