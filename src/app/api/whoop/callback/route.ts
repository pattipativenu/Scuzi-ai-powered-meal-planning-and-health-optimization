import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { storeWhoopTokens } from "@/lib/secrets-manager";
import { auth } from "@/lib/auth";
import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";

// Helper function to generate error HTML response
function createErrorResponse(error: string, description?: string) {
  const errorHtml = `
  <!DOCTYPE html>
  <html>
  <head>
    <title>WHOOP Connection Failed</title>
    <style>
      body { font-family: system-ui; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: linear-gradient(135deg, #ef4444, #dc2626); }
      .container { background: white; padding: 2rem; border-radius: 1rem; text-align: center; box-shadow: 0 10px 25px rgba(0,0,0,0.1); max-width: 400px; }
      .error { color: #dc2626; font-size: 3rem; margin-bottom: 1rem; }
      h1 { color: #1f2937; margin-bottom: 1rem; }
      p { color: #6b7280; margin-bottom: 1.5rem; }
      .error-details { background: #f9fafb; padding: 0.75rem; border-radius: 0.5rem; margin-bottom: 1.5rem; font-size: 0.75rem; color: #6b7280; }
      button { background: #1f2937; color: white; border: none; padding: 0.5rem 1.5rem; border-radius: 0.5rem; cursor: pointer; }
      button:hover { background: #374151; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="error">❌</div>
      <h1>Connection Failed</h1>
      <p>${getErrorMessage(error)}</p>
      ${error ? `<div class="error-details">Error: ${error}${description ? ` - ${description}` : ''}</div>` : ''}
      <button onclick="window.close()">Close Window</button>
    </div>
    <script>
      if (window.opener) {
        window.opener.postMessage({
          type: 'WHOOP_AUTH_ERROR',
          error: '${error}',
          description: '${description || ''}',
          timestamp: Date.now()
        }, window.location.origin);
      }
    </script>
  </body>
  </html>`;
  
  return new NextResponse(errorHtml, {
    headers: { 'Content-Type': 'text/html' }
  });
}

function getErrorMessage(errorCode: string) {
  switch (errorCode) {
    case 'access_denied':
      return 'You denied access to your WHOOP account. Please try again if you want to connect.';
    case 'invalid_state':
    case 'state_mismatch':
      return 'Security validation failed. Please try connecting again.';
    case 'token_exchange_failed':
      return 'Failed to complete the connection. Please try again.';
    case 'configuration_error':
      return 'WHOOP integration is not properly configured. Please contact support.';
    case 'authentication_required':
      return 'Please sign in to your account first, then try connecting WHOOP.';
    case 'missing_parameters':
      return 'Missing required parameters. Please try connecting again.';
    default:
      return 'Something went wrong while connecting to WHOOP. Please try again.';
  }
}

