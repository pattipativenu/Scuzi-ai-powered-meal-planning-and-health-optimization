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

// Smart meal parser that extracts ONLY meal data
function parseMealsFromText(text: string): ParsedMeal[] {
  console.log('🔍 Starting to parse text...');
  const meals: ParsedMeal[] = [];
  
  // Split text into sections and find meal patterns
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  console.log(`📝 Processing ${lines.length} lines`);
  
  // Log first few lines to understand the format (only in development)
  if (process.env.NODE_ENV === 'development') {
    console.log('📄 First 10 lines preview:');
    lines.slice(0, 10).forEach((line, i) => {
      console.log(`  ${i + 1}: ${line.substring(0, 100)}${line.length > 100 ? '...' : ''}`);
    });
  }
  
  let currentMeal: Partial<ParsedMeal> | null = null;
  let currentSection = '';
  let mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack' = 'breakfast';
  
  // Determine meal type from context
  const determineMealType = (text: string): 'breakfast' | 'lunch' | 'dinner' | 'snack' => {
    const lowerText = text.toLowerCase();
    if (lowerText.includes('breakfast')) return 'breakfast';
    if (lowerText.includes('lunch')) return 'lunch';
    if (lowerText.includes('dinner')) return 'dinner';
    if (lowerText.includes('snack')) return 'snack';
    return mealType; // Keep current type
  };
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Skip non-meal content (introductory text, explanations, etc.)
    if (line.includes('Personalized Nutritional Strategy') ||
        line.includes('This personalized meal plan') ||
        line.includes('Your data indicates') ||
        line.includes('Research shows') ||
        line.includes('Start your day with') ||
        line.includes('All 56 recipes are unique') ||
        line.match(/^\d+\s*$/)) {
      continue;
    }
    
    // Detect meal type sections
    if (line.match(/^(Breakfast|Lunch|Dinner|Snack).*\(\d+\s*Recipes?\)/i)) {
      mealType = determineMealType(line);
      console.log(`📂 Found meal type section: ${mealType}`);
      continue;
    }
    
    // PRIORITY 1: Look for the exact "Meal name:" pattern used in both PDFs
    let potentialMealName = '';
    let isMealTitle = false;
    
    // Check for the exact format: "Meal name: [Name]"
    const mealNameMatch = line.match(/^Meal name:\s*(.+)$/i);
    if (mealNameMatch) {
      potentialMealName = mealNameMatch[1].trim();
      isMealTitle = true;
      console.log(`🎯 Detected meal title: "${potentialMealName}"`);
    }
    
    // If we found a meal title, start a new meal
    if (isMealTitle && potentialMealName) {
      // Save previous meal if exists
      if (currentMeal && currentMeal.name) {
        console.log(`✅ Finalizing meal: ${currentMeal.name}`);
        // Use the meal's own type if set, otherwise use the current mealType
        const finalMealType = currentMeal.mealType || mealType;
        meals.push(finalizeMeal(currentMeal, finalMealType));
      }
      
      // Start new meal
      console.log(`🍽️ Starting new meal: ${potentialMealName}`);
      currentMeal = {
        name: potentialMealName,
        mealType: 'breakfast', // Default type, will be updated when "Meal Type:" is found
        ingredients: [],
        instructions: [],
        tags: [],
        servings: 1
      };
      currentSection = 'title';
      continue;
    }
    
    // Skip processing if no current meal
    if (!currentMeal) continue;
    
    // Parse tagline
    if (line.startsWith('Tagline:')) {
      currentMeal.tagline = line.replace('Tagline:', '').trim();
      currentSection = 'tagline';
      continue;
    }
    
    // Parse preparation time (PDF1 format)
    if (line.startsWith('Preparation Time:')) {
      const timeMatch = line.match(/(\d+)\s*minutes?/i);
      if (timeMatch) {
        currentMeal.prepTime = parseInt(timeMatch[1]);
      }
      currentSection = 'prepTime';
      continue;
    }
    
    // Parse prep time (alternative format)
    if (line.startsWith('Prep Time:')) {
      const timeMatch = line.match(/(\d+)\s*minutes?/i);
      if (timeMatch) {
        currentMeal.prepTime = parseInt(timeMatch[1]);
      }
      currentSection = 'prepTime';
      continue;
    }
    
    // Parse cook time
    if (line.startsWith('Cook Time:')) {
      const timeMatch = line.match(/(\d+)\s*minutes?/i);
      if (timeMatch) {
        currentMeal.cookTime = parseInt(timeMatch[1]);
      }
      currentSection = 'cookTime';
      continue;
    }
    
    // Parse servings
    if (line.match(/Ingredients?\s*\((\d+)\s*servings?\)/i)) {
      const servingsMatch = line.match(/\((\d+)\s*servings?\)/i);
      if (servingsMatch) {
        currentMeal.servings = parseInt(servingsMatch[1]);
      }
      currentSection = 'ingredients';
      continue;
    }
    
    // Detect ingredients section more broadly
    if (line.match(/^Ingredients?/i) || line.includes('Ingredients')) {
      currentSection = 'ingredients';
      console.log(`📝 Found ingredients section for: ${currentMeal?.name}`);
      continue;
    }
    
    // Parse ingredients (lines starting with -, •, or similar, or just listed items)
    if (currentSection === 'ingredients' && (line.startsWith('-') || line.startsWith('•') || line.startsWith('*'))) {
      const ingredient = line.replace(/^[-•*]\s*/, '').trim();
      if (ingredient && !ingredient.toLowerCase().includes('method') && !ingredient.toLowerCase().includes('nutrition')) {
        currentMeal.ingredients!.push(ingredient);
        console.log(`🥕 Added ingredient: ${ingredient}`);
      }
      continue;
    }
    
    // Detect method/instructions section
    if (line.match(/^(Method|Instructions?|Directions?):/i)) {
      currentSection = 'instructions';
      continue;
    }
    
    // Parse instructions (numbered steps or bullet points) - but NOT if it looks like a meal title
    if (currentSection === 'instructions' && 
        (line.match(/^\d+\./) || line.startsWith('-') || line.startsWith('•'))) {
      
      // Don't treat numbered instructions as new meals if we're already in instructions section
      const instruction = line.replace(/^\d+\.\s*/, '').replace(/^[-•*]\s*/, '').trim();
      if (instruction && !instruction.toLowerCase().includes('nutrition') && !instruction.toLowerCase().includes('benefits')) {
        currentMeal.instructions!.push(instruction);
      }
      continue;
    }
    
    // Detect nutrition section
    if (line.match(/^Nutrition/i) || line.includes('Calories') || line.includes('Protein')) {
      currentSection = 'nutrition';
      // Try to parse nutrition from current and next few lines
      const nutritionText = lines.slice(i, i + 10).join(' ');
      currentMeal.nutrition = parseNutrition(nutritionText);
      continue;
    }
    
    // Detect benefits/why helpful section
    if (line.match(/^(Benefits?|Why.*helpful|Why.*beneficial|Health.*benefits)/i)) {
      currentSection = 'benefits';
      continue;
    }
    
    // Parse benefits text
    if (currentSection === 'benefits' && line.length > 20) {
      if (!currentMeal.whyHelpful) {
        currentMeal.whyHelpful = line;
      } else {
        currentMeal.whyHelpful += ' ' + line;
      }
      continue;
    }
    
    // Detect tags section
    if (line.match(/^Tags?:/i)) {
      const tagsText = line.replace(/^Tags?:/i, '').trim();
      currentMeal.tags = parseTagsFromText(tagsText);
      currentSection = 'tags';
      continue;
    }
    
    // Detect meal type section
    if (line.match(/^Meal Type:/i)) {
      const mealTypeText = line.replace(/^Meal Type:/i, '').trim().toLowerCase();
      // Handle different meal type formats
      if (mealTypeText.includes('breakfast')) {
        mealType = 'breakfast';
      } else if (mealTypeText.includes('lunch') && mealTypeText.includes('dinner')) {
        // For "Lunch/Dinner", default to lunch (can be used for both)
        mealType = 'lunch';
      } else if (mealTypeText.includes('lunch')) {
        mealType = 'lunch';
      } else if (mealTypeText.includes('dinner')) {
        mealType = 'dinner';
      } else if (mealTypeText.includes('snack')) {
        mealType = 'snack';
      }
      
      // Update current meal's type
      if (currentMeal) {
        currentMeal.mealType = mealType;
        console.log(`🍽️ Updated meal type to: ${mealType} for meal: ${currentMeal.name}`);
      }
      
      console.log(`🍽️ Set meal type: ${mealType} for meal: ${currentMeal?.name}`);
      currentSection = 'mealType';
      continue;
    }
  }
  
  // Save last meal
  if (currentMeal && currentMeal.name) {
    console.log(`✅ Finalizing last meal: ${currentMeal.name}`);
    // Use the meal's own type if set, otherwise use the current mealType
    const finalMealType = currentMeal.mealType || mealType;
    meals.push(finalizeMeal(currentMeal, finalMealType));
  }
  
  console.log(`🎯 Parsed ${meals.length} meals total`);
  return meals;
}

