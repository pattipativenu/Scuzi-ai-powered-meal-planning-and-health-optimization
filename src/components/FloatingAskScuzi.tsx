"use client";

import { useRouter, usePathname } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";

export function FloatingAskScuzi() {
  const router = useRouter();
  const pathname = usePathname();
  const [subtextIndex, setSubtextIndex] = useState(0);

  const subtexts = [
    "Have leftovers? I can make a meal.",
    "Want to know nutrition of your meal? Let me know.",
    "Need a meal plan? I can do that.",
    "Worried about your food or have a doubt about your food? Ask me.",
  ];

  // Only show on Home, Plan Ahead, and Pantry pages
  const shouldShow = pathname === '/' || pathname === '/plan-ahead' || pathname === '/pantry';

  // Rotate subtext every 3 seconds
  useEffect(() => {
    if (!shouldShow) return;
    
    const interval = setInterval(() => {
      setSubtextIndex((prev) => (prev + 1) % subtexts.length);
    }, 3500);
    return () => clearInterval(interval);
  }, [shouldShow]);

  const handleClick = () => {
    router.push("/chat");
  };

  if (!shouldShow) return null;

  return (
    <motion.div
      className="md:hidden fixed bottom-[84px] left-0 right-0 z-40 flex justify-center px-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut", delay: 0.2 }}
    >
      <button
        onClick={handleClick}
        className="w-full max-w-md h-14 rounded-xl shadow-lg hover:shadow-xl transition-all active:scale-[0.98] flex items-center justify-center backdrop-blur-md"
        style={{
          background: "rgba(0, 0, 0, 0.75)",
        }}
      >
        <div className="text-center">
          <AnimatePresence mode="wait">
            <motion.span
              key={subtextIndex}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              style={{
                fontFamily: '"General Sans", sans-serif',
                fontSize: "15px",
                fontWeight: 500,
                color: "white",
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