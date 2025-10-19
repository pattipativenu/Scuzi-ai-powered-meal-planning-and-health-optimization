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
  const [userId, setUserId] = useState<string | null>(null);

  // Get or create userId on mount
  useEffect(() => {
    let storedUserId = localStorage.getItem('whoop_user_id');
    if (!storedUserId) {
      storedUserId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      localStorage.setItem('whoop_user_id', storedUserId);
    }
    setUserId(storedUserId);
  }, []);

  // Fetch WHOOP metrics on mount and poll every 5 minutes if connected
  useEffect(() => {
    if (userId) {
      fetchMetrics();
      const interval = setInterval(fetchMetrics, 300000); // Poll every 5 minutes
      return () => clearInterval(interval);
    }
  }, [userId]);

  const fetchMetrics = async () => {
    if (!userId) return;
    
    try {
      const response = await fetch(`/api/whoop/metrics?user_id=${userId}`);
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
        console.log("🔗 Opening WHOOP OAuth in new tab:", data.authUrl);
        console.log("📍 Redirect URI:", data.redirectUri);
        
        // Open WHOOP OAuth in a new tab
        window.open(data.authUrl, '_blank', 'noopener,noreferrer');
        
        // Keep loading state for a few seconds to show user the action happened
        setTimeout(() => {
          setIsLoading(false);
          // Start polling for metrics to detect successful connection
          const pollInterval = setInterval(async () => {
            await fetchMetrics();
            if (metrics.connected) {
              clearInterval(pollInterval);
            }
          }, 3000); // Poll every 3 seconds
          
          // Stop polling after 5 minutes
          setTimeout(() => clearInterval(pollInterval), 300000);
        }, 2000);
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
    if (!userId) return;
    
    setIsLoading(true);
    try {
      const response = await fetch("/api/whoop/disconnect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId })
      });
      
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
    userId,
  };
}