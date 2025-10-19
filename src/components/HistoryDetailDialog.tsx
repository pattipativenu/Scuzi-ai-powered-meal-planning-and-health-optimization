"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { HistoryItem } from "@/hooks/useHistoryFeed";
import { X } from "lucide-react";

interface HistoryDetailDialogProps {
  item: HistoryItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function HistoryDetailDialog({ item, open, onOpenChange }: HistoryDetailDialogProps) {
  if (!item) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto !w-0 !h-0">
        <DialogHeader>
          <div className="flex items-start justify-between">
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
            <button
              onClick={() => onOpenChange(false)}
              className="text-gray-400 hover:text-gray-600 transition-colors">

              <X className="w-5 h-5" />
            </button>
          </div>
        </DialogHeader>

        <div className="mt-6 space-y-6">
          {/* Image Section */}
          {item.image_url ?
          <div className="w-full rounded-[20px] overflow-hidden">
              <img
              src={item.image_url}
              alt={item.title}
              className="w-full h-auto object-cover" />

            </div> :

          <div className="w-full h-[300px] bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-[20px] flex flex-col items-center justify-center gap-3">
              <span
              style={{
                fontFamily: '"Right Grotesk Wide", sans-serif',
                fontSize: '48px',
                color: 'white',
                opacity: 0.8
              }}>

                AI
              </span>
              <p
              style={{
                fontFamily: '"General Sans", sans-serif',
                fontSize: '14px',
                color: 'white',
                opacity: 0.9
              }}>

                Image is not available
              </p>
            </div>
          }

          {/* AI Response Section */}
          <div className="space-y-4">
            <h3
              style={{
                fontFamily: '"Right Grotesk Wide", sans-serif',
                fontWeight: 600,
                fontSize: '18px',
                color: 'rgb(39, 39, 42)'
              }}>

              Full Details
            </h3>
            <div
              className="prose prose-sm max-w-none whitespace-pre-wrap"
              style={{
                fontFamily: '"General Sans", sans-serif',
                fontSize: '15px',
                lineHeight: '21px',
                color: 'rgb(39, 39, 42)'
              }}>

              {item.ai_response || item.description}
            </div>
          </div>

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
      </DialogContent>
    </Dialog>);

}