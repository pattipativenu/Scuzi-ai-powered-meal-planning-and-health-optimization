import { db } from '@/db/mysql-connection';
import { meals } from '@/db/mysql-schema';
import { and, eq, sql, inArray, isNotNull } from 'drizzle-orm';

interface WhoopAnalysis {
  userId: string;
  physiologicalState: {
    fatigueLevel: 'low' | 'moderate' | 'high';
    recoveryStatus: 'poor' | 'good' | 'excellent';
    metabolicDemand: 'low' | 'moderate' | 'high';
    sleepQuality: 'poor' | 'good' | 'excellent';
  };
  nutritionalRecommendations: {
    proteinEmphasis: 'low' | 'moderate' | 'high';
    carbTiming: 'morning' | 'pre-workout' | 'post-workout' | 'balanced';
    antiInflammatory: boolean;
    hydrationFocus: boolean;
    energyDensity: 'low' | 'moderate' | 'high';
  };
  averages: {
    recovery: number;
    strain: number;
    sleep: number;
    calories: number;
  };
}

interface MealSelectionCriteria {
  mealTypes: string[];
  requiredTags: string[];
  preferredTags: string[];
  excludeTags: string[];
  maxMealsPerType: { [key: string]: number };
  diversityMode: boolean;
}

export class MealLibraryService {
  
  /**
   * Analyze WHOOP data and create meal selection criteria
   */
  static analyzeWhoopForMealSelection(whoopAnalysis: WhoopAnalysis): MealSelectionCriteria {
    const criteria: MealSelectionCriteria = {
      mealTypes: ['Breakfast', 'Lunch', 'Dinner', 'Snack', 'Lunch/Dinner'],
      requiredTags: [],
      preferredTags: [],
      excludeTags: [],
      maxMealsPerType: {
        'Breakfast': 7,
        'Lunch': 7, 
        'Dinner': 7,
        'Snack': 7,
        'Lunch/Dinner': 14, // Can be used for both lunch and dinner
      },
      diversityMode: true,
    };

    // Analyze recovery status
    if (whoopAnalysis.physiologicalState.recoveryStatus === 'poor') {
      criteria.preferredTags.push('Recovery', 'Anti-Inflammatory', 'Easy Digest');
      criteria.excludeTags.push('Heavy', 'Complex');
    } else if (whoopAnalysis.physiologicalState.recoveryStatus === 'excellent') {
      criteria.preferredTags.push('Performance', 'Energy', 'High-Protein');
    }

    // Analyze fatigue level
    if (whoopAnalysis.physiologicalState.fatigueLevel === 'high') {
      criteria.preferredTags.push('Energy Boost', 'Quick Energy', 'B-Vitamins');
      criteria.excludeTags.push('Heavy', 'High-Fat');
    } else if (whoopAnalysis.physiologicalState.fatigueLevel === 'low') {
      criteria.preferredTags.push('Sustained Energy', 'Complex Carbs');
    }

    // Analyze sleep quality
    if (whoopAnalysis.physiologicalState.sleepQuality === 'poor') {
      criteria.preferredTags.push('Sleep Support', 'Magnesium', 'Tryptophan');
      criteria.excludeTags.push('Caffeine', 'High-Sugar');
    }

    // Analyze metabolic demand
    if (whoopAnalysis.physiologicalState.metabolicDemand === 'high') {
      criteria.preferredTags.push('High-Calorie', 'Performance', 'Protein-Rich');
    } else if (whoopAnalysis.physiologicalState.metabolicDemand === 'low') {
      criteria.preferredTags.push('Light', 'Low-Calorie', 'Nutrient-Dense');
    }

    // Nutritional recommendations
    if (whoopAnalysis.nutritionalRecommendations.proteinEmphasis === 'high') {
      criteria.preferredTags.push('High-Protein', 'Muscle Recovery');
    }

    if (whoopAnalysis.nutritionalRecommendations.antiInflammatory) {
      criteria.preferredTags.push('Anti-Inflammatory', 'Omega-3', 'Antioxidants');
    }

    if (whoopAnalysis.nutritionalRecommendations.hydrationFocus) {
      criteria.preferredTags.push('Hydrating', 'Electrolytes');
    }

    // Carb timing preferences
    if (whoopAnalysis.nutritionalRecommendations.carbTiming === 'morning') {
      criteria.preferredTags.push('Morning Energy', 'Complex Carbs');
    } else if (whoopAnalysis.nutritionalRecommendations.carbTiming === 'pre-workout') {
      criteria.preferredTags.push('Pre-Workout', 'Quick Energy');
    } else if (whoopAnalysis.nutritionalRecommendations.carbTiming === 'post-workout') {
      criteria.preferredTags.push('Post-Workout', 'Recovery');
    }

    console.log('🎯 WHOOP-based meal selection criteria:', criteria);
    return criteria;
  }

