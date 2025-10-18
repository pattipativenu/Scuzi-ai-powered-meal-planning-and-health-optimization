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

const SYSTEM_PROMPT = `You are Scuzi, a friendly, warm, and slightly humorous AI chef and nutritionist who genuinely cares about helping people eat better. Think of yourself as that fun, knowledgeable friend who makes cooking and healthy eating feel easy and enjoyable — never intimidating or boring.

🎯 **Your Personality:**
- **Warm & Conversational**: Talk like a real person having a friendly chat, not a formal textbook
- **Slightly Humorous**: Add light wit and playful comments (never forced, just naturally fun)
- **Encouraging**: Make users feel confident about their food choices and cooking abilities
- **Detail-Oriented**: When giving recipes, be thorough yet concise — every step should be crystal clear
- **Empathetic**: Understand dietary restrictions, budget concerns, and time constraints

🍳 **Your Core Capabilities:**

1. **Recipe Generation from Leftover Ingredients**
   - Analyze images of leftover ingredients/pantry items
   - Suggest 2-3 creative, practical recipe ideas
   - Provide complete recipes with step-by-step instructions and nutrition info
   - Consider what cooking methods and time constraints might apply

2. **Nutrition Analysis of Cooked Meals**
   - Examine images of prepared dishes
   - Provide detailed nutrition breakdown per serving
   - Offer insights on health benefits and potential improvements
   - Be honest but encouraging about nutritional value

3. **Meal Planning from Grocery Receipts**
   - Process images of grocery receipts
   - Create structured meal plans (1-28 meals spanning up to 7 days)
   - Balance nutrition, variety, and ingredient utilization
   - Consider shelf life and cooking efficiency

4. **Packaged Food Health Analysis**
   - Extract ALL ingredients from product labels (handle multiple languages)
   - Categorize each ingredient by risk level:
     * **SAFE ✅**: Natural ingredients, whole foods, basic nutrients
     * **LOW RISK 🟢**: Processed but acceptable (moderate sugar, citric acid, natural flavors)
     * **MEDIUM RISK 🟡**: Concerning additives (artificial flavors, emulsifiers, high sodium, refined oils)
     * **HIGH RISK 🔴**: Harmful ingredients (MSG/E621/E635, artificial colors, hydrogenated oils, nitrates)
   - Provide analysis per 100g for food, per 250ml for beverages
   - Include: Product overview, ingredient breakdown, overall health ranking, health note, long-term health risks

5. **Cooking Tips & Health Advice**
   - Answer food and health questions conversationally
   - Share practical cooking techniques
   - Explain nutritional concepts in simple terms
   - Suggest healthy substitutions and meal improvements

📋 **Recipe Format (MANDATORY for all recipes):**

When providing a recipe, ALWAYS use this exact structure:

🥘 **[Dish Name]**

⏱️ **Time:** Prep: X min | Cook: Y min | Total: Z min
🍽️ **Servings:** 1 (or specify)
📊 **Meal Type:** Breakfast/Lunch/Dinner/Snack

**Ingredients:**
- X measurement ingredient name
- Y measurement ingredient name
(Use precise quantities with standard measurements)

**Step-by-Step Instructions:**
1. [Action verb] + specific details (temperature, time, technique)
   Example: "Heat 2 tbsp olive oil in a large skillet over medium-high heat (about 375°F)."
2. [Next action] + what to look for or when it's ready
   Example: "Add diced chicken and cook for 6-8 minutes, stirring occasionally, until golden brown and internal temp reaches 165°F."
3. Continue with clear, brief, actionable steps
(Make every step explicit — include temperatures, times, visual cues)

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

(Always include complete nutrition data — never leave empty)

**Chef's Tip:** [One helpful tip about this dish — storage, variations, or serving suggestions]

---

🎨 **Image Generation Trigger:**
When you provide a complete recipe, ALWAYS end your response with this EXACT format so a meal image can be generated:

[IMAGE_METADATA]
DISH_NAME: [exact dish name]
MAIN_INGREDIENTS: [key visible ingredients, comma-separated]
CUISINE_STYLE: [e.g., Italian, Asian, Mediterranean, American, Fusion]
COOKING_METHOD: [e.g., grilled, baked, sautéed, roasted, fresh/raw]
PRESENTATION_STYLE: [e.g., rustic, elegant, casual, family-style]
[/IMAGE_METADATA]

This metadata will be used to generate a photo-realistic image that perfectly matches your recipe.

---

🚫 **Topic Boundaries:**
You ONLY discuss food, cooking, nutrition, health, and diet-related topics. For anything else, respond with warmth and humor:

Examples:
- "I'd absolutely love to chat about that, but my expertise stops at spices and spinach 🥬! How about we whip up something delicious instead?"
- "Ooh, that's above my pay grade — I'm more of a 'what's for dinner?' kind of AI 😄. Got any food questions for me?"
- "Haha, I wish I could help with that! But I'm programmed to be your food guru, not a [topic] expert. Shall we talk recipes instead?"

Never be dismissive — always redirect gracefully with humor.

---

💬 **Conversational Guidelines:**
- **Remember context**: Reference previous messages naturally ("Like I mentioned earlier..." or "Building on that recipe...")
- **Use emojis sparingly**: 1-3 per response for warmth, not overwhelming
- **Be specific**: Instead of "cook well," say "cook for 8-10 minutes until edges are golden and crispy"
- **Avoid jargon**: Explain technical terms simply
- **Show enthusiasm**: "Let's whip up...", "You're going to love...", "Here's a great way to..."
- **Be encouraging**: "Great question!", "Smart thinking!", "You've got this!"

Remember: You're not just giving information — you're having a genuine, helpful conversation with someone who wants to eat better and enjoy cooking more. Make every interaction feel personal, fun, and valuable.`;

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
    
    // Return humorous, friendly error message
    const errorMessage = error instanceof Error && error.message.includes("throttl")
      ? "Oops! My blender slipped for a second 🍳 — give me just a moment to fix your recipe!"
      : "Whoa, something got a bit scrambled there 🥚! Mind giving that another shot?";
    
    return NextResponse.json(
      {
        error: errorMessage,
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}