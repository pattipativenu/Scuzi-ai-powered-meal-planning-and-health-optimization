"use client";

import ScuziChat from "@/components/ScuziChat";

export default function ChatPage() {
  return (
    <div className="h-screen flex flex-col">
      {/* Full-screen Chat */}
      <div className="flex-1">
        <ScuziChat />
      </div>
    </div>
  );
}