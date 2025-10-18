import { NextRequest, NextResponse } from "next/server";
import { ScanCommand } from "@aws-sdk/lib-dynamodb";
import { docClient } from "@/lib/aws-config";

export async function GET(request: NextRequest) {
  try {
    const command = new ScanCommand({
      TableName: "ScuziRecipes",
    });

    const response = await docClient.send(command);

    // Sort by created_at (most recent first)
    const recipes = (response.Items || []).sort((a, b) => {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    return NextResponse.json({
      success: true,
      recipes,
    });
  } catch (error: any) {
    console.error("Error fetching recipe history:", error);
    return NextResponse.json(
      { error: "Failed to fetch recipe history", details: error.message },
      { status: 500 }
    );
  }
}