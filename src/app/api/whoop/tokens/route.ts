import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { whoopTokens } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');

    // Validate user_id parameter
    if (!userId) {
      return NextResponse.json(
        { 
          error: 'user_id query parameter is required',
          code: 'MISSING_USER_ID'
        },
        { status: 400 }
      );
    }

    // Query for user's tokens
    const tokens = await db.select()
      .from(whoopTokens)
      .where(eq(whoopTokens.userId, userId))
      .limit(1);

    // Check if tokens exist
    if (tokens.length === 0) {
      return NextResponse.json(
        { 
          error: 'No tokens found for this user',
          code: 'TOKENS_NOT_FOUND'
        },
        { status: 404 }
      );
    }

    // Return the token record
    return NextResponse.json(tokens[0], { status: 200 });

  } catch (error) {
    console.error('GET tokens error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error: ' + error
      },
      { status: 500 }
    );
  }
}