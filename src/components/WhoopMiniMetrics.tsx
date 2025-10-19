"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface WhoopMetric {
  label: string;
  value: string;
  status: "positive" | "negative";
}

export function WhoopMiniMetrics() {
  const [metrics, setMetrics] = useState<WhoopMetric[]>([
    { label: "Recovery", value: "+3%", status: "positive" },
    { label: "Heart Rate", value: "-2 bpm", status: "negative" },
    { label: "Sleep", value: "+0.5h", status: "positive" },
    { label: "Strain", value: "+0.6", status: "positive" },
  ]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchWhoopData();
  }, []);

  const fetchWhoopData = async () => {
    try {
      const response = await fetch("/api/whoop/historical-data?limit=2");
      const data = await response.json();

      if (data.status === "success" && data.data.length >= 2) {
        const latest = data.data[0];
        const previous = data.data[1];

        const calculatedMetrics: WhoopMetric[] = [];

        // Recovery
        if (latest.recovery_score_percent !== null && previous.recovery_score_percent !== null) {
          const recoveryDelta = latest.recovery_score_percent - previous.recovery_score_percent;
          calculatedMetrics.push({
            label: "Recovery",
            value: `${recoveryDelta > 0 ? "+" : ""}${recoveryDelta}%`,
            status: recoveryDelta >= 0 ? "positive" : "negative",
          });
        }

        // Heart Rate (Resting)
        if (latest.resting_heart_rate_bpm !== null && previous.resting_heart_rate_bpm !== null) {
          const hrDelta = latest.resting_heart_rate_bpm - previous.resting_heart_rate_bpm;
          calculatedMetrics.push({
            label: "Heart Rate",
            value: `${hrDelta > 0 ? "+" : ""}${hrDelta} bpm`,
            status: hrDelta <= 0 ? "positive" : "negative", // Lower HR is better
          });
        }

        // Sleep (in hours)
        if (latest.asleep_duration_min !== null && previous.asleep_duration_min !== null) {
          const sleepDeltaMin = latest.asleep_duration_min - previous.asleep_duration_min;
          const sleepDeltaHours = (sleepDeltaMin / 60).toFixed(1);
          calculatedMetrics.push({
            label: "Sleep",
            value: `${sleepDeltaMin > 0 ? "+" : ""}${sleepDeltaHours}h`,
            status: sleepDeltaMin >= 0 ? "positive" : "negative",
          });
        }

        // Strain
        if (latest.day_strain !== null && previous.day_strain !== null) {
          const strainDelta = parseFloat(latest.day_strain) - parseFloat(previous.day_strain);
          calculatedMetrics.push({
            label: "Strain",
            value: `${strainDelta > 0 ? "+" : ""}${strainDelta.toFixed(1)}`,
            status: strainDelta >= 0 ? "positive" : "negative",
          });
        }

        if (calculatedMetrics.length > 0) {
          setMetrics(calculatedMetrics);
        }
      }
    } catch (error) {
      console.error("Error fetching WHOOP data:", error);
    } finally {
      setIsLoading(false);
    }
  };

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