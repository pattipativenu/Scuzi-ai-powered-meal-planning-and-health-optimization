import { NextRequest, NextResponse } from "next/server";
import {
  InvokeModelCommand,
} from "@aws-sdk/client-bedrock-runtime";
import { UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { dynamoDb, HISTORY_TABLE_NAME } from "@/lib/dynamodb-config";
import { bedrockClient } from "@/lib/aws-config";

// ============================================
// INCREASE API ROUTE TIMEOUT
// ============================================
export const maxDuration = 60; // 60 seconds max execution time

// ============================================
// MAIN IMAGE GENERATION API
// ============================================

export async function POST(request: NextRequest) {
  console.log("=".repeat(80));
  console.log("[IMAGE API] NEW REQUEST at:", new Date().toISOString());
  console.log("=".repeat(80));
  
  try {
    const { mealDescription, imageMetadata, historyItemId } = await request.json();

    console.log("[IMAGE API] Request body:", JSON.stringify({ 
      mealDescription, 
      imageMetadata, 
      historyItemId 
    }, null, 2));

    if (!mealDescription && !imageMetadata) {
      console.error("[IMAGE API] Missing required parameters");
      return NextResponse.json(
        { error: "Meal description or image metadata is required" },
        { status: 400 }
      );
    }

    // ============================================
    // BUILD OPTIMIZED PROMPT
    // ============================================
    
    const dishName = imageMetadata?.dishName || mealDescription || "delicious meal";
    const enhancedPrompt = `A professional, high-quality food photography shot of ${dishName}. Natural daylight, cinematic composition, appetizing presentation on a clean white plate, shallow depth of field, restaurant quality, sharp focus on the food.`;

    console.log("[IMAGE API] Final prompt:", enhancedPrompt);
    console.log("[IMAGE API] Prompt length:", enhancedPrompt.length);

    // ============================================
    // CALL AWS TITAN - USING SAME CLIENT AS RECIPE API
    // ============================================

    console.log("[TITAN] Preparing request...");
    const input = {
      taskType: "TEXT_IMAGE",
      textToImageParams: {
        text: enhancedPrompt,
      },
      imageGenerationConfig: {
        numberOfImages: 1,
        quality: "premium",
        height: 1024,
        width: 1024,
        cfgScale: 8.0,
      },
    };

    console.log("[TITAN] Request payload:", JSON.stringify(input, null, 2));

    const command = new InvokeModelCommand({
      modelId: "amazon.titan-image-generator-v2:0",
      body: JSON.stringify(input),
      contentType: "application/json",
      accept: "application/json",
    });

    console.log("[TITAN] Sending request at:", new Date().toISOString());
    const startTime = Date.now();
    
    let imageResponse;
    try {
      imageResponse = await bedrockClient.send(command);
      const elapsedTime = Date.now() - startTime;
      console.log(`[TITAN] ✅ Response received in ${elapsedTime}ms`);
      console.log("[TITAN] Response metadata:", JSON.stringify(imageResponse.$metadata, null, 2));
    } catch (awsError: any) {
      const elapsedTime = Date.now() - startTime;
      console.error("=".repeat(80));
      console.error(`[TITAN] ❌ AWS ERROR after ${elapsedTime}ms:`);
      console.error("[TITAN] Error name:", awsError.name);
      console.error("[TITAN] Error message:", awsError.message);
      console.error("[TITAN] Error code:", awsError.code);
      console.error("[TITAN] Error status code:", awsError.$metadata?.httpStatusCode);
      console.error("[TITAN] Full error:", JSON.stringify(awsError, null, 2));
      console.error("=".repeat(80));
      
      throw new Error(`AWS Bedrock Error: ${awsError.message} (Code: ${awsError.code || 'Unknown'})`);
    }

    // ============================================
    // PROCESS RESPONSE
    // ============================================

    console.log("[TITAN] Decoding response body...");
    const responseBody = JSON.parse(new TextDecoder().decode(imageResponse.body));
    console.log("[TITAN] Response keys:", Object.keys(responseBody));
    
    if (!responseBody.images || !responseBody.images[0]) {
      console.error("[TITAN] ❌ No image data in response:", responseBody);
      throw new Error("No image data in response");
    }
    
    const base64Image = responseBody.images[0];
    console.log("[TITAN] ✅ Base64 image length:", base64Image.length);
    
    const imageUrl = `data:image/png;base64,${base64Image}`;

    // ============================================
    // UPDATE DYNAMODB
    // ============================================

    if (historyItemId) {
      console.log("[DYNAMODB] Updating history item:", historyItemId);
      try {
        const updateCommand = new UpdateCommand({
          TableName: HISTORY_TABLE_NAME,
          Key: { id: historyItemId },
          UpdateExpression: "SET image_url = :imageUrl",
          ExpressionAttributeValues: {
            ":imageUrl": imageUrl,
          },
        });

        await dynamoDb.send(updateCommand);
        console.log("[DYNAMODB] ✅ Successfully updated");
      } catch (dbError) {
        console.error("[DYNAMODB] ❌ Update failed:", dbError);
      }
    }

    console.log("=".repeat(80));
    console.log("[IMAGE API] ✅ REQUEST COMPLETED SUCCESSFULLY");
    console.log("=".repeat(80));
    
    return NextResponse.json({
      imageUrl,
      mealDescription: dishName,
    });

  } catch (error) {
    console.error("=".repeat(80));
    console.error("[IMAGE API] ❌ FATAL ERROR:");
    console.error("[IMAGE API] Error type:", error instanceof Error ? error.constructor.name : typeof error);
    console.error("[IMAGE API] Error message:", error instanceof Error ? error.message : String(error));
    console.error("[IMAGE API] Error stack:", error instanceof Error ? error.stack : "N/A");
    console.error("=".repeat(80));
    
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    
    return NextResponse.json(
      {
        error: "Failed to generate image",
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}