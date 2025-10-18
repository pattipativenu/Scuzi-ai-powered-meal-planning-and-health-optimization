import { NextRequest, NextResponse } from "next/server";
import {
  BedrockRuntimeClient,
  ConverseCommand,
} from "@aws-sdk/client-bedrock-runtime";

// Configure client with bearer token authentication
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

const client = getBedrockClient();

const sanitizeText = (text: string): string => {
  if (!text) return "";
  return text.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, "");
};

// ============================================
// TOPIC CLASSIFICATION - CRITICAL LOGIC
// ============================================

/**
 * Classifies if the user message is relevant to food/health topics
 * Returns: { isRelevant: boolean, category: string }
 */
function classifyTopic(message: string): { isRelevant: boolean; category: string } {
  if (!message || typeof message !== 'string') {
    return { isRelevant: true, category: "unknown" };
  }

  const lowerMessage = message.toLowerCase();

  // ✅ RELEVANT KEYWORDS - Food, Cooking, Health, Nutrition
  const relevantKeywords = [
    // Food & Cooking
    "recipe", "cook", "food", "meal", "dish", "ingredient", "spice", "flavor",
    "bake", "fry", "grill", "roast", "boil", "sauté", "simmer", "steam",
    "breakfast", "lunch", "dinner", "snack", "dessert", "appetizer",
    "paneer", "chicken", "beef", "fish", "vegetarian", "vegan", "meat",
    "pasta", "rice", "bread", "curry", "soup", "salad", "sandwich",
    "cuisine", "indian", "italian", "chinese", "mexican", "thai", "japanese",
    "tikka", "masala", "biryani", "pizza", "burger", "taco", "sushi",
    
    // Nutrition & Diet
    "nutrition", "calories", "protein", "carbs", "fat", "fiber", "vitamin",
    "mineral", "macro", "micro", "nutrient", "dietary", "diet",
    "healthy", "health", "wellness", "fitness", "weight", "calorie",
    "keto", "paleo", "mediterranean", "low-carb", "high-protein",
    "allergy", "intolerance", "gluten", "dairy", "lactose", "nut",
    
    // Grocery & Planning
    "grocery", "shopping", "receipt", "pantry", "leftover", "fridge",
    "store", "market", "plan", "meal prep", "portion", "serving",
    
    // Kitchen & Tools
    "kitchen", "oven", "stove", "pan", "pot", "knife", "blender",
    "pressure cooker", "air fryer", "microwave", "refrigerator",
    
    // Health & Supplements
    "supplement", "vitamin", "protein shake", "smoothie", "juice",
    "hydration", "water intake", "sugar", "sodium", "cholesterol"
  ];

  // 🚫 IRRELEVANT KEYWORDS - Everything else
  const irrelevantKeywords = [
    // Weather & Environment
    "weather", "temperature", "rain", "snow", "sunny", "cloudy", "storm",
    "forecast", "climate", "wind", "humidity",
    
    // Traffic & Transportation
    "traffic", "road", "highway", "commute", "drive", "car", "bus", "train",
    "airplane", "flight", "travel route", "congestion", "accident",
    
    // Politics & News
    "politics", "politician", "election", "government", "president", "minister",
    "vote", "campaign", "policy", "law", "congress", "parliament",
    
    // Sports & Entertainment
    "football", "soccer", "basketball", "cricket", "tennis", "match", "game",
    "player", "team", "score", "tournament", "championship",
    "movie", "film", "actor", "celebrity", "tv show", "series",
    
    // Technology (non-food related)
    "computer", "phone", "laptop", "software", "app", "website", "coding",
    "programming", "internet", "wifi", "browser", "email",
    
    // Finance & Business
    "stock", "market", "investment", "crypto", "bitcoin", "trading",
    "business", "company", "startup", "economy",
    
    // Geography & Places
    "country", "city", "capital", "state", "province", "continent",
    "mountain", "river", "ocean", "tourist", "landmark"
  ];

  // Check for irrelevant keywords first
  for (const keyword of irrelevantKeywords) {
    if (lowerMessage.includes(keyword)) {
      return { isRelevant: false, category: keyword };
    }
  }

  // Check for relevant keywords
  for (const keyword of relevantKeywords) {
    if (lowerMessage.includes(keyword)) {
      return { isRelevant: true, category: "food_health" };
    }
  }

  // Default: treat as relevant (give benefit of doubt for food questions)
  // Unless it clearly mentions non-food topics
  return { isRelevant: true, category: "food_health" };
}

