import { NextRequest, NextResponse } from "next/server";
import { db } from '@/db/mysql-connection';
import { meals } from '@/db/mysql-schema';
import { and, sql, isNotNull } from 'drizzle-orm';
import { startOfWeek, format } from "date-fns";

// Generate current week meals from real RDS MySQL database (157 meals available)
const generateCurrentWeekMeals = async () => {
  const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const mealTypes = ["Breakfast", "Lunch", "Snack", "Dinner"];
  
  try {
    // Fetch meals from RDS MySQL database - only meals with images
    // Using consistent ordering for hackathon (no random changes on refresh)
    const allMeals = await db.select()
      .from(meals)
      .where(and(
        isNotNull(meals.imageUrl),
        sql`${meals.imageUrl} != ''`
      ))
      .orderBy(meals.id); // Consistent order - no randomization

    console.log(`📚 Found ${allMeals.length} meals with images in RDS database`);

    // Group meals by type for better selection
    const mealsByType = {
      Breakfast: allMeals.filter(m => m.mealType === 'Breakfast'),
      Lunch: allMeals.filter(m => m.mealType === 'Lunch' || m.mealType === 'Lunch/Dinner'),
      Snack: allMeals.filter(m => m.mealType === 'Snack' || m.mealType === 'Snacks'),
      Dinner: allMeals.filter(m => m.mealType === 'Dinner' || m.mealType === 'Lunch/Dinner'),
    };

    console.log('📊 Meals by type:', {
      Breakfast: mealsByType.Breakfast.length,
      Lunch: mealsByType.Lunch.length,
      Snack: mealsByType.Snack.length,
      Dinner: mealsByType.Dinner.length,
    });

    const weeklyMeals = [];
    const usedMealIds = new Set(); // Track used meals to avoid repetition

    // Generate meals for each day
    for (const day of daysOfWeek) {
      for (const mealType of mealTypes) {
        const availableMeals = mealsByType[mealType as keyof typeof mealsByType]
          .filter(meal => !usedMealIds.has(meal.id)); // Avoid repeating meals

        if (availableMeals.length === 0) {
          // If no unused meals, allow reuse but use consistent selection
          const fallbackMeals = mealsByType[mealType as keyof typeof mealsByType];
          if (fallbackMeals.length > 0) {
            // Use consistent index based on day and meal type for hackathon
            const dayIndex = daysOfWeek.indexOf(day);
            const mealTypeIndex = mealTypes.indexOf(mealType);
            const consistentIndex = (dayIndex * 4 + mealTypeIndex) % fallbackMeals.length;
            const consistentMeal = fallbackMeals[consistentIndex];
            availableMeals.push(consistentMeal);
          }
        }

        if (availableMeals.length > 0) {
          const selectedMeal = availableMeals[0];
          usedMealIds.add(selectedMeal.id);

          // Convert RDS meal format to expected format - using ALL database fields
          const formattedMeal = {
            day,
            meal_type: mealType, // Slot type (Breakfast, Lunch, Snack, Dinner)
            original_meal_type: selectedMeal.mealType, // Original RDS meal type (Breakfast, Lunch/Dinner, etc.)
            meal_id: selectedMeal.mealId, // e.g., "LD-0100"
            id: `${day}-${mealType}`, // Add ID for meal card navigation
            name: selectedMeal.mealName, // e.g., "Pan-Seared Halibut with Olives & Capers"
            tagline: selectedMeal.tagline, // e.g., "DHA/Magnesium Quick Dinner"
            description: selectedMeal.tagline || selectedMeal.nutritionSummary || 'Delicious and nutritious meal',
            whyThisMeal: selectedMeal.whyThisMeal, // Full "why this meal" explanation
            ingredients: formatIngredients(selectedMeal.ingredients), // Full ingredients with serving_size
            instructions: formatInstructions(selectedMeal.method), // Step-by-step method
            prep_time: parseTime(selectedMeal.prepTime) || 15, // e.g., "20 minutes"
            cook_time: 15, // Default cook time (not in sample data)
            servings: parseServings(selectedMeal.servingSize) || parseServings(selectedMeal.ingredients && typeof selectedMeal.ingredients === 'object' && (selectedMeal.ingredients as any).serving_size) || 1,
            nutrition: formatNutrition(selectedMeal.nutritionDetails), // Complete nutrition data
            image: selectedMeal.imageUrl ? `/api/image-proxy?url=${encodeURIComponent(selectedMeal.imageUrl)}` : null,
            tags: selectedMeal.tags || [], // e.g., ["Better Sleep", "Omega-3", "Low-Carb"]
            // Raw data for complete access
            raw_ingredients: selectedMeal.ingredients, // Complete ingredients object
            raw_nutrition: selectedMeal.nutritionDetails, // Complete nutrition object
            raw_method: selectedMeal.method, // Complete method array
          };

          weeklyMeals.push(formattedMeal);
        } else {
          console.warn(`⚠️ No meals available for ${day} ${mealType}`);
        }
      }
    }

    console.log(`✅ Generated ${weeklyMeals.length} meals for current week from RDS database`);
    return weeklyMeals;

  } catch (error) {
    console.error('❌ Error generating meals from RDS database:', error);
    throw error;
  }
};

