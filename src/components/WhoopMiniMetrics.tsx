"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface WhoopMetric {
  label: string;
  value: string;
  status: "good" | "moderate" | "bad";
}

export function WhoopMiniMetrics() {
  const [metrics, setMetrics] = useState<WhoopMetric[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchWhoopData();
  }, []);

  const getRecoveryStatus = (value: number): "good" | "moderate" | "bad" => {
    if (value >= 67) return "good";
    if (value >= 34) return "moderate";
    return "bad";
  };

  const getHRStatus = (value: number): "good" | "moderate" | "bad" => {
    if (value <= 60) return "good";
    if (value <= 70) return "moderate";
    return "bad";
  };

  const getOxygenStatus = (value: number): "good" | "moderate" | "bad" => {
    if (value >= 95) return "good";
    if (value >= 90) return "moderate";
    return "bad";
  };

  const getStrainStatus = (value: number): "good" | "moderate" | "bad" => {
    if (value >= 14) return "good";
    if (value >= 10) return "moderate";
    return "bad";
  };

  const getSleepPerformanceStatus = (value: number): "good" | "moderate" | "bad" => {
    if (value >= 85) return "good";
    if (value >= 70) return "moderate";
    return "bad";
  };

  const getSleepDebtStatus = (value: number): "good" | "moderate" | "bad" => {
    if (value <= 60) return "good";
    if (value <= 120) return "moderate";
    return "bad";
  };

  const fetchWhoopData = async () => {
    try {
      const response = await fetch("/api/whoop/historical-data?limit=10");
      const data = await response.json();

      if (data.status === "success" && data.data.length > 0) {
        // Find October 17th data
        const oct17Data = data.data.find((record: any) => {
          const cycleDate = new Date(record.cycle_start_time);
          return cycleDate.getDate() === 17 && cycleDate.getMonth() === 9; // October is month 9
        });

        const latest = oct17Data || data.data[0];
        const calculatedMetrics: WhoopMetric[] = [];

        // Recovery Score
        if (latest.recovery_score_percent !== null) {
          calculatedMetrics.push({
            label: "Recovery",
            value: `${Math.round(latest.recovery_score_percent)}%`,
            status: getRecoveryStatus(latest.recovery_score_percent),
          });
        }

        // Resting Heart Rate
        if (latest.resting_heart_rate_bpm !== null) {
          calculatedMetrics.push({
            label: "Resting HR",
            value: `${Math.round(latest.resting_heart_rate_bpm)} bpm`,
            status: getHRStatus(latest.resting_heart_rate_bpm),
          });
        }

        // Body Oxygen
        if (latest.blood_oxygen_percent !== null) {
          calculatedMetrics.push({
            label: "Blood O₂",
            value: `${Math.round(latest.blood_oxygen_percent)}%`,
            status: getOxygenStatus(latest.blood_oxygen_percent),
          });
        }

        // Daily Strain
        if (latest.day_strain !== null) {
          calculatedMetrics.push({
            label: "Strain",
            value: parseFloat(latest.day_strain).toFixed(1),
            status: getStrainStatus(parseFloat(latest.day_strain)),
          });
        }

        // Energy Burned (Calories)
        if (latest.energy_burned_cal !== null) {
          calculatedMetrics.push({
            label: "Calories",
            value: `${Math.round(latest.energy_burned_cal)} kcal`,
            status: latest.energy_burned_cal >= 2500 ? "good" : latest.energy_burned_cal >= 2000 ? "moderate" : "bad",
          });
        }

        // Max Heart Rate
        if (latest.max_hr_bpm !== null) {
          calculatedMetrics.push({
            label: "Max HR",
            value: `${Math.round(latest.max_hr_bpm)} bpm`,
            status: latest.max_hr_bpm >= 160 ? "good" : latest.max_hr_bpm >= 140 ? "moderate" : "bad",
          });
        }

        // Average Heart Rate
        if (latest.average_hr_bpm !== null) {
          calculatedMetrics.push({
            label: "Avg HR",
            value: `${Math.round(latest.average_hr_bpm)} bpm`,
            status: latest.average_hr_bpm <= 75 ? "good" : latest.average_hr_bpm <= 85 ? "moderate" : "bad",
          });
        }

        // Sleep Performance
        if (latest.sleep_performance_percent !== null) {
          calculatedMetrics.push({
            label: "Sleep Quality",
            value: `${Math.round(latest.sleep_performance_percent)}%`,
            status: getSleepPerformanceStatus(latest.sleep_performance_percent),
          });
        }

        // Sleep Debt
        if (latest.sleep_debt_min !== null) {
          const sleepDebtHours = (latest.sleep_debt_min / 60).toFixed(1);
          calculatedMetrics.push({
            label: "Sleep Debt",
            value: `${sleepDebtHours}h`,
            status: getSleepDebtStatus(latest.sleep_debt_min),
          });
        }

        setMetrics(calculatedMetrics);
      }
    } catch (error) {
      console.error("Error fetching WHOOP data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Duplicate metrics 3 times for seamless infinite scroll
  const scrollingMetrics = [...metrics, ...metrics, ...metrics];

  const getStatusColor = (status: "good" | "moderate" | "bad") => {
    switch (status) {
      case "good":
        return "#16A34A"; // Green
      case "moderate":
        return "#F97316"; // Orange
      case "bad":
        return "#DC2626"; // Red
    }
  };

  const getStatusArrow = (status: "good" | "moderate" | "bad") => {
    switch (status) {
      case "good":
        return "▲";
      case "moderate":
        return "▶"; // Right arrow for moderate
      case "bad":
        return "▼";
    }
  };

  if (isLoading) {
    return (
      <div className="overflow-hidden max-w-full">
        <div className="flex items-center gap-2 px-3 py-1">
          <span
            style={{
              fontFamily: '"Right Grotesk Wide", sans-serif',
              fontWeight: 500,
              fontSize: "14px",
              color: "rgb(107, 114, 128)",
            }}
          >
            Loading WHOOP data...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden max-w-full">
      <motion.div
        className="flex items-center gap-2 animate-scroll-rtl"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        {scrollingMetrics.map((metric, index) => {
          const color = getStatusColor(metric.status);
          const arrow = getStatusArrow(metric.status);

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
                  color: color,
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