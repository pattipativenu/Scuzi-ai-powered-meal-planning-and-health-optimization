import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { auth } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const session = await auth.api.getSession({ headers: request.headers });
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: "User not authenticated" }, { status: 401 });
    }

    console.log(`🔌 Disconnecting WHOOP for user: ${userId}`);

    const cookieStore = await cookies();
    
    // Create response to clear cookies
    const response = NextResponse.json({ 
      success: true, 
      message: "WHOOP disconnected successfully",
      userId: userId
    });

    // Clear all WHOOP-related cookies
    response.cookies.delete("whoop_access_token");
    response.cookies.delete("whoop_refresh_token");
    response.cookies.delete("whoop_user_id");

    // Note: We don't delete the stored tokens from AWS Secrets Manager
    // in case the user wants to reconnect later. The tokens will be
    // refreshed automatically when they reconnect.

    console.log(`✅ WHOOP disconnected successfully for user: ${userId}`);

    return response;
  } catch (error) {
    console.error("Error disconnecting WHOOP:", error);
    return NextResponse.json(
      { error: "Failed to disconnect WHOOP" },
      { status: 500 }
    );
  }
}