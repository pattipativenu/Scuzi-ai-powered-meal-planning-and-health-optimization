import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { mealsLibrary } from '@/db/schema';
import { eq } from 'drizzle-orm';

interface MealComparison {
  id: number;
  name: string;
  mealType: string;
  qualityScore: number;
  issues: string[];
  strengths: string[];
}

interface DuplicateGroup {
  baseName: string;
  meals: MealComparison[];
  recommended: number; // ID of recommended meal to keep
  toRemove: number[]; // IDs of meals to remove
}

// Calculate quality score for a meal (0-100)
function calculateMealQuality(meal: any): { score: number; issues: string[]; strengths: string[] } {
  let score = 0;
  const issues: string[] = [];
  const strengths: string[] = [];
  
  // Parse JSON fields
  const ingredients = typeof meal.ingredients === 'string' ? JSON.parse(meal.ingredients) : meal.ingredients;
  const instructions = typeof meal.instructions === 'string' ? JSON.parse(meal.instructions) : meal.instructions;
  const nutrition = typeof meal.nutrition === 'string' ? JSON.parse(meal.nutrition) : meal.nutrition;
  const tags = typeof meal.tags === 'string' ? JSON.parse(meal.tags) : meal.tags;
  
  // Name quality (10 points)
  if (meal.name && meal.name.length > 5) {
    score += 10;
    strengths.push('Good meal name');
  } else {
    issues.push('Short or missing meal name');
  }
  
  // Description quality (10 points)
  if (meal.description && meal.description.length > 20) {
    score += 10;
    strengths.push('Detailed description');
  } else {
    issues.push('Missing or short description');
  }
  
  // Ingredients quality (25 points)
  if (ingredients && Array.isArray(ingredients)) {
    if (ingredients.length >= 5) {
      score += 25;
      strengths.push(`${ingredients.length} ingredients listed`);
    } else if (ingredients.length >= 3) {
      score += 15;
      strengths.push(`${ingredients.length} ingredients (could be more detailed)`);
    } else {
      score += 5;
      issues.push('Very few ingredients listed');
    }
  } else {
    issues.push('No ingredients data');
  }
  
  // Instructions quality (25 points)
  if (instructions && Array.isArray(instructions)) {
    if (instructions.length >= 4) {
      score += 25;
      strengths.push(`${instructions.length} detailed steps`);
    } else if (instructions.length >= 2) {
      score += 15;
      strengths.push(`${instructions.length} cooking steps`);
    } else {
      score += 5;
      issues.push('Very few cooking steps');
    }
  } else {
    issues.push('No cooking instructions');
  }
  
  // Nutrition quality (15 points)
  if (nutrition && typeof nutrition === 'object') {
    let nutritionScore = 0;
    if (nutrition.calories > 0) nutritionScore += 3;
    if (nutrition.protein > 0) nutritionScore += 3;
    if (nutrition.carbs > 0) nutritionScore += 3;
    if (nutrition.fat > 0) nutritionScore += 3;
    if (nutrition.fiber > 0) nutritionScore += 3;
    
    score += nutritionScore;
    if (nutritionScore >= 12) {
      strengths.push('Complete nutrition data');
    } else if (nutritionScore >= 6) {
      strengths.push('Basic nutrition data');
    } else {
      issues.push('Incomplete nutrition data');
    }
  } else {
    issues.push('No nutrition information');
  }
  
  // Tags quality (10 points)
  if (tags && Array.isArray(tags) && tags.length > 0) {
    score += 10;
    strengths.push(`${tags.length} health tags`);
  } else {
    issues.push('No health tags');
  }
  
  // Timing information (5 points)
  if (meal.prepTime || meal.cookTime) {
    score += 5;
    strengths.push('Timing information provided');
  } else {
    issues.push('No timing information');
  }
  
  return { score, issues, strengths };
}

// Normalize meal names for comparison
function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^\w\s]/g, '') // Remove punctuation
    .replace(/\s+/g, ' ') // Normalize spaces
    .trim();
}

// Check if two meal names are similar
function areSimilarNames(name1: string, name2: string): boolean {
  const norm1 = normalizeName(name1);
  const norm2 = normalizeName(name2);
  
  // Exact match
  if (norm1 === norm2) return true;
  
  // Check if one contains the other (for variations)
  if (norm1.includes(norm2) || norm2.includes(norm1)) return true;
  
  // Check word overlap (at least 70% of words match)
  const words1 = norm1.split(' ');
  const words2 = norm2.split(' ');
  const commonWords = words1.filter(word => words2.includes(word));
  const overlapRatio = commonWords.length / Math.max(words1.length, words2.length);
  
  return overlapRatio >= 0.7;
}

