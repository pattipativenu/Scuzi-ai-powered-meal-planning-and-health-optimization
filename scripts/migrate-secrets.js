#!/usr/bin/env node

/**
 * Script to migrate secrets to AWS Secrets Manager
 * Run this script after setting up new AWS credentials
 */

const { SecretsManagerClient, CreateSecretCommand, PutSecretValueCommand } = require('@aws-sdk/client-secrets-manager');

// Initialize Secrets Manager client
// Make sure you have new AWS credentials configured
const client = new SecretsManagerClient({
  region: 'us-east-1',
});

const secrets = {
  aws: {
    accessKeyId: 'YOUR_NEW_AWS_ACCESS_KEY_ID',
    secretAccessKey: 'YOUR_NEW_AWS_SECRET_ACCESS_KEY',
    region: 'us-east-1',
    bearerTokenBedrock: 'YOUR_NEW_BEARER_TOKEN_IF_NEEDED',
  },
  database: {
    rds: {
      host: 'whoophealthdata.c07sewky09yn.us-east-1.rds.amazonaws.com',
      port: 3306,
      user: 'admin',
      password: 'YOUR_NEW_RDS_PASSWORD',
      database: 'scuzi_meals',
    },
    turso: {
      connectionUrl: 'YOUR_NEW_TURSO_CONNECTION_URL',
      authToken: 'YOUR_NEW_TURSO_AUTH_TOKEN',
    },
  },
  whoop: {
    clientId: 'YOUR_NEW_WHOOP_CLIENT_ID',
    clientSecret: 'YOUR_NEW_WHOOP_CLIENT_SECRET',
    redirectUri: 'https://zh2o5rcze6.execute-api.us-east-1.amazonaws.com/dev/api/whoop/callback',
    syncToken: 'YOUR_NEW_WHOOP_SYNC_TOKEN',
    oauthStateSecret: 'YOUR_NEW_OAUTH_STATE_SECRET',
  },
  aws_services: {
    s3: {
      bucketRecipes: 'scuzi-ai-recipes',
      bucketMeals: 'scuzi-meals',
    },
    dynamodb: {
      tableMealPlan: 'MealPlanData',
      tableHistory: 'ScuziHistory',
    },
    lambda: {
      functionName: 'storeMealPlanData',
      arn: 'arn:aws:lambda:us-east-1:639261426100:function:storeMealPlanData',
    },
  },
};

async function createSecret() {
  try {
    console.log('Creating secret in AWS Secrets Manager...');
    
    const command = new CreateSecretCommand({
      Name: 'scuzi-app-secrets',
      Description: 'Scuzi application secrets',
      SecretString: JSON.stringify(secrets, null, 2),
    });

    const response = await client.send(command);
    
    console.log('✅ Secret created successfully!');
    console.log('Secret ARN:', response.ARN);
    console.log('');
    console.log('Update your .env and .env.local files with:');
    console.log(`APP_SECRETS_ARN=${response.ARN}`);
    
  } catch (error) {
    if (error.name === 'ResourceExistsException') {
      console.log('Secret already exists, updating...');
      
      const updateCommand = new PutSecretValueCommand({
        SecretId: 'scuzi-app-secrets',
        SecretString: JSON.stringify(secrets, null, 2),
      });
      
      await client.send(updateCommand);
      console.log('✅ Secret updated successfully!');
    } else {
      console.error('❌ Error creating secret:', error);
    }
  }
}

console.log('🔐 Migrating secrets to AWS Secrets Manager');
console.log('');
console.log('⚠️  IMPORTANT: Before running this script:');
console.log('1. Replace all placeholder values in this script with your NEW credentials');
console.log('2. Make sure you have new AWS credentials configured (not the exposed ones)');
console.log('3. Ensure you have the necessary IAM permissions for Secrets Manager');
console.log('');
console.log('Press Ctrl+C to cancel, or any key to continue...');

process.stdin.setRawMode(true);
process.stdin.resume();
process.stdin.on('data', () => {
  createSecret().then(() => {
    process.exit(0);
  }).catch((error) => {
    console.error('Failed to create secret:', error);
    process.exit(1);
  });
});