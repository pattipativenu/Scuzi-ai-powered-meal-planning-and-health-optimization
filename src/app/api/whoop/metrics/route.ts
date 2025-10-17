import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get("whoop_access_token")?.value;

    if (!accessToken) {
      return NextResponse.json({ connected: false }, { status: 200 });
    }

    // Fetch all WHOOP data in parallel for better performance
    const [cycleResponse, recoveryResponse] = await Promise.all([
      fetch("https://api.prod.whoop.com/developer/v1/cycle", {
        headers: { Authorization: `Bearer ${accessToken}` },
      }),
      fetch("https://api.prod.whoop.com/developer/v1/recovery", {
        headers: { Authorization: `Bearer ${accessToken}` },
      }),
    ]);

    if (!cycleResponse.ok && !recoveryResponse.ok) {
      console.error("Failed to fetch WHOOP data");
      return NextResponse.json({ connected: false }, { status: 200 });
    }

    const metrics: any = { connected: true };

    // Process Cycle Data (Strain, Calories, Heart Rate)
    if (cycleResponse.ok) {
      const cycleData = await cycleResponse.json();
      const records = cycleData.records || [];
      
      if (records.length > 0) {
        const latestCycle = records[0];
        
        // Sleep hours
        if (latestCycle.sleep?.score?.total_sleep_seconds) {
          metrics.sleep = (latestCycle.sleep.score.total_sleep_seconds / 3600).toFixed(1);
        }
        
        // Strain score
        if (latestCycle.score?.strain) {
          metrics.strain = latestCycle.score.strain.toFixed(1);
        }
        
        // Calories (convert kJ to kcal)
        if (latestCycle.score?.kilojoule) {
          metrics.calories = Math.round(latestCycle.score.kilojoule * 0.239006);
        }
        
        // Average heart rate
        if (latestCycle.score?.average_heart_rate) {
          metrics.avgHeartRate = Math.round(latestCycle.score.average_heart_rate);
        }
      }
    }

    // Process Recovery Data (HRV, RHR, SpO2, Skin Temp)
    if (recoveryResponse.ok) {
      const recoveryData = await recoveryResponse.json();
      const records = recoveryData.records || [];
      
      if (records.length > 0) {
        const latestRecovery = records[0];
        
        // Recovery score
        if (latestRecovery.score?.recovery_score !== undefined) {
          metrics.recovery = Math.round(latestRecovery.score.recovery_score);
        }
        
        // Heart Rate Variability (HRV)
        if (latestRecovery.score?.hrv_rmssd_milli) {
          metrics.hrv = Math.round(latestRecovery.score.hrv_rmssd_milli);
        }
        
        // Resting Heart Rate (RHR)
        if (latestRecovery.score?.resting_heart_rate) {
          metrics.rhr = Math.round(latestRecovery.score.resting_heart_rate);
        }
        
        // Blood Oxygen (SpO2) - WHOOP 4.0 only
        if (latestRecovery.score?.spo2_percentage) {
          metrics.spo2 = latestRecovery.score.spo2_percentage.toFixed(1);
        }
        
        // Skin Temperature (deviation from baseline)
        if (latestRecovery.score?.skin_temp_celsius) {
          metrics.skinTemp = latestRecovery.score.skin_temp_celsius.toFixed(1);
        }
        
        // Respiratory Rate
        if (latestRecovery.score?.respiratory_rate) {
          metrics.respiratoryRate = latestRecovery.score.respiratory_rate.toFixed(1);
        }
      }
    }

    return NextResponse.json(metrics);
  } catch (error) {
    console.error("Error fetching WHOOP metrics:", error);
    return NextResponse.json({ connected: false }, { status: 200 });
  }
}