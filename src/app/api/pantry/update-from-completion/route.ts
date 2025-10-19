import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { pantryInventory } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';

interface Ingredient {
  name: string;
  quantity: number;
  category: string;
  unit: string;
}

interface RequestBody {
  mealId: string;
  weekType: string;
  ingredients: Ingredient[];
  userId?: number;
}

interface UpdatedItem {
  ingredientName: string;
  previousQuantity: number;
  deducted: number;
  newQuantity: number;
}

export async function POST(request: NextRequest) {
  try {
    const body: RequestBody = await request.json();
    const { mealId, weekType, ingredients, userId } = body;

    // Validate required fields
    if (!mealId || typeof mealId !== 'string' || mealId.trim() === '') {
      return NextResponse.json({
        error: 'mealId is required and must be a non-empty string',
        code: 'MISSING_MEAL_ID'
      }, { status: 400 });
    }

    if (!weekType || typeof weekType !== 'string') {
      return NextResponse.json({
        error: 'weekType is required',
        code: 'MISSING_WEEK_TYPE'
      }, { status: 400 });
    }

    // Validate weekType
    if (weekType !== 'current' && weekType !== 'next') {
      return NextResponse.json({
        error: 'weekType must be either "current" or "next"',
        code: 'INVALID_WEEK_TYPE'
      }, { status: 400 });
    }

    // Validate ingredients array
    if (!ingredients || !Array.isArray(ingredients)) {
      return NextResponse.json({
        error: 'ingredients must be an array',
        code: 'INVALID_INGREDIENTS'
      }, { status: 400 });
    }

    if (ingredients.length === 0) {
      return NextResponse.json({
        error: 'ingredients array must contain at least one item',
        code: 'EMPTY_INGREDIENTS'
      }, { status: 400 });
    }

    // Validate each ingredient
    for (let i = 0; i < ingredients.length; i++) {
      const ingredient = ingredients[i];
      
      if (!ingredient.name || typeof ingredient.name !== 'string' || ingredient.name.trim() === '') {
        return NextResponse.json({
          error: `Ingredient at index ${i} must have a non-empty name`,
          code: 'INVALID_INGREDIENT_NAME'
        }, { status: 400 });
      }

      if (typeof ingredient.quantity !== 'number' || ingredient.quantity <= 0 || !Number.isInteger(ingredient.quantity)) {
        return NextResponse.json({
          error: `Ingredient at index ${i} must have a positive integer quantity`,
          code: 'INVALID_INGREDIENT_QUANTITY'
        }, { status: 400 });
      }
    }

    const updated: UpdatedItem[] = [];
    const notFound: string[] = [];
    const currentTimestamp = new Date().toISOString();

    // Process each ingredient
    for (const ingredient of ingredients) {
      const ingredientNameLower = ingredient.name.toLowerCase().trim();

      // Find matching pantry item (case-insensitive)
      const pantryItems = await db.select()
        .from(pantryInventory)
        .where(sql`LOWER(${pantryInventory.ingredientName}) = ${ingredientNameLower}`)
        .limit(1);

      if (pantryItems.length === 0) {
        console.warn(`Ingredient not found in pantry: ${ingredient.name}`);
        notFound.push(ingredient.name);
        continue;
      }

      const pantryItem = pantryItems[0];
      const previousQuantity = pantryItem.quantity;
      const deducted = ingredient.quantity;
      let newQuantity = previousQuantity - deducted;

      // Don't allow negative inventory
      if (newQuantity < 0) {
        newQuantity = 0;
      }

      // Update pantry item
      await db.update(pantryInventory)
        .set({
          quantity: newQuantity,
          lastUpdated: currentTimestamp
        })
        .where(eq(pantryInventory.id, pantryItem.id));

      updated.push({
        ingredientName: pantryItem.ingredientName,
        previousQuantity,
        deducted,
        newQuantity
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Pantry inventory updated for completed meal',
      updated,
      notFound,
      mealId
    }, { status: 200 });

  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({
      error: 'Internal server error: ' + error
    }, { status: 500 });
  }
}