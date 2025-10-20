"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import { FloatingAskScuzi } from "@/components/FloatingAskScuzi";
import type { HistoryItem } from "@/hooks/useHistoryFeed";

export default function HistoryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [item, setItem] = useState<HistoryItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistoryItem = async () => {
      try {
        const response = await fetch('/api/history');
        const history = await response.json();
        const foundItem = history.find((h: HistoryItem) => h.id === params.id);
        setItem(foundItem || null);
      } catch (error) {
        console.error('Error fetching history item:', error);
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchHistoryItem();
    }
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-xl font-semibold mb-4">Item not found</h1>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-gray-100 rounded-lg">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // Check for any available image
  const availableImage = item.image_url || item.ai_generated_image || item.generated_image_url;
  const hasImage = availableImage && availableImage.trim() !== '';

  return (
    <>
      <div className="min-h-screen bg-white pb-20">
        {/* Header with back button */}
        <div 
          className="sticky top-0 z-40 bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3"
          style={{ backgroundColor: 'rgb(209, 222, 38)' }}>
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 
              className="text-lg font-semibold truncate"
              style={{
                fontFamily: '"Right Grotesk Wide", sans-serif',
                fontWeight: 600
              }}>
              {item.title}
            </h1>
            <span
              className="px-2 py-1 rounded text-xs inline-block mt-1"
              style={{
                fontFamily: '"General Sans", sans-serif',
                backgroundColor: 'rgb(254, 243, 199)',
                color: 'rgb(146, 64, 14)'
              }}>
              {item.type.replace('_', ' ')}
            </span>
          </div>
        </div>

        {/* Image Section - Full width at top with smart handling */}
        <div className="w-full">
          {hasImage ? (
            <div className="relative w-full h-[300px] md:h-[400px] overflow-hidden bg-gray-50">
              {/* Blurred background image */}
              <div 
                className="absolute inset-0 bg-cover bg-center filter blur-lg scale-110"
                style={{ backgroundImage: `url(${availableImage})` }}
              />
              {/* Overlay to darken background */}
              <div className="absolute inset-0 bg-black/20" />
              {/* Main image - properly fitted */}
              <div className="relative w-full h-full flex items-center justify-center p-4">
                <img
                  src={availableImage}
                  alt={item.title}
                  className="max-w-full max-h-full object-contain rounded-lg shadow-lg" />
              </div>
            </div>
          ) : (
            <div className="w-full h-[250px] bg-gradient-to-br from-yellow-400 to-yellow-600 flex flex-col items-center justify-center gap-3">
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

        {/* Conversation Section - Scrollable content */}
        <div className="px-4 py-6 space-y-6">
          <div className="space-y-4">
            <h2
              style={{
                fontFamily: '"Right Grotesk Wide", sans-serif',
                fontWeight: 600,
                fontSize: '18px',
                color: 'rgb(39, 39, 42)'
              }}>
              Conversation Details
            </h2>
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

      {/* Floating Ask Scuzi Component */}
      <FloatingAskScuzi />
    </>
  );
}