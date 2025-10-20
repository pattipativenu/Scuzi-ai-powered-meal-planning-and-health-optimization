import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { mealsLibrary, whoopHealthData, userPreferences } from '@/db/schema';
import { eq, desc, and, gte } from 'drizzle-orm';

interface MealRecommendation {
  id: number;
  name: string;
  mealType: string;
  tags: string[];
  nutrition: any;
  imageUrl?: string;
  reason: string;
  priority: number;
}

// Get user's recent WHOOP data to inform meal recommendations
async function getRecentWhoopData(userId: string, days: number = 7) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  
  const recentData = await db
    .select()
    .from(whoopHealthData)
    .where(
      and(
        eq(whoopHealthData.userId, userId),
        gte(whoopHealthData.date, cutoffDate.toISOString().split('T')[0])
      )
    )
    .orderBy(desc(whoopHealthData.date))
    .limit(7);
    
  return recentData;
}

// Get user preferences
async function getUserPreferences(userId: string) {
  const preferences = await db
    .select()
    .from(userPreferences)
    .where(eq(userPreferences.userId, userId))
    .orderBy(desc(userPreferences.timestamp))
    .limit(1);
    
  return preferences[0] || null;
}

// Analyze WHOOP data and recommend meal types/tags
function analyzeMealNeeds(whoopData: any[], userPrefs: any) {
  const recommendations = {
    breakfast: [] as string[],
    lunch: [] as string[],
    dinner: [] as string[],
    snack: [] as string[]
  };
  
  if (whoopData.length === 0) {
    // Default recommendations if no WHOOP data
    recommendations.breakfast = ['Energy', 'High Protein'];
    recommendations.lunch = ['Better Performance', 'Anti-Inflammatory'];
    recommendations.dinner = ['Recovery', 'High Protein'];
    recommendations.snack = ['Energy'];
    return recommendations;
  }
  
  // Calculate averages
  const avgRecovery = whoopData.reduce((sum, d) => sum + (d.recoveryScore || 0), 0) / whoopData.length;
  const avgStrain = whoopData.reduce((sum, d) => sum + (d.strain || 0), 0) / whoopData.length;
  const avgSleep = whoopData.reduce((sum, d) => sum + (d.sleepHours || 0), 0) / whoopData.length;
  const avgHrv = whoopData.reduce((sum, d) => sum + (d.hrv || 0), 0) / whoopData.length;
  
  // Breakfast recommendations based on recovery and sleep
  if (avgRecovery < 50 || avgSleep < 7) {
    recommendations.breakfast.push('Energy', 'Recovery', 'Anti-Inflammatory');
  } else {
    recommendations.breakfast.push('Energy', 'Better Performance');
  }
  
  // Lunch recommendations based on strain and activity level
  if (avgStrain > 15) {
    recommendations.lunch.push('High Protein', 'Better Performance', 'Energy');
  } else {
    recommendations.lunch.push('Better Performance', 'Anti-Inflammatory');
  }
  
  // Dinner recommendations based on recovery needs
  if (avgRecovery < 60 || avgHrv < 30) {
    recommendations.dinner.push('Recovery', 'Anti-Inflammatory', 'High Protein');
  } else {
    recommendations.dinner.push('Recovery', 'High Protein');
  }
  
  // Snack recommendations
  if (avgStrain > 12) {
    recommendations.snack.push('Energy', 'High Protein');
  } else {
    recommendations.snack.push('Energy');
  }
  
  // Add user preference tags if available
  if (userPrefs?.userGoal) {
    const goals = JSON.parse(userPrefs.userGoal);
    if (goals.includes('muscle_gain')) {
      Object.keys(recommendations).forEach(mealType => {
        recommendations[mealType as keyof typeof recommendations].push('High Protein');
      });
    }
    if (goals.includes('weight_loss')) {
      Object.keys(recommendations).forEach(mealType => {
        recommendations[mealType as keyof typeof recommendations].push('Low Carb');
      });
    }
  }
  
  return recommendations;
}

