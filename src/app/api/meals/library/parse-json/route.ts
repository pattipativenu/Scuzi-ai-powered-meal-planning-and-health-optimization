import { NextRequest, NextResponse } from 'next/server';
import { insertMeal, type MealData } from '@/db/meal-utils';

// Validate and normalize meal data from JSON
function validateMealData(data: any): MealData | null {
  try {
    // Check required fields
    if (!data.meal_id || !data.meal_name || !data.meal_type) {
      console.warn('Missing required fields:', { meal_id: data.meal_id, meal_name: data.meal_name, meal_type: data.meal_type });
      return null;
    }

    // Validate ingredients structure
    if (!data.ingredients || !data.ingredients.list || !Array.isArray(data.ingredients.list)) {
      console.warn('Invalid ingredients structure');
      return null;
    }

    // Validate method/instructions
    if (!data.method || !Array.isArray(data.method)) {
      console.warn('Invalid method structure');
      return null;
    }

    // Validate nutrition
    if (!data.nutrition || !data.nutrition.details) {
      console.warn('Invalid nutrition structure');
      return null;
    }

    // Normalize the data to match our expected structure
    const normalizedMeal: MealData = {
      meal_id: data.meal_id,
      meal_name: data.meal_name,
      tagline: data.tagline,
      prep_time: data.prep_time,
      meal_type: data.meal_type,
      tags: Array.isArray(data.tags) ? data.tags : [],
      ingredients: {
        serving_size: data.ingredients.serving_size || "1 serving",
        list: data.ingredients.list.map((ingredient: any) => ({
          item: ingredient.item || ingredient.name,
          quantity: ingredient.quantity || ingredient.amount,
          optional: ingredient.optional || false,
          notes: ingredient.notes
        }))
      },
      method: data.method,
      nutrition: {
        serving_unit: data.nutrition.serving_unit || "per 1 serving",
        summary: data.nutrition.summary,
        details: data.nutrition.details
      },
      why_this_meal: data.why_this_meal,
      image_url: data.image_url
    };

    return normalizedMeal;
  } catch (error) {
    console.error('Error validating meal data:', error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Handle both single meal and array of meals
    let mealsData: any[] = [];
    
    if (Array.isArray(body)) {
      mealsData = body;
    } else if (body.meals && Array.isArray(body.meals)) {
      mealsData = body.meals;
    } else if (body.meal_id) {
      // Single meal object
      mealsData = [body];
    } else {
      return NextResponse.json({
        error: 'Invalid JSON structure. Expected meal object, array of meals, or object with meals array.',
        code: 'INVALID_STRUCTURE',
        examples: {
          singleMeal: { meal_id: "B-0001", meal_name: "...", /* ... */ },
          multipleMeals: [{ meal_id: "B-0001", /* ... */ }, { meal_id: "B-0002", /* ... */ }],
          wrappedMeals: { meals: [{ meal_id: "B-0001", /* ... */ }] }
        }
      }, { status: 400 });
    }

    console.log(`📊 Processing ${mealsData.length} meals from JSON...`);

    const results = {
      successful: [] as any[],
      failed: [] as any[],
      total: mealsData.length
    };

    // Process each meal
    for (let i = 0; i < mealsData.length; i++) {
      const mealData = mealsData[i];
      
      try {
        // Validate and normalize the meal data
        const validatedMeal = validateMealData(mealData);
        
        if (!validatedMeal) {
          results.failed.push({
            index: i,
            meal_id: mealData.meal_id || 'unknown',
            error: 'Failed validation - missing required fields or invalid structure'
          });
          continue;
        }

        // Insert into database using PostgreSQL schema
        const insertedMeal = await insertMeal(validatedMeal);
        
        results.successful.push({
          index: i,
          meal_id: validatedMeal.meal_id,
          meal_name: validatedMeal.meal_name,
          database_id: insertedMeal.id
        });

        console.log(`✅ Inserted meal: ${validatedMeal.meal_id} - ${validatedMeal.meal_name}`);

      } catch (error) {
        console.error(`❌ Failed to process meal at index ${i}:`, error);
        results.failed.push({
          index: i,
          meal_id: mealData.meal_id || 'unknown',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    const successRate = (results.successful.length / results.total) * 100;

    return NextResponse.json({
      success: results.successful.length > 0,
      message: `Processed ${results.total} meals: ${results.successful.length} successful, ${results.failed.length} failed`,
      results: {
        total: results.total,
        successful: results.successful.length,
        failed: results.failed.length,
        successRate: Math.round(successRate * 100) / 100
      },
      successfulMeals: results.successful,
      failedMeals: results.failed.length > 0 ? results.failed : undefined
    }, { 
      status: results.successful.length > 0 ? 201 : 400 
    });

  } catch (error) {
    console.error('JSON parsing error:', error);
    return NextResponse.json({
      error: 'Failed to parse JSON content',
      code: 'PARSING_ERROR',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: "JSON Meal Parser for PostgreSQL Database",
    description: "Upload meal data in JSON format to the PostgreSQL database",
    supportedFormats: [
      "Single meal object",
      "Array of meal objects", 
      "Object with 'meals' array property"
    ],
    requiredFields: [
      "meal_id - Unique identifier (e.g., 'B-0001')",
      "meal_name - Name of the meal",
      "meal_type - Type: Breakfast, Lunch, Dinner, Snack",
      "ingredients.list - Array of ingredient objects",
      "method - Array of cooking steps",
      "nutrition.details - Nutrition information object"
    ],
    optionalFields: [
      "tagline - Meal subtitle",
      "prep_time - Preparation time description",
      "tags - Array of tags",
      "ingredients.serving_size - Serving size description",
      "nutrition.summary - Nutrition summary text",
      "why_this_meal - Explanation of meal benefits",
      "image_url - URL to meal image"
    ],
    exampleMeal: {
      meal_id: "B-0001",
      meal_name: "Blueberry Almond Overnight Oats",
      tagline: "Fiber & Probiotic Power Bowl",
      prep_time: "5 minutes (plus 6+ hours refrigeration)",
      meal_type: "Breakfast",
      tags: ["Recovery", "Energy", "Better Performance"],
      ingredients: {
        serving_size: "1 serving",
        list: [
          { item: "Rolled oats", quantity: "1/2 cup" },
          { item: "Milk (dairy or unsweetened plant-based)", quantity: "1 cup" },
          { item: "Greek yogurt (plain, with live cultures)", quantity: "1/4 cup" },
          { item: "Honey (optional, for sweetness)", quantity: "1 teaspoon", optional: true, notes: "for sweetness" }
        ]
      },
      method: [
        "step 1: In a jar or bowl, combine oats, milk, yogurt, chia seeds, almond butter, and cinnamon. Stir well.",
        "step 2: Cover and refrigerate overnight (or at least 6 hours) to let the oats soften.",
        "step 3: In the morning, stir the mixture. Top with blueberries and drizzle honey if desired."
      ],
      nutrition: {
        serving_unit: "per 1 serving",
        summary: "High in protein and fiber to keep you satisfied and promote gut health",
        details: {
          "Calories": "380 kcal",
          "Protein": "20 g",
          "Carbs": "50 g",
          "Fiber": "12 g",
          "Fat": "12 g"
        }
      },
      why_this_meal: "This make-ahead breakfast combines fiber-rich oats and chia seeds with Greek yogurt for probiotics and protein."
    },
    usage: {
      method: "POST",
      contentType: "application/json",
      examples: {
        singleMeal: "POST with meal object directly",
        multipleMeals: "POST with array of meal objects",
        wrappedMeals: "POST with { meals: [meal1, meal2, ...] }"
      }
    }
  });
}