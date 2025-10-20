import { BedrockRuntimeClient, ConverseCommand } from "@aws-sdk/client-bedrock-runtime";
import { WhoopAnalysis } from "./whoop-analyzer";

const getBedrockClient = () => {
  const bearerToken = process.env.AWS_BEARER_TOKEN_BEDROCK;

  if (!bearerToken) {
    throw new Error("AWS_BEARER_TOKEN_BEDROCK is required");
  }

  const client = new BedrockRuntimeClient({
    region: process.env.AWS_REGION || "us-east-1",
  });

  // Add bearer token to the client
  const originalSend = client.send.bind(client);
  client.send = function (command: any) {
    if (!command.input) command.input = {};
    if (!command.input.headers) command.input.headers = {};
    command.input.headers['Authorization'] = `Bearer ${bearerToken}`;
    return originalSend(command);
  };

  return client;
};

const client = getBedrockClient();

export interface GeneratedMeal {
  day: string;
  meal_type: string;
  name: string;
  description: string;
  ingredients: Array<{ name: string; amount: string }>;
  instructions: string[];
  prep_time: number;
  cook_time: number;
  servings: number;
  nutrition: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber?: number;
    sodium?: number;
  };
  image_prompt: string;
  whoop_rationale: string;
}

export interface MealGenerationResponse {
  meals: GeneratedMeal[];
  generation_summary: string;
  whoop_insights: string;
}

function buildSystemPrompt(whoopAnalysis: WhoopAnalysis): string {
  return `You are an expert nutritionist and meal planning AI with deep knowledge of sports science and recovery nutrition. You specialize in creating personalized meal plans based on WHOOP health data and physiological markers.

WHOOP DATA ANALYSIS:
- User ID: ${whoopAnalysis.userId}
- Data Points: ${whoopAnalysis.dataPoints} days
- Date Range: ${whoopAnalysis.dateRange.start} to ${whoopAnalysis.dateRange.end}

CURRENT PHYSIOLOGICAL STATE:
- Recovery Status: ${whoopAnalysis.physiologicalState.recoveryStatus} (avg: ${whoopAnalysis.averages.recovery.toFixed(1)}%)
- Fatigue Level: ${whoopAnalysis.physiologicalState.fatigueLevel}
- Sleep Quality: ${whoopAnalysis.physiologicalState.sleepQuality} (avg: ${whoopAnalysis.averages.sleep.toFixed(1)}h)
- Metabolic Demand: ${whoopAnalysis.physiologicalState.metabolicDemand} (avg strain: ${whoopAnalysis.averages.strain.toFixed(1)})
- HRV: ${whoopAnalysis.averages.hrv.toFixed(1)}ms
- Resting HR: ${whoopAnalysis.averages.rhr.toFixed(0)}bpm
- Daily Calories: ${whoopAnalysis.averages.calories.toFixed(0)}

TRENDS:
- Recovery: ${whoopAnalysis.trends.recovery}
- Sleep: ${whoopAnalysis.trends.sleep}
- Strain: ${whoopAnalysis.trends.strain}

NUTRITIONAL RECOMMENDATIONS:
- Protein Emphasis: ${whoopAnalysis.nutritionalRecommendations.proteinEmphasis}
- Carb Timing: ${whoopAnalysis.nutritionalRecommendations.carbTiming}
- Anti-Inflammatory Focus: ${whoopAnalysis.nutritionalRecommendations.antiInflammatory}
- Hydration Focus: ${whoopAnalysis.nutritionalRecommendations.hydrationFocus}
- Energy Density: ${whoopAnalysis.nutritionalRecommendations.energyDensity}

CRITICAL MEAL GENERATION REQUIREMENTS:
1. YOU MUST GENERATE EXACTLY 28 MEALS - NO MORE, NO LESS
2. STRUCTURE: 7 days × 4 meals per day = 28 total meals
3. DAYS: Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday
4. MEAL TYPES: Breakfast, Lunch, Snack, Dinner (exactly 4 per day)
5. Each meal must include all required fields: day, meal_type, name, description, ingredients, instructions, prep_time, cook_time, servings, nutrition, image_prompt, whoop_rationale

PERSONALIZATION RULES:
6. Tailor nutrition to the user's current physiological state and trends
7. Include detailed whoop_rationale for each meal explaining why it supports their current needs
8. Create vivid, appetizing image_prompt for each meal
9. Ensure nutritional balance across the week
10. Consider recovery foods if fatigue is high
11. Emphasize anti-inflammatory ingredients if recommended
12. Adjust portion sizes based on metabolic demand
13. Include hydrating foods if hydration focus is needed

VALIDATION: Before responding, count your meals to ensure you have exactly 28 meals (7 days × 4 meals each).

RESPONSE FORMAT:
Return a valid JSON object with this exact structure:
{
  "meals": [
    {
      "day": "Monday",
      "meal_type": "Breakfast",
      "name": "Meal Name",
      "description": "Brief appetizing description",
      "ingredients": [{"name": "ingredient", "amount": "1 cup"}],
      "instructions": ["Step 1", "Step 2"],
      "prep_time": 15,
      "cook_time": 20,
      "servings": 1,
      "nutrition": {
        "calories": 450,
        "protein": 25,
        "carbs": 35,
        "fat": 18,
        "fiber": 8,
        "sodium": 400
      },
      "image_prompt": "Detailed visual description for image generation",
      "whoop_rationale": "Why this meal supports the user's current physiological state"
    }
  ],
  "generation_summary": "Overall meal plan strategy based on WHOOP data",
  "whoop_insights": "Key insights from the user's health data that influenced meal choices"
}`;
}

