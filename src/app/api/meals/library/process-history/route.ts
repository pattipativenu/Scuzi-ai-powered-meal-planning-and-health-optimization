import { NextRequest, NextResponse } from 'next/server';
import { processHistoryForRecipes, processSpecificHistoryItem } from '@/lib/history-recipe-processor';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { itemId, limit = 50 } = body;
    
    console.log('[HISTORY API] Processing history for recipes...');
    
    if (itemId) {
      // Process specific item
      console.log('[HISTORY API] Processing specific item:', itemId);
      const success = await processSpecificHistoryItem(itemId);
      
      return NextResponse.json({
        success: true,
        message: success ? 'Item processed successfully' : 'Item was not a recipe or failed to process',
        processed: success ? 1 : 0,
        recipes: success ? 1 : 0
      });
    } else {
      // Process all unprocessed items
      console.log('[HISTORY API] Processing all unprocessed items, limit:', limit);
      const result = await processHistoryForRecipes(limit);
      
      return NextResponse.json({
        success: true,
        message: `Processed ${result.processed} items, found ${result.recipes} recipes`,
        ...result
      });
    }
    
  } catch (error) {
    console.error('[HISTORY API] Error processing history:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to process history',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    // GET endpoint for manual triggering (useful for testing)
    console.log('[HISTORY API] GET request - processing history...');
    
    const result = await processHistoryForRecipes(20); // Smaller limit for manual testing
    
    return NextResponse.json({
      success: true,
      message: `Scan completed: processed ${result.processed} items, found ${result.recipes} recipes`,
      ...result
    });
    
  } catch (error) {
    console.error('[HISTORY API] Error in GET processing:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to process history',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}