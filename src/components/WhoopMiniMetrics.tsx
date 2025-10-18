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

  return (
    <motion.div
      className="flex items-center gap-2"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      {metrics.map((metric, index) => {
        const isPositive = metric.data.status === "positive";
        const textColor = isPositive ? "#16A34A" : "#DC2626";
        const arrow = isPositive ? "▲" : "▼";

        return (
          <motion.div
            key={metric.label}
            className="flex items-center gap-1 px-3 py-1 rounded-full bg-gray-100"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: index * 0.05, ease: "easeOut" }}
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
          </motion.div>
        );
      })}
    </motion.div>
  );
}