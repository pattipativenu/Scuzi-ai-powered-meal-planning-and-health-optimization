import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  console.log("🔄 WHOOP Token Refresh started");
  
  try {
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get("whoop_refresh_token")?.value;

    if (!refreshToken) {
      console.error("❌ No refresh token found");
      return NextResponse.json({ error: "No refresh token available" }, { status: 401 });
    }

    // Get credentials from secrets manager
    const { getAppSecrets } = await import('@/lib/secrets-manager');
    const secrets = await getAppSecrets();
    
    const clientId = secrets.whoop.clientId;
    const clientSecret = secrets.whoop.clientSecret;

    if (!clientId || !clientSecret) {
      console.error("❌ Missing WHOOP credentials");
      return NextResponse.json({ error: "WHOOP credentials not configured" }, { status: 500 });
    }

    console.log("🔄 Refreshing WHOOP tokens...");

    // Prepare refresh token parameters as per WHOOP documentation
    const refreshParams = {
      grant_type: 'refresh_token',
      client_id: clientId,
      client_secret: clientSecret,
      scope: 'offline',
      refresh_token: refreshToken,
    };

    const body = new URLSearchParams(refreshParams);
    const headers = {
      'Content-Type': 'application/x-www-form-urlencoded',
    };

    const refreshTokenResponse = await fetch(
      'https://api.prod.whoop.com/oauth/oauth2/token',
      {
        body,
        headers,
        method: 'POST',
      }
    );

    if (!refreshTokenResponse.ok) {
      const errorData = await refreshTokenResponse.text();
      console.error("❌ Token refresh failed:", errorData);
      return NextResponse.json({ error: "Token refresh failed" }, { status: 401 });
    }

    const tokenData = await refreshTokenResponse.json();
    const { access_token, refresh_token: new_refresh_token, expires_in } = tokenData;

    console.log("✅ Token refresh successful");

    // Create response and update cookies
    const response = NextResponse.json({ 
      success: true, 
      expires_in,
      refreshed_at: new Date().toISOString()
    });

    // Set new access token
    response.cookies.set("whoop_access_token", access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: expires_in || 3600,
      path: "/",
    });

    // Update refresh token if a new one was provided
    if (new_refresh_token) {
      response.cookies.set("whoop_refresh_token", new_refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 30 * 24 * 60 * 60, // 30 days
        path: "/",
      });
    }

    console.log("✅ WHOOP token refresh completed successfully");
    return response;

  } catch (error) {
    console.error("❌ Token refresh error:", error);
    return NextResponse.json({ 
      error: "Token refresh failed", 
      details: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 });
  }
}