import { NextRequest, NextResponse } from "next/server";
import { storeAppSecrets, getAppSecrets } from "@/lib/secrets-manager";
import type { AppSecrets } from "@/lib/secrets-manager";

export async function POST(request: NextRequest) {
  try {
    const { clientId, clientSecret } = await request.json();
    
    if (!clientId || !clientSecret) {
      return NextResponse.json(
        { error: "Missing clientId or clientSecret" },
        { status: 400 }
      );
    }
    
    console.log("🚀 Setting up WHOOP secrets...");
    
    // Multiple redirect URIs (as you mentioned)
    const redirectUris = [
      'https://3000-a76555f4-e793-4fd7-af30-e9e40c9b2f12.orchids.page/api/whoop/callback',
      'https://scuzi.vercel.app/api/whoop/callback', 
      'http://localhost:3000/api/whoop/callback',
      'http://localhost:3001/api/whoop/callback',
      'http://localhost:3003/api/whoop/callback',
      'http://localhost:3006/api/whoop/callback'
    ].join(', ');
    
    // Try to get existing secrets first
    let existingSecrets: AppSecrets;
    try {
      existingSecrets = await getAppSecrets();
      console.log('✅ Found existing secrets, updating WHOOP configuration...');
    } catch (error) {
      console.log('ℹ️ No existing secrets found, creating new ones...');
      // Create minimal secrets structure
      existingSecrets = {
        aws: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
          region: process.env.AWS_REGION || 'us-east-1',
        },
        database: {
          rds: {
            host: process.env.RDS_HOST || '',
            port: parseInt(process.env.RDS_PORT || '3306'),
            user: process.env.RDS_USER || '',
            password: process.env.RDS_PASSWORD || '',
            database: process.env.RDS_DATABASE || '',
          },
          turso: {
            connectionUrl: process.env.TURSO_CONNECTION_URL || '',
            authToken: process.env.TURSO_AUTH_TOKEN || '',
          },
        },
        whoop: {
          clientId: '',
          clientSecret: '',
          redirectUri: '',
          syncToken: '',
          oauthStateSecret: '',
        },
        aws_services: {
          s3: {
            bucketRecipes: process.env.AWS_S3_BUCKET_NAME || '',
            bucketMeals: process.env.S3_BUCKET_MEALS || '',
          },
          dynamodb: {
            tableMealPlan: 'ScuziMealPlan',
            tableHistory: process.env.DYNAMODB_TABLE_NAME || 'ScuziHistory',
          },
          lambda: {
            functionName: 'scuzi-whoop-sync',
            arn: '',
          },
        },
      };
    }
    
    // Update WHOOP configuration
    existingSecrets.whoop = {
      clientId: clientId,
      clientSecret: clientSecret,
      redirectUri: redirectUris,
      syncToken: existingSecrets.whoop?.syncToken || 'whoop_sync_' + Date.now(),
      oauthStateSecret: existingSecrets.whoop?.oauthStateSecret || 'whoop_state_' + Math.random().toString(36),
    };
    
    // Store the updated secrets
    await storeAppSecrets(existingSecrets);
    
    console.log('✅ WHOOP secrets configured successfully!');
    
    return NextResponse.json({
      success: true,
      message: "WHOOP secrets configured successfully",
      redirectUris: redirectUris,
      clientIdPreview: clientId.substring(0, 8) + '...'
    });
    
  } catch (error) {
    console.error('❌ Failed to set up WHOOP secrets:', error);
    return NextResponse.json(
      { 
        error: "Failed to set up WHOOP secrets", 
        details: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
}