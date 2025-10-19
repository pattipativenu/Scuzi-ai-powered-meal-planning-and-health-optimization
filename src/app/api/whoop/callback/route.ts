import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { storeWhoopTokens } from "@/lib/secrets-manager";
import { auth } from "@/lib/auth";

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
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");

    // Handle OAuth errors
    if (error) {
      const errorDescription = searchParams.get("error_description");
      console.error("❌ WHOOP OAuth Error:", error, errorDescription);
      return NextResponse.redirect(
        new URL(`/connect/error?error=${encodeURIComponent(error)}&description=${encodeURIComponent(errorDescription || "")}`, request.url)
      );
    }

    // Validate required parameters
    if (!code || !state) {
      console.error("❌ Missing code or state parameter");
      return NextResponse.redirect(
        new URL("/connect/error?error=missing_parameters", request.url)
      );
    }

    // Retrieve and validate state from cookie
    const stateCookie = request.cookies.get("whoop_oauth_state");
    if (!stateCookie) {
      console.error("❌ State cookie not found - potential CSRF attack");
      return NextResponse.redirect(
        new URL("/connect/error?error=invalid_state", request.url)
      );
    }

    // Verify state JWT token
    const stateSecret = process.env.OAUTH_STATE_SECRET;
    if (!stateSecret) {
      console.error("❌ OAuth state secret not configured");
      return NextResponse.redirect(
        new URL("/connect/error?error=configuration_error", request.url)
      );
    }

    // Validate state matches the cookie
    if (stateCookie.value !== state) {
      console.error("❌ State mismatch - potential CSRF attack");
      return NextResponse.redirect(
        new URL("/connect/error?error=state_mismatch", request.url)
      );
    }

    // Verify JWT signature and expiration
    try {
      const secret = new TextEncoder().encode(stateSecret);
      await jwtVerify(state, secret);
      console.log("✅ State JWT validation successful");
    } catch (jwtError) {
      console.error("❌ State JWT verification failed:", jwtError);
      return NextResponse.redirect(
        new URL("/connect/error?error=invalid_state_token", request.url)
      );
    }

    // Get authenticated user from session
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user?.id) {
      console.error("❌ User not authenticated");
      return NextResponse.redirect(
        new URL("/connect/error?error=authentication_required", request.url)
      );
    }

    const userId = session.user.id;
    console.log("✅ Authenticated user ID:", userId);

    // Use environment variables for credentials
    const clientId = process.env.WHOOP_CLIENT_ID;
    const clientSecret = process.env.WHOOP_CLIENT_SECRET;
    const redirectUri = `${request.nextUrl.origin}/api/whoop/callback`;

    if (!clientId || !clientSecret) {
      console.error("❌ Missing WHOOP credentials in environment variables");
      return NextResponse.redirect(
        new URL("/connect/error?error=configuration_error", request.url)
      );
    }

    console.log("🔍 WHOOP Token Exchange:");
    console.log("Client ID:", clientId);
    console.log("Redirect URI:", redirectUri);
    console.log("Authorization Code:", code);

    // Exchange authorization code for access token
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
      console.error("❌ WHOOP token exchange failed:", errorData);
      return NextResponse.redirect(
        new URL("/connect/error?error=token_exchange_failed", request.url)
      );
    }

    const tokenData = await tokenResponse.json();
    const { access_token, refresh_token, expires_in } = tokenData;

    console.log("✅ WHOOP token exchange successful");

    // Store tokens in AWS Secrets Manager indexed by userId
    try {
      await storeWhoopTokens(userId, {
        accessToken: access_token,
        refreshToken: refresh_token,
        expiresAt: Date.now() + (expires_in * 1000),
        userId,
      });
      console.log("✅ Tokens stored in AWS Secrets Manager for user:", userId);
      
      // Trigger automatic backfill of historical data
      triggerBackfill(userId);
    } catch (secretsError) {
      console.error("❌ Failed to store tokens in Secrets Manager:", secretsError);
      // Continue anyway - tokens still in cookies as backup
    }

    // Redirect to success page with tokens in URL fragment
    const successUrl = new URL("/connect/success", request.url);
    successUrl.hash = `access_token=${access_token}&refresh_token=${refresh_token || ""}&expires_in=${expires_in}`;
    
    const response = NextResponse.redirect(successUrl);
    
    // Clear state cookie after successful validation
    response.cookies.delete("whoop_oauth_state");

    // Store tokens in httpOnly cookies for immediate frontend access
    response.cookies.set("whoop_access_token", access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: expires_in,
      path: "/",
    });

    if (refresh_token) {
      response.cookies.set("whoop_refresh_token", refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 30 * 24 * 60 * 60, // 30 days
        path: "/",
      });
    }

    // Store userId in cookie for easy frontend access
    response.cookies.set("whoop_user_id", userId, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("❌ Error in WHOOP callback:", error);
    return NextResponse.redirect(
      new URL("/connect/error?error=callback_error", request.url)
    );
  }
}