/**
 * Generates a humorous rejection for off-topic questions
 */
function generateHumorousRejection(category: string): string {
  const rejections = [
    "Haha, I'd love to help, but I'm strictly your food and health partner 🍳 — I only answer things like recipes, ingredients, or nutrition. Let's get back to food, shall we?",
    "I'd absolutely love to chat about that, but my expertise stops at spices and spinach 🥬! How about we whip up something delicious instead?",
    "Ooh, that's above my pay grade — I'm more of a 'what's for dinner?' kind of AI 😄. Got any food questions for me?",
    "Haha, I wish I could help with that! But I'm programmed to be your food guru. Shall we talk recipes instead?",
    "I'm great with curries, not with that topic 🍛💨 — let's talk food instead!",
    "My knowledge starts in the kitchen and ends at the dinner table 🍽️ — anything food-related I can help with?"
  ];

  // Return a random rejection
  return rejections[Math.floor(Math.random() * rejections.length)];
}

// ============================================
// SYSTEM PROMPT - FOCUSED ON TASK EXECUTION
// ============================================

const SYSTEM_PROMPT = `You are Scuzi, a professional, warm, and encouraging AI chef and nutritionist. Your primary goal is to help people with food, cooking, nutrition, and health questions.

🎯 **Your Core Mission:**
Always complete the user's request when it's food or health-related. Be thorough, helpful, and actionable. Never deflect valid food questions with jokes or humor.

**Your Personality:**
- **Professional & Warm**: Friendly but focused on delivering results
- **Encouraging**: Make users feel confident about cooking and eating well
- **Detail-Oriented**: Provide complete, actionable information
- **Clear & Concise**: Every instruction should be easy to follow

**Critical Rule:** NEVER use humor or jokes when answering valid food, recipe, health, or nutrition questions. Always execute the task seriously and completely.

🍳 **Your Core Capabilities:**

1. **Recipe Generation from Leftover Ingredients**
   - Analyze images of leftover ingredients/pantry items
   - Suggest 2-3 creative, practical recipe ideas
   - Provide complete recipes with step-by-step instructions and nutrition info

2. **Nutrition Analysis of Cooked Meals**
   - Examine images of prepared dishes
   - Provide detailed nutrition breakdown per serving
   - Offer insights on health benefits and improvements

3. **Meal Planning from Grocery Receipts**
   - Process images of grocery receipts
   - Create structured meal plans (1-28 meals spanning up to 7 days)
   - Balance nutrition, variety, and ingredient utilization

4. **Packaged Food Health Analysis**
   - Extract ALL ingredients from product labels
   - Categorize each ingredient by risk level: SAFE ✅ | LOW RISK 🟢 | MEDIUM RISK 🟡 | HIGH RISK 🔴
   - Provide detailed analysis and long-term health risks

5. **Cooking Tips & Health Advice**
   - Answer food and health questions clearly
   - Share practical cooking techniques
   - Explain nutritional concepts simply

📋 **Recipe Format (MANDATORY for all recipes):**

🥘 **[Dish Name]**

⏱️ **Time:** Prep: X min | Cook: Y min | Total: Z min
🍽️ **Servings:** 1 (or specify)
📊 **Meal Type:** Breakfast/Lunch/Dinner/Snack

**Ingredients:**
- X measurement ingredient name
- Y measurement ingredient name

**Step-by-Step Instructions:**
1. [Action] + specific details (temperature, time, technique)
2. [Next action] + what to look for or when it's ready
3. Continue with clear, brief, actionable steps

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

**Chef's Tip:** [One helpful tip about storage, variations, or serving]

---

🎨 **Image Generation Trigger:**
After providing a complete recipe, ALWAYS include:

[IMAGE_METADATA]
DISH_NAME: [exact dish name]
MAIN_INGREDIENTS: [key visible ingredients, comma-separated]
CUISINE_STYLE: [e.g., Italian, Asian, Mediterranean]
COOKING_METHOD: [e.g., grilled, baked, sautéed]
PRESENTATION_STYLE: [e.g., rustic, elegant, casual]
[/IMAGE_METADATA]

---

💬 **Response Guidelines:**
- **Be direct and actionable**: Complete the task, don't deflect
- **Use specific details**: Include temperatures (°F), times (minutes), measurements (tbsp, cups)
- **Be thorough yet concise**: Cover all steps without being verbose
- **Show encouragement**: Brief phrases like "Great question!", "You've got this!"
- **Reference context naturally**: If this is a follow-up, acknowledge previous messages

**CRITICAL:** Never use humor, jokes, or deflections when answering valid food/health questions. Always complete the requested task.`;

