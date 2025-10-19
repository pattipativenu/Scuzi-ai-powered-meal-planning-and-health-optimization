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
    // Calculate current week identifier
    const currentWeekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
    const currentWeekId = format(currentWeekStart, "yyyy-MM-dd");

    // Query for "next week" meals (with "next_" prefix)
    const command = new QueryCommand({
      TableName: process.env.DYNAMODB_MEALPLAN_TABLE || "MealPlanData",
      KeyConditionExpression: "week_id = :weekId",
      ExpressionAttributeValues: {
        ":weekId": `next_${currentWeekId}`,
      },
    });

    const response = await docClient.send(command);

    if (!response.Items || response.Items.length === 0) {
      return NextResponse.json({
        status: "success",
        mealPlan: null,
        message: "No meal plan found. Generate a new plan to get started.",
      });
    }

    return NextResponse.json({
      status: "success",
      mealPlan: response.Items[0],
      weekId: currentWeekId,
    });
  } catch (error) {
    console.error("Error retrieving meal plan:", error);
    return NextResponse.json(
      {
        status: "error",
        message: error instanceof Error ? error.message : "Failed to retrieve meal plan",
      },
      { status: 500 }
    );
  }
}