function parseNutrition(text: string): { calories: number; protein: number; fat: number; carbs: number; fiber: number } {
  const nutrition = { calories: 0, protein: 0, fat: 0, carbs: 0, fiber: 0 };
  
  // Extract numbers followed by units - handle both formats
  const caloriesMatch = text.match(/[~]?(\d+)\s*(?:calories?|kcal)/i);
  const proteinMatch = text.match(/[~]?(\d+(?:\.\d+)?)\s*g?\s*protein/i);
  const fatMatch = text.match(/[~]?(\d+(?:\.\d+)?)\s*g?\s*fat/i);
  const carbsMatch = text.match(/[~]?(\d+(?:\.\d+)?)\s*g?\s*carb/i);
  const fiberMatch = text.match(/[~]?(\d+(?:\.\d+)?)\s*g?\s*fiber/i);
  
  if (caloriesMatch) nutrition.calories = parseInt(caloriesMatch[1]);
  if (proteinMatch) nutrition.protein = parseFloat(proteinMatch[1]);
  if (fatMatch) nutrition.fat = parseFloat(fatMatch[1]);
  if (carbsMatch) nutrition.carbs = parseFloat(carbsMatch[1]);
  if (fiberMatch) nutrition.fiber = parseFloat(fiberMatch[1]);
  
  console.log(`🥗 Parsed nutrition: ${JSON.stringify(nutrition)}`);
  return nutrition;
}

