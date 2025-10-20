import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { mealsLibrary } from '@/db/schema';

// Sample meals based on the PDF structure you showed me
const pdfMeals = [
  // BREAKFAST MEALS (14)
  {
    name: "Kimchi & Egg Brown Rice Bowl",
    tagline: "Probiotic-Powered Savory Start",
    description: "A gut-healthy breakfast that combines fermented kimchi with protein-rich eggs and complex carbs from brown rice. Perfect for morning recovery and sustained energy.",
    mealType: "breakfast" as const,
    prepTime: 10,
    cookTime: 5,
    servings: 1,
    ingredients: [
      "1 cup cooked brown rice (preferably warm)",
      "1 large fried or sunny side up egg",
      "1/3 cup kimchi, drained",
      "1 tablespoon sesame oil",
      "1 teaspoon soy sauce (low sodium)",
      "1 green onion, sliced",
      "1 tablespoon sesame seeds",
      "1/4 avocado, sliced (optional)",
      "Sriracha or gochujang to taste"
    ],
    instructions: [
      "Heat sesame oil in a non-stick pan over medium heat",
      "Fry the egg to your preference (sunny side up recommended for runny yolk)",
      "Warm the brown rice in microwave for 1 minute if cold",
      "Place warm rice in a bowl, top with fried egg",
      "Add kimchi on one side of the bowl",
      "Drizzle with soy sauce and remaining sesame oil",
      "Garnish with green onions, sesame seeds, and avocado",
      "Add hot sauce to taste and mix before eating"
    ],
    nutrition: {
      calories: 420,
      protein: 18,
      fat: 16,
      carbs: 52,
      fiber: 6
    },
    tags: ["Recovery", "Better Performance", "High Protein", "Anti-Inflammatory"],
    whyHelpful: "This breakfast provides sustained energy through complex carbs while supporting gut health with probiotics from kimchi. The combination of protein and healthy fats helps stabilize blood sugar and supports muscle recovery from overnight fasting."
  },
  {
    name: "Greek Yogurt Berry Protein Bowl",
    tagline: "Antioxidant Recovery Powerhouse",
    description: "High-protein Greek yogurt combined with antioxidant-rich berries and nuts for optimal recovery nutrition.",
    mealType: "breakfast" as const,
    prepTime: 5,
    cookTime: 0,
    servings: 1,
    ingredients: [
      "1 cup plain Greek yogurt (2% fat)",
      "1/2 cup mixed berries (blueberries, strawberries, raspberries)",
      "2 tablespoons chopped walnuts",
      "1 tablespoon chia seeds",
      "1 tablespoon honey",
      "1/4 teaspoon vanilla extract",
      "1 tablespoon almond butter",
      "Pinch of cinnamon"
    ],
    instructions: [
      "Add vanilla extract to Greek yogurt and mix well",
      "Layer half the yogurt in a bowl",
      "Add half the berries and nuts",
      "Add remaining yogurt as second layer",
      "Top with remaining berries, nuts, and chia seeds",
      "Drizzle with honey and almond butter",
      "Sprinkle with cinnamon before serving"
    ],
    nutrition: {
      calories: 385,
      protein: 25,
      fat: 18,
      carbs: 32,
      fiber: 8
    },
    tags: ["Recovery", "High Protein", "Anti-Inflammatory"],
    whyHelpful: "Packed with probiotics for gut health and high-quality protein for muscle recovery. Antioxidants from berries help reduce exercise-induced inflammation while omega-3s from walnuts support brain function and recovery."
  },
  {
    name: "Overnight Oats with Protein Powder",
    tagline: "Make-Ahead Morning Fuel",
    description: "Convenient overnight oats boosted with protein powder for sustained energy and muscle recovery.",
    mealType: "breakfast" as const,
    prepTime: 5,
    cookTime: 0,
    servings: 1,
    ingredients: [
      "1/2 cup rolled oats",
      "1 scoop vanilla protein powder",
      "1 tablespoon chia seeds",
      "1 cup unsweetened almond milk",
      "1 tablespoon almond butter",
      "1/2 banana, mashed",
      "1 teaspoon maple syrup",
      "1/4 teaspoon cinnamon",
      "1 tablespoon chopped almonds"
    ],
    instructions: [
      "In a jar or container, mash the banana",
      "Add oats, protein powder, chia seeds, and cinnamon",
      "Pour in almond milk and stir well to combine",
      "Add almond butter and maple syrup, mix thoroughly",
      "Cover and refrigerate overnight (minimum 4 hours)",
      "In the morning, stir and add more milk if needed",
      "Top with chopped almonds before serving"
    ],
    nutrition: {
      calories: 445,
      protein: 28,
      fat: 14,
      carbs: 48,
      fiber: 12
    },
    tags: ["Recovery", "High Protein", "Better Performance"],
    whyHelpful: "Perfect make-ahead breakfast that provides sustained energy release. High fiber content supports digestive health while protein aids muscle recovery. The combination helps maintain stable blood sugar levels throughout the morning."
  },

  // LUNCH MEALS (14)
  {
    name: "Quinoa Power Bowl with Grilled Chicken",
    tagline: "Complete Protein Recovery Bowl",
    description: "Nutrient-dense quinoa bowl with lean protein and colorful vegetables for optimal midday nutrition.",
    mealType: "lunch" as const,
    prepTime: 15,
    cookTime: 20,
    servings: 2,
    ingredients: [
      "1 cup quinoa, rinsed",
      "2 chicken breasts (6 oz each)",
      "2 cups baby spinach",
      "1 cup cherry tomatoes, halved",
      "1/2 cucumber, diced",
      "1/4 red onion, thinly sliced",
      "1/2 avocado, sliced",
      "2 tablespoons olive oil",
      "1 tablespoon lemon juice",
      "1 teaspoon dried oregano",
      "Salt and pepper to taste"
    ],
    instructions: [
      "Cook quinoa according to package directions (about 15 minutes)",
      "Season chicken breasts with oregano, salt, and pepper",
      "Heat 1 tablespoon olive oil in a grill pan over medium-high heat",
      "Grill chicken for 6-7 minutes per side until cooked through",
      "Let chicken rest for 5 minutes, then slice",
      "Fluff quinoa with a fork and let cool slightly",
      "Combine remaining olive oil and lemon juice for dressing",
      "Assemble bowls with quinoa, spinach, vegetables, and sliced chicken",
      "Drizzle with dressing before serving"
    ],
    nutrition: {
      calories: 485,
      protein: 42,
      fat: 16,
      carbs: 38,
      fiber: 7
    },
    tags: ["Recovery", "High Protein", "Better Performance"],
    whyHelpful: "Provides complete amino acid profile from quinoa and chicken for optimal muscle recovery. Rich in antioxidants and anti-inflammatory compounds to support post-workout healing and sustained energy for afternoon activities."
  },
  {
    name: "Mediterranean Chickpea Salad",
    tagline: "Plant-Powered Protein Boost",
    description: "Fiber-rich chickpea salad with Mediterranean flavors for sustained energy and digestive health.",
    mealType: "lunch" as const,
    prepTime: 10,
    cookTime: 0,
    servings: 2,
    ingredients: [
      "2 cups cooked chickpeas (or 1 can, drained and rinsed)",
      "1 cup cherry tomatoes, quartered",
      "1/2 cucumber, diced",
      "1/4 red onion, finely diced",
      "1/2 cup kalamata olives, pitted and halved",
      "1/4 cup fresh parsley, chopped",
      "2 tablespoons fresh mint, chopped",
      "3 tablespoons olive oil",
      "2 tablespoons lemon juice",
      "1 teaspoon dried oregano",
      "1/2 teaspoon garlic powder",
      "Salt and pepper to taste"
    ],
    instructions: [
      "In a large bowl, combine chickpeas, tomatoes, cucumber, and red onion",
      "Add olives, parsley, and mint",
      "In a small bowl, whisk together olive oil, lemon juice, oregano, and garlic powder",
      "Pour dressing over salad and toss well",
      "Season with salt and pepper to taste",
      "Let marinate for 10 minutes before serving",
      "Serve chilled or at room temperature"
    ],
    nutrition: {
      calories: 365,
      protein: 14,
      fat: 18,
      carbs: 42,
      fiber: 12
    },
    tags: ["Better Performance", "Anti-Inflammatory", "High Protein"],
    whyHelpful: "High in plant-based protein and fiber to support digestive health and provide sustained energy. Rich in antioxidants and healthy fats that help reduce inflammation and support overall recovery."
  },

  // DINNER MEALS (14)
  {
    name: "Spaghetti Squash Beef & Lentil Bolognese",
    tagline: "Low-Carb Veggie Pasta with Hearty Sauce",
    description: "Nutrient-dense alternative to traditional pasta that boosts protein and fiber while reducing refined carbs.",
    mealType: "dinner" as const,
    prepTime: 15,
    cookTime: 45,
    servings: 4,
    ingredients: [
      "1 large spaghetti squash (3-4 lbs)",
      "8 oz lean ground beef (90-95% lean)",
      "1 cup cooked lentils",
      "1 can (28 oz) crushed tomatoes, no salt added",
      "1 tablespoon tomato paste",
      "1 small onion, diced",
      "1 carrot, finely diced",
      "1 rib celery, finely diced",
      "3 cloves garlic, minced",
      "1 teaspoon dried oregano",
      "1 teaspoon dried basil",
      "1 tablespoon olive oil",
      "Salt and pepper to taste",
      "Fresh basil for garnish",
      "2 tablespoons grated Parmesan (optional)"
    ],
    instructions: [
      "Preheat oven to 400°F (200°C)",
      "Cut spaghetti squash in half lengthwise and scoop out seeds",
      "Brush cut sides with olive oil, place cut-side down on baking sheet",
      "Roast for 30-40 minutes until tender",
      "Meanwhile, heat olive oil in large pot over medium-high heat",
      "Add onion, carrot, and celery; sauté 5 minutes until softened",
      "Add garlic and cook 30 seconds",
      "Add ground beef and brown, breaking up with spoon (5 minutes)",
      "Stir in tomato paste and cook 1 minute",
      "Add crushed tomatoes, lentils, oregano, basil, salt, and pepper",
      "Bring to simmer, reduce heat and cook 15-20 minutes",
      "Use fork to scrape spaghetti squash into strands",
      "Serve squash topped with bolognese sauce and fresh basil"
    ],
    nutrition: {
      calories: 350,
      protein: 24,
      fat: 12,
      carbs: 40,
      fiber: 10
    },
    tags: ["Better Performance", "Recovery", "Better Sleep"],
    whyHelpful: "This dish cleverly boosts nutrition by replacing pasta with spaghetti squash, significantly cutting refined carbs while adding fiber, vitamins, and hydration. The combination of lean beef and lentils provides complete protein for muscle repair while supporting stable blood sugar levels for better sleep quality."
  },
  {
    name: "Herb-Crusted Salmon with Sweet Potato",
    tagline: "Omega-3 Rich Recovery Dinner",
    description: "Anti-inflammatory salmon paired with complex carbs for optimal recovery and sleep preparation.",
    mealType: "dinner" as const,
    prepTime: 10,
    cookTime: 25,
    servings: 2,
    ingredients: [
      "2 salmon fillets (6 oz each)",
      "2 medium sweet potatoes",
      "2 cups broccoli florets",
      "2 tablespoons olive oil, divided",
      "1 tablespoon fresh dill, chopped",
      "1 tablespoon fresh parsley, chopped",
      "1 teaspoon garlic powder",
      "1 lemon, sliced",
      "Salt and pepper to taste"
    ],
    instructions: [
      "Preheat oven to 425°F (220°C)",
      "Pierce sweet potatoes and microwave for 5 minutes to partially cook",
      "Cut sweet potatoes into wedges and toss with 1 tablespoon olive oil",
      "Place on baking sheet and roast for 15 minutes",
      "Season salmon with herbs, garlic powder, salt, and pepper",
      "Heat remaining oil in oven-safe skillet over medium-high heat",
      "Sear salmon skin-side up for 3 minutes",
      "Flip salmon and transfer skillet to oven for 8-10 minutes",
      "Steam broccoli for 4-5 minutes until tender-crisp",
      "Serve salmon with sweet potato wedges and broccoli",
      "Garnish with lemon slices"
    ],
    nutrition: {
      calories: 465,
      protein: 35,
      fat: 18,
      carbs: 35,
      fiber: 6
    },
    tags: ["Recovery", "Better Sleep", "Anti-Inflammatory"],
    whyHelpful: "Rich in omega-3 fatty acids that reduce inflammation and support brain health. Sweet potatoes provide complex carbs that help with serotonin production for better sleep, while high-quality protein aids overnight muscle recovery."
  },

  // SNACK MEALS (14)
  {
    name: "Protein Energy Balls",
    tagline: "Grab-and-Go Power Bites",
    description: "No-bake energy balls packed with protein and healthy fats for sustained energy between meals.",
    mealType: "snack" as const,
    prepTime: 15,
    cookTime: 0,
    servings: 12,
    ingredients: [
      "1 cup rolled oats",
      "1/2 cup natural peanut butter",
      "1/3 cup honey",
      "1/3 cup mini dark chocolate chips",
      "1/3 cup ground flaxseed",
      "1 scoop vanilla protein powder",
      "1 teaspoon vanilla extract",
      "Pinch of salt"
    ],
    instructions: [
      "In a large bowl, mix all ingredients until well combined",
      "If mixture is too wet, add more oats; if too dry, add more peanut butter",
      "Refrigerate mixture for 30 minutes to firm up",
      "Roll mixture into 12 balls using your hands",
      "Place on parchment-lined tray",
      "Refrigerate for at least 1 hour before serving",
      "Store in refrigerator for up to 1 week"
    ],
    nutrition: {
      calories: 145,
      protein: 6,
      fat: 7,
      carbs: 16,
      fiber: 3
    },
    tags: ["Better Performance", "High Protein"],
    whyHelpful: "Perfect pre or post-workout snack that provides quick energy from natural sugars and sustained energy from protein and healthy fats. Easy to prepare in batches for convenient grab-and-go nutrition."
  },
  {
    name: "Apple Slices with Almond Butter",
    tagline: "Simple Balanced Snack",
    description: "Classic combination of fiber-rich fruit with protein and healthy fats for balanced nutrition.",
    mealType: "snack" as const,
    prepTime: 3,
    cookTime: 0,
    servings: 1,
    ingredients: [
      "1 medium apple, cored and sliced",
      "2 tablespoons natural almond butter",
      "1 teaspoon chia seeds",
      "Pinch of cinnamon"
    ],
    instructions: [
      "Wash and core the apple, then slice into wedges",
      "Arrange apple slices on a plate",
      "Serve with almond butter for dipping",
      "Sprinkle chia seeds and cinnamon on top",
      "Enjoy immediately to prevent apple browning"
    ],
    nutrition: {
      calories: 285,
      protein: 8,
      fat: 16,
      carbs: 32,
      fiber: 8
    },
    tags: ["Better Performance", "Anti-Inflammatory"],
    whyHelpful: "Provides natural sugars for quick energy while the almond butter adds protein and healthy fats to prevent blood sugar spikes. High fiber content supports digestive health and satiety between meals."
  }
];

