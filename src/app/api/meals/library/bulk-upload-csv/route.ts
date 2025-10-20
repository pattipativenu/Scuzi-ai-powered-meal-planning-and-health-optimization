import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { mealsLibrary } from '@/db/schema';
import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';

// AWS Bedrock client for image generation
const bedrockClient = new BedrockRuntimeClient({
  region: process.env.AWS_REGION || 'us-east-1',
});

interface ParsedMeal {
  name: string;
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
    sodium?: number;
  };
  tags: string[];
}

// Generate meal image using AWS Titan Image Generator G1 V2
async function generateMealImage(mealName: string, ingredients: string[]): Promise<string | null> {
  try {
    // Create a descriptive prompt for the meal
    const mainIngredients = ingredients.slice(0, 3).join(', ');
    const prompt = `A beautifully plated ${mealName.toLowerCase()} featuring ${mainIngredients}, professional food photography, appetizing, well-lit, restaurant quality presentation, clean white background`;
    
    const payload = {
      taskType: "TEXT_IMAGE",
      textToImageParams: {
        text: prompt,
        negativeText: "blurry, low quality, dark, messy, unappetizing",
      },
      imageGenerationConfig: {
        numberOfImages: 1,
        height: 512,
        width: 512,
        cfgScale: 8.0,
        seed: Math.floor(Math.random() * 1000000)
      }
    };

    const command = new InvokeModelCommand({
      modelId: "amazon.titan-image-generator-v2:0",
      body: JSON.stringify(payload),
      contentType: "application/json",
      accept: "application/json",
    });

    const response = await bedrockClient.send(command);
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    
    if (responseBody.images && responseBody.images[0]) {
      // Convert base64 to data URL
      const base64Image = responseBody.images[0];
      return `data:image/png;base64,${base64Image}`;
    }
    
    return null;
  } catch (error) {
    console.error(`Failed to generate image for ${mealName}:`, error);
    return null;
  }
}

// Parse CSV content into meals
function parseMealsFromCSV(csvText: string): ParsedMeal[] {
  const meals: ParsedMeal[] = [];
  const lines = csvText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  
  if (lines.length === 0) return meals;
  
  // Get headers from first line
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, '').toLowerCase());
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
  const values = parseCSVLine(row);
  
  if (values.length < headers.length) {
    console.warn('Row has fewer values than headers');
    return null;
  }
  
  const rowData: { [key: string]: string } = {};
  headers.forEach((header, index) => {
    rowData[header] = values[index] || '';
  });
  
  // Extract meal data from CSV row
  const name = rowData['name'] || rowData['meal_name'] || rowData['title'] || '';
  if (!name) return null;
  
  const mealType = determineMealType(
    rowData['meal_type'] || rowData['type'] || rowData['category'] || 'dinner'
  );
  
  // Parse ingredients
  const ingredientsText = rowData['ingredients'] || '';
  const ingredients = parseListField(ingredientsText);
  
  // Parse instructions
  const instructionsText = rowData['instructions'] || rowData['method'] || rowData['directions'] || '';
  const instructions = parseListField(instructionsText);
  
  // Parse nutrition with better defaults
  const nutrition = {
    calories: parseInt(rowData['calories'] || '350') || 350,
    protein: parseFloat(rowData['protein'] || '20') || 20,
    fat: parseFloat(rowData['fat'] || '15') || 15,
    carbs: parseFloat(rowData['carbs'] || rowData['carbohydrates'] || '35') || 35,
    fiber: parseFloat(rowData['fiber'] || '8') || 8,
    sodium: parseFloat(rowData['sodium'] || '400') || 400
  };
  
  // Parse tags
  const tagsText = rowData['tags'] || rowData['benefits'] || '';
  const tags = parseTagsFromText(tagsText, mealType);
  
  // Parse times
  const prepTime = parseInt(rowData['prep_time'] || rowData['preptime'] || '15') || 15;
  const cookTime = parseInt(rowData['cook_time'] || rowData['cooktime'] || '0') || 0;
  const servings = parseInt(rowData['servings'] || rowData['serves'] || '1') || 1;
  
  return {
    name: name.trim(),
    description: rowData['description'] || rowData['benefits'] || `Nutritious ${mealType} meal with ${ingredients.slice(0, 2).join(' and ')}`,
    mealType,
    prepTime,
    cookTime,
    servings,
    ingredients,
    instructions,
    nutrition,
    tags
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
  return values.map(v => v.replace(/^"|"$/g, ''));
}

function parseListField(text: string): string[] {
  if (!text) return [];
  
  let items: string[] = [];
  
  if (text.includes('\n')) {
    items = text.split('\n');
  } else if (text.includes(';')) {
    items = text.split(';');
  } else if (text.includes('|')) {
    items = text.split('|');
  } else {
    items = text.split(',');
  }
  
  return items
    .map(item => item.trim())
    .filter(item => item.length > 0)
    .map(item => item.replace(/^[-•*]\s*/, ''));
}

function determineMealType(type: string): 'breakfast' | 'lunch' | 'dinner' | 'snack' {
  const lowerType = type.toLowerCase();
  if (lowerType.includes('breakfast')) return 'breakfast';
  if (lowerType.includes('lunch')) return 'lunch';
  if (lowerType.includes('dinner')) return 'dinner';
  if (lowerType.includes('snack')) return 'snack';
  return 'dinner';
}

