#!/usr/bin/env tsx

/**
 * Script to set up WHOOP secrets in AWS Secrets Manager
 * Run with: npx tsx scripts/setup-whoop-secrets.ts
 */

import { storeAppSecrets, getAppSecrets } from '../src/lib/secrets-manager';
import type { AppSecrets } from '../src/lib/secrets-manager';

async function setupWhoopSecrets() {
  console.log('🚀 Setting up WHOOP secrets...');
  
  // WHOOP credentials - you need to get these from WHOOP Developer Portal
  const WHOOP_CLIENT_ID = process.env.WHOOP_CLIENT_ID || 'your_whoop_client_id_here';
  const WHOOP_CLIENT_SECRET = process.env.WHOOP_CLIENT_SECRET || 'your_whoop_client_secret_here';
  
  // Multiple redirect URIs (comma-separated as you mentioned)
  const WHOOP_REDIRECT_URIS = [
    'https://3000-a76555f4-e793-4fd7-af30-e9e40c9b2f12.orchids.page/api/whoop/callback',
    'https://scuzi.vercel.app/api/whoop/callback', 
    'http://localhost:3003/api/whoop/callback',
    'http://localhost:3006/api/whoop/callback' // Add current dev server port
  ].join(', ');
  
  try {
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
      clientId: WHOOP_CLIENT_ID,
      clientSecret: WHOOP_CLIENT_SECRET,
      redirectUri: WHOOP_REDIRECT_URIS,
      syncToken: existingSecrets.whoop?.syncToken || 'whoop_sync_' + Date.now(),
      oauthStateSecret: existingSecrets.whoop?.oauthStateSecret || 'whoop_state_' + Math.random().toString(36),
    };
    
    // Store the updated secrets
    await storeAppSecrets(existingSecrets);
    
    console.log('✅ WHOOP secrets configured successfully!');
    console.log('📋 Configuration:');
    console.log('   Client ID:', WHOOP_CLIENT_ID.substring(0, 8) + '...');
    console.log('   Redirect URIs:', WHOOP_REDIRECT_URIS);
    console.log('');
    console.log('🔧 Next steps:');
    console.log('1. Make sure your WHOOP app in the developer portal has these redirect URIs');
    console.log('2. Update your .env.local with the correct APP_SECRETS_ARN (remove XXXXXX)');
    console.log('3. Test the connection by clicking the WHOOP button');
    
  } catch (error) {
    console.error('❌ Failed to set up WHOOP secrets:', error);
    process.exit(1);
  }
}

// Run the setup
setupWhoopSecrets().catch(console.error);