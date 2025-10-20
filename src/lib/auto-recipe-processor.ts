/**
 * Auto Recipe Processor - Lightweight client-side trigger for history processing
 * This runs when users visit the home page to ensure recipes don't get missed
 */

let isProcessing = false;
let lastProcessTime = 0;
const PROCESS_INTERVAL = 5 * 60 * 1000; // 5 minutes

/**
 * Trigger history processing if enough time has passed
 */
export async function triggerHistoryProcessingIfNeeded(): Promise<void> {
  const now = Date.now();
  
  // Don't process if already processing or if we processed recently
  if (isProcessing || (now - lastProcessTime) < PROCESS_INTERVAL) {
    return;
  }
  
  isProcessing = true;
  lastProcessTime = now;
  
  try {
    console.log('[AUTO PROCESSOR] Triggering background recipe processing...');
    
    const response = await fetch('/api/meals/library/process-history', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ limit: 20 }), // Process up to 20 items
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('[AUTO PROCESSOR] Background processing completed:', result);
      
      if (result.recipes > 0) {
        console.log(`[AUTO PROCESSOR] ✅ Found and processed ${result.recipes} new recipes!`);
      }
    } else {
      console.warn('[AUTO PROCESSOR] Background processing failed:', response.status);
    }
    
  } catch (error) {
    console.error('[AUTO PROCESSOR] Error triggering background processing:', error);
  } finally {
    isProcessing = false;
  }
}

/**
 * Initialize auto processing (call this on app startup)
 */
export function initializeAutoRecipeProcessing(): void {
  // Trigger processing when the page loads
  if (typeof window !== 'undefined') {
    // Small delay to let the page load first
    setTimeout(() => {
      triggerHistoryProcessingIfNeeded();
    }, 2000);
    
    // Also trigger when the user comes back to the tab (visibility change)
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        setTimeout(() => {
          triggerHistoryProcessingIfNeeded();
        }, 1000);
      }
    });
  }
}