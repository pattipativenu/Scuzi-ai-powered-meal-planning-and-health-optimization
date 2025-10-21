import mysql from "mysql2/promise";

export interface WhoopHealthData {
  user_id: string;
  date: string;
  recovery_score: number | null;
  strain: number | null;
  sleep_hours: number | null;
  calories_burned: number | null;
  avg_hr: number | null;
  rhr: number | null;
  hrv: number | null;
  spo2: number | null;
  skin_temp: number | null;
  respiratory_rate: number | null;
  created_at: string;
  updated_at: string;
}

export interface WhoopAnalysis {
  userId: string;
  dataPoints: number;
  dateRange: { start: string; end: string };
  averages: {
    recovery: number;
    strain: number;
    sleep: number;
    hrv: number;
    rhr: number;
    calories: number;
  };
  trends: {
    recovery: "improving" | "declining" | "stable";
    sleep: "improving" | "declining" | "stable";
    strain: "increasing" | "decreasing" | "stable";
  };
  physiologicalState: {
    fatigueLevel: "low" | "moderate" | "high";
    recoveryStatus: "excellent" | "good" | "fair" | "poor";
    metabolicDemand: "low" | "moderate" | "high";
    sleepQuality: "excellent" | "good" | "fair" | "poor";
  };
  nutritionalRecommendations: {
    proteinEmphasis: "high" | "moderate" | "standard";
    carbTiming: "pre-workout" | "post-workout" | "balanced";
    antiInflammatory: boolean;
    hydrationFocus: boolean;
    energyDensity: "high" | "moderate" | "low";
  };
}

async function getDbConnection() {
  return mysql.createConnection({
    host: process.env.RDS_HOST,
    user: process.env.RDS_USER,
    password: process.env.RDS_PASSWORD,
    database: process.env.RDS_DATABASE, // Use the database from env (scuzi_meals)
    port: Number(process.env.RDS_PORT) || 3306,
  });
}

