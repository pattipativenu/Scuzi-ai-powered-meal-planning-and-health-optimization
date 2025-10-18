import { NextRequest, NextResponse } from "next/server";
import { PutCommand } from "@aws-sdk/lib-dynamodb";
import { dynamoDb, HISTORY_TABLE_NAME } from "@/lib/dynamodb-config";
import { randomUUID } from "crypto";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      type,
      title,
      description,
      image_url,
      ai_response,
      created_by = "guest_user",
    } = body;

    if (!type || !title) {
      return NextResponse.json(
        { error: "Missing required fields: type, title" },
        { status: 400 }
      );
    }

    const item = {
      id: randomUUID(),
      timestamp: Date.now(),
      type,
      title,
      description: description || "",
      image_url: image_url || "",
      ai_response: typeof ai_response === "string" ? ai_response : JSON.stringify(ai_response),
      created_by,
    };

    const command = new PutCommand({
      TableName: HISTORY_TABLE_NAME,
      Item: item,
    });

    await dynamoDb.send(command);

    return NextResponse.json({
      success: true,
      item,
    });
  } catch (error) {
    console.error("Error storing history in DynamoDB:", error);
    return NextResponse.json(
      { error: "Failed to store history", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}