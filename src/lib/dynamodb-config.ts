import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { getSecrets } from "./aws-config";

let dynamoDb: DynamoDBDocumentClient;
let HISTORY_TABLE_NAME: string;

// Initialize DynamoDB client with secrets
(async () => {
  try {
    const secrets = await getSecrets();
    
    const client = new DynamoDBClient({
      region: secrets.aws.region,
      credentials: {
        accessKeyId: secrets.aws.accessKeyId,
        secretAccessKey: secrets.aws.secretAccessKey,
      },
    });

    dynamoDb = DynamoDBDocumentClient.from(client, {
      marshallOptions: {
        removeUndefinedValues: true,
      },
    });

    HISTORY_TABLE_NAME = secrets.aws_services.dynamodb.tableHistory;
  } catch (error) {
    console.error('Failed to initialize DynamoDB client:', error);
    // Fallback to environment variables
    const client = new DynamoDBClient({
      region: process.env.AWS_REGION || "us-east-1",
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
      },
    });

    dynamoDb = DynamoDBDocumentClient.from(client, {
      marshallOptions: {
        removeUndefinedValues: true,
      },
    });

    HISTORY_TABLE_NAME = "ScuziHistory";
  }
})();

// Export async function to get initialized client
export async function getDynamoDb(): Promise<DynamoDBDocumentClient> {
  if (!dynamoDb) {
    const secrets = await getSecrets();
    const client = new DynamoDBClient({
      region: secrets.aws.region,
      credentials: {
        accessKeyId: secrets.aws.accessKeyId,
        secretAccessKey: secrets.aws.secretAccessKey,
      },
    });

    dynamoDb = DynamoDBDocumentClient.from(client, {
      marshallOptions: {
        removeUndefinedValues: true,
      },
    });
  }
  return dynamoDb;
}

export async function getHistoryTableName(): Promise<string> {
  if (!HISTORY_TABLE_NAME) {
    const secrets = await getSecrets();
    HISTORY_TABLE_NAME = secrets.aws_services.dynamodb.tableHistory;
  }
  return HISTORY_TABLE_NAME;
}

// For backward compatibility
export { dynamoDb, HISTORY_TABLE_NAME };