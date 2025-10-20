import { useEffect, useState } from "react";

export interface HistoryItem {
  id: string;
  title: string;
  description: string;
  image_url: string;
  timestamp: number;
  type: string;
  ai_response?: string;
  ai_generated_image?: string;
  generated_image_url?: string;
}

export function useHistoryFeed() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await fetch("/api/history");
      
      if (!res.ok) {
        throw new Error(`Failed to fetch history: ${res.statusText}`);
      }
      
      const data = await res.json();
      
      // Filter out items older than 1 hour
      const oneHourAgo = Date.now() - 3600000; // 1 hour = 3600000 milliseconds
      const recentHistory = data.filter((item: HistoryItem) => item.timestamp >= oneHourAgo);
      
      setHistory(recentHistory);
    } catch (err) {
      console.error("Error fetching history:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
    
    // Refresh every 5 minutes to remove expired items
    const interval = setInterval(fetchHistory, 300000);
    
    return () => clearInterval(interval);
  }, []);

  return { history, isLoading, error, refetch: fetchHistory };
}