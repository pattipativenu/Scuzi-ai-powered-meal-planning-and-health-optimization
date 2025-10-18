import { NextRequest, NextResponse } from "next/server";
import {
  BedrockRuntimeClient,
  ConverseCommand,
} from "@aws-sdk/client-bedrock-runtime";
import { mysqlPool } from "@/lib/mysql-config";
import { RowDataPacket } from "mysql2";

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

// ============================================
// FETCH WHOOP DATA FROM LAST 7-14 DAYS
// ============================================

async function fetchWhoopData(): Promise<any[]> {
  try {
    console.log("[WHOOP] Fetching last 14 days of data...");
    
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
    const startDate = fourteenDaysAgo.toISOString().split('T')[0];
    
    const query = `
      SELECT * FROM physiological_cycles
      WHERE Cycle_start_time >= ?
      ORDER BY Cycle_start_time DESC
      LIMIT 14
    `;
    
    const [rows] = await mysqlPool.execute<RowDataPacket[]>(query, [startDate]);
    
    console.log(`[WHOOP] Fetched ${rows.length} records`);
    return rows;
  } catch (error) {
    console.error("[WHOOP] Error fetching data:", error);
    throw error;
  }
}

// ============================================
// ANALYZE WHOOP DATA AND GENERATE SUMMARY
// ============================================

function analyzeWhoopData(data: any[]): string {
  if (data.length === 0) {
    return "No WHOOP data available. Generating general healthy meal plan.";
  }
  
  // Calculate averages
  const avgRecovery = data.reduce((sum, d) => sum + (d.Recovery_score || 0), 0) / data.length;
  const avgHRV = data.reduce((sum, d) => sum + (d.Heart_rate_variability_rmssd || 0), 0) / data.length;
  const avgStrain = data.reduce((sum, d) => sum + (d.Day_Strain || 0), 0) / data.length;
  const avgCalories = data.reduce((sum, d) => sum + (d.Energy_burned || 0), 0) / data.length;
  const avgSleep = data.reduce((sum, d) => sum + (d.Total_sleep_time || 0), 0) / data.length / 60; // Convert to hours
  const avgDeepSleep = data.reduce((sum, d) => sum + (d.Sleep_stage_total_slow_wave_sleep_time || 0), 0) / data.length;
  const avgREMSleep = data.reduce((sum, d) => sum + (d.Sleep_stage_total_rem_sleep_time || 0), 0) / data.length;
  const avgRestingHR = data.reduce((sum, d) => sum + (d.Resting_heart_rate || 0), 0) / data.length;
  
  return `
**WHOOP Performance Analysis (Last ${data.length} Days)**

**Recovery & Vitals:**
- Average Recovery Score: ${avgRecovery.toFixed(0)}%
- Average HRV: ${avgHRV.toFixed(0)} ms
- Average Resting Heart Rate: ${avgRestingHR.toFixed(0)} bpm

**Activity:**
- Average Daily Strain: ${avgStrain.toFixed(1)}
- Average Calories Burned: ${avgCalories.toFixed(0)} kcal/day

**Sleep Quality:**
- Average Sleep Duration: ${avgSleep.toFixed(1)} hours
- Average Deep Sleep: ${avgDeepSleep.toFixed(0)} minutes
- Average REM Sleep: ${avgREMSleep.toFixed(0)} minutes

**Performance Assessment:**
${avgRecovery < 40 ? "⚠️ LOW RECOVERY - User needs extra nutrition support and lighter meals" : ""}
${avgRecovery >= 40 && avgRecovery < 70 ? "⚡ MODERATE RECOVERY - Balanced nutrition needed" : ""}
${avgRecovery >= 70 ? "✅ HIGH RECOVERY - User is performing optimally" : ""}
${avgStrain > 15 ? "🔥 HIGH TRAINING LOAD - Increase protein and calorie intake" : ""}
${avgSleep < 7 ? "😴 SLEEP DEFICIT - Focus on sleep-promoting foods (magnesium, tryptophan)" : ""}
${avgCalories > 3000 ? "💪 HIGH ENERGY EXPENDITURE - Caloric surplus recommended" : ""}
${avgCalories < 2000 ? "🌱 LOW ACTIVITY - Maintain caloric balance" : ""}
  `.trim();
}

// ============================================
// SYSTEM PROMPT FOR MEAL GENERATION
// ============================================

