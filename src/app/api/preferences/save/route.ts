import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { userPreferences } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      userId,
      timestamp,
      userGoal,
      userAllergies,
      preferredCuisines,
      prepStyle,
      equipment,
      mealsPerDay,
      dietType,
      activityLevel
    } = body;

    // Validate required fields
    if (!timestamp) {
      return NextResponse.json({ 
        error: "Timestamp is required",
        code: "MISSING_REQUIRED_FIELD" 
      }, { status: 400 });
    }

    // Validate mealsPerDay if provided
    if (mealsPerDay !== undefined && ![3, 4, 5].includes(mealsPerDay)) {
      return NextResponse.json({ 
        error: "Meals per day must be 3, 4, or 5",
        code: "INVALID_MEALS_PER_DAY" 
      }, { status: 400 });
    }

    const currentTimestamp = new Date().toISOString();

    // Check if preferences exist for this userId
    let existingPreferences = [];
    if (userId) {
      existingPreferences = await db.select()
        .from(userPreferences)
        .where(eq(userPreferences.userId, userId))
        .limit(1);
    }

    let savedPreferences;

    if (existingPreferences.length > 0) {
      // Update existing record
      const updateData: any = {
        timestamp,
        updatedAt: currentTimestamp
      };

      if (userGoal !== undefined) updateData.userGoal = userGoal;
      if (userAllergies !== undefined) updateData.userAllergies = userAllergies;
      if (preferredCuisines !== undefined) updateData.preferredCuisines = preferredCuisines;
      if (prepStyle !== undefined) updateData.prepStyle = prepStyle;
      if (equipment !== undefined) updateData.equipment = equipment;
      if (mealsPerDay !== undefined) updateData.mealsPerDay = mealsPerDay;
      if (dietType !== undefined) updateData.dietType = dietType;
      if (activityLevel !== undefined) updateData.activityLevel = activityLevel;

      const updated = await db.update(userPreferences)
        .set(updateData)
        .where(eq(userPreferences.userId, userId))
        .returning();

      savedPreferences = updated[0];
    } else {
      // Insert new record
      const insertData = {
        userId: userId || null,
        timestamp,
        userGoal: userGoal || null,
        userAllergies: userAllergies || null,
        preferredCuisines: preferredCuisines || null,
        prepStyle: prepStyle || null,
        equipment: equipment || null,
        mealsPerDay: mealsPerDay || null,
        dietType: dietType || null,
        activityLevel: activityLevel || null,
        createdAt: currentTimestamp,
        updatedAt: currentTimestamp
      };

      const inserted = await db.insert(userPreferences)
        .values(insertData)
        .returning();

      savedPreferences = inserted[0];
    }

    return NextResponse.json({
      success: true,
      message: "Preferences saved successfully",
      preferences: savedPreferences
    }, { status: 200 });

  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}