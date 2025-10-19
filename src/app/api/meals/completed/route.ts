import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { mealCompletions } from '@/db/schema';
import { eq, and, desc, sql } from 'drizzle-orm';

const VALID_WEEK_TYPES = ['current', 'next'];
const VALID_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    // Extract and validate query parameters
    const userIdParam = searchParams.get('userId');
    const weekType = searchParams.get('weekType');
    const day = searchParams.get('day');
    const limitParam = searchParams.get('limit');

    // Validate weekType
    if (weekType && !VALID_WEEK_TYPES.includes(weekType)) {
      return NextResponse.json({
        error: `Invalid weekType. Must be one of: ${VALID_WEEK_TYPES.join(', ')}`,
        code: 'INVALID_WEEK_TYPE'
      }, { status: 400 });
    }

    // Validate day
    if (day && !VALID_DAYS.includes(day)) {
      return NextResponse.json({
        error: `Invalid day. Must be one of: ${VALID_DAYS.join(', ')}`,
        code: 'INVALID_DAY'
      }, { status: 400 });
    }

    // Validate and parse limit
    const limit = limitParam 
      ? Math.min(parseInt(limitParam), MAX_LIMIT) 
      : DEFAULT_LIMIT;

    if (limitParam && (isNaN(limit) || limit < 1)) {
      return NextResponse.json({
        error: 'Invalid limit. Must be a positive integer between 1 and 100',
        code: 'INVALID_LIMIT'
      }, { status: 400 });
    }

    // Validate userId
    let userId: number | null = null;
    if (userIdParam) {
      userId = parseInt(userIdParam);
      if (isNaN(userId)) {
        return NextResponse.json({
          error: 'Invalid userId. Must be a valid integer',
          code: 'INVALID_USER_ID'
        }, { status: 400 });
      }
    }

    // Build query with filters
    const conditions = [];
    
    if (userId !== null) {
      conditions.push(eq(mealCompletions.userId, userId));
    }
    
    if (weekType) {
      conditions.push(eq(mealCompletions.weekType, weekType));
    }
    
    if (day) {
      conditions.push(eq(mealCompletions.day, day));
    }

    // Execute query
    let query = db.select().from(mealCompletions);
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    const completedMeals = await query
      .orderBy(desc(mealCompletions.completedAt))
      .limit(limit);

    // Calculate summary statistics
    const totalCompleted = completedMeals.length;
    
    let currentWeek = 0;
    let nextWeek = 0;
    const byDay: Record<string, number> = {};
    const byCategory: Record<string, number> = {};

    completedMeals.forEach(meal => {
      // Count by week type
      if (meal.weekType === 'current') {
        currentWeek++;
      } else if (meal.weekType === 'next') {
        nextWeek++;
      }

      // Count by day
      if (meal.day) {
        byDay[meal.day] = (byDay[meal.day] || 0) + 1;
      }

      // Count by category
      if (meal.mealCategory) {
        byCategory[meal.mealCategory] = (byCategory[meal.mealCategory] || 0) + 1;
      }
    });

    return NextResponse.json({
      success: true,
      completedMeals,
      summary: {
        totalCompleted,
        currentWeek,
        nextWeek,
        byDay,
        byCategory
      },
      count: totalCompleted
    }, { status: 200 });

  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({
      error: 'Internal server error: ' + error,
      code: 'INTERNAL_SERVER_ERROR'
    }, { status: 500 });
  }
}