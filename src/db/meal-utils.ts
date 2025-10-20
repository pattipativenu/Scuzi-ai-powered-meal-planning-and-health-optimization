import { db } from './postgres-connection';
import { meals, ingredients, mealIngredients, tags, mealTags } from './postgres-schema';
import { eq, and, inArray } from 'drizzle-orm';

export interface MealData {
  meal_id: string;
  meal_name: string;
  tagline?: string;
  prep_time?: string;
  meal_type: string;
  tags?: string[];
  ingredients: {
    serving_size: string;
    list: Array<{
      item: string;
      quantity: string;
      optional?: boolean;
      notes?: string;
    }>;
  };
  method: string[];
  nutrition: {
    serving_unit: string;
    summary?: string;
    details: Record<string, string>;
  };
  why_this_meal?: string;
  image_url?: string;
}

export async function insertMeal(mealData: MealData) {
  return await db.transaction(async (tx) => {
    // Insert the main meal record
    const [insertedMeal] = await tx.insert(meals).values({
      mealId: mealData.meal_id,
      mealName: mealData.meal_name,
      tagline: mealData.tagline,
      prepTime: mealData.prep_time,
      mealType: mealData.meal_type,
      tags: mealData.tags || [],
      servingSize: mealData.ingredients.serving_size,
      ingredients: mealData.ingredients.list,
      method: mealData.method,
      nutritionSummary: mealData.nutrition.summary,
      nutritionDetails: mealData.nutrition.details,
      whyThisMeal: mealData.why_this_meal,
      imageUrl: mealData.image_url,
    }).returning();

    // Process ingredients
    for (const ingredient of mealData.ingredients.list) {
      // Insert or get ingredient
      let ingredientRecord = await tx.select().from(ingredients).where(eq(ingredients.name, ingredient.item)).limit(1);
      
      if (ingredientRecord.length === 0) {
        const [newIngredient] = await tx.insert(ingredients).values({
          name: ingredient.item,
          category: categorizeIngredient(ingredient.item), // Helper function to categorize
        }).returning();
        ingredientRecord = [newIngredient];
      }

      // Link meal to ingredient
      await tx.insert(mealIngredients).values({
        mealId: insertedMeal.id,
        ingredientId: ingredientRecord[0].id,
        quantity: ingredient.quantity,
        isOptional: ingredient.optional ? 1 : 0,
        notes: ingredient.notes,
      });
    }

    // Process tags
    if (mealData.tags && mealData.tags.length > 0) {
      for (const tagName of mealData.tags) {
        // Insert or get tag
        let tagRecord = await tx.select().from(tags).where(eq(tags.name, tagName)).limit(1);
        
        if (tagRecord.length === 0) {
          const [newTag] = await tx.insert(tags).values({
            name: tagName,
            category: categorizeTag(tagName), // Helper function to categorize
          }).returning();
          tagRecord = [newTag];
        }

        // Link meal to tag
        await tx.insert(mealTags).values({
          mealId: insertedMeal.id,
          tagId: tagRecord[0].id,
        });
      }
    }

    return insertedMeal;
  });
}

export async function getMealById(mealId: string) {
  const result = await db.select().from(meals).where(eq(meals.mealId, mealId)).limit(1);
  return result[0] || null;
}

export async function getMealsByType(mealType: string) {
  return await db.select().from(meals).where(eq(meals.mealType, mealType));
}

export async function getMealsByTags(tagNames: string[]) {
  const tagRecords = await db.select().from(tags).where(inArray(tags.name, tagNames));
  const tagIds = tagRecords.map(tag => tag.id);
  
  const mealTagRecords = await db.select().from(mealTags).where(inArray(mealTags.tagId, tagIds));
  const mealIds = mealTagRecords.map(mt => mt.mealId);
  
  return await db.select().from(meals).where(inArray(meals.id, mealIds));
}

export async function searchMealsByIngredient(ingredientName: string) {
  const ingredientRecords = await db.select().from(ingredients).where(eq(ingredients.name, ingredientName));
  if (ingredientRecords.length === 0) return [];
  
  const mealIngredientRecords = await db.select().from(mealIngredients).where(eq(mealIngredients.ingredientId, ingredientRecords[0].id));
  const mealIds = mealIngredientRecords.map(mi => mi.mealId);
  
  return await db.select().from(meals).where(inArray(meals.id, mealIds));
}

// Helper function to categorize ingredients
function categorizeIngredient(ingredientName: string): string {
  const name = ingredientName.toLowerCase();
  
  if (name.includes('milk') || name.includes('yogurt') || name.includes('cheese')) return 'dairy';
  if (name.includes('chicken') || name.includes('beef') || name.includes('fish') || name.includes('egg')) return 'protein';
  if (name.includes('oats') || name.includes('rice') || name.includes('bread') || name.includes('flour')) return 'grain';
  if (name.includes('berry') || name.includes('apple') || name.includes('banana') || name.includes('fruit')) return 'fruit';
  if (name.includes('spinach') || name.includes('carrot') || name.includes('onion') || name.includes('vegetable')) return 'vegetable';
  if (name.includes('oil') || name.includes('butter') || name.includes('nuts') || name.includes('seeds')) return 'fat';
  if (name.includes('salt') || name.includes('pepper') || name.includes('spice') || name.includes('herb')) return 'seasoning';
  
  return 'other';
}

// Helper function to categorize tags
function categorizeTag(tagName: string): string {
  const name = tagName.toLowerCase();
  
  if (name.includes('recovery') || name.includes('energy') || name.includes('performance')) return 'performance';
  if (name.includes('protein') || name.includes('carb') || name.includes('fat') || name.includes('fiber')) return 'nutrition';
  if (name.includes('quick') || name.includes('easy') || name.includes('prep')) return 'preparation';
  if (name.includes('vegetarian') || name.includes('vegan') || name.includes('gluten')) return 'dietary';
  
  return 'general';
}