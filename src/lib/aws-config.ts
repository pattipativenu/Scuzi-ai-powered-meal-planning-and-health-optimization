import { BedrockRuntimeClient } from "@aws-sdk/client-bedrock-runtime";
import { S3Client } from "@aws-sdk/client-s3";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { getAppSecrets, type AppSecrets } from "./secrets-manager";

// Cache for secrets to avoid repeated calls
let secretsCache: AppSecrets | null = null;
let secretsCacheTime = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function getSecrets(): Promise<AppSecrets> {
  if (secretsCache && Date.now() - secretsCacheTime < CACHE_TTL) {
    return secretsCache;
  }
  
  try {
    secretsCache = await getAppSecrets();
    secretsCacheTime = Date.now();
    return secretsCache;
  } catch (error) {
    console.warn('Failed to load secrets from AWS Secrets Manager, falling back to environment variables');
    // Fallback to environment variables for development
    return {
      aws: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
        region: process.env.AWS_REGION || 'us-east-1',
        bearerTokenBedrock: process.env.AWS_BEARER_TOKEN_BEDROCK,
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
        clientId: process.env.WHOOP_CLIENT_ID || '',
        clientSecret: process.env.WHOOP_CLIENT_SECRET || '',
        redirectUri: process.env.WHOOP_REDIRECT_URI || '',
        syncToken: process.env.WHOOP_SYNC_TOKEN || '',
        oauthStateSecret: process.env.OAUTH_STATE_SECRET || '',
      },
      aws_services: {
        s3: {
          bucketRecipes: process.env.AWS_S3_BUCKET_NAME || 'scuzi-ai-recipes',
          bucketMeals: process.env.S3_BUCKET_MEALS || 'scuzi-meals',
        },
        dynamodb: {
          tableMealPlan: process.env.DYNAMO_TABLE_MEAL_PLAN || 'MealPlanData',
          tableHistory: process.env.DYNAMO_TABLE_HISTORY || 'ScuziHistory',
        },
        lambda: {
          functionName: process.env.LAMBDA_FUNCTION_NAME || 'storeMealPlanData',
          arn: process.env.LAMBDA_ARN || '',
        },
      },
    };
  }
}

// Configure Bedrock client with bearer token authentication
const getBedrockClient = async () => {
  const secrets = await getSecrets();
  
  if (secrets.aws.bearerTokenBedrock) {
    // Use bearer token authentication for AWS Bedrock serverless
    const client = new BedrockRuntimeClient({
      region: secrets.aws.region,
    });

    // Add middleware to inject bearer token in Authorization header
    client.middlewareStack.add(
      (next: any) => async (args: any) => {
        args.request.headers.Authorization = `Bearer ${secrets.aws.bearerTokenBedrock}`;
        return next(args);
      },
      {
        step: "build",
        name: "addBearerToken",
      }
    );

    return client;
  } else {
    // Fallback to standard AWS credentials
    return new BedrockRuntimeClient({
      region: secrets.aws.region,
      credentials: {
        accessKeyId: secrets.aws.accessKeyId,
        secretAccessKey: secrets.aws.secretAccessKey,
      },
    });
  }
};

const getS3Client = async () => {
  const secrets = await getSecrets();
  return new S3Client({
    region: secrets.aws.region,
    credentials: {
      accessKeyId: secrets.aws.accessKeyId,
      secretAccessKey: secrets.aws.secretAccessKey,
    },
  });
};

const getDynamoClient = async () => {
  const secrets = await getSecrets();
  return new DynamoDBClient({
    region: secrets.aws.region,
    credentials: {
      accessKeyId: secrets.aws.accessKeyId,
      secretAccessKey: secrets.aws.secretAccessKey,
    },
  });
};

// Export async functions to get clients
export const getBedrockClientAsync = getBedrockClient;
export const getS3ClientAsync = getS3Client;
export const getDynamoClientAsync = getDynamoClient;

// For backward compatibility, export sync versions (will use cached secrets)
export let bedrockClient: BedrockRuntimeClient;
export let s3Client: S3Client;
export let docClient: DynamoDBDocumentClient;
export let S3_BUCKET: string;
export let RECIPES_BUCKET: string;
export let DYNAMODB_TABLE: string;

// Initialize clients
(async () => {
  try {
    const secrets = await getSecrets();
    bedrockClient = await getBedrockClient();
    s3Client = await getS3Client();
    const dynamoClient = await getDynamoClient();
    docClient = DynamoDBDocumentClient.from(dynamoClient);
    
    S3_BUCKET = secrets.aws_services.s3.bucketRecipes;
    RECIPES_BUCKET = secrets.aws_services.s3.bucketRecipes;
    DYNAMODB_TABLE = "ScuziRecipes";
  } catch (error) {
    console.error('Failed to initialize AWS clients:', error);
  }
})();

// Export function to get all secrets
export { getSecrets };