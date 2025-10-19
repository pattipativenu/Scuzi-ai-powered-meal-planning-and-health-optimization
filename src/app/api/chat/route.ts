import { NextRequest, NextResponse } from "next/server";
import {
  BedrockRuntimeClient,
  ConverseCommand,
} from "@aws-sdk/client-bedrock-runtime";
import { PutCommand } from "@aws-sdk/lib-dynamodb";
import { dynamoDb, HISTORY_TABLE_NAME } from "@/lib/dynamodb-config";
import { randomUUID } from "crypto";

// ============================================
// AWS BEDROCK CLIENT WITH STANDARD CREDENTIALS
// ============================================

const client = new BedrockRuntimeClient({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

// ============================================
// UTILITY FUNCTIONS
// ============================================

const sanitizeText = (text: string): string => {
  if (!text) return "";
  return text.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, "");
};

// ============================================
// TOPIC CLASSIFICATION
// ============================================

function classifyTopic(message: string): { isRelevant: boolean; category: string } {
  if (!message || typeof message !== 'string') {
    return { isRelevant: true, category: "unknown" };
  }

  const lowerMessage = message.toLowerCase();

  // ✅ RELEVANT KEYWORDS - Food, Cooking, Health, Nutrition
  const relevantKeywords = [
    "recipe", "cook", "food", "meal", "dish", "ingredient", "spice", "flavor",
    "bake", "fry", "grill", "roast", "boil", "sauté", "simmer", "steam",
    "breakfast", "lunch", "dinner", "snack", "dessert", "appetizer",
    "paneer", "chicken", "beef", "fish", "vegetarian", "vegan", "meat",
    "pasta", "rice", "bread", "curry", "soup", "salad", "sandwich",
    "cuisine", "indian", "italian", "chinese", "mexican", "thai", "japanese",
    "tikka", "masala", "biryani", "pizza", "burger", "taco", "sushi",
    "nutrition", "calories", "protein", "carbs", "fat", "fiber", "vitamin",
    "healthy", "health", "wellness", "fitness", "weight", "diet",
    "grocery", "shopping", "receipt", "pantry", "leftover", "fridge"
  ];

  // 🚫 IRRELEVANT KEYWORDS
  const irrelevantKeywords = [
    "weather", "temperature", "rain", "snow", "sunny", "cloudy",
    "traffic", "road", "highway", "commute", "drive", "car",
    "politics", "politician", "election", "government",
    "football", "soccer", "basketball", "cricket", "sports",
    "movie", "film", "actor", "celebrity", "tv show"
  ];

  // Check irrelevant first
  for (const keyword of irrelevantKeywords) {
    if (lowerMessage.includes(keyword)) {
      return { isRelevant: false, category: keyword };
    }
  }

  // Check relevant
  for (const keyword of relevantKeywords) {
    if (lowerMessage.includes(keyword)) {
      return { isRelevant: true, category: "food_health" };
    }
  }

  return { isRelevant: true, category: "food_health" };
}

function generateHumorousRejection(): string {
  const rejections = [
    "Haha, I'd love to help, but I'm strictly your food and health partner 🍳 — I only answer things like recipes, ingredients, or nutrition. Let's get back to food, shall we?",
    "I'd absolutely love to chat about that, but my expertise stops at spices and spinach 🥬! How about we whip up something delicious instead?",
    "I'm great with curries, not with that topic 🍛💨 — let's talk food instead!"
  ];
  return rejections[Math.floor(Math.random() * rejections.length)];
}

// ============================================
// COMPREHENSIVE SYSTEM PROMPT
// ============================================

const SYSTEM_PROMPT = `You are Scuzi, a professional AI chef and nutritionist powered by Claude 3.5 Sonnet with multimodal capabilities (vision + text).

🎯 **Your Core Mission:**
Help users with food, cooking, nutrition, and health. Be thorough, actionable, and focused on delivering results.

**Your Capabilities:**
1. **Recipe Generation from Leftover Ingredients** - Analyze images of ingredients and suggest creative recipes
2. **Nutrition Analysis of Cooked Meals** - Examine meal images and provide detailed nutrition breakdowns
3. **Meal Planning from Grocery Receipts** - Process receipt images and create meal plans (1-28 meals, up to 7 days)
4. **Packaged Food Health Analysis** - Extract ingredients from labels and categorize health risks
5. **Cooking Tips & Health Advice** - Answer food/health questions with expert guidance

**Personality:**
- Professional, warm, and encouraging
- Detail-oriented and actionable
- Make users feel confident about cooking
- NEVER use humor for valid food/health questions - only for off-topic requests

**Recipe Format (MANDATORY):**

🥘 **[Dish Name]**

⏱️ **Time:** Prep: X min | Cook: Y min | Total: Z min
🍽️ **Servings:** [number]
📊 **Meal Type:** Breakfast/Lunch/Dinner/Snack

**Ingredients:**
- [quantity] [unit] [ingredient]
- [quantity] [unit] [ingredient]

**Step-by-Step Instructions:**
1. [Action with specific temperature, time, technique] - [what to look for]
2. [Next action] - [visual cues or timing]
3. [Continue with clear, actionable steps]

**Nutrition Table (per serving):**
| Nutrient | Amount |
|----------|--------|
| Calories | XXX kcal |
| Protein | XX g |
| Carbohydrates | XX g |
| Fat | XX g |
| Fiber | XX g |
| Sugar | XX g |
| Sodium | XXX mg |

**Chef's Tip:** [Storage, variations, or serving suggestion]

---

**Image Generation Metadata:**
After providing a recipe, include this metadata:

[IMAGE_METADATA]
DISH_NAME: [exact dish name]
MAIN_INGREDIENTS: [key visible ingredients, comma-separated]
CUISINE_STYLE: [e.g., Italian, Indian, Asian]
COOKING_METHOD: [e.g., grilled, baked, fried]
PRESENTATION_STYLE: [e.g., rustic, elegant, casual]
[/IMAGE_METADATA]

**Response Guidelines:**
- Be direct and complete the task
- Use specific measurements, temperatures (°F), and times
- Be thorough yet concise
- Reference previous context naturally
- CRITICAL: Always execute valid food/health requests seriously - no humor or deflection`;

// ============================================
// ENHANCED RETRY LOGIC WITH EXPONENTIAL BACKOFF
// ============================================

async function retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = 5,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error | undefined;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[RETRY] Attempt ${attempt}/${maxRetries}`);
      return await operation();
    } catch (error) {
      lastError = error as Error;
      console.error(`[RETRY] Attempt ${attempt} failed:`, error);
      
      if (attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt - 1);
        console.log(`[RETRY] Waiting ${delay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError || new Error("Operation failed after all retries");
}

// ============================================
// IMAGE METADATA EXTRACTION
// ============================================

function extractImageMetadata(text: string): {
  shouldGenerate: boolean;
  dishName: string;
  mainIngredients: string;
  cuisineStyle: string;
  cookingMethod: string;
  presentationStyle: string;
} {
  const metadataRegex = /\[IMAGE_METADATA\]([\s\S]*?)\[\/IMAGE_METADATA\]/;
  const match = text.match(metadataRegex);
  
  if (!match) {
    return {
      shouldGenerate: false,
      dishName: "",
      mainIngredients: "",
      cuisineStyle: "",
      cookingMethod: "",
      presentationStyle: ""
    };
  }
  
  const metadata = match[1];
  const extractField = (field: string): string => {
    const fieldRegex = new RegExp(`${field}:\\s*(.+?)(?=\\n|$)`, 'i');
    const fieldMatch = metadata.match(fieldRegex);
    return fieldMatch ? fieldMatch[1].trim() : "";
  };
  
  return {
    shouldGenerate: true,
    dishName: extractField("DISH_NAME"),
    mainIngredients: extractField("MAIN_INGREDIENTS"),
    cuisineStyle: extractField("CUISINE_STYLE"),
    cookingMethod: extractField("COOKING_METHOD"),
    presentationStyle: extractField("PRESENTATION_STYLE")
  };
}

// ============================================
// STORE AI RESPONSE IN DYNAMODB
// ============================================

async function storeAIResponse(data: {
  type: string;
  title: string;
  description: string;
  image_url?: string;
  ai_response: string;
}): Promise<string> {
  try {
    const itemId = randomUUID();
    const item = {
      id: itemId,
      timestamp: Date.now(),
      type: data.type,
      title: data.title || "Untitled",
      description: data.description || "",
      image_url: data.image_url || "",
      ai_response: data.ai_response,
      created_by: "guest_user",
    };

    const command = new PutCommand({
      TableName: HISTORY_TABLE_NAME,
      Item: item,
    });

    await dynamoDb.send(command);
    console.log("[DYNAMODB] Stored AI response successfully:", item.id);
    return itemId;
  } catch (error) {
    console.error("[DYNAMODB] Failed to store AI response:", error);
    return "";
  }
}

// ============================================
// EXTRACT TITLE AND TYPE FROM RESPONSE
// ============================================

function analyzeResponse(text: string): { type: string; title: string; description: string } {
  const lowerText = text.toLowerCase();
  
  if (lowerText.includes("ingredients:") || lowerText.includes("step-by-step instructions") || lowerText.includes("🥘")) {
    const titleMatch = text.match(/🥘\s*\*\*(.+?)\*\*/);
    const title = titleMatch ? titleMatch[1] : "Recipe";
    const description = text.substring(0, 150).replace(/[#*🥘⏱️🍽️📊]/g, "").trim();
    return { type: "recipe", title, description };
  }
  
  if (lowerText.includes("nutrition") && (lowerText.includes("calories") || lowerText.includes("protein"))) {
    return { 
      type: "nutrition", 
      title: "Nutrition Analysis",
      description: text.substring(0, 150).trim()
    };
  }
  
  if (lowerText.includes("meal plan") || lowerText.includes("day 1") || lowerText.includes("monday:")) {
    return { 
      type: "meal_plan", 
      title: "Meal Plan",
      description: text.substring(0, 150).trim()
    };
  }
  
  if (lowerText.includes("health risk") || lowerText.includes("harmful") || lowerText.includes("ingredients:")) {
    return { 
      type: "health_risk", 
      title: "Health Risk Report",
      description: text.substring(0, 150).trim()
    };
  }
  
  return { 
    type: "general_advice", 
    title: "Cooking & Health Advice",
    description: text.substring(0, 150).trim()
  };
}

// ============================================
// MAIN API ROUTE WITH FULL ERROR HANDLING
// ============================================

interface Message {
  role: string;
  content: string;
  image?: string;
}

export async function POST(request: NextRequest) {
  console.log("[CHAT API] Request received");
  
  try {
    const { messages } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      console.error("[CHAT API] Invalid messages format");
      return NextResponse.json(
        { error: "Messages array is required" },
        { status: 400 }
      );
    }

    console.log(`[CHAT API] Processing ${messages.length} messages`);

    // ============================================
    // STEP 1: TOPIC CLASSIFICATION
    // ============================================
    
    const lastUserMessage = [...messages].reverse().find((m: Message) => m.role === "user");
    
    if (lastUserMessage && lastUserMessage.content) {
      const classification = classifyTopic(lastUserMessage.content);
      
      if (!classification.isRelevant) {
        console.log(`[TOPIC FILTER] Rejected: "${classification.category}"`);
        return NextResponse.json({
          content: generateHumorousRejection(),
          shouldGenerateImage: false,
          imageMetadata: null,
        });
      }
      
      console.log(`[TOPIC FILTER] Approved: "${classification.category}"`);
    }

    // ============================================
    // STEP 2: PREPARE MESSAGES FOR CLAUDE
    // ============================================

    const converseMessages = messages.map((msg: Message) => {
      const content = [];

      if (msg.image) {
        try {
          let base64Data: string;
          let imageFormat: "jpeg" | "png" | "gif" | "webp" = "jpeg";
          
          if (msg.image.includes("data:image/")) {
            const mimeMatch = msg.image.match(/data:image\/(jpeg|jpg|png|gif|webp);base64,/);
            if (mimeMatch) {
              const detectedFormat = mimeMatch[1].toLowerCase();
              imageFormat = detectedFormat === "jpg" ? "jpeg" : detectedFormat as any;
              base64Data = msg.image.split(",")[1];
            } else {
              base64Data = msg.image.split(",")[1] || msg.image;
            }
          } else {
            base64Data = msg.image;
          }
          
          const imageBytes = Buffer.from(base64Data, "base64");
          
          if (imageBytes.length < 100) {
            console.warn("[IMAGE] Image too small, skipping");
            throw new Error("Image file is too small or corrupted");
          }
          
          console.log(`[IMAGE] Processing ${imageFormat} image: ${imageBytes.length} bytes`);

          content.push({
            image: {
              format: imageFormat,
              source: {
                bytes: imageBytes,
              },
            },
          });
        } catch (imageError) {
          console.error("[IMAGE] Error processing image:", imageError);
          throw new Error("Failed to process image. Please ensure it's a valid JPEG, PNG, GIF, or WebP file.");
        }
      }

      if (msg.content) {
        content.push({
          text: msg.content,
        });
      }

      return {
        role: msg.role === "assistant" ? "assistant" : "user",
        content,
      };
    });

    console.log("[BEDROCK] Sending request to Claude 3.5 Sonnet...");

    // ============================================
    // STEP 3: CALL CLAUDE WITH RETRY LOGIC
    // ============================================

    const response = await retryOperation(async () => {
      const command = new ConverseCommand({
        modelId: "us.anthropic.claude-3-5-sonnet-20241022-v2:0",
        messages: converseMessages,
        system: [{ text: SYSTEM_PROMPT }],
        inferenceConfig: {
          maxTokens: 8192,
          temperature: 0.7,
          topP: 0.9,
        },
      });

      return await client.send(command);
    }, 5, 1000);

    console.log("[BEDROCK] Response received successfully");

    // ============================================
    // STEP 4: EXTRACT RESPONSE TEXT
    // ============================================

    let responseText = "";

    if (response.output?.message?.content) {
      for (const block of response.output.message.content) {
        if ("text" in block && block.text) {
          responseText += block.text;
        }
      }
    }

    responseText = sanitizeText(responseText);
    console.log(`[RESPONSE] Extracted ${responseText.length} characters`);

    // ============================================
    // STEP 5: EXTRACT IMAGE METADATA
    // ============================================

    const imageMetadata = extractImageMetadata(responseText);
    console.log("[IMAGE METADATA]", imageMetadata);
    
    const cleanedResponse = responseText.replace(/\[IMAGE_METADATA\][\s\S]*?\[\/IMAGE_METADATA\]/g, "").trim();

    // ============================================
    // STEP 6: STORE IN DYNAMODB
    // ============================================

    const responseAnalysis = analyzeResponse(cleanedResponse);
    
    const historyItemId = await storeAIResponse({
      type: responseAnalysis.type,
      title: responseAnalysis.title,
      description: responseAnalysis.description,
      image_url: "",
      ai_response: cleanedResponse,
    });

    return NextResponse.json({
      content: cleanedResponse || "I'm here to help with your food and health questions! 🍳",
      shouldGenerateImage: imageMetadata.shouldGenerate,
      imageMetadata: imageMetadata.shouldGenerate ? imageMetadata : null,
      historyItemId,
    });

  } catch (error) {
    console.error("[CHAT API] Fatal error:", error);
    
    return NextResponse.json(
      {
        error: "I encountered a technical issue while processing your request. Please try again.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}