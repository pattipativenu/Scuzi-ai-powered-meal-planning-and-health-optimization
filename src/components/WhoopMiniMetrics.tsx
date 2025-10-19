"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface WhoopMetric {
  label: string;
  value: string;
  trend: "up" | "down" | "stable";
  changePercent?: number;
}

export function WhoopMiniMetrics() {
  const [metrics, setMetrics] = useState<WhoopMetric[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchWhoopData();
    // Refresh every 5 minutes
    const interval = setInterval(fetchWhoopData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const calculateTrend = (current: number, previous: number, isHigherBetter: boolean = true): "up" | "down" | "stable" => {
    const change = current - previous;
    const threshold = 0.02; // 2% threshold for "stable"
    
    if (Math.abs(change / previous) < threshold) return "stable";
    
    if (isHigherBetter) {
      return change > 0 ? "up" : "down";
    } else {
      return change > 0 ? "down" : "up";
    }
  };

  const fetchWhoopData = async () => {
    try {
      const response = await fetch("/api/whoop/historical-data?limit=20");
      const data = await response.json();

      if (data.status === "success" && data.data.length >= 2) {
        // Get latest two days for comparison
        const [latest, previous] = data.data;
        const calculatedMetrics: WhoopMetric[] = [];

        // Recovery Score (higher is better)
        if (latest.recovery_score_percent !== null && previous.recovery_score_percent !== null) {
          const trend = calculateTrend(latest.recovery_score_percent, previous.recovery_score_percent, true);
          calculatedMetrics.push({
            label: "Recovery",
            value: `${Math.round(latest.recovery_score_percent)}%`,
            trend,
            changePercent: ((latest.recovery_score_percent - previous.recovery_score_percent) / previous.recovery_score_percent) * 100,
          });
        }

        // Resting Heart Rate (lower is better)
        if (latest.resting_heart_rate_bpm !== null && previous.resting_heart_rate_bpm !== null) {
          const trend = calculateTrend(latest.resting_heart_rate_bpm, previous.resting_heart_rate_bpm, false);
          calculatedMetrics.push({
            label: "Resting HR",
            value: `${Math.round(latest.resting_heart_rate_bpm)} bpm`,
            trend,
            changePercent: ((latest.resting_heart_rate_bpm - previous.resting_heart_rate_bpm) / previous.resting_heart_rate_bpm) * 100,
          });
        }

        // HRV (higher is better)
        if (latest.heart_rate_variability_ms !== null && previous.heart_rate_variability_ms !== null) {
          const trend = calculateTrend(latest.heart_rate_variability_ms, previous.heart_rate_variability_ms, true);
          calculatedMetrics.push({
            label: "HRV",
            value: `${Math.round(latest.heart_rate_variability_ms)} ms`,
            trend,
            changePercent: ((latest.heart_rate_variability_ms - previous.heart_rate_variability_ms) / previous.heart_rate_variability_ms) * 100,
          });
        }

        // Blood Oxygen (higher is better)
        if (latest.blood_oxygen_percent !== null && previous.blood_oxygen_percent !== null) {
          const trend = calculateTrend(latest.blood_oxygen_percent, previous.blood_oxygen_percent, true);
          calculatedMetrics.push({
            label: "Blood O₂",
            value: `${Math.round(latest.blood_oxygen_percent)}%`,
            trend,
            changePercent: ((latest.blood_oxygen_percent - previous.blood_oxygen_percent) / previous.blood_oxygen_percent) * 100,
          });
        }

        // Daily Strain (higher is better for activity)
        if (latest.day_strain !== null && previous.day_strain !== null) {
          const trend = calculateTrend(parseFloat(latest.day_strain), parseFloat(previous.day_strain), true);
          calculatedMetrics.push({
            label: "Strain",
            value: parseFloat(latest.day_strain).toFixed(1),
            trend,
            changePercent: ((parseFloat(latest.day_strain) - parseFloat(previous.day_strain)) / parseFloat(previous.day_strain)) * 100,
          });
        }

        // Calories (higher can be better for activity days)
        if (latest.energy_burned_cal !== null && previous.energy_burned_cal !== null) {
          const trend = calculateTrend(latest.energy_burned_cal, previous.energy_burned_cal, true);
          calculatedMetrics.push({
            label: "Calories",
            value: `${Math.round(latest.energy_burned_cal)} kcal`,
            trend,
            changePercent: ((latest.energy_burned_cal - previous.energy_burned_cal) / previous.energy_burned_cal) * 100,
          });
        }

        // Sleep Performance (higher is better)
        if (latest.sleep_performance_percent !== null && previous.sleep_performance_percent !== null) {
          const trend = calculateTrend(latest.sleep_performance_percent, previous.sleep_performance_percent, true);
          calculatedMetrics.push({
            label: "Sleep Quality",
            value: `${Math.round(latest.sleep_performance_percent)}%`,
            trend,
            changePercent: ((latest.sleep_performance_percent - previous.sleep_performance_percent) / previous.sleep_performance_percent) * 100,
          });
        }

        // Sleep Debt (lower is better)
        if (latest.sleep_debt_min !== null && previous.sleep_debt_min !== null) {
          const trend = calculateTrend(latest.sleep_debt_min, previous.sleep_debt_min, false);
          const sleepDebtHours = (latest.sleep_debt_min / 60).toFixed(1);
          calculatedMetrics.push({
            label: "Sleep Debt",
            value: `${sleepDebtHours}h`,
            trend,
            changePercent: ((latest.sleep_debt_min - previous.sleep_debt_min) / previous.sleep_debt_min) * 100,
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

  const getTrendColor = (trend: "up" | "down" | "stable") => {
    switch (trend) {
      case "up":
        return "#16A34A"; // Green
      case "down":
        return "#DC2626"; // Red
      case "stable":
        return "#6B7280"; // Gray
    }
  };

  const getTrendIcon = (trend: "up" | "down" | "stable") => {
    switch (trend) {
      case "up":
        return <TrendingUp className="w-3 h-3" />;
      case "down":
        return <TrendingDown className="w-3 h-3" />;
      case "stable":
        return <Minus className="w-3 h-3" />;
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

  if (metrics.length === 0) {
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
            Connect WHOOP to see metrics
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
          const color = getTrendColor(metric.trend);
          const icon = getTrendIcon(metric.trend);

          return (
            <motion.div
              key={`${metric.label}-${index}`}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-100 whitespace-nowrap flex-shrink-0"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.2 }}
            >
              <span style={{ color }}>{icon}</span>
              <span
                style={{
                  fontFamily: '"Right Grotesk Wide", sans-serif',
                  fontWeight: 600,
                  fontSize: "14px",
                  lineHeight: "20px",
                  color: "rgb(39, 39, 42)",
                }}
              >
                {metric.value}
              </span>
              <span
                style={{
                  fontFamily: '"General Sans", sans-serif',
                  fontWeight: 400,
                  fontSize: "13px",
                  lineHeight: "18px",
                  color: "rgb(107, 114, 128)",
                }}
              >
                {metric.label}
              </span>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}