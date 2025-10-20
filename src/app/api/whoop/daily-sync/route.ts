import { NextRequest, NextResponse } from "next/server";
import { getWhoopTokens } from "@/lib/secrets-manager";
import mysql from "mysql2/promise";

// This endpoint can be called by a cron job or scheduled task
export async function POST(request: NextRequest) {
  let connection: mysql.Connection | null = null;
  
  try {
    console.log("🚀 Starting daily WHOOP sync for all connected users...");

    // Connect to database to get all users with WHOOP connections
    connection = await mysql.createConnection({
      host: process.env.RDS_HOST,
      user: process.env.RDS_USERNAME,
      password: process.env.RDS_PASSWORD,
      database: "WHOOPHEALTHDATA", // Database name is uppercase
      port: Number(process.env.RDS_PORT) || 3306,
    });

    // Get all unique user IDs from whoop_health_data table
    const [users] = await connection.execute(
      "SELECT DISTINCT userId FROM whoop_health_data ORDER BY userId"
    ) as any;

    console.log(`📊 Found ${users.length} users with WHOOP data`);

    if (users.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No WHOOP-connected users found",
        usersSynced: 0,
        totalUsers: 0
      });
    }

    let successfulSyncs = 0;
    let failedSyncs = 0;
    const syncResults = [];

    // Sync data for each user
    for (const user of users) {
      const userId = user.userId;
      
      try {
        console.log(`🔄 Syncing data for user: ${userId}`);

        // Check if user has valid WHOOP tokens
        const tokens = await getWhoopTokens(userId);
        if (!tokens?.accessToken) {
          console.log(`⚠️ No valid tokens for user ${userId}, skipping...`);
          failedSyncs++;
          syncResults.push({
            userId,
            success: false,
            error: "No valid WHOOP tokens"
          });
          continue;
        }

        // Get the last sync date for this user
        const [lastSync] = await connection.execute(
          "SELECT MAX(date) as lastDate FROM whoop_health_data WHERE userId = ?",
          [userId]
        ) as any;

        const lastSyncDate = lastSync[0]?.lastDate;
        let startDate: string;

        if (lastSyncDate) {
          // Sync from the day after last sync
          const nextDay = new Date(lastSyncDate);
          nextDay.setDate(nextDay.getDate() + 1);
          startDate = nextDay.toISOString();
        } else {
          // First sync - get last 90 days
          const ninetyDaysAgo = new Date();
          ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
          startDate = ninetyDaysAgo.toISOString();
        }

        const endDate = new Date().toISOString();

        console.log(`📅 Syncing ${userId} from ${startDate.split('T')[0]} to ${endDate.split('T')[0]}`);

        // Call the sync API internally
        const syncResponse = await fetch(`${request.nextUrl.origin}/api/whoop/sync-data`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, startDate, endDate }),
        });

        if (syncResponse.ok) {
          const syncData = await syncResponse.json();
          console.log(`✅ Sync completed for user ${userId}: ${syncData.totalProcessed} records`);
          successfulSyncs++;
          syncResults.push({
            userId,
            success: true,
            recordsProcessed: syncData.totalProcessed,
            recordsInserted: syncData.recordsInserted,
            recordsUpdated: syncData.recordsUpdated
          });
        } else {
          const errorData = await syncResponse.json();
          console.error(`❌ Sync failed for user ${userId}:`, errorData.error);
          failedSyncs++;
          syncResults.push({
            userId,
            success: false,
            error: errorData.error
          });
        }

        // Add small delay between users to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (userError) {
        console.error(`❌ Error syncing user ${userId}:`, userError);
        failedSyncs++;
        syncResults.push({
          userId,
          success: false,
          error: userError instanceof Error ? userError.message : "Unknown error"
        });
      }
    }

    console.log(`✅ WHOOP Daily Sync Completed`);
    console.log(`📊 Stats: ${successfulSyncs}/${users.length} users synced successfully`);

    return NextResponse.json({
      success: true,
      message: "Daily sync completed",
      totalUsers: users.length,
      usersSynced: successfulSyncs,
      usersFailed: failedSyncs,
      syncResults: syncResults
    });

  } catch (error) {
    console.error("❌ Error in daily WHOOP sync:", error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        message: "Daily sync failed"
      },
      { status: 500 }
    );
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// GET endpoint for manual trigger or health check
export async function GET(request: NextRequest) {
  // Verify authorization for manual triggers
  const authHeader = request.headers.get("authorization");
  const expectedToken = process.env.WHOOP_SYNC_TOKEN || "whoop-sync-secret-2024";
  
  if (authHeader !== `Bearer ${expectedToken}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Call POST endpoint
  return POST(request);
}