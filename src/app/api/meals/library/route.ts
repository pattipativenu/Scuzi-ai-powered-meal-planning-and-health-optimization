import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/mysql-connection';
import { meals } from '@/db/mysql-schema';
import { and, eq, like, sql, inArray } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Query parameters
    const mealType = searchParams.get('mealType');
    const tags = searchParams.get('tags')?.split(',').filter(Boolean);
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const hasImage = searchParams.get('hasImage') === 'true';

    // Build where conditions
    const conditions = [];

    if (mealType) {
      conditions.push(eq(meals.mealType, mealType));
    }

    if (search) {
      conditions.push(
        sql`(${meals.mealName} ILIKE ${`%${search}%`} OR ${meals.tagline} ILIKE ${`%${search}%`})`
      );
    }

    if (hasImage) {
      conditions.push(sql`${meals.imageUrl} IS NOT NULL AND ${meals.imageUrl} != ''`);
    }

    if (tags && tags.length > 0) {
      // Check if any of the provided tags exist in the meal's tags array
      const tagConditions = tags.map(tag => 
        sql`${meals.tags}::jsonb ? ${tag}`
      );
      conditions.push(sql`(${sql.join(tagConditions, sql` OR `)})`);
    }

    // Execute query
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    
    const mealsResult = await db.select()
      .from(meals)
      .where(whereClause)
      .limit(limit)
      .offset(offset)
      .orderBy(meals.createdAt);

    // Get total count for pagination
    const totalCountResult = await db.select({ count: sql<number>`count(*)` })
      .from(meals)
      .where(whereClause);
    
    const totalCount = totalCountResult[0]?.count || 0;

    return NextResponse.json({
      success: true,
      meals: mealsResult,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount,
      },
      filters: {
        mealType,
        tags,
        search,
        hasImage,
      },
    });

  } catch (error) {
    console.error('Meal library API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch meals from library' },
      { status: 500 }
    );
  }
}

// POST endpoint for advanced meal selection (used by Bedrock)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      mealTypes = [], 
      tags = [], 
      excludeTags = [],
      nutritionCriteria = {},
      maxResults = 28,
      diversityMode = true 
    } = body;

    console.log('🔍 Bedrock meal selection criteria:', {
      mealTypes,
      tags,
      excludeTags,
      nutritionCriteria,
      maxResults,
    });

    // Build base query conditions
    const conditions = [];

    // Filter by meal types
    if (mealTypes.length > 0) {
      conditions.push(inArray(meals.mealType, mealTypes));
    }

    // Must have image
    conditions.push(sql`${meals.imageUrl} IS NOT NULL AND ${meals.imageUrl} != ''`);

    // Include tags (at least one must match)
    if (tags.length > 0) {
      const tagConditions = tags.map((tag: string) => 
        sql`${meals.tags}::jsonb ? ${tag}`
      );
      conditions.push(sql`(${sql.join(tagConditions, sql` OR `)})`);
    }

    // Exclude tags (none should match)
    if (excludeTags.length > 0) {
      const excludeConditions = excludeTags.map((tag: string) => 
        sql`NOT (${meals.tags}::jsonb ? ${tag})`
      );
      conditions.push(sql`(${sql.join(excludeConditions, sql` AND `)})`);
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get all matching meals
    let selectedMeals = await db.select()
      .from(meals)
      .where(whereClause)
      .orderBy(sql`RANDOM()`); // Random order for diversity

    // If we have more meals than needed and diversity mode is on
    if (diversityMode && selectedMeals.length > maxResults) {
      // Ensure we have a good distribution across meal types
      const mealsByType = selectedMeals.reduce((acc, meal) => {
        if (!acc[meal.mealType]) acc[meal.mealType] = [];
        acc[meal.mealType].push(meal);
        return acc;
      }, {} as Record<string, any[]>);

      const finalMeals = [];
      const targetPerType = Math.floor(maxResults / Object.keys(mealsByType).length);
      
      // Take roughly equal amounts from each meal type
      for (const [type, typeMeals] of Object.entries(mealsByType)) {
        const takeCount = Math.min(targetPerType, typeMeals.length);
        finalMeals.push(...typeMeals.slice(0, takeCount));
      }

      // Fill remaining slots with random meals
      const remaining = maxResults - finalMeals.length;
      if (remaining > 0) {
        const unusedMeals = selectedMeals.filter(meal => 
          !finalMeals.some(fm => fm.id === meal.id)
        );
        finalMeals.push(...unusedMeals.slice(0, remaining));
      }

      selectedMeals = finalMeals;
    } else {
      // Just take the first maxResults
      selectedMeals = selectedMeals.slice(0, maxResults);
    }

    console.log(`✅ Selected ${selectedMeals.length} meals from library`);

    return NextResponse.json({
      success: true,
      meals: selectedMeals,
      selectionCriteria: {
        mealTypes,
        tags,
        excludeTags,
        nutritionCriteria,
        maxResults,
        diversityMode,
      },
      stats: {
        totalSelected: selectedMeals.length,
        byType: selectedMeals.reduce((acc, meal) => {
          acc[meal.mealType] = (acc[meal.mealType] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
      },
    });

  } catch (error) {
    console.error('Meal selection API error:', error);
    return NextResponse.json(
      { error: 'Failed to select meals from library' },
      { status: 500 }
    );
  }
}