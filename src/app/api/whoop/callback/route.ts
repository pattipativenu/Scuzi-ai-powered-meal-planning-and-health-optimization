import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

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

    // Redirect to success page with tokens in URL fragment
    const successUrl = new URL("/connect/success", request.url);
    successUrl.hash = `access_token=${access_token}&refresh_token=${refresh_token || ""}&expires_in=${expires_in}`;
    
    const response = NextResponse.redirect(successUrl);
    
    // Clear state cookie after successful validation
    response.cookies.delete("whoop_oauth_state");

    // Store tokens in httpOnly cookies for security
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

    return response;
  } catch (error) {
    console.error("❌ Error in WHOOP callback:", error);
    return NextResponse.redirect(
      new URL("/connect/error?error=callback_error", request.url)
    );
  }
}