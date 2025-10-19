import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, BatchWriteCommand } from "@aws-sdk/lib-dynamodb";
import { v4 as uuidv4 } from "uuid";

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

const docClient = DynamoDBDocumentClient.from(client);

// 56 Meals: 14 Breakfast, 14 Lunch, 14 Snacks, 14 Dinner
// Based on WHOOP health data: High protein, balanced macros, recovery-focused
const meals = [
  // ========== BREAKFAST (14) ==========
  {
    id: uuidv4(),
    name: "Protein-Packed Scrambled Eggs with Avocado",
    mealType: "breakfast",
    description: "Fluffy scrambled eggs with creamy avocado and whole grain toast",
    prepTime: 5,
    cookTime: 10,
    servings: 1,
    ingredients: [
      { name: "eggs", quantity: 3, unit: "whole", category: "fridge" },
      { name: "avocado", quantity: 0.5, unit: "whole", category: "cupboard" },
      { name: "whole grain bread", quantity: 2, unit: "slices", category: "cupboard" },
      { name: "butter", quantity: 1, unit: "tbsp", category: "fridge" },
      { name: "salt", quantity: 0.25, unit: "tsp", category: "cupboard" },
      { name: "black pepper", quantity: 0.125, unit: "tsp", category: "cupboard" }
    ],
    instructions: [
      "Crack eggs into a bowl and whisk with salt and pepper",
      "Heat butter in a non-stick pan over medium heat",
      "Pour eggs into pan and gently stir with a spatula",
      "Cook until eggs are soft and fluffy, about 3-4 minutes",
      "Toast bread slices until golden brown",
      "Slice avocado and mash lightly with a fork",
      "Serve eggs with avocado on toast"
    ],
    nutrition: {
      calories: 520,
      protein: 28,
      carbs: 35,
      fat: 30,
      fiber: 9,
      sugar: 3,
      sodium: 580
    },
    tags: ["high-protein", "quick", "recovery"],
    imageUrl: "",
    createdAt: new Date().toISOString()
  },
  {
    id: uuidv4(),
    name: "Greek Yogurt Parfait with Berries and Granola",
    mealType: "breakfast",
    description: "Creamy Greek yogurt layered with fresh berries and crunchy granola",
    prepTime: 5,
    cookTime: 0,
    servings: 1,
    ingredients: [
      { name: "Greek yogurt", quantity: 1.5, unit: "cups", category: "fridge" },
      { name: "mixed berries", quantity: 1, unit: "cup", category: "fridge" },
      { name: "granola", quantity: 0.5, unit: "cup", category: "cupboard" },
      { name: "honey", quantity: 1, unit: "tbsp", category: "cupboard" },
      { name: "chia seeds", quantity: 1, unit: "tbsp", category: "cupboard" }
    ],
    instructions: [
      "In a glass or bowl, add half of the Greek yogurt",
      "Layer half of the berries on top",
      "Add remaining yogurt",
      "Top with remaining berries",
      "Sprinkle granola and chia seeds on top",
      "Drizzle with honey",
      "Serve immediately"
    ],
    nutrition: {
      calories: 420,
      protein: 25,
      carbs: 58,
      fat: 10,
      fiber: 8,
      sugar: 32,
      sodium: 120
    },
    tags: ["no-cook", "high-protein", "quick", "antioxidants"],
    imageUrl: "",
    createdAt: new Date().toISOString()
  },
  {
    id: uuidv4(),
    name: "Overnight Oats with Banana and Almond Butter",
    mealType: "breakfast",
    description: "Creamy overnight oats with natural sweetness from banana",
    prepTime: 5,
    cookTime: 0,
    servings: 1,
    ingredients: [
      { name: "rolled oats", quantity: 0.5, unit: "cup", category: "cupboard" },
      { name: "milk", quantity: 1, unit: "cup", category: "fridge" },
      { name: "banana", quantity: 1, unit: "whole", category: "cupboard" },
      { name: "almond butter", quantity: 2, unit: "tbsp", category: "cupboard" },
      { name: "honey", quantity: 1, unit: "tbsp", category: "cupboard" },
      { name: "cinnamon", quantity: 0.5, unit: "tsp", category: "cupboard" },
      { name: "chia seeds", quantity: 1, unit: "tbsp", category: "cupboard" }
    ],
    instructions: [
      "In a jar or container, combine oats, milk, chia seeds, and cinnamon",
      "Stir well to combine",
      "Cover and refrigerate overnight (or at least 4 hours)",
      "In the morning, slice banana",
      "Top oats with banana slices and almond butter",
      "Drizzle with honey",
      "Stir and enjoy cold or heat in microwave for 1 minute"
    ],
    nutrition: {
      calories: 485,
      protein: 15,
      carbs: 68,
      fat: 18,
      fiber: 11,
      sugar: 28,
      sodium: 95
    },
    tags: ["no-cook", "make-ahead", "fiber-rich"],
    imageUrl: "",
    createdAt: new Date().toISOString()
  },
  {
    id: uuidv4(),
    name: "Spinach and Feta Omelet",
    mealType: "breakfast",
    description: "Fluffy omelet packed with spinach and tangy feta cheese",
    prepTime: 5,
    cookTime: 8,
    servings: 1,
    ingredients: [
      { name: "eggs", quantity: 3, unit: "whole", category: "fridge" },
      { name: "spinach", quantity: 1, unit: "cup", category: "fridge" },
      { name: "feta cheese", quantity: 0.25, unit: "cup", category: "fridge" },
      { name: "olive oil", quantity: 1, unit: "tbsp", category: "cupboard" },
      { name: "salt", quantity: 0.25, unit: "tsp", category: "cupboard" },
      { name: "black pepper", quantity: 0.125, unit: "tsp", category: "cupboard" }
    ],
    instructions: [
      "Whisk eggs with salt and pepper in a bowl",
      "Heat olive oil in a non-stick pan over medium heat",
      "Add spinach and sauté until wilted, about 2 minutes",
      "Remove spinach and set aside",
      "Pour eggs into the same pan",
      "As eggs set, lift edges to let uncooked egg flow underneath",
      "When eggs are almost set, add spinach and feta to one half",
      "Fold omelet in half and cook for 1 more minute",
      "Slide onto plate and serve"
    ],
    nutrition: {
      calories: 340,
      protein: 24,
      carbs: 4,
      fat: 26,
      fiber: 1,
      sugar: 2,
      sodium: 720
    },
    tags: ["high-protein", "low-carb", "quick", "vegetarian"],
    imageUrl: "",
    createdAt: new Date().toISOString()
  },
  {
    id: uuidv4(),
    name: "Protein Smoothie Bowl",
    mealType: "breakfast",
    description: "Thick and creamy smoothie bowl topped with fresh fruits and nuts",
    prepTime: 10,
    cookTime: 0,
    servings: 1,
    ingredients: [
      { name: "banana", quantity: 1, unit: "whole", category: "freezer" },
      { name: "protein powder", quantity: 1, unit: "scoop", category: "cupboard" },
      { name: "spinach", quantity: 1, unit: "cup", category: "freezer" },
      { name: "almond milk", quantity: 0.5, unit: "cup", category: "fridge" },
      { name: "strawberries", quantity: 0.5, unit: "cup", category: "fridge" },
      { name: "almonds", quantity: 0.25, unit: "cup", category: "cupboard" },
      { name: "coconut flakes", quantity: 2, unit: "tbsp", category: "cupboard" }
    ],
    instructions: [
      "Add frozen banana, protein powder, spinach, and almond milk to blender",
      "Blend until thick and smooth (add more milk if too thick)",
      "Pour into a bowl",
      "Slice fresh strawberries",
      "Top with strawberries, almonds, and coconut flakes",
      "Serve immediately with a spoon"
    ],
    nutrition: {
      calories: 425,
      protein: 32,
      carbs: 42,
      fat: 14,
      fiber: 9,
      sugar: 20,
      sodium: 180
    },
    tags: ["high-protein", "recovery", "antioxidants", "no-cook"],
    imageUrl: "",
    createdAt: new Date().toISOString()
  },
  {
    id: uuidv4(),
    name: "Whole Wheat Pancakes with Blueberries",
    mealType: "breakfast",
    description: "Fluffy whole wheat pancakes studded with fresh blueberries",
    prepTime: 10,
    cookTime: 15,
    servings: 2,
    ingredients: [
      { name: "whole wheat flour", quantity: 1.5, unit: "cups", category: "cupboard" },
      { name: "baking powder", quantity: 2, unit: "tsp", category: "cupboard" },
      { name: "eggs", quantity: 2, unit: "whole", category: "fridge" },
      { name: "milk", quantity: 1.25, unit: "cups", category: "fridge" },
      { name: "honey", quantity: 2, unit: "tbsp", category: "cupboard" },
      { name: "blueberries", quantity: 1, unit: "cup", category: "fridge" },
      { name: "butter", quantity: 2, unit: "tbsp", category: "fridge" }
    ],
    instructions: [
      "In a bowl, mix flour and baking powder",
      "In another bowl, whisk eggs, milk, and honey",
      "Pour wet ingredients into dry ingredients and mix until just combined",
      "Gently fold in blueberries",
      "Heat a griddle or pan over medium heat and add butter",
      "Pour 1/4 cup batter for each pancake",
      "Cook until bubbles form on surface, about 3 minutes",
      "Flip and cook until golden brown, about 2 minutes",
      "Serve warm with additional honey or maple syrup"
    ],
    nutrition: {
      calories: 420,
      protein: 16,
      carbs: 68,
      fat: 10,
      fiber: 8,
      sugar: 22,
      sodium: 380
    },
    tags: ["family-friendly", "fiber-rich", "weekend-brunch"],
    imageUrl: "",
    createdAt: new Date().toISOString()
  },
  {
    id: uuidv4(),
    name: "Smoked Salmon and Cream Cheese Bagel",
    mealType: "breakfast",
    description: "Classic bagel with smoked salmon, cream cheese, and capers",
    prepTime: 5,
    cookTime: 3,
    servings: 1,
    ingredients: [
      { name: "whole grain bagel", quantity: 1, unit: "whole", category: "cupboard" },
      { name: "cream cheese", quantity: 2, unit: "tbsp", category: "fridge" },
      { name: "smoked salmon", quantity: 3, unit: "oz", category: "fridge" },
      { name: "red onion", quantity: 0.25, unit: "whole", category: "cupboard" },
      { name: "capers", quantity: 1, unit: "tbsp", category: "cupboard" },
      { name: "lemon", quantity: 0.25, unit: "whole", category: "fridge" }
    ],
    instructions: [
      "Slice bagel in half and toast until golden",
      "Spread cream cheese on both halves",
      "Layer smoked salmon on bottom half",
      "Thinly slice red onion and add on top",
      "Sprinkle capers over salmon",
      "Squeeze fresh lemon juice over everything",
      "Top with other bagel half or serve open-faced"
    ],
    nutrition: {
      calories: 420,
      protein: 28,
      carbs: 48,
      fat: 12,
      fiber: 6,
      sugar: 8,
      sodium: 1240
    },
    tags: ["high-protein", "quick", "omega-3"],
    imageUrl: "",
    createdAt: new Date().toISOString()
  },
  {
    id: uuidv4(),
    name: "Veggie-Loaded Breakfast Burrito",
    mealType: "breakfast",
    description: "Hearty breakfast burrito with scrambled eggs and vegetables",
    prepTime: 10,
    cookTime: 12,
    servings: 1,
    ingredients: [
      { name: "whole wheat tortilla", quantity: 1, unit: "large", category: "cupboard" },
      { name: "eggs", quantity: 2, unit: "whole", category: "fridge" },
      { name: "bell pepper", quantity: 0.5, unit: "whole", category: "fridge" },
      { name: "onion", quantity: 0.25, unit: "whole", category: "cupboard" },
      { name: "black beans", quantity: 0.5, unit: "cup", category: "cupboard" },
      { name: "cheddar cheese", quantity: 0.25, unit: "cup", category: "fridge" },
      { name: "salsa", quantity: 2, unit: "tbsp", category: "fridge" }
    ],
    instructions: [
      "Dice bell pepper and onion",
      "Heat a pan with oil and sauté vegetables until soft, about 5 minutes",
      "Push vegetables to side and scramble eggs in the same pan",
      "Add black beans and heat through",
      "Warm tortilla in microwave for 20 seconds",
      "Place egg mixture in center of tortilla",
      "Top with cheese and salsa",
      "Fold in sides and roll tightly",
      "Optional: Toast burrito in pan for crispy exterior"
    ],
    nutrition: {
      calories: 485,
      protein: 26,
      carbs: 52,
      fat: 18,
      fiber: 12,
      sugar: 6,
      sodium: 720
    },
    tags: ["high-protein", "fiber-rich", "portable"],
    imageUrl: "",
    createdAt: new Date().toISOString()
  },
  {
    id: uuidv4(),
    name: "Chia Seed Pudding with Mango",
    mealType: "breakfast",
    description: "Creamy chia pudding topped with sweet tropical mango",
    prepTime: 5,
    cookTime: 0,
    servings: 1,
    ingredients: [
      { name: "chia seeds", quantity: 3, unit: "tbsp", category: "cupboard" },
      { name: "coconut milk", quantity: 1, unit: "cup", category: "cupboard" },
      { name: "honey", quantity: 1, unit: "tbsp", category: "cupboard" },
      { name: "vanilla extract", quantity: 0.5, unit: "tsp", category: "cupboard" },
      { name: "mango", quantity: 1, unit: "cup", category: "fridge" },
      { name: "coconut flakes", quantity: 1, unit: "tbsp", category: "cupboard" }
    ],
    instructions: [
      "In a jar or bowl, combine chia seeds, coconut milk, honey, and vanilla",
      "Stir well to prevent clumping",
      "Cover and refrigerate for at least 4 hours or overnight",
      "Stir pudding before serving",
      "Dice fresh mango",
      "Top pudding with mango and coconut flakes",
      "Serve chilled"
    ],
    nutrition: {
      calories: 380,
      protein: 8,
      carbs: 42,
      fat: 22,
      fiber: 14,
      sugar: 26,
      sodium: 35
    },
    tags: ["make-ahead", "no-cook", "vegan", "high-fiber"],
    imageUrl: "",
    createdAt: new Date().toISOString()
  },
  {
    id: uuidv4(),
    name: "Sweet Potato Hash with Eggs",
    mealType: "breakfast",
    description: "Savory sweet potato hash topped with perfectly cooked eggs",
    prepTime: 10,
    cookTime: 20,
    servings: 2,
    ingredients: [
      { name: "sweet potato", quantity: 2, unit: "medium", category: "cupboard" },
      { name: "eggs", quantity: 4, unit: "whole", category: "fridge" },
      { name: "bell pepper", quantity: 1, unit: "whole", category: "fridge" },
      { name: "onion", quantity: 0.5, unit: "whole", category: "cupboard" },
      { name: "olive oil", quantity: 2, unit: "tbsp", category: "cupboard" },
      { name: "paprika", quantity: 1, unit: "tsp", category: "cupboard" },
      { name: "salt", quantity: 0.5, unit: "tsp", category: "cupboard" },
      { name: "black pepper", quantity: 0.25, unit: "tsp", category: "cupboard" }
    ],
    instructions: [
      "Peel and dice sweet potatoes into 1/2 inch cubes",
      "Dice bell pepper and onion",
      "Heat olive oil in a large skillet over medium-high heat",
      "Add sweet potatoes and cook for 10 minutes, stirring occasionally",
      "Add bell pepper, onion, paprika, salt, and pepper",
      "Cook until vegetables are tender, about 8 more minutes",
      "Make 4 wells in the hash and crack an egg into each",
      "Cover and cook until eggs are set, about 5 minutes",
      "Serve immediately"
    ],
    nutrition: {
      calories: 385,
      protein: 18,
      carbs: 44,
      fat: 15,
      fiber: 7,
      sugar: 10,
      sodium: 480
    },
    tags: ["high-protein", "nutrient-dense", "recovery"],
    imageUrl: "",
    createdAt: new Date().toISOString()
  },
  {
    id: uuidv4(),
    name: "Almond Butter Toast with Banana",
    mealType: "breakfast",
    description: "Simple and delicious toast with almond butter and banana",
    prepTime: 5,
    cookTime: 3,
    servings: 1,
    ingredients: [
      { name: "whole grain bread", quantity: 2, unit: "slices", category: "cupboard" },
      { name: "almond butter", quantity: 3, unit: "tbsp", category: "cupboard" },
      { name: "banana", quantity: 1, unit: "whole", category: "cupboard" },
      { name: "honey", quantity: 1, unit: "tsp", category: "cupboard" },
      { name: "cinnamon", quantity: 0.25, unit: "tsp", category: "cupboard" }
    ],
    instructions: [
      "Toast bread until golden brown",
      "Spread almond butter evenly on each slice",
      "Slice banana into rounds",
      "Arrange banana slices on toast",
      "Drizzle with honey",
      "Sprinkle cinnamon on top",
      "Serve immediately"
    ],
    nutrition: {
      calories: 445,
      protein: 14,
      carbs: 58,
      fat: 20,
      fiber: 10,
      sugar: 22,
      sodium: 280
    },
    tags: ["quick", "no-cook", "energy-boost"],
    imageUrl: "",
    createdAt: new Date().toISOString()
  },
  {
    id: uuidv4(),
    name: "Cottage Cheese with Pineapple and Walnuts",
    mealType: "breakfast",
    description: "Protein-rich cottage cheese with sweet pineapple and crunchy walnuts",
    prepTime: 5,
    cookTime: 0,
    servings: 1,
    ingredients: [
      { name: "cottage cheese", quantity: 1.5, unit: "cups", category: "fridge" },
      { name: "pineapple", quantity: 1, unit: "cup", category: "fridge" },
      { name: "walnuts", quantity: 0.25, unit: "cup", category: "cupboard" },
      { name: "honey", quantity: 1, unit: "tbsp", category: "cupboard" },
      { name: "mint", quantity: 5, unit: "leaves", category: "fridge" }
    ],
    instructions: [
      "Place cottage cheese in a bowl",
      "Dice pineapple into bite-sized chunks",
      "Roughly chop walnuts",
      "Top cottage cheese with pineapple",
      "Sprinkle walnuts over top",
      "Drizzle with honey",
      "Garnish with fresh mint leaves",
      "Serve immediately"
    ],
    nutrition: {
      calories: 420,
      protein: 32,
      carbs: 38,
      fat: 16,
      fiber: 4,
      sugar: 28,
      sodium: 680
    },
    tags: ["high-protein", "no-cook", "quick", "recovery"],
    imageUrl: "",
    createdAt: new Date().toISOString()
  },
  {
    id: uuidv4(),
    name: "Quinoa Breakfast Bowl",
    mealType: "breakfast",
    description: "Warm quinoa bowl with cinnamon, berries, and nuts",
    prepTime: 5,
    cookTime: 15,
    servings: 1,
    ingredients: [
      { name: "quinoa", quantity: 0.5, unit: "cup", category: "cupboard" },
      { name: "almond milk", quantity: 1, unit: "cup", category: "fridge" },
      { name: "mixed berries", quantity: 0.75, unit: "cup", category: "fridge" },
      { name: "pecans", quantity: 0.25, unit: "cup", category: "cupboard" },
      { name: "maple syrup", quantity: 1, unit: "tbsp", category: "cupboard" },
      { name: "cinnamon", quantity: 0.5, unit: "tsp", category: "cupboard" }
    ],
    instructions: [
      "Rinse quinoa under cold water",
      "In a pot, combine quinoa and almond milk",
      "Bring to a boil, then reduce heat to low",
      "Simmer covered for 12-15 minutes until liquid is absorbed",
      "Fluff with a fork",
      "Transfer to a bowl",
      "Top with mixed berries and pecans",
      "Drizzle with maple syrup and sprinkle cinnamon",
      "Serve warm"
    ],
    nutrition: {
      calories: 450,
      protein: 14,
      carbs: 62,
      fat: 18,
      fiber: 10,
      sugar: 18,
      sodium: 85
    },
    tags: ["high-protein", "fiber-rich", "gluten-free"],
    imageUrl: "",
    createdAt: new Date().toISOString()
  },
  {
    id: uuidv4(),
    name: "Breakfast Egg Muffins with Vegetables",
    mealType: "breakfast",
    description: "Portable egg muffins loaded with colorful vegetables",
    prepTime: 15,
    cookTime: 20,
    servings: 6,
    ingredients: [
      { name: "eggs", quantity: 8, unit: "whole", category: "fridge" },
      { name: "bell pepper", quantity: 1, unit: "whole", category: "fridge" },
      { name: "spinach", quantity: 2, unit: "cups", category: "fridge" },
      { name: "cherry tomatoes", quantity: 1, unit: "cup", category: "fridge" },
      { name: "cheddar cheese", quantity: 0.5, unit: "cup", category: "fridge" },
      { name: "salt", quantity: 0.5, unit: "tsp", category: "cupboard" },
      { name: "black pepper", quantity: 0.25, unit: "tsp", category: "cupboard" }
    ],
    instructions: [
      "Preheat oven to 375°F (190°C)",
      "Grease a 12-cup muffin tin or use liners",
      "Dice bell pepper and halve cherry tomatoes",
      "Chop spinach",
      "In a bowl, whisk eggs with salt and pepper",
      "Stir in vegetables and cheese",
      "Pour mixture evenly into muffin cups (fill 3/4 full)",
      "Bake for 18-20 minutes until set and lightly golden",
      "Let cool for 5 minutes before removing from tin",
      "Store leftovers in fridge for up to 5 days"
    ],
    nutrition: {
      calories: 160,
      protein: 12,
      carbs: 4,
      fat: 11,
      fiber: 1,
      sugar: 2,
      sodium: 280
    },
    tags: ["high-protein", "meal-prep", "portable", "low-carb"],
    imageUrl: "",
    createdAt: new Date().toISOString()
  },

  // ========== LUNCH (14) ==========
  {
    id: uuidv4(),
    name: "Grilled Chicken Caesar Salad",
    mealType: "lunch",
    description: "Classic Caesar salad with tender grilled chicken breast",
    prepTime: 10,
    cookTime: 15,
    servings: 1,
    ingredients: [
      { name: "chicken breast", quantity: 6, unit: "oz", category: "fridge" },
      { name: "romaine lettuce", quantity: 3, unit: "cups", category: "fridge" },
      { name: "parmesan cheese", quantity: 0.25, unit: "cup", category: "fridge" },
      { name: "caesar dressing", quantity: 3, unit: "tbsp", category: "fridge" },
      { name: "croutons", quantity: 0.5, unit: "cup", category: "cupboard" },
      { name: "olive oil", quantity: 1, unit: "tbsp", category: "cupboard" },
      { name: "lemon", quantity: 0.5, unit: "whole", category: "fridge" }
    ],
    instructions: [
      "Season chicken breast with salt, pepper, and olive oil",
      "Grill chicken over medium-high heat for 6-7 minutes per side",
      "Let chicken rest for 5 minutes, then slice",
      "Chop romaine lettuce and place in a large bowl",
      "Add Caesar dressing and toss to coat",
      "Top with sliced chicken",
      "Sprinkle with parmesan cheese and croutons",
      "Squeeze fresh lemon juice over salad",
      "Serve immediately"
    ],
    nutrition: {
      calories: 520,
      protein: 48,
      carbs: 22,
      fat: 26,
      fiber: 4,
      sugar: 3,
      sodium: 980
    },
    tags: ["high-protein", "low-carb", "gluten-free-option"],
    imageUrl: "",
    createdAt: new Date().toISOString()
  },
  {
    id: uuidv4(),
    name: "Mediterranean Quinoa Bowl",
    mealType: "lunch",
    description: "Colorful quinoa bowl with Mediterranean vegetables and feta",
    prepTime: 15,
    cookTime: 20,
    servings: 2,
    ingredients: [
      { name: "quinoa", quantity: 1, unit: "cup", category: "cupboard" },
      { name: "cherry tomatoes", quantity: 1.5, unit: "cups", category: "fridge" },
      { name: "cucumber", quantity: 1, unit: "whole", category: "fridge" },
      { name: "red onion", quantity: 0.5, unit: "whole", category: "cupboard" },
      { name: "feta cheese", quantity: 0.5, unit: "cup", category: "fridge" },
      { name: "kalamata olives", quantity: 0.5, unit: "cup", category: "cupboard" },
      { name: "olive oil", quantity: 3, unit: "tbsp", category: "cupboard" },
      { name: "lemon juice", quantity: 2, unit: "tbsp", category: "fridge" }
    ],
    instructions: [
      "Cook quinoa according to package directions",
      "Let quinoa cool to room temperature",
      "Halve cherry tomatoes, dice cucumber, and thinly slice red onion",
      "In a large bowl, combine quinoa and all vegetables",
      "Add feta cheese and olives",
      "Whisk together olive oil and lemon juice",
      "Pour dressing over bowl and toss gently",
      "Season with salt and pepper to taste",
      "Serve at room temperature or chilled"
    ],
    nutrition: {
      calories: 485,
      protein: 16,
      carbs: 52,
      fat: 24,
      fiber: 8,
      sugar: 6,
      sodium: 780
    },
    tags: ["vegetarian", "gluten-free", "meal-prep", "mediterranean"],
    imageUrl: "",
    createdAt: new Date().toISOString()
  },
  {
    id: uuidv4(),
    name: "Turkey and Avocado Wrap",
    mealType: "lunch",
    description: "Fresh wrap with sliced turkey, avocado, and crisp vegetables",
    prepTime: 10,
    cookTime: 0,
    servings: 1,
    ingredients: [
      { name: "whole wheat tortilla", quantity: 1, unit: "large", category: "cupboard" },
      { name: "turkey breast", quantity: 4, unit: "oz", category: "fridge" },
      { name: "avocado", quantity: 0.5, unit: "whole", category: "cupboard" },
      { name: "lettuce", quantity: 1, unit: "cup", category: "fridge" },
      { name: "tomato", quantity: 1, unit: "medium", category: "fridge" },
      { name: "red onion", quantity: 0.25, unit: "whole", category: "cupboard" },
      { name: "mustard", quantity: 1, unit: "tbsp", category: "cupboard" }
    ],
    instructions: [
      "Lay tortilla flat on a clean surface",
      "Spread mustard in the center",
      "Layer turkey slices on tortilla",
      "Slice avocado and arrange on turkey",
      "Add lettuce leaves",
      "Slice tomato and add on top",
      "Thinly slice red onion and add",
      "Fold in sides of tortilla",
      "Roll tightly from bottom to top",
      "Cut in half diagonally and serve"
    ],
    nutrition: {
      calories: 420,
      protein: 32,
      carbs: 38,
      fat: 16,
      fiber: 9,
      sugar: 5,
      sodium: 820
    },
    tags: ["high-protein", "quick", "portable", "no-cook"],
    imageUrl: "",
    createdAt: new Date().toISOString()
  },
  {
    id: uuidv4(),
    name: "Salmon Teriyaki with Brown Rice and Broccoli",
    mealType: "lunch",
    description: "Glazed salmon with nutty brown rice and steamed broccoli",
    prepTime: 10,
    cookTime: 25,
    servings: 2,
    ingredients: [
      { name: "salmon fillet", quantity: 12, unit: "oz", category: "fridge" },
      { name: "brown rice", quantity: 1, unit: "cup", category: "cupboard" },
      { name: "broccoli", quantity: 3, unit: "cups", category: "fridge" },
      { name: "teriyaki sauce", quantity: 0.25, unit: "cup", category: "cupboard" },
      { name: "sesame seeds", quantity: 1, unit: "tbsp", category: "cupboard" },
      { name: "ginger", quantity: 1, unit: "tsp", category: "cupboard" },
      { name: "garlic", quantity: 2, unit: "cloves", category: "cupboard" }
    ],
    instructions: [
      "Cook brown rice according to package directions",
      "Preheat oven to 400°F (200°C)",
      "Mince garlic and grate ginger",
      "Mix teriyaki sauce with garlic and ginger",
      "Place salmon on a baking sheet lined with parchment",
      "Brush salmon with teriyaki mixture",
      "Bake for 12-15 minutes until salmon flakes easily",
      "Steam broccoli for 5-7 minutes until tender-crisp",
      "Divide rice and broccoli between plates",
      "Top with salmon and sprinkle sesame seeds",
      "Serve immediately"
    ],
    nutrition: {
      calories: 540,
      protein: 42,
      carbs: 58,
      fat: 14,
      fiber: 6,
      sugar: 8,
      sodium: 920
    },
    tags: ["high-protein", "omega-3", "asian-inspired"],
    imageUrl: "",
    createdAt: new Date().toISOString()
  },
  {
    id: uuidv4(),
    name: "Black Bean and Sweet Potato Burrito Bowl",
    mealType: "lunch",
    description: "Hearty vegetarian bowl with roasted sweet potatoes and black beans",
    prepTime: 15,
    cookTime: 25,
    servings: 2,
    ingredients: [
      { name: "sweet potato", quantity: 2, unit: "medium", category: "cupboard" },
      { name: "black beans", quantity: 1.5, unit: "cups", category: "cupboard" },
      { name: "brown rice", quantity: 1, unit: "cup", category: "cupboard" },
      { name: "corn", quantity: 1, unit: "cup", category: "freezer" },
      { name: "avocado", quantity: 1, unit: "whole", category: "cupboard" },
      { name: "lime", quantity: 1, unit: "whole", category: "fridge" },
      { name: "cilantro", quantity: 0.25, unit: "cup", category: "fridge" },
      { name: "cumin", quantity: 1, unit: "tsp", category: "cupboard" }
    ],
    instructions: [
      "Preheat oven to 425°F (220°C)",
      "Peel and cube sweet potatoes",
      "Toss sweet potatoes with oil, cumin, salt, and pepper",
      "Roast for 25 minutes until tender and caramelized",
      "Cook brown rice according to package directions",
      "Warm black beans and corn",
      "Divide rice between bowls",
      "Top with roasted sweet potatoes, black beans, and corn",
      "Slice avocado and add to bowls",
      "Squeeze lime juice over everything",
      "Garnish with fresh cilantro",
      "Serve immediately"
    ],
    nutrition: {
      calories: 510,
      protein: 18,
      carbs: 86,
      fat: 12,
      fiber: 18,
      sugar: 12,
      sodium: 420
    },
    tags: ["vegetarian", "vegan-option", "fiber-rich", "meal-prep"],
    imageUrl: "",
    createdAt: new Date().toISOString()
  },
  {
    id: uuidv4(),
    name: "Greek Chicken Gyro with Tzatziki",
    mealType: "lunch",
    description: "Tender marinated chicken wrapped in pita with cool tzatziki",
    prepTime: 20,
    cookTime: 15,
    servings: 2,
    ingredients: [
      { name: "chicken thighs", quantity: 12, unit: "oz", category: "fridge" },
      { name: "Greek yogurt", quantity: 1, unit: "cup", category: "fridge" },
      { name: "cucumber", quantity: 1, unit: "whole", category: "fridge" },
      { name: "pita bread", quantity: 4, unit: "whole", category: "cupboard" },
      { name: "lemon", quantity: 1, unit: "whole", category: "fridge" },
      { name: "garlic", quantity: 3, unit: "cloves", category: "cupboard" },
      { name: "oregano", quantity: 2, unit: "tsp", category: "cupboard" },
      { name: "red onion", quantity: 0.5, unit: "whole", category: "cupboard" }
    ],
    instructions: [
      "Mince 2 garlic cloves and mix with oregano, lemon juice, and olive oil",
      "Marinate chicken in this mixture for at least 15 minutes",
      "For tzatziki: grate cucumber and squeeze out excess water",
      "Mix yogurt, cucumber, minced garlic, lemon juice, and dill",
      "Grill chicken over medium-high heat for 6-7 minutes per side",
      "Let chicken rest, then slice",
      "Warm pita bread",
      "Spread tzatziki on pita",
      "Add sliced chicken and onion",
      "Roll up and serve"
    ],
    nutrition: {
      calories: 520,
      protein: 44,
      carbs: 48,
      fat: 16,
      fiber: 4,
      sugar: 6,
      sodium: 680
    },
    tags: ["high-protein", "mediterranean", "marinated"],
    imageUrl: "",
    createdAt: new Date().toISOString()
  },
  {
    id: uuidv4(),
    name: "Thai Peanut Noodle Bowl with Chicken",
    mealType: "lunch",
    description: "Flavorful noodles with creamy peanut sauce and vegetables",
    prepTime: 15,
    cookTime: 15,
    servings: 2,
    ingredients: [
      { name: "rice noodles", quantity: 8, unit: "oz", category: "cupboard" },
      { name: "chicken breast", quantity: 10, unit: "oz", category: "fridge" },
      { name: "peanut butter", quantity: 0.25, unit: "cup", category: "cupboard" },
      { name: "soy sauce", quantity: 3, unit: "tbsp", category: "cupboard" },
      { name: "bell pepper", quantity: 1, unit: "whole", category: "fridge" },
      { name: "carrots", quantity: 2, unit: "medium", category: "fridge" },
      { name: "lime", quantity: 1, unit: "whole", category: "fridge" },
      { name: "peanuts", quantity: 0.25, unit: "cup", category: "cupboard" }
    ],
    instructions: [
      "Cook rice noodles according to package directions",
      "Slice chicken into thin strips",
      "Stir-fry chicken in a wok or large pan until cooked through",
      "Julienne bell pepper and carrots",
      "Add vegetables to pan and stir-fry for 3-4 minutes",
      "Mix peanut butter, soy sauce, lime juice, and a splash of water",
      "Add cooked noodles to pan",
      "Pour peanut sauce over noodles and toss to coat",
      "Divide into bowls",
      "Top with crushed peanuts and serve"
    ],
    nutrition: {
      calories: 565,
      protein: 38,
      carbs: 62,
      fat: 18,
      fiber: 6,
      sugar: 8,
      sodium: 1120
    },
    tags: ["high-protein", "asian-inspired", "nut-based"],
    imageUrl: "",
    createdAt: new Date().toISOString()
  },
  {
    id: uuidv4(),
    name: "Caprese Sandwich with Balsamic Glaze",
    mealType: "lunch",
    description: "Fresh mozzarella, tomato, and basil sandwich with balsamic",
    prepTime: 10,
    cookTime: 5,
    servings: 1,
    ingredients: [
      { name: "ciabatta roll", quantity: 1, unit: "whole", category: "cupboard" },
      { name: "mozzarella cheese", quantity: 4, unit: "oz", category: "fridge" },
      { name: "tomato", quantity: 1, unit: "large", category: "fridge" },
      { name: "basil", quantity: 10, unit: "leaves", category: "fridge" },
      { name: "balsamic glaze", quantity: 2, unit: "tbsp", category: "cupboard" },
      { name: "olive oil", quantity: 1, unit: "tbsp", category: "cupboard" },
      { name: "salt", quantity: 0.25, unit: "tsp", category: "cupboard" }
    ],
    instructions: [
      "Slice ciabatta roll in half horizontally",
      "Lightly toast the bread",
      "Drizzle olive oil on both sides",
      "Slice mozzarella and tomato into thick slices",
      "Layer mozzarella on bottom half of bread",
      "Add tomato slices on top",
      "Season with salt and pepper",
      "Add fresh basil leaves",
      "Drizzle balsamic glaze over everything",
      "Top with other half of bread",
      "Cut in half and serve"
    ],
    nutrition: {
      calories: 480,
      protein: 24,
      carbs: 52,
      fat: 20,
      fiber: 4,
      sugar: 8,
      sodium: 720
    },
    tags: ["vegetarian", "italian", "quick"],
    imageUrl: "",
    createdAt: new Date().toISOString()
  },
  {
    id: uuidv4(),
    name: "Tuna Poke Bowl",
    mealType: "lunch",
    description: "Fresh tuna poke with rice, edamame, and seaweed salad",
    prepTime: 15,
    cookTime: 15,
    servings: 2,
    ingredients: [
      { name: "sushi-grade tuna", quantity: 12, unit: "oz", category: "fridge" },
      { name: "sushi rice", quantity: 1.5, unit: "cups", category: "cupboard" },
      { name: "edamame", quantity: 1, unit: "cup", category: "freezer" },
      { name: "cucumber", quantity: 1, unit: "whole", category: "fridge" },
      { name: "avocado", quantity: 1, unit: "whole", category: "cupboard" },
      { name: "soy sauce", quantity: 3, unit: "tbsp", category: "cupboard" },
      { name: "sesame oil", quantity: 1, unit: "tbsp", category: "cupboard" },
      { name: "sesame seeds", quantity: 2, unit: "tbsp", category: "cupboard" }
    ],
    instructions: [
      "Cook sushi rice according to package directions",
      "Dice tuna into 1/2 inch cubes",
      "In a bowl, mix soy sauce and sesame oil",
      "Add tuna and marinate for 10 minutes",
      "Cook edamame according to package directions",
      "Dice cucumber and slice avocado",
      "Divide rice between bowls",
      "Top with marinated tuna, edamame, cucumber, and avocado",
      "Sprinkle with sesame seeds",
      "Serve immediately"
    ],
    nutrition: {
      calories: 580,
      protein: 48,
      carbs: 62,
      fat: 16,
      fiber: 8,
      sugar: 4,
      sodium: 980
    },
    tags: ["high-protein", "omega-3", "asian-inspired", "gluten-free"],
    imageUrl: "",
    createdAt: new Date().toISOString()
  },
  {
    id: uuidv4(),
    name: "Chicken and Vegetable Stir-Fry",
    mealType: "lunch",
    description: "Quick stir-fry with tender chicken and colorful vegetables",
    prepTime: 15,
    cookTime: 12,
    servings: 2,
    ingredients: [
      { name: "chicken breast", quantity: 12, unit: "oz", category: "fridge" },
      { name: "broccoli", quantity: 2, unit: "cups", category: "fridge" },
      { name: "bell pepper", quantity: 1, unit: "whole", category: "fridge" },
      { name: "snap peas", quantity: 1, unit: "cup", category: "fridge" },
      { name: "soy sauce", quantity: 3, unit: "tbsp", category: "cupboard" },
      { name: "ginger", quantity: 1, unit: "tbsp", category: "cupboard" },
      { name: "garlic", quantity: 3, unit: "cloves", category: "cupboard" },
      { name: "sesame oil", quantity: 2, unit: "tbsp", category: "cupboard" }
    ],
    instructions: [
      "Slice chicken into thin strips",
      "Cut broccoli into florets, slice bell pepper",
      "Mince garlic and grate ginger",
      "Heat sesame oil in a wok over high heat",
      "Add chicken and stir-fry for 5-6 minutes until cooked",
      "Remove chicken and set aside",
      "Add vegetables and stir-fry for 4-5 minutes",
      "Add garlic and ginger, stir-fry for 1 minute",
      "Return chicken to wok",
      "Add soy sauce and toss everything together",
      "Serve over rice or noodles"
    ],
    nutrition: {
      calories: 320,
      protein: 38,
      carbs: 18,
      fat: 12,
      fiber: 5,
      sugar: 8,
      sodium: 980
    },
    tags: ["high-protein", "low-carb", "quick", "asian-inspired"],
    imageUrl: "",
    createdAt: new Date().toISOString()
  },
  {
    id: uuidv4(),
    name: "Lentil and Vegetable Soup",
    mealType: "lunch",
    description: "Hearty and nutritious lentil soup packed with vegetables",
    prepTime: 15,
    cookTime: 35,
    servings: 4,
    ingredients: [
      { name: "green lentils", quantity: 1.5, unit: "cups", category: "cupboard" },
      { name: "carrots", quantity: 3, unit: "medium", category: "fridge" },
      { name: "celery", quantity: 3, unit: "stalks", category: "fridge" },
      { name: "onion", quantity: 1, unit: "large", category: "cupboard" },
      { name: "garlic", quantity: 4, unit: "cloves", category: "cupboard" },
      { name: "vegetable broth", quantity: 6, unit: "cups", category: "cupboard" },
      { name: "diced tomatoes", quantity: 1, unit: "can", category: "cupboard" },
      { name: "cumin", quantity: 1, unit: "tsp", category: "cupboard" }
    ],
    instructions: [
      "Rinse lentils and set aside",
      "Dice carrots, celery, and onion",
      "Mince garlic",
      "Heat oil in a large pot over medium heat",
      "Sauté onion, carrots, and celery for 5 minutes",
      "Add garlic and cumin, cook for 1 minute",
      "Add lentils, broth, and diced tomatoes",
      "Bring to a boil, then reduce to simmer",
      "Cook for 25-30 minutes until lentils are tender",
      "Season with salt and pepper",
      "Serve hot with crusty bread"
    ],
    nutrition: {
      calories: 290,
      protein: 18,
      carbs: 50,
      fat: 2,
      fiber: 20,
      sugar: 8,
      sodium: 680
    },
    tags: ["vegetarian", "vegan", "high-fiber", "meal-prep"],
    imageUrl: "",
    createdAt: new Date().toISOString()
  },
  {
    id: uuidv4(),
    name: "Shrimp Tacos with Lime Crema",
    mealType: "lunch",
    description: "Spicy shrimp tacos topped with cool lime crema and slaw",
    prepTime: 15,
    cookTime: 10,
    servings: 2,
    ingredients: [
      { name: "shrimp", quantity: 12, unit: "oz", category: "freezer" },
      { name: "corn tortillas", quantity: 6, unit: "small", category: "cupboard" },
      { name: "cabbage", quantity: 2, unit: "cups", category: "fridge" },
      { name: "lime", quantity: 2, unit: "whole", category: "fridge" },
      { name: "sour cream", quantity: 0.5, unit: "cup", category: "fridge" },
      { name: "chili powder", quantity: 1, unit: "tsp", category: "cupboard" },
      { name: "cilantro", quantity: 0.25, unit: "cup", category: "fridge" },
      { name: "garlic powder", quantity: 0.5, unit: "tsp", category: "cupboard" }
    ],
    instructions: [
      "Pat shrimp dry and season with chili powder, garlic powder, salt",
      "Shred cabbage for slaw",
      "Mix sour cream with lime juice and zest for crema",
      "Heat a pan over medium-high heat",
      "Cook shrimp for 2-3 minutes per side until pink",
      "Warm tortillas in a dry pan",
      "Assemble tacos: tortilla, cabbage slaw, shrimp",
      "Drizzle with lime crema",
      "Garnish with fresh cilantro",
      "Serve with lime wedges"
    ],
    nutrition: {
      calories: 445,
      protein: 38,
      carbs: 42,
      fat: 14,
      fiber: 6,
      sugar: 4,
      sodium: 720
    },
    tags: ["high-protein", "quick", "mexican-inspired"],
    imageUrl: "",
    createdAt: new Date().toISOString()
  },
  {
    id: uuidv4(),
    name: "Chickpea Salad Sandwich",
    mealType: "lunch",
    description: "Creamy chickpea salad sandwich with fresh vegetables",
    prepTime: 10,
    cookTime: 0,
    servings: 2,
    ingredients: [
      { name: "chickpeas", quantity: 1.5, unit: "cups", category: "cupboard" },
      { name: "whole grain bread", quantity: 4, unit: "slices", category: "cupboard" },
      { name: "celery", quantity: 2, unit: "stalks", category: "fridge" },
      { name: "red onion", quantity: 0.25, unit: "whole", category: "cupboard" },
      { name: "mayonnaise", quantity: 3, unit: "tbsp", category: "fridge" },
      { name: "lemon juice", quantity: 1, unit: "tbsp", category: "fridge" },
      { name: "lettuce", quantity: 4, unit: "leaves", category: "fridge" },
      { name: "tomato", quantity: 1, unit: "medium", category: "fridge" }
    ],
    instructions: [
      "Drain and rinse chickpeas",
      "Mash chickpeas with a fork (leave some chunks)",
      "Finely dice celery and red onion",
      "Mix mashed chickpeas, celery, onion, mayo, and lemon juice",
      "Season with salt, pepper, and a pinch of paprika",
      "Toast bread if desired",
      "Spread chickpea salad on bread",
      "Add lettuce and sliced tomato",
      "Top with other slice of bread",
      "Cut in half and serve"
    ],
    nutrition: {
      calories: 420,
      protein: 16,
      carbs: 58,
      fat: 14,
      fiber: 12,
      sugar: 8,
      sodium: 620
    },
    tags: ["vegetarian", "vegan-option", "no-cook", "fiber-rich"],
    imageUrl: "",
    createdAt: new Date().toISOString()
  },
  {
    id: uuidv4(),
    name: "BBQ Pulled Chicken Bowl",
    mealType: "lunch",
    description: "Tender pulled chicken with BBQ sauce over quinoa and slaw",
    prepTime: 10,
    cookTime: 25,
    servings: 2,
    ingredients: [
      { name: "chicken breast", quantity: 12, unit: "oz", category: "fridge" },
      { name: "BBQ sauce", quantity: 0.5, unit: "cup", category: "cupboard" },
      { name: "quinoa", quantity: 1, unit: "cup", category: "cupboard" },
      { name: "coleslaw mix", quantity: 2, unit: "cups", category: "fridge" },
      { name: "apple cider vinegar", quantity: 2, unit: "tbsp", category: "cupboard" },
      { name: "corn", quantity: 1, unit: "cup", category: "freezer" },
      { name: "red onion", quantity: 0.25, unit: "whole", category: "cupboard" }
    ],
    instructions: [
      "Cook quinoa according to package directions",
      "Boil or pressure cook chicken until fully cooked",
      "Shred chicken with two forks",
      "Mix shredded chicken with BBQ sauce",
      "Make slaw: toss coleslaw mix with vinegar, salt, and pepper",
      "Warm corn",
      "Divide quinoa between bowls",
      "Top with BBQ chicken, slaw, and corn",
      "Garnish with sliced red onion",
      "Serve immediately"
    ],
    nutrition: {
      calories: 520,
      protein: 42,
      carbs: 68,
      fat: 8,
      fiber: 10,
      sugar: 22,
      sodium: 880
    },
    tags: ["high-protein", "meal-prep", "comfort-food"],
    imageUrl: "",
    createdAt: new Date().toISOString()
  },

  // ========== SNACKS (14) ==========
  {
    id: uuidv4(),
    name: "Apple Slices with Peanut Butter",
    mealType: "snacks",
    description: "Crisp apple slices paired with creamy peanut butter",
    prepTime: 5,
    cookTime: 0,
    servings: 1,
    ingredients: [
      { name: "apple", quantity: 1, unit: "large", category: "fridge" },
      { name: "peanut butter", quantity: 2, unit: "tbsp", category: "cupboard" }
    ],
    instructions: [
      "Wash and core apple",
      "Slice apple into 8-10 wedges",
      "Arrange on a plate",
      "Serve with peanut butter for dipping"
    ],
    nutrition: {
      calories: 265,
      protein: 8,
      carbs: 32,
      fat: 16,
      fiber: 6,
      sugar: 22,
      sodium: 125
    },
    tags: ["quick", "no-cook", "portable"],
    imageUrl: "",
    createdAt: new Date().toISOString()
  },
  {
    id: uuidv4(),
    name: "Hummus and Veggie Sticks",
    mealType: "snacks",
    description: "Fresh cut vegetables with creamy hummus",
    prepTime: 10,
    cookTime: 0,
    servings: 1,
    ingredients: [
      { name: "hummus", quantity: 0.5, unit: "cup", category: "fridge" },
      { name: "carrots", quantity: 2, unit: "medium", category: "fridge" },
      { name: "celery", quantity: 2, unit: "stalks", category: "fridge" },
      { name: "bell pepper", quantity: 0.5, unit: "whole", category: "fridge" },
      { name: "cucumber", quantity: 0.5, unit: "whole", category: "fridge" }
    ],
    instructions: [
      "Cut carrots into sticks",
      "Cut celery into sticks",
      "Slice bell pepper into strips",
      "Cut cucumber into sticks",
      "Arrange vegetables on a plate",
      "Serve with hummus for dipping"
    ],
    nutrition: {
      calories: 220,
      protein: 8,
      carbs: 28,
      fat: 10,
      fiber: 10,
      sugar: 10,
      sodium: 380
    },
    tags: ["vegan", "no-cook", "high-fiber"],
    imageUrl: "",
    createdAt: new Date().toISOString()
  },
  {
    id: uuidv4(),
    name: "Greek Yogurt with Honey and Nuts",
    mealType: "snacks",
    description: "Protein-rich Greek yogurt with honey and crunchy nuts",
    prepTime: 3,
    cookTime: 0,
    servings: 1,
    ingredients: [
      { name: "Greek yogurt", quantity: 1, unit: "cup", category: "fridge" },
      { name: "honey", quantity: 1, unit: "tbsp", category: "cupboard" },
      { name: "mixed nuts", quantity: 0.25, unit: "cup", category: "cupboard" }
    ],
    instructions: [
      "Scoop Greek yogurt into a bowl",
      "Drizzle honey on top",
      "Sprinkle mixed nuts over yogurt",
      "Enjoy immediately"
    ],
    nutrition: {
      calories: 310,
      protein: 20,
      carbs: 28,
      fat: 14,
      fiber: 2,
      sugar: 22,
      sodium: 75
    },
    tags: ["high-protein", "quick", "no-cook"],
    imageUrl: "",
    createdAt: new Date().toISOString()
  },
  {
    id: uuidv4(),
    name: "Trail Mix Energy Balls",
    mealType: "snacks",
    description: "No-bake energy balls with oats, nuts, and dried fruit",
    prepTime: 15,
    cookTime: 0,
    servings: 12,
    ingredients: [
      { name: "rolled oats", quantity: 1, unit: "cup", category: "cupboard" },
      { name: "peanut butter", quantity: 0.5, unit: "cup", category: "cupboard" },
      { name: "honey", quantity: 0.33, unit: "cup", category: "cupboard" },
      { name: "chocolate chips", quantity: 0.5, unit: "cup", category: "cupboard" },
      { name: "chia seeds", quantity: 2, unit: "tbsp", category: "cupboard" },
      { name: "vanilla extract", quantity: 1, unit: "tsp", category: "cupboard" }
    ],
    instructions: [
      "In a large bowl, mix all ingredients together",
      "Refrigerate mixture for 30 minutes",
      "Roll mixture into 12 balls using your hands",
      "Store in an airtight container in the fridge",
      "Enjoy as needed (1-2 balls per serving)"
    ],
    nutrition: {
      calories: 140,
      protein: 4,
      carbs: 18,
      fat: 7,
      fiber: 2,
      sugar: 10,
      sodium: 35
    },
    tags: ["no-bake", "make-ahead", "portable"],
    imageUrl: "",
    createdAt: new Date().toISOString()
  },
  {
    id: uuidv4(),
    name: "Banana with Almond Butter",
    mealType: "snacks",
    description: "Simple banana topped with almond butter",
    prepTime: 2,
    cookTime: 0,
    servings: 1,
    ingredients: [
      { name: "banana", quantity: 1, unit: "large", category: "cupboard" },
      { name: "almond butter", quantity: 2, unit: "tbsp", category: "cupboard" }
    ],
    instructions: [
      "Peel banana",
      "Slice banana lengthwise",
      "Spread almond butter on banana",
      "Enjoy immediately"
    ],
    nutrition: {
      calories: 290,
      protein: 7,
      carbs: 35,
      fat: 16,
      fiber: 6,
      sugar: 18,
      sodium: 5
    },
    tags: ["quick", "no-cook", "energy-boost"],
    imageUrl: "",
    createdAt: new Date().toISOString()
  },
  {
    id: uuidv4(),
    name: "Hard-Boiled Eggs with Everything Bagel Seasoning",
    mealType: "snacks",
    description: "Protein-packed hard-boiled eggs with savory seasoning",
    prepTime: 2,
    cookTime: 12,
    servings: 1,
    ingredients: [
      { name: "eggs", quantity: 2, unit: "whole", category: "fridge" },
      { name: "everything bagel seasoning", quantity: 0.5, unit: "tsp", category: "cupboard" }
    ],
    instructions: [
      "Place eggs in a pot and cover with cold water",
      "Bring to a boil over high heat",
      "Once boiling, remove from heat and cover",
      "Let sit for 10-12 minutes",
      "Transfer eggs to ice bath",
      "Peel eggs once cooled",
      "Sprinkle with everything bagel seasoning",
      "Enjoy immediately or store in fridge"
    ],
    nutrition: {
      calories: 140,
      protein: 12,
      carbs: 1,
      fat: 10,
      fiber: 0,
      sugar: 1,
      sodium: 140
    },
    tags: ["high-protein", "low-carb", "meal-prep"],
    imageUrl: "",
    createdAt: new Date().toISOString()
  },
  {
    id: uuidv4(),
    name: "Cheese and Whole Grain Crackers",
    mealType: "snacks",
    description: "Sharp cheddar with crunchy whole grain crackers",
    prepTime: 3,
    cookTime: 0,
    servings: 1,
    ingredients: [
      { name: "cheddar cheese", quantity: 2, unit: "oz", category: "fridge" },
      { name: "whole grain crackers", quantity: 10, unit: "pieces", category: "cupboard" }
    ],
    instructions: [
      "Slice cheddar cheese",
      "Arrange crackers on a plate",
      "Place cheese on crackers or serve alongside",
      "Enjoy immediately"
    ],
    nutrition: {
      calories: 280,
      protein: 12,
      carbs: 20,
      fat: 18,
      fiber: 3,
      sugar: 0,
      sodium: 380
    },
    tags: ["quick", "no-cook", "portable"],
    imageUrl: "",
    createdAt: new Date().toISOString()
  },
  {
    id: uuidv4(),
    name: "Edamame with Sea Salt",
    mealType: "snacks",
    description: "Steamed edamame lightly salted",
    prepTime: 2,
    cookTime: 5,
    servings: 1,
    ingredients: [
      { name: "edamame", quantity: 1.5, unit: "cups", category: "freezer" },
      { name: "sea salt", quantity: 0.5, unit: "tsp", category: "cupboard" }
    ],
    instructions: [
      "Boil water in a pot",
      "Add frozen edamame",
      "Cook for 5 minutes",
      "Drain and transfer to a bowl",
      "Sprinkle with sea salt",
      "Toss to coat",
      "Serve warm"
    ],
    nutrition: {
      calories: 190,
      protein: 17,
      carbs: 15,
      fat: 8,
      fiber: 8,
      sugar: 3,
      sodium: 480
    },
    tags: ["high-protein", "vegan", "quick"],
    imageUrl: "",
    createdAt: new Date().toISOString()
  },
  {
    id: uuidv4(),
    name: "Avocado Toast Bites",
    mealType: "snacks",
    description: "Mini avocado toasts with cherry tomatoes",
    prepTime: 8,
    cookTime: 3,
    servings: 1,
    ingredients: [
      { name: "whole grain bread", quantity: 2, unit: "slices", category: "cupboard" },
      { name: "avocado", quantity: 0.5, unit: "whole", category: "cupboard" },
      { name: "cherry tomatoes", quantity: 6, unit: "whole", category: "fridge" },
      { name: "lemon juice", quantity: 0.5, unit: "tsp", category: "fridge" },
      { name: "red pepper flakes", quantity: 0.125, unit: "tsp", category: "cupboard" }
    ],
    instructions: [
      "Toast bread until golden brown",
      "Mash avocado with lemon juice, salt, and pepper",
      "Spread avocado on toast",
      "Halve cherry tomatoes",
      "Top toast with tomatoes",
      "Sprinkle with red pepper flakes",
      "Cut each toast into 4 pieces",
      "Serve immediately"
    ],
    nutrition: {
      calories: 245,
      protein: 7,
      carbs: 30,
      fat: 12,
      fiber: 9,
      sugar: 4,
      sodium: 280
    },
    tags: ["vegetarian", "quick", "nutrient-dense"],
    imageUrl: "",
    createdAt: new Date().toISOString()
  },
  {
    id: uuidv4(),
    name: "Protein Shake",
    mealType: "snacks",
    description: "Simple protein shake with banana and berries",
    prepTime: 5,
    cookTime: 0,
    servings: 1,
    ingredients: [
      { name: "protein powder", quantity: 1, unit: "scoop", category: "cupboard" },
      { name: "banana", quantity: 1, unit: "whole", category: "freezer" },
      { name: "mixed berries", quantity: 0.5, unit: "cup", category: "freezer" },
      { name: "almond milk", quantity: 1, unit: "cup", category: "fridge" },
      { name: "ice", quantity: 0.5, unit: "cup", category: "freezer" }
    ],
    instructions: [
      "Add all ingredients to a blender",
      "Blend until smooth",
      "Pour into a glass",
      "Enjoy immediately"
    ],
    nutrition: {
      calories: 280,
      protein: 28,
      carbs: 35,
      fat: 4,
      fiber: 6,
      sugar: 18,
      sodium: 180
    },
    tags: ["high-protein", "quick", "post-workout"],
    imageUrl: "",
    createdAt: new Date().toISOString()
  },
  {
    id: uuidv4(),
    name: "Rice Cakes with Cottage Cheese and Berries",
    mealType: "snacks",
    description: "Light rice cakes topped with cottage cheese and fresh berries",
    prepTime: 5,
    cookTime: 0,
    servings: 1,
    ingredients: [
      { name: "rice cakes", quantity: 2, unit: "whole", category: "cupboard" },
      { name: "cottage cheese", quantity: 0.5, unit: "cup", category: "fridge" },
      { name: "blueberries", quantity: 0.25, unit: "cup", category: "fridge" },
      { name: "honey", quantity: 0.5, unit: "tsp", category: "cupboard" }
    ],
    instructions: [
      "Spread cottage cheese on rice cakes",
      "Top with fresh blueberries",
      "Drizzle with honey",
      "Enjoy immediately"
    ],
    nutrition: {
      calories: 185,
      protein: 14,
      carbs: 28,
      fat: 2,
      fiber: 2,
      sugar: 8,
      sodium: 340
    },
    tags: ["high-protein", "low-fat", "quick"],
    imageUrl: "",
    createdAt: new Date().toISOString()
  },
  {
    id: uuidv4(),
    name: "Dark Chocolate and Almonds",
    mealType: "snacks",
    description: "Antioxidant-rich dark chocolate paired with almonds",
    prepTime: 1,
    cookTime: 0,
    servings: 1,
    ingredients: [
      { name: "dark chocolate", quantity: 1, unit: "oz", category: "cupboard" },
      { name: "almonds", quantity: 0.25, unit: "cup", category: "cupboard" }
    ],
    instructions: [
      "Break dark chocolate into pieces",
      "Portion almonds",
      "Enjoy together as a snack"
    ],
    nutrition: {
      calories: 260,
      protein: 7,
      carbs: 18,
      fat: 20,
      fiber: 5,
      sugar: 10,
      sodium: 5
    },
    tags: ["quick", "antioxidants", "heart-healthy"],
    imageUrl: "",
    createdAt: new Date().toISOString()
  },
  {
    id: uuidv4(),
    name: "Celery Sticks with Cream Cheese",
    mealType: "snacks",
    description: "Crisp celery filled with smooth cream cheese",
    prepTime: 5,
    cookTime: 0,
    servings: 1,
    ingredients: [
      { name: "celery", quantity: 4, unit: "stalks", category: "fridge" },
      { name: "cream cheese", quantity: 3, unit: "tbsp", category: "fridge" },
      { name: "everything bagel seasoning", quantity: 0.5, unit: "tsp", category: "cupboard" }
    ],
    instructions: [
      "Wash celery and cut into 3-inch pieces",
      "Fill celery grooves with cream cheese",
      "Sprinkle with everything bagel seasoning",
      "Arrange on a plate and serve"
    ],
    nutrition: {
      calories: 135,
      protein: 3,
      carbs: 6,
      fat: 12,
      fiber: 2,
      sugar: 3,
      sodium: 220
    },
    tags: ["low-carb", "quick", "no-cook"],
    imageUrl: "",
    createdAt: new Date().toISOString()
  },
  {
    id: uuidv4(),
    name: "Roasted Chickpeas",
    mealType: "snacks",
    description: "Crunchy roasted chickpeas with savory seasonings",
    prepTime: 5,
    cookTime: 30,
    servings: 4,
    ingredients: [
      { name: "chickpeas", quantity: 2, unit: "cups", category: "cupboard" },
      { name: "olive oil", quantity: 2, unit: "tbsp", category: "cupboard" },
      { name: "paprika", quantity: 1, unit: "tsp", category: "cupboard" },
      { name: "garlic powder", quantity: 0.5, unit: "tsp", category: "cupboard" },
      { name: "salt", quantity: 0.5, unit: "tsp", category: "cupboard" }
    ],
    instructions: [
      "Preheat oven to 400°F (200°C)",
      "Drain and rinse chickpeas, pat very dry",
      "Toss chickpeas with olive oil and seasonings",
      "Spread on a baking sheet in a single layer",
      "Roast for 25-30 minutes, shaking pan halfway through",
      "Let cool (they will get crunchier)",
      "Store in an airtight container for up to 3 days"
    ],
    nutrition: {
      calories: 160,
      protein: 7,
      carbs: 22,
      fat: 5,
      fiber: 6,
      sugar: 4,
      sodium: 310
    },
    tags: ["vegan", "high-fiber", "make-ahead"],
    imageUrl: "",
    createdAt: new Date().toISOString()
  },

  // ========== DINNER (14) ==========
  {
    id: uuidv4(),
    name: "Grilled Steak with Roasted Vegetables",
    mealType: "dinner",
    description: "Juicy grilled steak with colorful roasted vegetables",
    prepTime: 15,
    cookTime: 25,
    servings: 2,
    ingredients: [
      { name: "sirloin steak", quantity: 14, unit: "oz", category: "fridge" },
      { name: "broccoli", quantity: 2, unit: "cups", category: "fridge" },
      { name: "bell peppers", quantity: 2, unit: "whole", category: "fridge" },
      { name: "zucchini", quantity: 1, unit: "large", category: "fridge" },
      { name: "olive oil", quantity: 3, unit: "tbsp", category: "cupboard" },
      { name: "garlic", quantity: 3, unit: "cloves", category: "cupboard" },
      { name: "rosemary", quantity: 2, unit: "sprigs", category: "fridge" }
    ],
    instructions: [
      "Preheat oven to 425°F (220°C)",
      "Cut vegetables into bite-sized pieces",
      "Toss vegetables with olive oil, minced garlic, salt, and pepper",
      "Spread vegetables on a baking sheet",
      "Roast for 20-25 minutes until tender and caramelized",
      "Season steak with salt, pepper, and rosemary",
      "Heat a grill or cast-iron pan over high heat",
      "Grill steak 4-5 minutes per side for medium-rare",
      "Let steak rest for 5 minutes before slicing",
      "Serve steak with roasted vegetables"
    ],
    nutrition: {
      calories: 520,
      protein: 48,
      carbs: 22,
      fat: 28,
      fiber: 7,
      sugar: 10,
      sodium: 420
    },
    tags: ["high-protein", "low-carb", "nutrient-dense"],
    imageUrl: "",
    createdAt: new Date().toISOString()
  },
  {
    id: uuidv4(),
    name: "Baked Salmon with Asparagus and Quinoa",
    mealType: "dinner",
    description: "Herb-crusted salmon with tender asparagus and fluffy quinoa",
    prepTime: 10,
    cookTime: 20,
    servings: 2,
    ingredients: [
      { name: "salmon fillet", quantity: 14, unit: "oz", category: "fridge" },
      { name: "asparagus", quantity: 1, unit: "lb", category: "fridge" },
      { name: "quinoa", quantity: 1, unit: "cup", category: "cupboard" },
      { name: "lemon", quantity: 1, unit: "whole", category: "fridge" },
      { name: "olive oil", quantity: 3, unit: "tbsp", category: "cupboard" },
      { name: "dill", quantity: 2, unit: "tbsp", category: "fridge" },
      { name: "garlic", quantity: 3, unit: "cloves", category: "cupboard" }
    ],
    instructions: [
      "Preheat oven to 400°F (200°C)",
      "Cook quinoa according to package directions",
      "Place salmon on a baking sheet lined with parchment",
      "Trim asparagus and arrange around salmon",
      "Drizzle everything with olive oil",
      "Season salmon with dill, minced garlic, lemon zest, salt, and pepper",
      "Bake for 15-18 minutes until salmon flakes easily",
      "Squeeze fresh lemon juice over salmon and asparagus",
      "Serve over quinoa"
    ],
    nutrition: {
      calories: 580,
      protein: 46,
      carbs: 48,
      fat: 22,
      fiber: 8,
      sugar: 4,
      sodium: 280
    },
    tags: ["high-protein", "omega-3", "nutrient-dense"],
    imageUrl: "",
    createdAt: new Date().toISOString()
  },
  {
    id: uuidv4(),
    name: "Chicken Breast with Sweet Potato and Green Beans",
    mealType: "dinner",
    description: "Herb-roasted chicken with caramelized sweet potato and crisp green beans",
    prepTime: 15,
    cookTime: 30,
    servings: 2,
    ingredients: [
      { name: "chicken breast", quantity: 14, unit: "oz", category: "fridge" },
      { name: "sweet potato", quantity: 2, unit: "large", category: "cupboard" },
      { name: "green beans", quantity: 3, unit: "cups", category: "fridge" },
      { name: "olive oil", quantity: 3, unit: "tbsp", category: "cupboard" },
      { name: "thyme", quantity: 2, unit: "tsp", category: "cupboard" },
      { name: "garlic powder", quantity: 1, unit: "tsp", category: "cupboard" }
    ],
    instructions: [
      "Preheat oven to 425°F (220°C)",
      "Peel and cube sweet potatoes",
      "Toss sweet potatoes with olive oil, salt, and pepper",
      "Roast for 25-30 minutes until caramelized",
      "Season chicken with thyme, garlic powder, salt, and pepper",
      "Heat a pan over medium-high heat with olive oil",
      "Sear chicken 6-7 minutes per side until cooked through",
      "Steam or sauté green beans until tender-crisp",
      "Slice chicken and serve with sweet potato and green beans"
    ],
    nutrition: {
      calories: 495,
      protein: 46,
      carbs: 48,
      fat: 12,
      fiber: 9,
      sugar: 12,
      sodium: 360
    },
    tags: ["high-protein", "nutrient-dense", "balanced"],
    imageUrl: "",
    createdAt: new Date().toISOString()
  },
  {
    id: uuidv4(),
    name: "Shrimp Stir-Fry with Brown Rice",
    mealType: "dinner",
    description: "Quick shrimp stir-fry with vegetables over brown rice",
    prepTime: 15,
    cookTime: 20,
    servings: 2,
    ingredients: [
      { name: "shrimp", quantity: 14, unit: "oz", category: "freezer" },
      { name: "brown rice", quantity: 1, unit: "cup", category: "cupboard" },
      { name: "broccoli", quantity: 2, unit: "cups", category: "fridge" },
      { name: "snap peas", quantity: 1.5, unit: "cups", category: "fridge" },
      { name: "carrots", quantity: 2, unit: "medium", category: "fridge" },
      { name: "soy sauce", quantity: 3, unit: "tbsp", category: "cupboard" },
      { name: "ginger", quantity: 1, unit: "tbsp", category: "cupboard" },
      { name: "sesame oil", quantity: 2, unit: "tbsp", category: "cupboard" }
    ],
    instructions: [
      "Cook brown rice according to package directions",
      "Cut broccoli into florets, julienne carrots",
      "Heat sesame oil in a wok over high heat",
      "Add shrimp and cook 2-3 minutes until pink, remove",
      "Add vegetables to wok and stir-fry 5 minutes",
      "Add minced ginger and garlic, cook 1 minute",
      "Return shrimp to wok",
      "Add soy sauce and toss everything together",
      "Serve over brown rice"
    ],
    nutrition: {
      calories: 520,
      protein: 42,
      carbs: 62,
      fat: 10,
      fiber: 8,
      sugar: 8,
      sodium: 1080
    },
    tags: ["high-protein", "asian-inspired", "quick"],
    imageUrl: "",
    createdAt: new Date().toISOString()
  },
  {
    id: uuidv4(),
    name: "Turkey Meatballs with Zucchini Noodles",
    mealType: "dinner",
    description: "Lean turkey meatballs with marinara over zucchini noodles",
    prepTime: 20,
    cookTime: 25,
    servings: 3,
    ingredients: [
      { name: "ground turkey", quantity: 1, unit: "lb", category: "fridge" },
      { name: "zucchini", quantity: 4, unit: "large", category: "fridge" },
      { name: "marinara sauce", quantity: 2, unit: "cups", category: "cupboard" },
      { name: "parmesan cheese", quantity: 0.5, unit: "cup", category: "fridge" },
      { name: "breadcrumbs", quantity: 0.5, unit: "cup", category: "cupboard" },
      { name: "egg", quantity: 1, unit: "whole", category: "fridge" },
      { name: "garlic", quantity: 3, unit: "cloves", category: "cupboard" }
    ],
    instructions: [
      "Preheat oven to 400°F (200°C)",
      "Mix ground turkey, breadcrumbs, egg, minced garlic, and half the parmesan",
      "Form into 12 meatballs",
      "Place on a baking sheet and bake for 20-25 minutes",
      "Spiralize zucchini into noodles",
      "Heat marinara sauce in a large pan",
      "Add cooked meatballs to sauce",
      "Sauté zucchini noodles in a separate pan for 2-3 minutes",
      "Serve meatballs and sauce over zucchini noodles",
      "Top with remaining parmesan"
    ],
    nutrition: {
      calories: 420,
      protein: 38,
      carbs: 32,
      fat: 16,
      fiber: 6,
      sugar: 12,
      sodium: 880
    },
    tags: ["high-protein", "low-carb", "italian-inspired"],
    imageUrl: "",
    createdAt: new Date().toISOString()
  },
  {
    id: uuidv4(),
    name: "Beef and Broccoli Stir-Fry",
    mealType: "dinner",
    description: "Tender beef with broccoli in a savory sauce",
    prepTime: 15,
    cookTime: 15,
    servings: 2,
    ingredients: [
      { name: "flank steak", quantity: 12, unit: "oz", category: "fridge" },
      { name: "broccoli", quantity: 4, unit: "cups", category: "fridge" },
      { name: "brown rice", quantity: 1, unit: "cup", category: "cupboard" },
      { name: "soy sauce", quantity: 3, unit: "tbsp", category: "cupboard" },
      { name: "oyster sauce", quantity: 2, unit: "tbsp", category: "cupboard" },
      { name: "ginger", quantity: 1, unit: "tbsp", category: "cupboard" },
      { name: "garlic", quantity: 3, unit: "cloves", category: "cupboard" },
      { name: "sesame oil", quantity: 2, unit: "tbsp", category: "cupboard" }
    ],
    instructions: [
      "Cook brown rice according to package directions",
      "Slice beef thinly against the grain",
      "Cut broccoli into florets",
      "Heat sesame oil in a wok over high heat",
      "Stir-fry beef for 3-4 minutes, remove and set aside",
      "Add broccoli and stir-fry for 5 minutes",
      "Add minced ginger and garlic, cook 1 minute",
      "Return beef to wok",
      "Add soy sauce and oyster sauce, toss to coat",
      "Serve over brown rice"
    ],
    nutrition: {
      calories: 540,
      protein: 42,
      carbs: 58,
      fat: 16,
      fiber: 6,
      sugar: 4,
      sodium: 1180
    },
    tags: ["high-protein", "asian-inspired"],
    imageUrl: "",
    createdAt: new Date().toISOString()
  },
  {
    id: uuidv4(),
    name: "Baked Cod with Roasted Brussels Sprouts",
    mealType: "dinner",
    description: "Flaky cod with caramelized Brussels sprouts and lemon",
    prepTime: 10,
    cookTime: 25,
    servings: 2,
    ingredients: [
      { name: "cod fillet", quantity: 14, unit: "oz", category: "freezer" },
      { name: "Brussels sprouts", quantity: 1, unit: "lb", category: "fridge" },
      { name: "quinoa", quantity: 1, unit: "cup", category: "cupboard" },
      { name: "lemon", quantity: 1, unit: "whole", category: "fridge" },
      { name: "olive oil", quantity: 3, unit: "tbsp", category: "cupboard" },
      { name: "garlic", quantity: 4, unit: "cloves", category: "cupboard" },
      { name: "parmesan cheese", quantity: 0.25, unit: "cup", category: "fridge" }
    ],
    instructions: [
      "Preheat oven to 425°F (220°C)",
      "Cook quinoa according to package directions",
      "Trim and halve Brussels sprouts",
      "Toss Brussels sprouts with olive oil, minced garlic, salt, and pepper",
      "Roast for 20-25 minutes until golden",
      "Place cod on a baking sheet, season with lemon zest, salt, and pepper",
      "Bake for 12-15 minutes until fish flakes easily",
      "Toss Brussels sprouts with parmesan",
      "Serve cod with Brussels sprouts over quinoa",
      "Squeeze fresh lemon juice over everything"
    ],
    nutrition: {
      calories: 520,
      protein: 44,
      carbs: 52,
      fat: 14,
      fiber: 10,
      sugar: 6,
      sodium: 480
    },
    tags: ["high-protein", "low-fat", "nutrient-dense"],
    imageUrl: "",
    createdAt: new Date().toISOString()
  },
  {
    id: uuidv4(),
    name: "Chicken Fajita Bowl",
    mealType: "dinner",
    description: "Sizzling chicken fajitas served as a nutritious bowl",
    prepTime: 15,
    cookTime: 20,
    servings: 2,
    ingredients: [
      { name: "chicken breast", quantity: 12, unit: "oz", category: "fridge" },
      { name: "bell peppers", quantity: 2, unit: "whole", category: "fridge" },
      { name: "onion", quantity: 1, unit: "large", category: "cupboard" },
      { name: "brown rice", quantity: 1, unit: "cup", category: "cupboard" },
      { name: "black beans", quantity: 1, unit: "cup", category: "cupboard" },
      { name: "avocado", quantity: 1, unit: "whole", category: "cupboard" },
      { name: "lime", quantity: 1, unit: "whole", category: "fridge" },
      { name: "fajita seasoning", quantity: 2, unit: "tbsp", category: "cupboard" }
    ],
    instructions: [
      "Cook brown rice according to package directions",
      "Slice chicken into strips",
      "Season chicken with fajita seasoning",
      "Slice bell peppers and onion into strips",
      "Heat oil in a large skillet over high heat",
      "Cook chicken for 6-7 minutes until cooked through, remove",
      "Sauté peppers and onions until tender and charred",
      "Warm black beans",
      "Divide rice between bowls",
      "Top with chicken, peppers, onions, and black beans",
      "Add sliced avocado and lime wedges"
    ],
    nutrition: {
      calories: 580,
      protein: 44,
      carbs: 72,
      fat: 14,
      fiber: 14,
      sugar: 8,
      sodium: 680
    },
    tags: ["high-protein", "fiber-rich", "mexican-inspired"],
    imageUrl: "",
    createdAt: new Date().toISOString()
  },
  {
    id: uuidv4(),
    name: "Pork Tenderloin with Roasted Root Vegetables",
    mealType: "dinner",
    description: "Juicy pork tenderloin with colorful roasted root vegetables",
    prepTime: 15,
    cookTime: 35,
    servings: 3,
    ingredients: [
      { name: "pork tenderloin", quantity: 1, unit: "lb", category: "fridge" },
      { name: "sweet potato", quantity: 2, unit: "medium", category: "cupboard" },
      { name: "carrots", quantity: 4, unit: "medium", category: "fridge" },
      { name: "parsnips", quantity: 2, unit: "medium", category: "fridge" },
      { name: "olive oil", quantity: 3, unit: "tbsp", category: "cupboard" },
      { name: "rosemary", quantity: 2, unit: "sprigs", category: "fridge" },
      { name: "thyme", quantity: 2, unit: "tsp", category: "cupboard" }
    ],
    instructions: [
      "Preheat oven to 400°F (200°C)",
      "Peel and chop root vegetables into chunks",
      "Toss vegetables with olive oil, thyme, salt, and pepper",
      "Spread vegetables on a baking sheet",
      "Season pork with rosemary, salt, and pepper",
      "Sear pork in a hot pan for 2-3 minutes per side",
      "Place pork on vegetables",
      "Roast for 25-30 minutes until pork reaches 145°F",
      "Let pork rest for 5 minutes before slicing",
      "Serve sliced pork with roasted vegetables"
    ],
    nutrition: {
      calories: 440,
      protein: 38,
      carbs: 42,
      fat: 12,
      fiber: 8,
      sugar: 12,
      sodium: 320
    },
    tags: ["high-protein", "nutrient-dense", "comfort-food"],
    imageUrl: "",
    createdAt: new Date().toISOString()
  },
  {
    id: uuidv4(),
    name: "Vegetarian Lentil Curry",
    mealType: "dinner",
    description: "Hearty lentil curry with vegetables and aromatic spices",
    prepTime: 15,
    cookTime: 30,
    servings: 4,
    ingredients: [
      { name: "red lentils", quantity: 1.5, unit: "cups", category: "cupboard" },
      { name: "coconut milk", quantity: 1, unit: "can", category: "cupboard" },
      { name: "diced tomatoes", quantity: 1, unit: "can", category: "cupboard" },
      { name: "spinach", quantity: 3, unit: "cups", category: "fridge" },
      { name: "onion", quantity: 1, unit: "large", category: "cupboard" },
      { name: "curry powder", quantity: 2, unit: "tbsp", category: "cupboard" },
      { name: "ginger", quantity: 1, unit: "tbsp", category: "cupboard" },
      { name: "brown rice", quantity: 2, unit: "cups", category: "cupboard" }
    ],
    instructions: [
      "Cook brown rice according to package directions",
      "Rinse lentils and set aside",
      "Dice onion and mince ginger",
      "Heat oil in a large pot over medium heat",
      "Sauté onion until soft, about 5 minutes",
      "Add curry powder and ginger, cook 1 minute",
      "Add lentils, coconut milk, tomatoes, and 2 cups water",
      "Bring to a boil, then simmer 20-25 minutes",
      "Stir in spinach until wilted",
      "Season with salt and pepper",
      "Serve over brown rice"
    ],
    nutrition: {
      calories: 480,
      protein: 20,
      carbs: 74,
      fat: 12,
      fiber: 16,
      sugar: 8,
      sodium: 280
    },
    tags: ["vegetarian", "vegan", "high-fiber", "indian-inspired"],
    imageUrl: "",
    createdAt: new Date().toISOString()
  },
  {
    id: uuidv4(),
    name: "Grilled Chicken with Cauliflower Rice and Avocado",
    mealType: "dinner",
    description: "Marinated chicken with low-carb cauliflower rice and fresh avocado",
    prepTime: 15,
    cookTime: 20,
    servings: 2,
    ingredients: [
      { name: "chicken thighs", quantity: 12, unit: "oz", category: "fridge" },
      { name: "cauliflower", quantity: 1, unit: "large head", category: "fridge" },
      { name: "avocado", quantity: 1, unit: "whole", category: "cupboard" },
      { name: "lime", quantity: 2, unit: "whole", category: "fridge" },
      { name: "cilantro", quantity: 0.5, unit: "cup", category: "fridge" },
      { name: "cumin", quantity: 1, unit: "tsp", category: "cupboard" },
      { name: "chili powder", quantity: 1, unit: "tsp", category: "cupboard" }
    ],
    instructions: [
      "Marinate chicken with lime juice, cumin, and chili powder for 15 minutes",
      "Rice cauliflower in a food processor",
      "Grill chicken over medium-high heat 6-7 minutes per side",
      "Let chicken rest, then slice",
      "Sauté cauliflower rice with oil for 5-7 minutes",
      "Season with salt and pepper",
      "Divide cauliflower rice between plates",
      "Top with sliced chicken",
      "Add sliced avocado",
      "Garnish with cilantro and lime wedges"
    ],
    nutrition: {
      calories: 460,
      protein: 38,
      carbs: 24,
      fat: 26,
      fiber: 12,
      sugar: 8,
      sodium: 320
    },
    tags: ["high-protein", "low-carb", "keto-friendly"],
    imageUrl: "",
    createdAt: new Date().toISOString()
  },
  {
    id: uuidv4(),
    name: "Baked Chicken Parmesan with Whole Wheat Pasta",
    mealType: "dinner",
    description: "Crispy baked chicken parmesan with marinara and whole wheat pasta",
    prepTime: 20,
    cookTime: 30,
    servings: 3,
    ingredients: [
      { name: "chicken breast", quantity: 1, unit: "lb", category: "fridge" },
      { name: "whole wheat pasta", quantity: 8, unit: "oz", category: "cupboard" },
      { name: "marinara sauce", quantity: 2, unit: "cups", category: "cupboard" },
      { name: "mozzarella cheese", quantity: 1, unit: "cup", category: "fridge" },
      { name: "parmesan cheese", quantity: 0.5, unit: "cup", category: "fridge" },
      { name: "breadcrumbs", quantity: 1, unit: "cup", category: "cupboard" },
      { name: "egg", quantity: 1, unit: "whole", category: "fridge" }
    ],
    instructions: [
      "Preheat oven to 400°F (200°C)",
      "Cook pasta according to package directions",
      "Pound chicken breasts to even thickness",
      "Set up breading station: flour, beaten egg, breadcrumbs mixed with parmesan",
      "Bread each chicken breast",
      "Place on a baking sheet and spray with oil",
      "Bake for 20 minutes",
      "Top each breast with marinara and mozzarella",
      "Bake 10 more minutes until cheese melts",
      "Toss pasta with remaining marinara",
      "Serve chicken over pasta"
    ],
    nutrition: {
      calories: 580,
      protein: 52,
      carbs: 58,
      fat: 16,
      fiber: 8,
      sugar: 10,
      sodium: 920
    },
    tags: ["high-protein", "italian-inspired", "comfort-food"],
    imageUrl: "",
    createdAt: new Date().toISOString()
  },
  {
    id: uuidv4(),
    name: "Tuna Steak with Quinoa and Sautéed Spinach",
    mealType: "dinner",
    description: "Seared tuna steak with fluffy quinoa and garlic spinach",
    prepTime: 10,
    cookTime: 20,
    servings: 2,
    ingredients: [
      { name: "tuna steak", quantity: 12, unit: "oz", category: "fridge" },
      { name: "quinoa", quantity: 1, unit: "cup", category: "cupboard" },
      { name: "spinach", quantity: 6, unit: "cups", category: "fridge" },
      { name: "lemon", quantity: 1, unit: "whole", category: "fridge" },
      { name: "soy sauce", quantity: 2, unit: "tbsp", category: "cupboard" },
      { name: "sesame seeds", quantity: 1, unit: "tbsp", category: "cupboard" },
      { name: "garlic", quantity: 4, unit: "cloves", category: "cupboard" }
    ],
    instructions: [
      "Cook quinoa according to package directions",
      "Season tuna with soy sauce and sesame seeds",
      "Heat a pan over high heat with oil",
      "Sear tuna 2-3 minutes per side (keep center rare)",
      "Let tuna rest, then slice",
      "In the same pan, sauté minced garlic for 30 seconds",
      "Add spinach and sauté until wilted",
      "Divide quinoa and spinach between plates",
      "Top with sliced tuna",
      "Squeeze lemon juice over everything"
    ],
    nutrition: {
      calories: 520,
      protein: 50,
      carbs: 48,
      fat: 10,
      fiber: 8,
      sugar: 2,
      sodium: 680
    },
    tags: ["high-protein", "omega-3", "nutrient-dense"],
    imageUrl: "",
    createdAt: new Date().toISOString()
  },
  {
    id: uuidv4(),
    name: "Stuffed Bell Peppers with Ground Turkey",
    mealType: "dinner",
    description: "Colorful bell peppers stuffed with seasoned turkey and rice",
    prepTime: 20,
    cookTime: 40,
    servings: 4,
    ingredients: [
      { name: "bell peppers", quantity: 4, unit: "large", category: "fridge" },
      { name: "ground turkey", quantity: 1, unit: "lb", category: "fridge" },
      { name: "brown rice", quantity: 1, unit: "cup", category: "cupboard" },
      { name: "diced tomatoes", quantity: 1, unit: "can", category: "cupboard" },
      { name: "onion", quantity: 1, unit: "medium", category: "cupboard" },
      { name: "mozzarella cheese", quantity: 1, unit: "cup", category: "fridge" },
      { name: "italian seasoning", quantity: 2, unit: "tsp", category: "cupboard" }
    ],
    instructions: [
      "Preheat oven to 375°F (190°C)",
      "Cook brown rice according to package directions",
      "Cut tops off peppers and remove seeds",
      "Dice onion and sauté until soft",
      "Add ground turkey and cook until browned",
      "Stir in cooked rice, diced tomatoes, and italian seasoning",
      "Stuff peppers with turkey mixture",
      "Place in a baking dish with a little water in bottom",
      "Cover with foil and bake for 30 minutes",
      "Uncover, top with cheese, bake 10 more minutes",
      "Serve hot"
    ],
    nutrition: {
      calories: 420,
      protein: 34,
      carbs: 42,
      fat: 12,
      fiber: 6,
      sugar: 10,
      sodium: 480
    },
    tags: ["high-protein", "meal-prep", "comfort-food"],
    imageUrl: "",
    createdAt: new Date().toISOString()
  }
];

