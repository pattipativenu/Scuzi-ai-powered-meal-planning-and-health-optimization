import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { fetchUserWhoopData, analyzeWhoopData } from '@/lib/whoop-analyzer';
import { MealLibraryService } from '@/lib/meal-library-service';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  console.log('🚀 [LIBRARY-GEN] Starting meal generation from library based on WHOOP data');

  try {
    // Step 1: Verify user authentication
    const session = await auth.api.getSession({ headers: request.headers });
    let userId = session?.user?.id;

    // Use the actual WHOOP user ID from your uploaded data
    if (!userId) {
      console.warn('⚠️ [AUTH] No authentication found, using main WHOOP user');
      userId = 'whoop_user_main'; // This matches the user_id in your uploaded WHOOP data
    }

    console.log(`✅ [AUTH] User authenticated: ${userId}`);

    // Step 2: Fetch and analyze WHOOP data
    console.log('📊 [WHOOP] Fetching user WHOOP health data...');
    
    let whoopData;
    let whoopAnalysis;
    
    try {
      whoopData = await fetchUserWhoopData(userId, 7);
      
      if (whoopData.length === 0) {
        console.warn('⚠️ [WHOOP] No WHOOP data found, using default analysis');
        // Create default analysis for users without WHOOP data
        whoopAnalysis = {
          userId,
          dataPoints: 0,
          dateRange: { start: 'N/A', end: 'N/A' },
          averages: { recovery: 65, strain: 12, sleep: 7.5, hrv: 45, rhr: 65, calories: 2200 },
          trends: { recovery: 'stable' as const, sleep: 'stable' as const, strain: 'stable' as const },
          physiologicalState: {
            fatigueLevel: 'moderate' as const,
            recoveryStatus: 'good' as const,
            metabolicDemand: 'moderate' as const,
            sleepQuality: 'good' as const
          },
          nutritionalRecommendations: {
            proteinEmphasis: 'moderate' as const,
            carbTiming: 'balanced' as const,
            antiInflammatory: false,
            hydrationFocus: false,
            energyDensity: 'moderate' as const
          }
        };
      } else {
        whoopAnalysis = analyzeWhoopData(whoopData);
        console.log(`✅ [WHOOP] Analyzed ${whoopData.length} days of health data`);
      }
    } catch (whoopError) {
      console.error('❌ [WHOOP] Error fetching WHOOP data:', whoopError);
      return NextResponse.json({
        error: 'Failed to fetch WHOOP health data',
        step: 'whoop_analysis',
        details: whoopError instanceof Error ? whoopError.message : 'Unknown error'
      }, { status: 500 });
    }

    // Step 3: Get library statistics
    console.log('📚 [LIBRARY] Checking meal library status...');
    const libraryStats = await MealLibraryService.getLibraryStats();
    
    console.log(`📚 [LIBRARY] Library stats:`, libraryStats);

    if (libraryStats.mealsWithImages < 20) {
      return NextResponse.json({
        error: 'Insufficient meals in library',
        message: `Only ${libraryStats.mealsWithImages} meals with images available. Need at least 20 meals to generate a diverse meal plan.`,
        step: 'library_validation',
        libraryStats,
      }, { status: 400 });
    }

    // Step 4: Parse request body for regeneration options
    let requestBody = {};
    try {
      requestBody = await request.json();
    } catch (e) {
      // No body or invalid JSON, use defaults
    }

    const { regenerate = false, forceNewSelection = false, timestamp } = requestBody as any;
    
    console.log('🎯 [SELECTION] Selection options:', { regenerate, forceNewSelection, timestamp });

    // Step 5: Select meals from library based on WHOOP analysis
    console.log('🎯 [SELECTION] Selecting optimal meals from library...');
    
    let mealSelection;
    try {
      mealSelection = await MealLibraryService.selectMealsFromLibrary(whoopAnalysis, {
        regenerate,
        forceNewSelection,
        timestamp
      });
      console.log(`✅ [SELECTION] ${regenerate ? 'Regenerated' : 'Selected'} ${mealSelection.meals.length} meals from library`);
    } catch (selectionError) {
      console.error('❌ [SELECTION] Error selecting meals from library:', selectionError);
      return NextResponse.json({
        error: 'Failed to select meals from library',
        step: 'meal_selection',
        details: selectionError instanceof Error ? selectionError.message : 'Unknown error'
      }, { status: 500 });
    }

    // Step 5: Return the meal plan with image class validation
    const duration = Date.now() - startTime;
    console.log(`🎉 [SUCCESS] Library-based meal generation completed in ${duration}ms`);

    return NextResponse.json({
      success: true,
      meals: mealSelection.meals.map(meal => ({
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
        image: meal.image,
        imageUrl: meal.imageUrl, // Ensure imageUrl is included
        meal_id: meal.meal_id,
        // 🎯 CLASS IDENTIFICATION
        imageClass: meal.imageUrl && meal.imageUrl.trim() !== '' ? 'A' : 'B',
        hasImage: meal.imageUrl && meal.imageUrl.trim() !== '',
        showImagePlaceholder: !meal.imageUrl || meal.imageUrl.trim() === ''
      })),
      generation_type: 'library_based',
      whoop_analysis: whoopAnalysis,
      whoop_insights: mealSelection.whoopInsights,
      generation_summary: mealSelection.selectionSummary,
      library_stats: libraryStats,
      // 🎯 IMAGE CLASS VALIDATION DATA
      imageClassValidation: mealSelection.imageClassValidation,
      processing_time_ms: duration,
      step: 'completed'
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('💥 [ERROR] Fatal error in library-based meal generation:', error);
    
    return NextResponse.json({
      error: 'Library-based meal generation failed',
      step: 'fatal_error',
      details: error instanceof Error ? error.message : 'Unknown error',
      processing_time_ms: duration
    }, { status: 500 });
  }
}

// GET endpoint for checking library status
export async function GET() {
  try {
    const libraryStats = await MealLibraryService.getLibraryStats();
    
    return NextResponse.json({
      success: true,
      library_stats: libraryStats,
      ready_for_generation: libraryStats.mealsWithImages >= 20,
      capabilities: {
        total_meals: libraryStats.totalMeals,
        meals_with_images: libraryStats.mealsWithImages,
        meal_types: Object.keys(libraryStats.mealsByType),
        available_tags: libraryStats.availableTags.slice(0, 10), // First 10 tags
      }
    });

  } catch (error) {
    console.error('Error checking library status:', error);
    return NextResponse.json({
      error: 'Failed to check library status',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}