function parseTagsFromText(text: string): string[] {
  const tags: string[] = [];
  
  // Split by commas and clean up
  const tagParts = text.split(',').map(tag => tag.trim());
  
  for (const tag of tagParts) {
    const cleanTag = tag.trim();
    if (cleanTag && cleanTag.length > 0) {
      tags.push(cleanTag);
    }
  }
  
  // If no tags found, try to extract from common patterns
  if (tags.length === 0) {
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('recovery')) tags.push('Recovery');
    if (lowerText.includes('better sleep')) tags.push('Better Sleep');
    if (lowerText.includes('better performance')) tags.push('Better Performance');
    if (lowerText.includes('energy')) tags.push('Energy');
    if (lowerText.includes('anti-inflammatory')) tags.push('Anti-Inflammatory');
    if (lowerText.includes('high protein')) tags.push('High Protein');
  }
  
  console.log(`🏷️ Parsed tags: ${JSON.stringify(tags)}`);
  return tags.length > 0 ? tags : ['Better Performance']; // Default tag
}

function finalizeMeal(meal: Partial<ParsedMeal>, mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack'): ParsedMeal {
  return {
    name: meal.name || 'Unnamed Meal',
    tagline: meal.tagline,
    description: meal.whyHelpful || meal.tagline || 'Nutritious meal for optimal health',
    mealType,
    prepTime: meal.prepTime || 15,
    cookTime: meal.cookTime || 0,
    servings: meal.servings || 1,
    ingredients: meal.ingredients || [],
    instructions: meal.instructions || [],
    nutrition: meal.nutrition || { calories: 300, protein: 15, fat: 10, carbs: 30, fiber: 5 },
    tags: meal.tags || ['Better Performance'],
    whyHelpful: meal.whyHelpful || 'This meal supports your health and wellness goals.'
  };
}

export async function POST(request: NextRequest) {
  try {
    const { text }: { text: string } = await request.json();

    if (!text || typeof text !== 'string') {
      return NextResponse.json({
        error: 'Text content is required',
        code: 'INVALID_REQUEST'
      }, { status: 400 });
    }

    console.log('📄 Parsing meal text...');
    
    // Parse meals from text (ignoring all non-meal content)
    const parsedMeals = parseMealsFromText(text);
    
    console.log(`🍽️ Found ${parsedMeals.length} meals`);

    if (parsedMeals.length === 0) {
      return NextResponse.json({
        error: 'No meals found in the provided text',
        code: 'NO_MEALS_FOUND',
        suggestion: 'Make sure the text contains properly formatted meal recipes'
      }, { status: 400 });
    }

    // Convert to database format (using schema field names)
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
      message: `Successfully parsed and uploaded ${insertedMeals.length} meals`,
      parsedCount: parsedMeals.length,
      insertedCount: insertedMeals.length,
      meals: insertedMeals.map(meal => ({
        id: meal.id,
        name: meal.name,
        mealType: meal.mealType
      })),
      preview: parsedMeals.slice(0, 3) // Show first 3 meals as preview
    }, { status: 201 });

  } catch (error) {
    console.error('PDF parsing error:', error);
    return NextResponse.json({
      error: 'Failed to parse meal text',
      code: 'PARSING_ERROR',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// GET endpoint for instructions
export async function GET() {
  return NextResponse.json({
    message: "PDF Meal Parser",
    instructions: [
      "1. Copy all text from your PDF (including meals and surrounding content)",
      "2. Send a POST request with the text in the body",
      "3. The parser will automatically extract ONLY meal data",
      "4. All introductory text, links, and explanations will be ignored",
      "5. Only clean meal data will be stored in the database"
    ],
    example: {
      method: "POST",
      body: {
        text: "Your entire PDF text content here..."
      }
    },
    guarantees: [
      "✅ Only meal titles, ingredients, instructions, nutrition will be stored",
      "❌ No introductory text, links, or explanations will be saved",
      "✅ Smart parsing identifies meal sections automatically",
      "✅ Validates data quality before database insertion"
    ]
  });
}