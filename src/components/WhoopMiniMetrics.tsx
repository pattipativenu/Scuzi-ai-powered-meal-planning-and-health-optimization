"use client";

import { motion } from "framer-motion";

export function WhoopMiniMetrics() {
  // Mock data from CSV until AWS is fully connected
  const mockMetrics = [
    { label: "Recovery", value: "+3%", status: "positive" },
    { label: "Heart Rate", value: "-2 bpm", status: "negative" },
    { label: "Sleep", value: "+0.5h", status: "positive" },
    { label: "Strain", value: "+0.6", status: "positive" },
    { label: "Calories", value: "+150 cal", status: "positive" },
    { label: "HRV", value: "+3 ms", status: "positive" },
  ];

  // Duplicate metrics 3 times for seamless infinite scroll
  const scrollingMetrics = [...mockMetrics, ...mockMetrics, ...mockMetrics];

  return (
    <div className="overflow-hidden max-w-full">
      <motion.div
        className="flex items-center gap-2 animate-scroll-rtl"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        {scrollingMetrics.map((metric, index) => {
          const isPositive = metric.status === "positive";
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
                {arrow} {metric.value}
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