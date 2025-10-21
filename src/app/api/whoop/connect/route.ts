import { NextRequest, NextResponse } from "next/server";
import { SignJWT } from "jose";
import { randomBytes } from "crypto";
import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";

export async function GET(request: NextRequest) {
  try {
    console.log("🚀 WHOOP Connect API called");

    // Get credentials from secrets manager
    const { getAppSecrets } = await import('@/lib/secrets-manager');
    const secrets = await getAppSecrets();
    
    const clientId = secrets.whoop.clientId;
    const stateSecret = secrets.whoop.oauthStateSecret;
    
    if (!clientId || !stateSecret) {
      console.error("❌ Missing WHOOP credentials");
      return NextResponse.json(
        { error: "WHOOP credentials not configured" },
        { status: 500 }
      );
    }

    // Generate simple state token
    const state = randomBytes(32).toString('hex');
    
    // Determine the correct redirect URI based on environment
    const currentOrigin = request.nextUrl.origin;
    let redirectUri = `${currentOrigin}/api/whoop/callback`;

    // If we have multiple redirect URIs configured, use the matching one
    if (secrets.whoop.redirectUri && secrets.whoop.redirectUri.includes(',')) {
      const availableUris = secrets.whoop.redirectUri.split(',').map(uri => uri.trim());
      const matchingUri = availableUris.find(uri => uri.startsWith(currentOrigin));
      if (matchingUri) {
        redirectUri = matchingUri;
      }
    } else if (secrets.whoop.redirectUri) {
      redirectUri = secrets.whoop.redirectUri;
    }
    
    console.log("🎯 Using redirect URI:", redirectUri);
    console.log("🌍 Current origin:", currentOrigin);

    console.log("🔍 WHOOP OAuth Configuration:");
    console.log("  Client ID:", clientId);
    console.log("  Redirect URI:", redirectUri);
    console.log("  State:", state);

    // Build OAuth URL
    const authUrl = new URL("https://api.prod.whoop.com/oauth/oauth2/auth");
    authUrl.searchParams.set("client_id", clientId);
    authUrl.searchParams.set("redirect_uri", redirectUri);
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("scope", "offline read:profile read:recovery read:cycles read:sleep read:workout");
    authUrl.searchParams.set("state", state);

    console.log("🔗 OAuth URL:", authUrl.toString());

    // Create response
    const response = NextResponse.json({ 
      authUrl: authUrl.toString(),
      redirectUri: redirectUri,
      state: state
    });
    
    // Store state in cookie for validation
    response.cookies.set("whoop_oauth_state", state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 600, // 10 minutes
      path: "/",
    });
    
    console.log("🍪 State cookie set:", state);

    console.log("✅ OAuth URL generated and state stored");
    return response;

  } catch (error) {
    console.error("❌ Error in WHOOP connect:", error);
    return NextResponse.json(
      { error: "Failed to generate authorization URL" },
      { status: 500 }
    );
  }
}