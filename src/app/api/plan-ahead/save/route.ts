import { NextRequest, NextResponse } from "next/server";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { startOfWeek, format, addWeeks } from "date-fns";

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

const docClient = DynamoDBDocumentClient.from(client);

export async function POST(request: NextRequest) {
  try {
    const { meals, whoopSummary, dietaryPreferences } = await request.json();

    // Calculate next week identifier
    const currentWeekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
    const nextWeekStart = addWeeks(currentWeekStart, 1);
    const nextWeekId = format(nextWeekStart, "yyyy-MM-dd");

    const command = new PutCommand({
      TableName: process.env.DYNAMODB_MEALPLAN_TABLE || "MealPlanData",
      Item: {
        week_id: nextWeekId, // Consistent format without prefix
        meals,
        whoopSummary,
        dietaryPreferences: dietaryPreferences || "",
        generated_at: new Date().toISOString(),
      },
    });

    await docClient.send(command);

    return NextResponse.json({
      status: "success",
      message: "Meal plan saved for next week successfully",
      nextWeekId,
    });
  } catch (error) {
    console.error("Error saving meal plan:", error);
    return NextResponse.json(
      {
        status: "error",
        message: error instanceof Error ? error.message : "Failed to save meal plan",
      },
      { status: 500 }
    );
  }
}