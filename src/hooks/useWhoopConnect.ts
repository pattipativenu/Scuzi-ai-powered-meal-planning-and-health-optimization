"use client";

import { useState, useEffect } from "react";

interface WhoopMetrics {
  connected: boolean;
  sleep?: string;
  strain?: string;
  calories?: number;
  avgHeartRate?: number;
  recovery?: number;
  hrv?: number;
  rhr?: number;
  spo2?: string;
  skinTemp?: string;
  respiratoryRate?: string;
}

export function useWhoopConnect() {
  const [metrics, setMetrics] = useState<WhoopMetrics>({ connected: false });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch WHOOP metrics on mount and poll every 30 seconds if connected
  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 30000); // Poll every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchMetrics = async () => {
    try {
      const response = await fetch("/api/whoop/metrics");
      if (response.ok) {
        const data = await response.json();
        setMetrics(data);
      }
    } catch (err) {
      console.error("Error fetching WHOOP metrics:", err);
    }
  };

  const connect = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/whoop/connect");
      const data = await response.json();
      
      if (data.authUrl) {
        // Open OAuth flow in new window
        const width = 600;
        const height = 700;
        const left = window.screen.width / 2 - width / 2;
        const top = window.screen.height / 2 - height / 2;
        
        window.open(
          data.authUrl,
          "WHOOP OAuth",
          `width=${width},height=${height},left=${left},top=${top}`
        );
        
        // Listen for successful connection
        const checkConnection = setInterval(async () => {
          await fetchMetrics();
          const metricsResponse = await fetch("/api/whoop/metrics");
          const metricsData = await metricsResponse.json();
          
          if (metricsData.connected) {
            setMetrics(metricsData);
            clearInterval(checkConnection);
            setIsLoading(false);
          }
        }, 2000);
        
        // Stop checking after 5 minutes
        setTimeout(() => {
          clearInterval(checkConnection);
          setIsLoading(false);
        }, 300000);
      } else {
        setError(data.error || "Failed to initiate WHOOP connection");
        setIsLoading(false);
      }
    } catch (err) {
      setError("Failed to connect to WHOOP");
      setIsLoading(false);
    }
  };

  const disconnect = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/whoop/disconnect", { method: "POST" });
      if (response.ok) {
        setMetrics({ connected: false });
      }
    } catch (err) {
      setError("Failed to disconnect from WHOOP");
    } finally {
      setIsLoading(false);
    }
  };

  return {
    metrics,
    isLoading,
    error,
    connect,
    disconnect,
    isConnected: metrics.connected,
  };
}