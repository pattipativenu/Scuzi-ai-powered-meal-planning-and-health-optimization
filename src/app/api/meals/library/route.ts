import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { mealsLibrary } from '@/db/schema';
import { eq, like, and, or, sql } from 'drizzle-orm';

const VALID_MEAL_TYPES = ['breakfast', 'lunch', 'snack', 'dinner'];

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    // Extract and validate parameters
    const mealType = searchParams.get('meal_type');
    const tagsParam = searchParams.get('tags');
    const minProteinParam = searchParams.get('min_protein');
    const maxCaloriesParam = searchParams.get('max_calories');
    const limitParam = searchParams.get('limit');
    const offsetParam = searchParams.get('offset');
    const search = searchParams.get('search');

    // Validate meal_type
    if (mealType && !VALID_MEAL_TYPES.includes(mealType)) {
      return NextResponse.json({
        error: `Invalid meal_type. Must be one of: ${VALID_MEAL_TYPES.join(', ')}`,
        code: 'INVALID_MEAL_TYPE'
      }, { status: 400 });
    }

    // Validate and parse numeric parameters
    const limit = limitParam ? Math.min(parseInt(limitParam), 100) : 20;
    const offset = offsetParam ? parseInt(offsetParam) : 0;
    const minProtein = minProteinParam ? parseFloat(minProteinParam) : null;
    const maxCalories = maxCaloriesParam ? parseFloat(maxCaloriesParam) : null;

    if (limitParam && (isNaN(limit) || limit < 1)) {
      return NextResponse.json({
        error: 'Invalid limit parameter. Must be a positive integer.',
        code: 'INVALID_LIMIT'
      }, { status: 400 });
    }

    if (offsetParam && (isNaN(offset) || offset < 0)) {
      return NextResponse.json({
        error: 'Invalid offset parameter. Must be a non-negative integer.',
        code: 'INVALID_OFFSET'
      }, { status: 400 });
    }

    if (minProteinParam && (isNaN(minProtein!) || minProtein! < 0)) {
      return NextResponse.json({
        error: 'Invalid min_protein parameter. Must be a positive number.',
        code: 'INVALID_MIN_PROTEIN'
      }, { status: 400 });
    }

    if (maxCaloriesParam && (isNaN(maxCalories!) || maxCalories! < 0)) {
      return NextResponse.json({
        error: 'Invalid max_calories parameter. Must be a positive number.',
        code: 'INVALID_MAX_CALORIES'
      }, { status: 400 });
    }

    // Parse tags
    const tags = tagsParam ? tagsParam.split(',').map(tag => tag.trim()) : [];

    // Fetch all meals from database
    let query = db.select().from(mealsLibrary);
    const allMeals = await query;

    // Apply filters in-memory due to JSON field filtering requirements
    let filteredMeals = allMeals;

    // Filter by meal type
    if (mealType) {
      filteredMeals = filteredMeals.filter(meal => meal.mealType === mealType);
    }

    // Filter by search term (case-insensitive)
    if (search) {
      const searchLower = search.toLowerCase();
      filteredMeals = filteredMeals.filter(meal => 
        meal.name.toLowerCase().includes(searchLower) || 
        (meal.description && meal.description.toLowerCase().includes(searchLower))
      );
    }

    // Filter by tags (must have ALL specified tags)
    if (tags.length > 0) {
      filteredMeals = filteredMeals.filter(meal => {
        const mealTags = Array.isArray(meal.tags) ? meal.tags : [];
        return tags.every(tag => mealTags.includes(tag));
      });
    }

    // Filter by nutrition (min protein)
    if (minProtein !== null) {
      filteredMeals = filteredMeals.filter(meal => {
        const nutrition = typeof meal.nutrition === 'string' 
          ? JSON.parse(meal.nutrition) 
          : meal.nutrition;
        return nutrition && nutrition.protein >= minProtein;
      });
    }

    // Filter by nutrition (max calories)
    if (maxCalories !== null) {
      filteredMeals = filteredMeals.filter(meal => {
        const nutrition = typeof meal.nutrition === 'string' 
          ? JSON.parse(meal.nutrition) 
          : meal.nutrition;
        return nutrition && nutrition.calories <= maxCalories;
      });
    }

    // Sort by createdAt DESC
    filteredMeals.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return dateB - dateA;
    });

    // Calculate summary statistics
    const totalMeals = filteredMeals.length;
    let totalCalories = 0;
    let totalProtein = 0;
    let validNutritionCount = 0;

    filteredMeals.forEach(meal => {
      const nutrition = typeof meal.nutrition === 'string' 
        ? JSON.parse(meal.nutrition) 
        : meal.nutrition;
      if (nutrition && nutrition.calories !== undefined && nutrition.protein !== undefined) {
        totalCalories += nutrition.calories;
        totalProtein += nutrition.protein;
        validNutritionCount++;
      }
    });

    const avgCalories = validNutritionCount > 0 ? Math.round(totalCalories / validNutritionCount) : 0;
    const avgProtein = validNutritionCount > 0 ? Math.round(totalProtein / validNutritionCount) : 0;

    // Apply pagination
    const paginatedMeals = filteredMeals.slice(offset, offset + limit);

    // Parse JSON fields for response
    const meals = paginatedMeals.map(meal => ({
      id: meal.id,
      name: meal.name,
      description: meal.description,
      mealType: meal.mealType,
      prepTime: meal.prepTime,
      cookTime: meal.cookTime,
      servings: meal.servings,
      ingredients: typeof meal.ingredients === 'string' 
        ? JSON.parse(meal.ingredients) 
        : meal.ingredients,
      instructions: typeof meal.instructions === 'string' 
        ? JSON.parse(meal.instructions) 
        : meal.instructions,
      nutrition: typeof meal.nutrition === 'string' 
        ? JSON.parse(meal.nutrition) 
        : meal.nutrition,
      tags: typeof meal.tags === 'string' 
        ? JSON.parse(meal.tags) 
        : meal.tags,
      createdAt: meal.createdAt
    }));

    // Build filters object
    const filters: Record<string, any> = {
      limit,
      offset
    };
    if (mealType) filters.meal_type = mealType;
    if (tags.length > 0) filters.tags = tags;
    if (minProtein !== null) filters.min_protein = minProtein;
    if (maxCalories !== null) filters.max_calories = maxCalories;
    if (search) filters.search = search;

    return NextResponse.json({
      success: true,
      meals,
      count: totalMeals,
      filters,
      summary: {
        totalMeals,
        avgCalories,
        avgProtein
      }
    }, { status: 200 });

  } catch (error) {
    console.error('GET meals/library error:', error);
    return NextResponse.json({
      error: 'Internal server error: ' + error,
      code: 'INTERNAL_ERROR'
    }, { status: 500 });
  }
}