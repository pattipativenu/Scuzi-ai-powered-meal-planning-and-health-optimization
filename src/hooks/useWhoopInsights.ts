import { useState, useEffect } from "react";
import { healthAdviceRules, defaultMessages } from "@/config/whoop-advice";

interface WhoopMetrics {
  recovery_score: number | null;
  resting_heart_rate: number | null;
  heart_rate_variability: number | null;
  skin_temperature: number | null;
  blood_oxygen: number | null;
  day_strain: number | null;
  energy_burned: number | null;
  max_heart_rate: number | null;
  average_heart_rate: number | null;
  sleep_performance: number | null;
  sleep_duration: number | null;
  sleep_efficiency: number | null;
  sleep_consistency: number | null;
  sleep_debt: number | null;
  respiratory_rate: number | null;
}

export function useWhoopInsights() {
  const [insights, setInsights] = useState<string[]>(defaultMessages);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchWhoopData();
  }, []);

  const fetchWhoopData = async () => {
    try {
      // Fetch WHOOP summary (last 7 days)
      const response = await fetch("/api/whoop-summary");
      
      if (!response.ok) {
        console.warn("WHOOP data not available, using default messages");
        setInsights(defaultMessages);
        setIsLoading(false);
        return;
      }

      const data = await response.json();
      
      if (data.status === "success" && data.summary) {
        const messages = interpretMetrics(data.summary);
        setInsights(messages.length > 0 ? messages : defaultMessages);
      } else {
        setInsights(defaultMessages);
      }
    } catch (error) {
      console.error("Error fetching WHOOP insights:", error);
      setInsights(defaultMessages);
    } finally {
      setIsLoading(false);
    }
  };

  const interpretMetrics = (metrics: WhoopMetrics): string[] => {
    const messages: string[] = [];

    // Check each advice rule against the metrics
    for (const rule of healthAdviceRules) {
      const metricValue = metrics[rule.metric as keyof WhoopMetrics];
      
      if (metricValue !== null && metricValue !== undefined && rule.condition(metricValue)) {
        // Randomly select one message from the rule's messages
        const randomMessage = rule.messages[Math.floor(Math.random() * rule.messages.length)];
        messages.push(randomMessage);
      }
    }

    // Shuffle messages for variety
    return messages.sort(() => Math.random() - 0.5);
  };

  return {
    insights,
    isLoading,
    refetch: fetchWhoopData,
  };
}