function parseTagsFromText(text: string, mealType: string): string[] {
  const tags: string[] = [];
  const lowerText = text.toLowerCase();
  
  // Performance tags
  if (lowerText.includes('recovery') || lowerText.includes('muscle repair')) {
    tags.push('Recovery');
  }
  if (lowerText.includes('energy') || lowerText.includes('endurance')) {
    tags.push('Energy');
  }
  if (lowerText.includes('performance')) {
    tags.push('Better Performance');
  }
  
  // Nutritional tags
  if (lowerText.includes('high protein') || lowerText.includes('protein-rich')) {
    tags.push('High Protein');
  }
  if (lowerText.includes('anti-inflammatory') || lowerText.includes('inflammation')) {
    tags.push('Anti-Inflammatory');
  }
  
  // Default tags based on meal type
  if (tags.length === 0) {
    if (mealType === 'breakfast') tags.push('Energy');
    else if (mealType === 'dinner') tags.push('Recovery');
    else tags.push('Better Performance');
  }
  
  return tags;
}

export async function POST(request: NextRequest) {
  try {
    const { csvText, generateImages = true }: { csvText: string; generateImages?: boolean } = await request.json();

    if (!csvText || typeof csvText !== 'string') {
      return NextResponse.json({
        error: 'CSV content is required',
        code: 'INVALID_REQUEST'
      }, { status: 400 });
    }

    console.log('🚀 Starting bulk CSV upload with auto image generation...');
    
    // Parse meals from CSV
    const parsedMeals = parseMealsFromCSV(csvText);
    console.log(`📊 Parsed ${parsedMeals.length} meals from CSV`);

    if (parsedMeals.length === 0) {
      return NextResponse.json({
        error: 'No meals found in the CSV',
        code: 'NO_MEALS_FOUND'
      }, { status: 400 });
    }

    const results = {
      successful: [] as any[],
      failed: [] as any[],
      imagesGenerated: 0,
      imagesFailed: 0
    };

    // Process each meal
    for (let i = 0; i < parsedMeals.length; i++) {
      const meal = parsedMeals[i];
      
      try {
        console.log(`🍽️ Processing meal ${i + 1}/${parsedMeals.length}: ${meal.name}`);
        
        // Generate image if requested
        let imageUrl = null;
        if (generateImages) {
          console.log(`🎨 Generating image for: ${meal.name}`);
          imageUrl = await generateMealImage(meal.name, meal.ingredients);
          if (imageUrl) {
            results.imagesGenerated++;
            console.log(`✅ Image generated for: ${meal.name}`);
          } else {
            results.imagesFailed++;
            console.log(`❌ Image generation failed for: ${meal.name}`);
          }
        }

        // Convert to database format
        const mealForDb = {
          name: meal.name,
          description: meal.description,
          mealType: meal.mealType,
          prepTime: meal.prepTime || null,
          cookTime: meal.cookTime || null,
          servings: meal.servings,
          ingredients: JSON.stringify(meal.ingredients),
          instructions: JSON.stringify(meal.instructions),
          nutrition: JSON.stringify(meal.nutrition),
          tags: JSON.stringify(meal.tags),
          imageUrl: imageUrl,
          createdAt: new Date().toISOString(),
          updatedAt: imageUrl ? new Date().toISOString() : null
        };

        // Insert into database
        const [insertedMeal] = await db.insert(mealsLibrary).values(mealForDb).returning();
        
        results.successful.push({
          id: insertedMeal.id,
          name: meal.name,
          mealType: meal.mealType,
          hasImage: !!imageUrl
        });

        console.log(`✅ Inserted: ${meal.name} (ID: ${insertedMeal.id})`);

      } catch (error) {
        console.error(`❌ Failed to process meal: ${meal.name}`, error);
        results.failed.push({
          name: meal.name,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return NextResponse.json({
      success: results.successful.length > 0,
      message: `Bulk upload completed: ${results.successful.length} meals uploaded, ${results.imagesGenerated} images generated`,
      results: {
        totalMeals: parsedMeals.length,
        successful: results.successful.length,
        failed: results.failed.length,
        imagesGenerated: results.imagesGenerated,
        imagesFailed: results.imagesFailed
      },
      meals: results.successful,
      errors: results.failed.length > 0 ? results.failed : undefined
    }, { status: 201 });

  } catch (error) {
    console.error('Bulk upload error:', error);
    return NextResponse.json({
      error: 'Failed to process bulk upload',
      code: 'BULK_UPLOAD_ERROR',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: "Bulk CSV Upload with Auto Image Generation",
    description: "Upload CSV files and automatically generate meal images using AWS Titan G1V2",
    features: [
      "✅ Bulk CSV parsing and upload",
      "🎨 Automatic image generation with AWS Titan G1V2", 
      "📊 Progress tracking and error handling",
      "🔄 Works with existing SQLite database"
    ],
    usage: {
      method: "POST",
      body: {
        csvText: "CSV content as string",
        generateImages: "true/false (default: true)"
      }
    },
    csvFormat: {
      requiredColumns: ["name", "meal_type", "ingredients", "instructions"],
      optionalColumns: ["calories", "protein", "carbs", "fat", "fiber", "prep_time", "cook_time", "servings", "tags"]
    }
  });
}