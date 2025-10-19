import { NextRequest, NextResponse } from "next/server";
import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";

export const maxDuration = 300;
export const dynamic = 'force-dynamic';

const bedrockClient = new BedrockRuntimeClient({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

// Generate meals for a single day (4 meals)
async function generateMealsForDay(day: string, whoopSummary: string, dietaryPreferences: string) {
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
  const responseBody = JSON.parse(new TextDecoder().decode(response.body));
  
  let mealsText = responseBody.content[0].text;
  
  // Clean markdown if present
  mealsText = mealsText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
  
  const meals = JSON.parse(mealsText);
  
  // Add day and meal_type to each meal
  const mealTypes = ["Breakfast", "Lunch", "Snack", "Dinner"];
  return meals.map((meal: any, index: number) => ({
    ...meal,
    day,
    meal_type: mealTypes[index] || meal.meal_type || "Meal",
  }));
}

export async function POST(request: NextRequest) {
  try {
    const { dietaryPreferences = "", dayIndex } = await request.json();

    // Fetch WHOOP summary
    const whoopResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/whoop-summary`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    let whoopSummary = "";
    if (whoopResponse.ok) {
      const whoopData = await whoopResponse.json();
      whoopSummary = whoopData.summary || "";
    }

    // If dayIndex provided, generate only that day
    if (typeof dayIndex === 'number' && dayIndex >= 0 && dayIndex < DAYS.length) {
      const day = DAYS[dayIndex];
      console.log(`Generating meals for ${day}...`);
      
      const meals = await generateMealsForDay(day, whoopSummary, dietaryPreferences);
      
      return NextResponse.json({
        status: "success",
        meals,
        day,
        dayIndex,
        whoopSummary,
      });
    }

    // Generate all days sequentially
    console.log("Starting sequential meal generation for all 7 days...");
    const allMeals = [];

    for (let i = 0; i < DAYS.length; i++) {
      const day = DAYS[i];
      console.log(`Generating meals for ${day} (${i + 1}/7)...`);
      
      try {
        const meals = await generateMealsForDay(day, whoopSummary, dietaryPreferences);
        allMeals.push(...meals);
        console.log(`✓ Generated ${meals.length} meals for ${day}`);
        
        // Polite delay to avoid throttling
        if (i < DAYS.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (error) {
        console.error(`✗ Failed to generate meals for ${day}:`, error);
        throw error;
      }
    }

    console.log(`Successfully generated ${allMeals.length} meals across 7 days`);

    return NextResponse.json({
      status: "success",
      meals: allMeals,
      whoopSummary,
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