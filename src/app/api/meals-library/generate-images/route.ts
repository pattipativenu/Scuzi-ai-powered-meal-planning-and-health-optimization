import { NextRequest, NextResponse } from "next/server";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";

// Initialize AWS clients
const dynamoClient = new DynamoDBClient({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

const docClient = DynamoDBDocumentClient.from(dynamoClient);

const bedrockClient = new BedrockRuntimeClient({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

const s3Client = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

// Generate image using AWS Titan G1V2
async function generateImage(prompt: string): Promise<string> {
  const requestBody = {
    taskType: "TEXT_IMAGE",
    textToImageParams: {
      text: prompt,
    },
    imageGenerationConfig: {
      numberOfImages: 1,
      quality: "premium",
      height: 512,
      width: 512,
      cfgScale: 8.0,
    },
  };

  const command = new InvokeModelCommand({
    modelId: "amazon.titan-image-generator-v2:0",
    contentType: "application/json",
    accept: "application/json",
    body: JSON.stringify(requestBody),
  });

  const response = await bedrockClient.send(command);
  const responseBody = JSON.parse(new TextDecoder().decode(response.body));
  return responseBody.images[0];
}

// Upload image to S3
async function uploadImageToS3(base64Image: string, mealId: string): Promise<string> {
  const buffer = Buffer.from(base64Image, "base64");
  const key = `meal-images/${mealId}-${uuidv4()}.png`;

  await s3Client.send(
    new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME || "",
      Key: key,
      Body: buffer,
      ContentType: "image/png",
    })
  );

  return `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
}

export async function POST(request: NextRequest) {
  try {
    const { batchSize = 5 } = await request.json();

    // Fetch all meals from library without images
    console.log("[IMAGE-GEN] Fetching meals from library...");
    const scanCommand = new ScanCommand({
      TableName: "meals_library",
      FilterExpression: "attribute_not_exists(imageUrl) OR imageUrl = :empty",
      ExpressionAttributeValues: {
        ":empty": "",
      },
    });

    const response = await docClient.send(scanCommand);
    const meals = response.Items || [];

    if (meals.length === 0) {
      return NextResponse.json({
        status: "success",
        message: "All meals already have images",
        processed: 0,
        total: 0,
      });
    }

    console.log(`[IMAGE-GEN] Found ${meals.length} meals without images`);

    // Process meals in batches
    const mealsToProcess = meals.slice(0, batchSize);
    let successCount = 0;
    let failCount = 0;

    for (const meal of mealsToProcess) {
      try {
        console.log(`[IMAGE-GEN] Generating image for: ${meal.name}`);

        // Use imagePrompt from meal data if available, otherwise create one
        const imagePrompt = meal.imagePrompt || `Professional food photography of ${meal.name}: ${meal.description}. Beautifully plated on a white ceramic dish, garnished elegantly, natural daylight, high resolution, appetizing, gourmet presentation, top-down view`;

        // Generate image
        const base64Image = await generateImage(imagePrompt);

        // Upload to S3
        const imageUrl = await uploadImageToS3(base64Image, meal.meal_id);

        // Update meal in DynamoDB using correct key
        await docClient.send(
          new UpdateCommand({
            TableName: "meals_library",
            Key: { meal_id: meal.meal_id },
            UpdateExpression: "SET imageUrl = :imageUrl",
            ExpressionAttributeValues: {
              ":imageUrl": imageUrl,
            },
          })
        );

        console.log(`[IMAGE-GEN] ✓ Successfully generated image for: ${meal.name}`);
        successCount++;
      } catch (error) {
        console.error(`[IMAGE-GEN] ✗ Failed to generate image for: ${meal.name}`, error);
        failCount++;
      }
    }

    return NextResponse.json({
      status: "success",
      message: `Processed ${mealsToProcess.length} meals`,
      processed: successCount,
      failed: failCount,
      remaining: meals.length - mealsToProcess.length,
      total: meals.length,
    });
  } catch (error) {
    console.error("[IMAGE-GEN] Error:", error);
    return NextResponse.json(
      {
        status: "error",
        message: error instanceof Error ? error.message : "Failed to generate images",
      },
      { status: 500 }
    );
  }
}