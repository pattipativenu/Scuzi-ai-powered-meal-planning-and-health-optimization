import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { mealsLibrary } from '@/db/schema';
import { eq } from 'drizzle-orm';

interface DataQualityIssue {
  id: number;
  name: string;
  issues: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get('action') || 'analyze';
    
    // Get all meals
    const allMeals = await db.select().from(mealsLibrary);
    
    if (action === 'analyze') {
      // Analyze data quality
      const issues: DataQualityIssue[] = [];
      const duplicateNames = new Map<string, number[]>();
      
      for (const meal of allMeals) {
        const mealIssues: string[] = [];
        let severity: 'low' | 'medium' | 'high' | 'critical' = 'low';
        
        // Check for basic data quality issues
        if (!meal.name || meal.name.trim().length < 3) {
          mealIssues.push('Invalid or too short name');
          severity = 'critical';
        }
        
        // Parse JSON fields safely
        let ingredients: any[] = [];
        let instructions: any[] = [];
        let nutrition: any = {};
        
        try {
          ingredients = typeof meal.ingredients === 'string' ? JSON.parse(meal.ingredients) : meal.ingredients;
        } catch {
          mealIssues.push('Invalid ingredients JSON');
          severity = 'critical';
        }
        
        try {
          instructions = typeof meal.instructions === 'string' ? JSON.parse(meal.instructions) : meal.instructions;
        } catch {
          mealIssues.push('Invalid instructions JSON');
          severity = 'critical';
        }
        
        try {
          nutrition = typeof meal.nutrition === 'string' ? JSON.parse(meal.nutrition) : meal.nutrition;
        } catch {
          mealIssues.push('Invalid nutrition JSON');
          severity = 'critical';
        }
        
        // Check ingredients quality
        if (!Array.isArray(ingredients) || ingredients.length === 0) {
          mealIssues.push('No ingredients found');
          severity = 'critical';
        } else if (ingredients.length < 3) {
          mealIssues.push('Very few ingredients (less than 3)');
          severity = 'medium';
        }
        
        // Check instructions quality
        if (!Array.isArray(instructions) || instructions.length === 0) {
          mealIssues.push('No cooking instructions');
          severity = 'critical';
        } else if (instructions.length < 2) {
          mealIssues.push('Very few cooking steps (less than 2)');
          severity = 'medium';
        }
        
        // Check nutrition data
        if (!nutrition || typeof nutrition !== 'object') {
          mealIssues.push('No nutrition data');
          severity = 'high';
        } else {
          if (!nutrition.calories || nutrition.calories <= 0) {
            mealIssues.push('Invalid calories data');
            severity = 'high';
          }
          if (!nutrition.protein || nutrition.protein <= 0) {
            mealIssues.push('Invalid protein data');
            severity = 'medium';
          }
        }
        
        // Check for suspicious content (test data, corrupted entries)
        const nameText = meal.name.toLowerCase();
        const descText = (meal.description || '').toLowerCase();
        
        if (nameText.includes('test') || nameText.includes('sample') || nameText.includes('example')) {
          mealIssues.push('Appears to be test data');
          severity = 'high';
        }
        
        if (descText.includes('i\'ll create') || descText.includes('here\'s a recipe') || descText.includes('let me')) {
          mealIssues.push('Contains AI generation text in description');
          severity = 'medium';
        }
        
        // Track duplicates
        const normalizedName = meal.name.toLowerCase().trim();
        if (!duplicateNames.has(normalizedName)) {
          duplicateNames.set(normalizedName, []);
        }
        duplicateNames.get(normalizedName)!.push(meal.id);
        
        // Add to issues if there are problems
        if (mealIssues.length > 0) {
          issues.push({
            id: meal.id,
            name: meal.name,
            issues: mealIssues,
            severity
          });
        }
      }
      
      // Find actual duplicates
      const duplicates = Array.from(duplicateNames.entries())
        .filter(([name, ids]) => ids.length > 1)
        .map(([name, ids]) => ({ name, ids, count: ids.length }));
      
      // Categorize issues
      const criticalIssues = issues.filter(i => i.severity === 'critical');
      const highIssues = issues.filter(i => i.severity === 'high');
      const mediumIssues = issues.filter(i => i.severity === 'medium');
      
      return NextResponse.json({
        success: true,
        summary: {
          totalMeals: allMeals.length,
          totalIssues: issues.length,
          criticalIssues: criticalIssues.length,
          highIssues: highIssues.length,
          mediumIssues: mediumIssues.length,
          duplicateGroups: duplicates.length,
          totalDuplicates: duplicates.reduce((sum, d) => sum + d.count - 1, 0)
        },
        issues: {
          critical: criticalIssues.slice(0, 10), // Show first 10 of each
          high: highIssues.slice(0, 10),
          medium: mediumIssues.slice(0, 10)
        },
        duplicates: duplicates.slice(0, 20), // Show first 20 duplicate groups
        recommendations: [
          criticalIssues.length > 0 ? 'Delete meals with critical issues (corrupted data)' : null,
          duplicates.length > 0 ? 'Remove duplicate meals (keep best quality)' : null,
          allMeals.length > 200 ? 'Database seems too large - likely contains test/corrupted data' : null,
          highIssues.length > 50 ? 'Many meals missing nutrition data' : null
        ].filter(Boolean)
      });
    }
    
