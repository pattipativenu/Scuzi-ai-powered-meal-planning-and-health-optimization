import { NextRequest, NextResponse } from "next/server";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { startOfWeek, format } from "date-fns";

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

const docClient = DynamoDBDocumentClient.from(client);

export async function GET(request: NextRequest) {
  try {
    // Calculate current week identifier (Monday of current week)
    const currentWeekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
    const weekId = format(currentWeekStart, "yyyy-MM-dd");

    // Query DynamoDB for current week meals
    const command = new QueryCommand({
      TableName: process.env.DYNAMODB_MEALPLAN_TABLE || "MealPlanData",
      KeyConditionExpression: "week_id = :weekId",
      ExpressionAttributeValues: {
        ":weekId": `current_${weekId}`,
      },
    });

    const response = await docClient.send(command);

    if (!response.Items || response.Items.length === 0) {
      return NextResponse.json({
        status: "success",
        meals: [],
        message: "No meals found for current week",
      });
    }

    // Get the most recent meal plan for current week
    const mealPlan = response.Items[0];

    return NextResponse.json({
      status: "success",
      meals: mealPlan.meals || [],
      weekId: weekId,
      generatedAt: mealPlan.generated_at,
    });
  } catch (error) {
    console.error("Error fetching current week meals:", error);
    return NextResponse.json(
      {
        status: "error",
        message: error instanceof Error ? error.message : "Failed to fetch meals",
      },
      { status: 500 }
    );
  }
}