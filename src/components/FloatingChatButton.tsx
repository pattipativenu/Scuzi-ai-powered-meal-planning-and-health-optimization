"use client";

import { useState } from "react";
import { MessageCircle, X } from "lucide-react";
import { useRouter } from "next/navigation";

export function FloatingChatButton() {
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(true);

  const handleChatClick = () => {
    router.push('/chat');
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-20 right-4 z-50 md:bottom-6">
      <button
        onClick={handleChatClick}
        className="bg-[rgb(209,222,38)] hover:bg-[rgb(209,222,38)]/90 text-[rgb(39,39,42)] rounded-full p-4 shadow-lg transition-all duration-200 hover:scale-105"
        style={{
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)'
        }}>
        <MessageCircle className="w-6 h-6" />
      </button>
    </div>
  );
}