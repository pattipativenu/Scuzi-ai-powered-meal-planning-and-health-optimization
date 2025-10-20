import { 
  SecretsManagerClient, 
  PutSecretValueCommand, 
  GetSecretValueCommand,
  DeleteSecretCommand,
  CreateSecretCommand,
  ResourceNotFoundException 
} from '@aws-sdk/client-secrets-manager';

// Use IAM role or instance profile for authentication in production
// This avoids hardcoded credentials
const client = new SecretsManagerClient({
  region: process.env.AWS_REGION || 'us-east-1',
});

// Cache for secrets to avoid repeated API calls
const secretsCache = new Map<string, { value: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Application secrets structure
export interface AppSecrets {
  aws: {
    accessKeyId: string;
    secretAccessKey: string;
    region: string;
    bearerTokenBedrock?: string;
  };
  database: {
    rds: {
      host: string;
      port: number;
      user: string;
      password: string;
      database: string;
    };
    turso: {
      connectionUrl: string;
      authToken: string;
    };
  };
  whoop: {
    clientId: string;
    clientSecret: string;
    redirectUri: string;
    syncToken: string;
    oauthStateSecret: string;
  };
  aws_services: {
    s3: {
      bucketRecipes: string;
      bucketMeals: string;
    };
    dynamodb: {
      tableMealPlan: string;
      tableHistory: string;
    };
    lambda: {
      functionName: string;
      arn: string;
    };
  };
}

export interface WhoopTokens {
  accessToken: string;
  refreshToken?: string;
  expiresAt: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Get a secret from AWS Secrets Manager with caching
 */
async function getSecret(secretName: string): Promise<any> {
  const cached = secretsCache.get(secretName);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.value;
  }

  try {
    const response = await client.send(new GetSecretValueCommand({
      SecretId: secretName,
    }));
    
    if (!response.SecretString) {
      throw new Error(`Secret ${secretName} has no value`);
    }
    
    const value = JSON.parse(response.SecretString);
    secretsCache.set(secretName, { value, timestamp: Date.now() });
    return value;
  } catch (error: any) {
    if (error instanceof ResourceNotFoundException) {
      throw new Error(`Secret ${secretName} not found`);
    }
    throw error;
  }
}

/**
 * Get application secrets from AWS Secrets Manager
 * Secret ARN: You can store this ARN in your environment variables
 */
export async function getAppSecrets(): Promise<AppSecrets> {
  const secretName = process.env.APP_SECRETS_ARN || 'scuzi-app-secrets';
  return await getSecret(secretName);
}

/**
 * Store application secrets in AWS Secrets Manager
 */
export async function storeAppSecrets(secrets: AppSecrets): Promise<void> {
  const secretName = process.env.APP_SECRETS_ARN || 'scuzi-app-secrets';
  
  try {
    await client.send(new PutSecretValueCommand({
      SecretId: secretName,
      SecretString: JSON.stringify(secrets),
    }));
    
    // Clear cache
    secretsCache.delete(secretName);
    console.log(`✅ Updated application secrets`);
  } catch (error: any) {
    if (error instanceof ResourceNotFoundException) {
      await client.send(new CreateSecretCommand({
        Name: secretName,
        SecretString: JSON.stringify(secrets),
        Description: 'Scuzi application secrets',
      }));
      
      console.log(`✅ Created application secrets`);
    } else {
      throw error;
    }
  }
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
    const secrets = await getAppSecrets();
    
    const response = await fetch('https://api.prod.whoop.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: tokens.refreshToken,
        client_id: secrets.whoop.clientId,
        client_secret: secrets.whoop.clientSecret,
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