"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { successMessages } from "@/config/whoop-advice";

interface HealthInsightsLoaderProps {
  insights: string[];
  progress: number;
  totalMeals?: number;
  isComplete?: boolean;
}

export function HealthInsightsLoader({
  insights,
  progress,
  totalMeals = 28,
  isComplete = false,
}: HealthInsightsLoaderProps) {
  const [currentInsightIndex, setCurrentInsightIndex] = useState(0);
  const [displayedInsight, setDisplayedInsight] = useState(insights[0] || "");

  // Rotate insights every 4 seconds
  useEffect(() => {
    if (isComplete || insights.length === 0) return;

    const interval = setInterval(() => {
      setCurrentInsightIndex((prev) => (prev + 1) % insights.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [insights.length, isComplete]);

  // Update displayed insight when index changes
  useEffect(() => {
    if (insights[currentInsightIndex]) {
      setDisplayedInsight(insights[currentInsightIndex]);
    }
  }, [currentInsightIndex, insights]);

  // Success state
  if (isComplete) {
    const successMessage =
      successMessages[Math.floor(Math.random() * successMessages.length)];

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="bg-white border border-border rounded-lg p-8 mb-8 text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
        >
          <Sparkles className="w-16 h-16 mx-auto mb-4 text-green-600" />
        </motion.div>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-xl font-medium"
          style={{
            fontFamily: '"General Sans", sans-serif',
            fontWeight: 500,
            color: "rgb(17, 24, 39)",
          }}
        >
          {successMessage}
        </motion.p>
      </motion.div>
    );
  }

  // Loading state with rotating insights
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border border-border rounded-lg p-8 mb-8 text-center"
    >
      {/* Pulsing Loader */}
      <motion.div
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.8, 1, 0.8],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="mb-6"
      >
        <Loader2 className="w-12 h-12 animate-spin mx-auto text-primary" />
      </motion.div>

      {/* Rotating Health Advice */}
      <div className="min-h-[60px] mb-4">
        <AnimatePresence mode="wait">
          <motion.p
            key={currentInsightIndex}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.5 }}
            className="text-lg"
            style={{
              fontFamily: '"General Sans", sans-serif',
              fontWeight: 500,
              fontSize: "18px",
              color: "rgb(17, 24, 39)",
              lineHeight: "1.6",
            }}
          >
            {displayedInsight}
          </motion.p>
        </AnimatePresence>
      </div>

      {/* Meal Generation Progress */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="mt-6"
      >
        <p
          className="text-base mb-3"
          style={{
            fontFamily: '"General Sans", sans-serif',
            fontWeight: 700,
            fontSize: "16px",
            color: "rgb(39, 39, 42)",
          }}
        >
          🍳 Generating meals… {progress} / {totalMeals} completed
        </p>

        {/* Progress Bar */}
        <div className="w-full max-w-md mx-auto h-2 bg-gray-200 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-green-500 to-green-600"
            initial={{ width: 0 }}
            animate={{ width: `${(progress / totalMeals) * 100}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
      </motion.div>

      {/* Subtitle */}
      <p
        className="text-sm mt-4"
        style={{
          fontFamily: '"General Sans", sans-serif',
          color: "rgb(107, 114, 128)",
        }}
      >
        This may take a few minutes as we create your personalized meal plan...
      </p>
    </motion.div>
  );
}