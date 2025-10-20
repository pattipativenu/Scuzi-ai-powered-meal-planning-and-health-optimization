import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { mealsLibrary } from '@/db/schema';

export async function GET(request: NextRequest) {
  try {
    console.log('[TEST] Testing database connection...');
    
    // Try to count meals in library
    const meals = await db.select().from(mealsLibrary).limit(1);
    
    console.log('[TEST] Database query successful, found meals:', meals.length);
    
    return NextResponse.json({
      success: true,
      message: 'Database connection working',
      mealCount: meals.length,
      sampleMeal: meals[0] || null
    });

  } catch (error) {
    console.error('[TEST] Database connection failed:', error);
    return NextResponse.json({
      success: false,
      error: 'Database connection failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('[TEST] Testing meal creation...');
    
    const now = new Date().toISOString();
    
    // Try to insert a test meal
    const result = await db.insert(mealsLibrary).values({
      name: 'Test Recipe',
      description: 'A test recipe to verify database functionality',
      mealType: 'dinner',
      prepTime: 10,
      cookTime: 15,
      servings: 2,
      ingredients: JSON.stringify([
        { name: 'Test ingredient', amount: '1 cup', category: 'cupboard' }
      ]),
      instructions: JSON.stringify(['Test instruction']),
      nutrition: JSON.stringify({
        calories: 200,
        protein: 10,
        carbohydrates: 20,
        fat: 5,
        fiber: 3,
        sugar: 2,
        sodium: 300
      }),
      tags: JSON.stringify(['test']),
      createdAt: now
    }).returning({ id: mealsLibrary.id });
    
    const mealId = result[0]?.id;
    console.log('[TEST] Test meal created with ID:', mealId);
    
    return NextResponse.json({
      success: true,
      message: 'Test meal created successfully',
      mealId
    });

  } catch (error) {
    console.error('[TEST] Test meal creation failed:', error);
    return NextResponse.json({
      success: false,
      error: 'Test meal creation failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}