/**
 * AWS Lambda Handler for WHOOP OAuth Callback
 * Production-ready implementation with JWT state validation
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
    
    const code = event.queryStringParameters?.code;
    const state = event.queryStringParameters?.state;
    const error = event.queryStringParameters?.error;

    const credentials = await getWhoopCredentials();

    // Handle OAuth errors - redirect to error page
    if (error) {
      const errorDescription = event.queryStringParameters?.error_description || 'Unknown error';
      console.error('❌ WHOOP OAuth Error:', error, errorDescription);
      return redirectToErrorPage(credentials.frontend_url, error, errorDescription);
    }

    // Validate parameters
    if (!code) {
      console.error('❌ Missing authorization code');
      return redirectToErrorPage(credentials.frontend_url, 'missing_code', 'Authorization code not provided');
    }

    if (!state || state.length < 8) {
      console.error('❌ Invalid state parameter');
      return redirectToErrorPage(credentials.frontend_url, 'invalid_state', 'State parameter is missing or too weak');
    }

    // Verify state JWT
    console.log('🔐 Verifying state JWT token...');
    try {
      const secret = new TextEncoder().encode(credentials.oauth_state_secret);
      const { payload } = await jwtVerify(state, secret);
      
      if (payload.iss !== 'scuzi-whoop-oauth') {
        throw new Error('Invalid issuer');
      }

      const timestamp = payload.timestamp as number;
      const age = Date.now() - timestamp;
      if (age > 10 * 60 * 1000) {
        throw new Error('State expired');
      }

      console.log('✅ State JWT verified - Nonce:', payload.nonce);
    } catch (jwtError) {
      console.error('❌ State verification failed:', jwtError);
      return redirectToErrorPage(credentials.frontend_url, 'invalid_state_token', 'State verification failed');
    }

    // Exchange code for token
    console.log('🔄 Exchanging authorization code...');
    const tokenResponse = await fetch('https://api.prod.whoop.com/oauth/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
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
      console.error('❌ Token exchange failed:', tokenResponse.status, errorText);
      return redirectToErrorPage(credentials.frontend_url, 'token_exchange_failed', 'Failed to obtain access token');
    }

    const tokenData = await tokenResponse.json();
    console.log('✅ Token exchange successful');

    // Redirect to success page with tokens in URL fragment
    const successUrl = new URL(`${credentials.frontend_url}/connect/success`);
    successUrl.hash = `access_token=${tokenData.access_token}&expires_in=${tokenData.expires_in}${tokenData.refresh_token ? `&refresh_token=${tokenData.refresh_token}` : ''}`;

    return {
      statusCode: 302,
      headers: {
        Location: successUrl.toString(),
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': 'true',
      },
      body: '',
    };
  } catch (error) {
    console.error('❌ Lambda error:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        error: 'internal_error',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
};

async function getWhoopCredentials(): Promise<WhoopCredentials> {
  const secretId = process.env.AWS_SECRETS_MANAGER_SECRET_ID || 'whoop/shoyu-7tmUGN';
  
  const command = new GetSecretValueCommand({ SecretId: secretId });
  const response = await secretsClient.send(command);
  
  if (!response.SecretString) {
    throw new Error('Secret value is empty');
  }

  const credentials = JSON.parse(response.SecretString) as WhoopCredentials;

  if (!credentials.client_id || !credentials.client_secret || !credentials.redirect_uri || !credentials.oauth_state_secret) {
    throw new Error('Missing required credentials in secret');
  }

  return credentials;
}

function redirectToErrorPage(frontendUrl: string, error: string, description?: string): APIGatewayProxyResult {
  const url = new URL(`${frontendUrl}/connect/error`);
  url.searchParams.append('error', error);
  if (description) {
    url.searchParams.append('error_description', description);
  }
  
  return {
    statusCode: 302,
    headers: {
      Location: url.toString(),
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': 'true',
    },
    body: '',
  };
}

export const optionsHandler = async (): Promise<APIGatewayProxyResult> => ({
  statusCode: 200,
  headers: {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true',
  },
  body: '',
});