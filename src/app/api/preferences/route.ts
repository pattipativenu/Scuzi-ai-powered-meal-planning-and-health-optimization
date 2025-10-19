import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { userPreferences } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    // Validate userId parameter
    if (!userId) {
      return NextResponse.json(
        { 
          error: 'userId query parameter is required',
          code: 'MISSING_USER_ID'
        },
        { status: 400 }
      );
    }

    // Query database for user preferences
    const result = await db
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.userId, userId))
      .limit(1);

    // Return null if no preferences found
    if (result.length === 0) {
      return NextResponse.json(
        {
          success: true,
          preferences: null
        },
        { status: 200 }
      );
    }

    // Return preferences if found
    return NextResponse.json(
      {
        success: true,
        preferences: result[0]
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('GET user preferences error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error: ' + error,
        code: 'INTERNAL_ERROR'
      },
      { status: 500 }
    );
  }
}