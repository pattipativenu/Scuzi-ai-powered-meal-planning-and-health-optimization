import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { whoopTokens } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, accessToken, expiresAt } = body;

    // Validate required fields
    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required', code: 'MISSING_USER_ID' },
        { status: 400 }
      );
    }

    if (!accessToken) {
      return NextResponse.json(
        { error: 'accessToken is required', code: 'MISSING_ACCESS_TOKEN' },
        { status: 400 }
      );
    }

    if (!expiresAt) {
      return NextResponse.json(
        { error: 'expiresAt is required', code: 'MISSING_EXPIRES_AT' },
        { status: 400 }
      );
    }

    // Validate expiresAt is valid ISO timestamp
    const expiresAtDate = new Date(expiresAt);
    if (isNaN(expiresAtDate.getTime())) {
      return NextResponse.json(
        { error: 'expiresAt must be a valid ISO timestamp', code: 'INVALID_EXPIRES_AT' },
        { status: 400 }
      );
    }

    // Update the token record
    const updatedToken = await db
      .update(whoopTokens)
      .set({
        accessToken: accessToken.trim(),
        expiresAt,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(whoopTokens.userId, userId))
      .returning();

    // Check if record was found and updated
    if (updatedToken.length === 0) {
      return NextResponse.json(
        { error: 'User not found', code: 'USER_NOT_FOUND' },
        { status: 404 }
      );
    }

    return NextResponse.json(updatedToken[0], { status: 200 });
  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error },
      { status: 500 }
    );
  }
}