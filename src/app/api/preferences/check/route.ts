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
    const preferences = await db
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.userId, userId))
      .limit(1);

    // Return boolean indicating if preferences exist
    const hasPreferences = preferences.length > 0;

    return NextResponse.json(
      {
        success: true,
        hasPreferences
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error: ' + error,
        code: 'INTERNAL_ERROR'
      },
      { status: 500 }
    );
  }
}