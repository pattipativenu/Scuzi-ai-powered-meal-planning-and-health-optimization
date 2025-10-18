import { CreateBucketCommand, HeadBucketCommand, PutBucketCorsCommand } from "@aws-sdk/client-s3";
import { s3Client, RECIPES_BUCKET } from "./aws-config";

export async function ensureRecipesBucket() {
  try {
    // Check if bucket exists
    await s3Client.send(new HeadBucketCommand({ Bucket: RECIPES_BUCKET }));
    console.log(`Bucket ${RECIPES_BUCKET} already exists`);
    return true;
  } catch (error: any) {
    if (error.name === "NotFound" || error.$metadata?.httpStatusCode === 404) {
      // Create bucket if it doesn't exist
      console.log(`Creating bucket ${RECIPES_BUCKET}...`);
      
      await s3Client.send(
        new CreateBucketCommand({
          Bucket: RECIPES_BUCKET,
        })
      );
      
      // Set CORS policy
      await s3Client.send(
        new PutBucketCorsCommand({
          Bucket: RECIPES_BUCKET,
          CORSConfiguration: {
            CORSRules: [
              {
                AllowedHeaders: ["*"],
                AllowedMethods: ["GET", "PUT", "POST", "DELETE"],
                AllowedOrigins: ["*"],
                ExposeHeaders: [],
              },
            ],
          },
        })
      );
      
      console.log(`Bucket ${RECIPES_BUCKET} created successfully`);
      return true;
    }
    
    console.error("Error checking/creating bucket:", error);
    return false;
  }
}