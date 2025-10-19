import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { pantryInventory } from '@/db/schema';
import { eq, lte, and, asc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userIdParam = searchParams.get('userId');

    // Validate userId if provided
    if (userIdParam && isNaN(parseInt(userIdParam))) {
      return NextResponse.json(
        { 
          error: 'Invalid userId format. Must be a valid integer.',
          code: 'INVALID_USER_ID'
        },
        { status: 400 }
      );
    }

    // Build query to find items with quantity <= 0
    let query = db
      .select()
      .from(pantryInventory)
      .where(lte(pantryInventory.quantity, 0));

    // Add userId filter if provided
    if (userIdParam) {
      const userId = parseInt(userIdParam);
      query = query.where(
        and(
          lte(pantryInventory.quantity, 0),
          eq(pantryInventory.userId, userId)
        )
      );
    }

    // Sort by category, then by ingredient name
    query = query.orderBy(
      asc(pantryInventory.category),
      asc(pantryInventory.ingredientName)
    );

    const outOfStockItems = await query;

    // If no items need to be purchased
    if (outOfStockItems.length === 0) {
      return NextResponse.json({
        success: true,
        needToBuy: [],
        summary: {
          totalItems: 0,
          byCategory: {
            freezer: 0,
            fridge: 0,
            cupboard: 0
          }
        },
        message: 'No items need to be purchased. Pantry is fully stocked!'
      });
    }

    // Format items for shopping list with suggested quantities
    const needToBuy = outOfStockItems.map(item => ({
      ingredientName: item.ingredientName,
      currentQuantity: item.quantity,
      category: item.category,
      unit: item.unit || 'units',
      suggestedQuantity: 5 // Default suggested quantity
    }));

    // Calculate summary statistics by category
    const byCategory = {
      freezer: 0,
      fridge: 0,
      cupboard: 0
    };

    outOfStockItems.forEach(item => {
      const category = item.category.toLowerCase();
      if (category === 'freezer' || category === 'fridge' || category === 'cupboard') {
        byCategory[category as keyof typeof byCategory]++;
      }
    });

    const totalItems = outOfStockItems.length;

    return NextResponse.json({
      success: true,
      needToBuy,
      summary: {
        totalItems,
        byCategory
      },
      message: `Found ${totalItems} item${totalItems === 1 ? '' : 's'} that need${totalItems === 1 ? 's' : ''} to be purchased`
    });

  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error: Failed to calculate shopping needs. ' + error,
        code: 'INTERNAL_ERROR'
      },
      { status: 500 }
    );
  }
}