// Find duplicate groups
function findDuplicateGroups(meals: any[]): DuplicateGroup[] {
  const groups: DuplicateGroup[] = [];
  const processed = new Set<number>();
  
  for (let i = 0; i < meals.length; i++) {
    if (processed.has(meals[i].id)) continue;
    
    const duplicates = [meals[i]];
    processed.add(meals[i].id);
    
    // Find similar meals
    for (let j = i + 1; j < meals.length; j++) {
      if (processed.has(meals[j].id)) continue;
      
      if (areSimilarNames(meals[i].name, meals[j].name) && 
          meals[i].mealType === meals[j].mealType) {
        duplicates.push(meals[j]);
        processed.add(meals[j].id);
      }
    }
    
    // Only create group if there are actual duplicates
    if (duplicates.length > 1) {
      const comparisons = duplicates.map(meal => {
        const quality = calculateMealQuality(meal);
        return {
          id: meal.id,
          name: meal.name,
          mealType: meal.mealType,
          qualityScore: quality.score,
          issues: quality.issues,
          strengths: quality.strengths
        };
      });
      
      // Sort by quality score (highest first)
      comparisons.sort((a, b) => b.qualityScore - a.qualityScore);
      
      groups.push({
        baseName: comparisons[0].name,
        meals: comparisons,
        recommended: comparisons[0].id,
        toRemove: comparisons.slice(1).map(m => m.id)
      });
    }
  }
  
  return groups;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get('action');
    
    if (action === 'analyze') {
      // Analyze duplicates without removing them
      const allMeals = await db.select().from(mealsLibrary);
      const duplicateGroups = findDuplicateGroups(allMeals);
      
      return NextResponse.json({
        success: true,
        totalMeals: allMeals.length,
        duplicateGroups: duplicateGroups.length,
        duplicatesFound: duplicateGroups.reduce((sum, group) => sum + group.meals.length, 0),
        canRemove: duplicateGroups.reduce((sum, group) => sum + group.toRemove.length, 0),
        groups: duplicateGroups,
        summary: {
          totalGroups: duplicateGroups.length,
          worstQualityScore: Math.min(...duplicateGroups.flatMap(g => g.meals.map(m => m.qualityScore))),
          bestQualityScore: Math.max(...duplicateGroups.flatMap(g => g.meals.map(m => m.qualityScore))),
          avgQualityScore: Math.round(
            duplicateGroups.flatMap(g => g.meals.map(m => m.qualityScore))
              .reduce((sum, score) => sum + score, 0) / 
            duplicateGroups.flatMap(g => g.meals).length
          )
        }
      });
    }
    
    return NextResponse.json({
      message: "Duplicate Management System",
      endpoints: {
        "GET ?action=analyze": "Analyze duplicates without removing",
        "POST": "Remove duplicate meals (keeps highest quality)"
      },
      qualityFactors: [
        "Meal name completeness (10 points)",
        "Description detail (10 points)", 
        "Ingredient count and detail (25 points)",
        "Instruction steps (25 points)",
        "Nutrition completeness (15 points)",
        "Health tags (10 points)",
        "Timing information (5 points)"
      ]
    });
    
  } catch (error) {
    console.error('Duplicate analysis error:', error);
    return NextResponse.json({
      error: 'Failed to analyze duplicates',
      code: 'ANALYSIS_ERROR'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { confirmRemoval = false } = await request.json();
    
    if (!confirmRemoval) {
      return NextResponse.json({
        error: 'Confirmation required',
        message: 'Set confirmRemoval: true to proceed with duplicate removal'
      }, { status: 400 });
    }
    
    // Get all meals and find duplicates
    const allMeals = await db.select().from(mealsLibrary);
    const duplicateGroups = findDuplicateGroups(allMeals);
    
    if (duplicateGroups.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No duplicates found',
        removedCount: 0
      });
    }
    
    // Remove lower quality duplicates
    const idsToRemove = duplicateGroups.flatMap(group => group.toRemove);
    
    let removedCount = 0;
    for (const id of idsToRemove) {
      await db.delete(mealsLibrary).where(eq(mealsLibrary.id, id));
      removedCount++;
    }
    
    return NextResponse.json({
      success: true,
      message: `Removed ${removedCount} duplicate meals, kept ${duplicateGroups.length} best versions`,
      removedCount,
      keptCount: duplicateGroups.length,
      duplicateGroups: duplicateGroups.map(group => ({
        baseName: group.baseName,
        keptMeal: group.meals[0],
        removedCount: group.toRemove.length
      }))
    });
    
  } catch (error) {
    console.error('Duplicate removal error:', error);
    return NextResponse.json({
      error: 'Failed to remove duplicates',
      code: 'REMOVAL_ERROR',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}