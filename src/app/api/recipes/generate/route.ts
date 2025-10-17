import { NextRequest, NextResponse } from "next/server";
import { InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { PutCommand } from "@aws-sdk/lib-dynamodb";
import { bedrockClient, s3Client, docClient, S3_BUCKET, DYNAMODB_TABLE } from "@/lib/aws-config";
import { v4 as uuidv4 } from "uuid";

export async function POST(request: NextRequest) {
  try {
    const { query, userId } = await request.json();

    if (!query) {
      return NextResponse.json({ error: "Search query is required" }, { status: 400 });
    }

    const recipeId = uuidv4();

    // Step 1: Generate recipe using Claude 3.5 Sonnet
    const recipePrompt = `You are a professional chef and nutritionist. Generate a detailed recipe for: "${query}".

Return ONLY valid JSON (no markdown, no code blocks) in this exact format:
{
  "title": "Recipe Name",
  "mealType": "Breakfast|Lunch|Snack|Dinner",
  "ingredients": [
    {"item": "ingredient name", "quantity": "exact amount with unit"}
  ],
  "instructions": ["Step 1", "Step 2", "Step 3"],
  "nutrition": {
    "calories": "number kcal",
    "protein": "number g",
    "fat": "number g",
    "carbs": "number g"
  },
  "prepTime": "X minutes",
  "cookTime": "Y minutes"
}`;

    const recipeCommand = new InvokeModelCommand({
      modelId: "anthropic.claude-3-5-sonnet-20241022-v2:0",
      contentType: "application/json",
      accept: "application/json",
      body: JSON.stringify({
        anthropic_version: "bedrock-2023-05-31",
        max_tokens: 2000,
        messages: [
          {
            role: "user",
            content: recipePrompt,
          },
        ],
      }),
    });

    const recipeResponse = await bedrockClient.send(recipeCommand);
    const recipeData = JSON.parse(new TextDecoder().decode(recipeResponse.body));
    const recipeText = recipeData.content[0].text;
    
    // Parse the recipe JSON
    const recipe = JSON.parse(recipeText);

    // Step 2: Generate image using Titan G1 V2
    const imagePrompt = `A professional, high-quality food photography shot of ${recipe.title}. Natural daylight, cinematic composition, appetizing presentation on a clean white plate, shallow depth of field, restaurant quality, sharp focus on the food.`;

    const imageCommand = new InvokeModelCommand({
      modelId: "amazon.titan-image-generator-v2:0",
      contentType: "application/json",
      accept: "application/json",
      body: JSON.stringify({
        taskType: "TEXT_IMAGE",
        textToImageParams: {
          text: imagePrompt,
        },
        imageGenerationConfig: {
          numberOfImages: 1,
          quality: "premium",
          height: 1024,
          width: 1024,
          cfgScale: 8.0,
        },
      }),
    });

    const imageResponse = await bedrockClient.send(imageCommand);
    const imageData = JSON.parse(new TextDecoder().decode(imageResponse.body));
    const imageBase64 = imageData.images[0];
    const imageBuffer = Buffer.from(imageBase64, "base64");

    // Step 3: Upload image to S3
    const imageKey = `images/${recipeId}.jpg`;
    await s3Client.send(
      new PutObjectCommand({
        Bucket: S3_BUCKET,
        Key: imageKey,
        Body: imageBuffer,
        ContentType: "image/jpeg",
      })
    );

    const imageUrl = `https://${S3_BUCKET}.s3.${process.env.AWS_REGION || "us-east-1"}.amazonaws.com/${imageKey}`;

    // Step 4: Store recipe in DynamoDB
    const recipeRecord = {
      recipe_id: recipeId,
      user_id: userId || "anonymous",
      title: recipe.title,
      meal_type: recipe.mealType,
      ingredients: recipe.ingredients,
      instructions: recipe.instructions,
      nutrition: recipe.nutrition,
      prep_time: recipe.prepTime,
      cook_time: recipe.cookTime,
      image_s3_url: imageUrl,
      created_at: new Date().toISOString(),
      generated_by: "AWS Bedrock Claude 3.5 Sonnet",
    };

    await docClient.send(
      new PutCommand({
        TableName: DYNAMODB_TABLE,
        Item: recipeRecord,
      })
    );

    return NextResponse.json({
      success: true,
      recipe: recipeRecord,
    });
  } catch (error) {
    console.error("Recipe generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate recipe", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}