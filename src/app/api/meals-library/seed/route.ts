import { NextResponse } from "next/server";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, BatchWriteCommand } from "@aws-sdk/lib-dynamodb";
import { v4 as uuidv4 } from "uuid";

const dynamoClient = new DynamoDBClient({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

const docClient = DynamoDBDocumentClient.from(dynamoClient);

// All 56 meals with AWS Titan G1V2 prompts
const meals = [
  // BREAKFAST (14 meals)
  {
    meal_type: "breakfast",
    name: "Berry Protein Pancakes",
    description: "Fluffy protein-packed pancakes topped with fresh mixed berries and Greek yogurt",
    imagePrompt: "A stack of fluffy protein pancakes topped with vibrant mixed berries (blueberries, strawberries, raspberries) and a dollop of Greek yogurt. Natural morning light illuminating the colorful berries, creating a fresh and appetizing breakfast scene.",
    prep_time: 10,
    cook_time: 15,
    servings: 2,
    ingredients: [
      { name: "Protein powder", amount: "30g", category: "cupboard" },
      { name: "Oats", amount: "50g", category: "cupboard" },
      { name: "Eggs", amount: "2", category: "fridge" },
      { name: "Mixed berries", amount: "100g", category: "fridge" },
      { name: "Greek yogurt", amount: "100g", category: "fridge" }
    ],
    instructions: [
      "Blend oats into flour",
      "Mix all dry ingredients",
      "Whisk eggs and add to dry mix",
      "Cook pancakes on medium heat",
      "Top with berries and yogurt"
    ],
    nutrition: {
      calories: 380,
      protein: 28,
      carbs: 45,
      fat: 8,
      fiber: 6
    }
  },
  {
    meal_type: "breakfast",
    name: "Avocado Toast with Poached Eggs",
    description: "Whole grain toast with creamy avocado, perfectly poached eggs, and microgreens",
    imagePrompt: "Rustic whole grain toast topped with creamy mashed avocado and two perfectly poached eggs with runny yolks. Garnished with fresh microgreens and a sprinkle of black pepper. Served on a white plate with soft natural lighting highlighting the golden yolks.",
    prep_time: 5,
    cook_time: 10,
    servings: 1,
    ingredients: [
      { name: "Whole grain bread", amount: "2 slices", category: "cupboard" },
      { name: "Avocado", amount: "1", category: "fridge" },
      { name: "Eggs", amount: "2", category: "fridge" },
      { name: "Microgreens", amount: "handful", category: "fridge" },
      { name: "Lemon juice", amount: "1 tsp", category: "cupboard" }
    ],
    instructions: [
      "Toast bread until golden",
      "Mash avocado with lemon juice",
      "Poach eggs in simmering water",
      "Spread avocado on toast",
      "Top with eggs and microgreens"
    ],
    nutrition: {
      calories: 420,
      protein: 18,
      carbs: 35,
      fat: 24,
      fiber: 12
    }
  },
  {
    meal_type: "breakfast",
    name: "Greek Yogurt Parfait",
    description: "Layered Greek yogurt with granola, honey, and fresh seasonal fruits",
    imagePrompt: "Elegant glass jar filled with layers of thick Greek yogurt, crunchy granola, golden honey drizzle, and colorful fresh fruits (berries, banana slices). Styled with natural morning light creating beautiful layers and textures.",
    prep_time: 5,
    cook_time: 0,
    servings: 1,
    ingredients: [
      { name: "Greek yogurt", amount: "200g", category: "fridge" },
      { name: "Granola", amount: "50g", category: "cupboard" },
      { name: "Honey", amount: "1 tbsp", category: "cupboard" },
      { name: "Mixed berries", amount: "100g", category: "fridge" },
      { name: "Banana", amount: "1", category: "fridge" }
    ],
    instructions: [
      "Layer yogurt in a glass",
      "Add granola layer",
      "Add fresh fruits",
      "Drizzle with honey",
      "Repeat layers"
    ],
    nutrition: {
      calories: 380,
      protein: 22,
      carbs: 52,
      fat: 10,
      fiber: 6
    }
  },
  {
    meal_type: "breakfast",
    name: "Veggie Scrambled Eggs",
    description: "Fluffy scrambled eggs loaded with colorful vegetables and herbs",
    imagePrompt: "Fluffy golden scrambled eggs mixed with vibrant bell peppers, spinach, tomatoes, and fresh herbs. Served on a white ceramic plate with a garnish of fresh parsley. Soft natural lighting highlighting the colorful vegetables throughout.",
    prep_time: 8,
    cook_time: 7,
    servings: 2,
    ingredients: [
      { name: "Eggs", amount: "4", category: "fridge" },
      { name: "Bell peppers", amount: "1", category: "fridge" },
      { name: "Spinach", amount: "2 cups", category: "fridge" },
      { name: "Cherry tomatoes", amount: "10", category: "fridge" },
      { name: "Herbs", amount: "2 tbsp", category: "fridge" }
    ],
    instructions: [
      "Dice vegetables",
      "Whisk eggs with herbs",
      "Sauté vegetables",
      "Add eggs and scramble",
      "Cook until fluffy"
    ],
    nutrition: {
      calories: 220,
      protein: 16,
      carbs: 8,
      fat: 14,
      fiber: 3
    }
  },
  {
    meal_type: "breakfast",
    name: "Overnight Oats with Chia",
    description: "Creamy overnight oats with chia seeds, almond milk, and fresh toppings",
    imagePrompt: "Mason jar filled with creamy overnight oats topped with fresh berries, sliced almonds, and chia seeds. Served with a vintage spoon beside it. Bright morning light creating an inviting and healthy breakfast scene.",
    prep_time: 10,
    cook_time: 0,
    servings: 1,
    ingredients: [
      { name: "Rolled oats", amount: "50g", category: "cupboard" },
      { name: "Chia seeds", amount: "1 tbsp", category: "cupboard" },
      { name: "Almond milk", amount: "200ml", category: "fridge" },
      { name: "Maple syrup", amount: "1 tbsp", category: "cupboard" },
      { name: "Fresh berries", amount: "100g", category: "fridge" }
    ],
    instructions: [
      "Mix oats, chia, and milk",
      "Add maple syrup",
      "Refrigerate overnight",
      "Top with fresh berries",
      "Add nuts if desired"
    ],
    nutrition: {
      calories: 320,
      protein: 10,
      carbs: 48,
      fat: 10,
      fiber: 12
    }
  },
  {
    meal_type: "breakfast",
    name: "Smoked Salmon Bagel",
    description: "Toasted bagel with cream cheese, smoked salmon, capers, and red onion",
    imagePrompt: "Perfectly toasted bagel spread with cream cheese, layered with premium smoked salmon, thin red onion slices, capers, and fresh dill. Served on a dark slate plate with lemon wedges. Professional food photography with soft natural lighting.",
    prep_time: 5,
    cook_time: 5,
    servings: 1,
    ingredients: [
      { name: "Whole grain bagel", amount: "1", category: "cupboard" },
      { name: "Cream cheese", amount: "2 tbsp", category: "fridge" },
      { name: "Smoked salmon", amount: "100g", category: "fridge" },
      { name: "Red onion", amount: "¼", category: "fridge" },
      { name: "Capers", amount: "1 tbsp", category: "cupboard" }
    ],
    instructions: [
      "Toast bagel halves",
      "Spread cream cheese",
      "Layer smoked salmon",
      "Add onion slices and capers",
      "Garnish with dill"
    ],
    nutrition: {
      calories: 420,
      protein: 28,
      carbs: 48,
      fat: 12,
      fiber: 4
    }
  },
  {
    meal_type: "breakfast",
    name: "Breakfast Burrito Bowl",
    description: "Mexican-inspired bowl with eggs, black beans, avocado, and salsa",
    imagePrompt: "Colorful breakfast bowl featuring scrambled eggs, black beans, diced avocado, fresh salsa, shredded cheese, and cilantro. Served in a white bowl with lime wedges on the side. Vibrant colors and fresh ingredients beautifully arranged.",
    prep_time: 10,
    cook_time: 10,
    servings: 2,
    ingredients: [
      { name: "Eggs", amount: "4", category: "fridge" },
      { name: "Black beans", amount: "1 cup", category: "cupboard" },
      { name: "Avocado", amount: "1", category: "fridge" },
      { name: "Salsa", amount: "½ cup", category: "cupboard" },
      { name: "Cheese", amount: "50g", category: "fridge" }
    ],
    instructions: [
      "Scramble eggs",
      "Warm black beans",
      "Dice avocado",
      "Assemble in bowl",
      "Top with salsa and cheese"
    ],
    nutrition: {
      calories: 380,
      protein: 22,
      carbs: 28,
      fat: 20,
      fiber: 10
    }
  },
  {
    meal_type: "breakfast",
    name: "Banana Almond Smoothie Bowl",
    description: "Thick smoothie bowl topped with granola, fresh fruits, and nut butter",
    imagePrompt: "Vibrant purple-pink smoothie bowl topped artfully with banana slices, fresh berries, granola clusters, chia seeds, and almond butter drizzle. Overhead shot with natural light creating an Instagram-worthy healthy breakfast.",
    prep_time: 10,
    cook_time: 0,
    servings: 1,
    ingredients: [
      { name: "Frozen banana", amount: "2", category: "freezer" },
      { name: "Almond milk", amount: "100ml", category: "fridge" },
      { name: "Almond butter", amount: "1 tbsp", category: "cupboard" },
      { name: "Granola", amount: "30g", category: "cupboard" },
      { name: "Fresh berries", amount: "100g", category: "fridge" }
    ],
    instructions: [
      "Blend frozen banana with milk",
      "Pour into bowl",
      "Arrange toppings artfully",
      "Drizzle almond butter",
      "Serve immediately"
    ],
    nutrition: {
      calories: 420,
      protein: 12,
      carbs: 68,
      fat: 14,
      fiber: 10
    }
  },
  {
    meal_type: "breakfast",
    name: "Sweet Potato Hash with Eggs",
    description: "Crispy sweet potato hash with peppers, onions, and fried eggs on top",
    imagePrompt: "Rustic skillet filled with golden crispy sweet potato cubes, colorful bell peppers, and caramelized onions, topped with two sunny-side up eggs with perfectly runny yolks. Fresh herbs sprinkled on top. Warm morning light.",
    prep_time: 10,
    cook_time: 20,
    servings: 2,
    ingredients: [
      { name: "Sweet potatoes", amount: "2 medium", category: "cupboard" },
      { name: "Bell peppers", amount: "1", category: "fridge" },
      { name: "Onion", amount: "1", category: "cupboard" },
      { name: "Eggs", amount: "2", category: "fridge" },
      { name: "Olive oil", amount: "2 tbsp", category: "cupboard" }
    ],
    instructions: [
      "Dice sweet potatoes small",
      "Sauté with peppers and onions",
      "Cook until crispy",
      "Fry eggs separately",
      "Top hash with eggs"
    ],
    nutrition: {
      calories: 340,
      protein: 14,
      carbs: 42,
      fat: 14,
      fiber: 7
    }
  },
  {
    meal_type: "breakfast",
    name: "Cottage Cheese Power Bowl",
    description: "High-protein cottage cheese bowl with fresh fruits, nuts, and seeds",
    imagePrompt: "White bowl filled with creamy cottage cheese topped with colorful fresh fruits (berries, kiwi, mango), mixed nuts, pumpkin seeds, and a drizzle of honey. Natural light highlighting the texture and colors.",
    prep_time: 5,
    cook_time: 0,
    servings: 1,
    ingredients: [
      { name: "Cottage cheese", amount: "200g", category: "fridge" },
      { name: "Mixed fresh fruits", amount: "150g", category: "fridge" },
      { name: "Mixed nuts", amount: "30g", category: "cupboard" },
      { name: "Pumpkin seeds", amount: "1 tbsp", category: "cupboard" },
      { name: "Honey", amount: "1 tsp", category: "cupboard" }
    ],
    instructions: [
      "Scoop cottage cheese into bowl",
      "Arrange fresh fruits",
      "Sprinkle nuts and seeds",
      "Drizzle with honey",
      "Serve immediately"
    ],
    nutrition: {
      calories: 380,
      protein: 28,
      carbs: 38,
      fat: 14,
      fiber: 6
    }
  },
  {
    meal_type: "breakfast",
    name: "French Toast with Berry Compote",
    description: "Classic French toast topped with warm berry compote and powdered sugar",
    imagePrompt: "Golden-brown French toast slices stacked elegantly, topped with vibrant warm berry compote (strawberries, blueberries, raspberries), dusted with powdered sugar, and garnished with fresh mint. Syrup drizzling down the sides. Warm morning light.",
    prep_time: 10,
    cook_time: 15,
    servings: 2,
    ingredients: [
      { name: "Brioche bread", amount: "4 slices", category: "cupboard" },
      { name: "Eggs", amount: "2", category: "fridge" },
      { name: "Milk", amount: "100ml", category: "fridge" },
      { name: "Mixed berries", amount: "200g", category: "fridge" },
      { name: "Maple syrup", amount: "2 tbsp", category: "cupboard" }
    ],
    instructions: [
      "Whisk eggs with milk",
      "Soak bread slices",
      "Cook until golden brown",
      "Simmer berries with syrup",
      "Top toast with compote"
    ],
    nutrition: {
      calories: 420,
      protein: 14,
      carbs: 58,
      fat: 14,
      fiber: 5
    }
  },
  {
    meal_type: "breakfast",
    name: "Quinoa Breakfast Bowl",
    description: "Warm quinoa bowl with cinnamon, nuts, dried fruits, and coconut milk",
    imagePrompt: "Cozy bowl of fluffy quinoa cooked in coconut milk, topped with sliced almonds, dried cranberries, fresh banana slices, a sprinkle of cinnamon, and coconut flakes. Served in a rustic ceramic bowl with warm natural lighting.",
    prep_time: 5,
    cook_time: 15,
    servings: 2,
    ingredients: [
      { name: "Quinoa", amount: "100g", category: "cupboard" },
      { name: "Coconut milk", amount: "300ml", category: "cupboard" },
      { name: "Mixed nuts", amount: "40g", category: "cupboard" },
      { name: "Dried fruits", amount: "30g", category: "cupboard" },
      { name: "Cinnamon", amount: "1 tsp", category: "cupboard" }
    ],
    instructions: [
      "Cook quinoa in coconut milk",
      "Add cinnamon while cooking",
      "Top with nuts and fruits",
      "Add fresh banana",
      "Drizzle with honey"
    ],
    nutrition: {
      calories: 380,
      protein: 12,
      carbs: 52,
      fat: 14,
      fiber: 7
    }
  },
  {
    meal_type: "breakfast",
    name: "Mushroom & Spinach Omelet",
    description: "Fluffy omelet filled with sautéed mushrooms, spinach, and feta cheese",
    imagePrompt: "Perfect golden omelet folded elegantly on a white plate, filled with sautéed mushrooms, fresh spinach, and crumbled feta cheese. Garnished with fresh herbs and served with cherry tomatoes. Soft morning light highlighting the fluffy texture.",
    prep_time: 8,
    cook_time: 10,
    servings: 1,
    ingredients: [
      { name: "Eggs", amount: "3", category: "fridge" },
      { name: "Mushrooms", amount: "100g", category: "fridge" },
      { name: "Spinach", amount: "2 cups", category: "fridge" },
      { name: "Feta cheese", amount: "50g", category: "fridge" },
      { name: "Butter", amount: "1 tbsp", category: "fridge" }
    ],
    instructions: [
      "Sauté mushrooms and spinach",
      "Whisk eggs with salt",
      "Cook omelet in butter",
      "Add filling when half done",
      "Fold and serve"
    ],
    nutrition: {
      calories: 340,
      protein: 24,
      carbs: 8,
      fat: 24,
      fiber: 3
    }
  },
  {
    meal_type: "breakfast",
    name: "Acai Energy Bowl",
    description: "Antioxidant-rich acai bowl with superfoods and tropical fruits",
    imagePrompt: "Deep purple acai smoothie bowl beautifully decorated with sliced kiwi, mango chunks, coconut flakes, goji berries, and cacao nibs arranged in artistic patterns. Overhead shot with bright natural light creating an energizing tropical breakfast scene.",
    prep_time: 10,
    cook_time: 0,
    servings: 1,
    ingredients: [
      { name: "Acai puree", amount: "100g", category: "freezer" },
      { name: "Banana", amount: "1", category: "fridge" },
      { name: "Tropical fruits", amount: "150g", category: "fridge" },
      { name: "Coconut flakes", amount: "2 tbsp", category: "cupboard" },
      { name: "Goji berries", amount: "1 tbsp", category: "cupboard" }
    ],
    instructions: [
      "Blend acai with banana",
      "Pour into bowl",
      "Arrange tropical fruits",
      "Add superfoods toppings",
      "Serve immediately"
    ],
    nutrition: {
      calories: 320,
      protein: 6,
      carbs: 58,
      fat: 10,
      fiber: 12
    }
  },

  // LUNCH (14 meals)
  {
    meal_type: "lunch",
    name: "Mediterranean Quinoa Salad",
    description: "Fresh quinoa salad with cucumber, tomatoes, feta, olives, and lemon dressing",
    imagePrompt: "Vibrant Mediterranean salad bowl featuring fluffy quinoa mixed with diced cucumbers, cherry tomatoes, red onions, Kalamata olives, and crumbled feta cheese. Dressed with lemon vinaigrette and garnished with fresh herbs. Natural daylight highlighting the colorful ingredients.",
    prep_time: 15,
    cook_time: 15,
    servings: 2,
    ingredients: [
      { name: "Quinoa", amount: "150g", category: "cupboard" },
      { name: "Cucumber", amount: "1", category: "fridge" },
      { name: "Cherry tomatoes", amount: "200g", category: "fridge" },
      { name: "Feta cheese", amount: "100g", category: "fridge" },
      { name: "Kalamata olives", amount: "50g", category: "cupboard" }
    ],
    instructions: [
      "Cook quinoa and cool",
      "Dice all vegetables",
      "Mix ingredients together",
      "Add lemon dressing",
      "Top with feta"
    ],
    nutrition: {
      calories: 420,
      protein: 16,
      carbs: 48,
      fat: 18,
      fiber: 8
    }
  },
  {
    meal_type: "lunch",
    name: "Grilled Chicken Caesar Wrap",
    description: "Whole wheat wrap with grilled chicken, romaine, parmesan, and Caesar dressing",
    imagePrompt: "Perfectly wrapped whole wheat tortilla filled with juicy grilled chicken strips, crisp romaine lettuce, shaved parmesan, and creamy Caesar dressing. Cut in half to show the layered filling. Served on a wooden board with cherry tomatoes on the side.",
    prep_time: 10,
    cook_time: 15,
    servings: 2,
    ingredients: [
      { name: "Chicken breast", amount: "300g", category: "fridge" },
      { name: "Whole wheat wraps", amount: "2", category: "cupboard" },
      { name: "Romaine lettuce", amount: "2 cups", category: "fridge" },
      { name: "Parmesan", amount: "50g", category: "fridge" },
      { name: "Caesar dressing", amount: "4 tbsp", category: "cupboard" }
    ],
    instructions: [
      "Grill chicken until done",
      "Slice chicken strips",
      "Warm wraps slightly",
      "Layer ingredients",
      "Roll and cut in half"
    ],
    nutrition: {
      calories: 480,
      protein: 38,
      carbs: 42,
      fat: 16,
      fiber: 5
    }
  },
  {
    meal_type: "lunch",
    name: "Asian Salmon Poke Bowl",
    description: "Sushi-grade salmon with rice, edamame, avocado, and sesame-ginger dressing",
    imagePrompt: "Beautifully arranged poke bowl with cubed fresh salmon, white rice, edamame beans, sliced avocado, cucumber ribbons, pickled ginger, and sesame seeds. Drizzled with soy-ginger dressing. Overhead shot with chopsticks on the side. Fresh and colorful Asian cuisine presentation.",
    prep_time: 20,
    cook_time: 15,
    servings: 2,
    ingredients: [
      { name: "Fresh salmon", amount: "300g", category: "fridge" },
      { name: "Sushi rice", amount: "200g", category: "cupboard" },
      { name: "Edamame", amount: "100g", category: "freezer" },
      { name: "Avocado", amount: "1", category: "fridge" },
      { name: "Cucumber", amount: "1", category: "fridge" }
    ],
    instructions: [
      "Cook sushi rice",
      "Cube salmon",
      "Prepare all toppings",
      "Arrange in bowl",
      "Drizzle with dressing"
    ],
    nutrition: {
      calories: 520,
      protein: 32,
      carbs: 52,
      fat: 20,
      fiber: 6
    }
  },
  {
    meal_type: "lunch",
    name: "Turkey & Avocado Club Sandwich",
    description: "Triple-decker sandwich with turkey, bacon, avocado, lettuce, and tomato",
    imagePrompt: "Classic club sandwich stacked tall with three layers of toasted bread, sliced turkey breast, crispy bacon, fresh avocado, lettuce, and tomato. Secured with decorative picks and cut diagonally. Served on a white plate with sweet potato fries on the side.",
    prep_time: 10,
    cook_time: 10,
    servings: 2,
    ingredients: [
      { name: "Whole grain bread", amount: "6 slices", category: "cupboard" },
      { name: "Turkey breast", amount: "200g", category: "fridge" },
      { name: "Bacon", amount: "4 strips", category: "fridge" },
      { name: "Avocado", amount: "1", category: "fridge" },
      { name: "Tomato", amount: "1", category: "fridge" }
    ],
    instructions: [
      "Toast bread slices",
      "Cook bacon crispy",
      "Layer turkey and veggies",
      "Add avocado slices",
      "Stack and secure"
    ],
    nutrition: {
      calories: 520,
      protein: 32,
      carbs: 45,
      fat: 22,
      fiber: 10
    }
  },
  {
    meal_type: "lunch",
    name: "Thai Chicken Lettuce Wraps",
    description: "Ground chicken with Thai flavors wrapped in fresh lettuce cups",
    imagePrompt: "Fresh butter lettuce cups filled with flavorful Thai ground chicken, diced vegetables, crushed peanuts, and fresh herbs (cilantro, mint). Served with lime wedges and garnished with shredded carrots. Vibrant colors and fresh presentation.",
    prep_time: 15,
    cook_time: 12,
    servings: 4,
    ingredients: [
      { name: "Ground chicken", amount: "500g", category: "fridge" },
      { name: "Butter lettuce", amount: "1 head", category: "fridge" },
      { name: "Water chestnuts", amount: "100g", category: "cupboard" },
      { name: "Peanuts", amount: "50g", category: "cupboard" },
      { name: "Thai sauce", amount: "100ml", category: "cupboard" }
    ],
    instructions: [
      "Cook ground chicken",
      "Add Thai sauce and veggies",
      "Separate lettuce leaves",
      "Spoon filling into cups",
      "Top with peanuts and herbs"
    ],
    nutrition: {
      calories: 280,
      protein: 28,
      carbs: 14,
      fat: 12,
      fiber: 4
    }
  },
  {
    meal_type: "lunch",
    name: "Caprese Panini",
    description: "Pressed Italian sandwich with mozzarella, tomato, basil, and balsamic glaze",
    imagePrompt: "Golden-pressed panini sandwich with melted mozzarella, fresh tomato slices, and basil leaves visible from the sides. Grill marks perfectly seared on the bread. Cut diagonally and served on parchment paper with balsamic glaze drizzle. Rustic Italian presentation.",
    prep_time: 10,
    cook_time: 8,
    servings: 2,
    ingredients: [
      { name: "Ciabatta bread", amount: "2 rolls", category: "cupboard" },
      { name: "Fresh mozzarella", amount: "200g", category: "fridge" },
      { name: "Tomatoes", amount: "2", category: "fridge" },
      { name: "Fresh basil", amount: "1 bunch", category: "fridge" },
      { name: "Balsamic glaze", amount: "2 tbsp", category: "cupboard" }
    ],
    instructions: [
      "Slice bread and ingredients",
      "Layer mozzarella and tomato",
      "Add basil leaves",
      "Grill in panini press",
      "Drizzle with balsamic"
    ],
    nutrition: {
      calories: 420,
      protein: 22,
      carbs: 48,
      fat: 16,
      fiber: 3
    }
  },
  {
    meal_type: "lunch",
    name: "Mexican Chicken Bowl",
    description: "Rice bowl with seasoned chicken, black beans, corn, salsa, and guacamole",
    imagePrompt: "Colorful Mexican-inspired bowl with cilantro-lime rice, seasoned grilled chicken, black beans, roasted corn, pico de gallo, guacamole, and shredded cheese. Garnished with lime wedge and fresh cilantro. Overhead shot with vibrant colors.",
    prep_time: 15,
    cook_time: 20,
    servings: 2,
    ingredients: [
      { name: "Chicken breast", amount: "300g", category: "fridge" },
      { name: "Rice", amount: "150g", category: "cupboard" },
      { name: "Black beans", amount: "1 cup", category: "cupboard" },
      { name: "Corn", amount: "1 cup", category: "freezer" },
      { name: "Salsa", amount: "100g", category: "cupboard" }
    ],
    instructions: [
      "Cook rice with lime",
      "Season and grill chicken",
      "Warm beans and corn",
      "Assemble all components",
      "Top with salsa and guac"
    ],
    nutrition: {
      calories: 520,
      protein: 38,
      carbs: 62,
      fat: 12,
      fiber: 12
    }
  },
  {
    meal_type: "lunch",
    name: "Greek Chicken Gyro",
    description: "Pita bread filled with chicken, tzatziki, tomatoes, and cucumber",
    imagePrompt: "Warm pita bread stuffed with marinated grilled chicken strips, creamy tzatziki sauce, diced tomatoes, cucumber, red onion, and fresh lettuce. Wrapped in parchment paper with ingredients peeking out. Mediterranean street food style presentation.",
    prep_time: 15,
    cook_time: 15,
    servings: 2,
    ingredients: [
      { name: "Chicken breast", amount: "300g", category: "fridge" },
      { name: "Pita bread", amount: "2", category: "cupboard" },
      { name: "Tzatziki", amount: "100g", category: "fridge" },
      { name: "Cucumber", amount: "1", category: "fridge" },
      { name: "Tomatoes", amount: "2", category: "fridge" }
    ],
    instructions: [
      "Marinate and grill chicken",
      "Warm pita bread",
      "Prepare vegetables",
      "Layer ingredients in pita",
      "Top with tzatziki"
    ],
    nutrition: {
      calories: 480,
      protein: 38,
      carbs: 52,
      fat: 12,
      fiber: 5
    }
  },
  {
    meal_type: "lunch",
    name: "Shrimp Avocado Salad",
    description: "Fresh salad with grilled shrimp, avocado, mixed greens, and citrus dressing",
    imagePrompt: "Elegant salad bowl with perfectly grilled pink shrimp, sliced avocado, mixed greens, cherry tomatoes, and red onion. Drizzled with citrus vinaigrette and garnished with microgreens. Natural light highlighting the fresh ingredients.",
    prep_time: 15,
    cook_time: 8,
    servings: 2,
    ingredients: [
      { name: "Shrimp", amount: "300g", category: "freezer" },
      { name: "Avocado", amount: "2", category: "fridge" },
      { name: "Mixed greens", amount: "4 cups", category: "fridge" },
      { name: "Cherry tomatoes", amount: "150g", category: "fridge" },
      { name: "Citrus dressing", amount: "60ml", category: "cupboard" }
    ],
    instructions: [
      "Season and grill shrimp",
      "Dice avocado",
      "Toss greens with dressing",
      "Arrange shrimp on top",
      "Add tomatoes and avocado"
    ],
    nutrition: {
      calories: 380,
      protein: 32,
      carbs: 18,
      fat: 22,
      fiber: 10
    }
  },
  {
    meal_type: "lunch",
    name: "Italian Pasta Primavera",
    description: "Light pasta with seasonal vegetables, garlic, olive oil, and parmesan",
    imagePrompt: "Colorful pasta primavera in a white bowl featuring penne pasta tossed with bright bell peppers, zucchini, cherry tomatoes, and broccoli florets. Garnished with fresh basil, grated parmesan, and olive oil drizzle. Rustic Italian presentation.",
    prep_time: 15,
    cook_time: 15,
    servings: 3,
    ingredients: [
      { name: "Penne pasta", amount: "300g", category: "cupboard" },
      { name: "Mixed vegetables", amount: "400g", category: "fridge" },
      { name: "Garlic", amount: "4 cloves", category: "cupboard" },
      { name: "Olive oil", amount: "60ml", category: "cupboard" },
      { name: "Parmesan", amount: "50g", category: "fridge" }
    ],
    instructions: [
      "Cook pasta al dente",
      "Sauté vegetables with garlic",
      "Toss pasta with veggies",
      "Add olive oil",
      "Top with parmesan"
    ],
    nutrition: {
      calories: 420,
      protein: 14,
      carbs: 62,
      fat: 14,
      fiber: 8
    }
  },
  {
    meal_type: "lunch",
    name: "BBQ Chicken Salad",
    description: "Mixed greens with BBQ chicken, corn, black beans, and ranch dressing",
    imagePrompt: "Hearty southwestern salad bowl with BBQ-glazed grilled chicken strips, romaine lettuce, roasted corn, black beans, diced tomatoes, shredded cheese, and crispy tortilla strips. Drizzled with creamy ranch dressing. Colorful and appetizing presentation.",
    prep_time: 15,
    cook_time: 15,
    servings: 2,
    ingredients: [
      { name: "Chicken breast", amount: "300g", category: "fridge" },
      { name: "BBQ sauce", amount: "60ml", category: "cupboard" },
      { name: "Mixed greens", amount: "4 cups", category: "fridge" },
      { name: "Corn", amount: "1 cup", category: "freezer" },
      { name: "Black beans", amount: "1 cup", category: "cupboard" }
    ],
    instructions: [
      "Grill chicken with BBQ sauce",
      "Roast corn",
      "Toss greens with beans",
      "Slice chicken on top",
      "Drizzle with ranch"
    ],
    nutrition: {
      calories: 460,
      protein: 38,
      carbs: 48,
      fat: 12,
      fiber: 10
    }
  },
  {
    meal_type: "lunch",
    name: "Tuna Nicoise Salad",
    description: "Classic French salad with tuna, eggs, green beans, potatoes, and olives",
    imagePrompt: "Elegant composed salad featuring seared tuna steak, hard-boiled eggs, blanched green beans, baby potatoes, cherry tomatoes, and Nicoise olives arranged beautifully on a white plate. Drizzled with Dijon vinaigrette. Professional French bistro presentation.",
    prep_time: 20,
    cook_time: 15,
    servings: 2,
    ingredients: [
      { name: "Tuna steak", amount: "300g", category: "fridge" },
      { name: "Eggs", amount: "4", category: "fridge" },
      { name: "Green beans", amount: "200g", category: "fridge" },
      { name: "Baby potatoes", amount: "200g", category: "cupboard" },
      { name: "Olives", amount: "50g", category: "cupboard" }
    ],
    instructions: [
      "Sear tuna to medium-rare",
      "Boil eggs and potatoes",
      "Blanch green beans",
      "Arrange ingredients",
      "Dress with vinaigrette"
    ],
    nutrition: {
      calories: 480,
      protein: 42,
      carbs: 32,
      fat: 20,
      fiber: 6
    }
  },
  {
    meal_type: "lunch",
    name: "Veggie Buddha Bowl",
    description: "Nourishing bowl with roasted vegetables, quinoa, chickpeas, and tahini dressing",
    imagePrompt: "Colorful vegetarian Buddha bowl featuring fluffy quinoa, roasted sweet potato cubes, chickpeas, steamed broccoli, shredded purple cabbage, avocado slices, and microgreens. Drizzled with creamy tahini dressing. Overhead shot with vibrant colors and textures.",
    prep_time: 15,
    cook_time: 25,
    servings: 2,
    ingredients: [
      { name: "Quinoa", amount: "150g", category: "cupboard" },
      { name: "Sweet potato", amount: "1", category: "cupboard" },
      { name: "Chickpeas", amount: "1 cup", category: "cupboard" },
      { name: "Mixed vegetables", amount: "300g", category: "fridge" },
      { name: "Tahini", amount: "60ml", category: "cupboard" }
    ],
    instructions: [
      "Cook quinoa",
      "Roast sweet potato and chickpeas",
      "Steam vegetables",
      "Assemble in bowl",
      "Drizzle tahini dressing"
    ],
    nutrition: {
      calories: 480,
      protein: 18,
      carbs: 68,
      fat: 16,
      fiber: 14
    }
  },
  {
    meal_type: "lunch",
    name: "Chicken Burrito Bowl",
    description: "Deconstructed burrito with chicken, rice, beans, and all the toppings",
    imagePrompt: "Generous burrito bowl with cilantro-lime rice, seasoned grilled chicken, black beans, roasted corn, pico de gallo, sour cream, guacamole, shredded cheese, and lime wedge. All ingredients visible in separate sections. Fresh and colorful Mexican-inspired presentation.",
    prep_time: 20,
    cook_time: 20,
    servings: 2,
    ingredients: [
      { name: "Chicken breast", amount: "300g", category: "fridge" },
      { name: "Rice", amount: "150g", category: "cupboard" },
      { name: "Black beans", amount: "1 cup", category: "cupboard" },
      { name: "Corn", amount: "1 cup", category: "freezer" },
      { name: "Toppings mix", amount: "200g", category: "fridge" }
    ],
    instructions: [
      "Cook rice with lime and cilantro",
      "Season and grill chicken",
      "Warm beans and roast corn",
      "Prepare all toppings",
      "Assemble in bowl"
    ],
    nutrition: {
      calories: 560,
      protein: 40,
      carbs: 65,
      fat: 16,
      fiber: 12
    }
  },

  // SNACKS (14 meals)
  {
    meal_type: "snack",
    name: "Energy Protein Balls",
    description: "No-bake protein balls with dates, nuts, and dark chocolate chips",
    imagePrompt: "Round energy balls coated in shredded coconut, arranged on a white marble surface. Cut one ball in half to show the inside texture with visible nuts and chocolate chips. Natural lighting creating an appealing healthy snack scene.",
    prep_time: 10,
    cook_time: 0,
    servings: 12,
    ingredients: [
      { name: "Dates", amount: "200g", category: "cupboard" },
      { name: "Almonds", amount: "100g", category: "cupboard" },
      { name: "Protein powder", amount: "30g", category: "cupboard" },
      { name: "Dark chocolate chips", amount: "50g", category: "cupboard" },
      { name: "Coconut flakes", amount: "30g", category: "cupboard" }
    ],
    instructions: [
      "Blend dates and nuts",
      "Mix in protein powder",
      "Add chocolate chips",
      "Roll into balls",
      "Coat with coconut"
    ],
    nutrition: {
      calories: 120,
      protein: 4,
      carbs: 18,
      fat: 4,
      fiber: 3
    }
  },
  {
    meal_type: "snack",
    name: "Hummus & Veggie Sticks",
    description: "Creamy homemade hummus with colorful fresh vegetable sticks",
    imagePrompt: "Bowl of creamy hummus drizzled with olive oil and sprinkled with paprika, surrounded by colorful vegetable sticks (carrots, celery, bell peppers, cucumber) arranged in a circle. Served on a wooden board with pita bread triangles on the side.",
    prep_time: 10,
    cook_time: 0,
    servings: 4,
    ingredients: [
      { name: "Chickpeas", amount: "400g", category: "cupboard" },
      { name: "Tahini", amount: "60ml", category: "cupboard" },
      { name: "Carrots", amount: "2", category: "fridge" },
      { name: "Celery", amount: "3 stalks", category: "fridge" },
      { name: "Bell peppers", amount: "2", category: "fridge" }
    ],
    instructions: [
      "Blend chickpeas with tahini",
      "Add lemon and garlic",
      "Cut vegetables into sticks",
      "Arrange around hummus",
      "Drizzle olive oil on top"
    ],
    nutrition: {
      calories: 180,
      protein: 8,
      carbs: 24,
      fat: 6,
      fiber: 7
    }
  },
  {
    meal_type: "snack",
    name: "Apple Slices with Almond Butter",
    description: "Crisp apple slices drizzled with natural almond butter and cinnamon",
    imagePrompt: "Fresh apple slices arranged in a fan pattern on a white plate, drizzled with creamy almond butter and sprinkled with cinnamon. Garnished with sliced almonds. Clean and simple healthy snack presentation with natural light.",
    prep_time: 5,
    cook_time: 0,
    servings: 1,
    ingredients: [
      { name: "Apple", amount: "1", category: "fridge" },
      { name: "Almond butter", amount: "2 tbsp", category: "cupboard" },
      { name: "Cinnamon", amount: "1 tsp", category: "cupboard" },
      { name: "Sliced almonds", amount: "1 tbsp", category: "cupboard" },
      { name: "Honey", amount: "1 tsp", category: "cupboard" }
    ],
    instructions: [
      "Slice apple thinly",
      "Arrange on plate",
      "Drizzle almond butter",
      "Sprinkle cinnamon",
      "Add almonds and honey"
    ],
    nutrition: {
      calories: 220,
      protein: 6,
      carbs: 28,
      fat: 10,
      fiber: 6
    }
  },
  {
    meal_type: "snack",
    name: "Greek Yogurt Bark",
    description: "Frozen Greek yogurt bark with berries, granola, and honey",
    imagePrompt: "Broken pieces of frozen yogurt bark showing layers of thick Greek yogurt topped with colorful berries, granola clusters, and honey drizzle. Arranged on parchment paper with scattered berries around. Cool and refreshing snack presentation.",
    prep_time: 10,
    cook_time: 0,
    servings: 6,
    ingredients: [
      { name: "Greek yogurt", amount: "400g", category: "fridge" },
      { name: "Mixed berries", amount: "200g", category: "fridge" },
      { name: "Granola", amount: "100g", category: "cupboard" },
      { name: "Honey", amount: "2 tbsp", category: "cupboard" },
      { name: "Vanilla extract", amount: "1 tsp", category: "cupboard" }
    ],
    instructions: [
      "Mix yogurt with vanilla and honey",
      "Spread on baking sheet",
      "Top with berries and granola",
      "Freeze for 3 hours",
      "Break into pieces"
    ],
    nutrition: {
      calories: 140,
      protein: 8,
      carbs: 22,
      fat: 3,
      fiber: 2
    }
  },
  {
    meal_type: "snack",
    name: "Trail Mix",
    description: "Custom blend of nuts, seeds, dried fruits, and dark chocolate",
    imagePrompt: "Rustic bowl filled with colorful trail mix featuring almonds, cashews, pumpkin seeds, dried cranberries, raisins, and dark chocolate chips. Scattered on a wooden surface with a small wooden scoop. Natural lighting highlighting the variety.",
    prep_time: 5,
    cook_time: 0,
    servings: 8,
    ingredients: [
      { name: "Mixed nuts", amount: "200g", category: "cupboard" },
      { name: "Pumpkin seeds", amount: "50g", category: "cupboard" },
      { name: "Dried cranberries", amount: "100g", category: "cupboard" },
      { name: "Raisins", amount: "50g", category: "cupboard" },
      { name: "Dark chocolate chips", amount: "50g", category: "cupboard" }
    ],
    instructions: [
      "Mix all ingredients",
      "Store in airtight container",
      "Portion into servings",
      "Perfect grab-and-go",
      "Keeps for 2 weeks"
    ],
    nutrition: {
      calories: 180,
      protein: 5,
      carbs: 18,
      fat: 10,
      fiber: 3
    }
  },
  {
    meal_type: "snack",
    name: "Avocado Toast Bites",
    description: "Mini avocado toasts with cherry tomatoes and microgreens",
    imagePrompt: "Small square pieces of toasted whole grain bread topped with mashed avocado, halved cherry tomatoes, and microgreens. Arranged on a slate board, drizzled with balsamic glaze. Elegant bite-sized appetizer presentation.",
    prep_time: 10,
    cook_time: 5,
    servings: 4,
    ingredients: [
      { name: "Whole grain bread", amount: "4 slices", category: "cupboard" },
      { name: "Avocado", amount: "2", category: "fridge" },
      { name: "Cherry tomatoes", amount: "12", category: "fridge" },
      { name: "Microgreens", amount: "1 cup", category: "fridge" },
      { name: "Lemon juice", amount: "1 tbsp", category: "cupboard" }
    ],
    instructions: [
      "Toast bread and cut into squares",
      "Mash avocado with lemon",
      "Spread on bread squares",
      "Top with tomato halves",
      "Garnish with microgreens"
    ],
    nutrition: {
      calories: 180,
      protein: 5,
      carbs: 22,
      fat: 9,
      fiber: 7
    }
  },
  {
    meal_type: "snack",
    name: "Cucumber Cream Cheese Rolls",
    description: "Fresh cucumber rolls filled with herb cream cheese and smoked salmon",
    imagePrompt: "Thinly sliced cucumber ribbons rolled with cream cheese and smoked salmon filling, secured with toothpicks. Arranged on a white plate, garnished with fresh dill and lemon wedges. Elegant and refreshing appetizer presentation.",
    prep_time: 15,
    cook_time: 0,
    servings: 6,
    ingredients: [
      { name: "Cucumber", amount: "2 large", category: "fridge" },
      { name: "Cream cheese", amount: "150g", category: "fridge" },
      { name: "Smoked salmon", amount: "100g", category: "fridge" },
      { name: "Fresh dill", amount: "2 tbsp", category: "fridge" },
      { name: "Lemon juice", amount: "1 tbsp", category: "cupboard" }
    ],
    instructions: [
      "Slice cucumber into ribbons",
      "Mix cream cheese with herbs",
      "Spread on cucumber slices",
      "Add salmon pieces",
      "Roll and secure"
    ],
    nutrition: {
      calories: 120,
      protein: 7,
      carbs: 4,
      fat: 9,
      fiber: 1
    }
  },
  {
    meal_type: "snack",
    name: "Roasted Chickpeas",
    description: "Crunchy roasted chickpeas seasoned with spices",
    imagePrompt: "Golden crispy roasted chickpeas in a small ceramic bowl, seasoned with paprika and herbs. Some chickpeas scattered around the bowl on a dark surface. Close-up shot highlighting the crunchy texture and seasoning.",
    prep_time: 5,
    cook_time: 30,
    servings: 4,
    ingredients: [
      { name: "Chickpeas", amount: "400g", category: "cupboard" },
      { name: "Olive oil", amount: "2 tbsp", category: "cupboard" },
      { name: "Paprika", amount: "1 tsp", category: "cupboard" },
      { name: "Garlic powder", amount: "1 tsp", category: "cupboard" },
      { name: "Sea salt", amount: "½ tsp", category: "cupboard" }
    ],
    instructions: [
      "Drain and dry chickpeas",
      "Toss with oil and spices",
      "Roast at 200°C for 30 min",
      "Shake pan occasionally",
      "Cool before serving"
    ],
    nutrition: {
      calories: 160,
      protein: 8,
      carbs: 22,
      fat: 4,
      fiber: 7
    }
  },
  {
    meal_type: "snack",
    name: "Banana Oat Cookies",
    description: "Healthy 3-ingredient cookies with banana, oats, and chocolate chips",
    imagePrompt: "Stack of rustic oat cookies with visible banana pieces and chocolate chips. Served on a white plate with a glass of almond milk in the background. Warm and cozy healthy dessert presentation.",
    prep_time: 10,
    cook_time: 15,
    servings: 12,
    ingredients: [
      { name: "Ripe bananas", amount: "3", category: "fridge" },
      { name: "Rolled oats", amount: "200g", category: "cupboard" },
      { name: "Dark chocolate chips", amount: "50g", category: "cupboard" },
      { name: "Cinnamon", amount: "1 tsp", category: "cupboard" },
      { name: "Vanilla extract", amount: "1 tsp", category: "cupboard" }
    ],
    instructions: [
      "Mash bananas",
      "Mix with oats and cinnamon",
      "Fold in chocolate chips",
      "Drop spoonfuls on baking sheet",
      "Bake at 180°C for 15 min"
    ],
    nutrition: {
      calories: 100,
      protein: 3,
      carbs: 18,
      fat: 2,
      fiber: 3
    }
  },
  {
    meal_type: "snack",
    name: "Caprese Skewers",
    description: "Cherry tomatoes, mozzarella balls, and basil on skewers",
    imagePrompt: "Colorful appetizer skewers alternating cherry tomatoes, fresh mozzarella balls, and basil leaves. Arranged on a white platter, drizzled with balsamic glaze and olive oil. Elegant Italian-inspired presentation.",
    prep_time: 10,
    cook_time: 0,
    servings: 6,
    ingredients: [
      { name: "Cherry tomatoes", amount: "250g", category: "fridge" },
      { name: "Mozzarella balls", amount: "200g", category: "fridge" },
      { name: "Fresh basil", amount: "1 bunch", category: "fridge" },
      { name: "Balsamic glaze", amount: "2 tbsp", category: "cupboard" },
      { name: "Olive oil", amount: "1 tbsp", category: "cupboard" }
    ],
    instructions: [
      "Thread items on skewers",
      "Alternate tomato, mozzarella, basil",
      "Arrange on platter",
      "Drizzle with balsamic",
      "Add olive oil"
    ],
    nutrition: {
      calories: 120,
      protein: 8,
      carbs: 6,
      fat: 8,
      fiber: 1
    }
  },
  {
    meal_type: "snack",
    name: "Chocolate Protein Shake",
    description: "Creamy chocolate shake with protein powder and banana",
    imagePrompt: "Tall glass filled with thick chocolate protein shake topped with whipped cream and cocoa powder. Garnished with banana slices on the rim. Served with a striped straw. Indulgent yet healthy milkshake presentation.",
    prep_time: 5,
    cook_time: 0,
    servings: 1,
    ingredients: [
      { name: "Protein powder", amount: "30g", category: "cupboard" },
      { name: "Banana", amount: "1", category: "fridge" },
      { name: "Almond milk", amount: "300ml", category: "fridge" },
      { name: "Cocoa powder", amount: "1 tbsp", category: "cupboard" },
      { name: "Ice cubes", amount: "5", category: "freezer" }
    ],
    instructions: [
      "Blend all ingredients",
      "Add ice for thickness",
      "Blend until smooth",
      "Pour into glass",
      "Top with cocoa powder"
    ],
    nutrition: {
      calories: 280,
      protein: 28,
      carbs: 32,
      fat: 4,
      fiber: 5
    }
  },
  {
    meal_type: "snack",
    name: "Rice Cake with Toppings",
    description: "Brown rice cakes with various healthy toppings",
    imagePrompt: "Three brown rice cakes each topped differently: one with peanut butter and banana slices, one with avocado and tomato, one with cream cheese and berries. Arranged on a wooden board. Colorful and creative snack presentation.",
    prep_time: 5,
    cook_time: 0,
    servings: 3,
    ingredients: [
      { name: "Brown rice cakes", amount: "3", category: "cupboard" },
      { name: "Peanut butter", amount: "2 tbsp", category: "cupboard" },
      { name: "Banana", amount: "1", category: "fridge" },
      { name: "Avocado", amount: "½", category: "fridge" },
      { name: "Berries", amount: "50g", category: "fridge" }
    ],
    instructions: [
      "Prepare three rice cakes",
      "Top first with peanut butter and banana",
      "Top second with mashed avocado",
      "Top third with cream cheese and berries",
      "Serve immediately"
    ],
    nutrition: {
      calories: 150,
      protein: 5,
      carbs: 22,
      fat: 5,
      fiber: 4
    }
  },
  {
    meal_type: "snack",
    name: "Edamame with Sea Salt",
    description: "Steamed edamame pods sprinkled with coarse sea salt",
    imagePrompt: "Bright green steamed edamame pods in a rustic ceramic bowl, sprinkled with coarse sea salt. Some pods opened showing the beans inside. Served on a bamboo mat with chopsticks. Clean Japanese-inspired presentation.",
    prep_time: 2,
    cook_time: 5,
    servings: 2,
    ingredients: [
      { name: "Frozen edamame", amount: "300g", category: "freezer" },
      { name: "Sea salt", amount: "1 tsp", category: "cupboard" },
      { name: "Water", amount: "2 cups", category: "tap" },
      { name: "Sesame oil", amount: "½ tsp", category: "cupboard" }
    ],
    instructions: [
      "Boil water",
      "Add edamame pods",
      "Cook for 5 minutes",
      "Drain and toss with salt",
      "Drizzle sesame oil"
    ],
    nutrition: {
      calories: 120,
      protein: 11,
      carbs: 10,
      fat: 5,
      fiber: 5
    }
  },
  {
    meal_type: "snack",
    name: "Dark Chocolate Almond Clusters",
    description: "Homemade chocolate clusters with almonds and sea salt",
    imagePrompt: "Artisanal dark chocolate clusters studded with whole almonds and sprinkled with flaky sea salt. Arranged on parchment paper with cocoa powder dusted around. Gourmet healthy dessert presentation.",
    prep_time: 10,
    cook_time: 5,
    servings: 8,
    ingredients: [
      { name: "Dark chocolate", amount: "200g", category: "cupboard" },
      { name: "Whole almonds", amount: "150g", category: "cupboard" },
      { name: "Sea salt flakes", amount: "½ tsp", category: "cupboard" },
      { name: "Vanilla extract", amount: "½ tsp", category: "cupboard" }
    ],
    instructions: [
      "Melt chocolate gently",
      "Stir in vanilla",
      "Mix in almonds",
      "Drop clusters on parchment",
      "Sprinkle salt and refrigerate"
    ],
    nutrition: {
      calories: 180,
      protein: 4,
      carbs: 14,
      fat: 12,
      fiber: 3
    }
  },

  // DINNER (14 meals)
  {
    meal_type: "dinner",
    name: "Grilled Salmon with Asparagus",
    description: "Perfectly grilled salmon fillet with roasted asparagus and lemon butter",
    imagePrompt: "Beautifully plated grilled salmon fillet with crispy skin, served alongside roasted asparagus spears. Drizzled with lemon butter sauce and garnished with fresh herbs and lemon wedges. Restaurant-quality presentation on a white plate.",
    prep_time: 10,
    cook_time: 20,
    servings: 2,
    ingredients: [
      { name: "Salmon fillets", amount: "2 (200g each)", category: "fridge" },
      { name: "Asparagus", amount: "300g", category: "fridge" },
      { name: "Butter", amount: "50g", category: "fridge" },
      { name: "Lemon", amount: "1", category: "fridge" },
      { name: "Garlic", amount: "2 cloves", category: "cupboard" }
    ],
    instructions: [
      "Season salmon with salt and pepper",
      "Grill salmon skin-side down",
      "Roast asparagus with olive oil",
      "Make lemon butter sauce",
      "Plate and garnish"
    ],
    nutrition: {
      calories: 480,
      protein: 42,
      carbs: 12,
      fat: 28,
      fiber: 5
    }
  },
  {
    meal_type: "dinner",
    name: "Chicken Stir-Fry",
    description: "Asian-style chicken and vegetable stir-fry with brown rice",
    imagePrompt: "Colorful wok-tossed stir-fry with tender chicken pieces, vibrant bell peppers, broccoli, snap peas, and carrots in glossy sauce. Served over fluffy brown rice, garnished with sesame seeds and green onions. Asian cuisine presentation.",
    prep_time: 15,
    cook_time: 15,
    servings: 3,
    ingredients: [
      { name: "Chicken breast", amount: "500g", category: "fridge" },
      { name: "Mixed vegetables", amount: "400g", category: "fridge" },
      { name: "Brown rice", amount: "200g", category: "cupboard" },
      { name: "Soy sauce", amount: "60ml", category: "cupboard" },
      { name: "Ginger", amount: "2 tbsp", category: "fridge" }
    ],
    instructions: [
      "Cook brown rice",
      "Cut chicken into strips",
      "Stir-fry chicken first",
      "Add vegetables and sauce",
      "Serve over rice"
    ],
    nutrition: {
      calories: 480,
      protein: 38,
      carbs: 52,
      fat: 10,
      fiber: 6
    }
  },
  {
    meal_type: "dinner",
    name: "Spaghetti Bolognese",
    description: "Classic Italian pasta with rich meat sauce and parmesan",
    imagePrompt: "Hearty spaghetti bolognese twirled in a white bowl, topped with rich meat sauce, freshly grated parmesan, and basil leaves. Rustic Italian presentation with crusty bread on the side. Warm and inviting comfort food scene.",
    prep_time: 15,
    cook_time: 45,
    servings: 4,
    ingredients: [
      { name: "Ground beef", amount: "500g", category: "fridge" },
      { name: "Spaghetti", amount: "400g", category: "cupboard" },
      { name: "Tomato sauce", amount: "800g", category: "cupboard" },
      { name: "Onion", amount: "1", category: "cupboard" },
      { name: "Parmesan", amount: "100g", category: "fridge" }
    ],
    instructions: [
      "Brown ground beef with onions",
      "Add tomato sauce and simmer",
      "Cook spaghetti al dente",
      "Combine pasta with sauce",
      "Top with parmesan"
    ],
    nutrition: {
      calories: 580,
      protein: 32,
      carbs: 72,
      fat: 16,
      fiber: 6
    }
  },
  {
    meal_type: "dinner",
    name: "Vegetable Curry with Rice",
    description: "Creamy coconut curry loaded with vegetables served over basmati rice",
    imagePrompt: "Aromatic vegetable curry in a traditional bowl featuring chunks of potato, cauliflower, chickpeas, and spinach in golden curry sauce. Served alongside fluffy basmati rice and garnished with cilantro. Indian cuisine presentation.",
    prep_time: 15,
    cook_time: 30,
    servings: 4,
    ingredients: [
      { name: "Mixed vegetables", amount: "600g", category: "fridge" },
      { name: "Coconut milk", amount: "400ml", category: "cupboard" },
      { name: "Curry paste", amount: "3 tbsp", category: "cupboard" },
      { name: "Basmati rice", amount: "300g", category: "cupboard" },
      { name: "Chickpeas", amount: "400g", category: "cupboard" }
    ],
    instructions: [
      "Cook basmati rice",
      "Sauté curry paste",
      "Add vegetables and coconut milk",
      "Simmer until vegetables tender",
      "Serve with rice"
    ],
    nutrition: {
      calories: 420,
      protein: 12,
      carbs: 62,
      fat: 14,
      fiber: 10
    }
  },
  {
    meal_type: "dinner",
    name: "Beef Tacos",
    description: "Seasoned ground beef tacos with fresh toppings and guacamole",
    imagePrompt: "Three soft corn tortilla tacos filled with seasoned ground beef, shredded lettuce, diced tomatoes, cheese, and sour cream. Served on a colorful plate with guacamole and lime wedges. Mexican street food presentation.",
    prep_time: 15,
    cook_time: 15,
    servings: 3,
    ingredients: [
      { name: "Ground beef", amount: "500g", category: "fridge" },
      { name: "Taco shells", amount: "9", category: "cupboard" },
      { name: "Lettuce", amount: "2 cups", category: "fridge" },
      { name: "Tomatoes", amount: "2", category: "fridge" },
      { name: "Cheese", amount: "150g", category: "fridge" }
    ],
    instructions: [
      "Brown ground beef with taco seasoning",
      "Warm taco shells",
      "Prepare toppings",
      "Assemble tacos",
      "Serve with guacamole"
    ],
    nutrition: {
      calories: 520,
      protein: 32,
      carbs: 42,
      fat: 24,
      fiber: 6
    }
  },
  {
    meal_type: "dinner",
    name: "Lemon Herb Chicken with Quinoa",
    description: "Roasted chicken breast with herbs, served with quinoa pilaf",
    imagePrompt: "Juicy herb-crusted chicken breast sliced to show the moist interior, served with fluffy quinoa pilaf mixed with herbs and vegetables. Garnished with fresh lemon slices and thyme. Healthy and elegant dinner presentation.",
    prep_time: 15,
    cook_time: 30,
    servings: 3,
    ingredients: [
      { name: "Chicken breast", amount: "600g", category: "fridge" },
      { name: "Quinoa", amount: "200g", category: "cupboard" },
      { name: "Lemon", amount: "2", category: "fridge" },
      { name: "Fresh herbs", amount: "1 bunch", category: "fridge" },
      { name: "Garlic", amount: "4 cloves", category: "cupboard" }
    ],
    instructions: [
      "Marinate chicken with herbs and lemon",
      "Roast chicken in oven",
      "Cook quinoa with vegetables",
      "Slice chicken",
      "Serve together"
    ],
    nutrition: {
      calories: 460,
      protein: 42,
      carbs: 42,
      fat: 12,
      fiber: 6
    }
  },
  {
    meal_type: "dinner",
    name: "Shrimp Scampi Pasta",
    description: "Garlicky shrimp in white wine sauce over linguine",
    imagePrompt: "Elegant plate of linguine tossed with plump pink shrimp in garlic butter sauce, garnished with fresh parsley and lemon wedges. Restaurant-style Italian seafood pasta presentation.",
    prep_time: 10,
    cook_time: 15,
    servings: 3,
    ingredients: [
      { name: "Shrimp", amount: "500g", category: "freezer" },
      { name: "Linguine", amount: "300g", category: "cupboard" },
      { name: "Garlic", amount: "6 cloves", category: "cupboard" },
      { name: "White wine", amount: "100ml", category: "cupboard" },
      { name: "Butter", amount: "50g", category: "fridge" }
    ],
    instructions: [
      "Cook linguine al dente",
      "Sauté garlic in butter",
      "Add shrimp and wine",
      "Toss with pasta",
      "Garnish with parsley"
    ],
    nutrition: {
      calories: 480,
      protein: 32,
      carbs: 58,
      fat: 12,
      fiber: 3
    }
  },
  {
    meal_type: "dinner",
    name: "Stuffed Bell Peppers",
    description: "Colorful peppers stuffed with ground turkey, rice, and vegetables",
    imagePrompt: "Colorful bell peppers (red, yellow, orange) stuffed with seasoned ground turkey and rice mixture, topped with melted cheese. Arranged on a baking dish, garnished with fresh herbs. Rustic home-cooked dinner presentation.",
    prep_time: 20,
    cook_time: 40,
    servings: 4,
    ingredients: [
      { name: "Bell peppers", amount: "4 large", category: "fridge" },
      { name: "Ground turkey", amount: "500g", category: "fridge" },
      { name: "Rice", amount: "150g", category: "cupboard" },
      { name: "Tomato sauce", amount: "400g", category: "cupboard" },
      { name: "Cheese", amount: "150g", category: "fridge" }
    ],
    instructions: [
      "Cut tops off peppers",
      "Cook rice and brown turkey",
      "Mix with sauce and vegetables",
      "Stuff peppers",
      "Bake until tender"
    ],
    nutrition: {
      calories: 420,
      protein: 32,
      carbs: 42,
      fat: 14,
      fiber: 6
    }
  },
  {
    meal_type: "dinner",
    name: "Teriyaki Salmon Bowl",
    description: "Glazed teriyaki salmon over rice with steamed vegetables",
    imagePrompt: "Glossy teriyaki-glazed salmon fillet served over white rice with steamed broccoli, carrots, and edamame. Garnished with sesame seeds and green onions. Japanese-inspired healthy dinner bowl.",
    prep_time: 10,
    cook_time: 20,
    servings: 2,
    ingredients: [
      { name: "Salmon fillets", amount: "2 (200g each)", category: "fridge" },
      { name: "Teriyaki sauce", amount: "100ml", category: "cupboard" },
      { name: "Rice", amount: "200g", category: "cupboard" },
      { name: "Broccoli", amount: "300g", category: "fridge" },
      { name: "Sesame seeds", amount: "1 tbsp", category: "cupboard" }
    ],
    instructions: [
      "Marinate salmon in teriyaki",
      "Cook rice",
      "Grill salmon",
      "Steam vegetables",
      "Assemble bowl"
    ],
    nutrition: {
      calories: 520,
      protein: 42,
      carbs: 58,
      fat: 14,
      fiber: 5
    }
  },
  {
    meal_type: "dinner",
    name: "Chicken Fajitas",
    description: "Sizzling chicken fajitas with peppers, onions, and warm tortillas",
    imagePrompt: "Sizzling cast iron skillet filled with colorful chicken fajitas - strips of seasoned chicken, bell peppers, and onions. Served with warm flour tortillas and sides of sour cream, guacamole, and salsa. Mexican restaurant presentation.",
    prep_time: 15,
    cook_time: 15,
    servings: 4,
    ingredients: [
      { name: "Chicken breast", amount: "600g", category: "fridge" },
      { name: "Bell peppers", amount: "3", category: "fridge" },
      { name: "Onions", amount: "2", category: "cupboard" },
      { name: "Flour tortillas", amount: "8", category: "cupboard" },
      { name: "Fajita seasoning", amount: "3 tbsp", category: "cupboard" }
    ],
    instructions: [
      "Slice chicken and vegetables",
      "Season with fajita mix",
      "Sauté until cooked",
      "Warm tortillas",
      "Serve with toppings"
    ],
    nutrition: {
      calories: 420,
      protein: 32,
      carbs: 48,
      fat: 10,
      fiber: 5
    }
  },
  {
    meal_type: "dinner",
    name: "Baked Cod with Vegetables",
    description: "Flaky baked cod with roasted Mediterranean vegetables",
    imagePrompt: "Perfectly baked white cod fillet on a bed of colorful roasted vegetables (zucchini, tomatoes, bell peppers, red onion) drizzled with olive oil and herbs. Garnished with lemon wedges. Healthy Mediterranean dinner presentation.",
    prep_time: 15,
    cook_time: 25,
    servings: 2,
    ingredients: [
      { name: "Cod fillets", amount: "2 (200g each)", category: "fridge" },
      { name: "Zucchini", amount: "2", category: "fridge" },
      { name: "Cherry tomatoes", amount: "200g", category: "fridge" },
      { name: "Bell peppers", amount: "2", category: "fridge" },
      { name: "Olive oil", amount: "3 tbsp", category: "cupboard" }
    ],
    instructions: [
      "Chop vegetables",
      "Roast vegetables first",
      "Season cod with herbs",
      "Add cod to vegetables",
      "Bake until flaky"
    ],
    nutrition: {
      calories: 340,
      protein: 38,
      carbs: 18,
      fat: 12,
      fiber: 5
    }
  },
  {
    meal_type: "dinner",
    name: "Beef and Broccoli",
    description: "Chinese-style beef and broccoli in savory sauce over rice",
    imagePrompt: "Tender beef strips and bright green broccoli florets coated in glossy brown sauce. Served over steamed white rice in a white bowl. Garnished with sesame seeds. Classic Chinese takeout-style presentation.",
    prep_time: 15,
    cook_time: 15,
    servings: 3,
    ingredients: [
      { name: "Beef sirloin", amount: "500g", category: "fridge" },
      { name: "Broccoli", amount: "400g", category: "fridge" },
      { name: "Soy sauce", amount: "60ml", category: "cupboard" },
      { name: "Rice", amount: "200g", category: "cupboard" },
      { name: "Ginger", amount: "2 tbsp", category: "fridge" }
    ],
    instructions: [
      "Slice beef thinly",
      "Stir-fry beef",
      "Add broccoli",
      "Add sauce and simmer",
      "Serve over rice"
    ],
    nutrition: {
      calories: 480,
      protein: 38,
      carbs: 48,
      fat: 14,
      fiber: 5
    }
  },
  {
    meal_type: "dinner",
    name: "Chicken Parmesan",
    description: "Breaded chicken breast with marinara sauce and melted mozzarella",
    imagePrompt: "Golden breaded chicken cutlet topped with marinara sauce and melted mozzarella cheese, served over spaghetti. Garnished with fresh basil leaves. Classic Italian-American comfort food presentation.",
    prep_time: 20,
    cook_time: 30,
    servings: 3,
    ingredients: [
      { name: "Chicken breast", amount: "3", category: "fridge" },
      { name: "Breadcrumbs", amount: "150g", category: "cupboard" },
      { name: "Marinara sauce", amount: "500g", category: "cupboard" },
      { name: "Mozzarella", amount: "200g", category: "fridge" },
      { name: "Spaghetti", amount: "300g", category: "cupboard" }
    ],
    instructions: [
      "Bread chicken cutlets",
      "Fry until golden",
      "Top with sauce and cheese",
      "Bake until melted",
      "Serve over pasta"
    ],
    nutrition: {
      calories: 620,
      protein: 48,
      carbs: 62,
      fat: 18,
      fiber: 5
    }
  },
  {
    meal_type: "dinner",
    name: "Moroccan Chicken Tagine",
    description: "Aromatic chicken stew with apricots, almonds, and couscous",
    imagePrompt: "Traditional Moroccan tagine dish with tender chicken pieces, dried apricots, chickpeas, and almonds in golden spiced sauce. Served in a decorative tagine pot with fluffy couscous on the side. Exotic North African presentation.",
    prep_time: 20,
    cook_time: 45,
    servings: 4,
    ingredients: [
      { name: "Chicken thighs", amount: "800g", category: "fridge" },
      { name: "Dried apricots", amount: "150g", category: "cupboard" },
      { name: "Chickpeas", amount: "400g", category: "cupboard" },
      { name: "Couscous", amount: "300g", category: "cupboard" },
      { name: "Moroccan spices", amount: "3 tbsp", category: "cupboard" }
    ],
    instructions: [
      "Brown chicken pieces",
      "Add spices and liquid",
      "Add apricots and chickpeas",
      "Simmer until tender",
      "Serve with couscous"
    ],
    nutrition: {
      calories: 520,
      protein: 38,
      carbs: 58,
      fat: 14,
      fiber: 8
    }
  }
];

export async function POST() {
  try {
    console.log("[SEED] Starting meals library seeding...");
    
    // Process meals in batches of 25 (DynamoDB BatchWrite limit)
    const batchSize = 25;
    let processedCount = 0;
    
    for (let i = 0; i < meals.length; i += batchSize) {
      const batch = meals.slice(i, i + batchSize);
      
      const putRequests = batch.map((meal) => ({
        PutRequest: {
          Item: {
            meal_id: uuidv4(),
            ...meal,
            source: "pdf",
            created_at: Date.now(),
            imageUrl: "", // Will be populated by image generation API
          },
        },
      }));

      const command = new BatchWriteCommand({
        RequestItems: {
          meals_library: putRequests,
        },
      });

      await docClient.send(command);
      processedCount += batch.length;
      console.log(`[SEED] Processed ${processedCount}/${meals.length} meals`);
    }

    return NextResponse.json({
      status: "success",
      message: `Successfully seeded ${meals.length} meals to meals_library table`,
      total: meals.length,
    });
  } catch (error) {
    console.error("[SEED] Error:", error);
    return NextResponse.json(
      {
        status: "error",
        message: error instanceof Error ? error.message : "Failed to seed meals",
      },
      { status: 500 }
    );
  }
}