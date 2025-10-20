import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

// Fallback meal generation for testing without Bedrock
export async function POST(request: NextRequest) {
  console.log("🧪 [FALLBACK] AI meal generation fallback triggered");
  
  try {
    // Step 1: Verify user authentication
    const session = await auth.api.getSession({ headers: request.headers });
    const userId = session?.user?.id;

    if (!userId) {
      console.error("❌ [AUTH] User not authenticated");
      return NextResponse.json({ 
        error: "Authentication required",
        step: "authentication" 
      }, { status: 401 });
    }

    console.log(`✅ [AUTH] User authenticated: ${userId}`);

    const body = await request.json();
    const { regenerate = false, shuffleOnly = false } = body;

    // Simulate the AI generation process with mock data
    console.log("🤖 [FALLBACK] Simulating AI meal generation...");
    
    // Create mock meals that look like AI-generated ones
    const mockMeals = [
      // Monday
      {
        day: "Monday",
        meal_type: "Breakfast",
        name: "WHOOP Recovery Smoothie Bowl",
        description: "Antioxidant-rich smoothie bowl designed to support your recovery based on your WHOOP data",
        ingredients: [
          { name: "Frozen blueberries", amount: "1 cup" },
          { name: "Banana", amount: "1 medium" },
          { name: "Greek yogurt", amount: "1/2 cup" },
          { name: "Almond butter", amount: "2 tbsp" },
          { name: "Chia seeds", amount: "1 tbsp" }
        ],
        instructions: [
          "Blend frozen blueberries, banana, and Greek yogurt until smooth",
          "Pour into bowl and top with almond butter and chia seeds",
          "Add fresh berries if desired"
        ],
        prep_time: 5,
        cook_time: 0,
        servings: 1,
        nutrition: {
          calories: 420,
          protein: 18,
          carbs: 52,
          fat: 16,
          fiber: 12,
          sodium: 85
        },
        image: "/placeholder-meal.jpg",
        meal_id: "mock-breakfast-monday"
      },
      {
        day: "Monday",
        meal_type: "Lunch",
        name: "High-Strain Recovery Salad",
        description: "Protein-packed salad optimized for post-workout recovery",
        ingredients: [
          { name: "Grilled chicken breast", amount: "6 oz" },
          { name: "Mixed greens", amount: "2 cups" },
          { name: "Quinoa", amount: "1/2 cup cooked" },
          { name: "Avocado", amount: "1/2 medium" },
          { name: "Cherry tomatoes", amount: "1/2 cup" }
        ],
        instructions: [
          "Grill chicken breast and slice",
          "Combine mixed greens, quinoa, and vegetables",
          "Top with sliced chicken and avocado",
          "Drizzle with olive oil and lemon"
        ],
        prep_time: 15,
        cook_time: 10,
        servings: 1,
        nutrition: {
          calories: 485,
          protein: 42,
          carbs: 28,
          fat: 22,
          fiber: 8,
          sodium: 320
        },
        image: "/placeholder-meal.jpg",
        meal_id: "mock-lunch-monday"
      },
      {
        day: "Monday",
        meal_type: "Snack",
        name: "HRV Support Trail Mix",
        description: "Magnesium-rich snack to support heart rate variability",
        ingredients: [
          { name: "Almonds", amount: "1/4 cup" },
          { name: "Pumpkin seeds", amount: "2 tbsp" },
          { name: "Dark chocolate chips", amount: "1 tbsp" },
          { name: "Dried cranberries", amount: "2 tbsp" }
        ],
        instructions: [
          "Mix all ingredients in a small bowl",
          "Store in airtight container for freshness"
        ],
        prep_time: 2,
        cook_time: 0,
        servings: 1,
        nutrition: {
          calories: 285,
          protein: 8,
          carbs: 18,
          fat: 22,
          fiber: 4,
          sodium: 5
        },
        image: "/placeholder-meal.jpg",
        meal_id: "mock-snack-monday"
      },
      {
        day: "Monday",
        meal_type: "Dinner",
        name: "Sleep Optimization Salmon",
        description: "Omega-3 rich dinner designed to improve sleep quality based on your WHOOP sleep data",
        ingredients: [
          { name: "Salmon fillet", amount: "6 oz" },
          { name: "Sweet potato", amount: "1 medium" },
          { name: "Broccoli", amount: "1 cup" },
          { name: "Olive oil", amount: "1 tbsp" },
          { name: "Lemon", amount: "1/2 medium" }
        ],
        instructions: [
          "Preheat oven to 400°F",
          "Season salmon with lemon and herbs",
          "Roast sweet potato and broccoli with olive oil",
          "Bake salmon for 12-15 minutes",
          "Serve together with lemon wedge"
        ],
        prep_time: 10,
        cook_time: 25,
        servings: 1,
        nutrition: {
          calories: 520,
          protein: 38,
          carbs: 35,
          fat: 24,
          fiber: 6,
          sodium: 180
        },
        image: "/placeholder-meal.jpg",
        meal_id: "mock-dinner-monday"
      }
    ];

    // Duplicate the Monday meals for all 7 days with slight variations
    const allMockMeals: typeof mockMeals = [];
    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    
    days.forEach((day, dayIndex) => {
      mockMeals.forEach(meal => {
        allMockMeals.push({
          ...meal,
          day,
          meal_id: `${meal.meal_id}-${day.toLowerCase()}`,
          name: dayIndex === 0 ? meal.name : `${meal.name} (Day ${dayIndex + 1})`,
        });
      });
    });

    console.log(`✅ [FALLBACK] Generated ${allMockMeals.length} mock meals`);

    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 1000));

    return NextResponse.json({
      success: true,
      meals: allMockMeals,
      generation_summary: "Mock AI meal plan generated for testing purposes. This simulates the real AI generation workflow.",
      whoop_insights: "This is a fallback mode - in production, this would contain personalized insights from your WHOOP health data.",
      whoop_analysis: {
        userId,
        dataPoints: 0,
        dateRange: { start: "Mock", end: "Data" },
        averages: { recovery: 65, strain: 12, sleep: 7.5, hrv: 45, rhr: 65, calories: 2200 },
        physiologicalState: {
          fatigueLevel: "moderate",
          recoveryStatus: "good",
          metabolicDemand: "moderate",
          sleepQuality: "good"
        }
      },
      generation_type: "fallback_mock",
      processing_time_ms: 1000,
      step: "completed",
      note: "This is a fallback response for testing. Configure AWS_BEARER_TOKEN_BEDROCK for real AI generation."
    });

  } catch (error) {
    console.error("💥 [FALLBACK] Error in fallback meal generation:", error);
    
    return NextResponse.json({
      error: "Fallback meal generation failed",
      step: "fallback_error",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ 
        error: "Authentication required" 
      }, { status: 401 });
    }

    return NextResponse.json({
      user_id: userId,
      has_whoop_data: false,
      whoop_data_points: 0,
      existing_meals_count: 0,
      can_shuffle: false,
      capabilities: {
        ai_meal_generation: true,
        ai_image_generation: false,
        whoop_integration: false,
        meal_shuffling: false,
      },
      mode: "fallback",
      note: "This is a fallback API for testing without Bedrock configuration."
    });

  } catch (error) {
    console.error("Error in fallback capabilities check:", error);
    return NextResponse.json({
      error: "Failed to check fallback capabilities",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}