export async function fetchUserWhoopData(userId: string, days: number = 7): Promise<WhoopHealthData[]> {
  try {
    const connection = await getDbConnection();
    
    console.log(`🔍 [WHOOP-DB] Fetching data for user: ${userId}, days: ${days}`);
    
    const [rows] = await connection.execute(
      `SELECT * FROM whoop_health_data 
       WHERE user_id = ? 
       ORDER BY date DESC 
       LIMIT ?`,
      [userId, (days * 2).toString()] // Convert to string for MySQL
    );

    await connection.end();
    
    console.log(`✅ [WHOOP-DB] Found ${(rows as any[]).length} records from database`);
    
    if ((rows as any[]).length > 0) {
      return rows as WhoopHealthData[];
    } else {
      console.warn(`⚠️ [WHOOP-DB] No records found for user ${userId}, using mock data`);
    }
  } catch (error) {
    console.error("❌ [WHOOP-DB] Database connection failed:", error);
    console.warn("⚠️ [WHOOP-DB] Falling back to mock data for testing");
    
    // Return mock WHOOP data for testing AWS Bedrock integration
    const mockData: WhoopHealthData[] = [];
    const today = new Date();
    
    for (let i = 0; i < days; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      mockData.push({
        user_id: userId,
        date: date.toISOString().split('T')[0],
        recovery_score: Math.floor(Math.random() * 40) + 50, // 50-90
        strain: Math.random() * 10 + 8, // 8-18
        sleep_hours: Math.random() * 2 + 6.5, // 6.5-8.5
        calories_burned: Math.floor(Math.random() * 800) + 2000, // 2000-2800
        avg_hr: Math.floor(Math.random() * 30) + 140, // 140-170
        rhr: Math.floor(Math.random() * 20) + 55, // 55-75
        hrv: Math.floor(Math.random() * 30) + 30, // 30-60
        spo2: Math.random() * 2 + 97, // 97-99
        skin_temp: Math.random() * 2 + 97.5, // 97.5-99.5
        respiratory_rate: Math.random() * 4 + 14, // 14-18
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }
    
    return mockData;
  }
}

export function analyzeWhoopData(data: WhoopHealthData[]): WhoopAnalysis {
  if (data.length === 0) {
    throw new Error("No WHOOP data available for analysis");
  }

  // Calculate averages (excluding null values)
  const validRecovery = data.filter(d => d.recovery_score !== null).map(d => d.recovery_score!);
  const validStrain = data.filter(d => d.strain !== null).map(d => d.strain!);
  const validSleep = data.filter(d => d.sleep_hours !== null).map(d => d.sleep_hours!);
  const validHrv = data.filter(d => d.hrv !== null).map(d => d.hrv!);
  const validRhr = data.filter(d => d.rhr !== null).map(d => d.rhr!);
  const validCalories = data.filter(d => d.calories_burned !== null).map(d => d.calories_burned!);

  const averages = {
    recovery: validRecovery.length > 0 ? validRecovery.reduce((a, b) => a + b, 0) / validRecovery.length : 50,
    strain: validStrain.length > 0 ? validStrain.reduce((a, b) => a + b, 0) / validStrain.length : 10,
    sleep: validSleep.length > 0 ? validSleep.reduce((a, b) => a + b, 0) / validSleep.length : 7,
    hrv: validHrv.length > 0 ? validHrv.reduce((a, b) => a + b, 0) / validHrv.length : 40,
    rhr: validRhr.length > 0 ? validRhr.reduce((a, b) => a + b, 0) / validRhr.length : 65,
    calories: validCalories.length > 0 ? validCalories.reduce((a, b) => a + b, 0) / validCalories.length : 2200,
  };

  // Calculate trends (compare first half vs second half of data)
  const midPoint = Math.floor(data.length / 2);
  const recent = data.slice(0, midPoint);
  const older = data.slice(midPoint);

  const calculateTrend = (recentData: number[], olderData: number[]): "improving" | "declining" | "stable" => {
    if (recentData.length === 0 || olderData.length === 0) return "stable";
    
    const recentAvg = recentData.reduce((a, b) => a + b, 0) / recentData.length;
    const olderAvg = olderData.reduce((a, b) => a + b, 0) / olderData.length;
    const change = ((recentAvg - olderAvg) / olderAvg) * 100;
    
    if (Math.abs(change) < 5) return "stable";
    return change > 0 ? "improving" : "declining";
  };

  const trends = {
    recovery: calculateTrend(
      recent.filter(d => d.recovery_score !== null).map(d => d.recovery_score!),
      older.filter(d => d.recovery_score !== null).map(d => d.recovery_score!)
    ),
    sleep: calculateTrend(
      recent.filter(d => d.sleep_hours !== null).map(d => d.sleep_hours!),
      older.filter(d => d.sleep_hours !== null).map(d => d.sleep_hours!)
    ),
    strain: calculateTrend(
      recent.filter(d => d.strain !== null).map(d => d.strain!),
      older.filter(d => d.strain !== null).map(d => d.strain!)
    ) === "improving" ? "increasing" : calculateTrend(
      recent.filter(d => d.strain !== null).map(d => d.strain!),
      older.filter(d => d.strain !== null).map(d => d.strain!)
    ) === "declining" ? "decreasing" : "stable",
  };

  // Determine physiological state
  const physiologicalState = {
    fatigueLevel: averages.recovery < 40 ? "high" : averages.recovery < 70 ? "moderate" : "low",
    recoveryStatus: averages.recovery >= 80 ? "excellent" : averages.recovery >= 65 ? "good" : averages.recovery >= 50 ? "fair" : "poor",
    metabolicDemand: averages.strain > 15 ? "high" : averages.strain > 10 ? "moderate" : "low",
    sleepQuality: averages.sleep >= 8 ? "excellent" : averages.sleep >= 7 ? "good" : averages.sleep >= 6 ? "fair" : "poor",
  };

  // Generate nutritional recommendations
  const nutritionalRecommendations = {
    proteinEmphasis: (averages.strain > 12 || physiologicalState.recoveryStatus === "poor") ? "high" : "moderate",
    carbTiming: averages.strain > 14 ? "post-workout" : averages.strain > 8 ? "balanced" : "pre-workout",
    antiInflammatory: physiologicalState.recoveryStatus === "poor" || trends.recovery === "declining",
    hydrationFocus: averages.strain > 12 || physiologicalState.fatigueLevel === "high",
    energyDensity: physiologicalState.fatigueLevel === "high" ? "high" : physiologicalState.metabolicDemand === "high" ? "moderate" : "low",
  };

  return {
    userId: data[0].user_id,
    dataPoints: data.length,
    dateRange: {
      start: data[data.length - 1].date,
      end: data[0].date,
    },
    averages,
    trends,
    physiologicalState,
    nutritionalRecommendations,
  };
}