import { NextRequest, NextResponse } from "next/server";
import { SignJWT } from "jose";
import { randomBytes } from "crypto";

export async function GET(request: NextRequest) {
  try {
    // Use environment variables instead of AWS Secrets Manager
    const clientId = process.env.WHOOP_CLIENT_ID;
    const stateSecret = process.env.OAUTH_STATE_SECRET;

    if (!clientId || !stateSecret) {
      console.error("Missing WHOOP credentials in environment variables");
      return NextResponse.json(
        { error: "WHOOP credentials not configured" },
        { status: 500 }
      );
    }

    // Generate cryptographically secure nonce (16 bytes = 32 hex chars)
    const nonce = randomBytes(16).toString("hex");
    const timestamp = Date.now();

    // Create self-contained JWT state token
    const secret = new TextEncoder().encode(stateSecret);
    const stateToken = await new SignJWT({ 
      nonce, 
      timestamp,
      iss: "scuzi-whoop-oauth"
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("10m") // State expires in 10 minutes
      .sign(secret);

    // Use local callback URL instead of AWS Lambda
    const redirectUri = `${request.nextUrl.origin}/api/whoop/callback`;

    console.log("🔍 WHOOP OAuth Flow Initiated:");
    console.log("Client ID:", clientId);
    console.log("Redirect URI:", redirectUri);
    console.log("⚠️  IMPORTANT: Register this EXACT URL in WHOOP Developer Portal:");
    console.log("   ", redirectUri);
    console.log("State JWT generated (length):", stateToken.length);

    const authUrl = new URL("https://api.prod.whoop.com/oauth/oauth2/auth");
    authUrl.searchParams.append("client_id", clientId);
    authUrl.searchParams.append("redirect_uri", redirectUri);
    authUrl.searchParams.append("response_type", "code");
    authUrl.searchParams.append("scope", "read:profile read:recovery read:cycles read:sleep read:workout");
    authUrl.searchParams.append("state", stateToken); // Use JWT as state

    // Create response with auth URL AND redirect URI for debugging
    const response = NextResponse.json({ 
      authUrl: authUrl.toString(),
      redirectUri: redirectUri, // Include for client-side verification
      message: `Make sure this redirect URI is registered in WHOOP Developer Portal: ${redirectUri}`
    });
    
    // Store state token in httpOnly cookie for CSRF protection
    response.cookies.set("whoop_oauth_state", stateToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 600, // 10 minutes
      path: "/",
    });

    console.log("📤 OAuth URL generated successfully");
    console.log("🔒 State token stored in cookie for validation");

    return response;
  } catch (error) {
    console.error("Error generating WHOOP auth URL:", error);
    return NextResponse.json(
      { error: "Failed to generate authorization URL" },
      { status: 500 }
    );
  }
}