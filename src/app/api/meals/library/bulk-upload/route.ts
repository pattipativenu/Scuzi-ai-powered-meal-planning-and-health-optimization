import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { mealsLibrary } from '@/db/schema';

interface MealData {
  name: string;
  tagline?: string;
  description: string;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  prepTime?: number;
  cookTime?: number;
  servings: number;
  ingredients: string[];
  instructions: string[];
  nutrition: {
    calories: number;
    protein: number;
    fat: number;
    carbs: number;
    fiber: number;
  };
  tags: string[];
  whyHelpful: string;
}

export async function POST(request: NextRequest) {
  try {
    const { meals }: { meals: MealData[] } = await request.json();

    if (!Array.isArray(meals) || meals.length === 0) {
      return NextResponse.json({
        error: 'Invalid request. Expected an array of meals.',
        code: 'INVALID_REQUEST'
      }, { status: 400 });
    }

    // Validate each meal
    const validatedMeals = [];
    const errors = [];

    for (let i = 0; i < meals.length; i++) {
      const meal = meals[i];
      const mealErrors = [];

      // Required fields validation
      if (!meal.name || typeof meal.name !== 'string') {
        mealErrors.push('name is required and must be a string');
      }
      if (!meal.description || typeof meal.description !== 'string') {
        mealErrors.push('description is required and must be a string');
      }
      if (!meal.mealType || !['breakfast', 'lunch', 'dinner', 'snack'].includes(meal.mealType)) {
        mealErrors.push('mealType must be one of: breakfast, lunch, dinner, snack');
      }
      if (!meal.servings || typeof meal.servings !== 'number' || meal.servings < 1) {
        mealErrors.push('servings is required and must be a positive number');
      }
      if (!Array.isArray(meal.ingredients) || meal.ingredients.length === 0) {
        mealErrors.push('ingredients must be a non-empty array');
      }
      if (!Array.isArray(meal.instructions) || meal.instructions.length === 0) {
        mealErrors.push('instructions must be a non-empty array');
      }
      if (!meal.nutrition || typeof meal.nutrition !== 'object') {
        mealErrors.push('nutrition is required and must be an object');
      } else {
        const { calories, protein, fat, carbs, fiber } = meal.nutrition;
        if (typeof calories !== 'number' || calories < 0) {
          mealErrors.push('nutrition.calories must be a non-negative number');
        }
        if (typeof protein !== 'number' || protein < 0) {
          mealErrors.push('nutrition.protein must be a non-negative number');
        }
        if (typeof fat !== 'number' || fat < 0) {
          mealErrors.push('nutrition.fat must be a non-negative number');
        }
        if (typeof carbs !== 'number' || carbs < 0) {
          mealErrors.push('nutrition.carbs must be a non-negative number');
        }
        if (typeof fiber !== 'number' || fiber < 0) {
          mealErrors.push('nutrition.fiber must be a non-negative number');
        }
      }
      if (!Array.isArray(meal.tags)) {
        mealErrors.push('tags must be an array');
      }

      if (mealErrors.length > 0) {
        errors.push({
          index: i,
          name: meal.name || `Meal ${i + 1}`,
          errors: mealErrors
        });
      } else {
        // Create the meal object for database insertion
        const mealForDb = {
          name: meal.name,
          description: meal.whyHelpful || meal.description,
          mealType: meal.mealType,
          prepTime: meal.prepTime || null,
          cookTime: meal.cookTime || null,
          servings: meal.servings,
          ingredients: JSON.stringify(meal.ingredients),
          instructions: JSON.stringify(meal.instructions),
          nutrition: JSON.stringify(meal.nutrition),
          tags: JSON.stringify(meal.tags),
          createdAt: new Date().toISOString()
        };
        validatedMeals.push(mealForDb);
      }
    }

    // If there are validation errors, return them
    if (errors.length > 0) {
      return NextResponse.json({
        error: 'Validation failed for some meals',
        code: 'VALIDATION_ERROR',
        validationErrors: errors,
        validMealsCount: validatedMeals.length,
        totalMealsCount: meals.length
      }, { status: 400 });
    }

    // Insert all validated meals into the database
    const insertedMeals = await db.insert(mealsLibrary).values(validatedMeals).returning();

    return NextResponse.json({
      success: true,
      message: `Successfully uploaded ${insertedMeals.length} meals to the library`,
      insertedCount: insertedMeals.length,
      meals: insertedMeals.map(meal => ({
        id: meal.id,
        name: meal.name,
        mealType: meal.mealType
      }))
    }, { status: 201 });

  } catch (error) {
    console.error('Bulk upload error:', error);
    return NextResponse.json({
      error: 'Internal server error during bulk upload',
      code: 'INTERNAL_ERROR',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Helper endpoint to get upload template
export async function GET() {
  const template = {
    meals: [
      {
        name: "Spaghetti Squash Beef & Lentil Bolognese",
        tagline: "Low-Carb Veggie Pasta with Hearty Sauce",
        description: "This dish cleverly boosts the nutrition of a classic pasta dinner by incorporating spaghetti squash and lentils.",
        mealType: "dinner",
        prepTime: 15,
        cookTime: 45,
        servings: 4,
        ingredients: [
          "Spaghetti squash – 1 large (about 3-4 lbs)",
          "Lean ground beef – 8 oz (90-95% lean)",
          "Cooked lentils – 1 cup (or canned brown/green lentils, drained)",
          "Crushed tomatoes – 1 can (28 oz, no salt added if possible)",
          "Tomato paste – 1 tbsp (for richness)",
          "Onion – 1 small, diced",
          "Carrot – 1, finely diced",
          "Celery – 1 rib, finely diced",
          "Garlic – 3 cloves, minced",
          "Dried oregano – 1 tsp",
          "Dried basil – 1 tsp (or use Italian seasoning 2 tsp total for simplicity)",
          "Olive oil – 1 tbsp",
          "Salt & pepper – to taste",
          "Fresh basil or parsley – for garnish (optional)",
          "Grated Parmesan – 2 tbsp (optional for serving)"
        ],
        instructions: [
          "Roast Spaghetti Squash: Preheat oven to 400°F (200°C). Carefully cut the spaghetti squash in half lengthwise and scoop out seeds. Brush or rub interior with a bit of olive oil, and place cut-side down on a baking sheet. Roast ~30-40 minutes until the flesh is tender and strands easily pull with a fork.",
          "Make Bolognese: While squash is roasting, heat olive oil in a large pot or deep skillet over medium-high. Add diced onion, carrot, and celery (this trio is a classic soffritto for flavor). Sauté 5 minutes until veggies soften. Add minced garlic; cook 30 seconds.",
          "Push veggies to the side, add ground beef. Brown beef, breaking it up (~5 min). Drain any excess fat if a lot (lean beef shouldn't have much).",
          "Simmer Sauce: Stir in tomato paste, cook 1 minute. Add crushed tomatoes, lentils, oregano, basil, and a generous pinch of salt and pepper. Mix everything; bring to a simmer.",
          "Reduce heat to low, cover and let sauce simmer for 15-20 minutes (longer if you have time, for deeper flavor), stirring occasionally. The lentils and beef will thicken the sauce nicely. Taste and adjust seasoning.",
          "Serve: Plate a bed of spaghetti squash 'noodles'. Ladle the beef & lentil bolognese sauce on top. Garnish with fresh basil or parsley and a sprinkle of Parmesan if desired."
        ],
        nutrition: {
          calories: 350,
          protein: 24,
          fat: 12,
          carbs: 40,
          fiber: 10
        },
        tags: ["Better Performance", "Recovery", "Better Sleep"],
        whyHelpful: "This bolognese is comfort food reimagined to align with your WHOOP-driven goals: fueling muscles, reducing inflammation, and promoting overall health without sacrificing taste or satisfaction. By swapping regular pasta with spaghetti squash, we significantly cut down on refined carbs and calories while adding a ton of fiber, vitamins, and hydration. The mix of plant and animal proteins provides a broad spectrum of amino acids for muscle repair, while the high fiber content supports gut health and steady energy levels."
      }
    ]
  };

  return NextResponse.json({
    message: "Bulk upload template for meals library",
    template,
    instructions: [
      "Send a POST request to this endpoint with a JSON body containing a 'meals' array",
      "Each meal should follow the structure shown in the template",
      "All fields marked as required must be provided",
      "The API will validate all meals before inserting into the database"
    ]
  });
}