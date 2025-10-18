import { useState, useEffect } from "react";

interface MetricData {
  value: string;
  status: "positive" | "negative";
  raw: number;
}

interface WhoopSummary {
  recovery: MetricData;
  strain: MetricData;
  sleep: MetricData;
  hrv: MetricData;
  calories: MetricData;
}

export function useWhoopSummary() {
  const [data, setData] = useState<WhoopSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = async () => {
    try {
      const response = await fetch("/api/whoop-summary");
      
      if (!response.ok) {
        throw new Error("Failed to fetch WHOOP summary");
      }

      const summary = await response.json();
      setData(summary);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      console.error("Error fetching WHOOP summary:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Initial fetch
    fetchSummary();

    // Refresh every 10 minutes (600,000 ms)
    const interval = setInterval(() => {
      fetchSummary();
    }, 600000);

    return () => clearInterval(interval);
  }, []);

  return { data, isLoading, error, refetch: fetchSummary };
}