  /**
   * Select meals from library based on WHOOP analysis
   */
  static async selectMealsFromLibrary(whoopAnalysis: WhoopAnalysis): Promise<{
    meals: any[];
    selectionSummary: string;
    whoopInsights: string;
  }> {
    console.log('🔍 Selecting meals from library based on WHOOP data...');

    // Get selection criteria from WHOOP analysis
    const criteria = this.analyzeWhoopForMealSelection(whoopAnalysis);

    // Build database query conditions
    const conditions = [];

    // Must have image (only select meals with generated images)
    conditions.push(isNotNull(meals.imageUrl));
    conditions.push(sql`${meals.imageUrl} != ''`);

    // Filter by meal types
    if (criteria.mealTypes.length > 0) {
      conditions.push(inArray(meals.mealType, criteria.mealTypes));
    }

    // Include preferred tags (at least one must match)
    if (criteria.preferredTags.length > 0) {
      const tagConditions = criteria.preferredTags.map(tag => 
        sql`${meals.tags}::jsonb ? ${tag}`
      );
      conditions.push(sql`(${sql.join(tagConditions, sql` OR `)})`);
    }

    // Exclude unwanted tags
    if (criteria.excludeTags.length > 0) {
      const excludeConditions = criteria.excludeTags.map(tag => 
        sql`NOT (${meals.tags}::jsonb ? ${tag})`
      );
      conditions.push(sql`(${sql.join(excludeConditions, sql` AND `)})`);
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get all matching meals
    const availableMeals = await db.select()
      .from(meals)
      .where(whereClause)
      .orderBy(sql`RANDOM()`);

    console.log(`📚 Found ${availableMeals.length} meals matching WHOOP criteria`);

    if (availableMeals.length === 0) {
      throw new Error('No meals found matching WHOOP analysis criteria');
    }

    // Select meals for 7-day plan (28 meals total: 4 meals per day)
    const selectedMeals = this.createWeeklyMealPlan(availableMeals, criteria);

    const selectionSummary = `Selected ${selectedMeals.length} meals from library based on your WHOOP data. Focused on ${criteria.preferredTags.slice(0, 3).join(', ')} to support your current physiological state.`;

    const whoopInsights = `Your ${whoopAnalysis.physiologicalState.recoveryStatus} recovery (${whoopAnalysis.averages.recovery}%) and ${whoopAnalysis.physiologicalState.fatigueLevel} fatigue levels guided our meal selection. We prioritized ${criteria.preferredTags.slice(0, 2).join(' and ')} meals to optimize your performance.`;

    return {
      meals: selectedMeals,
      selectionSummary,
      whoopInsights,
    };
  }

  /**
   * Create a balanced 7-day meal plan from available meals (UNIQUE MEALS ONLY)
   */
  private static createWeeklyMealPlan(availableMeals: any[], criteria: MealSelectionCriteria): any[] {
    const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const mealTimes = ['Breakfast', 'Lunch', 'Snack', 'Dinner'];
    const weeklyPlan: any[] = [];
    const usedMealIds = new Set<number>(); // Track used meals to ensure uniqueness

    // Group meals by type and shuffle for variety
    const mealsByType = availableMeals.reduce((acc, meal) => {
      const type = meal.mealType;
      if (!acc[type]) acc[type] = [];
      acc[type].push(meal);
      return acc;
    }, {} as Record<string, any[]>);

    // Shuffle each type for variety
    Object.keys(mealsByType).forEach(type => {
      mealsByType[type] = this.shuffleArray(mealsByType[type]);
    });

    // Assign meals for each day, ensuring uniqueness
    for (const day of daysOfWeek) {
      for (const mealTime of mealTimes) {
        let selectedMeal = null;

        // Find an unused meal for this meal type
        if (mealTime === 'Lunch' || mealTime === 'Dinner') {
          // For lunch/dinner, can use either specific type or lunch/dinner type
          const lunchDinnerMeals = (mealsByType['Lunch/Dinner'] || []).filter(m => !usedMealIds.has(m.id));
          const specificMeals = (mealsByType[mealTime] || []).filter(m => !usedMealIds.has(m.id));
          
          // Try lunch/dinner meals first (more flexible)
          if (lunchDinnerMeals.length > 0) {
            selectedMeal = lunchDinnerMeals[0];
          } else if (specificMeals.length > 0) {
            selectedMeal = specificMeals[0];
          }
        } else {
          // For breakfast and snacks, use specific type
          const typeMeals = (mealsByType[mealTime] || []).filter(m => !usedMealIds.has(m.id));
          if (typeMeals.length > 0) {
            selectedMeal = typeMeals[0];
          }
        }

        // If no unused meal found, try any available meal type as fallback
        if (!selectedMeal) {
          const allAvailableMeals = availableMeals.filter(m => !usedMealIds.has(m.id));
          if (allAvailableMeals.length > 0) {
            selectedMeal = allAvailableMeals[Math.floor(Math.random() * allAvailableMeals.length)];
            console.warn(`⚠️ Using fallback meal for ${day} ${mealTime}: ${selectedMeal.mealName}`);
          }
        }

        if (selectedMeal) {
          // Mark this meal as used
          usedMealIds.add(selectedMeal.id);

          // Convert to the expected format
          const mealForPlan = {
            day,
            meal_type: mealTime,
            meal_id: selectedMeal.mealId, // Use the actual meal_id from database
            name: selectedMeal.mealName,
            description: selectedMeal.tagline || selectedMeal.nutritionSummary || 'Delicious and nutritious meal',
            ingredients: this.formatIngredients(selectedMeal.ingredients),
            instructions: this.formatInstructions(selectedMeal.method),
            prep_time: this.parseTime(selectedMeal.prepTime) || 15,
            cook_time: 15, // Default cook time
            servings: parseInt(selectedMeal.servingSize) || 2,
            nutrition: this.formatNutrition(selectedMeal.nutritionDetails),
            image: selectedMeal.imageUrl,
            imageUrl: selectedMeal.imageUrl,
            tags: selectedMeal.tags || [],
            whoop_rationale: `Selected based on your ${criteria.preferredTags.slice(0, 2).join(' and ')} needs from WHOOP data`,
          };

          weeklyPlan.push(mealForPlan);
        } else {
          console.warn(`⚠️ No meal available for ${day} ${mealTime}`);
        }
      }
    }

    console.log(`✅ Created weekly meal plan with ${weeklyPlan.length} UNIQUE meals (${usedMealIds.size} different meals used)`);
    return weeklyPlan;
  }

  /**
   * Utility functions for data formatting
   */
  private static shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  private static formatIngredients(ingredients: any): any[] {
    // Handle your specific format: {"serving_size": "1 serving", "list": [...]}
    if (ingredients && typeof ingredients === 'object') {
      if (ingredients.list && Array.isArray(ingredients.list)) {
        return ingredients.list.map((ing: any) => ({
          name: ing.item || ing.name || ing,
          amount: ing.quantity || ing.amount || 'as needed',
        }));
      } else if (Array.isArray(ingredients)) {
        return ingredients.map(ing => ({
          name: typeof ing === 'string' ? ing : (ing.item || ing.name || ing),
          amount: typeof ing === 'object' && (ing.quantity || ing.amount) ? (ing.quantity || ing.amount) : 'as needed',
        }));
      }
    }
    return [];
  }

  private static formatInstructions(method: any): string[] {
    if (Array.isArray(method)) {
      return method.filter(step => typeof step === 'string' && step.trim());
    }
    if (typeof method === 'string') {
      return method.split('.').filter(step => step.trim()).map(step => step.trim());
    }
    return ['Follow recipe instructions'];
  }

  private static parseTime(timeStr: string | null): number | null {
    if (!timeStr) return null;
    const match = timeStr.match(/(\d+)/);
    return match ? parseInt(match[1]) : null;
  }

  private static formatNutrition(nutritionDetails: any): any {
    // Handle your specific format: {"serving_unit": "per 1 serving", "summary": "...", "details": {...}}
    if (typeof nutritionDetails === 'object' && nutritionDetails) {
      const details = nutritionDetails.details || nutritionDetails;
      return {
        calories: parseInt(details.Calories || details.calories) || 400,
        protein: parseInt(details.Protein || details.protein) || 20,
        carbs: parseInt(details.Carbs || details.carbs || details.carbohydrates) || 40,
        fat: parseInt(details.Fat || details.fat) || 15,
        fiber: parseInt(details.Fiber || details.fiber) || 5,
        sodium: parseInt(details.Sodium || details.sodium) || 500,
      };
    }
    return {
      calories: 400,
      protein: 20,
      carbs: 40,
      fat: 15,
      fiber: 5,
      sodium: 500,
    };
  }

  /**
   * Get meal statistics from library
   */
  static async getLibraryStats(): Promise<{
    totalMeals: number;
    mealsWithImages: number;
    mealsByType: Record<string, number>;
    availableTags: string[];
  }> {
    const allMeals = await db.select().from(meals);
    const mealsWithImages = allMeals.filter(meal => meal.imageUrl && meal.imageUrl !== '');
    
    const mealsByType = allMeals.reduce((acc, meal) => {
      acc[meal.mealType] = (acc[meal.mealType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const allTags = new Set<string>();
    allMeals.forEach(meal => {
      if (Array.isArray(meal.tags)) {
        meal.tags.forEach(tag => allTags.add(tag));
      }
    });

    return {
      totalMeals: allMeals.length,
      mealsWithImages: mealsWithImages.length,
      mealsByType,
      availableTags: Array.from(allTags),
    };
  }
}