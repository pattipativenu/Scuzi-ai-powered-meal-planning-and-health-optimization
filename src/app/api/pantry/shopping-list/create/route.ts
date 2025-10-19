import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { shoppingList } from '@/db/schema';

interface ShoppingListItem {
  name: string;
  quantity: number;
  category: string;
  unit?: string;
}

interface RequestBody {
  items: ShoppingListItem[];
  userId?: number;
}

const VALID_CATEGORIES = ['freezer', 'fridge', 'cupboard'] as const;

export async function POST(request: NextRequest) {
  try {
    const body: RequestBody = await request.json();

    // Validate items array exists and is not empty
    if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json(
        { 
          error: 'Items array is required and must contain at least one item',
          code: 'ITEMS_REQUIRED' 
        },
        { status: 400 }
      );
    }

    // Validate each item
    for (let i = 0; i < body.items.length; i++) {
      const item = body.items[i];

      // Validate required fields presence
      if (!item.name || typeof item.name !== 'string' || item.name.trim() === '') {
        return NextResponse.json(
          { 
            error: `Item at index ${i}: name is required and must be a non-empty string`,
            code: 'INVALID_ITEM_NAME' 
          },
          { status: 400 }
        );
      }

      if (item.quantity === undefined || item.quantity === null) {
        return NextResponse.json(
          { 
            error: `Item at index ${i}: quantity is required`,
            code: 'QUANTITY_REQUIRED' 
          },
          { status: 400 }
        );
      }

      // Validate quantity is positive integer
      if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
        return NextResponse.json(
          { 
            error: `Item at index ${i}: quantity must be a positive integer`,
            code: 'INVALID_QUANTITY' 
          },
          { status: 400 }
        );
      }

      if (!item.category || typeof item.category !== 'string') {
        return NextResponse.json(
          { 
            error: `Item at index ${i}: category is required`,
            code: 'CATEGORY_REQUIRED' 
          },
          { status: 400 }
        );
      }

      // Validate category is one of allowed values
      if (!VALID_CATEGORIES.includes(item.category as any)) {
        return NextResponse.json(
          { 
            error: `Item at index ${i}: category must be one of: ${VALID_CATEGORIES.join(', ')}`,
            code: 'INVALID_CATEGORY' 
          },
          { status: 400 }
        );
      }

      // Validate unit if provided
      if (item.unit !== undefined && typeof item.unit !== 'string') {
        return NextResponse.json(
          { 
            error: `Item at index ${i}: unit must be a string if provided`,
            code: 'INVALID_UNIT' 
          },
          { status: 400 }
        );
      }
    }

    // Prepare items for insertion
    const currentTimestamp = new Date().toISOString();
    const itemsToInsert = body.items.map(item => ({
      ingredientName: item.name.trim(),
      quantity: item.quantity,
      category: item.category,
      unit: item.unit?.trim() || null,
      isPurchased: false,
      createdAt: currentTimestamp,
      userId: body.userId || null,
    }));

    // Insert all items into database
    const createdItems = await db.insert(shoppingList)
      .values(itemsToInsert)
      .returning();

    return NextResponse.json(
      {
        success: true,
        message: `Shopping list created with ${createdItems.length} item${createdItems.length !== 1 ? 's' : ''}`,
        shoppingList: createdItems,
        itemsCreated: createdItems.length,
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('POST shopping list error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error: ' + error 
      },
      { status: 500 }
    );
  }
}