const MEAL_GENERATION_PROMPT = `You are Scuzi, an expert AI nutritionist and meal planner with access to the user's WHOOP health data.

**Your Mission:**
Generate a complete 7-day personalized meal plan with 28 meals (Breakfast, Lunch, Snack, Dinner × 7 days) based on the user's WHOOP performance metrics.

**Meal Generation Rules:**
1. **Personalization**: Adjust calories, macros, and ingredients based on recovery, strain, sleep, and activity levels
2. **Dietary Balance**: Ensure each day has balanced nutrition (protein, carbs, healthy fats)
3. **Variety**: No repeated meals across the 7 days
4. **Practicality**: Realistic prep times, common ingredients, clear instructions
5. **Meal Categories**:
   - Breakfast: 300-500 calories, energy-boosting
   - Lunch: 400-600 calories, balanced macros
   - Snack: 150-250 calories, quick energy
   - Dinner: 500-700 calories, recovery-focused

**Output Format (CRITICAL - FOLLOW EXACTLY):**

{
  "meals": [
    {
      "day": "Monday",
      "meal_type": "Breakfast",
      "name": "Protein-Packed Oatmeal Bowl",
      "description": "Creamy oats with berries, almonds, and protein powder",
      "ingredients": [
        { "name": "Rolled oats", "amount": "1 cup" },
        { "name": "Protein powder", "amount": "1 scoop" },
        { "name": "Mixed berries", "amount": "1/2 cup" }
      ],
      "instructions": [
        "Cook oats with water or milk for 5 minutes",
        "Stir in protein powder",
        "Top with berries and almonds"
      ],
      "prep_time": 5,
      "cook_time": 10,
      "servings": 1,
      "nutrition": {
        "calories": 420,
        "protein": 28,
        "carbs": 52,
        "fat": 12
      },
      "image_prompt": "Protein oatmeal bowl with fresh berries and almonds, white bowl, natural lighting, 45-degree angle, appetizing, high resolution"
    }
  ]
}

**CRITICAL RULES:**
- Generate EXACTLY 28 meals (7 days × 4 meal types)
- Every meal MUST have: day, meal_type, name, description, ingredients, instructions, prep_time, cook_time, servings, nutrition, image_prompt
- Days: Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday
- Meal types: Breakfast, Lunch, Snack, Dinner (capitalize first letter)
- Return ONLY valid JSON, no markdown, no extra text
- Nutrition must include: calories, protein, carbs, fat (all numbers)
- Image prompt should be concise, descriptive, restaurant-quality food photography style`;

// ============================================
// RETRY LOGIC WITH EXPONENTIAL BACKOFF
// ============================================

async function retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error | undefined;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[RETRY] Attempt ${attempt}/${maxRetries}`);
      return await operation();
    } catch (error) {
      lastError = error as Error;
      console.error(`[RETRY] Attempt ${attempt} failed:`, error);
      
      if (attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt - 1);
        console.log(`[RETRY] Waiting ${delay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError || new Error("Operation failed after all retries");
}

// ============================================
// MAIN API ROUTE
// ============================================

export async function POST(request: NextRequest) {
  console.log("[MEAL GEN] Request received");
  
  try {
    const { dietaryPreferences } = await request.json();
    
    console.log("[MEAL GEN] Dietary preferences:", dietaryPreferences);
    
    // ============================================
    // STEP 1: FETCH WHOOP DATA
    // ============================================
    
    const whoopData = await fetchWhoopData();
    const whoopSummary = analyzeWhoopData(whoopData);
    
    console.log("[MEAL GEN] WHOOP summary generated");
    
    // ============================================
    // STEP 2: BUILD CLAUDE PROMPT
    // ============================================
    
    let userPrompt = `${whoopSummary}

**Dietary Preferences:**
${dietaryPreferences || "None specified - all food types allowed"}

**Task:**
Generate a complete 7-day meal plan (28 meals total) personalized to the user's WHOOP metrics above.

Respond with ONLY the JSON object in the exact format specified. No markdown, no explanations, just the JSON.`;

    // ============================================
    // STEP 3: CALL CLAUDE WITH RETRY LOGIC
    // ============================================
    
    const response = await retryOperation(async () => {
      const command = new ConverseCommand({
        modelId: "us.anthropic.claude-3-5-sonnet-20241022-v2:0",
        messages: [
          {
            role: "user",
            content: [{ text: userPrompt }],
          },
        ],
        system: [{ text: MEAL_GENERATION_PROMPT }],
        inferenceConfig: {
          maxTokens: 8000,
          temperature: 0.8,
          topP: 0.9,
        },
      });

      return await client.send(command);
    }, 3, 2000);

    console.log("[MEAL GEN] Claude response received");

    // ============================================
    // STEP 4: EXTRACT AND PARSE RESPONSE
    // ============================================

    let responseText = "";

    if (response.output?.message?.content) {
      for (const block of response.output.message.content) {
        if ("text" in block && block.text) {
          responseText += block.text;
        }
      }
    }

    console.log(`[MEAL GEN] Response length: ${responseText.length} characters`);
    
    // Clean response (remove markdown code blocks if present)
    responseText = responseText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    
    // Parse JSON
    let mealsData;
    try {
      mealsData = JSON.parse(responseText);
    } catch (parseError) {
      console.error("[MEAL GEN] JSON parse error:", parseError);
      console.error("[MEAL GEN] Response text:", responseText.substring(0, 500));
      throw new Error("Failed to parse meal plan JSON from AI response");
    }
    
    // Validate structure
    if (!mealsData.meals || !Array.isArray(mealsData.meals)) {
      throw new Error("Invalid meal plan structure: missing 'meals' array");
    }
    
    if (mealsData.meals.length !== 28) {
      console.warn(`[MEAL GEN] Expected 28 meals, got ${mealsData.meals.length}`);
    }
    
    console.log(`[MEAL GEN] Successfully generated ${mealsData.meals.length} meals`);

    // ============================================
    // STEP 5: RETURN MEAL PLAN
    // ============================================

    return NextResponse.json({
      status: "success",
      meals: mealsData.meals,
      whoopSummary: whoopSummary,
      generatedAt: new Date().toISOString(),
    });

  } catch (error) {
    console.error("[MEAL GEN] Fatal error:", error);
    
    return NextResponse.json(
      {
        status: "error",
        message: "Failed to generate meal plan",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}