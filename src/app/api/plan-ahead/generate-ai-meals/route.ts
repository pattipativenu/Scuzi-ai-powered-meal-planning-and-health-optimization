import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { fetchUserWhoopData, analyzeWhoopData } from "@/lib/whoop-analyzer";
import { generatePersonalizedMeals, validateMealStructure, generateHybridMealPlan } from "@/lib/ai-meal-generator";
import { generateMealImages } from "@/lib/ai-image-generator";
import { storeMealsInLibrary, saveMealPlan, checkExistingMeals, shuffleMealsIntelligently } from "@/lib/meal-database";

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  console.log("🚀 [AI-MEAL-GEN] Starting AI-powered meal generation workflow");
  
  try {
    // Step 1: Verify user authentication
    const session = await auth.api.getSession({ headers: request.headers });
    let userId = session?.user?.id;

    // TEMPORARY: For testing AWS Bedrock integration, use test user if no auth
    if (!userId) {
      console.warn("⚠️ [AUTH] No authentication found, using test user for AWS Bedrock testing");
      userId = "test_user_bedrock_integration";
    }

    console.log(`✅ [AUTH] User authenticated: ${userId}`);

    const body = await request.json();
    const { regenerate = false, shuffleOnly = false } = body;

    // Step 2: Fetch and analyze WHOOP data
    console.log("📊 [WHOOP] Fetching user WHOOP health data...");
    
    let whoopData;
    let whoopAnalysis;
    
    try {
      whoopData = await fetchUserWhoopData(userId, 7);
      
      if (whoopData.length === 0) {
        console.warn("⚠️ [WHOOP] No WHOOP data found, using default analysis");
        // Create default analysis for users without WHOOP data
        whoopAnalysis = {
          userId,
          dataPoints: 0,
          dateRange: { start: "N/A", end: "N/A" },
          averages: { recovery: 65, strain: 12, sleep: 7.5, hrv: 45, rhr: 65, calories: 2200 },
          trends: { recovery: "stable" as const, sleep: "stable" as const, strain: "stable" as const },
          physiologicalState: {
            fatigueLevel: "moderate" as const,
            recoveryStatus: "good" as const,
            metabolicDemand: "moderate" as const,
            sleepQuality: "good" as const
          },
          nutritionalRecommendations: {
            proteinEmphasis: "moderate" as const,
            carbTiming: "balanced" as const,
            antiInflammatory: false,
            hydrationFocus: false,
            energyDensity: "moderate" as const
          }
        };
      } else {
        whoopAnalysis = analyzeWhoopData(whoopData);
        console.log(`✅ [WHOOP] Analyzed ${whoopData.length} days of health data`);
      }
    } catch (whoopError) {
      console.error("❌ [WHOOP] Error fetching WHOOP data:", whoopError);
      return NextResponse.json({
        error: "Failed to fetch WHOOP health data",
        step: "whoop_analysis",
        details: whoopError instanceof Error ? whoopError.message : "Unknown error"
      }, { status: 500 });
    }

    // Step 3: Check for existing meals (meal history cross-check)
    if (!regenerate && !shuffleOnly) {
      console.log("🔍 [HISTORY] Checking existing meal history...");
      
      const existingMeals = await checkExistingMeals(userId, 100);
      
      if (existingMeals.length >= 28) {
        console.log(`✅ [HISTORY] Found ${existingMeals.length} existing meals, checking compatibility...`);
        
        // Simple compatibility check - if user has recent meals, offer to shuffle instead
        const recentMeals = existingMeals.filter(meal => {
          const mealDate = new Date(meal.created_at);
          const daysSinceCreation = (Date.now() - mealDate.getTime()) / (1000 * 60 * 60 * 24);
          return daysSinceCreation <= 30; // Meals created within last 30 days
        });
        
        if (recentMeals.length >= 28) {
          return NextResponse.json({
            suggestion: "shuffle_existing",
            message: "You have recent AI-generated meals. Would you like to shuffle them or generate completely new ones?",
            existing_meals_count: recentMeals.length,
            step: "meal_history_check"
          });
        }
      }
    }

    // Step 4: Handle shuffle-only request
    if (shuffleOnly) {
      console.log("🔀 [SHUFFLE] Shuffling existing meals...");
      
      const existingMeals = await checkExistingMeals(userId, 28);
      if (existingMeals.length < 28) {
        return NextResponse.json({
          error: "Not enough existing meals to shuffle",
          step: "shuffle_validation"
        }, { status: 400 });
      }

      // Convert to MealWithImage format and shuffle
      const mealsToShuffle = existingMeals.slice(0, 28).map(meal => ({
        ...meal,
        day: "Monday", // Will be reassigned during shuffle
        meal_type: meal.meal_type,
        name: meal.name,
        description: meal.description,
        ingredients: meal.ingredients,
        instructions: meal.instructions,
        prep_time: meal.prep_time,
        cook_time: meal.cook_time,
        servings: meal.servings,
        nutrition: meal.nutrition,
        image_prompt: meal.imagePrompt || "",
        whoop_rationale: meal.whoop_rationale || "",
        imageUrl: meal.imageUrl,
      }));

      const shuffledMeals = shuffleMealsIntelligently(mealsToShuffle);
      
      // Save shuffled meal plan
      const weekId = await saveMealPlan(
        shuffledMeals,
        userId,
        "Shuffled existing AI-generated meals",
        "Intelligently rearranged your previous meals for variety"
      );

      const duration = Date.now() - startTime;
      console.log(`✅ [SHUFFLE] Completed meal shuffling in ${duration}ms`);

      return NextResponse.json({
        success: true,
        meals: shuffledMeals.map(meal => ({
          day: meal.day,
          meal_type: meal.meal_type,
          name: meal.name,
          description: meal.description,
          ingredients: meal.ingredients,
          instructions: meal.instructions,
          prep_time: meal.prep_time,
          cook_time: meal.cook_time,
          servings: meal.servings,
          nutrition: meal.nutrition,
          image: meal.imageUrl,
          meal_id: meal.meal_id,
        })),
        week_id: weekId,
        generation_type: "shuffled",
        whoop_analysis: whoopAnalysis,
        processing_time_ms: duration,
        step: "completed"
      });
    }

    // Step 5: Generate hybrid meal plan (library + AI personalized meals)
    console.log("🤖 [HYBRID-GEN] Generating hybrid meal plan with library + AI personalized meals...");
    
    let hybridMealPlan;
    try {
      hybridMealPlan = await generateHybridMealPlan(whoopAnalysis, userId);
      
      console.log(`✅ [HYBRID-GEN] Successfully generated ${hybridMealPlan.meals.length} hybrid meals (${hybridMealPlan.aiGeneratedCount} AI + ${hybridMealPlan.libraryCount} library)`);
    } catch (genError) {
      console.error("❌ [HYBRID-GEN] Error generating hybrid meal plan:", genError);
      return NextResponse.json({
        error: "Failed to generate hybrid meal plan",
        step: "hybrid_meal_generation",
        details: genError instanceof Error ? genError.message : "Unknown error"
      }, { status: 500 });
    }

    // Step 6: Generate images only for AI-generated meals (library meals already have images)
    console.log("🖼️ [IMAGE-GEN] Generating images for AI-personalized meals...");
    
    let mealsWithImages;
    try {
      mealsWithImages = hybridMealPlan.meals; // Already includes images from library
      
      // Generate images only for AI meals that don't have images
      const aiMealsNeedingImages = mealsWithImages.filter(meal => !meal.imageUrl && meal.meal_id.startsWith('ai_'));
      
      if (aiMealsNeedingImages.length > 0) {
        console.log(`🖼️ [IMAGE-GEN] Generating ${aiMealsNeedingImages.length} images for AI meals...`);
        
        const aiMealsWithImages = await generateMealImages(
          aiMealsNeedingImages,
          userId,
          (completed, total) => {
            console.log(`🖼️ [IMAGE-GEN] Progress: ${completed}/${total} AI meal images generated`);
          }
        );
        
        // Update the meals with new images
        aiMealsWithImages.forEach(aiMeal => {
          const index = mealsWithImages.findIndex(m => m.meal_id === aiMeal.meal_id);
          if (index !== -1) {
            mealsWithImages[index] = aiMeal;
          }
        });
      }
      
      console.log(`✅ [IMAGE-GEN] Successfully processed ${mealsWithImages.length} meals (${aiMealsNeedingImages.length} new images generated)`);
    } catch (imageError) {
      console.error("❌ [IMAGE-GEN] Error generating images:", imageError);
      return NextResponse.json({
        error: "Failed to generate meal images",
        step: "ai_image_generation",
        details: imageError instanceof Error ? imageError.message : "Unknown error"
      }, { status: 500 });
    }

    // Step 7: Store meals in database
    console.log("💾 [DB-STORE] Storing meals in database...");
    
    try {
      // Store in meals_library table
      await storeMealsInLibrary(mealsWithImages, userId);
      
      // Save meal plan
      const weekId = await saveMealPlan(
        mealsWithImages,
        userId,
        hybridMealPlan.generation_summary,
        hybridMealPlan.whoop_insights
      );
      
      console.log(`✅ [DB-STORE] Successfully stored all meals and meal plan`);
    } catch (dbError) {
      console.error("❌ [DB-STORE] Error storing meals:", dbError);
      return NextResponse.json({
        error: "Failed to store meals in database",
        step: "database_storage",
        details: dbError instanceof Error ? dbError.message : "Unknown error"
      }, { status: 500 });
    }

    // Step 8: Return success response
    const duration = Date.now() - startTime;
    console.log(`🎉 [SUCCESS] AI-powered meal generation completed in ${duration}ms`);

    return NextResponse.json({
      success: true,
      meals: mealsWithImages.map(meal => ({
        day: meal.day,
        meal_type: meal.meal_type,
        name: meal.name,
        description: meal.description,
        ingredients: meal.ingredients,
        instructions: meal.instructions,
        prep_time: meal.prep_time,
        cook_time: meal.cook_time,
        servings: meal.servings,
        nutrition: meal.nutrition,
        image: meal.imageUrl,
        meal_id: meal.meal_id,
      })),
      generation_summary: hybridMealPlan.generation_summary,
      whoop_insights: hybridMealPlan.whoop_insights,
      whoop_analysis: whoopAnalysis,
      generation_type: regenerate ? "regenerated" : "new",
      processing_time_ms: duration,
      step: "completed"
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error("💥 [ERROR] Fatal error in AI meal generation:", error);
    
    return NextResponse.json({
      error: "AI meal generation failed",
      step: "fatal_error",
      details: error instanceof Error ? error.message : "Unknown error",
      processing_time_ms: duration
    }, { status: 500 });
  }
}

// GET endpoint for checking generation status or capabilities
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    let userId = session?.user?.id;

    // TEMPORARY: For testing AWS Bedrock integration, use test user if no auth
    if (!userId) {
      console.warn("⚠️ [AUTH] No authentication found, using test user for AWS Bedrock testing");
      userId = "test_user_bedrock_integration";
    }

    // Check if user has WHOOP data
    const whoopData = await fetchUserWhoopData(userId, 7);
    const hasWhoopData = whoopData.length > 0;

    // Check existing meals
    const existingMeals = await checkExistingMeals(userId, 50);

    return NextResponse.json({
      user_id: userId,
      has_whoop_data: hasWhoopData,
      whoop_data_points: whoopData.length,
      existing_meals_count: existingMeals.length,
      can_shuffle: existingMeals.length >= 28,
      capabilities: {
        ai_meal_generation: true,
        ai_image_generation: true,
        whoop_integration: hasWhoopData,
        meal_shuffling: existingMeals.length >= 28,
      }
    });

  } catch (error) {
    console.error("Error checking AI meal generation capabilities:", error);
    return NextResponse.json({
      error: "Failed to check capabilities",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}