import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/mysql-connection';
import { meals } from '@/db/mysql-schema';
import { eq } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ mealId: string }> }
) {
  try {
    const { mealId } = await params;
    
    console.log(`🔍 Fetching meal with ID: ${mealId}`);

    // Query the RDS MySQL database for the specific meal
    const mealResult = await db.select()
      .from(meals)
      .where(eq(meals.mealId, mealId))
      .limit(1);

    if (mealResult.length === 0) {
      return NextResponse.json(
        { error: 'Meal not found' },
        { status: 404 }
      );
    }

    const meal = mealResult[0];

    // Format the meal data for the detail page - using ALL database fields
    const formattedMeal = {
      day: 'Current', // Default day
      meal_type: meal.mealType, // Original RDS meal type (Breakfast, Lunch/Dinner, etc.)
      original_meal_type: meal.mealType, // Same as meal_type for individual meals
      meal_id: meal.mealId, // e.g., "LD-0100"
      name: meal.mealName, // e.g., "Pan-Seared Halibut with Olives & Capers"
      tagline: meal.tagline, // e.g., "DHA/Magnesium Quick Dinner"
      description: meal.tagline || meal.nutritionSummary || 'Delicious and nutritious meal',
      whyThisMeal: meal.whyThisMeal, // Full "why this meal" explanation
      ingredients: formatIngredients(meal.ingredients), // Full ingredients with serving_size
      instructions: formatInstructions(meal.method), // Step-by-step method
      prep_time: parseTime(meal.prepTime) || 15, // e.g., "20 minutes"
      cook_time: 15, // Default cook time (not in sample data)
      servings: parseServings(meal.servingSize) || parseServings(meal.ingredients && typeof meal.ingredients === 'object' && (meal.ingredients as any).serving_size) || 1,
      nutrition: formatNutrition(meal.nutritionDetails), // Complete nutrition data
      image: meal.imageUrl ? `/api/image-proxy?url=${encodeURIComponent(meal.imageUrl)}` : null,
      tags: meal.tags || [], // e.g., ["Better Sleep", "Omega-3", "Low-Carb"]
      // Raw data for complete access
      raw_ingredients: meal.ingredients, // Complete ingredients object
      raw_nutrition: meal.nutritionDetails, // Complete nutrition object
      raw_method: meal.method, // Complete method array
    };

    return NextResponse.json({
      success: true,
      meal: formattedMeal,
    });

  } catch (error) {
    console.error('Error fetching meal:', error);
    return NextResponse.json(
      { error: 'Failed to fetch meal' },
      { status: 500 }
    );
  }
}

// Helper functions (same as in current-week route)
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
      // Include the full nutrition object for complete data access
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