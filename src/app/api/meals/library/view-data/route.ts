import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { mealsLibrary } from '@/db/schema';
import { eq, like } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const format = searchParams.get('format') || 'json';
    const limit = parseInt(searchParams.get('limit') || '50');
    const search = searchParams.get('search');
    const mealType = searchParams.get('meal_type');
    
    // Build query
    let query = db.select().from(mealsLibrary);
    
    // Get all meals (with optional filters)
    const allMeals = await query;
    
    // Apply filters
    let filteredMeals = allMeals;
    
    if (search) {
      filteredMeals = filteredMeals.filter(meal => 
        meal.name.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    if (mealType) {
      filteredMeals = filteredMeals.filter(meal => meal.mealType === mealType);
    }
    
    // Apply limit
    const meals = filteredMeals.slice(0, limit);
    
    // Parse JSON fields for display
    const parsedMeals = meals.map(meal => ({
      id: meal.id,
      name: meal.name,
      description: meal.description,
      mealType: meal.mealType,
      prepTime: meal.prepTime,
      cookTime: meal.cookTime,
      servings: meal.servings,
      ingredients: typeof meal.ingredients === 'string' ? JSON.parse(meal.ingredients) : meal.ingredients,
      instructions: typeof meal.instructions === 'string' ? JSON.parse(meal.instructions) : meal.instructions,
      nutrition: typeof meal.nutrition === 'string' ? JSON.parse(meal.nutrition) : meal.nutrition,
      tags: typeof meal.tags === 'string' ? JSON.parse(meal.tags) : meal.tags,
      imageUrl: meal.imageUrl,
      createdAt: meal.createdAt
    }));
    
    // Statistics
    const stats = {
      totalMeals: allMeals.length,
      filteredCount: filteredMeals.length,
      displayedCount: meals.length,
      mealTypes: {
        breakfast: allMeals.filter(m => m.mealType === 'breakfast').length,
        lunch: allMeals.filter(m => m.mealType === 'lunch').length,
        dinner: allMeals.filter(m => m.mealType === 'dinner').length,
        snack: allMeals.filter(m => m.mealType === 'snack').length
      },
      withImages: allMeals.filter(m => m.imageUrl).length,
      withoutImages: allMeals.filter(m => !m.imageUrl).length
    };
    
    if (format === 'html') {
      // Return HTML view for browser
      const html = generateHTMLView(parsedMeals, stats);
      return new Response(html, {
        headers: { 'Content-Type': 'text/html' }
      });
    }
    
    // Return JSON
    return NextResponse.json({
      success: true,
      statistics: stats,
      meals: parsedMeals,
      filters: {
        search,
        mealType,
        limit
      },
      availableEndpoints: {
        'HTML View': '/api/meals/library/view-data?format=html',
        'JSON Data': '/api/meals/library/view-data',
        'Filter by type': '/api/meals/library/view-data?meal_type=breakfast',
        'Search meals': '/api/meals/library/view-data?search=chicken',
        'Limit results': '/api/meals/library/view-data?limit=10'
      }
    });
    
  } catch (error) {
    console.error('Database view error:', error);
    return NextResponse.json({
      error: 'Failed to retrieve meals data',
      code: 'DATABASE_ERROR',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

function generateHTMLView(meals: any[], stats: any): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Scuzi Meals Library - Database View</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; }
        .header { background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; margin-bottom: 20px; }
        .stat-card { background: white; padding: 15px; border-radius: 8px; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .stat-number { font-size: 24px; font-weight: bold; color: #2563eb; }
        .stat-label { font-size: 12px; color: #6b7280; text-transform: uppercase; }
        .meal-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); gap: 20px; }
        .meal-card { background: white; border-radius: 8px; padding: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .meal-title { font-size: 18px; font-weight: bold; margin-bottom: 8px; color: #1f2937; }
        .meal-type { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 500; text-transform: uppercase; }
        .breakfast { background: #fef3c7; color: #92400e; }
        .lunch { background: #d1fae5; color: #065f46; }
        .dinner { background: #dbeafe; color: #1e40af; }
        .snack { background: #e9d5ff; color: #7c2d12; }
        .nutrition { display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px; margin: 10px 0; }
        .nutrition-item { text-align: center; padding: 8px; background: #f9fafb; border-radius: 4px; }
        .nutrition-value { font-weight: bold; color: #1f2937; }
        .nutrition-label { font-size: 10px; color: #6b7280; }
        .ingredients, .instructions { margin: 10px 0; }
        .ingredients ul, .instructions ol { margin: 5px 0; padding-left: 20px; }
        .ingredients li, .instructions li { margin: 2px 0; font-size: 14px; }
        .tags { margin: 10px 0; }
        .tag { display: inline-block; padding: 2px 6px; background: #f3f4f6; border-radius: 12px; font-size: 11px; margin: 2px; }
        .section-title { font-size: 14px; font-weight: 600; color: #374151; margin: 10px 0 5px 0; }
        .description { font-size: 13px; color: #6b7280; line-height: 1.4; margin: 8px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🍽️ Scuzi Meals Library Database</h1>
            <p>Live view of your meals database • Updated: ${new Date().toLocaleString()}</p>
        </div>
        
        <div class="stats">
            <div class="stat-card">
                <div class="stat-number">${stats.totalMeals}</div>
                <div class="stat-label">Total Meals</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${stats.mealTypes.breakfast}</div>
                <div class="stat-label">Breakfast</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${stats.mealTypes.lunch}</div>
                <div class="stat-label">Lunch</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${stats.mealTypes.dinner}</div>
                <div class="stat-label">Dinner</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${stats.mealTypes.snack}</div>
                <div class="stat-label">Snacks</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${stats.withImages}</div>
                <div class="stat-label">With Images</div>
            </div>
        </div>
        
        <div class="meal-grid">
            ${meals.map(meal => `
                <div class="meal-card">
                    <div class="meal-title">${meal.name}</div>
                    <span class="meal-type ${meal.mealType}">${meal.mealType}</span>
                    
                    ${meal.description ? `<div class="description">${meal.description.substring(0, 150)}${meal.description.length > 150 ? '...' : ''}</div>` : ''}
                    
                    <div class="nutrition">
                        <div class="nutrition-item">
                            <div class="nutrition-value">${meal.nutrition?.calories || 0}</div>
                            <div class="nutrition-label">Calories</div>
                        </div>
                        <div class="nutrition-item">
                            <div class="nutrition-value">${meal.nutrition?.protein || 0}g</div>
                            <div class="nutrition-label">Protein</div>
                        </div>
                        <div class="nutrition-item">
                            <div class="nutrition-value">${meal.nutrition?.carbs || 0}g</div>
                            <div class="nutrition-label">Carbs</div>
                        </div>
                        <div class="nutrition-item">
                            <div class="nutrition-value">${meal.nutrition?.fat || 0}g</div>
                            <div class="nutrition-label">Fat</div>
                        </div>
                        <div class="nutrition-item">
                            <div class="nutrition-value">${meal.nutrition?.fiber || 0}g</div>
                            <div class="nutrition-label">Fiber</div>
                        </div>
                    </div>
                    
                    <div class="ingredients">
                        <div class="section-title">Ingredients (${meal.ingredients?.length || 0})</div>
                        <ul>
                            ${(meal.ingredients || []).slice(0, 5).map(ing => `<li>${ing}</li>`).join('')}
                            ${meal.ingredients?.length > 5 ? `<li><em>... and ${meal.ingredients.length - 5} more</em></li>` : ''}
                        </ul>
                    </div>
                    
                    <div class="instructions">
                        <div class="section-title">Instructions (${meal.instructions?.length || 0} steps)</div>
                        <ol>
                            ${(meal.instructions || []).slice(0, 3).map(inst => `<li>${inst.substring(0, 80)}${inst.length > 80 ? '...' : ''}</li>`).join('')}
                            ${meal.instructions?.length > 3 ? `<li><em>... ${meal.instructions.length - 3} more steps</em></li>` : ''}
                        </ol>
                    </div>
                    
                    ${meal.tags?.length ? `
                        <div class="tags">
                            <div class="section-title">Tags</div>
                            ${meal.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                        </div>
                    ` : ''}
                    
                    <div style="margin-top: 10px; font-size: 11px; color: #9ca3af;">
                        ID: ${meal.id} • 
                        ${meal.prepTime ? `Prep: ${meal.prepTime}min • ` : ''}
                        ${meal.cookTime ? `Cook: ${meal.cookTime}min • ` : ''}
                        Serves: ${meal.servings || 1} • 
                        ${meal.imageUrl ? '📷 Has Image' : '📷 No Image'}
                    </div>
                </div>
            `).join('')}
        </div>
        
        <div style="text-align: center; margin: 40px 0; color: #6b7280;">
            <p>Showing ${meals.length} of ${stats.totalMeals} meals</p>
            <p><a href="/api/meals/library/view-data">JSON View</a> | <a href="/admin/meals-library">Admin Panel</a></p>
        </div>
    </div>
</body>
</html>`;
}