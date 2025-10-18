import { NextRequest, NextResponse } from "next/server";
import { LambdaClient, InvokeCommand } from "@aws-sdk/client-lambda";

const lambdaClient = new LambdaClient({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

export async function GET(request: NextRequest) {
  console.log("[TEST LAMBDA] Testing Lambda connectivity...");
  
  try {
    // Test payload matching your Lambda's expected format
    const testPayload = {
      meal_name: "Test Meal",
      meal_type: "Breakfast",
      ingredients: [
        { name: "Test Ingredient", amount: "100g" }
      ],
      instructions: ["Test instruction 1", "Test instruction 2"],
      nutrition: {
        calories: 300,
        protein: 20,
        carbs: 30,
        fat: 10
      },
      image_bytes: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==", // 1x1 transparent PNG
      day: "Monday",
      prep_time: 10,
      cook_time: 15,
      servings: 2,
      description: "Test meal description"
    };
    
    console.log("[TEST LAMBDA] Invoking storeMealPlanData with test payload...");
    
    const command = new InvokeCommand({
      FunctionName: "storeMealPlanData",
      Payload: JSON.stringify(testPayload),
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
    
    console.log("[TEST LAMBDA] Success:", responsePayload);
    
    return NextResponse.json({
      status: "success",
      message: "✅ Lambda function is accessible and working",
      lambdaResponse: responsePayload,
      details: {
        functionName: "storeMealPlanData",
        region: process.env.AWS_REGION || "us-east-1",
        executionTime: response.$metadata.totalRetryDelay || 0,
      }
    });
    
  } catch (error) {
    console.error("[TEST LAMBDA] Error:", error);
    
    return NextResponse.json(
      {
        status: "error",
        message: "Failed to connect to Lambda function",
        error: error instanceof Error ? error.message : "Unknown error",
        details: {
          functionName: "storeMealPlanData",
          region: process.env.AWS_REGION || "us-east-1",
        }
      },
      { status: 500 }
    );
  }
}