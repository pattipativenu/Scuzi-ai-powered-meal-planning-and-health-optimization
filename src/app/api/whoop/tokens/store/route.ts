import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { whoopTokens } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, accessToken, refreshToken, expiresAt } = body;

    // Validate required fields
    if (!userId) {
      return NextResponse.json({ 
        error: "userId is required",
        code: "MISSING_USER_ID" 
      }, { status: 400 });
    }

    if (!accessToken) {
      return NextResponse.json({ 
        error: "accessToken is required",
        code: "MISSING_ACCESS_TOKEN" 
      }, { status: 400 });
    }

    if (!expiresAt) {
      return NextResponse.json({ 
        error: "expiresAt is required",
        code: "MISSING_EXPIRES_AT" 
      }, { status: 400 });
    }

    // Validate expiresAt is a valid ISO timestamp
    const expiresAtDate = new Date(expiresAt);
    if (isNaN(expiresAtDate.getTime())) {
      return NextResponse.json({ 
        error: "expiresAt must be a valid ISO timestamp",
        code: "INVALID_EXPIRES_AT" 
      }, { status: 400 });
    }

    const now = new Date().toISOString();

    // Prepare data for insert
    const tokenData = {
      userId: userId.trim(),
      accessToken: accessToken.trim(),
      refreshToken: refreshToken?.trim() || null,
      expiresAt: expiresAt.trim(),
      createdAt: now,
      updatedAt: now,
    };

    // Try to insert first (UPSERT pattern)
    try {
      const newToken = await db.insert(whoopTokens)
        .values(tokenData)
        .returning();

      return NextResponse.json(newToken[0], { status: 201 });
    } catch (insertError: any) {
      // Check if error is due to unique constraint violation
      if (insertError.message && (
        insertError.message.includes('UNIQUE constraint failed') || 
        insertError.message.includes('unique constraint') ||
        insertError.code === 'SQLITE_CONSTRAINT'
      )) {
        // Update existing record
        const updatedToken = await db.update(whoopTokens)
          .set({
            accessToken: accessToken.trim(),
            refreshToken: refreshToken?.trim() || null,
            expiresAt: expiresAt.trim(),
            updatedAt: new Date().toISOString(),
          })
          .where(eq(whoopTokens.userId, userId.trim()))
          .returning();

        if (updatedToken.length === 0) {
          return NextResponse.json({ 
            error: "Failed to update token record",
            code: "UPDATE_FAILED" 
          }, { status: 500 });
        }

        return NextResponse.json(updatedToken[0], { status: 200 });
      } else {
        // Re-throw if it's a different error
        throw insertError;
      }
    }
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}