import { DynamoDBClient, CreateTableCommand, DescribeTableCommand } from "@aws-sdk/client-dynamodb";
import { RECIPES_TABLE } from "./aws-config";

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function ensureRecipesTable() {
  try {
    // Check if table exists
    await client.send(new DescribeTableCommand({ TableName: RECIPES_TABLE }));
    console.log(`Table ${RECIPES_TABLE} already exists`);
    return true;
  } catch (error: any) {
    if (error.name === "ResourceNotFoundException") {
      // Create table if it doesn't exist
      console.log(`Creating table ${RECIPES_TABLE}...`);
      
      await client.send(
        new CreateTableCommand({
          TableName: RECIPES_TABLE,
          KeySchema: [
            { AttributeName: "recipe_id", KeyType: "HASH" }, // Partition key
          ],
          AttributeDefinitions: [
            { AttributeName: "recipe_id", AttributeType: "S" },
            { AttributeName: "recipe_title", AttributeType: "S" },
            { AttributeName: "created_at", AttributeType: "N" },
          ],
          GlobalSecondaryIndexes: [
            {
              IndexName: "recipe_title-index",
              KeySchema: [
                { AttributeName: "recipe_title", KeyType: "HASH" },
              ],
              Projection: {
                ProjectionType: "ALL",
              },
              ProvisionedThroughput: {
                ReadCapacityUnits: 5,
                WriteCapacityUnits: 5,
              },
            },
            {
              IndexName: "created_at-index",
              KeySchema: [
                { AttributeName: "recipe_title", KeyType: "HASH" },
                { AttributeName: "created_at", KeyType: "RANGE" },
              ],
              Projection: {
                ProjectionType: "ALL",
              },
              ProvisionedThroughput: {
                ReadCapacityUnits: 5,
                WriteCapacityUnits: 5,
              },
            },
          ],
          ProvisionedThroughput: {
            ReadCapacityUnits: 5,
            WriteCapacityUnits: 5,
          },
        })
      );
      
      console.log(`Table ${RECIPES_TABLE} created successfully`);
      return true;
    }
    
    console.error("Error checking/creating table:", error);
    return false;
  }
}