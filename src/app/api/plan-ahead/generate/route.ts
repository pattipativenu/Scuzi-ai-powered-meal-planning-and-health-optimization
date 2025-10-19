import { NextRequest, NextResponse } from "next/server";
import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";

export const maxDuration = 300;
export const dynamic = 'force-dynamic';

// Use Bearer Token authentication (matching generate-images route)
const getBedrockClient = () => {
  const bearerToken = process.env.AWS_BEARER_TOKEN_BEDROCK;
  
  if (!bearerToken) {
    console.error("[AUTH] AWS_BEARER_TOKEN_BEDROCK not found, falling back to credentials");
    return new BedrockRuntimeClient({
      region: process.env.AWS_REGION || "us-east-1",
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
      },
    });
  }
  
  console.log("[AUTH] Using Bearer Token authentication");
  const client = new BedrockRuntimeClient({
    region: process.env.AWS_REGION || "us-east-1",
  });

  client.middlewareStack.add(
    (next: any) => async (args: any) => {
      args.request.headers.Authorization = `Bearer ${bearerToken}`;
      return next(args);
    },
    {
      step: "build",
      name: "addBearerToken",
    }
  );

  return client;
};

const bedrockClient = getBedrockClient();

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

// Generate meals for a single day (4 meals)
async function generateMealsForDay(day: string, whoopSummary: string, dietaryPreferences: string) {
  try {
    console.log(`[GENERATE] Starting meal generation for ${day}`);
    
    const prompt = `Generate exactly 4 meals for ${day}: Breakfast, Lunch, Snack, and Dinner.

${whoopSummary}

${dietaryPreferences ? `Dietary preferences: ${dietaryPreferences}` : ''}

Each meal must include:
- name (concise, appetizing title)
- short description (1-2 sentences)
- prep_time (minutes)
- cook_time (minutes)
- servings (number)
- calories (estimated total)
- step-by-step instructions (maximum 8 steps, concise)
- ingredients (array with name, amount properties)
- nutrition (protein, carbs, fat, fiber in grams)

CRITICAL: Respond strictly in JSON array format with exactly 4 meal objects. No markdown, no explanation, just the JSON array.`;

    console.log(`[GENERATE] Calling Bedrock for ${day}...`);
    
    const command = new InvokeModelCommand({
      modelId: "anthropic.claude-3-5-sonnet-20241022-v2:0",
      contentType: "application/json",
      accept: "application/json",
      body: JSON.stringify({
        anthropic_version: "bedrock-2023-05-31",
        max_tokens: 7000,
        temperature: 0.7,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      }),
    });

    const response = await bedrockClient.send(command);
    console.log(`[GENERATE] Bedrock response received for ${day}`);
    
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    
    if (!responseBody || !responseBody.content || !responseBody.content[0]) {
      throw new Error("Invalid response structure from Bedrock");
    }
    
    let mealsText = responseBody.content[0].text;
    console.log(`[GENERATE] Raw response length: ${mealsText.length} characters`);
    
    // Clean markdown if present
    mealsText = mealsText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    
    console.log(`[GENERATE] Parsing JSON for ${day}...`);
    const meals = JSON.parse(mealsText);
    
    if (!Array.isArray(meals)) {
      throw new Error("Response is not an array");
    }
    
    if (meals.length !== 4) {
      console.warn(`[GENERATE] Warning: Expected 4 meals, got ${meals.length} for ${day}`);
    }
    
    // Add day and meal_type to each meal
    const mealTypes = ["Breakfast", "Lunch", "Snack", "Dinner"];
    const enrichedMeals = meals.map((meal: any, index: number) => ({
      ...meal,
      day,
      meal_type: mealTypes[index] || meal.meal_type || "Meal",
    }));
    
    console.log(`[GENERATE] ✓ Successfully generated ${enrichedMeals.length} meals for ${day}`);
    return enrichedMeals;
    
  } catch (error) {
    console.error(`[GENERATE] ✗ Error generating meals for ${day}:`, error);
    
    // Provide more specific error information
    if (error instanceof SyntaxError) {
      throw new Error(`JSON parsing failed for ${day}: ${error.message}`);
    }
    
    throw new Error(`Failed to generate meals for ${day}: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log("[API] Meal generation request received");
    
    const { dietaryPreferences = "", dayIndex } = await request.json();

    // Fetch WHOOP summary with better error handling
    console.log("[API] Fetching WHOOP summary...");
    let whoopSummary = "";
    
    try {
      const whoopResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/whoop-summary`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (whoopResponse.ok) {
        const whoopData = await whoopResponse.json();
        whoopSummary = whoopData.summary || "";
        console.log("[API] WHOOP summary fetched successfully");
      } else {
        console.warn("[API] WHOOP summary fetch failed, continuing without it");
      }
    } catch (error) {
      console.warn("[API] WHOOP summary error (continuing without it):", error);
      whoopSummary = "";
    }

    // If dayIndex provided, generate only that day
    if (typeof dayIndex === 'number' && dayIndex >= 0 && dayIndex < DAYS.length) {
      const day = DAYS[dayIndex];
      console.log(`[API] Generating meals for single day: ${day} (index ${dayIndex})`);
      
      const meals = await generateMealsForDay(day, whoopSummary, dietaryPreferences);
      
      console.log(`[API] ✓ Successfully generated ${meals.length} meals for ${day}`);
      
      return NextResponse.json({
        status: "success",
        meals,
        day,
        dayIndex,
        whoopSummary,
      });
    }

    // Generate all days sequentially
    console.log("[API] Starting sequential meal generation for all 7 days...");
    const allMeals = [];

    for (let i = 0; i < DAYS.length; i++) {
      const day = DAYS[i];
      console.log(`[API] Generating meals for ${day} (${i + 1}/7)...`);
      
      try {
        const meals = await generateMealsForDay(day, whoopSummary, dietaryPreferences);
        allMeals.push(...meals);
        console.log(`[API] ✓ Generated ${meals.length} meals for ${day}`);
        
        // Polite delay to avoid throttling
        if (i < DAYS.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (error) {
        console.error(`[API] ✗ Failed to generate meals for ${day}:`, error);
        throw error;
      }
    }

    console.log(`[API] ✓ Successfully generated ${allMeals.length} meals across 7 days`);

    return NextResponse.json({
      status: "success",
      meals: allMeals,
      whoopSummary,
    });
  } catch (error) {
    console.error("[API] Fatal error:", error);
    
    // Return detailed error information
    return NextResponse.json(
      {
        status: "error",
        message: error instanceof Error ? error.message : "Failed to generate meals",
        details: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}