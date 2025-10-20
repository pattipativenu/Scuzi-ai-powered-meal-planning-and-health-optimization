"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { useWhoopConnect } from "@/hooks/useWhoopConnect";

interface WhoopMetric {
  label: string;
  value?: string;
  trend?: "up" | "down" | "stable";
  changePercent?: number;
  percentValue?: number; // For color coding
  performance?: "good" | "average" | "poor"; // For color coding
}

export function WhoopMiniMetrics() {
  const { metrics: whoopMetrics, isConnected, isLoading, fetchMetrics } = useWhoopConnect();
  const [displayMetrics, setDisplayMetrics] = useState<WhoopMetric[]>([]);
  const [previousMetrics, setPreviousMetrics] = useState<any>(null);

  // Update every 15 minutes when connected
  useEffect(() => {
    if (isConnected) {
      const interval = setInterval(() => {
        console.log("🔄 Auto-refreshing WHOOP metrics (15min interval)");
        fetchMetrics();
      }, 15 * 60 * 1000); // 15 minutes
      
      return () => clearInterval(interval);
    }
  }, [isConnected, fetchMetrics]);

  // Store previous metrics for trend calculation
  useEffect(() => {
    if (isConnected && whoopMetrics.connected && whoopMetrics !== previousMetrics) {
      setPreviousMetrics(whoopMetrics);
    }
  }, [whoopMetrics, isConnected, previousMetrics]);

  // Calculate trend based on previous vs current values
  const calculateTrend = (current: number, previous: number | undefined, isHigherBetter: boolean = true): "up" | "down" | "stable" => {
    if (!previous || previous === current) return "stable";
    
    const change = current - previous;
    const threshold = Math.abs(previous * 0.05); // 5% threshold for "stable"
    
    if (Math.abs(change) < threshold) return "stable";
    
    if (isHigherBetter) {
      return change > 0 ? "up" : "down";
    } else {
      return change > 0 ? "down" : "up";
    }
  };

  // Disconnected state - scrolling metric names without values
  const disconnectedMetrics: WhoopMetric[] = [
    { label: "HRV" },
    { label: "Blood Oxygen" },
    { label: "Sleep" },
    { label: "Sleep Debt" },
    { label: "Recovery" },
    { label: "Strain" },
    { label: "Calories Burned" },
    { label: "Resting HR" },
    { label: "Avg HR" },
    { label: "Respiratory Rate" },
    { label: "Skin Temperature" },
  ];

  useEffect(() => {
    if (isConnected && whoopMetrics.connected) {
      // Connected state - show live data with performance indicators
      const liveMetrics: WhoopMetric[] = [];

      // Recovery Score
      if (whoopMetrics.recovery !== undefined) {
        const recovery = whoopMetrics.recovery;
        const trend = calculateTrend(recovery, previousMetrics?.recovery, true);
        liveMetrics.push({
          label: "Recovery",
          value: `${recovery}%`,
          trend,
          performance: recovery >= 75 ? "good" : recovery >= 50 ? "average" : "poor",
          percentValue: recovery,
        });
      }

      // Strain
      if (whoopMetrics.strain !== undefined) {
        const strain = parseFloat(whoopMetrics.strain);
        const trend = calculateTrend(strain, previousMetrics?.strain ? parseFloat(previousMetrics.strain) : undefined, true);
        liveMetrics.push({
          label: "Strain",
          value: whoopMetrics.strain,
          trend,
          performance: strain >= 15 ? "good" : strain >= 10 ? "average" : "poor",
        });
      }

      // Sleep (past tense)
      if (whoopMetrics.sleep !== undefined) {
        const sleepHours = parseFloat(whoopMetrics.sleep);
        const trend = calculateTrend(sleepHours, previousMetrics?.sleep ? parseFloat(previousMetrics.sleep) : undefined, true);
        liveMetrics.push({
          label: "Slept",
          value: `${whoopMetrics.sleep}h`,
          trend,
          performance: sleepHours >= 7.5 ? "good" : sleepHours >= 6.5 ? "average" : "poor",
        });
      }

      // Calories (past tense)
      if (whoopMetrics.calories !== undefined) {
        const trend = calculateTrend(whoopMetrics.calories, previousMetrics?.calories, true);
        liveMetrics.push({
          label: "Calories Burned",
          value: `${whoopMetrics.calories}`,
          trend,
          performance: whoopMetrics.calories >= 2500 ? "good" : whoopMetrics.calories >= 2000 ? "average" : "poor",
        });
      }

      // HRV
      if (whoopMetrics.hrv !== undefined) {
        const trend = calculateTrend(whoopMetrics.hrv, previousMetrics?.hrv, true);
        liveMetrics.push({
          label: "HRV",
          value: `${whoopMetrics.hrv} ms`,
          trend,
          performance: whoopMetrics.hrv >= 50 ? "good" : whoopMetrics.hrv >= 30 ? "average" : "poor",
        });
      }

      // Resting Heart Rate
      if (whoopMetrics.rhr !== undefined) {
        const trend = calculateTrend(whoopMetrics.rhr, previousMetrics?.rhr, false); // Lower is better
        liveMetrics.push({
          label: "Resting HR",
          value: `${whoopMetrics.rhr} bpm`,
          trend,
          performance: whoopMetrics.rhr <= 60 ? "good" : whoopMetrics.rhr <= 70 ? "average" : "poor",
        });
      }

      // Blood Oxygen
      if (whoopMetrics.spo2 !== undefined) {
        const spo2 = parseFloat(whoopMetrics.spo2);
        const trend = calculateTrend(spo2, previousMetrics?.spo2 ? parseFloat(previousMetrics.spo2) : undefined, true);
        liveMetrics.push({
          label: "Blood O₂",
          value: `${whoopMetrics.spo2}%`,
          trend,
          performance: spo2 >= 98 ? "good" : spo2 >= 95 ? "average" : "poor",
          percentValue: spo2,
        });
      }

      // Respiratory Rate
      if (whoopMetrics.respiratoryRate !== undefined) {
        const respRate = parseFloat(whoopMetrics.respiratoryRate);
        const trend = calculateTrend(respRate, previousMetrics?.respiratoryRate ? parseFloat(previousMetrics.respiratoryRate) : undefined, true);
        liveMetrics.push({
          label: "Respiratory Rate",
          value: `${whoopMetrics.respiratoryRate} bpm`,
          trend,
          performance: respRate >= 12 && respRate <= 20 ? "good" : respRate >= 10 && respRate <= 24 ? "average" : "poor",
        });
      }

      // Skin Temperature
      if (whoopMetrics.skinTemp !== undefined) {
        const skinTemp = parseFloat(whoopMetrics.skinTemp);
        const trend = calculateTrend(skinTemp, previousMetrics?.skinTemp ? parseFloat(previousMetrics.skinTemp) : undefined, true);
        liveMetrics.push({
          label: "Skin Temp",
          value: `${whoopMetrics.skinTemp}°C`,
          trend,
          performance: "average", // Neutral for temperature
        });
      }

      // Average Heart Rate
      if (whoopMetrics.avgHeartRate !== undefined) {
        const trend = calculateTrend(whoopMetrics.avgHeartRate, previousMetrics?.avgHeartRate, false); // Lower is generally better for resting
        liveMetrics.push({
          label: "Avg HR",
          value: `${whoopMetrics.avgHeartRate} bpm`,
          trend,
          performance: whoopMetrics.avgHeartRate <= 80 ? "good" : whoopMetrics.avgHeartRate <= 100 ? "average" : "poor",
        });
      }

      setDisplayMetrics(liveMetrics);
    } else {
      // Not connected - show scrolling labels without values
      setDisplayMetrics(disconnectedMetrics);
    }
  }, [isConnected, whoopMetrics]);

  // Duplicate metrics 2 times for seamless infinite scroll (50% animation)
  const scrollingMetrics = [...displayMetrics, ...displayMetrics];

  // Get color based on performance level
  const getPerformanceColor = (performance?: "good" | "average" | "poor") => {
    switch (performance) {
      case "good":
        return "#16A34A"; // Green
      case "average":
        return "#F97316"; // Orange
      case "poor":
        return "#DC2626"; // Red
      default:
        return "rgb(107, 114, 128)"; // Gray for disconnected state
    }
  };

  const getTrendColor = (trend?: "up" | "down" | "stable") => {
    if (!trend) return "rgb(107, 114, 128)";
    switch (trend) {
      case "up":
        return "#16A34A"; // Green
      case "down":
        return "#DC2626"; // Red
      case "stable":
        return "#6B7280"; // Gray
    }
  };

  const getTrendIcon = (trend?: "up" | "down" | "stable") => {
    if (!trend) return null;
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

  return (
    <div className="overflow-hidden max-w-full">
      <motion.div
        className="flex items-center gap-2"
        style={{
          animation: isConnected ? "scroll-rtl 20s linear infinite" : "scroll-rtl 12s linear infinite",
          willChange: "transform",
        }}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ 
          duration: 0.5, 
          ease: "easeOut",
          delay: 0.1,
          type: "spring",
          stiffness: 100
        }}
      >
        {scrollingMetrics.map((metric, index) => {
          const trendColor = getTrendColor(metric.trend);
          const trendIcon = getTrendIcon(metric.trend);
          const valueColor = getPerformanceColor(metric.performance);

          return (
            <motion.div
              key={`${metric.label}-${index}`}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full whitespace-nowrap flex-shrink-0 ${
                isConnected ? "bg-gray-100" : "bg-transparent"
              }`}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ 
                duration: 0.4,
                delay: index * 0.05,
                type: "spring",
                stiffness: 200,
                damping: 15
              }}
              whileHover={{ scale: isConnected ? 1.05 : 1 }}
            >
              {/* Show trend icon only when connected and has trend data */}
              {isConnected && trendIcon && (
                <span style={{ color: trendColor }}>{trendIcon}</span>
              )}
              
              {/* Show value only when connected */}
              {isConnected && metric.value && (
                <span
                  style={{
                    fontFamily: '"Right Grotesk Wide", sans-serif',
                    fontWeight: 600,
                    fontSize: "14px",
                    lineHeight: "20px",
                    color: valueColor,
                  }}
                >
                  {metric.value}
                </span>
              )}
              
              {/* Always show label */}
              <span
                style={{
                  fontFamily: '"General Sans", sans-serif',
                  fontWeight: isConnected ? 400 : 500,
                  fontSize: isConnected ? "13px" : "14px",
                  lineHeight: "18px",
                  color: isConnected ? "rgb(107, 114, 128)" : "rgb(107, 114, 128)",
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