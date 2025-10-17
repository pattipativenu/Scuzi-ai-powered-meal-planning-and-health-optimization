import { NextRequest, NextResponse } from "next/server";
import { InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { PutCommand } from "@aws-sdk/lib-dynamodb";
import { bedrockClient, s3Client, docClient, S3_BUCKET, DYNAMODB_TABLE } from "@/lib/aws-config";
import { v4 as uuidv4 } from "uuid";

// API Route for AI-powered recipe generation using AWS Bedrock Claude 3.5 Sonnet
export async function POST(request: NextRequest) {
  try {
    const { query, userId } = await request.json();

    if (!query) {
      return NextResponse.json({ error: "Search query is required" }, { status: 400 });
    }

    const recipeId = uuidv4();

    // Step 1: Generate recipe using Claude 3.5 Sonnet (working with bearer token)
    const systemPrompt = `You are an expert chef and nutritionist who writes precise, structured, and clear recipes.
The user will provide a meal name.
Your goal is to generate a recipe for exactly ONE serving.

Structure your output strictly in this JSON format:

{
  "meal_name": "<exact user text>",
  "servings": 1,
  "meal_type": "Breakfast | Lunch | Snack | Dinner",
  "ingredients": [
    {"name": "ingredient name", "quantity": 0.5, "unit": "g/ml/cup/tsp/etc"}
  ],
  "instructions": [
    "Step 1: ...",
    "Step 2: ...",
    "Step 3: ..."
  ],
  "nutrition_table": {
    "calories": "... kcal",
    "protein": "... g",
    "carbohydrates": "... g",
    "fat": "... g",
    "fiber": "... g",
    "sugar": "... g"
  },
  "prep_time_minutes": 15,
  "cook_time_minutes": 20
}

Rules:
- Always assume one serving.
- Include realistic ingredient quantities and cooking times.
- Write clear, numbered, step-by-step instructions.
- Always provide the nutrition table.
- If meal type is unclear, infer it logically.
- CRITICAL: Use decimal numbers (0.25, 0.5, 0.75) NOT fractions (1/4, 1/2, 3/4) for quantities.
- Return ONLY valid JSON. No markdown, no code blocks, no comments, no trailing commas.`;

    const recipeCommand = new InvokeModelCommand({
      modelId: "us.anthropic.claude-3-5-sonnet-20241022-v2:0",
      contentType: "application/json",
      accept: "application/json",
      body: JSON.stringify({
        anthropic_version: "bedrock-2023-05-31",
        max_tokens: 2000,
        temperature: 0.55,
        system: systemPrompt,
        messages: [
          {
            role: "user",
            content: query,
          },
        ],
      }),
    });

    const recipeResponse = await bedrockClient.send(recipeCommand);
    const recipeData = JSON.parse(new TextDecoder().decode(recipeResponse.body));
    const recipeText = recipeData.content[0].text;
    
    // Parse the recipe JSON - handle various formatting issues
    let cleanedText = recipeText.trim();
    
    // Remove markdown code blocks if present
    if (cleanedText.includes("```")) {
      cleanedText = cleanedText.replace(/```json\n?/g, "").replace(/```\n?/g, "");
    }
    
    // Extract JSON if surrounded by text
    const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      cleanedText = jsonMatch[0];
    }
    
    // Convert fractions to decimals (e.g., 1/4 -> 0.25, 1/2 -> 0.5)
    cleanedText = cleanedText.replace(/:\s*(\d+)\/(\d+)/g, (match, num, den) => {
      const decimal = parseInt(num) / parseInt(den);
      return `: ${decimal}`;
    });
    
    // Remove trailing commas before closing braces/brackets
    cleanedText = cleanedText.replace(/,(\s*[}\]])/g, "$1");
    
    // Remove comments (// and /* */)
    cleanedText = cleanedText.replace(/\/\*[\s\S]*?\*\//g, "");
    cleanedText = cleanedText.replace(/\/\/.*/g, "");
    
    console.log("Cleaned JSON:", cleanedText);
    
    // Parse the cleaned JSON
    let recipe;
    try {
      recipe = JSON.parse(cleanedText.trim());
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      console.error("Failed to parse:", cleanedText);
      // Return the raw response for debugging
      return NextResponse.json(
        {
          error: "Invalid JSON from Claude",
          details: parseError instanceof Error ? parseError.message : "Unknown error",
          rawResponse: recipeText,
          cleanedResponse: cleanedText
        },
        { status: 500 }
      );
    }

    // Step 2: Generate image using Titan G1 V2
    const imagePrompt = `A professional, high-quality food photography shot of ${recipe.meal_name}. Natural daylight, cinematic composition, appetizing presentation on a clean white plate, shallow depth of field, restaurant quality, sharp focus on the food.`;

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
      meal_name: recipe.meal_name,
      servings: recipe.servings,
      meal_type: recipe.meal_type,
      ingredients: recipe.ingredients,
      instructions: recipe.instructions,
      nutrition_table: recipe.nutrition_table,
      prep_time_minutes: recipe.prep_time_minutes,
      cook_time_minutes: recipe.cook_time_minutes,
      image_s3_url: imageUrl,
      created_at: new Date().toISOString(),
      generated_by: "AWS Bedrock Claude 3 Haiku",
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
    
    // Retry logic for Bedrock throttling
    if (error instanceof Error && (error.message.includes("throttl") || error.message.includes("timeout"))) {
      return NextResponse.json(
        { error: "Service is busy. Please try again." },
        { status: 503 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to generate recipe", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}