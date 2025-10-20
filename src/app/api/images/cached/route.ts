import { NextRequest, NextResponse } from 'next/server';
import { getAllCachedImages, getCachedImage, clearOldCachedImages } from '@/lib/image-cache';
import { UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { dynamoDb, HISTORY_TABLE_NAME } from "@/lib/dynamodb-config";

export async function GET(request: NextRequest) {
    try {
        // Clear old images first
        clearOldCachedImages();

        // Get all cached images
        const cachedImages = getAllCachedImages();

        return NextResponse.json({
            success: true,
            images: cachedImages,
            count: cachedImages.length
        });

    } catch (error) {
        console.error('[CACHED IMAGES API] Error:', error);
        return NextResponse.json({
            success: false,
            error: 'Failed to retrieve cached images',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const { historyItemId, action } = await request.json();

        if (action === 'restore' && historyItemId) {
            // Try to restore a specific cached image to history
            const cachedImage = getCachedImage(historyItemId);

            if (!cachedImage) {
                return NextResponse.json({
                    success: false,
                    error: 'No cached image found for this history item'
                }, { status: 404 });
            }

            // Try different key formats for DynamoDB
            const keyFormats = [
                { id: historyItemId },
                { historyId: historyItemId },
                { pk: historyItemId },
                { itemId: historyItemId }
            ];

            let success = false;
            let lastError = null;

            for (const keyFormat of keyFormats) {
                try {
                    console.log('[RESTORE] Trying key format:', keyFormat);

                    const updateCommand = new UpdateCommand({
                        TableName: HISTORY_TABLE_NAME,
                        Key: keyFormat,
                        UpdateExpression: "SET image_url = :imageUrl",
                        ExpressionAttributeValues: {
                            ":imageUrl": cachedImage.imageUrl,
                        },
                        ReturnValues: "ALL_NEW"
                    });

                    const result = await dynamoDb.send(updateCommand);
                    console.log('[RESTORE] ✅ Successfully restored image to history!');
                    success = true;
                    break;

                } catch (error) {
                    console.log('[RESTORE] ❌ Key format failed:', keyFormat, error);
                    lastError = error;
                }
            }

            if (success) {
                return NextResponse.json({
                    success: true,
                    message: 'Image successfully restored to history',
                    cachedImage
                });
            } else {
                return NextResponse.json({
                    success: false,
                    error: 'Failed to restore image with any key format',
                    details: lastError instanceof Error ? lastError.message : 'Unknown error',
                    cachedImage
                }, { status: 500 });
            }
        }

        return NextResponse.json({
            success: false,
            error: 'Invalid action or missing historyItemId'
        }, { status: 400 });

    } catch (error) {
        console.error('[CACHED IMAGES API] Error in POST:', error);
        return NextResponse.json({
            success: false,
            error: 'Failed to process request',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}