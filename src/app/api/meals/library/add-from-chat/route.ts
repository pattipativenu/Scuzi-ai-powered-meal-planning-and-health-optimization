import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { mealsLibrary } from '@/db/schema';

interface ChatMeal {
  name: string;
  description?: string;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  prepTime?: number;
  cookTime?: number;
  servings?: number;
  ingredients: string[];
  instructions: string[];
  nutrition?: {
    calories?: number;
    protein?: number;
    fat?: number;
    carbs?: number;
    fiber?: number;
  };
  tags?: string[];
  whyHelpful?: string;
}

export async function POST(request: NextRequest) {
  try {
    const { meal, source = 'chat' }: { meal: ChatMeal; source?: string } = await request.json();

    if (!meal || !meal.name) {
      return NextResponse.json({
        error: 'Meal data with name is required',
        code: 'INVALID_MEAL_DATA'
      }, { status: 400 });
    }

    // Validate required fields
    if (!meal.ingredients || !Array.isArray(meal.ingredients) || meal.ingredients.length === 0) {
      return NextResponse.json({
        error: 'Meal must have ingredients',
        code: 'MISSING_INGREDIENTS'
      }, { status: 400 });
    }

    if (!meal.instructions || !Array.isArray(meal.instructions) || meal.instructions.length === 0) {
      return NextResponse.json({
        error: 'Meal must have cooking instructions',
        code: 'MISSING_INSTRUCTIONS'
      }, { status: 400 });
    }

    // Check if meal already exists (prevent duplicates)
    const existingMeals = await db.select().from(mealsLibrary);
    const normalizedName = meal.name.toLowerCase().trim();
    const duplicate = existingMeals.find(m => 
      m.name.toLowerCase().trim() === normalizedName && m.mealType === meal.mealType
    );

    if (duplicate) {
      return NextResponse.json({
        error: 'A meal with this name and type already exists in the library',
        code: 'DUPLICATE_MEAL',
        existingMeal: {
          id: duplicate.id,
          name: duplicate.name,
          mealType: duplicate.mealType
        }
      }, { status: 409 });
    }

    // Prepare meal for database
    const mealForDb = {
      name: meal.name.trim(),
      description: meal.whyHelpful || meal.description || `Delicious ${meal.mealType} meal`,
      mealType: meal.mealType,
      prepTime: meal.prepTime || null,
      cookTime: meal.cookTime || null,
      servings: meal.servings || 1,
      ingredients: JSON.stringify(meal.ingredients),
      instructions: JSON.stringify(meal.instructions),
      nutrition: JSON.stringify(meal.nutrition || {
        calories: 300,
        protein: 15,
        fat: 10,
        carbs: 30,
        fiber: 5
      }),
      tags: JSON.stringify(meal.tags || ['Chat Generated']),
      imageUrl: null, // Will be generated on-demand
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Insert into database
    const insertedMeal = await db.insert(mealsLibrary).values(mealForDb).returning();

    return NextResponse.json({
      success: true,
      message: `Successfully added "${meal.name}" to your meals library`,
      meal: {
        id: insertedMeal[0].id,
        name: insertedMeal[0].name,
        mealType: insertedMeal[0].mealType,
        source
      },
      libraryStats: {
        totalMeals: existingMeals.length + 1
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Add to library error:', error);
    return NextResponse.json({
      error: 'Failed to add meal to library',
      code: 'ADD_ERROR',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// GET endpoint for checking if a meal exists
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const name = searchParams.get('name');
    const mealType = searchParams.get('meal_type');

    if (!name) {
      return NextResponse.json({
        error: 'Meal name is required',
        code: 'MISSING_NAME'
      }, { status: 400 });
    }

    const existingMeals = await db.select().from(mealsLibrary);
    const normalizedName = name.toLowerCase().trim();
    
    let duplicate = null;
    if (mealType) {
      duplicate = existingMeals.find(m => 
        m.name.toLowerCase().trim() === normalizedName && m.mealType === mealType
      );
    } else {
      duplicate = existingMeals.find(m => 
        m.name.toLowerCase().trim() === normalizedName
      );
    }

    return NextResponse.json({
      exists: !!duplicate,
      meal: duplicate ? {
        id: duplicate.id,
        name: duplicate.name,
        mealType: duplicate.mealType,
        createdAt: duplicate.createdAt
      } : null,
      totalMeals: existingMeals.length
    });

  } catch (error) {
    console.error('Check meal error:', error);
    return NextResponse.json({
      error: 'Failed to check meal existence',
      code: 'CHECK_ERROR'
    }, { status: 500 });
  }
}