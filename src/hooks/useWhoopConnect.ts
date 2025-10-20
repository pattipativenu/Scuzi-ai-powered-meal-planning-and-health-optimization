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

  // Get userId from cookie (set by auth system) or create temporary one
  useEffect(() => {
    // First try to get from cookie (set by auth system)
    const cookieUserId = document.cookie
      .split('; ')
      .find(row => row.startsWith('whoop_user_id='))
      ?.split('=')[1];
    
    if (cookieUserId) {
      setUserId(cookieUserId);
    } else {
      // Fallback to localStorage for unauthenticated users
      let storedUserId = localStorage.getItem('whoop_user_id');
      if (!storedUserId) {
        storedUserId = `guest_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        localStorage.setItem('whoop_user_id', storedUserId);
      }
      setUserId(storedUserId);
    }
  }, []);

  // Fetch WHOOP metrics on mount and poll every 15 minutes if connected
  useEffect(() => {
    if (userId) {
      fetchMetrics();
      const interval = setInterval(fetchMetrics, 900000); // Poll every 15 minutes
      return () => clearInterval(interval);
    }
  }, [userId]);

  const fetchMetrics = async () => {
    try {
      console.log("📊 Fetching WHOOP metrics...");
      
      const response = await fetch("/api/whoop/metrics");
      console.log("📊 Metrics response:", response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log("📊 Metrics data:", data);
        setMetrics(data);
        
        if (data.connected) {
          console.log("✅ WHOOP connected with data:", {
            userId: data.userId,
            recovery: data.recovery,
            strain: data.strain,
            sleep: data.sleep
          });
        }
      } else {
        console.log("❌ Metrics API failed");
        setMetrics({ connected: false });
      }
    } catch (err) {
      console.error("❌ Error fetching metrics:", err);
      setMetrics({ connected: false });
    }
  };

  const connect = async () => {
    console.log("🚀 Connect function called", { isConnected: metrics.connected, userId });
    
    // Always allow reconnection - even if already connected, show the OAuth flow again
    console.log("🔗 Starting WHOOP connection process (allowing reconnection)");
    setIsLoading(true);
    setError(null);
    
    try {
      console.log("📡 Fetching /api/whoop/connect");
      
      // Test if fetch is working at all
      if (typeof fetch === 'undefined') {
        console.error("❌ Fetch is not available");
        throw new Error("Fetch is not available");
      }
      
      const response = await fetch("/api/whoop/connect");
      console.log("📡 Connect API response status:", response.status);
      console.log("📡 Connect API response headers:", response.headers);
      
      if (!response.ok) {
        console.error("❌ API response not ok:", response.status, response.statusText);
        throw new Error(`API request failed: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("📡 Connect API response data:", data);
      
      if (data.authUrl) {
        console.log("🔗 Opening WHOOP OAuth in new tab:", data.authUrl);
        console.log("📍 Redirect URI:", data.redirectUri);
        
        // Open WHOOP OAuth in a new tab
        const authWindow = window.open(data.authUrl, '_blank', 'noopener,noreferrer,width=600,height=700');
        
        // Start polling immediately in case postMessage doesn't work
        console.log("🔄 Starting immediate polling for connection");
        const immediatePolling = setInterval(async () => {
          console.log("🔄 Checking connection status...");
          await fetchMetrics();
          if (metrics.connected) {
            console.log("✅ Connection detected!");
            setIsLoading(false);
            clearInterval(immediatePolling);
          }
        }, 3000); // Poll every 3 seconds
        
        // Stop immediate polling after 5 minutes
        setTimeout(() => clearInterval(immediatePolling), 300000);
        
        // Listen for messages from the auth window
        const messageHandler = (event: MessageEvent) => {
          if (event.origin !== window.location.origin) return;
          
          if (event.data.type === 'WHOOP_AUTH_SUCCESS') {
            console.log("✅ WHOOP authentication successful");
            authWindow?.close();
            setIsLoading(false);
            // Immediately fetch new metrics and force a re-render
            setTimeout(async () => {
              await fetchMetrics();
              console.log("🔄 Metrics fetched after successful auth");
            }, 1000); // Small delay to ensure backend is ready
            window.removeEventListener('message', messageHandler);
          } else if (event.data.type === 'WHOOP_AUTH_ERROR') {
            console.error("❌ WHOOP authentication failed:", event.data.error);
            setError(event.data.error || "Authentication failed");
            setIsLoading(false);
            window.removeEventListener('message', messageHandler);
          }
        };
        
        window.addEventListener('message', messageHandler);
        
        // Fallback: Stop loading after 30 seconds and start aggressive polling
        setTimeout(() => {
          setIsLoading(false);
          window.removeEventListener('message', messageHandler);
          
          // Start aggressive polling to detect connection
          console.log("🔄 Starting fallback polling for connection status");
          const pollInterval = setInterval(async () => {
            console.log("🔄 Polling for connection status...");
            const previousConnected = metrics.connected;
            await fetchMetrics();
            
            // If connection status changed from false to true, we're connected!
            if (!previousConnected && metrics.connected) {
              console.log("✅ Connection detected via polling!");
              clearInterval(pollInterval);
              // Force a state update to trigger re-render
              setMetrics(prev => ({ ...prev, connected: true }));
            }
          }, 1500); // Poll every 1.5 seconds for faster detection
          
          // Stop polling after 3 minutes
          setTimeout(() => {
            console.log("⏹️ Stopping connection polling");
            clearInterval(pollInterval);
          }, 180000);
        }, 30000);
        
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
    setError(null);
    
    try {
      const response = await fetch("/api/whoop/disconnect", {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      
      if (response.ok) {
        setMetrics({ connected: false });
        console.log("✅ WHOOP disconnected successfully");
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to disconnect from WHOOP");
      }
    } catch (err) {
      setError("Failed to disconnect from WHOOP");
      console.error("Error disconnecting WHOOP:", err);
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
    fetchMetrics,
    isConnected: metrics.connected,
    userId,
  };
}