import { NextRequest, NextResponse } from "next/server";
import { ScanCommand } from "@aws-sdk/lib-dynamodb";
import { dynamoDb } from "@/lib/dynamodb-config";

const MEAL_PLAN_TABLE = "MealPlanData";

export async function GET(request: NextRequest) {
  console.log("[RETRIEVE MEAL PLAN] Request received");
  
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("user_id") || "guest_user";
    
    // Scan for latest meal plan for this user
    const command = new ScanCommand({
      TableName: MEAL_PLAN_TABLE,
      FilterExpression: "user_id = :userId",
      ExpressionAttributeValues: {
        ":userId": userId,
      },
    });
    
    const response = await dynamoDb.send(command);
    
    if (!response.Items || response.Items.length === 0) {
      return NextResponse.json({
        status: "success",
        mealPlan: null,
        message: "No meal plan found",
      });
    }
    
    // Sort by created_at and get the latest
    const sortedPlans = response.Items.sort((a, b) => b.created_at - a.created_at);
    const latestPlan = sortedPlans[0];
    
    console.log(`[RETRIEVE MEAL PLAN] Found meal plan: ${latestPlan.id}`);
    
    return NextResponse.json({
      status: "success",
      mealPlan: latestPlan,
    });
    
  } catch (error) {
    console.error("[RETRIEVE MEAL PLAN] Error:", error);
    
    return NextResponse.json(
      {
        status: "error",
        message: "Failed to retrieve meal plan",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}