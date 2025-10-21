import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSecrets } from './aws-config';

// Initialize AWS clients
let bedrockClient: BedrockRuntimeClient;
let s3Client: S3Client;

async function initializeClients() {
  if (!bedrockClient || !s3Client) {
    console.log('🔧 Initializing AWS clients for image generation...');

    // Initialize Bedrock client with bearer token
    const bearerToken = process.env.AWS_BEARER_TOKEN_BEDROCK;

    if (bearerToken) {
      console.log('🔑 Using bearer token authentication for Bedrock');

      // Use bearer token authentication for AWS Bedrock
      bedrockClient = new BedrockRuntimeClient({
        region: 'us-east-1',
      });

      // Add middleware to inject bearer token in Authorization header
      bedrockClient.middlewareStack.add(
        (next: any) => async (args: any) => {
          args.request.headers.Authorization = `Bearer ${bearerToken}`;
          return next(args);
        },
        {
          step: "build",
          name: "addBearerToken",
        }
      );

      console.log('✅ Bedrock client initialized with bearer token');
    } else {
      console.log('🔑 Using standard AWS credentials for Bedrock');

      // Fallback to standard AWS credentials
      bedrockClient = new BedrockRuntimeClient({
        region: 'us-east-1',
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
        },
      });

      console.log('✅ Bedrock client initialized with AWS credentials');
    }

    // Initialize S3 client with AWS credentials
    let accessKeyId = process.env.AWS_ACCESS_KEY_ID || '';
    let secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY || '';

    // Try to get credentials from the new secret if environment variables are not set
    if (!accessKeyId || !secretAccessKey || accessKeyId.includes('your_')) {
      try {
        console.log('🔑 Fetching AWS credentials from new secret...');
        const { SecretsManagerClient, GetSecretValueCommand } = await import('@aws-sdk/client-secrets-manager');

        const secretsClient = new SecretsManagerClient({
          region: 'us-east-1',
        });

        const secretResponse = await secretsClient.send(new GetSecretValueCommand({
          SecretId: 'arn:aws:secretsmanager:us-east-1:639261426100:secret:aws/new/keys-drjW3N',
        }));

        if (secretResponse.SecretString) {
          const awsCreds = JSON.parse(secretResponse.SecretString);
          accessKeyId = awsCreds.accessKeyId || awsCreds.access_key_id || awsCreds.AWS_ACCESS_KEY_ID || '';
          secretAccessKey = awsCreds.secretAccessKey || awsCreds.secret_access_key || awsCreds.AWS_SECRET_ACCESS_KEY || '';
          console.log('✅ Retrieved AWS credentials from new secret');
        }
      } catch (error) {
        console.warn('⚠️  Could not fetch from new secret, using environment variables:', error instanceof Error ? error.message : String(error));
      }
    }

    if (!accessKeyId || !secretAccessKey) {
      throw new Error('AWS credentials required for S3 access. Please add valid credentials to the new secret or .env.local');
    }

    s3Client = new S3Client({
      region: 'us-east-1',
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });

    console.log('✅ S3 client initialized with AWS credentials');
    console.log('🎉 All AWS clients ready for image generation!');
  }
}

export interface MealImagePrompt {
  mealId: string;
  mealName: string;
  prompt: string;
}

/**
 * Generate image using AWS Titan G1V2 model
 */
export async function generateMealImage(mealId: string, prompt: string): Promise<string> {
  await initializeClients();

  try {
    console.log(`🎨 Generating image for ${mealId}...`);

    const input = {
      modelId: 'amazon.titan-image-generator-v2:0',
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify({
        taskType: 'TEXT_IMAGE',
        textToImageParams: {
          text: prompt,
          negativeText: 'blurry, low quality, distorted, unrealistic, cartoon, animated, drawing, sketch, watermark, text, logo',
        },
        imageGenerationConfig: {
          numberOfImages: 1,
          height: 1024,
          width: 1024,
          cfgScale: 7.5,
          seed: Math.floor(Math.random() * 1000000),
        },
      }),
    };

    const command = new InvokeModelCommand(input);

    console.log(`🔧 Sending request to Bedrock for ${mealId}...`);
    const response = await bedrockClient.send(command);

    console.log(`📡 Bedrock response status:`, response.$metadata);

    if (!response.body) {
      throw new Error('No response body from Bedrock');
    }

    const responseBody = JSON.parse(new TextDecoder().decode(response.body));

    if (!responseBody.images || responseBody.images.length === 0) {
      throw new Error('No images generated');
    }

    // Get the base64 image data
    const imageBase64 = responseBody.images[0];
    const imageBuffer = Buffer.from(imageBase64, 'base64');

    // Upload to S3
    const s3Key = `meal-images/${mealId}.jpg`;
    const bucketName = 'scuzi-ai-recipes'; // Your S3 bucket name

    const uploadCommand = new PutObjectCommand({
      Bucket: bucketName,
      Key: s3Key,
      Body: imageBuffer,
      ContentType: 'image/jpeg',
      Metadata: {
        mealId: mealId,
        generatedAt: new Date().toISOString(),
        model: 'amazon.titan-image-generator-v2:0',
      },
    });

    await s3Client.send(uploadCommand);

    // Return the S3 URL
    const imageUrl = `https://${bucketName}.s3.amazonaws.com/${s3Key}`;

    console.log(`✅ Image generated and uploaded for ${mealId}: ${imageUrl}`);
    return imageUrl;

  } catch (error) {
    console.error(`❌ Error generating image for ${mealId}:`, error);
    throw error;
  }
}

/**
 * Batch generate images for multiple meals
 */
export async function batchGenerateMealImages(
  mealPrompts: MealImagePrompt[],
  onProgress?: (completed: number, total: number, mealId: string) => void
): Promise<{ mealId: string; imageUrl: string; success: boolean; error?: string }[]> {
  const results: { mealId: string; imageUrl: string; success: boolean; error?: string }[] = [];

  console.log(`🚀 Starting batch image generation for ${mealPrompts.length} meals...`);

  for (let i = 0; i < mealPrompts.length; i++) {
    const { mealId, prompt } = mealPrompts[i];

    try {
      const imageUrl = await generateMealImage(mealId, prompt);
      results.push({ mealId, imageUrl, success: true });

      if (onProgress) {
        onProgress(i + 1, mealPrompts.length, mealId);
      }

      // Add a small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 2000));

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`❌ Failed to generate image for ${mealId}:`, errorMessage);
      results.push({
        mealId,
        imageUrl: '',
        success: false,
        error: errorMessage
      });
    }
  }

  console.log(`🎉 Batch generation complete! ${results.filter(r => r.success).length}/${results.length} successful`);
  return results;
}