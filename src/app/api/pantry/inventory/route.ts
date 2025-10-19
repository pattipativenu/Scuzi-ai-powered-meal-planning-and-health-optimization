import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { pantryInventory } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const category = searchParams.get('category');

    // Validate category if provided
    const validCategories = ['freezer', 'fridge', 'cupboard'];
    if (category && !validCategories.includes(category)) {
      return NextResponse.json(
        { 
          error: 'Invalid category. Must be one of: freezer, fridge, cupboard',
          code: 'INVALID_CATEGORY'
        },
        { status: 400 }
      );
    }

    // Build the aggregation query with filtering
    let whereConditions: any[] = [];
    
    if (userId) {
      whereConditions.push(sql`${pantryInventory.userId} = ${parseInt(userId)}`);
    }
    
    if (category) {
      whereConditions.push(sql`${pantryInventory.category} = ${category}`);
    }

    // Construct WHERE clause
    const whereClause = whereConditions.length > 0
      ? sql`WHERE ${sql.join(whereConditions, sql` AND `)}`
      : sql``;

    // Aggregate duplicate ingredients by name, summing quantities
    // Group by ingredientName, category, unit and sum quantities
    const aggregatedInventory = await db.all<{
      ingredientName: string;
      quantity: number;
      category: string;
      unit: string | null;
      lastUpdated: string;
    }>(sql`
      SELECT 
        ingredient_name as ingredientName,
        SUM(quantity) as quantity,
        category,
        unit,
        MAX(last_updated) as lastUpdated
      FROM ${pantryInventory}
      ${whereClause}
      GROUP BY ingredient_name, category, unit
      HAVING SUM(quantity) >= 0
      ORDER BY category ASC, ingredient_name ASC
    `);

    // Calculate summary statistics
    const summary = {
      totalItems: aggregatedInventory.length,
      freezer: aggregatedInventory.filter(item => item.category === 'freezer').length,
      fridge: aggregatedInventory.filter(item => item.category === 'fridge').length,
      cupboard: aggregatedInventory.filter(item => item.category === 'cupboard').length
    };

    return NextResponse.json({
      success: true,
      inventory: aggregatedInventory,
      summary
    }, { status: 200 });

  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error: ' + error
      },
      { status: 500 }
    );
  }
}