// Get meals from database based on criteria
async function getMealsForRecommendation(mealType: string, preferredTags: string[], limit: number = 10) {
  // Get all meals of the specified type
  const meals = await db
    .select()
    .from(mealsLibrary)
    .where(eq(mealsLibrary.mealType, mealType))
    .limit(50); // Get more than needed for better filtering
    
  // Score meals based on tag matches
  const scoredMeals = meals.map(meal => {
    const mealTags = meal.tags ? JSON.parse(meal.tags as string) : [];
    const tagMatches = preferredTags.filter(tag => 
      mealTags.some((mealTag: string) => 
        mealTag.toLowerCase().includes(tag.toLowerCase()) || 
        tag.toLowerCase().includes(mealTag.toLowerCase())
      )
    ).length;
    
    return {
      ...meal,
      tagMatches,
      mealTags
    };
  });
  
  // Sort by tag matches and return top results
  return scoredMeals
    .sort((a, b) => b.tagMatches - a.tagMatches)
    .slice(0, limit);
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId') || 'default_user';
    const days = parseInt(searchParams.get('days') || '7');
    
    console.log(`🔍 Generating meal plan for user: ${userId}`);
    
    // Get user's recent WHOOP data
    const whoopData = await getRecentWhoopData(userId, days);
    console.log(`📊 Found ${whoopData.length} WHOOP data points`);
    
    // Get user preferences
    const userPrefs = await getUserPreferences(userId);
    console.log(`👤 User preferences:`, userPrefs ? 'Found' : 'Using defaults');
    
    // Analyze needs based on WHOOP data
    const mealNeeds = analyzeMealNeeds(whoopData, userPrefs);
    console.log(`🧠 Meal needs analysis:`, mealNeeds);
    
    // Get meal recommendations for each meal type
    const recommendations: { [key: string]: MealRecommendation[] } = {};
    
    for (const mealType of ['breakfast', 'lunch', 'dinner', 'snack']) {
      const preferredTags = mealNeeds[mealType as keyof typeof mealNeeds];
      const meals = await getMealsForRecommendation(mealType, preferredTags, 8);
      
      recommendations[mealType] = meals.map((meal, index) => ({
        id: meal.id,
        name: meal.name,
        mealType: meal.mealType,
        tags: meal.mealTags || [],
        nutrition: meal.nutrition ? JSON.parse(meal.nutrition as string) : {},
        imageUrl: meal.imageUrl || undefined,
        reason: generateRecommendationReason(meal.tagMatches, preferredTags, whoopData),
        priority: meal.tagMatches
      }));
    }
    
    // Generate insights based on WHOOP data
    const insights = generateInsights(whoopData, userPrefs);
    
    return NextResponse.json({
      success: true,
      userId,
      analysisDate: new Date().toISOString(),
      whoopDataPoints: whoopData.length,
      insights,
      recommendations,
      mealNeeds,
      whoopSummary: whoopData.length > 0 ? {
        avgRecovery: Math.round(whoopData.reduce((sum, d) => sum + (d.recoveryScore || 0), 0) / whoopData.length),
        avgStrain: Math.round(whoopData.reduce((sum, d) => sum + (d.strain || 0), 0) / whoopData.length * 10) / 10,
        avgSleep: Math.round(whoopData.reduce((sum, d) => sum + (d.sleepHours || 0), 0) / whoopData.length * 10) / 10,
        avgHrv: Math.round(whoopData.reduce((sum, d) => sum + (d.hrv || 0), 0) / whoopData.length)
      } : null
    });
    
  } catch (error) {
    console.error('Meal planning error:', error);
    return NextResponse.json({
      error: 'Failed to generate meal plan',
      code: 'PLANNING_ERROR',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

function generateRecommendationReason(tagMatches: number, preferredTags: string[], whoopData: any[]): string {
  if (tagMatches === 0) {
    return "Good nutritional balance for your daily needs";
  }
  
  const reasons = [];
  
  if (preferredTags.includes('Recovery') && tagMatches > 0) {
    reasons.push("supports muscle recovery");
  }
  if (preferredTags.includes('Energy') && tagMatches > 0) {
    reasons.push("boosts energy levels");
  }
  if (preferredTags.includes('High Protein') && tagMatches > 0) {
    reasons.push("high protein content");
  }
  if (preferredTags.includes('Anti-Inflammatory') && tagMatches > 0) {
    reasons.push("anti-inflammatory properties");
  }
  
  if (whoopData.length > 0) {
    const avgRecovery = whoopData.reduce((sum, d) => sum + (d.recoveryScore || 0), 0) / whoopData.length;
    if (avgRecovery < 50) {
      reasons.push("optimized for low recovery days");
    }
  }
  
  return reasons.length > 0 
    ? `Recommended because it ${reasons.join(', ')}`
    : "Well-balanced meal for your current needs";
}

function generateInsights(whoopData: any[], userPrefs: any): string[] {
  const insights = [];
  
  if (whoopData.length === 0) {
    insights.push("💡 Connect your WHOOP data for personalized meal recommendations");
    return insights;
  }
  
  const avgRecovery = whoopData.reduce((sum, d) => sum + (d.recoveryScore || 0), 0) / whoopData.length;
  const avgStrain = whoopData.reduce((sum, d) => sum + (d.strain || 0), 0) / whoopData.length;
  const avgSleep = whoopData.reduce((sum, d) => sum + (d.sleepHours || 0), 0) / whoopData.length;
  
  if (avgRecovery < 50) {
    insights.push("🔋 Your recovery is below optimal - focus on anti-inflammatory and recovery meals");
  }
  
  if (avgStrain > 15) {
    insights.push("💪 High training strain detected - prioritize high-protein meals for muscle repair");
  }
  
  if (avgSleep < 7) {
    insights.push("😴 Sleep could be improved - consider meals with magnesium and tryptophan");
  }
  
  if (avgRecovery > 70 && avgStrain > 12) {
    insights.push("🚀 Great recovery with high activity - perfect time for performance-focused nutrition");
  }
  
  return insights;
}

export async function POST(request: NextRequest) {
  return NextResponse.json({
    message: "Meal Planning API",
    description: "Get personalized meal recommendations based on WHOOP data and user preferences",
    usage: {
      method: "GET",
      parameters: {
        userId: "User identifier (optional, defaults to 'default_user')",
        days: "Number of days of WHOOP data to analyze (optional, defaults to 7)"
      }
    },
    features: [
      "🔍 Analyzes recent WHOOP recovery, strain, sleep, and HRV data",
      "🍽️ Recommends meals from your uploaded database",
      "🎯 Matches meal tags to your physiological needs",
      "💡 Provides insights based on your metrics",
      "⚡ Real-time recommendations that adapt to your data"
    ]
  });
}