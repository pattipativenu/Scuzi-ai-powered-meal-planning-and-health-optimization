/**
 * AWS Lambda Function: Daily WHOOP Data Sync
 * 
 * Triggered by EventBridge cron (runs daily at 6 AM UTC)
 * Fetches latest WHOOP data for all connected users
 * Handles token refresh automatically
 * Logs all operations to CloudWatch
 */

import { SecretsManagerClient, GetSecretValueCommand, ListSecretsCommand } from "@aws-sdk/client-secrets-manager";

const secretsClient = new SecretsManagerClient({ region: process.env.AWS_REGION || "us-east-1" });

interface WhoopTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  userId: string;
}

interface SyncResponse {
  success: boolean;
  recordsInserted?: number;
  recordsUpdated?: number;
  totalProcessed?: number;
  error?: string;
}

// Fetch all WHOOP tokens from Secrets Manager
async function getAllWhoopUsers(): Promise<string[]> {
  console.log("📋 Fetching all WHOOP-connected users from Secrets Manager...");
  
  const userIds: string[] = [];
  let nextToken: string | undefined;

  do {
    const command = new ListSecretsCommand({
      Filters: [
        {
          Key: "name",
          Values: ["whoop-tokens/"]
        }
      ],
      NextToken: nextToken
    });

    const response = await secretsClient.send(command);
    
    if (response.SecretList) {
      for (const secret of response.SecretList) {
        if (secret.Name?.startsWith("whoop-tokens/")) {
          const userId = secret.Name.replace("whoop-tokens/", "");
          userIds.push(userId);
        }
      }
    }

    nextToken = response.NextToken;
  } while (nextToken);

  console.log(`✅ Found ${userIds.length} WHOOP-connected users`);
  return userIds;
}

// Get WHOOP tokens for a specific user
async function getWhoopTokens(userId: string): Promise<WhoopTokens | null> {
  try {
    const command = new GetSecretValueCommand({
      SecretId: `whoop-tokens/${userId}`
    });

    const response = await secretsClient.send(command);
    if (!response.SecretString) {
      console.error(`❌ No secret string found for user ${userId}`);
      return null;
    }

    return JSON.parse(response.SecretString) as WhoopTokens;
  } catch (error: any) {
    if (error.name === "ResourceNotFoundException") {
      console.log(`⚠️ No WHOOP tokens found for user ${userId}`);
      return null;
    }
    console.error(`❌ Error fetching tokens for user ${userId}:`, error);
    return null;
  }
}

// Refresh WHOOP access token if expired
async function refreshTokenIfNeeded(userId: string, tokens: WhoopTokens): Promise<string> {
  const now = Date.now();
  const bufferTime = 5 * 60 * 1000; // 5 minutes buffer

  // Token still valid
  if (tokens.expiresAt > now + bufferTime) {
    console.log(`✅ Token still valid for user ${userId}`);
    return tokens.accessToken;
  }

  console.log(`🔄 Refreshing expired token for user ${userId}...`);

  // Get WHOOP credentials from Secrets Manager
  const credsCommand = new GetSecretValueCommand({
    SecretId: process.env.WHOOP_SECRETS_ID || "whoop/credentials"
  });
  
  const credsResponse = await secretsClient.send(credsCommand);
  if (!credsResponse.SecretString) {
    throw new Error("WHOOP credentials not found in Secrets Manager");
  }

  const creds = JSON.parse(credsResponse.SecretString);
  const { client_id, client_secret } = creds;

  // Refresh token with WHOOP
  const response = await fetch("https://api.prod.whoop.com/oauth/oauth2/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: tokens.refreshToken,
      client_id,
      client_secret,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`❌ Token refresh failed for user ${userId}:`, errorText);
    throw new Error(`Token refresh failed: ${response.status}`);
  }

  const tokenData = await response.json();
  const { access_token, refresh_token, expires_in } = tokenData;

  // Update tokens in Secrets Manager
  const { PutSecretValueCommand } = await import("@aws-sdk/client-secrets-manager");
  const updatedTokens: WhoopTokens = {
    accessToken: access_token,
    refreshToken: refresh_token || tokens.refreshToken,
    expiresAt: Date.now() + (expires_in * 1000),
    userId,
  };

  await secretsClient.send(new PutSecretValueCommand({
    SecretId: `whoop-tokens/${userId}`,
    SecretString: JSON.stringify(updatedTokens),
  }));

  console.log(`✅ Token refreshed successfully for user ${userId}`);
  return access_token;
}

