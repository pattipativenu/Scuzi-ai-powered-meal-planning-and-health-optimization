import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { mealsLibrary } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Validate ID parameter exists
    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: 'Meal ID is required',
          code: 'MISSING_ID'
        },
        { status: 400 }
      );
    }

    // Validate ID is a valid positive integer
    const mealId = parseInt(id);
    if (isNaN(mealId) || mealId <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid meal ID. Must be a positive integer',
          code: 'INVALID_ID'
        },
        { status: 400 }
      );
    }

    // Query database for meal by ID
    const meal = await db.select()
      .from(mealsLibrary)
      .where(eq(mealsLibrary.id, mealId))
      .limit(1);

    // Check if meal exists
    if (meal.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Meal not found',
          code: 'MEAL_NOT_FOUND'
        },
        { status: 404 }
      );
    }

    // Parse JSON fields and return the meal
    const mealData = meal[0];
    const parsedMeal = {
      id: mealData.id,
      name: mealData.name,
      description: mealData.description,
      mealType: mealData.mealType,
      prepTime: mealData.prepTime,
      cookTime: mealData.cookTime,
      servings: mealData.servings,
      ingredients: typeof mealData.ingredients === 'string' 
        ? JSON.parse(mealData.ingredients) 
        : mealData.ingredients,
      instructions: typeof mealData.instructions === 'string'
        ? JSON.parse(mealData.instructions)
        : mealData.instructions,
      nutrition: typeof mealData.nutrition === 'string'
        ? JSON.parse(mealData.nutrition)
        : mealData.nutrition,
      tags: mealData.tags 
        ? (typeof mealData.tags === 'string' ? JSON.parse(mealData.tags) : mealData.tags)
        : [],
      createdAt: mealData.createdAt
    };

    return NextResponse.json(
      {
        success: true,
        meal: parsedMeal
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('GET /api/meals/library/[id] error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error: ' + error,
        code: 'INTERNAL_ERROR'
      },
      { status: 500 }
    );
  }
}