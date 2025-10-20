#!/usr/bin/env node

/**
 * Script to test secrets manager integration
 */

const { getAppSecrets } = require('../src/lib/secrets-manager.ts');

async function testSecrets() {
  try {
    console.log('🔍 Testing secrets manager integration...');
    
    const secrets = await getAppSecrets();
    
    console.log('✅ Successfully retrieved secrets!');
    console.log('');
    console.log('AWS Region:', secrets.aws.region);
    console.log('RDS Host:', secrets.database.rds.host);
    console.log('S3 Bucket (Recipes):', secrets.aws_services.s3.bucketRecipes);
    console.log('DynamoDB Table (History):', secrets.aws_services.dynamodb.tableHistory);
    console.log('WHOOP Client ID:', secrets.whoop.clientId ? '✅ Set' : '❌ Missing');
    console.log('');
    console.log('🎉 Secrets manager is working correctly!');
    
  } catch (error) {
    console.error('❌ Error retrieving secrets:', error.message);
    console.log('');
    console.log('Troubleshooting:');
    console.log('1. Make sure APP_SECRETS_ARN is set in your .env file');
    console.log('2. Ensure your AWS credentials have access to Secrets Manager');
    console.log('3. Verify the secret exists in AWS Secrets Manager');
  }
}

testSecrets();