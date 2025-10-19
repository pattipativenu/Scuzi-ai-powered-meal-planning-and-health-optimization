import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { shoppingList } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const includePurchased = searchParams.get('includePurchased') === 'true';

    // Validate userId if provided
    if (userId && isNaN(parseInt(userId))) {
      return NextResponse.json(
        { 
          error: 'Invalid userId parameter',
          code: 'INVALID_USER_ID'
        },
        { status: 400 }
      );
    }

    // Build query conditions
    const conditions = [];
    
    // Filter by purchased status (default: only unpurchased)
    if (!includePurchased) {
      conditions.push(eq(shoppingList.isPurchased, false));
    }

    // Filter by userId if provided
    if (userId) {
      conditions.push(eq(shoppingList.userId, parseInt(userId)));
    }

    // Execute query
    let query = db.select().from(shoppingList);
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const items = await query;

    // Sort results by category, then by ingredientName
    const sortedItems = items.sort((a, b) => {
      const categoryCompare = (a.category || '').localeCompare(b.category || '');
      if (categoryCompare !== 0) return categoryCompare;
      return (a.ingredientName || '').localeCompare(b.ingredientName || '');
    });

    // Calculate summary statistics
    const totalItems = sortedItems.length;
    const unpurchased = sortedItems.filter(item => !item.isPurchased).length;
    
    const byCategory: Record<string, number> = {};
    sortedItems.forEach(item => {
      const category = item.category || 'uncategorized';
      byCategory[category] = (byCategory[category] || 0) + 1;
    });

    // Format response
    const response = {
      success: true,
      shoppingList: sortedItems.map(item => ({
        id: item.id,
        ingredientName: item.ingredientName,
        quantity: item.quantity,
        category: item.category,
        unit: item.unit,
        isPurchased: item.isPurchased,
        createdAt: item.createdAt
      })),
      summary: {
        totalItems,
        unpurchased,
        byCategory
      }
    };

    return NextResponse.json(response, { status: 200 });

  } catch (error) {
    console.error('GET shopping list error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error: ' + error,
        code: 'INTERNAL_ERROR'
      },
      { status: 500 }
    );
  }
}