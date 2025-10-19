import { NextRequest, NextResponse } from "next/server";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";

const s3Client = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const imageUrl = searchParams.get("url");

    if (!imageUrl) {
      return NextResponse.json(
        { error: "Image URL is required" },
        { status: 400 }
      );
    }

    // Extract S3 key from URL
    // Format: https://scuzi-ai-recipes.s3.us-east-1.amazonaws.com/meal-images/xxx.png
    const urlParts = imageUrl.split(".amazonaws.com/");
    if (urlParts.length !== 2) {
      return NextResponse.json(
        { error: "Invalid S3 URL format" },
        { status: 400 }
      );
    }

    const s3Key = urlParts[1];
    const bucketName = "scuzi-ai-recipes";

    // Fetch image from S3
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: s3Key,
    });

    const s3Response = await s3Client.send(command);

    if (!s3Response.Body) {
      return NextResponse.json(
        { error: "Failed to fetch image from S3" },
        { status: 500 }
      );
    }

    // Convert stream to buffer
    const chunks: Uint8Array[] = [];
    for await (const chunk of s3Response.Body as any) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);

    // Return image with proper headers
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": s3Response.ContentType || "image/png",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("Error proxying image:", error);
    return NextResponse.json(
      { error: "Failed to load image" },
      { status: 500 }
    );
  }
}