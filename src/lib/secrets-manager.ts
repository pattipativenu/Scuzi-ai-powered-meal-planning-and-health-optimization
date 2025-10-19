import { 
  SecretsManagerClient, 
  PutSecretValueCommand, 
  GetSecretValueCommand,
  DeleteSecretCommand,
  CreateSecretCommand,
  ResourceNotFoundException 
} from '@aws-sdk/client-secrets-manager';

const client = new SecretsManagerClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

export interface WhoopTokens {
  accessToken: string;
  refreshToken?: string;
  expiresAt: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Store WHOOP tokens in AWS Secrets Manager
 * Secret name format: whoop/tokens/{userId}
 */
export async function storeWhoopTokens(userId: string, tokens: Omit<WhoopTokens, 'userId' | 'createdAt' | 'updatedAt'>): Promise<void> {
  const secretName = `whoop/tokens/${userId}`;
  
  const secretValue: WhoopTokens = {
    ...tokens,
    userId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  try {
    // Try to update existing secret
    await client.send(new PutSecretValueCommand({
      SecretId: secretName,
      SecretString: JSON.stringify(secretValue),
    }));
    
    console.log(`✅ Updated WHOOP tokens for user ${userId}`);
  } catch (error: any) {
    if (error instanceof ResourceNotFoundException) {
      // Secret doesn't exist, create it
      await client.send(new CreateSecretCommand({
        Name: secretName,
        SecretString: JSON.stringify(secretValue),
        Description: `WHOOP OAuth tokens for user ${userId}`,
      }));
      
      console.log(`✅ Created WHOOP tokens for user ${userId}`);
    } else {
      throw error;
    }
  }
}

/**
 * Retrieve WHOOP tokens from AWS Secrets Manager
 */
export async function getWhoopTokens(userId: string): Promise<WhoopTokens | null> {
  const secretName = `whoop/tokens/${userId}`;
  
  try {
    const response = await client.send(new GetSecretValueCommand({
      SecretId: secretName,
    }));
    
    if (!response.SecretString) {
      return null;
    }
    
    return JSON.parse(response.SecretString) as WhoopTokens;
  } catch (error: any) {
    if (error instanceof ResourceNotFoundException) {
      console.log(`ℹ️  No tokens found for user ${userId}`);
      return null;
    }
    throw error;
  }
}

/**
 * Delete WHOOP tokens from AWS Secrets Manager
 */
export async function deleteWhoopTokens(userId: string): Promise<void> {
  const secretName = `whoop/tokens/${userId}`;
  
  try {
    await client.send(new DeleteSecretCommand({
      SecretId: secretName,
      ForceDeleteWithoutRecovery: true,
    }));
    
    console.log(`✅ Deleted WHOOP tokens for user ${userId}`);
  } catch (error: any) {
    if (error instanceof ResourceNotFoundException) {
      console.log(`ℹ️  No tokens to delete for user ${userId}`);
      return;
    }
    throw error;
  }
}

/**
 * Refresh WHOOP access token using refresh token
 */
export async function refreshWhoopAccessToken(userId: string): Promise<WhoopTokens | null> {
  const tokens = await getWhoopTokens(userId);
  
  if (!tokens || !tokens.refreshToken) {
    console.error(`❌ No refresh token found for user ${userId}`);
    return null;
  }
  
  try {
    const response = await fetch('https://api.prod.whoop.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: tokens.refreshToken,
        client_id: process.env.WHOOP_CLIENT_ID || '',
        client_secret: process.env.WHOOP_CLIENT_SECRET || '',
      }),
    });
    
    if (!response.ok) {
      console.error(`❌ Failed to refresh token: ${response.status} ${response.statusText}`);
      return null;
    }
    
    const data = await response.json();
    
    const newTokens: Omit<WhoopTokens, 'userId' | 'createdAt' | 'updatedAt'> = {
      accessToken: data.access_token,
      refreshToken: data.refresh_token || tokens.refreshToken,
      expiresAt: new Date(Date.now() + data.expires_in * 1000).toISOString(),
    };
    
    await storeWhoopTokens(userId, newTokens);
    
    return await getWhoopTokens(userId);
  } catch (error) {
    console.error(`❌ Error refreshing token for user ${userId}:`, error);
    return null;
  }
}