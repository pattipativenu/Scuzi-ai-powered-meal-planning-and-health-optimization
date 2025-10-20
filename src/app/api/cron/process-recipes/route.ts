import { NextRequest, NextResponse } from 'next/server';
import { processHistoryForRecipes } from '@/lib/history-recipe-processor';

// This endpoint can be called by a cron job service (like Vercel Cron or external cron)
export async function GET(request: NextRequest) {
  try {
    // Verify this is a legitimate cron request (optional security)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET || 'default-secret';
    
    if (authHeader !== `Bearer ${cronSecret}`) {
      console.log('[CRON] Unauthorized cron request');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    console.log('[CRON] Starting scheduled recipe processing...');
    
    // Process up to 100 items per cron run
    const result = await processHistoryForRecipes(100);
    
    console.log('[CRON] Scheduled processing completed:', result);
    
    return NextResponse.json({
      success: true,
      message: 'Scheduled recipe processing completed',
      timestamp: new Date().toISOString(),
      ...result
    });
    
  } catch (error) {
    console.error('[CRON] Error in scheduled processing:', error);
    return NextResponse.json({
      success: false,
      error: 'Scheduled processing failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  // Allow POST requests too for flexibility
  return GET(request);
}