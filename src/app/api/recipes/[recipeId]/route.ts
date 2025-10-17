import { NextRequest, NextResponse } from "next/server";
import { GetCommand } from "@aws-sdk/lib-dynamodb";
import { docClient, DYNAMODB_TABLE } from "@/lib/aws-config";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ recipeId: string }> }
) {
  try {
    const { recipeId } = await params;

    const result = await docClient.send(
      new GetCommand({
        TableName: DYNAMODB_TABLE,
        Key: {
          recipe_id: recipeId,
        },
      })
    );

    if (!result.Item) {
      return NextResponse.json({ error: "Recipe not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      recipe: result.Item,
    });
  } catch (error) {
    console.error("Recipe retrieval error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve recipe", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}