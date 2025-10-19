import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { shoppingList, pantryInventory } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { itemIds } = body;

    // Validate itemIds array
    if (!itemIds || !Array.isArray(itemIds) || itemIds.length === 0) {
      return NextResponse.json(
        { 
          error: "itemIds array is required and must not be empty",
          code: "MISSING_ITEM_IDS"
        },
        { status: 400 }
      );
    }

    // Validate all itemIds are positive integers
    for (const id of itemIds) {
      if (!Number.isInteger(id) || id <= 0) {
        return NextResponse.json(
          { 
            error: "All itemIds must be positive integers",
            code: "INVALID_ITEM_ID"
          },
          { status: 400 }
        );
      }
    }

    const markedAsPurchased = [];
    const pantryUpdates = [];

    // Process each shopping list item
    for (const itemId of itemIds) {
      // Fetch the shopping list item
      const shoppingItems = await db.select()
        .from(shoppingList)
        .where(eq(shoppingList.id, itemId))
        .limit(1);

      if (shoppingItems.length === 0) {
        return NextResponse.json(
          { 
            error: `Shopping list item with ID ${itemId} not found`,
            code: "ITEM_NOT_FOUND"
          },
          { status: 404 }
        );
      }

      const shoppingItem = shoppingItems[0];

      // Mark shopping list item as purchased
      await db.update(shoppingList)
        .set({
          isPurchased: true
        })
        .where(eq(shoppingList.id, itemId));

      markedAsPurchased.push({
        id: shoppingItem.id,
        ingredientName: shoppingItem.ingredientName,
        quantity: shoppingItem.quantity
      });

      // Find matching pantry item (case-insensitive)
      const existingPantryItems = await db.select()
        .from(pantryInventory)
        .where(sql`lower(${pantryInventory.ingredientName}) = lower(${shoppingItem.ingredientName})`)
        .limit(1);

      const currentTimestamp = new Date().toISOString();

      if (existingPantryItems.length > 0) {
        // Update existing pantry item
        const existingItem = existingPantryItems[0];
        const previousQuantity = existingItem.quantity;
        const newQuantity = previousQuantity + shoppingItem.quantity;

        await db.update(pantryInventory)
          .set({
            quantity: newQuantity,
            lastUpdated: currentTimestamp
          })
          .where(eq(pantryInventory.id, existingItem.id));

        pantryUpdates.push({
          ingredientName: existingItem.ingredientName,
          previousQuantity,
          added: shoppingItem.quantity,
          newQuantity,
          action: 'updated'
        });
      } else {
        // Create new pantry item
        await db.insert(pantryInventory)
          .values({
            ingredientName: shoppingItem.ingredientName,
            quantity: shoppingItem.quantity,
            category: shoppingItem.category,
            unit: shoppingItem.unit,
            lastUpdated: currentTimestamp,
            userId: shoppingItem.userId
          });

        pantryUpdates.push({
          ingredientName: shoppingItem.ingredientName,
          previousQuantity: 0,
          added: shoppingItem.quantity,
          newQuantity: shoppingItem.quantity,
          action: 'created'
        });
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: `Confirmed purchase of ${itemIds.length} ${itemIds.length === 1 ? 'item' : 'items'} and updated pantry`,
        markedAsPurchased,
        pantryUpdates,
        itemsProcessed: itemIds.length
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error: ' + error
      },
      { status: 500 }
    );
  }
}