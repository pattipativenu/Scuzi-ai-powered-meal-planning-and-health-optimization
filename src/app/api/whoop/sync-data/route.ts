import { NextRequest, NextResponse } from "next/server";
import { getWhoopTokens } from "@/lib/secrets-manager";
import mysql from "mysql2/promise";

// WHOOP API base URL
const WHOOP_API_BASE = "https://api.prod.whoop.com/developer";

interface WhoopCycle {
  id: number;
  user_id: number;
  created_at: string;
  updated_at: string;
  start: string;
  end: string;
  timezone_offset: string;
  score_state: string;
  score?: {
    strain?: number;
    kilojoule?: number;
    average_heart_rate?: number;
    max_heart_rate?: number;
  };
}

interface WhoopRecovery {
  cycle_id: number;
  sleep_id: number;
  user_id: number;
  created_at: string;
  updated_at: string;
  score_state: string;
  score?: {
    user_calibrating: boolean;
    recovery_score: number;
    resting_heart_rate: number;
    hrv_rmssd_milli: number;
    spo2_percentage?: number;
    skin_temp_celsius?: number;
  };
}

interface WhoopSleep {
  id: number;
  user_id: number;
  created_at: string;
  updated_at: string;
  start: string;
  end: string;
  timezone_offset: string;
  nap: boolean;
  score_state: string;
  score?: {
    stage_summary?: {
      total_in_bed_time_milli: number;
      total_awake_time_milli: number;
      total_no_data_time_milli: number;
      total_light_sleep_time_milli: number;
      total_slow_wave_sleep_time_milli: number;
      total_rem_sleep_time_milli: number;
      sleep_cycle_count: number;
      disturbance_count: number;
    };
    sleep_needed?: {
      baseline_milli: number;
      need_from_sleep_debt_milli: number;
      need_from_recent_strain_milli: number;
      need_from_recent_nap_milli: number;
    };
    respiratory_rate?: number;
    sleep_performance_percentage?: number;
    sleep_consistency_percentage?: number;
    sleep_efficiency_percentage?: number;
  };
}

interface WhoopWorkout {
  id: number;
  user_id: number;
  created_at: string;
  updated_at: string;
  start: string;
  end: string;
  timezone_offset: string;
  sport_id: number;
  score_state: string;
  score?: {
    strain: number;
    average_heart_rate: number;
    max_heart_rate: number;
    kilojoule: number;
    percent_recorded: number;
    distance_meter?: number;
    altitude_gain_meter?: number;
    altitude_change_meter?: number;
    zone_duration?: {
      zone_zero_milli: number;
      zone_one_milli: number;
      zone_two_milli: number;
      zone_three_milli: number;
      zone_four_milli: number;
      zone_five_milli: number;
    };
  };
}

