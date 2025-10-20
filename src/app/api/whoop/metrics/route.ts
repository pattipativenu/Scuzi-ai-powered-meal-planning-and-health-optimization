import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

// Helper function to refresh token and retry request
async function refreshTokenAndRetry(originalRequest: () => Promise<Response[]>): Promise<Response[]> {
  console.log("🔄 Attempting token refresh...");
  
  const refreshResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/whoop/refresh-token`, {
    method: 'POST',
  });

  if (!refreshResponse.ok) {
    throw new Error('Token refresh failed');
  }

  console.log("✅ Token refreshed, retrying original request...");
  return await originalRequest();
}

export async function GET(request: NextRequest) {
  console.log("📊 WHOOP Metrics API called");
  
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get("whoop_access_token")?.value;
    const userId = cookieStore.get("whoop_user_id")?.value;

    console.log("🔍 Token check:", { 
      hasToken: !!accessToken, 
      tokenLength: accessToken?.length,
      userId: userId 
    });

    if (!accessToken) {
      console.log("❌ No access token found");
      return NextResponse.json({ connected: false });
    }

    console.log("🔄 Fetching WHOOP data...");

    // Function to make WHOOP API calls
    const makeWhoopRequests = async (): Promise<Response[]> => {
      const currentToken = (await cookies()).get("whoop_access_token")?.value;
      return await Promise.all([
        fetch("https://api.prod.whoop.com/developer/v1/cycle", {
          headers: { Authorization: `Bearer ${currentToken}` },
        }),
        fetch("https://api.prod.whoop.com/developer/v1/recovery", {
          headers: { Authorization: `Bearer ${currentToken}` },
        }),
        fetch("https://api.prod.whoop.com/developer/v1/activity/sleep", {
          headers: { Authorization: `Bearer ${currentToken}` },
        }),
      ]);
    };

    // Fetch WHOOP data using the API structure from documentation
    let [cycleResponse, recoveryResponse, sleepResponse] = await makeWhoopRequests();

    console.log("📊 API Response Status:", {
      cycle: cycleResponse.status,
      recovery: recoveryResponse.status,
      sleep: sleepResponse.status
    });

    // If any request returns 401 (unauthorized), try to refresh token and retry
    if (cycleResponse.status === 401 || recoveryResponse.status === 401 || sleepResponse.status === 401) {
      console.log("🔄 Token expired, attempting refresh...");
      try {
        [cycleResponse, recoveryResponse, sleepResponse] = await refreshTokenAndRetry(makeWhoopRequests);
        console.log("📊 Retry API Response Status:", {
          cycle: cycleResponse.status,
          recovery: recoveryResponse.status,
          sleep: sleepResponse.status
        });
      } catch (refreshError) {
        console.error("❌ Token refresh failed:", refreshError);
        return NextResponse.json({ connected: false, error: "Token refresh failed" });
      }
    }

    if (!cycleResponse.ok && !recoveryResponse.ok && !sleepResponse.ok) {
      console.error("❌ All WHOOP API calls failed");
      return NextResponse.json({ connected: false });
    }

    const metrics: any = { connected: true, userId };

    // Process Cycle Data (Strain, Calories, Heart Rate)
    if (cycleResponse.ok) {
      const cycleData = await cycleResponse.json();
      console.log("📊 Cycle data:", cycleData);
      
      const records = cycleData.records || [];
      if (records.length > 0) {
        const latestCycle = records[0];
        
        if (latestCycle.score?.strain) {
          metrics.strain = latestCycle.score.strain.toFixed(1);
        }
        
        if (latestCycle.score?.kilojoule) {
          metrics.calories = Math.round(latestCycle.score.kilojoule * 0.239006);
        }
        
        if (latestCycle.score?.average_heart_rate) {
          metrics.avgHr = Math.round(latestCycle.score.average_heart_rate);
        }
      }
    }

    // Process Recovery Data
    if (recoveryResponse.ok) {
      const recoveryData = await recoveryResponse.json();
      console.log("📊 Recovery data:", recoveryData);
      
      const records = recoveryData.records || [];
      if (records.length > 0) {
        const latestRecovery = records[0];
        
        if (latestRecovery.score?.recovery_score !== undefined) {
          metrics.recovery = Math.round(latestRecovery.score.recovery_score);
        }
        
        if (latestRecovery.score?.hrv_rmssd_milli) {
          metrics.hrv = Math.round(latestRecovery.score.hrv_rmssd_milli);
        }
        
        if (latestRecovery.score?.resting_heart_rate) {
          metrics.rhr = Math.round(latestRecovery.score.resting_heart_rate);
        }
        
        if (latestRecovery.score?.spo2_percentage) {
          metrics.spo2 = latestRecovery.score.spo2_percentage.toFixed(1);
        }
        
        if (latestRecovery.score?.skin_temp_celsius) {
          metrics.skinTemp = latestRecovery.score.skin_temp_celsius.toFixed(1);
        }
      }
    }

    // Process Sleep Data
    if (sleepResponse.ok) {
      const sleepData = await sleepResponse.json();
      console.log("📊 Sleep data:", sleepData);
      
      const records = sleepData.records || [];
      if (records.length > 0) {
        const latestSleep = records[0];
        
        if (latestSleep.score?.respiratory_rate) {
          metrics.respiratoryRate = latestSleep.score.respiratory_rate.toFixed(1);
        }
        
        if (latestSleep.score?.sleep_performance_percentage) {
          metrics.sleepQuality = Math.round(latestSleep.score.sleep_performance_percentage);
        }
        
        // Calculate sleep hours from sleep stages
        if (latestSleep.score?.stage_summary) {
          const stages = latestSleep.score.stage_summary;
          const totalSleepMs = (stages.total_light_sleep_time_milli || 0) + 
                              (stages.total_slow_wave_sleep_time_milli || 0) + 
                              (stages.total_rem_sleep_time_milli || 0);
          metrics.sleep = (totalSleepMs / 3600000).toFixed(1);
        }
      }
    }

    console.log("✅ WHOOP metrics processed:", metrics);
    return NextResponse.json(metrics);

  } catch (error) {
    console.error("❌ Error fetching WHOOP metrics:", error);
    return NextResponse.json({ connected: false });
  }
}