// Sync WHOOP data for a single user
async function syncUserData(userId: string): Promise<SyncResponse> {
  try {
    console.log(`🔄 Syncing data for user: ${userId}`);

    // Get tokens from Secrets Manager
    const tokens = await getWhoopTokens(userId);
    if (!tokens) {
      return {
        success: false,
        error: "No tokens found"
      };
    }

    // Refresh token if needed
    await refreshTokenIfNeeded(userId, tokens);

    // Call sync API endpoint
    const apiUrl = process.env.API_BASE_URL || "https://scuzi.vercel.app";
    const endDate = new Date().toISOString();
    const startDate = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(); // Last 2 days

    const response = await fetch(`${apiUrl}/api/whoop/sync-data`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId,
        startDate,
        endDate,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Sync failed for user ${userId}:`, errorText);
      return {
        success: false,
        error: `API error: ${response.status}`
      };
    }

    const result = await response.json();
    console.log(`✅ Sync completed for user ${userId}:`, result);
    
    return {
      success: true,
      recordsInserted: result.recordsInserted || 0,
      recordsUpdated: result.recordsUpdated || 0,
      totalProcessed: result.totalProcessed || 0,
    };

  } catch (error: any) {
    console.error(`❌ Error syncing user ${userId}:`, error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Lambda handler
export const handler = async (event: any) => {
  console.log("🚀 WHOOP Daily Sync Lambda Started");
  console.log("📅 Event:", JSON.stringify(event, null, 2));

  const startTime = Date.now();
  let totalUsers = 0;
  let successCount = 0;
  let failureCount = 0;
  let totalRecordsInserted = 0;
  let totalRecordsUpdated = 0;

  try {
    // Get all WHOOP-connected users
    const userIds = await getAllWhoopUsers();
    totalUsers = userIds.length;

    if (totalUsers === 0) {
      console.log("⚠️ No WHOOP-connected users found");
      return {
        statusCode: 200,
        body: JSON.stringify({
          message: "No users to sync",
          totalUsers: 0,
        }),
      };
    }

    // Sync data for each user (with rate limiting)
    const results: SyncResponse[] = [];
    
    for (const userId of userIds) {
      const result = await syncUserData(userId);
      results.push(result);

      if (result.success) {
        successCount++;
        totalRecordsInserted += result.recordsInserted || 0;
        totalRecordsUpdated += result.recordsUpdated || 0;
      } else {
        failureCount++;
      }

      // Rate limiting: wait 1 second between users to avoid overwhelming WHOOP API
      if (userIds.indexOf(userId) < userIds.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    const duration = Date.now() - startTime;

    console.log("✅ WHOOP Daily Sync Completed");
    console.log(`📊 Stats: ${successCount}/${totalUsers} users synced successfully`);
    console.log(`📝 Records: ${totalRecordsInserted} inserted, ${totalRecordsUpdated} updated`);
    console.log(`⏱️ Duration: ${duration}ms`);

    // Return summary
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "WHOOP daily sync completed",
        totalUsers,
        successCount,
        failureCount,
        totalRecordsInserted,
        totalRecordsUpdated,
        durationMs: duration,
        timestamp: new Date().toISOString(),
      }),
    };

  } catch (error: any) {
    console.error("❌ Fatal error in WHOOP daily sync:", error);
    
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "WHOOP daily sync failed",
        error: error.message,
        totalUsers,
        successCount,
        failureCount,
      }),
    };
  }
};