async function fetchWhoopData(endpoint: string, accessToken: string, params: URLSearchParams = new URLSearchParams()) {
  const url = `${WHOOP_API_BASE}${endpoint}?${params.toString()}`;
  console.log(`📡 Fetching WHOOP data from: ${endpoint}`);
  
  const response = await fetch(url, {
    headers: {
      "Authorization": `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`❌ WHOOP API error (${endpoint}):`, response.status, errorText);
    throw new Error(`WHOOP API request failed: ${response.status}`);
  }

  return response.json();
}

async function getDbConnection() {
  return mysql.createConnection({
    host: process.env.RDS_HOST,
    user: process.env.RDS_USER,
    password: process.env.RDS_PASSWORD,
    database: process.env.RDS_DATABASE,
    port: Number(process.env.RDS_PORT) || 3306,
  });
}

export async function POST(request: NextRequest) {
  let connection: mysql.Connection | null = null;
  
  try {
    const body = await request.json();
    const { userId, startDate, endDate } = body;

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    console.log(`🔄 Starting WHOOP data sync for user: ${userId}`);
    console.log(`📅 Date range: ${startDate || "all available"} to ${endDate || "now"}`);

    // Retrieve WHOOP tokens from AWS Secrets Manager
    const tokens = await getWhoopTokens(userId);
    if (!tokens?.accessToken) {
      return NextResponse.json(
        { error: "WHOOP not connected. Please connect your WHOOP account first." },
        { status: 401 }
      );
    }

    const accessToken = tokens.accessToken;

    // Set up date parameters for API calls
    const params = new URLSearchParams();
    if (startDate) params.set("start", startDate);
    if (endDate) params.set("end", endDate);
    params.set("limit", "25"); // WHOOP API pagination limit

    // Fetch all WHOOP data in parallel
    console.log("📊 Fetching WHOOP data from all endpoints...");
    const [cyclesData, recoveryData, sleepData, workoutsData] = await Promise.all([
      fetchWhoopData("/v1/cycle", accessToken, params).catch(err => {
        console.error("Failed to fetch cycles:", err);
        return { records: [] };
      }),
      fetchWhoopData("/v1/recovery", accessToken, params).catch(err => {
        console.error("Failed to fetch recovery:", err);
        return { records: [] };
      }),
      fetchWhoopData("/v1/activity/sleep", accessToken, params).catch(err => {
        console.error("Failed to fetch sleep:", err);
        return { records: [] };
      }),
      fetchWhoopData("/v1/activity/workout", accessToken, params).catch(err => {
        console.error("Failed to fetch workouts:", err);
        return { records: [] };
      }),
    ]);

    console.log(`✅ Fetched ${cyclesData.records?.length || 0} cycles`);
    console.log(`✅ Fetched ${recoveryData.records?.length || 0} recovery records`);
    console.log(`✅ Fetched ${sleepData.records?.length || 0} sleep records`);
    console.log(`✅ Fetched ${workoutsData.records?.length || 0} workouts`);

    // Connect to RDS database
    connection = await getDbConnection();

    // Process and merge data by cycle
    const cycles: WhoopCycle[] = cyclesData.records || [];
    const recoveries: WhoopRecovery[] = recoveryData.records || [];
    const sleeps: WhoopSleep[] = sleepData.records || [];
    
    let recordsInserted = 0;
    let recordsUpdated = 0;

    for (const cycle of cycles) {
      // Find matching recovery and sleep data for this cycle
      const recovery = recoveries.find(r => r.cycle_id === cycle.id);
      const sleep = sleeps.find(s => s.id === recovery?.sleep_id);

      // Transform WHOOP data to RDS schema
      const dbRecord = {
        id: `whoop_${cycle.id}_${userId}`,
        cycle_start_time: cycle.start,
        cycle_end_time: cycle.end || null,
        cycle_timezone: cycle.timezone_offset,
        recovery_score_percent: recovery?.score?.recovery_score || null,
        resting_heart_rate_bpm: recovery?.score?.resting_heart_rate || null,
        heart_rate_variability_ms: recovery?.score?.hrv_rmssd_milli || null,
        skin_temp_celsius: recovery?.score?.skin_temp_celsius || null,
        blood_oxygen_percent: recovery?.score?.spo2_percentage || null,
        day_strain: cycle.score?.strain || null,
        energy_burned_cal: cycle.score?.kilojoule ? Math.round(cycle.score.kilojoule / 4.184) : null,
        max_hr_bpm: cycle.score?.max_heart_rate || null,
        average_hr_bpm: cycle.score?.average_heart_rate || null,
        sleep_onset: sleep?.start || null,
        wake_onset: sleep?.end || null,
        sleep_performance_percent: sleep?.score?.sleep_performance_percentage || null,
        respiratory_rate_rpm: sleep?.score?.respiratory_rate || null,
        asleep_duration_min: sleep?.score?.stage_summary ? Math.round(
          (sleep.score.stage_summary.total_light_sleep_time_milli +
           sleep.score.stage_summary.total_slow_wave_sleep_time_milli +
           sleep.score.stage_summary.total_rem_sleep_time_milli) / 60000
        ) : null,
        in_bed_duration_min: sleep?.score?.stage_summary?.total_in_bed_time_milli 
          ? Math.round(sleep.score.stage_summary.total_in_bed_time_milli / 60000) : null,
        light_sleep_duration_min: sleep?.score?.stage_summary?.total_light_sleep_time_milli
          ? Math.round(sleep.score.stage_summary.total_light_sleep_time_milli / 60000) : null,
        deep_sws_duration_min: sleep?.score?.stage_summary?.total_slow_wave_sleep_time_milli
          ? Math.round(sleep.score.stage_summary.total_slow_wave_sleep_time_milli / 60000) : null,
        rem_duration_min: sleep?.score?.stage_summary?.total_rem_sleep_time_milli
          ? Math.round(sleep.score.stage_summary.total_rem_sleep_time_milli / 60000) : null,
        awake_duration_min: sleep?.score?.stage_summary?.total_awake_time_milli
          ? Math.round(sleep.score.stage_summary.total_awake_time_milli / 60000) : null,
        sleep_need_min: sleep?.score?.sleep_needed?.baseline_milli
          ? Math.round(sleep.score.sleep_needed.baseline_milli / 60000) : null,
        sleep_debt_min: sleep?.score?.sleep_needed?.need_from_sleep_debt_milli
          ? Math.round(sleep.score.sleep_needed.need_from_sleep_debt_milli / 60000) : null,
        sleep_efficiency_percent: sleep?.score?.sleep_efficiency_percentage || null,
        sleep_consistency_percent: sleep?.score?.sleep_consistency_percentage || null,
        created_at: cycle.created_at,
        updated_at: new Date().toISOString(),
      };

      // Insert or update record
      const [existing] = await connection.execute(
        "SELECT id FROM physiological_cycles WHERE id = ?",
        [dbRecord.id]
      ) as any;

      if (existing.length > 0) {
        // Update existing record
        await connection.execute(
          `UPDATE physiological_cycles SET
            cycle_start_time = ?, cycle_end_time = ?, cycle_timezone = ?,
            recovery_score_percent = ?, resting_heart_rate_bpm = ?, heart_rate_variability_ms = ?,
            skin_temp_celsius = ?, blood_oxygen_percent = ?, day_strain = ?,
            energy_burned_cal = ?, max_hr_bpm = ?, average_hr_bpm = ?,
            sleep_onset = ?, wake_onset = ?, sleep_performance_percent = ?,
            respiratory_rate_rpm = ?, asleep_duration_min = ?, in_bed_duration_min = ?,
            light_sleep_duration_min = ?, deep_sws_duration_min = ?, rem_duration_min = ?,
            awake_duration_min = ?, sleep_need_min = ?, sleep_debt_min = ?,
            sleep_efficiency_percent = ?, sleep_consistency_percent = ?, updated_at = ?
           WHERE id = ?`,
          [
            dbRecord.cycle_start_time, dbRecord.cycle_end_time, dbRecord.cycle_timezone,
            dbRecord.recovery_score_percent, dbRecord.resting_heart_rate_bpm, dbRecord.heart_rate_variability_ms,
            dbRecord.skin_temp_celsius, dbRecord.blood_oxygen_percent, dbRecord.day_strain,
            dbRecord.energy_burned_cal, dbRecord.max_hr_bpm, dbRecord.average_hr_bpm,
            dbRecord.sleep_onset, dbRecord.wake_onset, dbRecord.sleep_performance_percent,
            dbRecord.respiratory_rate_rpm, dbRecord.asleep_duration_min, dbRecord.in_bed_duration_min,
            dbRecord.light_sleep_duration_min, dbRecord.deep_sws_duration_min, dbRecord.rem_duration_min,
            dbRecord.awake_duration_min, dbRecord.sleep_need_min, dbRecord.sleep_debt_min,
            dbRecord.sleep_efficiency_percent, dbRecord.sleep_consistency_percent, dbRecord.updated_at,
            dbRecord.id
          ]
        );
        recordsUpdated++;
      } else {
        // Insert new record
        await connection.execute(
          `INSERT INTO physiological_cycles (
            id, cycle_start_time, cycle_end_time, cycle_timezone,
            recovery_score_percent, resting_heart_rate_bpm, heart_rate_variability_ms,
            skin_temp_celsius, blood_oxygen_percent, day_strain,
            energy_burned_cal, max_hr_bpm, average_hr_bpm,
            sleep_onset, wake_onset, sleep_performance_percent,
            respiratory_rate_rpm, asleep_duration_min, in_bed_duration_min,
            light_sleep_duration_min, deep_sws_duration_min, rem_duration_min,
            awake_duration_min, sleep_need_min, sleep_debt_min,
            sleep_efficiency_percent, sleep_consistency_percent,
            created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            dbRecord.id, dbRecord.cycle_start_time, dbRecord.cycle_end_time, dbRecord.cycle_timezone,
            dbRecord.recovery_score_percent, dbRecord.resting_heart_rate_bpm, dbRecord.heart_rate_variability_ms,
            dbRecord.skin_temp_celsius, dbRecord.blood_oxygen_percent, dbRecord.day_strain,
            dbRecord.energy_burned_cal, dbRecord.max_hr_bpm, dbRecord.average_hr_bpm,
            dbRecord.sleep_onset, dbRecord.wake_onset, dbRecord.sleep_performance_percent,
            dbRecord.respiratory_rate_rpm, dbRecord.asleep_duration_min, dbRecord.in_bed_duration_min,
            dbRecord.light_sleep_duration_min, dbRecord.deep_sws_duration_min, dbRecord.rem_duration_min,
            dbRecord.awake_duration_min, dbRecord.sleep_need_min, dbRecord.sleep_debt_min,
            dbRecord.sleep_efficiency_percent, dbRecord.sleep_consistency_percent,
            dbRecord.created_at, dbRecord.updated_at
          ]
        );
        recordsInserted++;
      }
    }

    console.log(`✅ WHOOP data sync completed: ${recordsInserted} inserted, ${recordsUpdated} updated`);

    return NextResponse.json({
      success: true,
      recordsInserted,
      recordsUpdated,
      totalProcessed: recordsInserted + recordsUpdated,
      message: "WHOOP data synced successfully",
    });

  } catch (error: any) {
    console.error("❌ Error syncing WHOOP data:", error);
    return NextResponse.json(
      { error: error.message || "Failed to sync WHOOP data" },
      { status: 500 }
    );
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// GET endpoint for manual sync trigger
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const userId = searchParams.get("userId");
  
  if (!userId) {
    return NextResponse.json({ error: "userId query parameter is required" }, { status: 400 });
  }

  // Sync last 7 days by default
  const endDate = new Date().toISOString();
  const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  // Call POST endpoint internally
  const response = await POST(
    new NextRequest(request.url, {
      method: "POST",
      body: JSON.stringify({ userId, startDate, endDate }),
    })
  );

  return response;
}