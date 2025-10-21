import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/mysql-connection';
import { meals } from '@/db/mysql-schema';
import { eq } from 'drizzle-orm';
import { generateMealImage, batchGenerateMealImages, type MealImagePrompt } from '@/lib/meal-image-generator';
import { parse } from 'csv-parse/sync';
import * as fs from 'fs';
import * as path from 'path';

export async function POST(request: NextRequest) {
  try {
    const { action, mealId, batchSize = 5 } = await request.json();

    if (action === 'single' && mealId) {
      // Generate single meal image
      return await generateSingleMealImage(mealId);
    } else if (action === 'batch') {
      // Generate batch of meal images
      return await generateBatchMealImages(batchSize);
    } else if (action === 'all') {
      // Generate all meal images
      return await generateAllMealImages();
    } else {
      return NextResponse.json({ error: 'Invalid action or missing mealId' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error in generate-images API:', error);
    return NextResponse.json({ 
      error: 'Failed to generate images',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

async function generateSingleMealImage(mealId: string) {
  try {
    // Get the meal from database
    const mealResult = await db.select().from(meals).where(eq(meals.mealId, mealId)).limit(1);
    
    if (mealResult.length === 0) {
      return NextResponse.json({ error: 'Meal not found' }, { status: 404 });
    }

    const meal = mealResult[0];

    // Get the prompt for this meal
    const prompt = await getMealPrompt(mealId);
    if (!prompt) {
      return NextResponse.json({ error: 'Prompt not found for meal' }, { status: 404 });
    }

    // Generate image
    const imageUrl = await generateMealImage(mealId, prompt);

    // Update database with image URL
    await db.update(meals)
      .set({ imageUrl })
      .where(eq(meals.mealId, mealId));

    return NextResponse.json({
      success: true,
      mealId,
      mealName: meal.mealName,
      imageUrl,
      message: 'Image generated successfully'
    });

  } catch (error) {
    console.error(`Error generating image for ${mealId}:`, error);
    return NextResponse.json({ 
      error: 'Failed to generate image',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

async function generateBatchMealImages(batchSize: number) {
  try {
    // Get meals without images
    const mealsWithoutImages = await db.select()
      .from(meals)
      .where(eq(meals.imageUrl, null))
      .limit(batchSize);

    if (mealsWithoutImages.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'All meals already have images',
        processed: 0
      });
    }

    // Load prompts
    const prompts = await loadMealPrompts();
    
    // Prepare batch data
    const mealPrompts: MealImagePrompt[] = mealsWithoutImages
      .map(meal => {
        const prompt = prompts[meal.mealId];
        if (!prompt) return null;
        return {
          mealId: meal.mealId,
          mealName: meal.mealName,
          prompt
        };
      })
      .filter(Boolean) as MealImagePrompt[];

    if (mealPrompts.length === 0) {
      return NextResponse.json({ error: 'No prompts found for meals' }, { status: 404 });
    }

    // Generate images
    const results = await batchGenerateMealImages(mealPrompts);

    // Update database with successful results
    const updatePromises = results
      .filter(result => result.success)
      .map(result => 
        db.update(meals)
          .set({ imageUrl: result.imageUrl })
          .where(eq(meals.mealId, result.mealId))
      );

    await Promise.all(updatePromises);

    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    return NextResponse.json({
      success: true,
      message: `Batch generation complete`,
      processed: successful,
      failed,
      results: results.map(r => ({
        mealId: r.mealId,
        success: r.success,
        imageUrl: r.success ? r.imageUrl : null,
        error: r.error || null
      }))
    });

  } catch (error) {
    console.error('Error in batch generation:', error);
    return NextResponse.json({ 
      error: 'Failed to generate batch images',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

async function generateAllMealImages() {
  try {
    // Get all meals
    const allMeals = await db.select().from(meals);
    
    // Load prompts
    const prompts = await loadMealPrompts();
    
    // Prepare all meal data
    const mealPrompts: MealImagePrompt[] = allMeals
      .map(meal => {
        const prompt = prompts[meal.mealId];
        if (!prompt) return null;
        return {
          mealId: meal.mealId,
          mealName: meal.mealName,
          prompt
        };
      })
      .filter(Boolean) as MealImagePrompt[];

    if (mealPrompts.length === 0) {
      return NextResponse.json({ error: 'No prompts found for meals' }, { status: 404 });
    }

    console.log(`🚀 Starting generation of ${mealPrompts.length} meal images...`);

    // Generate all images with progress tracking
    const results = await batchGenerateMealImages(
      mealPrompts,
      (completed, total, mealId) => {
        console.log(`📸 Progress: ${completed}/${total} - Generated ${mealId}`);
      }
    );

    // Update database with successful results
    const updatePromises = results
      .filter(result => result.success)
      .map(result => 
        db.update(meals)
          .set({ imageUrl: result.imageUrl })
          .where(eq(meals.mealId, result.mealId))
      );

    await Promise.all(updatePromises);

    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    return NextResponse.json({
      success: true,
      message: `All meal images generation complete!`,
      total: mealPrompts.length,
      successful,
      failed,
      results: results.map(r => ({
        mealId: r.mealId,
        success: r.success,
        imageUrl: r.success ? r.imageUrl : null,
        error: r.error || null
      }))
    });

  } catch (error) {
    console.error('Error generating all images:', error);
    return NextResponse.json({ 
      error: 'Failed to generate all images',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

async function getMealPrompt(mealId: string): Promise<string | null> {
  const prompts = await loadMealPrompts();
  return prompts[mealId] || null;
}

async function loadMealPrompts(): Promise<Record<string, string>> {
  try {
    const csvPath = path.join(process.cwd(), 'AWS tatian G1V2.csv');
    const csvContent = fs.readFileSync(csvPath, 'utf8');
    
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    const prompts: Record<string, string> = {};
    records.forEach((record: any) => {
      if (record.meal_id && record.prompt) {
        prompts[record.meal_id] = record.prompt;
      }
    });

    return prompts;
  } catch (error) {
    console.error('Error loading meal prompts:', error);
    throw new Error('Failed to load meal prompts from CSV');
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get generation status
    const allMeals = await db.select().from(meals);
    const mealsWithImages = allMeals.filter(meal => meal.imageUrl);
    const mealsWithoutImages = allMeals.filter(meal => !meal.imageUrl);

    return NextResponse.json({
      success: true,
      total: allMeals.length,
      withImages: mealsWithImages.length,
      withoutImages: mealsWithoutImages.length,
      progress: Math.round((mealsWithImages.length / allMeals.length) * 100),
      mealsWithoutImages: mealsWithoutImages.map(m => ({
        mealId: m.mealId,
        mealName: m.mealName
      }))
    });
  } catch (error) {
    console.error('Error getting generation status:', error);
    return NextResponse.json({ 
      error: 'Failed to get status',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}