import { NextRequest, NextResponse } from "next/server";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand, PutCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";
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
    // Calculate week identifiers
    const currentWeekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
    const nextWeekStart = addWeeks(currentWeekStart, 1);
    const currentWeekId = format(currentWeekStart, "yyyy-MM-dd");
    const nextWeekId = format(nextWeekStart, "yyyy-MM-dd");

    // 1. Get next week meals
    const nextWeekQuery = new QueryCommand({
      TableName: process.env.DYNAMODB_MEALPLAN_TABLE || "MealPlanData",
      KeyConditionExpression: "week_id = :weekId",
      ExpressionAttributeValues: {
        ":weekId": `next_${currentWeekId}`,
      },
    });

    const nextWeekResponse = await docClient.send(nextWeekQuery);

    if (!nextWeekResponse.Items || nextWeekResponse.Items.length === 0) {
      return NextResponse.json({
        status: "success",
        message: "No next week meals to transition",
      });
    }

    const nextWeekMeals = nextWeekResponse.Items[0];

    // 2. Delete old current week meals
    try {
      await docClient.send(
        new DeleteCommand({
          TableName: process.env.DYNAMODB_MEALPLAN_TABLE || "MealPlanData",
          Key: {
            week_id: `current_${currentWeekId}`,
          },
        })
      );
    } catch (error) {
      console.log("No old current week meals to delete");
    }

    // 3. Move next week meals to current week
    await docClient.send(
      new PutCommand({
        TableName: process.env.DYNAMODB_MEALPLAN_TABLE || "MealPlanData",
        Item: {
          week_id: `current_${nextWeekId}`,
          meals: nextWeekMeals.meals,
          generated_at: nextWeekMeals.generated_at,
          whoopSummary: nextWeekMeals.whoopSummary,
          transitioned_at: new Date().toISOString(),
        },
      })
    );

    // 4. Delete next week meals (they're now current)
    await docClient.send(
      new DeleteCommand({
        TableName: process.env.DYNAMODB_MEALPLAN_TABLE || "MealPlanData",
        Key: {
          week_id: `next_${currentWeekId}`,
        },
      })
    );

    return NextResponse.json({
      status: "success",
      message: "Week transitioned successfully",
      newCurrentWeekId: nextWeekId,
      mealsCount: nextWeekMeals.meals?.length || 0,
    });
  } catch (error) {
    console.error("Error transitioning week:", error);
    return NextResponse.json(
      {
        status: "error",
        message: error instanceof Error ? error.message : "Failed to transition week",
      },
      { status: 500 }
    );
  }
}