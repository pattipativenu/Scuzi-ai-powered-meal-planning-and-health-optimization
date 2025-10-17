import { NextRequest, NextResponse } from "next/server";
import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from "@aws-sdk/client-bedrock-runtime";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

// Configure Bedrock client
const getBedrockClient = () => {
  const bearerToken = process.env.AWS_BEARER_TOKEN_BEDROCK;
  
  if (bearerToken) {
    const client = new BedrockRuntimeClient({
      region: process.env.AWS_REGION || "us-east-1",
    });

    client.middlewareStack.add(
      (next: any) => async (args: any) => {
        args.request.headers.Authorization = `Bearer ${bearerToken}`;
        return next(args);
      },
      {
        step: "build",
        name: "addBearerToken",
      }
    );

    return client;
  } else {
    return new BedrockRuntimeClient({
      region: process.env.AWS_REGION || "us-east-1",
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
      },
    });
  }
};

// Configure S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

const bedrockClient = getBedrockClient();

// Image prompts for each category
const IMAGE_PROMPTS = {
  food: [
    "A gourmet pasta dish with fresh basil and tomatoes, professional food photography, 4k, vibrant colors",
    "A colorful Buddha bowl with quinoa, avocado, and roasted vegetables, top-down view, bright lighting",
    "A perfectly seared salmon fillet with lemon and herbs, restaurant plating, shallow depth of field",
    "A fresh Greek salad with feta cheese and olives, natural lighting, rustic wooden table",
    "A steaming bowl of ramen with soft-boiled egg and green onions, close-up, appetizing steam",
    "Grilled chicken breast with seasonal vegetables, clean white plate, professional presentation",
    "A vibrant poke bowl with tuna, edamame, and sesame seeds, overhead shot, colorful arrangement",
    "Roasted Mediterranean vegetables with chickpeas, warm lighting, artisanal ceramic bowl",
  ],
  cooking: [
    "A happy chef preparing food in a modern bright kitchen, natural lighting, lifestyle photography",
    "Hands chopping fresh vegetables on a wooden cutting board, close-up, warm kitchen atmosphere",
    "A family cooking together in a cozy kitchen, laughing and having fun, candid lifestyle shot",
    "Professional chef plating a beautiful dish with precision, restaurant kitchen, focused expression",
    "A woman tasting food from a wooden spoon while cooking, warm kitchen lighting, joyful expression",
    "Multiple pots and pans on a stove with steam rising, busy kitchen scene, dynamic composition",
    "Friends preparing a meal together, bright modern kitchen, social gathering, natural smiles",
    "Close-up of hands kneading dough on a floured surface, artisanal baking, rustic kitchen",
  ],
  snacks: [
    "A variety of healthy snacks on a white marble board: nuts, berries, and cheese, top-down view",
    "Fresh fruit kebabs with colorful berries and melon, bright background, kid-friendly presentation",
    "Crispy vegetable chips in a bowl with various dips, natural lighting, appetizing colors",
    "Energy balls with dates and nuts, scattered on parchment paper, rustic food photography",
    "Greek yogurt parfait with granola and berries in a glass jar, layered presentation, morning light",
    "Homemade trail mix with nuts and dried fruits in small bowls, overhead shot, healthy snacking",
    "Rice cakes with avocado and cherry tomatoes, minimal plating, clean healthy aesthetic",
    "Hummus with fresh vegetables and pita bread, Mediterranean style, vibrant colors",
  ],
};

async function generateImage(prompt: string, category: string): Promise<string> {
  const input = {
    taskType: "TEXT_IMAGE",
    textToImageParams: {
      text: prompt,
      negativeText: "blurry, low quality, dark, unappetizing, messy, dirty, amateur, cartoon, illustration, text, watermark",
    },
    imageGenerationConfig: {
      numberOfImages: 1,
      quality: "premium",
      height: 768,
      width: 512,
      cfgScale: 8.0,
      seed: Math.floor(Math.random() * 2147483647),
    },
  };

  const command = new InvokeModelCommand({
    modelId: "amazon.titan-image-generator-v2:0",
    body: JSON.stringify(input),
    contentType: "application/json",
    accept: "application/json",
  });

  const response = await bedrockClient.send(command);
  const responseBody = JSON.parse(new TextDecoder().decode(response.body));
  const base64Image = responseBody.images[0];

  // Store in S3 if bucket is configured
  const bucketName = process.env.AWS_S3_BUCKET_NAME;
  if (bucketName) {
    try {
      const buffer = Buffer.from(base64Image, "base64");
      const fileName = `hero-images/${category}/${Date.now()}-${Math.random().toString(36).substring(7)}.png`;

      await s3Client.send(
        new PutObjectCommand({
          Bucket: bucketName,
          Key: fileName,
          Body: buffer,
          ContentType: "image/png",
        })
      );

      // Return S3 URL
      return `https://${bucketName}.s3.${process.env.AWS_REGION || "us-east-1"}.amazonaws.com/${fileName}`;
    } catch (error) {
      console.error("S3 upload failed, returning base64:", error);
      return `data:image/png;base64,${base64Image}`;
    }
  }

  // Return base64 if no S3 bucket configured
  return `data:image/png;base64,${base64Image}`;
}

export async function POST(request: NextRequest) {
  try {
    const { category, count = 8 } = await request.json();

    if (!category || !IMAGE_PROMPTS[category as keyof typeof IMAGE_PROMPTS]) {
      return NextResponse.json(
        { error: "Valid category required (food, cooking, or snacks)" },
        { status: 400 }
      );
    }

    const prompts = IMAGE_PROMPTS[category as keyof typeof IMAGE_PROMPTS].slice(0, count);
    
    // Generate all images in parallel
    const imageUrls = await Promise.all(
      prompts.map(prompt => generateImage(prompt, category))
    );

    return NextResponse.json({
      category,
      images: imageUrls,
      count: imageUrls.length,
    });
  } catch (error) {
    console.error("Error generating hero images:", error);
    return NextResponse.json(
      {
        error: "Failed to generate images",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: "Hero images generation endpoint",
    categories: ["food", "cooking", "snacks"],
    usage: "POST with { category: 'food'|'cooking'|'snacks', count?: number }",
  });
}