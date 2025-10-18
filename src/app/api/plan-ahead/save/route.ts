import { NextRequest, NextResponse } from "next/server";
import { PutCommand } from "@aws-sdk/lib-dynamodb";
import { dynamoDb } from "@/lib/dynamodb-config";
import { randomUUID } from "crypto";

const MEAL_PLAN_TABLE = "MealPlanData";

export async function POST(request: NextRequest) {
  console.log("[SAVE MEAL PLAN] Request received");
  
  try {
    const { meals, whoopSummary, dietaryPreferences } = await request.json();
    
    if (!meals || !Array.isArray(meals)) {
      return NextResponse.json(
        { error: "Meals array is required" },
        { status: 400 }
      );
    }
    
    // Create meal plan record
    const mealPlanId = randomUUID();
    const item = {
      id: mealPlanId,
      user_id: "guest_user", // Replace with actual user ID when auth is implemented
      generated_at: new Date().toISOString(),
      whoop_summary: whoopSummary || "",
      dietary_preferences: dietaryPreferences || "",
      meals: meals,
      total_meals: meals.length,
      created_at: Date.now(),
    };
    
    // Save to DynamoDB
    const command = new PutCommand({
      TableName: MEAL_PLAN_TABLE,
      Item: item,
    });
    
    await dynamoDb.send(command);
    
    console.log(`[SAVE MEAL PLAN] Saved meal plan: ${mealPlanId}`);
    
    return NextResponse.json({
      status: "success",
      mealPlanId: mealPlanId,
      totalMeals: meals.length,
    });
    
  } catch (error) {
    console.error("[SAVE MEAL PLAN] Error:", error);
    
    return NextResponse.json(
      {
        status: "error",
        message: "Failed to save meal plan",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}