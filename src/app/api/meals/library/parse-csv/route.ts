import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { mealsLibrary } from '@/db/schema';

interface ParsedMeal {
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

// Parse CSV content into meals
function parseMealsFromCSV(csvText: string): ParsedMeal[] {
  const meals: ParsedMeal[] = [];
  const lines = csvText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  
  if (lines.length === 0) return meals;
  
  // Get headers from first line
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
  console.log('CSV Headers:', headers);
  
  // Process each data row
  for (let i = 1; i < lines.length; i++) {
    try {
      const meal = parseCSVRow(lines[i], headers);
      if (meal && meal.name) {
        meals.push(meal);
      }
    } catch (error) {
      console.warn(`Skipping row ${i + 1}:`, error);
    }
  }
  
  return meals;
}

function parseCSVRow(row: string, headers: string[]): ParsedMeal | null {
  // Handle CSV parsing with proper quote handling
  const values = parseCSVLine(row);
  
  if (values.length < headers.length) {
    console.warn('Row has fewer values than headers');
    return null;
  }
  
  const rowData: { [key: string]: string } = {};
  headers.forEach((header, index) => {
    rowData[header.toLowerCase()] = values[index] || '';
  });
  
  // Extract meal data from CSV row
  const name = rowData['name'] || rowData['meal_name'] || rowData['title'] || '';
  if (!name) return null;
  
  const mealType = determineMealType(
    rowData['meal_type'] || rowData['type'] || rowData['category'] || 'dinner'
  );
  
  // Parse ingredients (could be comma-separated or newline-separated)
  const ingredientsText = rowData['ingredients'] || '';
  const ingredients = parseListField(ingredientsText);
  
  // Parse instructions
  const instructionsText = rowData['instructions'] || rowData['method'] || rowData['directions'] || '';
  const instructions = parseListField(instructionsText);
  
  // Parse nutrition
  const nutrition = {
    calories: parseInt(rowData['calories'] || '300') || 300,
    protein: parseFloat(rowData['protein'] || '15') || 15,
    fat: parseFloat(rowData['fat'] || '10') || 10,
    carbs: parseFloat(rowData['carbs'] || rowData['carbohydrates'] || '30') || 30,
    fiber: parseFloat(rowData['fiber'] || '5') || 5
  };
  
  // Parse tags
  const tagsText = rowData['tags'] || rowData['benefits'] || '';
  const tags = parseTagsFromText(tagsText);
  
  // Parse times
  const prepTime = parseInt(rowData['prep_time'] || rowData['preptime'] || '15') || 15;
  const cookTime = parseInt(rowData['cook_time'] || rowData['cooktime'] || '0') || 0;
  const servings = parseInt(rowData['servings'] || rowData['serves'] || '1') || 1;
  
  return {
    name: name.trim(),
    tagline: rowData['tagline'] || rowData['subtitle'] || undefined,
    description: rowData['description'] || rowData['benefits'] || rowData['why_helpful'] || `Nutritious ${mealType} meal`,
    mealType,
    prepTime,
    cookTime,
    servings,
    ingredients,
    instructions,
    nutrition,
    tags,
    whyHelpful: rowData['benefits'] || rowData['why_helpful'] || rowData['description'] || 'This meal supports your health and wellness goals.'
  };
}

function parseCSVLine(line: string): string[] {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  values.push(current.trim());
  return values.map(v => v.replace(/^"|"$/g, '')); // Remove surrounding quotes
}

function parseListField(text: string): string[] {
  if (!text) return [];
  
  // Try different separators
  let items: string[] = [];
  
  if (text.includes('\n')) {
    items = text.split('\n');
  } else if (text.includes(';')) {
    items = text.split(';');
  } else if (text.includes('|')) {
    items = text.split('|');
  } else {
    // For ingredients, be more careful with comma splitting
    // Look for patterns like "1 cup flour, 2 eggs, etc."
    items = text.split(',');
  }
  
  return items
    .map(item => item.trim())
    .filter(item => item.length > 0)
    .map(item => item.replace(/^[-•*]\s*/, '')); // Remove bullet points
}

function determineMealType(type: string): 'breakfast' | 'lunch' | 'dinner' | 'snack' {
  const lowerType = type.toLowerCase();
  if (lowerType.includes('breakfast')) return 'breakfast';
  if (lowerType.includes('lunch')) return 'lunch';
  if (lowerType.includes('dinner')) return 'dinner';
  if (lowerType.includes('snack')) return 'snack';
  return 'dinner'; // Default
}

function parseTagsFromText(text: string): string[] {
  const tags: string[] = [];
  const lowerText = text.toLowerCase();
  
  if (lowerText.includes('recovery') || lowerText.includes('muscle repair')) {
    tags.push('Recovery');
  }
  if (lowerText.includes('sleep') || lowerText.includes('melatonin') || lowerText.includes('tryptophan')) {
    tags.push('Better Sleep');
  }
  if (lowerText.includes('performance') || lowerText.includes('energy') || lowerText.includes('endurance')) {
    tags.push('Better Performance');
  }
  if (lowerText.includes('anti-inflammatory') || lowerText.includes('inflammation')) {
    tags.push('Anti-Inflammatory');
  }
  if (lowerText.includes('high protein') || lowerText.includes('protein-rich')) {
    tags.push('High Protein');
  }
  if (lowerText.includes('low carb') || lowerText.includes('low-carb')) {
    tags.push('Low Carb');
  }
  
  return tags.length > 0 ? tags : ['Better Performance'];
}

export async function POST(request: NextRequest) {
  try {
    const { csvText }: { csvText: string } = await request.json();

    if (!csvText || typeof csvText !== 'string') {
      return NextResponse.json({
        error: 'CSV content is required',
        code: 'INVALID_REQUEST'
      }, { status: 400 });
    }

    console.log('📊 Parsing CSV content...');
    
    // Parse meals from CSV
    const parsedMeals = parseMealsFromCSV(csvText);
    
    console.log(`🍽️ Found ${parsedMeals.length} meals in CSV`);

    if (parsedMeals.length === 0) {
      return NextResponse.json({
        error: 'No meals found in the CSV',
        code: 'NO_MEALS_FOUND',
        suggestion: 'Make sure the CSV has proper headers and meal data'
      }, { status: 400 });
    }

    // Convert to database format
    const mealsForDb = parsedMeals.map(meal => ({
      name: meal.name,
      description: meal.whyHelpful,
      mealType: meal.mealType,
      prepTime: meal.prepTime || null,
      cookTime: meal.cookTime || null,
      servings: meal.servings,
      ingredients: JSON.stringify(meal.ingredients),
      instructions: JSON.stringify(meal.instructions),
      nutrition: JSON.stringify(meal.nutrition),
      tags: JSON.stringify(meal.tags),
      createdAt: new Date().toISOString()
    }));

    // Insert into database
    const insertedMeals = await db.insert(mealsLibrary).values(mealsForDb).returning();

    return NextResponse.json({
      success: true,
      message: `Successfully parsed and uploaded ${insertedMeals.length} meals from CSV`,
      parsedCount: parsedMeals.length,
      insertedCount: insertedMeals.length,
      meals: insertedMeals.map(meal => ({
        id: meal.id,
        name: meal.name,
        mealType: meal.mealType
      })),
      preview: parsedMeals.slice(0, 3)
    }, { status: 201 });

  } catch (error) {
    console.error('CSV parsing error:', error);
    return NextResponse.json({
      error: 'Failed to parse CSV content',
      code: 'PARSING_ERROR',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: "CSV Meal Parser",
    instructions: [
      "1. Export your meal data to CSV format",
      "2. Copy the CSV content",
      "3. Send a POST request with csvText in the body",
      "4. The parser will extract meal data from CSV columns",
      "5. Supports various CSV formats and column names"
    ],
    supportedColumns: [
      "name, meal_name, title - Meal name",
      "meal_type, type, category - Meal category",
      "ingredients - Ingredient list",
      "instructions, method, directions - Cooking steps",
      "calories, protein, fat, carbs, fiber - Nutrition",
      "tags, benefits - Meal tags/benefits",
      "prep_time, cook_time, servings - Timing and portions"
    ],
    example: {
      method: "POST",
      body: {
        csvText: "name,meal_type,ingredients,instructions,calories,protein\nScrambled Eggs,breakfast,2 eggs;1 tbsp butter,Beat eggs and cook,200,12"
      }
    }
  });
}