"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import ScuziChat from "@/components/ScuziChat";

export default function ChatPage() {
  const router = useRouter();

  return (
    <div className="h-screen flex flex-col">
      {/* Back Arrow - Desktop/Tablet only */}
      <div className="hidden md:block absolute top-24 left-6 z-50">
        <button
          onClick={() => router.back()}
          className="w-10 h-10 rounded-full bg-white/90 hover:bg-white shadow-lg flex items-center justify-center transition-all hover:scale-110"
          aria-label="Go back"
          style={{
            fontFamily: '"Right Grotesk Wide", sans-serif'
          }}
        >
          <ArrowLeft className="w-5 h-5" style={{ color: "rgb(39, 39, 42)" }} />
        </button>
      </div>

      {/* Full-screen Chat */}
      <div className="flex-1">
        <ScuziChat />
      </div>
    </div>
  );
}