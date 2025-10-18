import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { NextResponse } from "next/server";

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

const docClient = DynamoDBDocumentClient.from(client);

interface WhoopMetric {
  id: string;
  date: string;
  recovery: number;
  sleep: number;
  strain: number;
  calories: number;
  hrv: number;
  rhr: number;
}

export async function GET() {
  try {
    // Scan the table to get all items (in production, you'd use Query with GSI on date)
    const command = new ScanCommand({
      TableName: "OOBData",
    });

    const response = await docClient.send(command);
    const items = (response.Items || []) as WhoopMetric[];

    // Sort by date descending to get most recent first
    const sortedItems = items
      .filter((item) => item.date && item.recovery !== undefined)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    if (sortedItems.length < 2) {
      return NextResponse.json(
        { error: "Not enough data to calculate deltas" },
        { status: 404 }
      );
    }

    // Get today and yesterday
    const today = sortedItems[0];
    const yesterday = sortedItems[1];

    // Calculate deltas
    const recoveryDelta = today.recovery - yesterday.recovery;
    const strainDelta = today.strain - yesterday.strain;
    const sleepDelta = today.sleep - yesterday.sleep;
    const hrvDelta = today.hrv - yesterday.hrv;
    const caloriesDelta = today.calories - yesterday.calories;

    // Format response
    const summary = {
      recovery: {
        value: `${recoveryDelta > 0 ? "+" : ""}${recoveryDelta.toFixed(0)}%`,
        status: recoveryDelta >= 0 ? "positive" : "negative",
        raw: recoveryDelta,
      },
      strain: {
        value: `${strainDelta > 0 ? "+" : ""}${strainDelta.toFixed(1)}`,
        status: strainDelta >= 0 ? "positive" : "negative",
        raw: strainDelta,
      },
      sleep: {
        value: `${sleepDelta > 0 ? "+" : ""}${sleepDelta.toFixed(1)}h`,
        status: sleepDelta >= 0 ? "positive" : "negative",
        raw: sleepDelta,
      },
      hrv: {
        value: `${hrvDelta > 0 ? "+" : ""}${hrvDelta.toFixed(0)}`,
        status: hrvDelta >= 0 ? "positive" : "negative",
        raw: hrvDelta,
      },
      calories: {
        value: `${caloriesDelta > 0 ? "+" : ""}${Math.round(caloriesDelta)}`,
        status: caloriesDelta >= 0 ? "positive" : "negative",
        raw: caloriesDelta,
      },
    };

    return NextResponse.json(summary);
  } catch (error) {
    console.error("Error fetching WHOOP summary:", error);
    return NextResponse.json(
      { error: "Failed to fetch WHOOP summary" },
      { status: 500 }
    );
  }
}