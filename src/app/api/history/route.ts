import { NextRequest, NextResponse } from "next/server";
import { ScanCommand } from "@aws-sdk/lib-dynamodb";
import { dynamoDb, HISTORY_TABLE_NAME } from "@/lib/dynamodb-config";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const command = new ScanCommand({
      TableName: HISTORY_TABLE_NAME,
    });

    const response = await dynamoDb.send(command);

    if (!response.Items) {
      return NextResponse.json([]);
    }

    // Sort by timestamp (latest first)
    const items = response.Items.sort((a, b) => b.timestamp - a.timestamp);

    // Return formatted items
    const formattedItems = items.map((item) => ({
      id: item.id,
      title: item.title || "Untitled",
      description: item.description || "",
      image_url: item.image_url || "",
      timestamp: item.timestamp,
      type: item.type,
      ai_response: item.ai_response,
    }));

    return NextResponse.json(formattedItems);
  } catch (error) {
    console.error("Error fetching history from DynamoDB:", error);
    return NextResponse.json(
      { error: "Failed to fetch history", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}