    if (action === 'clean') {
      // Clean up corrupted and duplicate data
      const confirmClean = searchParams.get('confirm') === 'true';
      
      if (!confirmClean) {
        return NextResponse.json({
          error: 'Confirmation required',
          message: 'Add ?confirm=true to proceed with cleanup',
          warning: 'This will delete corrupted and duplicate meals'
        }, { status: 400 });
      }
      
      let deletedCount = 0;
      const issues: string[] = [];
      
      // Delete meals with critical issues
      for (const meal of allMeals) {
        let shouldDelete = false;
        const deleteReasons: string[] = [];
        
        // Check for corrupted JSON
        try {
          JSON.parse(meal.ingredients);
          JSON.parse(meal.instructions);
          JSON.parse(meal.nutrition);
        } catch {
          shouldDelete = true;
          deleteReasons.push('Corrupted JSON data');
        }
        
        // Check for test data
        const nameText = meal.name.toLowerCase();
        if (nameText.includes('test') || nameText.includes('sample') || nameText.includes('example')) {
          shouldDelete = true;
          deleteReasons.push('Test data');
        }
        
        // Check for empty/invalid data
        if (!meal.name || meal.name.trim().length < 3) {
          shouldDelete = true;
          deleteReasons.push('Invalid name');
        }
        
        if (shouldDelete) {
          await db.delete(mealsLibrary).where(eq(mealsLibrary.id, meal.id));
          deletedCount++;
          issues.push(`Deleted meal ID ${meal.id}: ${deleteReasons.join(', ')}`);
        }
      }
      
      return NextResponse.json({
        success: true,
        message: `Cleaned up ${deletedCount} corrupted meals`,
        deletedCount,
        issues: issues.slice(0, 20) // Show first 20 deletion reasons
      });
    }
    
    return NextResponse.json({
      message: 'Meal Library Data Audit',
      actions: {
        'analyze': 'GET ?action=analyze - Analyze data quality issues',
        'clean': 'GET ?action=clean&confirm=true - Clean up corrupted data'
      },
      currentStats: {
        totalMeals: allMeals.length,
        expectedMeals: '56-112 (based on your PDFs)'
      }
    });
    
  } catch (error) {
    console.error('Audit error:', error);
    return NextResponse.json({
      error: 'Failed to audit data',
      code: 'AUDIT_ERROR',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { confirmDelete = false } = await request.json();
    
    if (!confirmDelete) {
      return NextResponse.json({
        error: 'Confirmation required',
        message: 'Set confirmDelete: true to clear all meals'
      }, { status: 400 });
    }
    
    // Delete all meals
    const allMeals = await db.select().from(mealsLibrary);
    const totalCount = allMeals.length;
    
    // Delete all records
    for (const meal of allMeals) {
      await db.delete(mealsLibrary).where(eq(mealsLibrary.id, meal.id));
    }
    
    return NextResponse.json({
      success: true,
      message: `Deleted all ${totalCount} meals from database`,
      deletedCount: totalCount
    });
    
  } catch (error) {
    console.error('Delete error:', error);
    return NextResponse.json({
      error: 'Failed to delete meals',
      code: 'DELETE_ERROR'
    }, { status: 500 });
  }
}