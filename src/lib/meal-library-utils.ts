import { db } from '@/db';
import { mealsLibrary } from '@/db/schema';
import { s3Client, S3_BUCKET } from '@/lib/aws-config';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';

interface ParsedRecipe {
  name: string;
  description: string;
  mealType: 'breakfast' | 'lunch' | 'snack' | 'dinner';
  prepTime: number;
  cookTime: number;
  servings: number;
  ingredients: Array<{
    name: string;
    amount: string;
    unit?: string;
    category: string;
  }>;
  instructions: string[];
  nutrition: {
    calories: number;
    protein: number;
    carbohydrates: number;
    fat: number;
    fiber: number;
    sugar: number;
    sodium: number;
  };
  tags: string[];
}

/**
 * Parse AI-generated recipe text into structured data
 */
export function parseRecipeFromText(text: string): ParsedRecipe | null {
  try {
    console.log('[RECIPE PARSER] Starting to parse recipe text...');
    console.log('[RECIPE PARSER] Text length:', text.length);
    
    // Extract dish name - try multiple patterns
    let nameMatch = text.match(/🥘\s*\*\*(.+?)\*\*/);
    if (!nameMatch) {
      // Try alternative patterns
      nameMatch = text.match(/\*\*(.+?)\*\*/) || text.match(/^(.+?)(?:\n|$)/);
    }
    if (!nameMatch) {
      console.log('[RECIPE PARSER] Could not extract dish name');
      return null;
    }
    
    const name = nameMatch[1].trim();
    console.log('[RECIPE PARSER] Extracted name:', name);
    
    // Extract time information
    const timeMatch = text.match(/⏱️\s*\*\*Time:\*\*\s*Prep:\s*(\d+)\s*min.*?Cook:\s*(\d+)\s*min/);
    const prepTime = timeMatch ? parseInt(timeMatch[1]) : 15;
    const cookTime = timeMatch ? parseInt(timeMatch[2]) : 20;
    
    // Extract servings
    const servingsMatch = text.match(/🍽️\s*\*\*Servings:\*\*\s*(\d+)/);
    const servings = servingsMatch ? parseInt(servingsMatch[1]) : 1;
    
    // Extract meal type
    const mealTypeMatch = text.match(/📊\s*\*\*Meal Type:\*\*\s*(\w+)/);
    let mealType: 'breakfast' | 'lunch' | 'snack' | 'dinner' = 'dinner';
    if (mealTypeMatch) {
      const type = mealTypeMatch[1].toLowerCase();
      if (['breakfast', 'lunch', 'snack', 'dinner'].includes(type)) {
        mealType = type as any;
      }
    }
    
    // Extract ingredients
    const ingredientsMatch = text.match(/\*\*Ingredients:\*\*([\s\S]*?)(?=\*\*Step-by-Step Instructions|\*\*Instructions)/);
    const ingredients: ParsedRecipe['ingredients'] = [];
    
    if (ingredientsMatch) {
      const ingredientLines = ingredientsMatch[1].split('\n').filter(line => line.trim().startsWith('-'));
      for (const line of ingredientLines) {
        const cleanLine = line.replace(/^-\s*/, '').trim();
        const match = cleanLine.match(/^(.+?)\s+(.+)$/);
        if (match) {
          const [, amount, ingredient] = match;
          ingredients.push({
            name: ingredient,
            amount: amount,
            category: 'cupboard' // Default category
          });
        } else {
          ingredients.push({
            name: cleanLine,
            amount: '1',
            category: 'cupboard'
          });
        }
      }
    }
    
    // Extract instructions
    const instructionsMatch = text.match(/\*\*Step-by-Step Instructions:\*\*([\s\S]*?)(?=\*\*Nutrition Table|\*\*Chef's Tip|$)/);
    const instructions: string[] = [];
    
    if (instructionsMatch) {
      const instructionLines = instructionsMatch[1].split('\n').filter(line => line.trim().match(/^\d+\./));
      for (const line of instructionLines) {
        const cleanLine = line.replace(/^\d+\.\s*/, '').trim();
        if (cleanLine) {
          instructions.push(cleanLine);
        }
      }
    }
    
    // Extract nutrition
    const nutritionMatch = text.match(/\*\*Nutrition Table.*?\*\*:([\s\S]*?)(?=\*\*Chef's Tip|$)/);
    let nutrition = {
      calories: 300,
      protein: 20,
      carbohydrates: 30,
      fat: 15,
      fiber: 5,
      sugar: 10,
      sodium: 500
    };
    
    if (nutritionMatch) {
      const nutritionText = nutritionMatch[1];
      const caloriesMatch = nutritionText.match(/Calories.*?(\d+)/);
      const proteinMatch = nutritionText.match(/Protein.*?(\d+)/);
      const carbsMatch = nutritionText.match(/Carbohydrates.*?(\d+)/);
      const fatMatch = nutritionText.match(/Fat.*?(\d+)/);
      const fiberMatch = nutritionText.match(/Fiber.*?(\d+)/);
      const sugarMatch = nutritionText.match(/Sugar.*?(\d+)/);
      const sodiumMatch = nutritionText.match(/Sodium.*?(\d+)/);
      
      if (caloriesMatch) nutrition.calories = parseInt(caloriesMatch[1]);
      if (proteinMatch) nutrition.protein = parseInt(proteinMatch[1]);
      if (carbsMatch) nutrition.carbohydrates = parseInt(carbsMatch[1]);
      if (fatMatch) nutrition.fat = parseInt(fatMatch[1]);
      if (fiberMatch) nutrition.fiber = parseInt(fiberMatch[1]);
      if (sugarMatch) nutrition.sugar = parseInt(sugarMatch[1]);
      if (sodiumMatch) nutrition.sodium = parseInt(sodiumMatch[1]);
    }
    
    // Generate tags based on content
    const tags: string[] = [];
    const lowerText = text.toLowerCase();
    
    if (nutrition.protein >= 25) tags.push('high-protein');
    if (nutrition.carbohydrates <= 20) tags.push('low-carb');
    if (nutrition.calories <= 400) tags.push('low-calorie');
    if (lowerText.includes('vegetarian') || !lowerText.includes('chicken') && !lowerText.includes('beef') && !lowerText.includes('fish')) {
      tags.push('vegetarian');
    }
    if (lowerText.includes('healthy')) tags.push('healthy');
    if (prepTime + cookTime <= 30) tags.push('quick');
    
    // Create description from first part of text
    const description = text.substring(0, 200).replace(/[#*🥘⏱️🍽️📊]/g, '').trim();
    
    return {
      name,
      description,
      mealType,
      prepTime,
      cookTime,
      servings,
      ingredients,
      instructions,
      nutrition,
      tags
    };
    
  } catch (error) {
    console.error('[RECIPE PARSER] Error parsing recipe:', error);
    return null;
  }
}

/**
 * Upload base64 image to S3 and return the URL
 * ONLY for confirmed AI-generated images from Titan G1V2
 */
export async function uploadImageToS3(base64Image: string, mealName: string): Promise<string | null> {
  try {
    // SAFETY CHECK: Ensure this is a Titan G1V2 generated image
    if (!base64Image.startsWith('data:image/png;base64,') || base64Image.length < 100000) {
      console.log('[S3] ❌ REJECTED: Image does not meet Titan G1V2 criteria');
      return null;
    }
    
    console.log('[S3] ✅ CONFIRMED: Processing Titan G1V2 image for upload');
    
    // Extract base64 data (remove data:image/png;base64, prefix)
    const base64Data = base64Image.replace(/^data:image\/png;base64,/, '');
    const imageBuffer = Buffer.from(base64Data, 'base64');
    
    // Generate unique filename
    const filename = `meals/${randomUUID()}-${mealName.toLowerCase().replace(/[^a-z0-9]/g, '-')}.png`;
    
    // Upload to S3
    const command = new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: filename,
      Body: imageBuffer,
      ContentType: 'image/png',
      ContentEncoding: 'base64'
    });
    
    await s3Client.send(command);
    
    // Return S3 URL
    const s3Url = `https://${S3_BUCKET}.s3.amazonaws.com/${filename}`;
    console.log('[S3] Image uploaded successfully:', s3Url);
    return s3Url;
    
  } catch (error) {
    console.error('[S3] Error uploading image:', error);
    return null;
  }
}

/**
 * Store parsed recipe in meals library
 */
export async function storeRecipeInLibrary(recipe: ParsedRecipe, imageUrl?: string): Promise<number | null> {
  try {
    const now = new Date().toISOString();
    
    // Add image URL to tags if available
    const tags = [...recipe.tags];
    if (imageUrl) {
      tags.push('ai-generated-image');
    }
    
    const result = await db.insert(mealsLibrary).values({
      name: recipe.name,
      description: recipe.description,
      mealType: recipe.mealType,
      prepTime: recipe.prepTime,
      cookTime: recipe.cookTime,
      servings: recipe.servings,
      ingredients: JSON.stringify(recipe.ingredients),
      instructions: JSON.stringify(recipe.instructions),
      nutrition: JSON.stringify(recipe.nutrition),
      tags: JSON.stringify(tags),
      createdAt: now
    }).returning({ id: mealsLibrary.id });
    
    const mealId = result[0]?.id;
    console.log('[MEALS LIBRARY] Recipe stored successfully:', mealId);
    return mealId;
    
  } catch (error) {
    console.error('[MEALS LIBRARY] Error storing recipe:', error);
    return null;
  }
}

/**
 * Process AI-generated recipe: parse, upload image, and store in library
 */
export async function processAIGeneratedMeal(
  recipeText: string, 
  base64Image?: string
): Promise<{ mealId: number | null; imageUrl: string | null }> {
  try {
    console.log('[MEAL PROCESSOR] Processing AI-generated meal...');
    
    // Parse the recipe
    const parsedRecipe = parseRecipeFromText(recipeText);
    if (!parsedRecipe) {
      console.log('[MEAL PROCESSOR] Could not parse recipe from text');
      return { mealId: null, imageUrl: null };
    }
    
    console.log('[MEAL PROCESSOR] Recipe parsed successfully:', parsedRecipe.name);
    
    // Upload image to S3 if provided
    let imageUrl: string | null = null;
    if (base64Image) {
      imageUrl = await uploadImageToS3(base64Image, parsedRecipe.name);
    }
    
    // Store recipe in meals library
    const mealId = await storeRecipeInLibrary(parsedRecipe, imageUrl || undefined);
    
    console.log('[MEAL PROCESSOR] Processing complete:', { mealId, imageUrl });
    return { mealId, imageUrl };
    
  } catch (error) {
    console.error('[MEAL PROCESSOR] Error processing meal:', error);
    return { mealId: null, imageUrl: null };
  }
}