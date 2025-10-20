import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/mysql-connection';
import { meals } from '@/db/mysql-schema';
import { isNull, or, eq } from 'drizzle-orm';
import { generateImagesForMeals } from '@/lib/image-generation';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { mealIds, forceRegenerate = false } = body;

    let mealsToProcess;

    if (mealIds && Array.isArray(mealIds)) {
      // Generate images for specific meals
      mealsToProcess = await db.select({ id: meals.id })
        .from(meals)
        .where(
          forceRegenerate 
            ? eq(meals.id, mealIds[0]) // If forcing, just get the first one for the where clause
            : or(isNull(meals.imageUrl), eq(meals.imageUrl, ''))
        );
      
      if (forceRegenerate) {
        // If forcing regeneration, use the provided meal IDs
        mealsToProcess = mealIds.map((id: number) => ({ id }));
      }
    } else {
      // Generate images for all meals without images
      mealsToProcess = await db.select({ id: meals.id })
        .from(meals)
        .where(or(isNull(meals.imageUrl), eq(meals.imageUrl, '')));
    }

    if (mealsToProcess.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No meals need image generation',
        results: {
          success: 0,
          failed: 0,
          results: [],
        },
      });
    }

    console.log(`🎨 Starting image generation for ${mealsToProcess.length} meals`);

    // Generate images in batches to avoid overwhelming the API
    const batchSize = 5;
    const allResults = {
      success: 0,
      failed: 0,
      results: [] as any[],
    };

    for (let i = 0; i < mealsToProcess.length; i += batchSize) {
      const batch = mealsToProcess.slice(i, i + batchSize);
      const batchIds = batch.map(meal => meal.id);
      
      console.log(`🎨 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(mealsToProcess.length / batchSize)}`);
      
      const batchResults = await generateImagesForMeals(batchIds);
      
      allResults.success += batchResults.success;
      allResults.failed += batchResults.failed;
      allResults.results.push(...batchResults.results);

      // Add delay between batches
      if (i + batchSize < mealsToProcess.length) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    return NextResponse.json({
      success: true,
      message: `Image generation complete: ${allResults.success} success, ${allResults.failed} failed`,
      results: allResults,
    });

  } catch (error) {
    console.error('Image generation API error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate images',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET endpoint to check image generation status
export async function GET() {
  try {
    const mealsWithoutImages = await db.select({ 
      id: meals.id,
      mealName: meals.mealName,
      mealType: meals.mealType,
    })
    .from(meals)
    .where(or(isNull(meals.imageUrl), eq(meals.imageUrl, '')));

    const totalMeals = await db.select({ count: meals.id }).from(meals);
    const mealsWithImages = totalMeals.length - mealsWithoutImages.length;

    return NextResponse.json({
      totalMeals: totalMeals.length,
      mealsWithImages,
      mealsWithoutImages: mealsWithoutImages.length,
      pendingMeals: mealsWithoutImages,
    });

  } catch (error) {
    console.error('Error checking image status:', error);
    return NextResponse.json(
      { error: 'Failed to check image status' },
      { status: 500 }
    );
  }
}