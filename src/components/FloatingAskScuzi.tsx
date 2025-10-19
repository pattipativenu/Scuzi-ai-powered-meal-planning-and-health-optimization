"use client";

import { useRouter } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";

export function FloatingAskScuzi() {
  const router = useRouter();
  const [subtextIndex, setSubtextIndex] = useState(0);

  const subtexts = [
    "Turn leftovers into meals",
    "Convert your food prep to nutrition insights",
    "Find recipes from what's in your fridge",
    "Optimize your meals with WHOOP data",
  ];

  // Rotate subtext every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setSubtextIndex((prev) => (prev + 1) % subtexts.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleClick = () => {
    router.push("/chat");
  };

  return (
    <motion.div
      className="md:hidden fixed left-1/2 z-40 w-[90%] max-w-md"
      style={{ 
        bottom: "84px",
        transform: "translateX(-50%)"
      }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut", delay: 0.2 }}
    >
      <button
        onClick={handleClick}
        className="w-full h-14 rounded-xl shadow-lg hover:shadow-xl transition-all active:scale-98 flex flex-col items-center justify-center gap-0.5 backdrop-blur-md"
        style={{
          background: "rgba(0, 0, 0, 0.7)",
        }}
      >
        <div className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-white" />
          <span
            style={{
              fontFamily: '"Right Grotesk Wide", sans-serif',
              fontSize: "16px",
              fontWeight: 600,
              color: "white",
            }}
          >
            💬 Ask Scuzi anything…
          </span>
        </div>
        <div className="h-4 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.span
              key={subtextIndex}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              style={{
                fontFamily: '"General Sans", sans-serif',
                fontSize: "11px",
                fontWeight: 400,
                color: "rgba(255, 255, 255, 0.7)",
              }}
            >
              {subtexts[subtextIndex]}
            </motion.span>
          </AnimatePresence>
        </div>
      </button>
    </motion.div>
  );
}