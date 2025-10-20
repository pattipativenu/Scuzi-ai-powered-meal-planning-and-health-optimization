import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getWhoopTokens } from "@/lib/secrets-manager";
import { auth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    // Get user from session
    const session = await auth.api.getSession({ headers: request.headers });
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ 
        connected: false, 
        error: "User not authenticated" 
      }, { status: 401 });
    }

    // Check for tokens in multiple places for cross-device consistency
    const cookieStore = await cookies();
    const accessTokenCookie = cookieStore.get("whoop_access_token")?.value;
    
    // Also check AWS Secrets Manager for stored tokens
    let secretsTokens = null;
    try {
      secretsTokens = await getWhoopTokens(userId);
    } catch (error) {
      console.log("No tokens found in Secrets Manager for user:", userId);
    }

    const hasValidToken = accessTokenCookie || secretsTokens?.accessToken;

    if (!hasValidToken) {
      return NextResponse.json({ 
        connected: false,
        userId: userId 
      });
    }

    // Test the connection by making a simple API call
    const testToken = accessTokenCookie || secretsTokens?.accessToken;
    
    try {
      const testResponse = await fetch("https://api.prod.whoop.com/developer/v1/user/profile/basic", {
        headers: { Authorization: `Bearer ${testToken}` },
      });

      if (testResponse.ok) {
        const profile = await testResponse.json();
        return NextResponse.json({ 
          connected: true,
          userId: userId,
          profile: {
            firstName: profile.first_name,
            lastName: profile.last_name,
            email: profile.email
          }
        });
      } else {
        // Token is invalid, clean up
        const response = NextResponse.json({ 
          connected: false,
          userId: userId,
          error: "Token expired or invalid"
        });
        
        // Clear invalid cookies
        response.cookies.delete("whoop_access_token");
        response.cookies.delete("whoop_refresh_token");
        
        return response;
      }
    } catch (error) {
      console.error("Error testing WHOOP connection:", error);
      return NextResponse.json({ 
        connected: false,
        userId: userId,
        error: "Connection test failed"
      });
    }

  } catch (error) {
    console.error("Error checking WHOOP connection status:", error);
    return NextResponse.json({ 
      connected: false,
      error: "Failed to check connection status"
    }, { status: 500 });
  }
}