import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/mysql-connection';
import { meals } from '@/db/mysql-schema';
import { and, eq, ne, sql, isNotNull } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ mealId: string }> }
) {
  try {
    const { mealId } = await params;
    
    console.log(`🔄 Finding alternative meals for: ${mealId}`);

    // First, get the current meal to understand its type
    const currentMealResult = await db.select()
      .from(meals)
      .where(eq(meals.mealId, mealId))
      .limit(1);

    if (currentMealResult.length === 0) {
      return NextResponse.json(
        { error: 'Current meal not found' },
        { status: 404 }
      );
    }

    const currentMeal = currentMealResult[0];
    const mealType = currentMeal.mealType;

    console.log(`🎯 Current meal type: ${mealType}`);

    // Find alternative meals of the same type (excluding current meal)
    // Only get meals with images for better user experience
    const alternativeMeals = await db.select()
      .from(meals)
      .where(and(
        eq(meals.mealType, mealType),
        ne(meals.mealId, mealId), // Exclude current meal
        isNotNull(meals.imageUrl),
        sql`${meals.imageUrl} != ''`
      ))
      .orderBy(sql`RAND()`) // Random order for variety
      .limit(10); // Get 10 alternatives

    console.log(`📚 Found ${alternativeMeals.length} alternative ${mealType} meals`);

    if (alternativeMeals.length === 0) {
      return NextResponse.json({
        success: false,
        message: `No alternative ${mealType} meals found`,
        currentMeal: currentMeal.mealName,
      });
    }

    // Pick the first alternative (random due to RAND() ordering)
    const selectedAlternative = alternativeMeals[0];

    // Format the alternative meal data
    const formattedMeal = {
      meal_id: selectedAlternative.mealId,
      name: selectedAlternative.mealName,
      tagline: selectedAlternative.tagline,
      meal_type: selectedAlternative.mealType,
      original_meal_type: selectedAlternative.mealType,
      description: selectedAlternative.tagline || selectedAlternative.nutritionSummary || 'Delicious and nutritious meal',
      whyThisMeal: selectedAlternative.whyThisMeal,
      ingredients: formatIngredients(selectedAlternative.ingredients),
      instructions: formatInstructions(selectedAlternative.method),
      prep_time: parseTime(selectedAlternative.prepTime) || 15,
      cook_time: 15,
      servings: parseServings(selectedAlternative.servingSize) || parseServings(selectedAlternative.ingredients && typeof selectedAlternative.ingredients === 'object' && (selectedAlternative.ingredients as any).serving_size) || 1,
      nutrition: formatNutrition(selectedAlternative.nutritionDetails),
      image: selectedAlternative.imageUrl ? `/api/image-proxy?url=${encodeURIComponent(selectedAlternative.imageUrl)}` : null,
      tags: selectedAlternative.tags || [],
      raw_ingredients: selectedAlternative.ingredients,
      raw_nutrition: selectedAlternative.nutritionDetails,
      raw_method: selectedAlternative.method,
    };

    return NextResponse.json({
      success: true,
      meal: formattedMeal,
      message: `Found alternative ${mealType} meal`,
      alternativesCount: alternativeMeals.length,
    });

  } catch (error) {
    console.error('Error finding alternative meals:', error);
    return NextResponse.json(
      { error: 'Failed to find alternative meals' },
      { status: 500 }
    );
  }
}

// Helper functions (same as in other meal APIs)
const formatIngredients = (ingredients: any): any[] => {
  if (ingredients && typeof ingredients === 'object' && ingredients.list) {
    return ingredients.list.map((ing: any) => ({
      name: ing.item || ing.name || 'Unknown ingredient',
      amount: ing.quantity || ing.amount || 'as needed',
    }));
  }
  return [];
};

const formatInstructions = (method: any): string[] => {
  if (Array.isArray(method)) {
    return method.map(step => 
      typeof step === 'string' ? step.replace(/^step \d+:\s*/i, '') : String(step)
    );
  }
  return ['Follow recipe instructions'];
};

const parseTime = (timeStr: string | null): number | null => {
  if (!timeStr) return null;
  const match = timeStr.match(/(\d+)/);
  return match ? parseInt(match[1]) : null;
};

const parseServings = (servingStr: string | null): number | null => {
  if (!servingStr) return null;
  const match = servingStr.match(/(\d+)/);
  return match ? parseInt(match[1]) : null;
};

const formatNutrition = (nutritionDetails: any): any => {
  if (typeof nutritionDetails === 'object' && nutritionDetails?.details) {
    const details = nutritionDetails.details;
    return {
      calories: parseInt(details.Calories || details.calories) || 400,
      protein: parseInt(details.Protein || details.protein) || 20,
      carbs: parseInt(details.Carbs || details.carbs || details.carbohydrates) || 40,
      fat: parseInt(details.Fat || details.fat) || 15,
      fiber: parseInt(details.Fiber || details.fiber) || 5,
      sodium: parseInt(details.Sodium || details.sodium) || 500,
      saturated_fat: parseFloat(details.Saturated_Fat || details.saturated_fat) || 3,
      sugars: parseInt(details.Sugars || details.sugars) || 8,
      serving_unit: nutritionDetails.serving_unit || 'per 1 serving',
      summary: nutritionDetails.summary || '',
    };
  }
  return {
    calories: 400,
    protein: 20,
    carbs: 40,
    fat: 15,
    fiber: 5,
    sodium: 500,
    saturated_fat: 3,
    sugars: 8,
    serving_unit: 'per 1 serving',
    summary: '',
  };
};