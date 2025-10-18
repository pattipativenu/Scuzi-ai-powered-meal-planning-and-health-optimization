import { NextRequest, NextResponse } from "next/server";
import { LambdaClient, InvokeCommand } from "@aws-sdk/client-lambda";
import { startOfWeek, format, addWeeks } from "date-fns";

const lambdaClient = new LambdaClient({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

export async function POST(request: NextRequest) {
  try {
    const { meals } = await request.json();

    if (!meals || !Array.isArray(meals)) {
      return NextResponse.json(
        { status: "error", message: "Invalid meals data" },
        { status: 400 }
      );
    }

    // Calculate next week identifier
    const currentWeekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
    const nextWeekStart = addWeeks(currentWeekStart, 1);
    const nextWeekId = format(nextWeekStart, "yyyy-MM-dd");

    // Store each meal via Lambda
    const storedMeals = [];

    for (const meal of meals) {
      const payload = {
        meal_name: meal.name,
        meal_type: meal.meal_type,
        day: meal.day,
        description: meal.description,
        ingredients: meal.ingredients,
        instructions: meal.instructions,
        nutrition: meal.nutrition,
        prep_time: meal.prep_time,
        cook_time: meal.cook_time,
        servings: meal.servings,
        image_bytes: meal.image_base64 || meal.image, // Fix: use image_base64 from generate-images
        week_id: `next_${nextWeekId}`,
      };

      const command = new InvokeCommand({
        FunctionName: process.env.AWS_LAMBDA_FUNCTION_NAME || "storeMealPlanData",
        Payload: JSON.stringify(payload),
      });

      const response = await lambdaClient.send(command);
      const result = JSON.parse(new TextDecoder().decode(response.Payload));

      if (result.statusCode !== 200) {
        console.error("Lambda error:", result);
        throw new Error(`Lambda failed for meal: ${meal.name}`);
      }

      const body = JSON.parse(result.body);
      storedMeals.push({
        ...meal,
        image: body.image_url,
        id: body.id,
      });
    }

    return NextResponse.json({
      status: "success",
      meals: storedMeals,
      nextWeekId,
      message: `Successfully stored ${storedMeals.length} meals for next week`,
    });
  } catch (error) {
    console.error("Error storing meals via Lambda:", error);
    return NextResponse.json(
      {
        status: "error",
        message: error instanceof Error ? error.message : "Failed to store meals",
      },
      { status: 500 }
    );
  }
}