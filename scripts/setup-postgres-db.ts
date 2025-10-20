import { db } from '../src/db/postgres-connection';
import { insertMeal, type MealData } from '../src/db/meal-utils';

// Sample meal data based on your example
const sampleMeal: MealData = {
  meal_id: "B-0001",
  meal_name: "Blueberry Almond Overnight Oats",
  tagline: "Fiber & Probiotic Power Bowl",
  prep_time: "5 minutes (plus 6+ hours refrigeration)",
  meal_type: "Breakfast",
  tags: ["Recovery", "Energy", "Better Performance"],
  ingredients: {
    serving_size: "1 serving",
    list: [
      { item: "Rolled oats", quantity: "1/2 cup" },
      { item: "Milk (dairy or unsweetened plant-based)", quantity: "1 cup" },
      { item: "Greek yogurt (plain, with live cultures)", quantity: "1/4 cup" },
      { item: "Chia seeds", quantity: "1 tablespoon" },
      { item: "Almond butter", quantity: "1 tablespoon" },
      { item: "Blueberries (fresh or frozen)", quantity: "1/2 cup" },
      { item: "Honey (optional, for sweetness)", quantity: "1 teaspoon", optional: true, notes: "for sweetness" },
      { item: "Cinnamon (optional)", quantity: "1/4 teaspoon", optional: true }
    ]
  },
  method: [
    "step 1: In a jar or bowl, combine oats, milk, yogurt, chia seeds, almond butter, and cinnamon. Stir well.",
    "step 2: Cover and refrigerate overnight (or at least 6 hours) to let the oats soften.",
    "step 3: In the morning, stir the mixture. Top with blueberries and drizzle honey if desired.",
    "step 4: Enjoy cold, or warm it up briefly if you prefer a warm breakfast."
  ],
  nutrition: {
    serving_unit: "per 1 serving",
    summary: "High in protein and fiber to keep you satisfied and promote gut health (oats and chia provide prebiotic fiber, while yogurt offers probiotics).",
    details: {
      "Calories": "380 kcal",
      "Protein": "20 g",
      "Carbs": "50 g",
      "Fiber": "12 g",
      "Fat": "12 g",
      "Saturated_Fat": "2.5 g",
      "Sugars": "12 g",
      "Sodium": "110 mg"
    }
  },
  why_this_meal: "This make-ahead breakfast combines fiber-rich oats and chia seeds with Greek yogurt for probiotics and protein. Blueberries add antioxidants that help fight inflammation and support muscle recovery. Together, these ingredients keep you full and fuel your gut with prebiotics and probiotics for a healthy microbiome."
};

async function setupDatabase() {
  try {
    console.log('Setting up PostgreSQL database...');
    
    // Insert the sample meal
    console.log('Inserting sample meal...');
    const result = await insertMeal(sampleMeal);
    console.log('Sample meal inserted successfully:', result);
    
    console.log('Database setup completed!');
  } catch (error) {
    console.error('Error setting up database:', error);
    process.exit(1);
  }
}

// Run the setup if this file is executed directly
if (require.main === module) {
  setupDatabase();
}

export { setupDatabase };