// ============================================
// MESSAGE PROCESSING WITH TOPIC CLASSIFICATION
// ============================================

interface Message {
  role: string;
  content: string;
  image?: string;
}

// Retry logic helper
async function retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: Error | undefined;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      console.error(`Attempt ${attempt} failed:`, error);
      
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, delay * attempt));
      }
    }
  }
  
  throw lastError || new Error("Operation failed after retries");
}

// Extract structured image metadata from response
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

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: "Messages array is required" },
        { status: 400 }
      );
    }

    // ============================================
    // STEP 1: TOPIC CLASSIFICATION
    // ============================================
    
    // Get the last user message for classification
    const lastUserMessage = [...messages].reverse().find((m: Message) => m.role === "user");
    
    if (lastUserMessage && lastUserMessage.content) {
      const classification = classifyTopic(lastUserMessage.content);
      
      // If topic is irrelevant, return humorous rejection immediately
      if (!classification.isRelevant) {
        console.log(`[TOPIC FILTER] Rejected off-topic query: "${classification.category}"`);
        return NextResponse.json({
          content: generateHumorousRejection(classification.category),
          shouldGenerateImage: false,
          imageMetadata: null,
        });
      }
      
      console.log(`[TOPIC FILTER] Approved food/health query: "${classification.category}"`);
    }

    // ============================================
    // STEP 2: PROCESS VALID FOOD/HEALTH QUERY
    // ============================================

    // Convert messages to Bedrock format
    const converseMessages = messages.map((msg: Message) => {
      const content = [];

      if (msg.image) {
        const base64Data = msg.image.split(",")[1] || msg.image;
        const imageBytes = Buffer.from(base64Data, "base64");

        content.push({
          image: {
            format: "jpeg",
            source: {
              bytes: imageBytes,
            },
          },
        });
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

    // Call Bedrock with retry logic
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
    }, 3, 1000);

    // Extract response content
    let responseText = "";

    if (response.output?.message?.content) {
      for (const block of response.output.message.content) {
        if ("text" in block && block.text) {
          responseText += block.text;
        }
      }
    }

    responseText = sanitizeText(responseText);

    // Extract image metadata for generation
    const imageMetadata = extractImageMetadata(responseText);
    
    // Remove metadata tags from user-facing response
    const cleanedResponse = responseText.replace(/\[IMAGE_METADATA\][\s\S]*?\[\/IMAGE_METADATA\]/g, "").trim();

    return NextResponse.json({
      content: cleanedResponse || "I'm here to help with your food and health questions! 🍳",
      shouldGenerateImage: imageMetadata.shouldGenerate,
      imageMetadata: imageMetadata.shouldGenerate ? imageMetadata : null,
    });
  } catch (error) {
    console.error("Error calling Bedrock:", error);
    
    // For valid food queries, show professional error message (no humor)
    const errorMessage = "I encountered a technical issue while processing your request. Please try again.";
    
    return NextResponse.json(
      {
        error: errorMessage,
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}