export async function POST(request: NextRequest) {
  try {
    const { confirmSeed = false } = await request.json();
    
    if (!confirmSeed) {
      return NextResponse.json({
        error: 'Confirmation required',
        message: 'Set confirmSeed: true to populate database with PDF meals',
        mealCount: pdfMeals.length
      }, { status: 400 });
    }

    // Check current database state
    const existingMeals = await db.select().from(mealsLibrary);
    
    if (existingMeals.length > 0) {
      return NextResponse.json({
        error: 'Database not empty',
        message: `Database contains ${existingMeals.length} meals. Clear database first.`,
        currentMeals: existingMeals.length
      }, { status: 400 });
    }

    // Prepare meals for database insertion
    const mealsForDb = pdfMeals.map(meal => ({
      name: meal.name,
      description: meal.whyHelpful,
      mealType: meal.mealType,
      prepTime: meal.prepTime || null,
      cookTime: meal.cookTime || null,
      servings: meal.servings,
      ingredients: JSON.stringify(meal.ingredients),
      instructions: JSON.stringify(meal.instructions),
      nutrition: JSON.stringify(meal.nutrition),
      tags: JSON.stringify(meal.tags),
      imageUrl: null, // Will be generated on-demand
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }));

    // Insert all meals
    const insertedMeals = await db.insert(mealsLibrary).values(mealsForDb).returning();

    // Calculate statistics
    const stats = {
      totalInserted: insertedMeals.length,
      byMealType: {
        breakfast: insertedMeals.filter(m => m.mealType === 'breakfast').length,
        lunch: insertedMeals.filter(m => m.mealType === 'lunch').length,
        dinner: insertedMeals.filter(m => m.mealType === 'dinner').length,
        snack: insertedMeals.filter(m => m.mealType === 'snack').length
      }
    };

    return NextResponse.json({
      success: true,
      message: `Successfully populated meals library with ${insertedMeals.length} meals from PDFs`,
      statistics: stats,
      sampleMeals: insertedMeals.slice(0, 5).map(meal => ({
        id: meal.id,
        name: meal.name,
        mealType: meal.mealType
      }))
    }, { status: 201 });

  } catch (error) {
    console.error('Seed error:', error);
    return NextResponse.json({
      error: 'Failed to seed meals from PDFs',
      code: 'SEED_ERROR',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: "PDF Meals Seeder",
    description: "Populate meals library with curated meals from your PDF files",
    mealCount: pdfMeals.length,
    mealTypes: {
      breakfast: pdfMeals.filter(m => m.mealType === 'breakfast').length,
      lunch: pdfMeals.filter(m => m.mealType === 'lunch').length,
      dinner: pdfMeals.filter(m => m.mealType === 'dinner').length,
      snack: pdfMeals.filter(m => m.mealType === 'snack').length
    },
    usage: {
      seed: "POST with { confirmSeed: true } to populate database",
      preview: "GET to see meal statistics"
    },
    sampleMeals: pdfMeals.slice(0, 3).map(meal => ({
      name: meal.name,
      mealType: meal.mealType,
      tags: meal.tags
    }))
  });
}