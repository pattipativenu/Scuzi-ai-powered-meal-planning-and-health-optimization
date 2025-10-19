import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { whoopHealthData } from '@/db/schema';
import { and, gte, lte, eq, desc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('user_id');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const limitParam = searchParams.get('limit');

    // Validate required user_id parameter
    if (!userId) {
      return NextResponse.json(
        { 
          error: 'user_id is required',
          code: 'MISSING_USER_ID' 
        },
        { status: 400 }
      );
    }

    // Parse and validate limit
    const limit = limitParam 
      ? Math.min(parseInt(limitParam), 100) 
      : 50;

    if (limitParam && isNaN(parseInt(limitParam))) {
      return NextResponse.json(
        { 
          error: 'Invalid limit parameter',
          code: 'INVALID_LIMIT' 
        },
        { status: 400 }
      );
    }

    // Validate date formats if provided
    if (startDate && isNaN(Date.parse(startDate))) {
      return NextResponse.json(
        { 
          error: 'Invalid start_date format. Use ISO date format (YYYY-MM-DD)',
          code: 'INVALID_START_DATE' 
        },
        { status: 400 }
      );
    }

    if (endDate && isNaN(Date.parse(endDate))) {
      return NextResponse.json(
        { 
          error: 'Invalid end_date format. Use ISO date format (YYYY-MM-DD)',
          code: 'INVALID_END_DATE' 
        },
        { status: 400 }
      );
    }

    // Build where conditions
    const conditions = [eq(whoopHealthData.userId, userId)];

    if (startDate) {
      conditions.push(gte(whoopHealthData.date, startDate));
    }

    if (endDate) {
      conditions.push(lte(whoopHealthData.date, endDate));
    }

    // Execute query with filters
    const results = await db
      .select()
      .from(whoopHealthData)
      .where(and(...conditions))
      .orderBy(desc(whoopHealthData.date))
      .limit(limit);

    return NextResponse.json(results, { status: 200 });

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