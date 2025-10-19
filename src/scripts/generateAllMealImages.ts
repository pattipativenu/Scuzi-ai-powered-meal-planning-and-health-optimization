/**
 * Automated Image Generation Script for Meals Library
 * 
 * This script automatically generates images for all meals in the meals_library
 * table that don't have images yet. It processes meals in batches to avoid
 * overwhelming the AWS Titan Image Generator.
 * 
 * Usage:
 *   npx tsx src/scripts/generateAllMealImages.ts
 * 
 * Environment Variables Required:
 *   - AWS_REGION
 *   - AWS_ACCESS_KEY_ID
 *   - AWS_SECRET_ACCESS_KEY
 *   - AWS_S3_BUCKET_NAME
 */

const API_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const BATCH_SIZE = 5; // Process 5 meals at a time
const DELAY_BETWEEN_BATCHES = 3000; // 3 seconds delay

async function generateAllImages() {
  console.log("🚀 Starting automated image generation for meals library...\n");
  
  let totalProcessed = 0;
  let totalFailed = 0;
  let batchNumber = 1;
  let hasMore = true;

  while (hasMore) {
    console.log(`\n📸 Processing Batch ${batchNumber}...`);
    
    try {
      const response = await fetch(`${API_URL}/api/meals-library/generate-images`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ batchSize: BATCH_SIZE })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      console.log(`✅ Batch ${batchNumber} completed:`);
      console.log(`   - Processed: ${data.processed} meals`);
      console.log(`   - Failed: ${data.failed} meals`);
      console.log(`   - Remaining: ${data.remaining} meals`);
      console.log(`   - Total in library: ${data.total} meals`);
      
      totalProcessed += data.processed;
      totalFailed += data.failed;
      
      // Check if we should continue
      if (data.remaining === 0) {
        hasMore = false;
        console.log("\n🎉 All images generated successfully!");
      } else {
        batchNumber++;
        console.log(`\n⏳ Waiting ${DELAY_BETWEEN_BATCHES / 1000} seconds before next batch...`);
        await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES));
      }
      
    } catch (error) {
      console.error(`\n❌ Error processing batch ${batchNumber}:`, error);
      console.log("Retrying in 5 seconds...");
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("📊 GENERATION SUMMARY");
  console.log("=".repeat(60));
  console.log(`Total Batches Processed: ${batchNumber}`);
  console.log(`Total Images Generated: ${totalProcessed}`);
  console.log(`Total Failures: ${totalFailed}`);
  console.log(`Success Rate: ${((totalProcessed / (totalProcessed + totalFailed)) * 100).toFixed(1)}%`);
  console.log("=".repeat(60));
  
  if (totalFailed > 0) {
    console.log("\n⚠️  Some images failed to generate. You can run this script again to retry.");
  } else {
    console.log("\n✨ All meal images have been successfully generated and uploaded to S3!");
  }
}

// Run the script
generateAllImages().catch((error) => {
  console.error("❌ Fatal error:", error);
  process.exit(1);
});