import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";
import { GeneratedMeal } from "./ai-meal-generator";

let bedrockClient: BedrockRuntimeClient | null = null;

const getBedrockClient = () => {
  if (bedrockClient) return bedrockClient;
  
  const bearerToken = process.env.AWS_BEARER_TOKEN_BEDROCK;
  
  if (!bearerToken) {
    throw new Error("AWS_BEARER_TOKEN_BEDROCK is required");
  }
  
  bedrockClient = new BedrockRuntimeClient({
    region: process.env.AWS_REGION || "us-east-1",
  });

  // Add bearer token to the client
  const originalSend = bedrockClient.send.bind(bedrockClient);
  bedrockClient.send = function(command: any) {
    if (!command.input) command.input = {};
    if (!command.input.headers) command.input.headers = {};
    command.input.headers['Authorization'] = `Bearer ${bearerToken}`;
    return originalSend(command);
  };

  return bedrockClient;
};

const s3Client = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const S3_BUCKET = "scuzi-ai-recipes";

export interface MealWithImage extends GeneratedMeal {
  meal_id: string;
  imageUrl: string;
}

async function retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      if (attempt === maxRetries) throw error;
      console.log(`[RETRY] Attempt ${attempt} failed, retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 2; // Exponential backoff
    }
  }
  throw new Error("Max retries exceeded");
}

async function generateSingleMealImage(meal: GeneratedMeal, userId: string): Promise<string> {
  console.log(`[IMAGE-GEN] Generating image for: ${meal.name}`);

  const enhancedPrompt = `Professional food photography of ${meal.image_prompt}. 
High-quality, appetizing, well-lit, restaurant-style presentation. 
Clean white background, natural lighting, sharp focus, vibrant colors. 
Shot from a 45-degree angle showing the complete dish. 
No text, logos, or watermarks. Photorealistic style.`;

  const input = {
    taskType: "TEXT_IMAGE",
    textToImageParams: {
      text: enhancedPrompt,
      negativeText: "blurry, dark, unappetizing, messy, low quality, text, watermark, logo",
    },
    imageGenerationConfig: {
      numberOfImages: 1,
      height: 512,
      width: 512,
      cfgScale: 8.0,
      seed: Math.floor(Math.random() * 1000000),
    },
  };

  const command = new InvokeModelCommand({
    modelId: "amazon.titan-image-generator-v2:0",
    body: JSON.stringify(input),
    contentType: "application/json",
    accept: "application/json",
  });

  const response = await retryOperation(() => getBedrockClient().send(command), 3, 2000);
  const responseBody = JSON.parse(new TextDecoder().decode(response.body));
  const base64Image = responseBody.images[0];
  
  console.log(`[IMAGE-GEN] ✓ Generated image for: ${meal.name}`);
  return base64Image;
}

async function uploadImageToS3(base64Image: string, mealId: string, userId: string): Promise<string> {
  const imageBuffer = Buffer.from(base64Image, 'base64');
  const currentDate = new Date();
  const year = currentDate.getFullYear();
  const month = String(currentDate.getMonth() + 1).padStart(2, '0');
  const day = String(currentDate.getDate()).padStart(2, '0');
  
  const s3Key = `user_${userId}/${year}/${month}/${day}/meal_${mealId}.jpg`;
  
  const uploadCommand = new PutObjectCommand({
    Bucket: S3_BUCKET,
    Key: s3Key,
    Body: imageBuffer,
    ContentType: 'image/jpeg',
    ContentEncoding: 'base64',
  });

  await s3Client.send(uploadCommand);
  
  const imageUrl = `https://${S3_BUCKET}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${s3Key}`;
  console.log(`[S3-UPLOAD] ✓ Uploaded image: ${s3Key}`);
  
  return imageUrl;
}

export async function generateMealImages(
  meals: GeneratedMeal[], 
  userId: string,
  onProgress?: (completed: number, total: number) => void
): Promise<MealWithImage[]> {
  console.log(`[IMAGE-GEN] Starting batch image generation for ${meals.length} meals`);
  
  const mealsWithImages: MealWithImage[] = [];
  const batchSize = 3; // Process 3 images at a time to avoid rate limits
  
  for (let i = 0; i < meals.length; i += batchSize) {
    const batch = meals.slice(i, i + batchSize);
    
    const batchPromises = batch.map(async (meal) => {
      try {
        const mealId = uuidv4();
        
        // Generate image
        const base64Image = await generateSingleMealImage(meal, userId);
        
        // Upload to S3
        const imageUrl = await uploadImageToS3(base64Image, mealId, userId);
        
        const mealWithImage: MealWithImage = {
          ...meal,
          meal_id: mealId,
          imageUrl,
        };
        
        return mealWithImage;
      } catch (error) {
        console.error(`[IMAGE-GEN] Failed to generate image for ${meal.name}:`, error);
        
        // Return meal with fallback image
        const mealWithImage: MealWithImage = {
          ...meal,
          meal_id: uuidv4(),
          imageUrl: `https://${S3_BUCKET}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/assets/default_meal.jpg`,
        };
        
        return mealWithImage;
      }
    });
    
    const batchResults = await Promise.all(batchPromises);
    mealsWithImages.push(...batchResults);
    
    // Report progress
    if (onProgress) {
      onProgress(mealsWithImages.length, meals.length);
    }
    
    console.log(`[IMAGE-GEN] Completed batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(meals.length / batchSize)}`);
    
    // Rate limiting: wait between batches
    if (i + batchSize < meals.length) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  console.log(`[IMAGE-GEN] ✓ Completed image generation for all ${meals.length} meals`);
  return mealsWithImages;
}

export async function generateSingleImage(meal: GeneratedMeal, userId: string): Promise<MealWithImage> {
  const mealId = uuidv4();
  
  try {
    const base64Image = await generateSingleMealImage(meal, userId);
    const imageUrl = await uploadImageToS3(base64Image, mealId, userId);
    
    return {
      ...meal,
      meal_id: mealId,
      imageUrl,
    };
  } catch (error) {
    console.error(`[IMAGE-GEN] Failed to generate image for ${meal.name}:`, error);
    
    return {
      ...meal,
      meal_id: mealId,
      imageUrl: `https://${S3_BUCKET}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/assets/default_meal.jpg`,
    };
  }
}