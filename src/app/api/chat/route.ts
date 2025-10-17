import { NextRequest, NextResponse } from "next/server";
import {
  BedrockRuntimeClient,
  ConverseCommand,
} from "@aws-sdk/client-bedrock-runtime";

// Configure client with bearer token authentication
const getBedrockClient = () => {
  const bearerToken = process.env.AWS_BEARER_TOKEN_BEDROCK;
  
  if (bearerToken) {
    // Use bearer token authentication for AWS Bedrock serverless
    const client = new BedrockRuntimeClient({
      region: process.env.AWS_REGION || "us-east-1",
    });

    // Add middleware to inject bearer token in Authorization header
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
    // Fallback to standard AWS credentials
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

// Sanitize text to remove/escape control characters that break JSON
const sanitizeText = (text: string): string => {
  if (!text) return "";
  
  // Replace control characters except newline and tab
  return text.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, "");
};

const SYSTEM_PROMPT = `You are Scuzi, a friendly and knowledgeable AI assistant specializing in food and health. Your personality is warm, conversational, and helpful.

Your capabilities:
1. **Recipe Generation**: Analyze images of leftover ingredients and suggest creative, delicious recipes
2. **Nutrition Analysis**: Examine images of cooked meals and provide detailed nutrition tables (calories, protein, carbs, fats, vitamins, etc.)
3. **Meal Planning**: Process grocery receipt images and create meal plans (1-28 meals for up to 7 days)
4. **Food & Health Advice**: Answer questions about cooking, nutrition, diet, and healthy eating
5. **Ingredient Analysis**: Analyze packaged food ingredients and provide comprehensive health assessments

When analyzing packaged food images:
- Extract ALL ingredients from the product label (handle multiple languages if present)
- Categorize each ingredient into risk levels:
  * **SAFE** ✅: Natural ingredients, whole foods, basic nutrients (water, salt in moderation, natural oils, whole grains, real spices)
  * **LOW RISK** 🟢: Processed but generally acceptable (sugar in moderation, common preservatives like citric acid, natural flavors)
  * **MEDIUM RISK** 🟡: Concerning additives (artificial flavors, certain emulsifiers, high sodium, refined oils, modified starch, excessive sugar)
  * **HIGH RISK** 🔴: Harmful ingredients (MSG/flavor enhancers E621/E635, artificial colors, hydrogenated oils, excessive preservatives, nitrates/nitrites)

- For **FOOD ITEMS**: Provide analysis per 100g serving
- For **BEVERAGES**: Provide analysis per 250ml serving

- Create a structured health assessment including:
  1. **Product Overview**: Name and type of product
  2. **Ingredient Breakdown**: List all ingredients with their risk category and explanation
  3. **Overall Health Ranking**: Assign overall rating (Safe, Low Risk, Medium Risk, High Risk) based on ingredient composition
  4. **Health Note**: Clear explanation of why this product is/isn't safe, mentioning specific concerning ingredients
  5. **Long-term Health Risks**: Describe potential health issues from frequent consumption:
     - Cardiovascular effects (high sodium, trans fats)
     - Metabolic issues (excess sugar, refined carbs)
     - Digestive problems (artificial additives, preservatives)
     - Neurological concerns (MSG, artificial colors)
     - Cancer risk (nitrates, certain preservatives)
     - Nutritional deficiencies (lack of whole foods)

Format your ingredient analysis response clearly with sections and emojis for visual clarity.

When analyzing images:
- For ingredient images: Identify all visible ingredients and suggest 2-3 recipe ideas with brief instructions
- For meal images: Provide a nutrition table with estimated values per serving
- For receipt images: Create a structured meal plan based on purchased items, considering variety and nutrition
- For packaged food labels: Perform comprehensive ingredient analysis with health rankings

Always be conversational, use emojis sparingly but effectively, and provide actionable advice. If you suggest a recipe that would benefit from visualization, mention "meal image" in your response and I'll generate it for you.

You have web access for looking up current nutritional information, food trends, health guidelines, and ingredient safety data when needed.`;

const getWhoopEnhancedPrompt = (whoopMetrics: any) => {
  if (!whoopMetrics?.connected) {
    return SYSTEM_PROMPT;
  }

  const sleepHours = parseFloat(whoopMetrics.sleep || "0");
  const strainScore = parseFloat(whoopMetrics.strain || "0");
  const calories = whoopMetrics.calories || 0;

  let whoopContext = "\n\n**PERSONALIZATION (WHOOP Data):**\n";
  whoopContext += `The user's today's biometric data:\n`;
  whoopContext += `- Sleep: ${whoopMetrics.sleep} hours${sleepHours < 6 ? " (LOW - needs recovery)" : sleepHours < 7.5 ? " (MODERATE)" : " (GOOD)"}\n`;
  whoopContext += `- Strain: ${whoopMetrics.strain}${strainScore > 15 ? " (HIGH - intense activity)" : strainScore > 10 ? " (MODERATE)" : " (LOW)"}\n`;
  whoopContext += `- Calories burned: ${calories} kcal\n\n`;

  whoopContext += "**Meal Personalization Rules:**\n";
  
  if (sleepHours < 6) {
    whoopContext += "- Sleep is LOW: Recommend lighter, easily digestible meals. Avoid heavy, high-fat foods. Focus on recovery nutrients (magnesium, vitamin B6, tryptophan). Suggest foods that promote better sleep.\n";
  }
  
  if (strainScore > 15) {
    whoopContext += "- Strain is HIGH: Prioritize high-protein meals (1.6-2.2g per kg body weight). Include complex carbs for glycogen replenishment. Add anti-inflammatory foods (omega-3, turmeric, berries). Emphasize hydration.\n";
  } else if (strainScore < 8) {
    whoopContext += "- Strain is LOW: Suggest moderate caloric intake. Avoid oversized portions. Focus on nutrient density over quantity.\n";
  }
  
  if (calories > 3000) {
    whoopContext += "- High calorie burn: Recommend calorie-dense, nutrient-rich meals to match energy expenditure. Include healthy fats and complex carbohydrates.\n";
  } else if (calories < 2000) {
    whoopContext += "- Lower calorie burn: Suggest lighter meals with appropriate portions. Focus on nutrient density without excess calories.\n";
  }

  whoopContext += "\nAlways incorporate these biometric insights naturally into your recommendations without being overly technical. Make suggestions feel personalized and caring.";

  return SYSTEM_PROMPT + whoopContext;
};

interface Message {
  role: string;
  content: string;
  image?: string;
}

export async function POST(request: NextRequest) {
  try {
    const { messages, whoopMetrics } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: "Messages array is required" },
        { status: 400 }
      );
    }

    // Get system prompt with WHOOP data if available
    const systemPrompt = getWhoopEnhancedPrompt(whoopMetrics);

    // Convert messages to Bedrock format
    const converseMessages = messages.map((msg: Message) => {
      const content = [];

      // Add image if present
      if (msg.image) {
        // Extract base64 data
        const base64Data = msg.image.split(",")[1] || msg.image;
        const imageBytes = Buffer.from(base64Data, "base64");

        content.push({
          image: {
            format: "jpeg", // Adjust based on actual format
            source: {
              bytes: imageBytes,
            },
          },
        });
      }

      // Add text content
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

    // Call Bedrock Claude 3.5 Sonnet
    const command = new ConverseCommand({
      modelId: "us.anthropic.claude-3-5-sonnet-20241022-v2:0",
      messages: converseMessages,
      system: [{ text: systemPrompt }],
      inferenceConfig: {
        maxTokens: 8192,
        temperature: 0.7,
        topP: 0.9,
      },
    });

    const response = await client.send(command);

    // Extract response content
    let responseText = "";

    if (response.output?.message?.content) {
      for (const block of response.output.message.content) {
        if ("text" in block && block.text) {
          responseText += block.text;
        }
      }
    }

    // Sanitize response text to prevent JSON parsing errors
    responseText = sanitizeText(responseText);

    // Check if we should generate a meal image
    const shouldGenerateImage =
      responseText.toLowerCase().includes("meal image") ||
      responseText.toLowerCase().includes("here's what") ||
      responseText.toLowerCase().includes("recipe:");

    // Extract meal description for image generation
    let mealDescription = "";
    if (shouldGenerateImage) {
      // Try to extract recipe name or meal description
      const recipeMatch = responseText.match(/(?:recipe|meal|dish)[:\s]+([^\n.]+)/i);
      if (recipeMatch) {
        mealDescription = sanitizeText(recipeMatch[1].trim());
      }
    }

    return NextResponse.json({
      content: responseText || "I'm here to help with your food and health questions!",
      shouldGenerateImage: shouldGenerateImage && mealDescription,
      mealDescription,
    });
  } catch (error) {
    console.error("Error calling Bedrock:", error);
    return NextResponse.json(
      {
        error: "Failed to process request",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}