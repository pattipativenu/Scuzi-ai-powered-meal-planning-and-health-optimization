import { NextRequest, NextResponse } from "next/server";
import { DynamoDBClient, ScanCommand } from "@aws-sdk/client-dynamodb";
import { S3Client, ListObjectsV2Command, HeadObjectCommand } from "@aws-sdk/client-s3";
import { unmarshall } from "@aws-sdk/util-dynamodb";

const dynamoClient = new DynamoDBClient({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const s3Client = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const MEALS_LIBRARY_TABLE = "meals_library";
const S3_BUCKET = "scuzi-ai-recipes";

interface MealImageMapping {
  meal_id: string;
  name: string;
  meal_type: string;
  imageUrl: string;
  expected_s3_key: string;
  image_exists: boolean;
  image_accessible: boolean;
  error?: string;
}

export async function GET(request: NextRequest) {
  const report = {
    timestamp: new Date().toISOString(),
    total_meals_checked: 0,
    meals_with_images: 0,
    meals_without_images: 0,
    images_found: 0,
    images_missing: 0,
    mapping_results: [] as MealImageMapping[],
    s3_image_inventory: [] as string[],
    summary: {
      perfect_mappings: 0,
      broken_mappings: 0,
      missing_image_urls: 0,
      all_mappings_valid: false,
    },
  };

  try {
    console.log("🔍 Starting detailed meal-to-image mapping verification...");

    // 1. Get all S3 images first for reference
    console.log("📦 Getting S3 image inventory...");
    const listCommand = new ListObjectsV2Command({
      Bucket: S3_BUCKET,
      Prefix: "meal-images/", // Focus on meal-images folder
    });

    const s3Result = await s3Client.send(listCommand);
    if (s3Result.Contents) {
      report.s3_image_inventory = s3Result.Contents.map(obj => obj.Key || "").filter(key => key.endsWith('.png') || key.endsWith('.jpg') || key.endsWith('.jpeg'));
      console.log(`📦 Found ${report.s3_image_inventory.length} images in S3 meal-images folder`);
    }

    // 2. Get all meals from DynamoDB
    console.log("📊 Getting all meals from meals_library...");
    const scanCommand = new ScanCommand({
      TableName: MEALS_LIBRARY_TABLE,
    });

    const scanResult = await dynamoClient.send(scanCommand);
    
    if (!scanResult.Items || scanResult.Items.length === 0) {
      return NextResponse.json({
        error: "No meals found in meals_library table",
        timestamp: new Date().toISOString(),
      }, { status: 404 });
    }

    const meals = scanResult.Items.map((item) => unmarshall(item));
    report.total_meals_checked = meals.length;

    console.log(`📊 Processing ${meals.length} meals...`);

    // 3. Check each meal's image mapping
    for (const meal of meals) {
      const mapping: MealImageMapping = {
        meal_id: meal.meal_id || "missing",
        name: meal.name || "missing",
        meal_type: meal.meal_type || "missing",
        imageUrl: meal.imageUrl || meal.image_url || "",
        expected_s3_key: "",
        image_exists: false,
        image_accessible: false,
      };

      if (!mapping.imageUrl) {
        // No image URL in database
        report.meals_without_images++;
        mapping.error = "No imageUrl field in database";
        report.summary.missing_image_urls++;
      } else {
        report.meals_with_images++;
        
        // Extract S3 key from URL
        if (mapping.imageUrl.includes('s3.') && mapping.imageUrl.includes('.amazonaws.com')) {
          const urlParts = mapping.imageUrl.split('/');
          mapping.expected_s3_key = urlParts.slice(-2).join('/'); // Get last two parts (folder/filename)
          
          // Check if image exists in S3
          const imageKey = mapping.expected_s3_key;
          
          // First check if it's in our inventory
          const foundInInventory = report.s3_image_inventory.some(s3Key => s3Key.includes(imageKey.split('/')[1]));
          
          if (foundInInventory) {
            mapping.image_exists = true;
            
            // Try to access the specific image
            try {
              await s3Client.send(new HeadObjectCommand({
                Bucket: S3_BUCKET,
                Key: imageKey,
              }));
              mapping.image_accessible = true;
              report.images_found++;
              report.summary.perfect_mappings++;
              console.log(`✅ Perfect mapping: ${mapping.name} -> ${imageKey}`);
            } catch (headError) {
              mapping.image_accessible = false;
              mapping.error = `Image exists but not accessible at expected path: ${imageKey}`;
              report.images_missing++;
              report.summary.broken_mappings++;
              console.log(`⚠️ Broken mapping: ${mapping.name} -> ${imageKey}`);
            }
          } else {
            mapping.image_exists = false;
            mapping.image_accessible = false;
            mapping.error = `Image not found in S3 meal-images folder`;
            report.images_missing++;
            report.summary.broken_mappings++;
            console.log(`❌ Missing image: ${mapping.name} -> ${imageKey}`);
          }
        } else {
          mapping.error = "Invalid S3 URL format";
          report.summary.broken_mappings++;
        }
      }

      report.mapping_results.push(mapping);
    }

    // 4. Generate summary
    report.summary.all_mappings_valid = report.summary.perfect_mappings === report.meals_with_images;

    console.log("✅ Meal-to-image mapping verification completed");
    console.log(`📊 Results: ${report.summary.perfect_mappings} perfect, ${report.summary.broken_mappings} broken, ${report.summary.missing_image_urls} missing URLs`);

    return NextResponse.json(report);

  } catch (error) {
    console.error("❌ Error during meal-image mapping verification:", error);
    return NextResponse.json({
      error: "Verification failed",
      message: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}

// Helper endpoint to get just the summary
export async function POST(request: NextRequest) {
  const fullReport = await GET(request);
  const data = await fullReport.json();
  
  if (data.error) {
    return NextResponse.json(data, { status: 500 });
  }

  // Return just the summary with key issues
  const summary = {
    timestamp: data.timestamp,
    total_meals: data.total_meals_checked,
    perfect_mappings: data.summary.perfect_mappings,
    broken_mappings: data.summary.broken_mappings,
    missing_image_urls: data.summary.missing_image_urls,
    all_mappings_valid: data.summary.all_mappings_valid,
    sample_broken_mappings: data.mapping_results
      .filter((m: MealImageMapping) => !m.image_accessible && m.imageUrl)
      .slice(0, 5)
      .map((m: MealImageMapping) => ({
        name: m.name,
        meal_id: m.meal_id,
        error: m.error,
      })),
    sample_missing_urls: data.mapping_results
      .filter((m: MealImageMapping) => !m.imageUrl)
      .slice(0, 5)
      .map((m: MealImageMapping) => ({
        name: m.name,
        meal_id: m.meal_id,
        meal_type: m.meal_type,
      })),
  };

  return NextResponse.json(summary);
}