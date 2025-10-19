import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { mealsLibrary } from '@/db/schema';
import { eq, sql, and, or, like } from 'drizzle-orm';

const VALID_MEAL_TYPES = ['breakfast', 'lunch', 'snack', 'dinner'];
const DEFAULT_COUNT = 7;
const MAX_COUNT = 28;

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    // Parse and validate count parameter
    const countParam = searchParams.get('count');
    const count = countParam ? parseInt(countParam) : DEFAULT_COUNT;
    
    if (isNaN(count) || count < 1 || count > MAX_COUNT) {
      return NextResponse.json(
        { 
          error: `Count must be between 1 and ${MAX_COUNT}`,
          code: 'INVALID_COUNT'
        },
        { status: 400 }
      );
    }

    // Parse and validate meal_type parameter
    const mealType = searchParams.get('meal_type');
    if (mealType && !VALID_MEAL_TYPES.includes(mealType)) {
      return NextResponse.json(
        { 
          error: `Invalid meal type. Must be one of: ${VALID_MEAL_TYPES.join(', ')}`,
          code: 'INVALID_MEAL_TYPE'
        },
        { status: 400 }
      );
    }

    // Parse tags parameter
    const tagsParam = searchParams.get('tags');
    const tags = tagsParam ? tagsParam.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0) : null;

    // Parse balanced parameter
    const balanced = searchParams.get('balanced') === 'true';

    // Build query conditions
    const conditions = [];
    
    if (mealType) {
      conditions.push(eq(mealsLibrary.mealType, mealType));
    }

    // If balanced mode and count >= 4, we need to handle distribution
    if (balanced && count >= 4) {
      const mealsPerType = Math.floor(count / 4);
      const remainder = count % 4;
      
      const distribution = {
        breakfast: mealsPerType + (remainder > 0 ? 1 : 0),
        lunch: mealsPerType + (remainder > 1 ? 1 : 0),
        snack: mealsPerType + (remainder > 2 ? 1 : 0),
        dinner: mealsPerType
      };

      const allMeals: any[] = [];

      // Fetch random meals for each meal type
      for (const type of VALID_MEAL_TYPES) {
        const typeConditions = [eq(mealsLibrary.mealType, type)];
        
        if (tags && tags.length > 0) {
          typeConditions.push(
            or(
              ...tags.map(tag => 
                sql`json_array_length(json_extract(${mealsLibrary.tags}, '$')) > 0 AND 
                    EXISTS (SELECT 1 FROM json_each(${mealsLibrary.tags}) 
                           WHERE json_each.value LIKE ${`%${tag}%`})`
              )
            )!
          );
        }

        const typeMeals = await db
          .select()
          .from(mealsLibrary)
          .where(and(...typeConditions))
          .orderBy(sql`RANDOM()`)
          .limit(distribution[type as keyof typeof distribution]);

        allMeals.push(...typeMeals);
      }

      // Calculate actual distribution
      const actualDistribution = {
        breakfast: 0,
        lunch: 0,
        snack: 0,
        dinner: 0
      };

      allMeals.forEach(meal => {
        if (meal.mealType in actualDistribution) {
          actualDistribution[meal.mealType as keyof typeof actualDistribution]++;
        }
      });

      // Parse JSON fields
      const parsedMeals = allMeals.map(meal => ({
        ...meal,
        ingredients: typeof meal.ingredients === 'string' ? JSON.parse(meal.ingredients) : meal.ingredients,
        instructions: typeof meal.instructions === 'string' ? JSON.parse(meal.instructions) : meal.instructions,
        nutrition: typeof meal.nutrition === 'string' ? JSON.parse(meal.nutrition) : meal.nutrition,
        tags: meal.tags ? (typeof meal.tags === 'string' ? JSON.parse(meal.tags) : meal.tags) : []
      }));

      return NextResponse.json({
        success: true,
        meals: parsedMeals.slice(0, count),
        count: parsedMeals.length,
        distribution: actualDistribution
      }, { status: 200 });
    }

    // Non-balanced mode or count < 4
    if (tags && tags.length > 0) {
      conditions.push(
        or(
          ...tags.map(tag => 
            sql`json_array_length(json_extract(${mealsLibrary.tags}, '$')) > 0 AND 
                EXISTS (SELECT 1 FROM json_each(${mealsLibrary.tags}) 
                       WHERE json_each.value LIKE ${`%${tag}%`})`
          )
        )!
      );
    }

    // Build final query
    let query = db.select().from(mealsLibrary);

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    const meals = await query
      .orderBy(sql`RANDOM()`)
      .limit(count);

    // Calculate distribution for response
    const distribution = {
      breakfast: 0,
      lunch: 0,
      snack: 0,
      dinner: 0
    };

    meals.forEach(meal => {
      if (meal.mealType in distribution) {
        distribution[meal.mealType as keyof typeof distribution]++;
      }
    });

    // Parse JSON fields
    const parsedMeals = meals.map(meal => ({
      ...meal,
      ingredients: typeof meal.ingredients === 'string' ? JSON.parse(meal.ingredients) : meal.ingredients,
      instructions: typeof meal.instructions === 'string' ? JSON.parse(meal.instructions) : meal.instructions,
      nutrition: typeof meal.nutrition === 'string' ? JSON.parse(meal.nutrition) : meal.nutrition,
      tags: meal.tags ? (typeof meal.tags === 'string' ? JSON.parse(meal.tags) : meal.tags) : []
    }));

    return NextResponse.json({
      success: true,
      meals: parsedMeals,
      count: parsedMeals.length,
      distribution
    }, { status: 200 });

  } catch (error) {
    console.error('GET /api/meals/library/random error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error: ' + error,
        code: 'INTERNAL_ERROR'
      },
      { status: 500 }
    );
  }
}