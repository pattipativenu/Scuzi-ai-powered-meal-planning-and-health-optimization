/**
 * AWS Lambda Handler for WHOOP OAuth Callback
 * 
 * DEPLOYMENT INSTRUCTIONS:
 * =======================
 * 
 * 1. Install dependencies in Lambda layer or package:
 *    npm install jose @aws-sdk/client-secrets-manager
 * 
 * 2. Deploy this handler to AWS Lambda
 * 
 * 3. Connect to API Gateway:
 *    - Method: GET
 *    - Path: /dev/api/whoop/callback
 *    - Enable CORS
 * 
 * 4. Update AWS Secrets Manager secret: whoop/shoyu-7tmUGN
 *    Required JSON structure:
 *    {
 *      "client_id": "299bf73c-9f7a-4720-a283-cb5fdfcef648",
 *      "client_secret": "7efe5938872060d4f422a8f7079cbd75bfb0d5b9bc2dc3750e33f913924ae0cf",
 *      "redirect_uri": "https://zh2o5rcze6.execute-api.us-east-1.amazonaws.com/dev/api/whoop/callback",
 *      "frontend_url": "http://localhost:3000",
 *      "oauth_state_secret": "whoop-oauth-state-secret-key-2024"
 *    }
 * 
 * 5. Set Lambda environment variable:
 *    AWS_SECRETS_MANAGER_SECRET_ID=whoop/shoyu-7tmUGN
 * 
 * 6. Grant Lambda IAM permissions:
 *    - secretsmanager:GetSecretValue for the secret ARN
 * 
 * 7. Update WHOOP Developer Portal:
 *    Add redirect URI: https://zh2o5rcze6.execute-api.us-east-1.amazonaws.com/dev/api/whoop/callback
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';
import { jwtVerify } from 'jose';

const secretsClient = new SecretsManagerClient({ region: 'us-east-1' });

interface WhoopCredentials {
  client_id: string;
  client_secret: string;
  redirect_uri: string;
  frontend_url: string;
  oauth_state_secret: string;
}

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    console.log('🔍 WHOOP OAuth Callback Lambda invoked');
    console.log('Query parameters:', event.queryStringParameters);

    // Extract OAuth parameters
    const code = event.queryStringParameters?.code;
    const state = event.queryStringParameters?.state;
    const error = event.queryStringParameters?.error;

    // Retrieve credentials first (needed for frontend_url in error cases)
    const credentials = await getWhoopCredentials();

    // Handle OAuth errors from WHOOP
    if (error) {
      const errorDescription = event.queryStringParameters?.error_description || 'Unknown error';
      console.error('❌ WHOOP OAuth Error:', error, errorDescription);
      
      return {
        statusCode: 302,
        headers: {
          Location: `${credentials.frontend_url}/?error=${encodeURIComponent(error)}&error_description=${encodeURIComponent(errorDescription)}`,
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Credentials': 'true',
        },
        body: '',
      };
    }

    // Validate required parameters
    if (!code) {
      console.error('❌ Missing authorization code');
      return redirectToFrontend(credentials.frontend_url, 'missing_code');
    }

    if (!state || state.length < 8) {
      console.error('❌ Invalid state parameter - too short:', state?.length || 0);
      return redirectToFrontend(credentials.frontend_url, 'invalid_state');
    }

    // Verify state JWT token for CSRF protection
    console.log('🔐 Verifying state JWT token...');
    try {
      const secret = new TextEncoder().encode(credentials.oauth_state_secret);
      const { payload } = await jwtVerify(state, secret);
      
      // Validate JWT claims
      if (payload.iss !== 'scuzi-whoop-oauth') {
        console.error('❌ Invalid JWT issuer:', payload.iss);
        return redirectToFrontend(credentials.frontend_url, 'invalid_state_issuer');
      }

      // Check if state is expired (additional check beyond JWT exp)
      const timestamp = payload.timestamp as number;
      const age = Date.now() - timestamp;
      if (age > 10 * 60 * 1000) { // 10 minutes
        console.error('❌ State token expired:', age, 'ms');
        return redirectToFrontend(credentials.frontend_url, 'state_expired');
      }

      console.log('✅ State JWT verification successful');
      console.log('Nonce:', payload.nonce);
      console.log('Timestamp:', new Date(timestamp).toISOString());
    } catch (jwtError) {
      console.error('❌ State JWT verification failed:', jwtError);
      return redirectToFrontend(credentials.frontend_url, 'invalid_state_token');
    }

    console.log('🔍 Retrieved credentials from Secrets Manager');
    console.log('Client ID:', credentials.client_id);
    console.log('Redirect URI:', credentials.redirect_uri);

    // Exchange authorization code for access token
    console.log('🔄 Exchanging authorization code for access token...');
    const tokenResponse = await fetch('https://api.prod.whoop.com/oauth/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        client_id: credentials.client_id,
        client_secret: credentials.client_secret,
        redirect_uri: credentials.redirect_uri,
      }).toString(),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('❌ WHOOP token exchange failed:', tokenResponse.status, errorText);
      return redirectToFrontend(credentials.frontend_url, 'token_exchange_failed');
    }

    const tokenData = await tokenResponse.json();
    const { access_token, refresh_token, expires_in } = tokenData;

    console.log('✅ WHOOP token exchange successful');
    console.log('Access token expires in:', expires_in, 'seconds');

    // Redirect back to frontend with success
    // Tokens are passed as URL fragments (not query params) for security
    const redirectUrl = new URL(credentials.frontend_url);
    redirectUrl.hash = `whoop=connected&access_token=${access_token}&expires_in=${expires_in}${refresh_token ? `&refresh_token=${refresh_token}` : ''}`;

    return {
      statusCode: 302,
      headers: {
        Location: redirectUrl.toString(),
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': 'true',
      },
      body: '',
    };
  } catch (error) {
    console.error('❌ Lambda handler error:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        error: 'internal_error',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
};

async function getWhoopCredentials(): Promise<WhoopCredentials> {
  try {
    const secretId = process.env.AWS_SECRETS_MANAGER_SECRET_ID || 'whoop/shoyu-7tmUGN';
    
    const command = new GetSecretValueCommand({
      SecretId: secretId,
    });

    const response = await secretsClient.send(command);
    
    if (!response.SecretString) {
      throw new Error('Secret value is empty');
    }

    const credentials = JSON.parse(response.SecretString) as WhoopCredentials;

    // Validate required fields
    if (!credentials.client_id || !credentials.client_secret || !credentials.redirect_uri || !credentials.oauth_state_secret) {
      throw new Error('Missing required credentials in secret');
    }

    return credentials;
  } catch (error) {
    console.error('❌ Failed to retrieve credentials from Secrets Manager:', error);
    throw new Error('Failed to retrieve WHOOP credentials');
  }
}

function redirectToFrontend(frontendUrl: string, error: string): APIGatewayProxyResult {
  return {
    statusCode: 302,
    headers: {
      Location: `${frontendUrl}/?error=${encodeURIComponent(error)}`,
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': 'true',
    },
    body: '',
  };
}

// CORS preflight handler
export const optionsHandler = async (): Promise<APIGatewayProxyResult> => {
  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Credentials': 'true',
    },
    body: '',
  };
};