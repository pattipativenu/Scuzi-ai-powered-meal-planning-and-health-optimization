import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, BatchWriteCommand } from "@aws-sdk/lib-dynamodb";
import { CreateTableCommand, DescribeTableCommand } from "@aws-sdk/client-dynamodb";
import * as fs from "fs";
import * as path from "path";
import { parse } from "csv-parse/sync";
import { v4 as uuidv4 } from "uuid";

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

const docClient = DynamoDBDocumentClient.from(client);

async function createTableIfNotExists() {
  try {
    // Check if table exists
    await client.send(
      new DescribeTableCommand({
        TableName: "OOBData",
      })
    );
    console.log("✅ Table 'OOBData' already exists");
  } catch (error: any) {
    if (error.name === "ResourceNotFoundException") {
      // Create table
      console.log("📦 Creating table 'OOBData'...");
      await client.send(
        new CreateTableCommand({
          TableName: "OOBData",
          KeySchema: [
            { AttributeName: "id", KeyType: "HASH" }, // Partition key
          ],
          AttributeDefinitions: [
            { AttributeName: "id", AttributeType: "S" },
            { AttributeName: "date", AttributeType: "S" },
          ],
          GlobalSecondaryIndexes: [
            {
              IndexName: "DateIndex",
              KeySchema: [{ AttributeName: "date", KeyType: "HASH" }],
              Projection: { ProjectionType: "ALL" },
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
      console.log("✅ Table created successfully");
      
      // Wait for table to be active
      console.log("⏳ Waiting for table to be active...");
      await new Promise((resolve) => setTimeout(resolve, 10000));
    } else {
      throw error;
    }
  }
}

function parseCSVData(csvContent: string) {
  const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });

  return records
    .map((record: any) => {
      // Extract date from "Cycle start time" field
      const cycleStartTime = record["Cycle start time"];
      if (!cycleStartTime) return null;

      const date = cycleStartTime.split(" ")[0]; // Get YYYY-MM-DD part

      // Parse numeric values
      const recovery = parseFloat(record["Recovery score %"]);
      const rhr = parseFloat(record["Resting heart rate (bpm)"]);
      const hrv = parseFloat(record["Heart rate variability (ms)"]);
      const strain = parseFloat(record["Day Strain"]);
      const calories = parseFloat(record["Energy burned (cal)"]);
      const sleep = parseFloat(record["Asleep duration (min)"]) / 60; // Convert to hours

      // Skip records with missing essential data
      if (
        isNaN(recovery) ||
        isNaN(rhr) ||
        isNaN(hrv) ||
        isNaN(strain) ||
        isNaN(calories) ||
        isNaN(sleep)
      ) {
        return null;
      }

      return {
        id: uuidv4(),
        date,
        recovery: Math.round(recovery),
        sleep: parseFloat(sleep.toFixed(1)),
        strain: parseFloat(strain.toFixed(1)),
        calories: Math.round(calories),
        hrv: Math.round(hrv),
        rhr: Math.round(rhr),
      };
    })
    .filter((item) => item !== null);
}

async function uploadData(items: any[]) {
  console.log(`📤 Uploading ${items.length} records...`);

  // Batch write items (DynamoDB allows max 25 items per batch)
  const batchSize = 25;
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    
    const putRequests = batch.map((item) => ({
      PutRequest: {
        Item: item,
      },
    }));

    await docClient.send(
      new BatchWriteCommand({
        RequestItems: {
          OOBData: putRequests,
        },
      })
    );

    console.log(`✅ Uploaded batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(items.length / batchSize)}`);
  }
}

async function main() {
  try {
    console.log("🚀 Starting WHOOP data upload...\n");

    // Create table if it doesn't exist
    await createTableIfNotExists();

    // Read CSV file
    const csvPath = path.join(process.cwd(), "physiological_cycles.csv");
    
    if (!fs.existsSync(csvPath)) {
      throw new Error(
        `CSV file not found at ${csvPath}. Please place the physiological_cycles.csv file in the project root.`
      );
    }

    const csvContent = fs.readFileSync(csvPath, "utf-8");
    console.log("📄 CSV file loaded");

    // Parse CSV
    const items = parseCSVData(csvContent);
    console.log(`✅ Parsed ${items.length} valid records\n`);

    // Upload data
    await uploadData(items);

    console.log("\n✅ All data uploaded successfully!");
    console.log(`📊 Total records: ${items.length}`);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

main();