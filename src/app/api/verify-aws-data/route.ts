import { NextRequest, NextResponse } from "next/server";
import { DynamoDBClient, ScanCommand } from "@aws-sdk/client-dynamodb";
import { S3Client, HeadObjectCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";
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
const MEAL_PLAN_DATA_TABLE = "MealPlanData";
// Your actual S3 bucket names from screenshot
const POSSIBLE_BUCKET_NAMES = [
    "scuzi-ai-recipes",
    "scuzi-meal-images",
    "scuzi-meals"
];

interface MealFromLibrary {
    meal_id: string;
    meal_type: string;
    name: string;
    description: string;
    ingredients: Array<{ name: string; amount: string }>;
    instructions: string[];
    prep_time: number;
    cook_time: number;
    servings: number;
    nutrition: {
        calories: number;
        protein: number;
        carbs: number;
        fat: number;
    };
    imageUrl?: string;
    imagePrompt?: string;
}

export async function GET(request: NextRequest) {
    const report = {
        timestamp: new Date().toISOString(),
        meals_library: {
            status: "checking",
            total_meals: 0,
            breakdown: {
                breakfast: 0,
                lunch: 0,
                snack: 0,
                dinner: 0,
            },
            sample_meals: [] as any[],
            missing_fields: [] as string[],
            errors: [] as string[],
        },
        meal_plan_data: {
            status: "checking",
            total_plans: 0,
            sample_plans: [] as any[],
            errors: [] as string[],
        },
        s3_bucket: {
            status: "checking",
            bucket_name: "checking...",
            total_images: 0,
            sample_images: [] as string[],
            missing_images: [] as string[],
            errors: [] as string[],
        },
        summary: {
            all_systems_ok: false,
            issues_found: [] as string[],
            recommendations: [] as string[],
        },
    };

    try {
        console.log("🔍 Starting AWS data verification...");

        // 1. Check meals_library table
        try {
            console.log("📊 Checking meals_library table...");

            const scanCommand = new ScanCommand({
                TableName: MEALS_LIBRARY_TABLE,
            });

            const scanResult = await dynamoClient.send(scanCommand);

            if (scanResult.Items && scanResult.Items.length > 0) {
                const meals: MealFromLibrary[] = scanResult.Items.map((item) => {
                    const meal = unmarshall(item);
                    return {
                        meal_id: meal.meal_id || "missing",
                        meal_type: meal.meal_type || "missing",
                        name: meal.name || "missing",
                        description: meal.description || "missing",
                        ingredients: meal.ingredients || [],
                        instructions: meal.instructions || [],
                        prep_time: meal.prep_time || 0,
                        cook_time: meal.cook_time || 0,
                        servings: meal.servings || 1,
                        nutrition: meal.nutrition || { calories: 0, protein: 0, carbs: 0, fat: 0 },
                        imageUrl: meal.imageUrl || meal.image_url || "",
                        imagePrompt: meal.imagePrompt || meal.image_prompt || "",
                    };
                });

                report.meals_library.total_meals = meals.length;
                report.meals_library.status = "found";

                // Count by meal type
                meals.forEach((meal) => {
                    const type = meal.meal_type.toLowerCase();
                    if (type === "breakfast") report.meals_library.breakdown.breakfast++;
                    else if (type === "lunch") report.meals_library.breakdown.lunch++;
                    else if (type === "snack") report.meals_library.breakdown.snack++;
                    else if (type === "dinner") report.meals_library.breakdown.dinner++;
                });

                // Get sample meals (first 3)
                report.meals_library.sample_meals = meals.slice(0, 3).map(meal => ({
                    meal_id: meal.meal_id,
                    name: meal.name,
                    meal_type: meal.meal_type,
                    has_image: !!meal.imageUrl,
                    image_url: meal.imageUrl,
                }));

                // Check for missing fields
                meals.forEach((meal, index) => {
                    if (!meal.meal_id) report.meals_library.missing_fields.push(`Meal ${index}: missing meal_id`);
                    if (!meal.name) report.meals_library.missing_fields.push(`Meal ${index}: missing name`);
                    if (!meal.meal_type) report.meals_library.missing_fields.push(`Meal ${index}: missing meal_type`);
                    if (!meal.imageUrl) report.meals_library.missing_fields.push(`Meal ${index} (${meal.name}): missing imageUrl`);
                });

            } else {
                report.meals_library.status = "empty";
                report.meals_library.errors.push("No meals found in meals_library table");
            }
        } catch (error) {
            report.meals_library.status = "error";
            report.meals_library.errors.push(`DynamoDB error: ${error instanceof Error ? error.message : "Unknown error"}`);
        }

        // 2. Check MealPlanData table
        try {
            console.log("📋 Checking MealPlanData table...");

            const planScanCommand = new ScanCommand({
                TableName: MEAL_PLAN_DATA_TABLE,
            });

            const planScanResult = await dynamoClient.send(planScanCommand);

            if (planScanResult.Items && planScanResult.Items.length > 0) {
                report.meal_plan_data.total_plans = planScanResult.Items.length;
                report.meal_plan_data.status = "found";

                // Get sample plans (first 2)
                report.meal_plan_data.sample_plans = planScanResult.Items.slice(0, 2).map(item => {
                    const plan = unmarshall(item);
                    return {
                        week_id: plan.week_id,
                        generated_at: plan.generated_at,
                        meals_count: plan.meals ? plan.meals.length : 0,
                    };
                });
            } else {
                report.meal_plan_data.status = "empty";
            }
        } catch (error) {
            report.meal_plan_data.status = "error";
            report.meal_plan_data.errors.push(`DynamoDB error: ${error instanceof Error ? error.message : "Unknown error"}`);
        }

        // 3. Check S3 buckets - try different possible names
        let foundBucket = null;

        for (const bucketName of POSSIBLE_BUCKET_NAMES) {
            try {
                console.log(`🖼️ Checking S3 bucket: ${bucketName}...`);

                const listCommand = new ListObjectsV2Command({
                    Bucket: bucketName,
                    MaxKeys: 100, // Get first 100 objects
                });

                const listResult = await s3Client.send(listCommand);

                if (listResult.Contents && listResult.Contents.length > 0) {
                    foundBucket = bucketName;
                    report.s3_bucket.bucket_name = bucketName;
                    report.s3_bucket.total_images = listResult.Contents.length;
                    report.s3_bucket.status = "found";

                    // Get sample image keys
                    report.s3_bucket.sample_images = listResult.Contents.slice(0, 5).map(obj => obj.Key || "unknown");

                    console.log(`✅ Found S3 bucket: ${bucketName} with ${listResult.Contents.length} images`);
                    break; // Found a working bucket, stop searching
                }
            } catch (error) {
                // Continue to next bucket name
                console.log(`❌ Bucket ${bucketName} not accessible: ${error instanceof Error ? error.message : "Unknown"}`);
            }
        }

        if (!foundBucket) {
            report.s3_bucket.status = "error";
            report.s3_bucket.errors.push(`None of the possible bucket names work: ${POSSIBLE_BUCKET_NAMES.join(", ")}`);
        } else {
            // Check if specific meal images exist in the found bucket
            if (report.meals_library.sample_meals.length > 0) {
                for (const meal of report.meals_library.sample_meals) {
                    if (meal.image_url) {
                        // Extract S3 key from URL
                        const urlParts = meal.image_url.split('/');
                        const s3Key = urlParts[urlParts.length - 1];

                        try {
                            await s3Client.send(new HeadObjectCommand({
                                Bucket: foundBucket,
                                Key: s3Key,
                            }));
                            console.log(`✅ Image exists: ${s3Key}`);
                        } catch (headError) {
                            report.s3_bucket.missing_images.push(`${meal.name}: ${s3Key}`);
                            console.log(`❌ Image missing: ${s3Key}`);
                        }
                    }
                }
            }
        }

        // 4. Generate summary and recommendations
        const issues = [];
        const recommendations = [];

        // Check meals library
        if (report.meals_library.status === "error") {
            issues.push("Cannot access meals_library table");
            recommendations.push("Check DynamoDB permissions and table name");
        } else if (report.meals_library.status === "empty") {
            issues.push("meals_library table is empty");
            recommendations.push("Need to populate meals_library with 56 meals (14 of each type)");
        } else if (report.meals_library.total_meals !== 56) {
            issues.push(`Expected 56 meals, found ${report.meals_library.total_meals}`);
            recommendations.push("Need to add missing meals to reach 56 total");
        }

        // Check meal type distribution
        const { breakfast, lunch, snack, dinner } = report.meals_library.breakdown;
        if (breakfast !== 14) issues.push(`Expected 14 breakfasts, found ${breakfast}`);
        if (lunch !== 14) issues.push(`Expected 14 lunches, found ${lunch}`);
        if (snack !== 14) issues.push(`Expected 14 snacks, found ${snack}`);
        if (dinner !== 14) issues.push(`Expected 14 dinners, found ${dinner}`);

        // Check S3 bucket
        if (report.s3_bucket.status === "error") {
            issues.push("Cannot access S3 bucket");
            recommendations.push("Check S3 permissions and bucket name");
        } else if (report.s3_bucket.status === "empty") {
            issues.push("S3 bucket is empty");
            recommendations.push("Need to upload meal images to S3 bucket");
        }

        // Check missing images
        if (report.s3_bucket.missing_images.length > 0) {
            issues.push(`${report.s3_bucket.missing_images.length} meal images are missing from S3`);
            recommendations.push("Upload missing meal images to S3 bucket");
        }

        report.summary.issues_found = issues;
        report.summary.recommendations = recommendations;
        report.summary.all_systems_ok = issues.length === 0;

        console.log("✅ AWS data verification completed");

        return NextResponse.json(report);

    } catch (error) {
        console.error("❌ Error during AWS verification:", error);
        return NextResponse.json({
            error: "Verification failed",
            message: error instanceof Error ? error.message : "Unknown error",
            timestamp: new Date().toISOString(),
        }, { status: 500 });
    }
}