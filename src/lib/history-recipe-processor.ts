import { dynamoDb, HISTORY_TABLE_NAME } from "@/lib/dynamodb-config";
import { ScanCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { processAIGeneratedMeal, uploadImageToS3 } from "@/lib/meal-library-utils";

interface HistoryItem {
  id: string;
  type: string;
  title: string;
  description: string;
  ai_response: string;
  image_url?: string;
  timestamp: number;
  processed_for_library?: boolean; // Flag to track if we've processed this item
}

/**
 * Advanced recipe detection logic - more sophisticated than the basic chat detection
 */
function isGenuineRecipe(historyItem: HistoryItem): boolean {
  const { type, ai_response, title } = historyItem;
  
  // First check: explicit type is recipe
  if (type === "recipe") {
    console.log('[HISTORY PROCESSOR] Item marked as recipe type');
    return true;
  }
  
  const lowerResponse = ai_response.toLowerCase();
  const lowerTitle = title.toLowerCase();
  
  // Recipe structure indicators (must have multiple)
  const structureIndicators = [
    lowerResponse.includes("ingredients:") || lowerResponse.includes("**ingredients:**"),
    lowerResponse.includes("instructions:") || lowerResponse.includes("step-by-step") || lowerResponse.includes("directions:"),
    lowerResponse.includes("servings:") || lowerResponse.includes("serves ") || lowerResponse.includes("portions"),
    lowerResponse.includes("prep time") || lowerResponse.includes("cook time") || lowerResponse.includes("total time"),
    lowerResponse.includes("nutrition") && (lowerResponse.includes("calories") || lowerResponse.includes("protein")),
    lowerResponse.includes("🥘") || lowerResponse.includes("⏱️") || lowerResponse.includes("🍽️")
  ];
  
  const structureScore = structureIndicators.filter(Boolean).length;
  
  // Recipe content indicators
  const contentIndicators = [
    /\b\d+\s*(cups?|tbsp|tsp|oz|lbs?|grams?|ml|liters?)\b/i.test(ai_response), // Measurements
    /\b(bake|fry|sauté|grill|roast|boil|simmer|mix|stir|chop|dice|slice)\b/i.test(ai_response), // Cooking verbs
    /\b(salt|pepper|oil|onion|garlic|chicken|beef|rice|pasta|flour|sugar)\b/i.test(ai_response), // Common ingredients
    /\b(oven|pan|pot|bowl|skillet|heat|temperature|degrees?|°[CF])\b/i.test(ai_response), // Cooking equipment/terms
  ];
  
  const contentScore = contentIndicators.filter(Boolean).length;
  
  // Exclusion indicators (things that suggest it's NOT a recipe)
  const exclusionIndicators = [
    lowerResponse.includes("i can't") || lowerResponse.includes("i cannot"),
    lowerResponse.includes("i don't know") || lowerResponse.includes("i'm not sure"),
    lowerResponse.includes("health risk") && !lowerResponse.includes("recipe"),
    lowerResponse.includes("harmful") && !lowerResponse.includes("recipe"),
    lowerResponse.includes("analysis") && !lowerResponse.includes("recipe") && !lowerResponse.includes("ingredients"),
    lowerResponse.includes("recommendation") && !lowerResponse.includes("recipe"),
    lowerTitle.includes("analysis") && !lowerTitle.includes("recipe"),
    lowerTitle.includes("advice") && !lowerTitle.includes("recipe"),
    ai_response.length < 200, // Too short to be a proper recipe
  ];
  
  const exclusionScore = exclusionIndicators.filter(Boolean).length;
  
  // Decision logic
  const isRecipe = structureScore >= 3 && contentScore >= 2 && exclusionScore === 0;
  
  console.log('[HISTORY PROCESSOR] Recipe analysis:', {
    title: title.substring(0, 50),
    structureScore,
    contentScore,
    exclusionScore,
    isRecipe,
    length: ai_response.length
  });
  
  return isRecipe;
}

/**
 * Check if image is AI-generated (base64 data URL from Titan G1V2)
 * STRICT VALIDATION: Only accept images that are definitely from Titan G1V2
 */
function isAIGeneratedImage(imageUrl: string): boolean {
  if (!imageUrl) return false;
  
  // STRICT CHECK 1: Must be base64 data URL (Titan generates these)
  const isBase64DataUrl = imageUrl.startsWith('data:image/png;base64,');
  
  // STRICT CHECK 2: Must be very large (Titan images are typically 100KB+ in base64)
  const isLargeEnough = imageUrl.length > 100000;
  
  // STRICT CHECK 3: Must NOT be a user upload (user uploads are typically smaller and different format)
  const isNotUserUpload = !imageUrl.includes('data:image/jpeg') && !imageUrl.includes('data:image/jpg');
  
  // STRICT CHECK 4: Additional validation - Titan images have specific characteristics
  const hasTitanCharacteristics = isBase64DataUrl && isLargeEnough && isNotUserUpload;
  
  console.log('[HISTORY PROCESSOR] STRICT Image validation:', {
    hasUrl: !!imageUrl,
    isBase64PNG: isBase64DataUrl,
    length: imageUrl.length,
    isLargeEnough,
    isNotUserUpload,
    hasTitanCharacteristics,
    FINAL_DECISION: hasTitanCharacteristics
  });
  
  // ONLY return true if ALL strict checks pass
  return hasTitanCharacteristics;
}

/**
 * Process a single history item for recipe extraction
 */
async function processHistoryItemForRecipe(item: HistoryItem): Promise<boolean> {
  try {
    console.log('[HISTORY PROCESSOR] Processing item:', item.id, item.title.substring(0, 50));
    
    // Check if it's a genuine recipe
    if (!isGenuineRecipe(item)) {
      console.log('[HISTORY PROCESSOR] Not a recipe, skipping');
      return false;
    }
    
    console.log('[HISTORY PROCESSOR] Confirmed as recipe, processing...');
    
    // Extract AI-generated image if available (STRICT VALIDATION)
    let aiImageBase64: string | undefined;
    if (item.image_url && isAIGeneratedImage(item.image_url)) {
      aiImageBase64 = item.image_url.split(',')[1]; // Remove data:image/png;base64, prefix
      console.log('[HISTORY PROCESSOR] ✅ CONFIRMED AI-generated image from Titan G1V2');
    } else if (item.image_url) {
      console.log('[HISTORY PROCESSOR] ❌ REJECTED: Image is NOT from Titan G1V2 (likely user upload)');
      console.log('[HISTORY PROCESSOR] Image preview:', item.image_url.substring(0, 100));
    }
    
    // Process the recipe
    const { mealId, imageUrl } = await processAIGeneratedMeal(item.ai_response, aiImageBase64);
    
    if (mealId) {
      console.log('[HISTORY PROCESSOR] ✅ Recipe stored in library with ID:', mealId);
      
      // Mark this history item as processed
      await markHistoryItemAsProcessed(item.id);
      
      return true;
    } else {
      console.log('[HISTORY PROCESSOR] ⚠️ Failed to store recipe');
      return false;
    }
    
  } catch (error) {
    console.error('[HISTORY PROCESSOR] Error processing item:', item.id, error);
    return false;
  }
}

/**
 * Mark history item as processed to avoid reprocessing
 */
async function markHistoryItemAsProcessed(itemId: string): Promise<void> {
  try {
    const updateCommand = new UpdateCommand({
      TableName: HISTORY_TABLE_NAME,
      Key: { id: itemId },
      UpdateExpression: "SET processed_for_library = :processed",
      ExpressionAttributeValues: {
        ":processed": true,
      },
    });
    
    await dynamoDb.send(updateCommand);
    console.log('[HISTORY PROCESSOR] Marked item as processed:', itemId);
  } catch (error) {
    console.error('[HISTORY PROCESSOR] Failed to mark item as processed:', itemId, error);
  }
}

/**
 * Scan history for unprocessed recipes and add them to meals library
 */
export async function processHistoryForRecipes(limit: number = 50): Promise<{
  processed: number;
  recipes: number;
  errors: number;
}> {
  console.log('[HISTORY PROCESSOR] Starting history scan for recipes...');
  
  let processed = 0;
  let recipes = 0;
  let errors = 0;
  
  try {
    // Scan history table for unprocessed items
    const scanCommand = new ScanCommand({
      TableName: HISTORY_TABLE_NAME,
      FilterExpression: "attribute_not_exists(processed_for_library) OR processed_for_library = :false",
      ExpressionAttributeValues: {
        ":false": false,
      },
      Limit: limit,
    });
    
    const response = await dynamoDb.send(scanCommand);
    const items = response.Items as HistoryItem[];
    
    console.log('[HISTORY PROCESSOR] Found', items?.length || 0, 'unprocessed items');
    
    if (!items || items.length === 0) {
      return { processed: 0, recipes: 0, errors: 0 };
    }
    
    // Process each item
    for (const item of items) {
      try {
        processed++;
        const success = await processHistoryItemForRecipe(item);
        if (success) {
          recipes++;
        } else {
          // Mark non-recipes as processed too to avoid reprocessing
          await markHistoryItemAsProcessed(item.id);
        }
        
        // Add small delay to avoid overwhelming the system
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error('[HISTORY PROCESSOR] Error processing item:', item.id, error);
        errors++;
        
        // Still mark as processed to avoid infinite retries
        await markHistoryItemAsProcessed(item.id);
      }
    }
    
    console.log('[HISTORY PROCESSOR] Completed scan:', { processed, recipes, errors });
    return { processed, recipes, errors };
    
  } catch (error) {
    console.error('[HISTORY PROCESSOR] Fatal error during history scan:', error);
    return { processed, recipes, errors: errors + 1 };
  }
}

/**
 * Process specific history item by ID (useful for manual processing)
 */
export async function processSpecificHistoryItem(itemId: string): Promise<boolean> {
  try {
    const scanCommand = new ScanCommand({
      TableName: HISTORY_TABLE_NAME,
      FilterExpression: "id = :id",
      ExpressionAttributeValues: {
        ":id": itemId,
      },
    });
    
    const response = await dynamoDb.send(scanCommand);
    const items = response.Items as HistoryItem[];
    
    if (!items || items.length === 0) {
      console.log('[HISTORY PROCESSOR] Item not found:', itemId);
      return false;
    }
    
    return await processHistoryItemForRecipe(items[0]);
    
  } catch (error) {
    console.error('[HISTORY PROCESSOR] Error processing specific item:', itemId, error);
    return false;
  }
}