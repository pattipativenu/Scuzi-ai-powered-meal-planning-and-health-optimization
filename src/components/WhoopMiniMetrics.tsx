"use client";

import { motion } from "framer-motion";
import { useWhoopSummary } from "@/hooks/useWhoopSummary";

export function WhoopMiniMetrics() {
  const { data, isLoading } = useWhoopSummary();

  if (isLoading || !data) {
    return null;
  }

  const metrics = [
    { label: "Recovery", data: data.recovery },
    { label: "Strain", data: data.strain },
    { label: "Sleep", data: data.sleep },
    { label: "HRV", data: data.hrv },
    { label: "Calories", data: data.calories },
  ];

  // Duplicate metrics 3 times for seamless infinite scroll
  const scrollingMetrics = [...metrics, ...metrics, ...metrics];

  return (
    <div className="overflow-hidden max-w-full">
      <motion.div
        className="flex items-center gap-2 animate-scroll-rtl"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        {scrollingMetrics.map((metric, index) => {
          const isPositive = metric.data.status === "positive";
          const textColor = isPositive ? "#16A34A" : "#DC2626";
          const arrow = isPositive ? "▲" : "▼";

          return (
            <div
              key={`${metric.label}-${index}`}
              className="flex items-center gap-1 px-3 py-1 rounded-full bg-gray-100 whitespace-nowrap flex-shrink-0"
            >
              <span
                style={{
                  fontFamily: '"Right Grotesk Wide", sans-serif',
                  fontWeight: 500,
                  fontSize: "14px",
                  lineHeight: "20px",
                  color: textColor,
                }}
              >
                {arrow} {metric.data.value}
              </span>
              <span
                style={{
                  fontFamily: '"Right Grotesk Wide", sans-serif',
                  fontWeight: 500,
                  fontSize: "14px",
                  lineHeight: "20px",
                  color: "rgb(107, 114, 128)",
                }}
              >
                {metric.label}
              </span>
            </div>
          );
        })}
      </motion.div>
    </div>
  );
}