// Add helper function to trigger backfill
async function triggerBackfill(userId: string) {
  try {
    console.log("🔄 Triggering automatic backfill for user:", userId);
    
    // Fetch last 90 days of data on first connection
    const endDate = new Date().toISOString();
    const startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
    
    // Trigger sync in the background (don't await)
    fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/whoop/sync-data`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, startDate, endDate }),
    }).catch(err => {
      console.error("❌ Background backfill failed:", err);
    });
    
    console.log("✅ Backfill triggered in background");
  } catch (error) {
    console.error("❌ Failed to trigger backfill:", error);
  }
}

export async function GET(request: NextRequest) {
  console.log("🔄 WHOOP Callback started");
  
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");

    console.log("📥 Callback parameters:", { code: code?.substring(0, 20) + "...", state: state?.substring(0, 20) + "...", error });

    // Handle OAuth errors
    if (error) {
      const errorDescription = searchParams.get("error_description");
      console.error("❌ WHOOP OAuth Error:", error, errorDescription);
      return createErrorResponse(error, errorDescription);
    }

    // Validate required parameters
    if (!code || !state) {
      console.error("❌ Missing code or state parameter");
      return createErrorResponse('missing_parameters');
    }

    // Validate state
    const stateCookie = request.cookies.get("whoop_oauth_state");
    if (!stateCookie || stateCookie.value !== state) {
      console.error("❌ State validation failed");
      return createErrorResponse('state_mismatch');
    }

    console.log("✅ State validation passed");

    // Get credentials
    const clientId = process.env.WHOOP_CLIENT_ID;
    const clientSecret = process.env.WHOOP_CLIENT_SECRET;
    const redirectUri = `${request.nextUrl.origin}/api/whoop/callback`;

    if (!clientId || !clientSecret) {
      console.error("❌ Missing WHOOP credentials");
      return createErrorResponse('configuration_error');
    }

    console.log("🔄 Exchanging code for tokens...");

    // Exchange code for tokens
    const tokenResponse = await fetch("https://api.prod.whoop.com/oauth/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error("❌ Token exchange failed:", errorData);
      return createErrorResponse('token_exchange_failed', errorData);
    }

    const tokenData = await tokenResponse.json();
    const { access_token, refresh_token, expires_in } = tokenData;

    console.log("✅ Token exchange successful");

    // Store tokens in AWS Secrets Manager for data sync
    try {
      await storeWhoopTokens(whoopUserId, {
        accessToken: access_token,
        refreshToken: refresh_token,
        expiresAt: new Date(Date.now() + (expires_in * 1000)).toISOString(),
      });
      console.log("✅ WHOOP tokens stored in AWS Secrets Manager");
    } catch (error) {
      console.error("❌ Failed to store WHOOP tokens:", error);
    }

    // Get WHOOP user profile
    let whoopUserId = "unknown";
    try {
      console.log("🔄 Fetching WHOOP profile...");
      const profileResponse = await fetch("https://api.prod.whoop.com/developer/v1/user/profile/basic", {
        headers: { "Authorization": `Bearer ${access_token}` },
      });

      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        whoopUserId = profileData.user_id.toString();
        console.log("✅ WHOOP User ID:", whoopUserId);
      }
    } catch (profileError) {
      console.error("❌ Profile fetch failed:", profileError);
    }

    // Create success response with cookies
    const successHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>WHOOP Connected</title>
      <style>
        body { font-family: system-ui; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: linear-gradient(135deg, #10b981, #059669); }
        .container { background: white; padding: 2rem; border-radius: 1rem; text-align: center; box-shadow: 0 10px 25px rgba(0,0,0,0.1); }
        .success { color: #059669; font-size: 3rem; margin-bottom: 1rem; }
        h1 { color: #1f2937; margin-bottom: 1rem; }
        p { color: #6b7280; margin-bottom: 1.5rem; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="success">✅</div>
        <h1>WHOOP Connected Successfully!</h1>
        <p>User ID: ${whoopUserId}</p>
        <p>Your WHOOP account has been connected and your data is now available.</p>
        <button onclick="window.close()" style="padding: 0.5rem 1rem; background: #059669; color: white; border: none; border-radius: 0.5rem; cursor: pointer;">Close Window</button>
      </div>
      <script>
        // Send success message to parent window
        if (window.opener) {
          window.opener.postMessage({
            type: 'WHOOP_AUTH_SUCCESS',
            userId: '${whoopUserId}',
            timestamp: Date.now()
          }, window.location.origin);
        }
        // Auto-close after 5 seconds
        setTimeout(() => window.close(), 5000);
      </script>
    </body>
    </html>`;
    
    const response = new NextResponse(successHtml, {
      headers: { 'Content-Type': 'text/html' }
    });
    
    // Set cookies
    response.cookies.set("whoop_access_token", access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: expires_in || 3600,
      path: "/",
    });

    if (refresh_token) {
      response.cookies.set("whoop_refresh_token", refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 30 * 24 * 60 * 60,
        path: "/",
      });
    }

    response.cookies.set("whoop_user_id", whoopUserId, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60,
      path: "/",
    });

    // Clear state cookie
    response.cookies.delete("whoop_oauth_state");

    // Trigger automatic data sync for the last 90 days
    await triggerBackfill(whoopUserId);

    console.log("✅ WHOOP callback completed successfully");
    return response;

  } catch (error) {
    console.error("❌ Callback error:", error);
    return createErrorResponse('callback_error', error instanceof Error ? error.message : 'Unknown error');
  }
}