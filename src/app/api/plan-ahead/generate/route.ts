import { NextRequest, NextResponse } from "next/server";
import { BedrockRuntimeClient, ConverseCommand } from "@aws-sdk/client-bedrock-runtime";
import { startOfWeek, format } from "date-fns";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";

// ============================================
// AWS BEDROCK CLIENT WITH BEARER TOKEN
// ============================================

const getBedrockClient = () => {
  const bearerToken = process.env.AWS_BEARER_TOKEN_BEDROCK;
  
  if (!bearerToken) {
    throw new Error("AWS_BEARER_TOKEN_BEDROCK is required");
  }
  
  const client = new BedrockRuntimeClient({
    region: process.env.AWS_REGION || "us-east-1",
  });

  client.middlewareStack.add(
    (next: any) => async (args: any) => {
      if (!args.request.headers) {
        args.request.headers = {};
      }
      args.request.headers["Authorization"] = `Bearer ${bearerToken}`;
      return next(args);
    },
    {
      step: "finalizeRequest",
      name: "addBearerToken",
      priority: "high",
    }
  );

  return client;
};

const client = getBedrockClient();

const dynamoClient = new DynamoDBClient({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

const docClient = DynamoDBDocumentClient.from(dynamoClient);

export async function POST(request: NextRequest) {
  try {
    const { dietaryPreferences } = await request.json();

    // Step 1: Fetch WHOOP data from the last 7-14 days
    const whoopResponse = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/whoop/historical-data?limit=14`,
      { headers: { "Content-Type": "application/json" } }
    );

    if (!whoopResponse.ok) {
      throw new Error("Failed to fetch WHOOP data");
    }

    const whoopData = await whoopResponse.json();
    
    // Step 2: Fetch existing meals from current week
    const currentWeekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
    const weekId = format(currentWeekStart, "yyyy-MM-dd");
    
    let existingMeals = [];
    try {
      const existingMealsQuery = new QueryCommand({
        TableName: process.env.DYNAMODB_MEALPLAN_TABLE || "MealPlanData",
        KeyConditionExpression: "week_id = :weekId",
        ExpressionAttributeValues: {
          ":weekId": `current_${weekId}`,
        },
      });
      const existingMealsResponse = await docClient.send(existingMealsQuery);
      if (existingMealsResponse.Items && existingMealsResponse.Items.length > 0) {
        existingMeals = existingMealsResponse.Items[0].meals || [];
      }
    } catch (error) {
      console.log("No existing meals found, generating fresh meal plan");
    }

    // Step 3: Analyze WHOOP data and prepare prompt
    const whoopSummary = {
      avgRecovery: Math.round(
        whoopData.data.reduce((sum: number, d: any) => sum + (d.recovery_score || 0), 0) / whoopData.data.length
      ),
      avgHRV: Math.round(
        whoopData.data.reduce((sum: number, d: any) => sum + (d.hrv_rmssd_milli || 0), 0) / whoopData.data.length
      ),
      avgSleep: (
        whoopData.data.reduce((sum: number, d: any) => sum + (d.sleep_performance_percentage || 0), 0) /
        whoopData.data.length
      ).toFixed(1),
      avgStrain: (
        whoopData.data.reduce((sum: number, d: any) => sum + (d.day_strain || 0), 0) / whoopData.data.length
      ).toFixed(1),
      avgCalories: Math.round(
        whoopData.data.reduce((sum: number, d: any) => sum + (d.energy_burned || 0), 0) / whoopData.data.length
      ),
    };

    // Step 4: Generate meals with Claude 3.5 Sonnet V2 (with existing meals context)
    const systemPrompt = `You are an expert AI nutritionist and meal planner integrated with WHOOP health data.

WHOOP Data Summary (Last 14 Days):
- Average Recovery: ${whoopSummary.avgRecovery}%
- Average HRV: ${whoopSummary.avgHRV}ms
- Average Sleep Performance: ${whoopSummary.avgSleep}%
- Average Day Strain: ${whoopSummary.avgStrain}
- Average Daily Calories: ${whoopSummary.avgCalories} kcal

${existingMeals.length > 0 ? `EXISTING MEALS FROM CURRENT WEEK:
The user already has these meals in their current week plan:
${JSON.stringify(existingMeals, null, 2)}

IMPORTANT: Review these existing meals carefully. If they are still relevant and helpful based on the user's WHOOP data and dietary needs, you can REUSE them for next week by including them in your response. Make tweaks or substitutions if needed. Only generate completely NEW meals if the existing ones don't fit the user's current health profile.` : 'No existing meals found. Generate a fresh meal plan.'}

Your task: Generate a personalized 7-day meal plan for NEXT WEEK (28 meals total: Breakfast, Lunch, Snack, Dinner for each day from Monday to Sunday).

${dietaryPreferences ? `Dietary Preferences: ${dietaryPreferences}` : ''}

Requirements:
- Each meal must include: name, description, ingredients (with measurements), step-by-step instructions, prep_time, cook_time, servings, and nutrition breakdown (calories, protein, carbs, fat)
- Adjust calories based on the user's WHOOP metrics
- If recovery is low (<50%), focus on nutrient-dense, anti-inflammatory meals
- If strain is high (>15), increase protein and carbs for recovery
- Ensure variety across the week
- Provide realistic, achievable recipes

Return ONLY valid JSON in this exact format:
{
  "meals": [
    {
      "day": "Monday",
      "meal_type": "Breakfast",
      "name": "Greek Yogurt Berry Bowl",
      "description": "A protein-rich breakfast...",
      "ingredients": [{"name": "Greek Yogurt", "amount": "150g"}],
      "instructions": ["Mix yogurt...", "Add berries..."],
      "prep_time": 10,
      "cook_time": 0,
      "servings": 1,
      "nutrition": {"calories": 320, "protein": 18, "carbs": 28, "fat": 9}
    }
  ]
}`;

    const command = new ConverseCommand({
      modelId: "us.anthropic.claude-3-5-sonnet-20241022-v2:0",
      messages: [
        {
          role: "user",
          content: [{ text: "Generate a personalized 7-day meal plan based on my WHOOP data and existing meals if applicable." }],
        },
      ],
      system: [{ text: systemPrompt }],
      inferenceConfig: {
        maxTokens: 8000,
        temperature: 0.7,
      },
    });

    const response = await client.send(command);
    const rawText = response.output?.message?.content?.[0]?.text || "";

    // Parse JSON response
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Failed to parse Claude response");
    }

    const mealPlan = JSON.parse(jsonMatch[0]);

    return NextResponse.json({
      status: "success",
      meals: mealPlan.meals,
      whoopSummary,
      existingMealsCount: existingMeals.length,
      message: existingMeals.length > 0 
        ? `Generated meal plan considering ${existingMeals.length} existing meals` 
        : "Generated fresh meal plan",
    });
  } catch (error) {
    console.error("Error generating meals:", error);
    return NextResponse.json(
      {
        status: "error",
        message: error instanceof Error ? error.message : "Failed to generate meals",
      },
      { status: 500 }
    );
  }
}