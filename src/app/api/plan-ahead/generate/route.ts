import { NextRequest, NextResponse } from "next/server";
import { BedrockRuntimeClient, ConverseCommand } from "@aws-sdk/client-bedrock-runtime";
import { startOfWeek, format } from "date-fns";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";

// ============================================
// AWS BEDROCK CLIENT WITH BEARER TOKEN
// ============================================

let bedrockClient: BedrockRuntimeClient | null = null;

const getBedrockClient = () => {
  if (bedrockClient) return bedrockClient;
  
  const bearerToken = process.env.AWS_BEARER_TOKEN_BEDROCK;
  
  if (!bearerToken) {
    throw new Error("AWS_BEARER_TOKEN_BEDROCK is required");
  }
  
  bedrockClient = new BedrockRuntimeClient({
    region: process.env.AWS_REGION || "us-east-1",
  });

  bedrockClient.middlewareStack.add(
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

  return bedrockClient;
};

const dynamoClient = new DynamoDBClient({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

const docClient = DynamoDBDocumentClient.from(dynamoClient);

// ============================================
// FETCH MEALS FROM LIBRARY
// ============================================
async function fetchMealsFromLibrary() {
  try {
    const scanCommand = new ScanCommand({
      TableName: "meals_library",
      Limit: 100,
    });
    
    const response = await docClient.send(scanCommand);
    return response.Items || [];
  } catch (error) {
    console.error("Error fetching meals from library:", error);
    return [];
  }
}

// ============================================
// SELECT RANDOM MEALS FROM LIBRARY
// ============================================
function selectRandomMealsFromLibrary(libraryMeals: any[], count: number, mealType: string) {
  const filtered = libraryMeals.filter(m => m.mealType === mealType);
  const shuffled = [...filtered].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

// ============================================
// CONVERT LIBRARY MEAL TO PLAN FORMAT
// ============================================
function convertLibraryMealToPlanFormat(libraryMeal: any, day: string) {
  return {
    day,
    meal_type: libraryMeal.mealType.charAt(0).toUpperCase() + libraryMeal.mealType.slice(1),
    name: libraryMeal.name,
    description: libraryMeal.description,
    image_prompt: `${libraryMeal.description} - ${libraryMeal.name}, beautifully plated on a white dish, natural lighting, high resolution, appetizing food photography`,
    ingredients: libraryMeal.ingredients.map((ing: any) => ({
      name: ing.name,
      amount: `${ing.quantity}${ing.unit}`
    })),
    instructions: libraryMeal.instructions,
    prep_time: libraryMeal.prepTime,
    cook_time: libraryMeal.cookTime,
    servings: libraryMeal.servings,
    nutrition: libraryMeal.nutrition
  };
}

export async function POST(request: NextRequest) {
  try {
    const { dietaryPreferences } = await request.json();

    // Step 1: Fetch WHOOP data
    const whoopResponse = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/whoop/historical-data?limit=14`,
      { headers: { "Content-Type": "application/json" } }
    );

    if (!whoopResponse.ok) {
      throw new Error("Failed to fetch WHOOP data");
    }

    const whoopData = await whoopResponse.json();
    
    // Step 2: Fetch meals from library
    console.log("[GENERATE] Fetching meals from library...");
    const libraryMeals = await fetchMealsFromLibrary();
    console.log(`[GENERATE] Found ${libraryMeals.length} meals in library`);

    // Step 3: Analyze WHOOP data
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

    // Step 4: Determine strategy - use library meals or generate new ones
    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    const mealTypes = ["breakfast", "lunch", "snacks", "dinner"];
    
    let generatedMeals: any[] = [];
    
    // Check if we have enough meals in library (at least 4 of each type)
    const hasEnoughMeals = mealTypes.every(type => {
      const count = libraryMeals.filter(m => m.mealType === type).length;
      return count >= 4;
    });

    if (hasEnoughMeals && libraryMeals.length >= 28) {
      // Strategy A: Use meals from library
      console.log("[GENERATE] Using meals from library (enough meals available)");
      
      days.forEach(day => {
        mealTypes.forEach(mealType => {
          const selectedMeals = selectRandomMealsFromLibrary(libraryMeals, 1, mealType);
          if (selectedMeals.length > 0) {
            generatedMeals.push(convertLibraryMealToPlanFormat(selectedMeals[0], day));
          }
        });
      });
      
      console.log(`[GENERATE] Selected ${generatedMeals.length} meals from library`);
    } else {
      // Strategy B: Generate new meals with Claude (use library as reference)
      console.log("[GENERATE] Generating new meals with Claude (insufficient library meals)");
      
      const libraryContext = libraryMeals.length > 0 
        ? `\n\nREFERENCE MEALS FROM LIBRARY (use as inspiration):\n${libraryMeals.slice(0, 10).map(m => `- ${m.name}: ${m.description}`).join('\n')}`
        : '';

      const systemPrompt = `You are an expert AI nutritionist and meal planner integrated with WHOOP health data.

WHOOP Data Summary (Last 14 Days):
- Average Recovery: ${whoopSummary.avgRecovery}%
- Average HRV: ${whoopSummary.avgHRV}ms
- Average Sleep Performance: ${whoopSummary.avgSleep}%
- Average Day Strain: ${whoopSummary.avgStrain}
- Average Daily Calories: ${whoopSummary.avgCalories} kcal

${dietaryPreferences ? `Dietary Preferences: ${dietaryPreferences}` : ''}${libraryContext}

CRITICAL REQUIREMENTS:
1. Generate EXACTLY 28 meals total: 4 meals per day × 7 days (Monday through Sunday)
2. Each day MUST have: Breakfast, Lunch, Snack, and Dinner
3. EVERY meal must include a descriptive "image_prompt" field for image generation
4. Ensure meal variety - no repeated meals across the week
5. Focus on high-protein, gut-healthy, recovery-focused meals
6. Adjust calories based on WHOOP metrics

IMAGE PROMPT GUIDELINES:
- Be specific about the dish appearance, plating, and main ingredients
- Include details like "served in a white ceramic bowl" or "plated on white dish"
- Mention key visual elements (garnish, sauce placement, protein presentation)

Return ONLY valid JSON in this exact format:
{
  "meals": [
    {
      "day": "Monday",
      "meal_type": "Breakfast",
      "name": "Meal Name",
      "description": "Brief description",
      "image_prompt": "Detailed visual description for image generation",
      "ingredients": [{"name": "Ingredient", "amount": "50g"}],
      "instructions": ["Step 1", "Step 2"],
      "prep_time": 10,
      "cook_time": 0,
      "servings": 1,
      "nutrition": {"calories": 400, "protein": 20, "carbs": 40, "fat": 15}
    }
  ]
}`;

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

      const response = await getBedrockClient().send(command);
      const rawText = response.output?.message?.content?.[0]?.text || "";

      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("Failed to parse Claude response");
      }

      const mealPlan = JSON.parse(jsonMatch[0]);
      generatedMeals = mealPlan.meals;
    }
    
    if (generatedMeals.length !== 28) {
      console.warn(`Generated ${generatedMeals.length} meals instead of 28`);
    }

    console.log(`[GENERATE] Successfully prepared ${generatedMeals.length} meals`);

    return NextResponse.json({
      status: "success",
      meals: generatedMeals,
      whoopSummary,
      usedLibrary: hasEnoughMeals && libraryMeals.length >= 28,
      message: `Generated ${generatedMeals.length} meals`,
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