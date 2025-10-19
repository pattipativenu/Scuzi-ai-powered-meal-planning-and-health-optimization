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
          ":weekId": weekId,
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

    // Step 4: Generate meals with Claude 3.5 Sonnet V2
    const systemPrompt = `You are an expert AI nutritionist and meal planner integrated with WHOOP health data.

WHOOP Data Summary (Last 14 Days):
- Average Recovery: ${whoopSummary.avgRecovery}%
- Average HRV: ${whoopSummary.avgHRV}ms
- Average Sleep Performance: ${whoopSummary.avgSleep}%
- Average Day Strain: ${whoopSummary.avgStrain}
- Average Daily Calories: ${whoopSummary.avgCalories} kcal

${dietaryPreferences ? `Dietary Preferences: ${dietaryPreferences}` : ''}

CRITICAL REQUIREMENTS:
1. Generate EXACTLY 28 meals total: 4 meals per day × 7 days (Monday through Sunday)
2. Each day MUST have: Breakfast, Lunch, Snack, and Dinner
3. EVERY meal must include a descriptive "image_prompt" field for image generation
4. Ensure meal variety - no repeated meals across the week
5. Adjust calories based on WHOOP metrics:
   - If recovery is low (<50%): Focus on anti-inflammatory, nutrient-dense meals
   - If strain is high (>15): Increase protein and carbs for recovery
   - Match daily calories to user's average burn rate

IMAGE PROMPT GUIDELINES:
- Be specific about the dish appearance, plating, and main ingredients
- Include details like "served in a white ceramic bowl" or "plated on white dish"
- Mention key visual elements (garnish, sauce placement, protein presentation)
- Example: "Creamy overnight oats with mixed berries in a glass jar, topped with chia seeds and honey drizzle, natural lighting"

Return ONLY valid JSON in this exact format:
{
  "meals": [
    {
      "day": "Monday",
      "meal_type": "Breakfast",
      "name": "Overnight Recovery Oats",
      "description": "Nutrient-dense overnight oats with anti-inflammatory ingredients",
      "image_prompt": "Creamy overnight oats with blueberries and sliced almonds in a glass jar, topped with chia seeds, honey drizzle, and fresh mint, served on white background, natural daylight, appetizing, high resolution",
      "ingredients": [{"name": "Rolled oats", "amount": "50g"}, {"name": "Almond milk", "amount": "200ml"}],
      "instructions": ["Combine oats and milk in a jar", "Refrigerate overnight", "Top with berries and serve"],
      "prep_time": 10,
      "cook_time": 0,
      "servings": 1,
      "nutrition": {"calories": 425, "protein": 15, "carbs": 65, "fat": 12}
    }
  ]
}

VERIFICATION: Before responding, count your meals to ensure exactly 28 total (7 days × 4 meal types).`;

    const command = new ConverseCommand({
      modelId: "us.anthropic.claude-3-5-sonnet-20241022-v2:0",
      messages: [
        {
          role: "user",
          content: [{ text: "Generate a complete 7-day meal plan (28 meals total) with EXACTLY 4 meals per day: Breakfast, Lunch, Snack, and Dinner for each day from Monday to Sunday. Include detailed image_prompt for each meal." }],
        },
      ],
      system: [{ text: systemPrompt }],
      inferenceConfig: {
        maxTokens: 8192,
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
    
    // Verify we have exactly 28 meals
    if (!mealPlan.meals || mealPlan.meals.length !== 28) {
      console.warn(`Generated ${mealPlan.meals?.length || 0} meals instead of 28`);
    }

    console.log(`[GENERATE] Successfully generated ${mealPlan.meals.length} meals`);

    return NextResponse.json({
      status: "success",
      meals: mealPlan.meals,
      whoopSummary,
      message: `Generated ${mealPlan.meals.length} meals`,
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