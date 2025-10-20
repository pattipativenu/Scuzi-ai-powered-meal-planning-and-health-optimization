import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { mealsLibrary } from '@/db/schema';
import { desc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50);
    
    // Get recent meals from library
    const recentMeals = await db
      .select()
      .from(mealsLibrary)
      .orderBy(desc(mealsLibrary.createdAt))
      .limit(limit);
    
    // Parse JSON fields for response
    const meals = recentMeals.map(meal => ({
      id: meal.id,
      name: meal.name,
      description: meal.description,
      mealType: meal.mealType,
      prepTime: meal.prepTime,
      cookTime: meal.cookTime,
      servings: meal.servings,
      ingredients: typeof meal.ingredients === 'string' 
        ? JSON.parse(meal.ingredients) 
        : meal.ingredients,
      instructions: typeof meal.instructions === 'string' 
        ? JSON.parse(meal.instructions) 
        : meal.instructions,
      nutrition: typeof meal.nutrition === 'string' 
        ? JSON.parse(meal.nutrition) 
        : meal.nutrition,
      tags: typeof meal.tags === 'string' 
        ? JSON.parse(meal.tags) 
        : meal.tags,
      createdAt: meal.createdAt
    }));

    return NextResponse.json({
      success: true,
      meals,
      count: meals.length
    });

  } catch (error) {
    console.error('GET meals/library/recent error:', error);
    return NextResponse.json({
      error: 'Failed to fetch recent meals',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}