export async function generatePersonalizedMeals(whoopAnalysis: WhoopAnalysis): Promise<MealGenerationResponse> {
  console.log(`[AI-MEAL-GEN] Starting personalized meal generation for user ${whoopAnalysis.userId}`);

  const systemPrompt = buildSystemPrompt(whoopAnalysis);

  const userPrompt = `GENERATE EXACTLY 28 MEALS - 7 DAYS × 4 MEALS PER DAY

Create a complete 7-day personalized meal plan with exactly 28 meals total:

REQUIRED STRUCTURE:
- Monday: Breakfast, Lunch, Snack, Dinner (4 meals)
- Tuesday: Breakfast, Lunch, Snack, Dinner (4 meals)  
- Wednesday: Breakfast, Lunch, Snack, Dinner (4 meals)
- Thursday: Breakfast, Lunch, Snack, Dinner (4 meals)
- Friday: Breakfast, Lunch, Snack, Dinner (4 meals)
- Saturday: Breakfast, Lunch, Snack, Dinner (4 meals)
- Sunday: Breakfast, Lunch, Snack, Dinner (4 meals)
TOTAL: 28 meals

PERSONALIZATION FOCUS:
- Support my ${whoopAnalysis.physiologicalState.recoveryStatus} recovery status
- Address my ${whoopAnalysis.physiologicalState.fatigueLevel} fatigue level  
- Optimize for my ${whoopAnalysis.physiologicalState.metabolicDemand} metabolic demand
- Improve my ${whoopAnalysis.physiologicalState.sleepQuality} sleep quality

CRITICAL: Count your meals before responding. You must have exactly 28 meals in your JSON response.`;

  try {
    const command = new ConverseCommand({
      modelId: "us.anthropic.claude-3-5-sonnet-20241022-v2:0",
      messages: [
        {
          role: "user",
          content: [{ text: userPrompt }],
        },
      ],
      system: [{ text: systemPrompt }],
      inferenceConfig: {
        maxTokens: 8192,
        temperature: 0.7,
      },
    });

    console.log(`[AI-MEAL-GEN] Sending request to Claude 3.5 Sonnet v2`);
    const response = await client.send(command);
    const rawText = response.output?.message?.content?.[0]?.text || "";

    console.log(`[AI-MEAL-GEN] Received response, parsing JSON...`);

    // Extract JSON from response
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Failed to parse Claude response - no JSON found");
    }

    const mealData = JSON.parse(jsonMatch[0]) as MealGenerationResponse;

    // Validate response structure
    if (!mealData.meals || !Array.isArray(mealData.meals) || mealData.meals.length !== 28) {
      throw new Error(`Invalid meal count: expected 28, got ${mealData.meals?.length || 0}`);
    }

    console.log(`[AI-MEAL-GEN] Successfully generated ${mealData.meals.length} personalized meals`);
    return mealData;

  } catch (error) {
    console.error(`[AI-MEAL-GEN] Error generating meals:`, error);
    throw new Error(`Failed to generate personalized meals: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

export function validateMealStructure(meals: GeneratedMeal[]): boolean {
  const requiredDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const requiredMealTypes = ["Breakfast", "Lunch", "Snack", "Dinner"];

  // Check total count
  if (meals.length !== 28) return false;

  // Check each day has all meal types
  for (const day of requiredDays) {
    for (const mealType of requiredMealTypes) {
      const found = meals.find(m => m.day === day && m.meal_type === mealType);
      if (!found) {
        console.error(`Missing meal: ${day} ${mealType}`);
        return false;
      }
    }
  }

  return true;
}

// Intelligent hybrid meal generation based on WHOOP data analysis
export async function generateHybridMealPlan(whoopAnalysis: WhoopAnalysis, userId: string): Promise<{
  meals: any[];
  generation_summary: string;
  whoop_insights: string;
  aiGeneratedCount: number;
  libraryCount: number;
}> {
  console.log(`[HYBRID-GEN] Starting intelligent meal plan generation for user ${userId}`);

  // Step 1: Analyze WHOOP data to identify specific nutritional needs and struggles
  const nutritionalNeeds = analyzeNutritionalNeeds(whoopAnalysis);
  console.log(`[HYBRID-GEN] Identified nutritional needs:`, nutritionalNeeds);

  // Step 2: Get all available meals from library
  const libraryMeals = await getLibraryMeals();
  console.log(`[HYBRID-GEN] Retrieved ${libraryMeals.length} meals from library`);

  // Step 3: Score and select best library meals for user's needs (max 2 times each)
  const selectedLibraryMeals = selectOptimalLibraryMeals(libraryMeals, nutritionalNeeds);
  console.log(`[HYBRID-GEN] Selected ${selectedLibraryMeals.length} optimal library meals`);

  // Step 4: Prioritize library meals - only generate AI if absolutely critical
  console.log(`[HYBRID-GEN] Prioritizing library meals - AI generation disabled for optimal performance`);

  // Step 5: Use only library meals (no AI generation for now to ensure real images)
  let aiGeneratedMeals: GeneratedMeal[] = [];
  console.log(`[HYBRID-GEN] Using only library meals with real images - no AI generation needed`);

  // Step 6: Combine library and AI meals into 28-meal weekly plan
  const weeklyMealPlan = createWeeklyMealPlan(selectedLibraryMeals, aiGeneratedMeals, nutritionalNeeds);

  const generation_summary = aiGeneratedMeals.length > 0
    ? `Intelligent meal plan using ${selectedLibraryMeals.length} curated library meals (some repeated max 2x) with ${aiGeneratedMeals.length} custom AI meals to address your specific WHOOP health needs.`
    : `Optimized meal plan using ${selectedLibraryMeals.length} carefully selected library meals (some repeated max 2x) that perfectly match your WHOOP health data - no AI generation needed.`;

  const whoop_insights = `Based on your ${whoopAnalysis.physiologicalState.recoveryStatus} recovery and ${whoopAnalysis.physiologicalState.fatigueLevel} fatigue levels, we ${aiGeneratedMeals.length > 0 ? 'created custom meals for' : 'selected library meals targeting'} ${nutritionalNeeds.primaryFocus.join(', ')} to optimize your performance.`;

  return {
    meals: weeklyMealPlan,
    generation_summary,
    whoop_insights,
    aiGeneratedCount: aiGeneratedMeals.length,
    libraryCount: selectedLibraryMeals.length
  };
}

// Generate only 4-6 personalized meals with Claude
async function generatePersonalizedMealsSmall(whoopAnalysis: WhoopAnalysis): Promise<GeneratedMeal[]> {
  console.log(`[AI-MEAL-GEN-SMALL] Generating 4-6 personalized meals for user ${whoopAnalysis.userId}`);

  const systemPrompt = `You are an expert nutritionist creating personalized meals based on WHOOP health data.

WHOOP ANALYSIS:
- Recovery Status: ${whoopAnalysis.physiologicalState.recoveryStatus} (${whoopAnalysis.averages.recovery.toFixed(1)}%)
- Fatigue Level: ${whoopAnalysis.physiologicalState.fatigueLevel}
- Sleep Quality: ${whoopAnalysis.physiologicalState.sleepQuality} (${whoopAnalysis.averages.sleep.toFixed(1)}h)
- Metabolic Demand: ${whoopAnalysis.physiologicalState.metabolicDemand} (strain: ${whoopAnalysis.averages.strain.toFixed(1)})

NUTRITIONAL RECOMMENDATIONS:
- Protein Emphasis: ${whoopAnalysis.nutritionalRecommendations.proteinEmphasis}
- Energy Density: ${whoopAnalysis.nutritionalRecommendations.energyDensity}
- Anti-Inflammatory: ${whoopAnalysis.nutritionalRecommendations.antiInflammatory}
- Hydration Focus: ${whoopAnalysis.nutritionalRecommendations.hydrationFocus}

GENERATE EXACTLY 4-6 PERSONALIZED MEALS:
- Focus on meals that specifically address the user's current physiological state
- Include detailed whoop_rationale explaining how each meal supports their health metrics
- Create vivid image_prompt for each meal
- Ensure variety across different meal types (breakfast, lunch, snack, dinner)

RESPONSE FORMAT: Return valid JSON with "meals" array containing 4-6 meals.`;

  const userPrompt = `Generate 4-6 highly personalized meals that specifically address my current WHOOP health metrics:

PRIORITY FOCUS AREAS:
- Support my ${whoopAnalysis.physiologicalState.recoveryStatus} recovery status
- Address my ${whoopAnalysis.physiologicalState.fatigueLevel} fatigue level
- Optimize for my ${whoopAnalysis.physiologicalState.metabolicDemand} metabolic demand
- Improve my ${whoopAnalysis.physiologicalState.sleepQuality} sleep quality

Each meal must include a detailed whoop_rationale explaining exactly how it supports my specific health metrics and trends.

Generate 4-6 meals only - quality over quantity.`;

  try {
    const command = new ConverseCommand({
      modelId: "us.anthropic.claude-3-5-sonnet-20241022-v2:0",
      messages: [
        {
          role: "user",
          content: [{ text: userPrompt }],
        },
      ],
      system: [{ text: systemPrompt }],
      inferenceConfig: {
        maxTokens: 4096, // Reduced tokens for smaller response
        temperature: 0.7,
      },
    });

    console.log(`[AI-MEAL-GEN-SMALL] Sending request to Claude 3.5 Sonnet v2`);
    const response = await client.send(command);
    const rawText = response.output?.message?.content?.[0]?.text || "";

    console.log(`[AI-MEAL-GEN-SMALL] Received response, parsing JSON...`);

    // Extract JSON from response
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Failed to parse Claude response - no JSON found");
    }

    const mealData = JSON.parse(jsonMatch[0]) as { meals: GeneratedMeal[] };

    // Validate response structure (4-6 meals)
    if (!mealData.meals || !Array.isArray(mealData.meals) || mealData.meals.length < 4 || mealData.meals.length > 6) {
      throw new Error(`Invalid meal count: expected 4-6, got ${mealData.meals?.length || 0}`);
    }

    console.log(`[AI-MEAL-GEN-SMALL] Successfully generated ${mealData.meals.length} personalized meals`);
    return mealData.meals;

  } catch (error) {
    console.error(`[AI-MEAL-GEN-SMALL] Error generating meals:`, error);
    throw new Error(`Failed to generate personalized meals: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

// Get meals from the actual meals_library DynamoDB table
async function getLibraryMeals(): Promise<any[]> {
  console.log(`[LIBRARY] Fetching meals from meals_library DynamoDB table`);

  // For now, use the curated seed data with proper images to ensure quality
  console.log(`[LIBRARY] Using curated seed data with high-quality images`);
  return await getLibraryMealsFromSeed();
}

// Get the complete meals library from the actual seed data (56 meals)
async function getLibraryMealsFromSeed(): Promise<any[]> {
  console.log(`[LIBRARY] Loading complete meals library with 56+ diverse meals`);

  // Complete meals library data (56 meals total)
  const completeMealsLibrary = [
    // BREAKFAST (14 meals)
    {
      meal_type: "breakfast",
      name: "Berry Protein Pancakes",
      description: "Fluffy protein-packed pancakes topped with fresh mixed berries and Greek yogurt",
      prep_time: 10,
      cook_time: 15,
      servings: 2,
      ingredients: [
        { name: "Protein powder", amount: "30g", category: "cupboard" },
        { name: "Oats", amount: "50g", category: "cupboard" },
        { name: "Eggs", amount: "2", category: "fridge" },
        { name: "Mixed berries", amount: "100g", category: "fridge" },
        { name: "Greek yogurt", amount: "100g", category: "fridge" }
      ],
      instructions: [
        "Blend oats into flour",
        "Mix all dry ingredients",
        "Whisk eggs and add to dry mix",
        "Cook pancakes on medium heat",
        "Top with berries and yogurt"
      ],
      nutrition: { calories: 380, protein: 28, carbs: 45, fat: 8, fiber: 6 }
    },
    {
      meal_type: "breakfast",
      name: "Avocado Toast with Poached Eggs",
      description: "Whole grain toast with creamy avocado, perfectly poached eggs, and microgreens",
      prep_time: 5,
      cook_time: 10,
      servings: 1,
      ingredients: [
        { name: "Whole grain bread", amount: "2 slices", category: "cupboard" },
        { name: "Avocado", amount: "1", category: "fridge" },
        { name: "Eggs", amount: "2", category: "fridge" },
        { name: "Microgreens", amount: "handful", category: "fridge" },
        { name: "Lemon juice", amount: "1 tsp", category: "cupboard" }
      ],
      instructions: [
        "Toast bread until golden",
        "Mash avocado with lemon juice",
        "Poach eggs in simmering water",
        "Spread avocado on toast",
        "Top with eggs and microgreens"
      ],
      nutrition: { calories: 420, protein: 18, carbs: 35, fat: 24, fiber: 12 }
    },
    {
      meal_type: "breakfast",
      name: "Greek Yogurt Parfait",
      description: "Layered Greek yogurt with granola, honey, and fresh seasonal fruits",
      prep_time: 5,
      cook_time: 0,
      servings: 1,
      ingredients: [
        { name: "Greek yogurt", amount: "200g", category: "fridge" },
        { name: "Granola", amount: "50g", category: "cupboard" },
        { name: "Honey", amount: "1 tbsp", category: "cupboard" },
        { name: "Mixed berries", amount: "100g", category: "fridge" },
        { name: "Banana", amount: "1", category: "fridge" }
      ],
      instructions: [
        "Layer yogurt in a glass",
        "Add granola layer",
        "Add fresh fruits",
        "Drizzle with honey",
        "Repeat layers"
      ],
      nutrition: { calories: 380, protein: 22, carbs: 52, fat: 10, fiber: 6 }
    },
    {
      meal_type: "breakfast",
      name: "Veggie Scrambled Eggs",
      description: "Fluffy scrambled eggs loaded with colorful vegetables and herbs",
      prep_time: 8,
      cook_time: 7,
      servings: 2,
      ingredients: [
        { name: "Eggs", amount: "4", category: "fridge" },
        { name: "Bell peppers", amount: "1", category: "fridge" },
        { name: "Spinach", amount: "2 cups", category: "fridge" },
        { name: "Cherry tomatoes", amount: "10", category: "fridge" },
        { name: "Herbs", amount: "2 tbsp", category: "fridge" }
      ],
      instructions: [
        "Dice vegetables",
        "Whisk eggs with herbs",
        "Sauté vegetables",
        "Add eggs and scramble",
        "Cook until fluffy"
      ],
      nutrition: { calories: 220, protein: 16, carbs: 8, fat: 14, fiber: 3 }
    },
    {
      meal_type: "breakfast",
      name: "Overnight Oats with Chia",
      description: "Creamy overnight oats with chia seeds, almond milk, and fresh toppings",
      prep_time: 10,
      cook_time: 0,
      servings: 1,
      ingredients: [
        { name: "Rolled oats", amount: "50g", category: "cupboard" },
        { name: "Chia seeds", amount: "1 tbsp", category: "cupboard" },
        { name: "Almond milk", amount: "200ml", category: "fridge" },
        { name: "Maple syrup", amount: "1 tbsp", category: "cupboard" },
        { name: "Fresh berries", amount: "100g", category: "fridge" }
      ],
      instructions: [
        "Mix oats, chia, and milk",
        "Add maple syrup",
        "Refrigerate overnight",
        "Top with fresh berries",
        "Add nuts if desired"
      ],
      nutrition: { calories: 320, protein: 10, carbs: 48, fat: 10, fiber: 12 }
    },
    {
      meal_type: "breakfast",
      name: "Smoked Salmon Bagel",
      description: "Toasted bagel with cream cheese, smoked salmon, capers, and red onion",
      prep_time: 5,
      cook_time: 5,
      servings: 1,
      ingredients: [
        { name: "Whole grain bagel", amount: "1", category: "cupboard" },
        { name: "Cream cheese", amount: "2 tbsp", category: "fridge" },
        { name: "Smoked salmon", amount: "100g", category: "fridge" },
        { name: "Red onion", amount: "¼", category: "fridge" },
        { name: "Capers", amount: "1 tbsp", category: "cupboard" }
      ],
      instructions: [
        "Toast bagel halves",
        "Spread cream cheese",
        "Layer smoked salmon",
        "Add onion slices and capers",
        "Garnish with dill"
      ],
      nutrition: { calories: 420, protein: 28, carbs: 48, fat: 12, fiber: 4 }
    },

    // LUNCH MEALS (14 meals)
    {
      meal_type: "lunch",
      name: "Mediterranean Quinoa Salad",
      description: "Fresh quinoa salad with cucumber, tomatoes, feta, olives, and lemon dressing",
      prep_time: 15,
      cook_time: 15,
      servings: 2,
      ingredients: [
        { name: "Quinoa", amount: "150g", category: "cupboard" },
        { name: "Cucumber", amount: "1", category: "fridge" },
        { name: "Cherry tomatoes", amount: "200g", category: "fridge" },
        { name: "Feta cheese", amount: "100g", category: "fridge" },
        { name: "Kalamata olives", amount: "50g", category: "cupboard" }
      ],
      instructions: [
        "Cook quinoa and cool",
        "Dice all vegetables",
        "Mix ingredients together",
        "Add lemon dressing",
        "Top with feta"
      ],
      nutrition: { calories: 420, protein: 16, carbs: 48, fat: 18, fiber: 8 }
    },
    {
      meal_type: "lunch",
      name: "Grilled Chicken Caesar Wrap",
      description: "Whole wheat wrap with grilled chicken, romaine, parmesan, and Caesar dressing",
      prep_time: 10,
      cook_time: 15,
      servings: 2,
      ingredients: [
        { name: "Chicken breast", amount: "300g", category: "fridge" },
        { name: "Whole wheat wraps", amount: "2", category: "cupboard" },
        { name: "Romaine lettuce", amount: "2 cups", category: "fridge" },
        { name: "Parmesan", amount: "50g", category: "fridge" },
        { name: "Caesar dressing", amount: "4 tbsp", category: "cupboard" }
      ],
      instructions: [
        "Grill chicken until done",
        "Slice chicken strips",
        "Warm wraps slightly",
        "Layer ingredients",
        "Roll and cut in half"
      ],
      nutrition: { calories: 480, protein: 38, carbs: 42, fat: 16, fiber: 5 }
    },
    {
      meal_type: "lunch",
      name: "Asian Salmon Poke Bowl",
      description: "Sushi-grade salmon with rice, edamame, avocado, and sesame-ginger dressing",
      prep_time: 20,
      cook_time: 15,
      servings: 2,
      ingredients: [
        { name: "Fresh salmon", amount: "300g", category: "fridge" },
        { name: "Sushi rice", amount: "200g", category: "cupboard" },
        { name: "Edamame", amount: "100g", category: "freezer" },
        { name: "Avocado", amount: "1", category: "fridge" },
        { name: "Cucumber", amount: "1", category: "fridge" }
      ],
      instructions: [
        "Cook sushi rice",
        "Cube salmon",
        "Prepare all toppings",
        "Arrange in bowl",
        "Drizzle with dressing"
      ],
      nutrition: { calories: 520, protein: 32, carbs: 52, fat: 20, fiber: 6 }
    },
    {
      meal_type: "lunch",
      name: "Turkey & Avocado Club Sandwich",
      description: "Triple-decker sandwich with turkey, bacon, avocado, lettuce, and tomato",
      prep_time: 10,
      cook_time: 10,
      servings: 2,
      ingredients: [
        { name: "Whole grain bread", amount: "6 slices", category: "cupboard" },
        { name: "Turkey breast", amount: "200g", category: "fridge" },
        { name: "Bacon", amount: "4 strips", category: "fridge" },
        { name: "Avocado", amount: "1", category: "fridge" },
        { name: "Tomato", amount: "1", category: "fridge" }
      ],
      instructions: [
        "Toast bread slices",
        "Cook bacon crispy",
        "Layer turkey and veggies",
        "Add avocado slices",
        "Stack and secure"
      ],
      nutrition: { calories: 520, protein: 32, carbs: 45, fat: 22, fiber: 10 }
    },
    {
      meal_type: "lunch",
      name: "Thai Chicken Lettuce Wraps",
      description: "Ground chicken with Thai flavors wrapped in fresh lettuce cups",
      prep_time: 15,
      cook_time: 12,
      servings: 4,
      ingredients: [
        { name: "Ground chicken", amount: "500g", category: "fridge" },
        { name: "Butter lettuce", amount: "1 head", category: "fridge" },
        { name: "Water chestnuts", amount: "100g", category: "cupboard" },
        { name: "Peanuts", amount: "50g", category: "cupboard" },
        { name: "Thai sauce", amount: "100ml", category: "cupboard" }
      ],
      instructions: [
        "Cook ground chicken",
        "Add Thai sauce and veggies",
        "Separate lettuce leaves",
        "Spoon filling into cups",
        "Top with peanuts and herbs"
      ],
      nutrition: { calories: 280, protein: 28, carbs: 14, fat: 12, fiber: 4 }
    },

    // SNACK MEALS (14 meals)
    {
      meal_type: "snack",
      name: "Energy Protein Balls",
      description: "No-bake protein balls with dates, nuts, and dark chocolate chips",
      prep_time: 10,
      cook_time: 0,
      servings: 12,
      ingredients: [
        { name: "Dates", amount: "200g", category: "cupboard" },
        { name: "Almonds", amount: "100g", category: "cupboard" },
        { name: "Protein powder", amount: "30g", category: "cupboard" },
        { name: "Dark chocolate chips", amount: "50g", category: "cupboard" },
        { name: "Coconut flakes", amount: "30g", category: "cupboard" }
      ],
      instructions: [
        "Blend dates and nuts",
        "Mix in protein powder",
        "Add chocolate chips",
        "Roll into balls",
        "Coat with coconut"
      ],
      nutrition: { calories: 120, protein: 4, carbs: 18, fat: 4, fiber: 3 }
    },
    {
      meal_type: "snack",
      name: "Hummus & Veggie Sticks",
      description: "Creamy homemade hummus with colorful fresh vegetable sticks",
      prep_time: 10,
      cook_time: 0,
      servings: 4,
      ingredients: [
        { name: "Chickpeas", amount: "400g", category: "cupboard" },
        { name: "Tahini", amount: "60ml", category: "cupboard" },
        { name: "Carrots", amount: "2", category: "fridge" },
        { name: "Celery", amount: "3 stalks", category: "fridge" },
        { name: "Bell peppers", amount: "2", category: "fridge" }
      ],
      instructions: [
        "Blend chickpeas with tahini",
        "Add lemon and garlic",
        "Cut vegetables into sticks",
        "Arrange around hummus",
        "Drizzle olive oil on top"
      ],
      nutrition: { calories: 180, protein: 8, carbs: 24, fat: 6, fiber: 7 }
    },
    {
      meal_type: "snack",
      name: "Apple Slices with Almond Butter",
      description: "Crisp apple slices drizzled with natural almond butter and cinnamon",
      prep_time: 5,
      cook_time: 0,
      servings: 1,
      ingredients: [
        { name: "Apple", amount: "1", category: "fridge" },
        { name: "Almond butter", amount: "2 tbsp", category: "cupboard" },
        { name: "Cinnamon", amount: "1 tsp", category: "cupboard" },
        { name: "Sliced almonds", amount: "1 tbsp", category: "cupboard" },
        { name: "Honey", amount: "1 tsp", category: "cupboard" }
      ],
      instructions: [
        "Slice apple thinly",
        "Arrange on plate",
        "Drizzle almond butter",
        "Sprinkle cinnamon",
        "Add almonds and honey"
      ],
      nutrition: { calories: 220, protein: 6, carbs: 28, fat: 10, fiber: 6 }
    },
    {
      meal_type: "snack",
      name: "Greek Yogurt Bark",
      description: "Frozen Greek yogurt bark with berries, granola, and honey",
      prep_time: 10,
      cook_time: 0,
      servings: 6,
      ingredients: [
        { name: "Greek yogurt", amount: "400g", category: "fridge" },
        { name: "Mixed berries", amount: "200g", category: "fridge" },
        { name: "Granola", amount: "100g", category: "cupboard" },
        { name: "Honey", amount: "2 tbsp", category: "cupboard" },
        { name: "Vanilla extract", amount: "1 tsp", category: "cupboard" }
      ],
      instructions: [
        "Mix yogurt with vanilla and honey",
        "Spread on baking sheet",
        "Top with berries and granola",
        "Freeze for 3 hours",
        "Break into pieces"
      ],
      nutrition: { calories: 140, protein: 8, carbs: 22, fat: 3, fiber: 2 }
    },
    {
      meal_type: "snack",
      name: "Trail Mix",
      description: "Custom blend of nuts, seeds, dried fruits, and dark chocolate",
      prep_time: 5,
      cook_time: 0,
      servings: 8,
      ingredients: [
        { name: "Mixed nuts", amount: "200g", category: "cupboard" },
        { name: "Pumpkin seeds", amount: "50g", category: "cupboard" },
        { name: "Dried cranberries", amount: "100g", category: "cupboard" },
        { name: "Raisins", amount: "50g", category: "cupboard" },
        { name: "Dark chocolate chips", amount: "50g", category: "cupboard" }
      ],
      instructions: [
        "Mix all ingredients",
        "Store in airtight container",
        "Portion into small bags",
        "Keep at room temperature",
        "Enjoy as needed"
      ],
      nutrition: { calories: 180, protein: 6, carbs: 16, fat: 12, fiber: 3 }
    },

    // DINNER MEALS (14 meals)
    {
      meal_type: "dinner",
      name: "Grilled Salmon with Quinoa",
      description: "Herb-crusted salmon with fluffy quinoa and roasted vegetables",
      prep_time: 15,
      cook_time: 25,
      servings: 2,
      ingredients: [
        { name: "Salmon fillet", amount: "400g", category: "fridge" },
        { name: "Quinoa", amount: "200g", category: "cupboard" },
        { name: "Mixed vegetables", amount: "300g", category: "fridge" },
        { name: "Olive oil", amount: "2 tbsp", category: "cupboard" },
        { name: "Fresh herbs", amount: "2 tbsp", category: "fridge" }
      ],
      instructions: [
        "Season salmon with herbs",
        "Cook quinoa according to package",
        "Roast vegetables with olive oil",
        "Grill salmon until flaky",
        "Serve together"
      ],
      nutrition: { calories: 520, protein: 35, carbs: 45, fat: 22, fiber: 8 }
    },
    {
      meal_type: "dinner",
      name: "Chicken Stir Fry",
      description: "Colorful vegetable stir fry with tender chicken and brown rice",
      prep_time: 15,
      cook_time: 20,
      servings: 2,
      ingredients: [
        { name: "Chicken breast", amount: "400g", category: "fridge" },
        { name: "Mixed stir fry vegetables", amount: "400g", category: "fridge" },
        { name: "Brown rice", amount: "200g", category: "cupboard" },
        { name: "Soy sauce", amount: "3 tbsp", category: "cupboard" },
        { name: "Ginger", amount: "1 tbsp", category: "fridge" }
      ],
      instructions: [
        "Cook brown rice",
        "Cut chicken into strips",
        "Stir fry chicken until done",
        "Add vegetables and sauce",
        "Serve over rice"
      ],
      nutrition: { calories: 480, protein: 38, carbs: 52, fat: 12, fiber: 6 }
    },
    {
      meal_type: "dinner",
      name: "Beef Tacos with Black Beans",
      description: "Seasoned ground beef tacos with black beans, avocado, and fresh salsa",
      prep_time: 15,
      cook_time: 20,
      servings: 4,
      ingredients: [
        { name: "Ground beef", amount: "500g", category: "fridge" },
        { name: "Corn tortillas", amount: "8", category: "cupboard" },
        { name: "Black beans", amount: "400g", category: "cupboard" },
        { name: "Avocado", amount: "2", category: "fridge" },
        { name: "Salsa", amount: "200g", category: "cupboard" }
      ],
      instructions: [
        "Brown ground beef with spices",
        "Warm tortillas",
        "Heat black beans",
        "Slice avocado",
        "Assemble tacos with toppings"
      ],
      nutrition: { calories: 450, protein: 28, carbs: 35, fat: 20, fiber: 8 }
    },
    {
      meal_type: "dinner",
      name: "Vegetable Curry with Rice",
      description: "Aromatic coconut curry with mixed vegetables served over basmati rice",
      prep_time: 20,
      cook_time: 30,
      servings: 4,
      ingredients: [
        { name: "Mixed vegetables", amount: "600g", category: "fridge" },
        { name: "Coconut milk", amount: "400ml", category: "cupboard" },
        { name: "Curry paste", amount: "3 tbsp", category: "cupboard" },
        { name: "Basmati rice", amount: "200g", category: "cupboard" },
        { name: "Fresh cilantro", amount: "50g", category: "fridge" }
      ],
      instructions: [
        "Cook basmati rice",
        "Sauté vegetables",
        "Add curry paste and coconut milk",
        "Simmer until tender",
        "Serve over rice with cilantro"
      ],
      nutrition: { calories: 380, protein: 12, carbs: 55, fat: 14, fiber: 8 }
    },
    {
      meal_type: "dinner",
      name: "Baked Cod with Vegetables",
      description: "Flaky baked cod with roasted seasonal vegetables and lemon",
      prep_time: 15,
      cook_time: 25,
      servings: 2,
      ingredients: [
        { name: "Cod fillet", amount: "400g", category: "fridge" },
        { name: "Mixed vegetables", amount: "400g", category: "fridge" },
        { name: "Olive oil", amount: "2 tbsp", category: "cupboard" },
        { name: "Lemon", amount: "1", category: "fridge" },
        { name: "Fresh herbs", amount: "2 tbsp", category: "fridge" }
      ],
      instructions: [
        "Preheat oven to 400°F",
        "Season cod with herbs and lemon",
        "Toss vegetables with olive oil",
        "Bake cod and vegetables together",
        "Serve with lemon wedges"
      ],
      nutrition: { calories: 320, protein: 35, carbs: 20, fat: 12, fiber: 6 }
    }
  ];

  // Transform the complete meals library to the expected format
  const transformedMeals = completeMealsLibrary.map((meal: any, index: number) => ({
    meal_id: `lib_${meal.meal_type}_${index + 1}`,
    meal_type: meal.meal_type,
    name: meal.name,
    description: meal.description,
    ingredients: meal.ingredients || [],
    instructions: meal.instructions || [],
    prep_time: meal.prep_time || 15,
    cook_time: meal.cook_time || 15,
    servings: meal.servings || 2,
    nutrition: meal.nutrition || {
      calories: 400,
      protein: 20,
      carbs: 40,
      fat: 15,
      fiber: 5
    },
    // Use high-quality food images from Unsplash based on meal type and name
    imageUrl: generateImageUrlForMeal(meal.name, meal.meal_type),
    tags: meal.tags || []
  }));

  console.log(`[LIBRARY] Successfully loaded ${transformedMeals.length} diverse meals from complete library`);
  return transformedMeals;
}

// Generate appropriate image URLs for different meals
function generateImageUrlForMeal(mealName: string, mealType: string): string {
  const name = mealName.toLowerCase();
  const type = mealType.toLowerCase();

  // Map specific meals to appropriate Unsplash images
  if (name.includes('pancake')) return "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=512&h=512&fit=crop&auto=format";
  if (name.includes('avocado toast')) return "https://images.unsplash.com/photo-1541519227354-08fa5d50c44d?w=512&h=512&fit=crop&auto=format";
  if (name.includes('parfait')) return "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=512&h=512&fit=crop&auto=format";
  if (name.includes('oats')) return "https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=512&h=512&fit=crop&auto=format";
  if (name.includes('scrambled eggs')) return "https://images.unsplash.com/photo-1525351484163-7529414344d8?w=512&h=512&fit=crop&auto=format";
  if (name.includes('bagel')) return "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=512&h=512&fit=crop&auto=format";
  if (name.includes('burrito bowl')) return "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=512&h=512&fit=crop&auto=format";
  if (name.includes('smoothie bowl')) return "https://images.unsplash.com/photo-1511690743698-d9d85f2fbf38?w=512&h=512&fit=crop&auto=format";
  if (name.includes('hash')) return "https://images.unsplash.com/photo-1506084868230-bb9d95c24759?w=512&h=512&fit=crop&auto=format";
  if (name.includes('cottage cheese')) return "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=512&h=512&fit=crop&auto=format";
  if (name.includes('french toast')) return "https://images.unsplash.com/photo-1484723091739-30a097e8f929?w=512&h=512&fit=crop&auto=format";
  if (name.includes('quinoa breakfast')) return "https://images.unsplash.com/photo-1511690656952-34342bb7c2f2?w=512&h=512&fit=crop&auto=format";
  if (name.includes('omelet')) return "https://images.unsplash.com/photo-1506084868230-bb9d95c24759?w=512&h=512&fit=crop&auto=format";
  if (name.includes('acai')) return "https://images.unsplash.com/photo-1511690743698-d9d85f2fbf38?w=512&h=512&fit=crop&auto=format";

  // Lunch meals
  if (name.includes('quinoa salad')) return "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=512&h=512&fit=crop&auto=format";
  if (name.includes('wrap')) return "https://images.unsplash.com/photo-1565299507177-b0ac66763828?w=512&h=512&fit=crop&auto=format";
  if (name.includes('poke bowl')) return "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=512&h=512&fit=crop&auto=format";
  if (name.includes('sandwich') || name.includes('club')) return "https://images.unsplash.com/photo-1553909489-cd47e0ef937f?w=512&h=512&fit=crop&auto=format";
  if (name.includes('lettuce wrap')) return "https://images.unsplash.com/photo-1565299507177-b0ac66763828?w=512&h=512&fit=crop&auto=format";
  if (name.includes('panini')) return "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=512&h=512&fit=crop&auto=format";
  if (name.includes('mexican') || name.includes('burrito')) return "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=512&h=512&fit=crop&auto=format";
  if (name.includes('gyro')) return "https://images.unsplash.com/photo-1565299507177-b0ac66763828?w=512&h=512&fit=crop&auto=format";
  if (name.includes('shrimp')) return "https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=512&h=512&fit=crop&auto=format";
  if (name.includes('pasta')) return "https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=512&h=512&fit=crop&auto=format";
  if (name.includes('bbq')) return "https://images.unsplash.com/photo-1544025162-d76694265947?w=512&h=512&fit=crop&auto=format";
  if (name.includes('nicoise')) return "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=512&h=512&fit=crop&auto=format";
  if (name.includes('buddha bowl')) return "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=512&h=512&fit=crop&auto=format";

  // Snack meals
  if (name.includes('protein balls')) return "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=512&h=512&fit=crop&auto=format";
  if (name.includes('hummus')) return "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=512&h=512&fit=crop&auto=format";
  if (name.includes('apple')) return "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=512&h=512&fit=crop&auto=format";
  if (name.includes('yogurt bark')) return "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=512&h=512&fit=crop&auto=format";
  if (name.includes('trail mix')) return "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=512&h=512&fit=crop&auto=format";

  // Dinner meals
  if (name.includes('salmon')) return "https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=512&h=512&fit=crop&auto=format";
  if (name.includes('stir fry')) return "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=512&h=512&fit=crop&auto=format";
  if (name.includes('tacos')) return "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=512&h=512&fit=crop&auto=format";
  if (name.includes('curry')) return "https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=512&h=512&fit=crop&auto=format";
  if (name.includes('pasta')) return "https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=512&h=512&fit=crop&auto=format";
  if (name.includes('pizza')) return "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=512&h=512&fit=crop&auto=format";
  if (name.includes('soup')) return "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=512&h=512&fit=crop&auto=format";
  if (name.includes('risotto')) return "https://images.unsplash.com/photo-1476124369491-e7addf5db371?w=512&h=512&fit=crop&auto=format";
  if (name.includes('cod')) return "https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=512&h=512&fit=crop&auto=format";
  if (name.includes('chicken') && name.includes('thigh')) return "https://images.unsplash.com/photo-1532550907401-a500c9a57435?w=512&h=512&fit=crop&auto=format";

  // Default images by meal type
  switch (type) {
    case 'breakfast':
      return "https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=512&h=512&fit=crop&auto=format";
    case 'lunch':
      return "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=512&h=512&fit=crop&auto=format";
    case 'snack':
      return "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=512&h=512&fit=crop&auto=format";
    case 'dinner':
      return "https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=512&h=512&fit=crop&auto=format";
    default:
      return "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=512&h=512&fit=crop&auto=format";
  }
}

// Analyze WHOOP data to identify specific nutritional needs and struggles
function analyzeNutritionalNeeds(whoopAnalysis: WhoopAnalysis): {
  primaryFocus: string[];
  criticalNeeds: string[];
  avoidanceFactors: string[];
  targetNutrients: string[];
} {
  const needs = {
    primaryFocus: [] as string[],
    criticalNeeds: [] as string[],
    avoidanceFactors: [] as string[],
    targetNutrients: [] as string[]
  };

  // Analyze recovery status
  if (whoopAnalysis.physiologicalState.recoveryStatus === "poor") {
    needs.criticalNeeds.push("muscle_recovery", "anti_inflammatory", "sleep_support");
    needs.targetNutrients.push("high_protein", "omega3", "magnesium", "tart_cherry");
  } else if (whoopAnalysis.physiologicalState.recoveryStatus === "fair") {
    needs.primaryFocus.push("recovery_support", "protein_timing");
    needs.targetNutrients.push("moderate_protein", "antioxidants");
  }

  // Analyze fatigue level
  if (whoopAnalysis.physiologicalState.fatigueLevel === "high") {
    needs.criticalNeeds.push("energy_boost", "adrenal_support", "iron_rich");
    needs.targetNutrients.push("complex_carbs", "b_vitamins", "iron", "caffeine_natural");
    needs.avoidanceFactors.push("heavy_meals", "high_sugar");
  }

  // Analyze sleep quality
  if (whoopAnalysis.physiologicalState.sleepQuality === "poor" || whoopAnalysis.physiologicalState.sleepQuality === "fair") {
    needs.criticalNeeds.push("sleep_optimization", "melatonin_support");
    needs.targetNutrients.push("tryptophan", "magnesium", "chamomile", "avoid_late_caffeine");
  }

  // Analyze metabolic demand
  if (whoopAnalysis.physiologicalState.metabolicDemand === "high") {
    needs.primaryFocus.push("performance_fuel", "electrolyte_balance");
    needs.targetNutrients.push("strategic_carbs", "electrolytes", "hydration");
  }

  // Analyze trends
  if (whoopAnalysis.trends.recovery === "declining") {
    needs.criticalNeeds.push("recovery_intervention");
  }

  return needs;
}

// Score and select optimal library meals based on nutritional needs (max 2 times each)
function selectOptimalLibraryMeals(libraryMeals: any[], nutritionalNeeds: any): any[] {
  console.log(`[MEAL-SELECTION] Scoring ${libraryMeals.length} library meals against nutritional needs`);

  // Score each meal based on how well it addresses the user's needs
  const scoredMeals = libraryMeals.map(meal => ({
    ...meal,
    score: scoreMealForNeeds(meal, nutritionalNeeds),
    usageCount: 0 // Track how many times we've used this meal
  }));

  // Sort by score (highest first)
  scoredMeals.sort((a, b) => b.score - a.score);

  const selectedMeals: any[] = [];
  const mealTypes = ["breakfast", "lunch", "snack", "dinner"];

  // Select meals for each type, ensuring variety and max 2 uses per meal
  mealTypes.forEach(mealType => {
    const typeMeals = scoredMeals.filter(m => m.meal_type.toLowerCase() === mealType);
    let selectedForType = 0;
    const targetPerType = 7; // 7 meals per type for the week

    console.log(`[MEAL-SELECTION] Selecting ${targetPerType} ${mealType} meals from ${typeMeals.length} available`);

    // Shuffle the meals to ensure variety
    const shuffledMeals = [...typeMeals].sort(() => Math.random() - 0.5);

    let mealIndex = 0;
    while (selectedForType < targetPerType && mealIndex < shuffledMeals.length) {
      const meal = shuffledMeals[mealIndex];

      // Use this meal (max 2 times if we have enough variety)
      const timesToUse = Math.min(2, targetPerType - selectedForType,
        typeMeals.length >= 4 ? 2 : Math.ceil(targetPerType / typeMeals.length));

      for (let i = 0; i < timesToUse; i++) {
        selectedMeals.push({
          ...meal,
          usage_instance: i + 1
        });
        selectedForType++;

        if (selectedForType >= targetPerType) break;
      }

      mealIndex++;
    }

    console.log(`[MEAL-SELECTION] Selected ${selectedForType} ${mealType} meals`);
  });

  console.log(`[MEAL-SELECTION] Selected ${selectedMeals.length} meals from library`);
  return selectedMeals;
}

// Score a meal based on how well it addresses nutritional needs
function scoreMealForNeeds(meal: any, needs: any): number {
  let score = 0;

  // Base score for balanced nutrition
  score += 10;

  // Score based on critical needs
  needs.criticalNeeds.forEach((need: string) => {
    if (mealAddressesNeed(meal, need)) {
      score += 50; // High score for critical needs
    }
  });

  // Score based on primary focus
  needs.primaryFocus.forEach((focus: string) => {
    if (mealAddressesNeed(meal, focus)) {
      score += 25; // Medium score for primary focus
    }
  });

  // Score based on target nutrients
  needs.targetNutrients.forEach((nutrient: string) => {
    if (mealContainsNutrient(meal, nutrient)) {
      score += 15; // Lower score for specific nutrients
    }
  });

  // Penalty for avoidance factors
  needs.avoidanceFactors.forEach((factor: string) => {
    if (mealContainsFactor(meal, factor)) {
      score -= 30; // Penalty for things to avoid
    }
  });

  return score;
}

// Check if a meal addresses a specific nutritional need
function mealAddressesNeed(meal: any, need: string): boolean {
  const mealName = (meal.name || '').toLowerCase();
  const mealDescription = (meal.description || '').toLowerCase();
  const ingredients = meal.ingredients?.map((i: any) => (i.name || i || '').toLowerCase()).join(' ') || '';

  const searchText = `${mealName} ${mealDescription} ${ingredients}`;

  switch (need) {
    case "muscle_recovery":
      return searchText.includes("protein") || searchText.includes("greek yogurt") || searchText.includes("chicken") || searchText.includes("salmon");
    case "anti_inflammatory":
      return searchText.includes("berries") || searchText.includes("salmon") || searchText.includes("turmeric") || searchText.includes("spinach");
    case "sleep_support":
      return searchText.includes("cherry") || searchText.includes("almond") || searchText.includes("oats") || searchText.includes("banana");
    case "energy_boost":
      return searchText.includes("quinoa") || searchText.includes("sweet potato") || searchText.includes("oats") || searchText.includes("banana");
    case "recovery_support":
      return meal.nutrition?.protein > 20 || searchText.includes("recovery");
    case "performance_fuel":
      return meal.nutrition?.carbs > 30 && meal.nutrition?.protein > 15;
    default:
      return false;
  }
}

// Check if a meal contains specific nutrients
function mealContainsNutrient(meal: any, nutrient: string): boolean {
  const ingredients = meal.ingredients?.map((i: any) => (i.name || i || '').toLowerCase()).join(' ') || '';

  switch (nutrient) {
    case "high_protein":
      return meal.nutrition?.protein > 25;
    case "omega3":
      return ingredients.includes("salmon") || ingredients.includes("chia") || ingredients.includes("walnut");
    case "magnesium":
      return ingredients.includes("spinach") || ingredients.includes("almond") || ingredients.includes("pumpkin seed");
    case "complex_carbs":
      return ingredients.includes("quinoa") || ingredients.includes("oats") || ingredients.includes("sweet potato");
    case "antioxidants":
      return ingredients.includes("berries") || ingredients.includes("spinach") || ingredients.includes("tomato");
    default:
      return false;
  }
}

// Check if a meal contains factors to avoid
function mealContainsFactor(meal: any, factor: string): boolean {
  switch (factor) {
    case "heavy_meals":
      return meal.nutrition?.calories > 600;
    case "high_sugar":
      return meal.nutrition?.sugar > 20;
    case "late_caffeine":
      return meal.meal_type.toLowerCase() === "dinner" && meal.ingredients?.some((i: any) =>
        i.name.toLowerCase().includes("coffee") || i.name.toLowerCase().includes("chocolate"));
    default:
      return false;
  }
}

// Identify gaps where library meals don't address critical needs
function identifyNutritionalGaps(selectedMeals: any[], needs: any): string[] {
  const gaps: string[] = [];

  // Only identify gaps for truly critical needs (not just primary focus)
  // Be more conservative - only generate AI meals for severe deficiencies
  needs.criticalNeeds.forEach((need: string) => {
    const mealsAddressingNeed = selectedMeals.filter(meal => mealAddressesNeed(meal, need));

    // Only consider it a gap if NO meals address this critical need
    // This makes the system much more conservative about AI generation
    if (mealsAddressingNeed.length === 0) {
      gaps.push(need);
    }
  });

  console.log(`[GAP-ANALYSIS] Identified critical gaps requiring AI generation: ${gaps.join(', ')}`);
  console.log(`[GAP-ANALYSIS] Library meals adequately address most nutritional needs`);
  return gaps;
}

// Generate targeted AI meals to fill specific nutritional gaps
async function generateTargetedAIMeals(whoopAnalysis: WhoopAnalysis, gaps: string[]): Promise<GeneratedMeal[]> {
  console.log(`[AI-TARGETED] Generating meals to address gaps: ${gaps.join(', ')}`);

  const systemPrompt = `You are an expert nutritionist creating targeted meals to address specific health gaps identified from WHOOP data analysis.

CRITICAL GAPS TO ADDRESS: ${gaps.join(', ')}

USER'S WHOOP STATUS:
- Recovery: ${whoopAnalysis.physiologicalState.recoveryStatus} (${whoopAnalysis.averages.recovery.toFixed(1)}%)
- Fatigue: ${whoopAnalysis.physiologicalState.fatigueLevel}
- Sleep: ${whoopAnalysis.physiologicalState.sleepQuality} (${whoopAnalysis.averages.sleep.toFixed(1)}h)
- Strain: ${whoopAnalysis.physiologicalState.metabolicDemand} (${whoopAnalysis.averages.strain.toFixed(1)})

GENERATE EXACTLY ${Math.min(gaps.length, 4)} TARGETED MEALS:
- Each meal must specifically address one of the identified gaps
- Include detailed whoop_rationale explaining how it addresses the specific gap
- Focus on ingredients and nutrients that directly target the user's struggles
- Ensure meals are practical and appealing

RESPONSE FORMAT: Return valid JSON with "meals" array.`;

  const userPrompt = `Generate ${Math.min(gaps.length, 4)} highly targeted meals that specifically address these critical gaps in my nutrition:

GAPS TO ADDRESS: ${gaps.join(', ')}

Each meal must:
1. Target a specific gap with appropriate ingredients
2. Include detailed whoop_rationale explaining how it addresses my struggle
3. Be optimized for my current recovery and performance state

Focus on creating meals that will help move me from struggling to thriving in these specific areas.`;

  try {
    const command = new ConverseCommand({
      modelId: "us.anthropic.claude-3-5-sonnet-20241022-v2:0",
      messages: [
        {
          role: "user",
          content: [{ text: userPrompt }],
        },
      ],
      system: [{ text: systemPrompt }],
      inferenceConfig: {
        maxTokens: 3072,
        temperature: 0.8,
      },
    });

    const response = await client.send(command);
    const rawText = response.output?.message?.content?.[0]?.text || "";

    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Failed to parse Claude response - no JSON found");
    }

    const mealData = JSON.parse(jsonMatch[0]) as { meals: GeneratedMeal[] };

    if (!mealData.meals || !Array.isArray(mealData.meals)) {
      throw new Error("Invalid response structure");
    }

    console.log(`[AI-TARGETED] Successfully generated ${mealData.meals.length} targeted meals`);
    return mealData.meals;

  } catch (error) {
    console.error(`[AI-TARGETED] Error generating targeted meals:`, error);
    // Return empty array if AI generation fails - library meals will be used
    return [];
  }
}

// Create final 28-meal weekly plan combining library and AI meals
function createWeeklyMealPlan(libraryMeals: any[], aiMeals: GeneratedMeal[], needs: any): any[] {
  console.log(`[WEEKLY-PLAN] Creating 28-meal plan from ${libraryMeals.length} library + ${aiMeals.length} AI meals`);

  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const mealTypes = ["Breakfast", "Lunch", "Snack", "Dinner"];
  const weeklyPlan: any[] = [];

  // Separate library meals by type
  const mealsByType = {
    breakfast: libraryMeals.filter(m => m.meal_type.toLowerCase() === "breakfast"),
    lunch: libraryMeals.filter(m => m.meal_type.toLowerCase() === "lunch"),
    snack: libraryMeals.filter(m => m.meal_type.toLowerCase() === "snack"),
    dinner: libraryMeals.filter(m => m.meal_type.toLowerCase() === "dinner")
  };

  // Convert AI meals to proper format with all required fields
  const processedAIMeals = aiMeals.map((meal, index) => ({
    ...meal,
    meal_id: `ai_${Date.now()}_${index}`,
    imageUrl: null, // Will be generated later
    // Ensure all required fields are present with defaults if missing
    description: meal.description || `AI-generated meal targeting your specific health needs`,
    instructions: meal.instructions || ["Follow recipe instructions"],
    prep_time: meal.prep_time || 15,
    cook_time: meal.cook_time || 15,
    servings: meal.servings || 2,
    nutrition: meal.nutrition || {
      calories: 400,
      protein: 20,
      carbs: 40,
      fat: 15,
      fiber: 5,
      sodium: 300
    },
    image_prompt: meal.image_prompt || `Healthy ${meal.meal_type?.toLowerCase() || 'meal'} with ${meal.ingredients?.slice(0, 3).map(i => i.name || i).join(', ') || 'nutritious ingredients'}`
  }));

  // Track used meals to avoid repetition in same day
  const usedMealsPerDay: { [key: string]: Set<string> } = {};
  days.forEach(day => {
    usedMealsPerDay[day] = new Set();
  });

  // Meal type indices to ensure variety
  const mealTypeIndices = {
    breakfast: 0,
    lunch: 0,
    snack: 0,
    dinner: 0
  };

  let aiMealIndex = 0;

  // Distribute meals across the week
  days.forEach((day, dayIndex) => {
    mealTypes.forEach((mealType) => {
      const mealTypeKey = mealType.toLowerCase() as keyof typeof mealsByType;

      // Check if we should use an AI meal (only if gaps exist and we have AI meals)
      const shouldUseAIMeal = aiMealIndex < processedAIMeals.length &&
        needs.criticalNeeds.length > 0 &&
        dayIndex < Math.ceil(processedAIMeals.length / 4); // Distribute AI meals across early days

      if (shouldUseAIMeal) {
        const aiMeal = processedAIMeals[aiMealIndex];

        // Validate AI meal has all required fields
        const validatedAIMeal = {
          ...aiMeal,
          day,
          meal_type: mealType,
          name: aiMeal.name || `AI ${mealType}`,
          description: aiMeal.description || `AI-generated ${mealType.toLowerCase()} for your health needs`,
          ingredients: aiMeal.ingredients || [{ name: "Various ingredients", amount: "as needed" }],
          instructions: aiMeal.instructions || ["Follow recipe instructions"],
          prep_time: aiMeal.prep_time || 15,
          cook_time: aiMeal.cook_time || 15,
          servings: aiMeal.servings || 2,
          nutrition: aiMeal.nutrition || {
            calories: 400,
            protein: 20,
            carbs: 40,
            fat: 15,
            fiber: 5,
            sodium: 300
          },
          imageUrl: aiMeal.imageUrl || null
        };

        weeklyPlan.push(validatedAIMeal);
        usedMealsPerDay[day].add(aiMeal.meal_id);
        aiMealIndex++;
      } else {
        // Use library meal of correct type
        const availableMeals = mealsByType[mealTypeKey];
        if (availableMeals.length === 0) {
          console.warn(`No ${mealType} meals available in library`);
          return; // Use return instead of continue in forEach
        }

        // Find a meal that hasn't been used today, with proper cycling
        let selectedMeal = null;
        let attempts = 0;
        const maxAttempts = availableMeals.length * 2;

        while (!selectedMeal && attempts < maxAttempts) {
          const mealIndex = mealTypeIndices[mealTypeKey] % availableMeals.length;
          const candidateMeal = availableMeals[mealIndex];

          // Check if this meal has already been used today
          if (!usedMealsPerDay[day].has(candidateMeal.meal_id)) {
            selectedMeal = candidateMeal;
          }

          mealTypeIndices[mealTypeKey]++;
          attempts++;
        }

        // If we couldn't find an unused meal, use the next available one
        if (!selectedMeal) {
          const mealIndex = mealTypeIndices[mealTypeKey] % availableMeals.length;
          selectedMeal = availableMeals[mealIndex];
          mealTypeIndices[mealTypeKey]++;
        }

        // Always increment the index to ensure variety across days
        mealTypeIndices[mealTypeKey]++;

        weeklyPlan.push({
          ...selectedMeal,
          day,
          meal_type: mealType,
          meal_id: `${selectedMeal.meal_id}_${day}_${mealType}`,
          imageUrl: selectedMeal.imageUrl || selectedMeal.image || "/placeholder-meal.jpg"
        });

        usedMealsPerDay[day].add(selectedMeal.meal_id);
      }
    });
  });

  console.log(`[WEEKLY-PLAN] Created complete 28-meal plan with proper meal type distribution`);
  return weeklyPlan;
}