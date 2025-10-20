import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { mealsLibrary } from '@/db/schema';
import { eq } from 'drizzle-orm';

// This would be your actual image generation service
async function generateMealImage(mealName: string, ingredients: string[], description: string): Promise<string> {
  // Placeholder for actual G1 V2 model integration
  // This should call your image generation service
  
  const prompt = `A professional, appetizing photo of ${mealName}. The dish should look fresh, colorful, and restaurant-quality. Key ingredients visible: ${ingredients.slice(0, 5).join(', ')}. ${description.substring(0, 100)}. High resolution, well-lit, food photography style.`;
  
  console.log('Generating image with prompt:', prompt);
  
  // For now, return a placeholder URL
  // In production, this would:
  // 1. Call G1 V2 model with the prompt
  // 2. Upload generated image to S3
  // 3. Return the S3 URL
  
  return `https://your-s3-bucket.amazonaws.com/meal-images/${encodeURIComponent(mealName.toLowerCase().replace(/\s+/g, '-'))}.jpg`;
}

export async function POST(request: NextRequest) {
  try {
    const { mealIds, generateAll = false }: { mealIds?: number[], generateAll?: boolean } = await request.json();

    let mealsToProcess;

    if (generateAll) {
      // Get all meals without images
      mealsToProcess = await db.select().from(mealsLibrary).where(eq(mealsLibrary.imageUrl, null));
    } else if (mealIds && Array.isArray(mealIds)) {
      // Get specific meals by IDs
      const meals = [];
      for (const id of mealIds) {
        const meal = await db.select().from(mealsLibrary).where(eq(mealsLibrary.id, id));
        if (meal.length > 0) {
          meals.push(meal[0]);
        }
      }
      mealsToProcess = meals;
    } else {
      return NextResponse.json({
        error: 'Either provide mealIds array or set generateAll to true',
        code: 'INVALID_REQUEST'
      }, { status: 400 });
    }

    if (mealsToProcess.length === 0) {
      return NextResponse.json({
        message: 'No meals found to generate images for',
        processedCount: 0
      });
    }

    const results = [];
    const errors = [];

    for (const meal of mealsToProcess) {
      try {
        console.log(`Generating image for meal: ${meal.name}`);
        
        // Parse ingredients if they're stored as JSON string
        const ingredients = typeof meal.ingredients === 'string' 
          ? JSON.parse(meal.ingredients) 
          : meal.ingredients;

        // Generate image
        const imageUrl = await generateMealImage(
          meal.name, 
          ingredients, 
          meal.description || ''
        );

        // Update meal with image URL
        await db.update(mealsLibrary)
          .set({ 
            imageUrl,
            updatedAt: new Date().toISOString()
          })
          .where(eq(mealsLibrary.id, meal.id));

        results.push({
          id: meal.id,
          name: meal.name,
          imageUrl,
          status: 'success'
        });

        console.log(`✅ Generated image for ${meal.name}: ${imageUrl}`);

      } catch (error) {
        console.error(`❌ Failed to generate image for ${meal.name}:`, error);
        errors.push({
          id: meal.id,
          name: meal.name,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${mealsToProcess.length} meals`,
      results: {
        successful: results,
        failed: errors
      },
      summary: {
        totalProcessed: mealsToProcess.length,
        successCount: results.length,
        errorCount: errors.length
      }
    });

  } catch (error) {
    console.error('Image generation error:', error);
    return NextResponse.json({
      error: 'Internal server error during image generation',
      code: 'INTERNAL_ERROR',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Get status of image generation
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const showStats = searchParams.get('stats') === 'true';

    if (showStats) {
      // Get statistics about images
      const allMeals = await db.select().from(mealsLibrary);
      const withImages = allMeals.filter(meal => meal.imageUrl);
      const withoutImages = allMeals.filter(meal => !meal.imageUrl);

      return NextResponse.json({
        statistics: {
          totalMeals: allMeals.length,
          withImages: withImages.length,
          withoutImages: withoutImages.length,
          imageProgress: allMeals.length > 0 ? Math.round((withImages.length / allMeals.length) * 100) : 0
        },
        mealsWithoutImages: withoutImages.map(meal => ({
          id: meal.id,
          name: meal.name,
          mealType: meal.mealType
        }))
      });
    }

    return NextResponse.json({
      message: "Image generation service",
      endpoints: {
        "POST /api/meals/library/generate-images": "Generate images for meals",
        "GET /api/meals/library/generate-images?stats=true": "Get image generation statistics"
      },
      usage: {
        generateAll: "POST with { generateAll: true } to generate images for all meals without images",
        generateSpecific: "POST with { mealIds: [1, 2, 3] } to generate images for specific meals"
      }
    });
  } catch (error) {
    console.error('GET image generation error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    }, { status: 500 });
  }
}