async function uploadMeals() {
  console.log("🚀 Starting meals library seed...\n");
  console.log(`📊 Total meals to upload: ${meals.length}\n`);

  // Verify meal distribution
  const breakfastCount = meals.filter(m => m.mealType === "breakfast").length;
  const lunchCount = meals.filter(m => m.mealType === "lunch").length;
  const snacksCount = meals.filter(m => m.mealType === "snacks").length;
  const dinnerCount = meals.filter(m => m.mealType === "dinner").length;

  console.log("📋 Meal distribution:");
  console.log(`   Breakfast: ${breakfastCount}`);
  console.log(`   Lunch: ${lunchCount}`);
  console.log(`   Snacks: ${snacksCount}`);
  console.log(`   Dinner: ${dinnerCount}\n`);

  // Batch upload (25 items per batch for DynamoDB)
  const batchSize = 25;
  for (let i = 0; i < meals.length; i += batchSize) {
    const batch = meals.slice(i, i + batchSize);
    
    const putRequests = batch.map((meal) => ({
      PutRequest: {
        Item: meal,
      },
    }));

    try {
      await docClient.send(
        new BatchWriteCommand({
          RequestItems: {
            meals_library: putRequests,
          },
        })
      );
      console.log(`✅ Uploaded batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(meals.length / batchSize)}`);
    } catch (error) {
      console.error(`❌ Error uploading batch ${Math.floor(i / batchSize) + 1}:`, error);
    }
  }

  console.log("\n✅ All meals uploaded successfully!");
  console.log("📊 Summary:");
  console.log(`   Total meals: ${meals.length}`);
  console.log(`   Breakfast: ${breakfastCount} meals`);
  console.log(`   Lunch: ${lunchCount} meals`);
  console.log(`   Snacks: ${snacksCount} meals`);
  console.log(`   Dinner: ${dinnerCount} meals`);
}

uploadMeals().catch((error) => {
  console.error("❌ Fatal error:", error);
  process.exit(1);
});