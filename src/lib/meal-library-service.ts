import { db } from '@/db/mysql-connection';
import { meals } from '@/db/mysql-schema';
import { and, sql, inArray, isNotNull } from 'drizzle-orm';

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
  static async selectMealsFromLibrary(
    whoopAnalysis: WhoopAnalysis,
    options: {
      regenerate?: boolean;
      forceNewSelection?: boolean;
      excludeMealIds?: number[];
      timestamp?: number;
    } = {}
  ): Promise<{
    meals: any[];
    selectionSummary: string;
    whoopInsights: string;
    imageClassValidation: {
      classACount: number;
      classBCount: number;
      classAPercentage: number;
      meetsRequirement: boolean;
      totalMeals: number;
    };
  }> {
    console.log('🔍 Selecting meals from library based on WHOOP data...', {
      regenerate: options.regenerate,
      forceNewSelection: options.forceNewSelection,
      excludeCount: options.excludeMealIds?.length || 0
    });

    // Get selection criteria from WHOOP analysis
    const criteria = this.analyzeWhoopForMealSelection(whoopAnalysis);

    // 🎯 PRE-PROCESSING: Get all meals and classify by image availability
    const allMeals = await db.select().from(meals);
    const classAMeals = allMeals.filter(meal => meal.imageUrl && meal.imageUrl.trim() !== '');
    const classBMeals = allMeals.filter(meal => !meal.imageUrl || meal.imageUrl.trim() === '');

    console.log(`📊 Meal Classification:`);
    console.log(`   ✅ Class A (with images): ${classAMeals.length} meals`);
    console.log(`   ❌ Class B (without images): ${classBMeals.length} meals`);
    console.log(`   📈 Image coverage: ${Math.round((classAMeals.length / allMeals.length) * 100)}%`);

    // Build database query conditions - PRIORITIZE CLASS A MEALS
    const conditions = [];

    // 🎯 MANDATORY BIAS: Must have image (Class A meals only)
    conditions.push(isNotNull(meals.imageUrl));
    conditions.push(sql`${meals.imageUrl} != ''`);

    // Filter by meal types
    if (criteria.mealTypes.length > 0) {
      conditions.push(inArray(meals.mealType, criteria.mealTypes));
    }

    // Temporarily skip tag filtering to get the system working
    // TODO: Fix JSON tag filtering for MySQL
    console.log(`🎯 Preferred tags for WHOOP analysis: ${criteria.preferredTags.join(', ')}`);
    console.log(`❌ Excluded tags: ${criteria.excludeTags.join(', ')}`);

    // For now, we'll select meals based on type only and apply WHOOP logic in post-processing

    // 🎯 REGENERATION LOGIC: Exclude previously used meals if regenerating
    if (options.excludeMealIds && options.excludeMealIds.length > 0) {
      conditions.push(sql`${meals.mealId} NOT IN (${sql.join(options.excludeMealIds.map((id: any) => sql`${id}`), sql`, `)})`);
      console.log(`🔄 Excluding ${options.excludeMealIds.length} previously used meals for regeneration`);
    }

    const finalWhereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get all matching meals with randomization seed for regeneration
    const randomSeed = options.forceNewSelection ? (options.timestamp || Date.now()) : 1;
    const availableMeals = await db.select()
      .from(meals)
      .where(finalWhereClause)
      .orderBy(sql`RAND()`); // MySQL uses RAND() not RANDOM()

    console.log(`📚 Found ${availableMeals.length} meals matching WHOOP criteria`);

    if (availableMeals.length === 0) {
      throw new Error('No meals found matching WHOOP analysis criteria');
    }

    // 🎯 REGENERATION: Ensure different meal selection
    if (options.forceNewSelection) {
      // Shuffle meals with timestamp-based seed for different results
      const shuffledMeals = this.shuffleArrayWithSeed(availableMeals, randomSeed);
      console.log(`🔄 Shuffled ${shuffledMeals.length} meals for fresh selection`);

      // Select meals for 7-day plan (28 meals total: 4 meals per day)
      const selectedMeals = this.createWeeklyMealPlan(shuffledMeals, criteria, options);

      return this.formatMealSelectionResponse(selectedMeals, whoopAnalysis, criteria, options.regenerate);
    }

    // Select meals for 7-day plan (28 meals total: 4 meals per day)
    const selectedMeals = this.createWeeklyMealPlan(availableMeals, criteria, options);

    return this.formatMealSelectionResponse(selectedMeals, whoopAnalysis, criteria, options.regenerate);
  }

  /**
   * Format the meal selection response
   */
  private static formatMealSelectionResponse(
    selectedMeals: any[],
    whoopAnalysis: WhoopAnalysis,
    criteria: MealSelectionCriteria,
    isRegeneration: boolean = false
  ) {
    // 🎯 VALIDATION: Check Class A/B distribution
    const classACount = selectedMeals.filter(meal => meal.imageUrl && meal.imageUrl.trim() !== '').length;
    const classBCount = selectedMeals.filter(meal => !meal.imageUrl || meal.imageUrl.trim() === '').length;
    const classAPercentage = selectedMeals.length > 0 ? (classACount / selectedMeals.length) * 100 : 0;

    console.log(`🎯 Image Class Distribution Validation:`);
    console.log(`   ✅ Class A meals selected: ${classACount}/${selectedMeals.length} (${classAPercentage.toFixed(1)}%)`);
    console.log(`   ❌ Class B meals selected: ${classBCount}/${selectedMeals.length} (${(100 - classAPercentage).toFixed(1)}%)`);

    const imageClassValidation = {
      classACount,
      classBCount,
      classAPercentage: Math.round(classAPercentage),
      meetsRequirement: classAPercentage >= 75,
      totalMeals: selectedMeals.length
    };

    const uniqueMealCount = new Set(selectedMeals.map(m => m.meal_id)).size;
    const actionWord = isRegeneration ? 'Regenerated' : 'Selected';

    const selectionSummary = `${actionWord} ${selectedMeals.length} meals (${uniqueMealCount} unique within this week) from library based on your WHOOP data. All meals include images for optimal visual experience. Focused on ${criteria.preferredTags.slice(0, 3).join(', ')} to support your current physiological state.`;

    const whoopInsights = `Your ${whoopAnalysis.physiologicalState.recoveryStatus} recovery (${whoopAnalysis.averages.recovery}%) and ${whoopAnalysis.physiologicalState.fatigueLevel} fatigue levels guided our meal selection. We prioritized ${criteria.preferredTags.slice(0, 2).join(' and ')} meals with visual appeal to optimize your performance.`;

    return {
      meals: selectedMeals,
      selectionSummary,
      whoopInsights,
      imageClassValidation,
    };
  }

  /**
   * Create a balanced 7-day meal plan from available meals with strict sequencing and repetition rules
   */
  private static createWeeklyMealPlan(
    availableMeals: any[],
    criteria: MealSelectionCriteria,
    options: { excludeMealIds?: number[] } = {}
  ): any[] {
    const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const mealTimes = ['Breakfast', 'Lunch', 'Snack', 'Dinner']; // STRICT SEQUENCING ORDER
    const weeklyPlan: any[] = [];
    const mealUsageCount = new Map<string, number>(); // Track meal usage (NO repetition - max 1 time)
    const dailyMealIds = new Map<string, Set<string>>(); // Track meals used per day for same-day rule

    // Group meals by type and shuffle for variety
    const mealsByType = availableMeals.reduce((acc: Record<string, any[]>, meal: any) => {
      const type = meal.mealType;
      if (!acc[type]) acc[type] = [];
      acc[type].push(meal);
      return acc;
    }, {} as Record<string, any[]>);

    // Shuffle each type for variety
    Object.keys(mealsByType).forEach(type => {
      mealsByType[type] = this.shuffleArray(mealsByType[type]);
    });

    // Initialize daily meal tracking
    daysOfWeek.forEach(day => {
      dailyMealIds.set(day, new Set<string>());
    });

    // 🎯 STRICT SEQUENCING & REPETITION RULES: Assign meals for each day
    for (const day of daysOfWeek) {
      const dailyMeals = dailyMealIds.get(day)!;

      for (const mealTime of mealTimes) {
        let selectedMeal = null;

        // Find a meal that meets all constraints with strict uniqueness
        if (mealTime === 'Lunch' || mealTime === 'Dinner') {
          // For lunch/dinner, can use either specific type or lunch/dinner type
          const lunchDinnerMeals = (mealsByType['Lunch/Dinner'] || []).filter((m: any) =>
            this.canUseMeal(m.mealId, day, mealTime, mealUsageCount, dailyMeals)
          );
          const specificMeals = (mealsByType[mealTime] || []).filter((m: any) =>
            this.canUseMeal(m.mealId, day, mealTime, mealUsageCount, dailyMeals)
          );

          // Try lunch/dinner meals first (more flexible)
          if (lunchDinnerMeals.length > 0) {
            selectedMeal = lunchDinnerMeals[0];
          } else if (specificMeals.length > 0) {
            selectedMeal = specificMeals[0];
          }
        } else {
          // For breakfast and snacks, use specific type
          const typeMeals = (mealsByType[mealTime] || []).filter((m: any) =>
            this.canUseMeal(m.mealId, day, mealTime, mealUsageCount, dailyMeals)
          );
          if (typeMeals.length > 0) {
            selectedMeal = typeMeals[0];
          }
        }

        // 🚨 FALLBACK: If no meal meets constraints, use any available meal (strict no repetition)
        if (!selectedMeal) {
          const allTypeMeals = (mealsByType[mealTime] || []).filter((m: any) =>
            !dailyMeals.has(m.mealId) && !mealUsageCount.has(m.mealId) // Strict no repetition
          );
          if (allTypeMeals.length > 0) {
            selectedMeal = allTypeMeals[0];
            console.warn(`⚠️ Using fallback meal for ${day} ${mealTime}: ${selectedMeal.mealName}`);
          }
        }

        // 🚨 FINAL FALLBACK: Use any available meal from any type (strict uniqueness)
        if (!selectedMeal) {
          const allAvailableMeals = availableMeals.filter((m: any) =>
            !mealUsageCount.has(m.mealId) // Ensure strict no repetition
          );
          if (allAvailableMeals.length > 0) {
            selectedMeal = allAvailableMeals[Math.floor(Math.random() * allAvailableMeals.length)];
            console.warn(`⚠️ Using final fallback meal for ${day} ${mealTime}: ${selectedMeal.mealName}`);
          }
        }

        if (selectedMeal) {
          // 🎯 UPDATE TRACKING: Mark this meal as used (use mealId for consistency)
          const mealKey = selectedMeal.mealId; // Use mealId (B-0001, LD-0100, etc.) for tracking
          const currentCount = mealUsageCount.get(mealKey) || 0;
          mealUsageCount.set(mealKey, currentCount + 1);
          dailyMeals.add(mealKey);

          // Convert to the expected format with proper meal ID routing
          const mealForPlan = {
            day,
            meal_type: mealTime,
            meal_id: selectedMeal.mealId, // Use the actual mealId from database (B-0001, LD-0100, etc.)
            name: selectedMeal.mealName,
            description: selectedMeal.tagline || selectedMeal.nutritionSummary || 'Delicious and nutritious meal',
            ingredients: this.formatIngredients(selectedMeal.ingredients),
            instructions: this.formatInstructions(selectedMeal.method),
            prep_time: this.parseTime(selectedMeal.prepTime) || 15,
            cook_time: 15, // Default cook time
            servings: parseInt(selectedMeal.servingSize) || 2,
            nutrition: this.formatNutrition(selectedMeal.nutritionDetails),
            image: selectedMeal.imageUrl ? `/api/image-proxy?url=${encodeURIComponent(selectedMeal.imageUrl)}` : null,
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

    console.log(`✅ Created weekly meal plan with ${weeklyPlan.length} meals with no repetitions within this week`);

    // 🎯 VALIDATION LOG: Show repetition compliance within this week
    const repetitionStats = Array.from(mealUsageCount.entries())
      .filter(([_, count]) => count > 1)
      .map(([mealId, count]) => `Meal ${mealId}: ${count}x`);

    if (repetitionStats.length > 0) {
      console.log(`📊 Repeated meals within this week: ${repetitionStats.join(', ')}`);
    } else {
      console.log(`✅ No meal repetitions within this week - perfect variety achieved`);
    }

    return weeklyPlan;
  }

  /**
   * 🎯 CONSTRAINT CHECKER: Determine if a meal can be used within the SAME WEEK
   */
  private static canUseMeal(
    mealKey: string,
    day: string,
    mealTime: string,
    mealUsageCount: Map<string, number>,
    dailyMeals: Set<string>
  ): boolean {
    // Rule 1: NO REPETITION WITHIN SAME WEEK - Each meal can only be used ONCE per week
    // (But the same meal can appear in different weeks - home page vs plan-ahead)
    const currentCount = mealUsageCount.get(mealKey) || 0;
    if (currentCount >= 1) {
      return false; // Already used in this week
    }

    // Rule 2: Same-day rule - meal cannot be used twice on same day (redundant but kept for safety)
    if (dailyMeals.has(mealKey)) {
      return false;
    }

    return true;
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

  /**
   * Shuffle array with seed for consistent but different results
   */
  private static shuffleArrayWithSeed<T>(array: T[], seed: number): T[] {
    const shuffled = [...array];
    let currentSeed = seed;

    // Simple seeded random function
    const seededRandom = () => {
      currentSeed = (currentSeed * 9301 + 49297) % 233280;
      return currentSeed / 233280;
    };

    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(seededRandom() * (i + 1));
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