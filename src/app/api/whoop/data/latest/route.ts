import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { whoopHealthData } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');

    // Validate user_id parameter
    if (!userId) {
      return NextResponse.json(
        { 
          error: 'user_id parameter is required',
          code: 'MISSING_USER_ID'
        },
        { status: 400 }
      );
    }

    // Query for latest record
    const result = await db
      .select()
      .from(whoopHealthData)
      .where(eq(whoopHealthData.userId, userId))
      .orderBy(desc(whoopHealthData.date))
      .limit(1);

    // Check if record exists
    if (result.length === 0) {
      return NextResponse.json(
        { 
          error: 'No health data found for this user',
          code: 'NO_DATA_FOUND'
        },
        { status: 404 }
      );
    }

    // Return single record
    return NextResponse.json(result[0], { status: 200 });

  } catch (error) {
    console.error('GET latest error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error: ' + error
      },
      { status: 500 }
    );
  }
}