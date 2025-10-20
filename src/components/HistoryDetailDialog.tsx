"use client";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import type { HistoryItem } from "@/hooks/useHistoryFeed";
import { X, ChefHat } from "lucide-react";
import { useState } from "react";

interface HistoryDetailDialogProps {
  item: HistoryItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function HistoryDetailDialog({ item, open, onOpenChange }: HistoryDetailDialogProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processResult, setProcessResult] = useState<string | null>(null);

  if (!item) return null;

  // Check for any available image (user uploaded or AI generated)
  const availableImage = item.image_url || item.ai_generated_image || item.generated_image_url;
  const hasImage = availableImage && availableImage.trim() !== '';

  // Check if this looks like a recipe
  const looksLikeRecipe = item.type === 'recipe' || 
    item.ai_response?.toLowerCase().includes('ingredients:') ||
    item.ai_response?.toLowerCase().includes('instructions:');

  // Check if image is user-uploaded (should NOT be processed)
  const hasUserUploadedImage = item.image_url && 
    (item.image_url.includes('data:image/jpeg') || 
     item.image_url.includes('data:image/jpg') || 
     (item.image_url.startsWith('data:image/') && item.image_url.length < 100000));

  // Only show button for recipes WITHOUT user images
  const shouldShowProcessButton = looksLikeRecipe && !hasUserUploadedImage;

  const handleProcessForLibrary = async () => {
    setIsProcessing(true);
    setProcessResult(null);
    
    try {
      const response = await fetch('/api/meals/library/process-history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ itemId: item.id }),
      });
      
      const result = await response.json();
      
      if (result.success && result.recipes > 0) {
        setProcessResult('✅ Recipe added to meals library!');
      } else {
        setProcessResult('ℹ️ This item was not identified as a recipe');
      }
    } catch (error) {
      setProcessResult('❌ Failed to process item');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-7xl !w-[96vw] max-h-[90vh] overflow-hidden p-0 flex flex-col" showCloseButton={false}>
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-gray-200 flex-shrink-0" style={{ backgroundColor: 'rgb(209, 222, 38)' }}>
          <div className="flex-1 pr-8">
            <DialogTitle
              className="text-2xl mb-2"
              style={{
                fontFamily: '"Right Grotesk Wide", sans-serif',
                fontWeight: 600
              }}>
              {item.title}
            </DialogTitle>
            <span
              className="px-2 py-1 rounded text-xs inline-block"
              style={{
                fontFamily: '"General Sans", sans-serif',
                backgroundColor: 'rgb(254, 243, 199)',
                color: 'rgb(146, 64, 14)'
              }}>
              {item.type.replace('_', ' ')}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {shouldShowProcessButton && (
              <button
                onClick={handleProcessForLibrary}
                disabled={isProcessing}
                className="flex items-center gap-1 px-3 py-1 bg-white/20 hover:bg-white/30 rounded-lg text-sm transition-colors disabled:opacity-50"
                title="Add to Meals Library">
                <ChefHat className="w-4 h-4" />
                {isProcessing ? 'Processing...' : 'Add to Library'}
              </button>
            )}
            {looksLikeRecipe && hasUserUploadedImage && (
              <span className="text-xs text-white/70 bg-red-500/20 px-2 py-1 rounded">
                Recipe with user image - cannot process
              </span>
            )}
            <button
              onClick={() => onOpenChange(false)}
              className="text-gray-400 hover:text-gray-600 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="flex flex-1 min-h-0">
          {/* Left Column - Scrollable Image */}
          <div className="w-1/2 p-6 bg-gray-50 overflow-auto">
            {hasImage ? (
              <div className="w-full rounded-[20px] overflow-hidden shadow-lg">
                <img
                  src={availableImage}
                  alt={item.title}
                  className="w-full h-auto object-cover" />
              </div>
            ) : (
              <div className="w-full max-w-md h-[400px] bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-[20px] flex flex-col items-center justify-center gap-3 shadow-lg">
                <p
                  style={{
                    fontFamily: '"General Sans", sans-serif',
                    fontSize: '16px',
                    color: 'white',
                    opacity: 0.9
                  }}>
                  Image is not available
                </p>
              </div>
            )}
          </div>

          {/* Right Column - Scrollable Conversation */}
          <div className="w-1/2 flex flex-col min-h-0" style={{ backgroundColor: 'rgb(247, 248, 212)' }}>
            <div className="flex-1 overflow-y-auto scrollbar-hide p-6 space-y-6 min-h-0">
              {/* Conversation Section */}
              <div className="space-y-4">
                <h3
                  style={{
                    fontFamily: '"Right Grotesk Wide", sans-serif',
                    fontWeight: 600,
                    fontSize: '18px',
                    color: 'rgb(39, 39, 42)'
                  }}>
                  Conversation Details
                </h3>
                <div
                  className="prose prose-sm max-w-none whitespace-pre-wrap"
                  style={{
                    fontFamily: '"General Sans", sans-serif',
                    fontSize: '15px',
                    lineHeight: '24px',
                    color: 'rgb(39, 39, 42)'
                  }}>
                  {item.ai_response || item.description}
                </div>
              </div>

              {/* Process Result */}
              {processResult && (
                <div className="p-3 bg-gray-100 rounded-lg">
                  <p style={{
                    fontFamily: '"General Sans", sans-serif',
                    fontSize: '14px',
                    color: 'rgb(39, 39, 42)'
                  }}>
                    {processResult}
                  </p>
                </div>
              )}

              {/* Timestamp */}
              <div className="pt-4 border-t border-gray-200">
                <p
                  style={{
                    fontFamily: '"General Sans", sans-serif',
                    fontSize: '13px',
                    color: 'rgb(163, 163, 163)'
                  }}>
                  Created: {new Date(item.timestamp).toLocaleString("en-GB", {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false
                  })}
                </p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>);

}