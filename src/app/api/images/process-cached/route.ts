import { NextRequest, NextResponse } from 'next/server';
import { getAllCachedImages, getCachedImage } from '@/lib/image-cache';
import { uploadImageToS3 } from '@/lib/meal-library-utils';
import { UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { dynamoDb, HISTORY_TABLE_NAME } from "@/lib/dynamodb-config";

export async function POST(request: NextRequest) {
  try {
    console.log('[PROCESS CACHED] 🚨 Starting to process cached images...');
    
    const cachedImages = getAllCachedImages();
    console.log('[PROCESS CACHED] Found', cachedImages.length, 'cached images');
    
    if (cachedImages.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No cached images to process',
        processed: 0
      });
    }
    
    let processed = 0;
    let errors = 0;
    const results = [];
    
    for (const cached of cachedImages) {
      try {
        console.log('[PROCESS CACHED] Processing:', cached.dishName);
        
        // Upload image to S3
        console.log('[PROCESS CACHED] Uploading to S3...');
        const s3Url = await uploadImageToS3(cached.imageUrl, cached.dishName);
        
        if (!s3Url) {
          console.error('[PROCESS CACHED] Failed to upload to S3');
          errors++;
          continue;
        }
        
        console.log('[PROCESS CACHED] ✅ Uploaded to S3:', s3Url.substring(0, 50) + '...');
        
        // Update DynamoDB with S3 URL (much smaller than base64)
        console.log('[PROCESS CACHED] Updating DynamoDB with S3 URL...');
        
        const updateCommand = new UpdateCommand({
          TableName: HISTORY_TABLE_NAME,
          Key: { id: cached.historyItemId },
          UpdateExpression: "SET image_url = :imageUrl, ai_generated_image = :aiImage",
          ExpressionAttributeValues: {
            ":imageUrl": s3Url,
            ":aiImage": s3Url,
          },
          ReturnValues: "ALL_NEW"
        });

        const result = await dynamoDb.send(updateCommand);
        console.log('[PROCESS CACHED] ✅ Updated DynamoDB successfully!');
        
        processed++;
        results.push({
          historyItemId: cached.historyItemId,
          dishName: cached.dishName,
          s3Url,
          success: true
        });
        
      } catch (error) {
        console.error('[PROCESS CACHED] Error processing cached image:', error);
        errors++;
        results.push({
          historyItemId: cached.historyItemId,
          dishName: cached.dishName,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
    
    console.log('[PROCESS CACHED] ✅ Processing complete:', { processed, errors });
    
    return NextResponse.json({
      success: true,
      message: `Processed ${processed} cached images, ${errors} errors`,
      processed,
      errors,
      results
    });

  } catch (error) {
    console.error('[PROCESS CACHED] Fatal error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to process cached images',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    // GET endpoint to check cached images status
    const cachedImages = getAllCachedImages();
    
    return NextResponse.json({
      success: true,
      cachedImages,
      count: cachedImages.length,
      message: cachedImages.length > 0 ? 
        `Found ${cachedImages.length} cached images ready for processing` :
        'No cached images found'
    });

  } catch (error) {
    console.error('[PROCESS CACHED] Error in GET:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to retrieve cached images',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}