// Helper functions to format RDS data
const formatIngredients = (ingredients: any): any[] => {
  if (ingredients && typeof ingredients === 'object' && ingredients.list) {
    return ingredients.list.map((ing: any) => ({
      name: ing.item || ing.name || 'Unknown ingredient',
      amount: ing.quantity || ing.amount || 'as needed',
    }));
  }
  return [];
};

const formatInstructions = (method: any): string[] => {
  if (Array.isArray(method)) {
    return method.map(step => 
      typeof step === 'string' ? step.replace(/^step \d+:\s*/i, '') : String(step)
    );
  }
  return ['Follow recipe instructions'];
};

const parseTime = (timeStr: string | null): number | null => {
  if (!timeStr) return null;
  const match = timeStr.match(/(\d+)/);
  return match ? parseInt(match[1]) : null;
};

const parseServings = (servingStr: string | null): number | null => {
  if (!servingStr) return null;
  const match = servingStr.match(/(\d+)/);
  return match ? parseInt(match[1]) : null;
};

const formatNutrition = (nutritionDetails: any): any => {
  if (typeof nutritionDetails === 'object' && nutritionDetails?.details) {
    const details = nutritionDetails.details;
    return {
      calories: parseInt(details.Calories || details.calories) || 400,
      protein: parseInt(details.Protein || details.protein) || 20,
      carbs: parseInt(details.Carbs || details.carbs || details.carbohydrates) || 40,
      fat: parseInt(details.Fat || details.fat) || 15,
      fiber: parseInt(details.Fiber || details.fiber) || 5,
      sodium: parseInt(details.Sodium || details.sodium) || 500,
      saturated_fat: parseFloat(details.Saturated_Fat || details.saturated_fat) || 3,
      sugars: parseInt(details.Sugars || details.sugars) || 8,
      // Include the full nutrition object for complete data access
      serving_unit: nutritionDetails.serving_unit || 'per 1 serving',
      summary: nutritionDetails.summary || '',
    };
  }
  return {
    calories: 400,
    protein: 20,
    carbs: 40,
    fat: 15,
    fiber: 5,
    sodium: 500,
    saturated_fat: 3,
    sugars: 8,
    serving_unit: 'per 1 serving',
    summary: '',
  };
};

export async function GET(request: NextRequest) {
  try {
    // Calculate current week identifier (Monday of current week)
    const currentWeekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
    const weekId = format(currentWeekStart, "yyyy-MM-dd");

    console.log(`🗓️ Generating current week meals for week: ${weekId}`);

    // Generate meals from real RDS MySQL database (157 meals with images)
    const realMeals = await generateCurrentWeekMeals();

    return NextResponse.json({
      status: "success",
      meals: realMeals,
      weekId: weekId,
      message: `Generated ${realMeals.length} meals from RDS database with images`,
      generatedAt: new Date().toISOString(),
      source: "RDS MySQL Database",
      totalAvailableMeals: 157,
    });

  } catch (error) {
    console.error("❌ Error fetching current week meals from RDS:", error);
    
    return NextResponse.json(
      {
        status: "error",
        message: error instanceof Error ? error.message : "Failed to fetch meals from RDS database",
        weekId: format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd"),
      },
      { status: 500 }
    );
  }
}