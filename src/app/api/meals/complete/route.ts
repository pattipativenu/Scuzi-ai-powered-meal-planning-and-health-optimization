import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { mealCompletions } from '@/db/schema';
import { and, eq } from 'drizzle-orm';

const VALID_WEEK_TYPES = ['current', 'next'];
const VALID_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const VALID_MEAL_CATEGORIES = ['breakfast', 'lunch', 'snack', 'dinner'];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { mealId, mealName, weekType, day, mealCategory, userId } = body;

    // Validate required fields
    if (!mealId || typeof mealId !== 'string' || mealId.trim() === '') {
      return NextResponse.json(
        { 
          error: 'mealId is required and must be a non-empty string',
          code: 'MISSING_MEAL_ID'
        },
        { status: 400 }
      );
    }

    if (!mealName || typeof mealName !== 'string' || mealName.trim() === '') {
      return NextResponse.json(
        { 
          error: 'mealName is required and must be a non-empty string',
          code: 'MISSING_MEAL_NAME'
        },
        { status: 400 }
      );
    }

    if (!weekType || typeof weekType !== 'string') {
      return NextResponse.json(
        { 
          error: 'weekType is required',
          code: 'MISSING_WEEK_TYPE'
        },
        { status: 400 }
      );
    }

    if (!day || typeof day !== 'string') {
      return NextResponse.json(
        { 
          error: 'day is required',
          code: 'MISSING_DAY'
        },
        { status: 400 }
      );
    }

    // Validate weekType
    if (!VALID_WEEK_TYPES.includes(weekType)) {
      return NextResponse.json(
        { 
          error: `weekType must be one of: ${VALID_WEEK_TYPES.join(', ')}`,
          code: 'INVALID_WEEK_TYPE'
        },
        { status: 400 }
      );
    }

    // Validate day
    if (!VALID_DAYS.includes(day)) {
      return NextResponse.json(
        { 
          error: `day must be one of: ${VALID_DAYS.join(', ')}`,
          code: 'INVALID_DAY'
        },
        { status: 400 }
      );
    }

    // Validate mealCategory if provided
    if (mealCategory && !VALID_MEAL_CATEGORIES.includes(mealCategory)) {
      return NextResponse.json(
        { 
          error: `mealCategory must be one of: ${VALID_MEAL_CATEGORIES.join(', ')}`,
          code: 'INVALID_MEAL_CATEGORY'
        },
        { status: 400 }
      );
    }

    // Check for duplicate completion
    const existingCompletion = await db
      .select()
      .from(mealCompletions)
      .where(
        and(
          eq(mealCompletions.mealId, mealId.trim()),
          eq(mealCompletions.weekType, weekType),
          eq(mealCompletions.day, day)
        )
      )
      .limit(1);

    if (existingCompletion.length > 0) {
      return NextResponse.json(
        { 
          error: 'This meal has already been marked as completed for this week and day',
          code: 'DUPLICATE_COMPLETION'
        },
        { status: 409 }
      );
    }

    // Insert completion record
    const completionData = {
      mealId: mealId.trim(),
      mealName: mealName.trim(),
      weekType,
      day,
      mealCategory: mealCategory || null,
      completedAt: new Date().toISOString(),
      userId: userId || null,
    };

    const newCompletion = await db
      .insert(mealCompletions)
      .values(completionData)
      .returning();

    return NextResponse.json(
      {
        success: true,
        message: 'Meal marked as completed',
        completion: newCompletion[0]
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error: ' + error
      },
      { status: 500 }
    );
  }
}