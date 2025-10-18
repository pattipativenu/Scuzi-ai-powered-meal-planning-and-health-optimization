import { useEffect, useState } from "react";

export interface HistoryItem {
  id: string;
  title: string;
  description: string;
  image_url: string;
  timestamp: number;
  type: string;
  ai_response?: string;
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
      setHistory(data);
    } catch (err) {
      console.error("Error fetching history:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
    
    // Refresh every 1 hour (3600000 ms)
    const interval = setInterval(fetchHistory, 3600000);
    
    return () => clearInterval(interval);
  }, []);

  return { history, isLoading, error, refetch: fetchHistory };
}