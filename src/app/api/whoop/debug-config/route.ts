import { NextResponse } from "next/server";

export async function GET() {
  try {
    console.log("🔍 Debugging WHOOP configuration...");
    
    // Check environment variables
    const envVars = {
      APP_SECRETS_ARN: process.env.APP_SECRETS_ARN,
      AWS_REGION: process.env.AWS_REGION,
      NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    };
    
    console.log("Environment variables:", envVars);
    
    // Try to get secrets
    let secretsError = null;
    let secretsData = null;
    
    try {
      const { getAppSecrets } = await import('@/lib/secrets-manager');
      secretsData = await getAppSecrets();
      console.log("✅ Secrets retrieved successfully");
    } catch (error) {
      secretsError = error instanceof Error ? error.message : String(error);
      console.error("❌ Failed to get secrets:", secretsError);
    }
    
    return NextResponse.json({
      environment: envVars,
      secretsError,
      hasSecrets: !!secretsData,
      whoopConfigured: !!(secretsData?.whoop?.clientId && secretsData?.whoop?.clientSecret),
    });
    
  } catch (error) {
    console.error("❌ Debug error:", error);
    return NextResponse.json(
      { error: "Debug failed", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}