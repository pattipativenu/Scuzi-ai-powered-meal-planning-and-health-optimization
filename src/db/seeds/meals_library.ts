import { db } from '@/db';
import { mealsLibrary } from '@/db/schema';

async function main() {
    const sampleMeals = [
        // BREAKFAST MEALS (14)
        {
            name: 'Greek Yogurt Parfait with Berries & Granola',
            description: 'High-protein breakfast with antioxidants and probiotics for gut health and sustained energy.',
            mealType: 'breakfast',
            prepTime: 5,
            cookTime: 0,
            servings: 1,
            ingredients: JSON.stringify([
                { name: 'Greek Yogurt', amount: 1, unit: 'cup', category: 'dairy' },
                { name: 'Mixed Berries', amount: 0.5, unit: 'cup', category: 'fruit' },
                { name: 'Granola', amount: 0.25, unit: 'cup', category: 'grain' },
                { name: 'Honey', amount: 1, unit: 'tbsp', category: 'carbs' },
                { name: 'Almonds', amount: 2, unit: 'tbsp', category: 'fat' }
            ]),
            instructions: JSON.stringify([
                'Layer Greek yogurt in a bowl or glass',
                'Add half the mixed berries on top',
                'Sprinkle granola over berries',
                'Add remaining berries',
                'Drizzle with honey and top with sliced almonds'
            ]),
            nutrition: JSON.stringify({
                calories: 385,
                protein: 22,
                carbs: 48,
                fat: 12,
                fiber: 6,
                sodium: 95
            }),
            tags: JSON.stringify(['high-protein', 'gut-health', 'immunity-boost', 'vegetarian']),
            createdAt: new Date().toISOString()
        },
        {
            name: 'Scrambled Eggs with Avocado Toast',
            description: 'Protein-packed breakfast with healthy fats for sustained energy and recovery.',
            mealType: 'breakfast',
            prepTime: 5,
            cookTime: 8,
            servings: 1,
            ingredients: JSON.stringify([
                { name: 'Eggs', amount: 3, unit: 'pieces', category: 'protein' },
                { name: 'Whole Grain Bread', amount: 2, unit: 'slices', category: 'grain' },
                { name: 'Avocado', amount: 0.5, unit: 'pieces', category: 'fat' },
                { name: 'Olive Oil', amount: 1, unit: 'tsp', category: 'fat' },
                { name: 'Cherry Tomatoes', amount: 0.25, unit: 'cup', category: 'vegetable' },
                { name: 'Sea Salt', amount: 0.25, unit: 'tsp', category: 'protein' }
            ]),
            instructions: JSON.stringify([
                'Toast whole grain bread until golden brown',
                'Whisk eggs with salt and pepper in a bowl',
                'Heat olive oil in pan over medium heat',
                'Pour eggs and scramble gently for 3-4 minutes',
                'Mash avocado on toast and top with scrambled eggs',
                'Garnish with halved cherry tomatoes'
            ]),
            nutrition: JSON.stringify({
                calories: 485,
                protein: 26,
                carbs: 38,
                fat: 25,
                fiber: 10,
                sodium: 420
            }),
            tags: JSON.stringify(['high-protein', 'heart-healthy', 'energy-boost', 'vegetarian']),
            createdAt: new Date().toISOString()
        },
        {
            name: 'Protein Oatmeal with Banana & Almond Butter',
            description: 'Slow-release carbs with protein for endurance and muscle recovery.',
            mealType: 'breakfast',
            prepTime: 5,
            cookTime: 10,
            servings: 1,
            ingredients: JSON.stringify([
                { name: 'Rolled Oats', amount: 0.5, unit: 'cup', category: 'grain' },
                { name: 'Protein Powder', amount: 1, unit: 'scoop', category: 'protein' },
                { name: 'Banana', amount: 1, unit: 'pieces', category: 'fruit' },
                { name: 'Almond Butter', amount: 2, unit: 'tbsp', category: 'fat' },
                { name: 'Cinnamon', amount: 0.5, unit: 'tsp', category: 'grain' },
                { name: 'Milk', amount: 1, unit: 'cup', category: 'dairy' }
            ]),
            instructions: JSON.stringify([
                'Combine oats and milk in saucepan over medium heat',
                'Cook oats for 8-10 minutes, stirring occasionally',
                'Remove from heat and stir in protein powder',
                'Slice banana and arrange on top',
                'Add almond butter and sprinkle with cinnamon',
                'Let cool for 2 minutes before serving'
            ]),
            nutrition: JSON.stringify({
                calories: 520,
                protein: 32,
                carbs: 58,
                fat: 18,
                fiber: 9,
                sodium: 210
            }),
            tags: JSON.stringify(['high-protein', 'recovery', 'performance', 'energy-boost']),
            createdAt: new Date().toISOString()
        },
        {
            name: 'Spinach & Feta Egg White Omelet',
            description: 'Low-fat, high-protein breakfast with iron-rich greens for optimal performance.',
            mealType: 'breakfast',
            prepTime: 5,
            cookTime: 10,
            servings: 1,
            ingredients: JSON.stringify([
                { name: 'Egg Whites', amount: 6, unit: 'pieces', category: 'protein' },
                { name: 'Spinach', amount: 2, unit: 'cup', category: 'vegetable' },
                { name: 'Feta Cheese', amount: 2, unit: 'tbsp', category: 'dairy' },
                { name: 'Cherry Tomatoes', amount: 0.25, unit: 'cup', category: 'vegetable' },
                { name: 'Olive Oil', amount: 1, unit: 'tsp', category: 'fat' },
                { name: 'Garlic', amount: 1, unit: 'clove', category: 'vegetable' }
            ]),
            instructions: JSON.stringify([
                'Whisk egg whites with salt and pepper',
                'Heat olive oil in non-stick pan over medium heat',
                'Sauté minced garlic and spinach until wilted',
                'Pour egg whites and cook until edges set',
                'Add feta and tomatoes to one half',
                'Fold omelet and cook 2 more minutes'
            ]),
            nutrition: JSON.stringify({
                calories: 245,
                protein: 32,
                carbs: 12,
                fat: 8,
                fiber: 3,
                sodium: 620
            }),
            tags: JSON.stringify(['high-protein', 'low-carb', 'heart-healthy', 'vegetarian']),
            createdAt: new Date().toISOString()
        },
        {
            name: 'Overnight Chia Pudding with Mixed Berries',
            description: 'Omega-3 rich breakfast with antioxidants for inflammation reduction and recovery.',
            mealType: 'breakfast',
            prepTime: 10,
            cookTime: 0,
            servings: 1,
            ingredients: JSON.stringify([
                { name: 'Chia Seeds', amount: 3, unit: 'tbsp', category: 'fat' },
                { name: 'Almond Milk', amount: 1, unit: 'cup', category: 'dairy' },
                { name: 'Mixed Berries', amount: 0.75, unit: 'cup', category: 'fruit' },
                { name: 'Vanilla Extract', amount: 0.5, unit: 'tsp', category: 'carbs' },
                { name: 'Maple Syrup', amount: 1, unit: 'tbsp', category: 'carbs' },
                { name: 'Walnuts', amount: 2, unit: 'tbsp', category: 'fat' }
            ]),
            instructions: JSON.stringify([
                'Mix chia seeds, almond milk, vanilla, and maple syrup in jar',
                'Stir well and refrigerate overnight or minimum 4 hours',
                'In morning, stir pudding to break up any clumps',
                'Top with mixed berries',
                'Sprinkle with chopped walnuts',
                'Serve chilled'
            ]),
            nutrition: JSON.stringify({
                calories: 365,
                protein: 12,
                carbs: 42,
                fat: 18,
                fiber: 15,
                sodium: 180
            }),
            tags: JSON.stringify(['anti-inflammatory', 'gut-health', 'heart-healthy', 'dairy-free', 'vegetarian']),
            createdAt: new Date().toISOString()
        },
        {
            name: 'Whole Grain Pancakes with Greek Yogurt',
            description: 'Complex carbs with protein for pre-workout fuel and sustained energy.',
            mealType: 'breakfast',
            prepTime: 10,
            cookTime: 15,
            servings: 1,
            ingredients: JSON.stringify([
                { name: 'Whole Wheat Flour', amount: 0.5, unit: 'cup', category: 'grain' },
                { name: 'Egg', amount: 1, unit: 'pieces', category: 'protein' },
                { name: 'Greek Yogurt', amount: 0.5, unit: 'cup', category: 'dairy' },
                { name: 'Banana', amount: 1, unit: 'pieces', category: 'fruit' },
                { name: 'Blueberries', amount: 0.5, unit: 'cup', category: 'fruit' },
                { name: 'Honey', amount: 1, unit: 'tbsp', category: 'carbs' }
            ]),
            instructions: JSON.stringify([
                'Mash banana and mix with egg and half the yogurt',
                'Add flour and mix until just combined',
                'Heat non-stick pan over medium heat',
                'Pour batter to make 3-4 small pancakes',
                'Cook 2-3 minutes per side until golden',
                'Top with remaining yogurt, blueberries, and honey drizzle'
            ]),
            nutrition: JSON.stringify({
                calories: 465,
                protein: 24,
                carbs: 72,
                fat: 9,
                fiber: 8,
                sodium: 185
            }),
            tags: JSON.stringify(['performance', 'energy-boost', 'gut-health', 'vegetarian']),
            createdAt: new Date().toISOString()
        },
        {
            name: 'Smoked Salmon Avocado Toast',
            description: 'Omega-3 rich breakfast with healthy fats for brain health and recovery.',
            mealType: 'breakfast',
            prepTime: 5,
            cookTime: 3,
            servings: 1,
            ingredients: JSON.stringify([
                { name: 'Whole Grain Bread', amount: 2, unit: 'slices', category: 'grain' },
                { name: 'Smoked Salmon', amount: 3, unit: 'oz', category: 'protein' },
                { name: 'Avocado', amount: 0.5, unit: 'pieces', category: 'fat' },
                { name: 'Cream Cheese', amount: 2, unit: 'tbsp', category: 'dairy' },
                { name: 'Red Onion', amount: 2, unit: 'tbsp', category: 'vegetable' },
                { name: 'Capers', amount: 1, unit: 'tsp', category: 'vegetable' }
            ]),
            instructions: JSON.stringify([
                'Toast bread until golden and crispy',
                'Spread cream cheese on each slice',
                'Mash avocado and layer on top',
                'Arrange smoked salmon over avocado',
                'Garnish with thinly sliced red onion and capers',
                'Add fresh lemon juice if desired'
            ]),
            nutrition: JSON.stringify({
                calories: 445,
                protein: 28,
                carbs: 36,
                fat: 22,
                fiber: 9,
                sodium: 780
            }),
            tags: JSON.stringify(['high-protein', 'anti-inflammatory', 'heart-healthy', 'recovery']),
            createdAt: new Date().toISOString()
        },
        {
            name: 'Turkey Sausage Breakfast Bowl',
            description: 'High-protein savory breakfast with vegetables for sustained energy and recovery.',
            mealType: 'breakfast',
            prepTime: 5,
            cookTime: 15,
            servings: 1,
            ingredients: JSON.stringify([
                { name: 'Turkey Sausage', amount: 3, unit: 'oz', category: 'protein' },
                { name: 'Sweet Potato', amount: 0.5, unit: 'cup', category: 'carbs' },
                { name: 'Bell Peppers', amount: 0.5, unit: 'cup', category: 'vegetable' },
                { name: 'Eggs', amount: 2, unit: 'pieces', category: 'protein' },
                { name: 'Spinach', amount: 1, unit: 'cup', category: 'vegetable' },
                { name: 'Olive Oil', amount: 1, unit: 'tsp', category: 'fat' }
            ]),
            instructions: JSON.stringify([
                'Dice sweet potato and microwave 5 minutes until tender',
                'Cook turkey sausage in pan over medium heat, breaking into pieces',
                'Add diced bell peppers and cook 3 minutes',
                'Add spinach and cook until wilted',
                'Push mixture to side and scramble eggs in same pan',
                'Mix everything together and serve in bowl'
            ]),
            nutrition: JSON.stringify({
                calories: 425,
                protein: 34,
                carbs: 28,
                fat: 19,
                fiber: 5,
                sodium: 680
            }),
            tags: JSON.stringify(['high-protein', 'recovery', 'performance', 'gluten-free', 'dairy-free']),
            createdAt: new Date().toISOString()
        },
        {
            name: 'Cottage Cheese with Pineapple & Walnuts',
            description: 'Quick high-protein breakfast with tropical fruit and omega-3s for recovery.',
            mealType: 'breakfast',
            prepTime: 3,
            cookTime: 0,
            servings: 1,
            ingredients: JSON.stringify([
                { name: 'Cottage Cheese', amount: 1, unit: 'cup', category: 'dairy' },
                { name: 'Pineapple Chunks', amount: 0.75, unit: 'cup', category: 'fruit' },
                { name: 'Walnuts', amount: 0.25, unit: 'cup', category: 'fat' },
                { name: 'Chia Seeds', amount: 1, unit: 'tbsp', category: 'fat' },
                { name: 'Cinnamon', amount: 0.25, unit: 'tsp', category: 'grain' }
            ]),
            instructions: JSON.stringify([
                'Place cottage cheese in serving bowl',
                'Top with pineapple chunks',
                'Sprinkle with chopped walnuts',
                'Add chia seeds for extra fiber',
                'Dust with cinnamon and serve'
            ]),
            nutrition: JSON.stringify({
                calories: 395,
                protein: 32,
                carbs: 35,
                fat: 16,
                fiber: 5,
                sodium: 620
            }),
            tags: JSON.stringify(['high-protein', 'recovery', 'gut-health', 'vegetarian']),
            createdAt: new Date().toISOString()
        },
        {
            name: 'Quinoa Breakfast Bowl with Eggs',
            description: 'Complete protein breakfast with complex carbs for endurance and muscle building.',
            mealType: 'breakfast',
            prepTime: 5,
            cookTime: 20,
            servings: 1,
            ingredients: JSON.stringify([
                { name: 'Quinoa', amount: 0.5, unit: 'cup', category: 'grain' },
                { name: 'Eggs', amount: 2, unit: 'pieces', category: 'protein' },
                { name: 'Kale', amount: 1, unit: 'cup', category: 'vegetable' },
                { name: 'Cherry Tomatoes', amount: 0.5, unit: 'cup', category: 'vegetable' },
                { name: 'Avocado', amount: 0.25, unit: 'pieces', category: 'fat' },
                { name: 'Olive Oil', amount: 1, unit: 'tsp', category: 'fat' }
            ]),
            instructions: JSON.stringify([
                'Cook quinoa according to package directions',
                'Sauté kale and tomatoes in olive oil until wilted',
                'Fry or poach eggs to your preference',
                'Place cooked quinoa in bowl',
                'Top with sautéed vegetables and eggs',
                'Add sliced avocado and season with salt and pepper'
            ]),
            nutrition: JSON.stringify({
                calories: 455,
                protein: 22,
                carbs: 48,
                fat: 19,
                fiber: 9,
                sodium: 320
            }),
            tags: JSON.stringify(['high-protein', 'performance', 'heart-healthy', 'vegetarian', 'gluten-free']),
            createdAt: new Date().toISOString()
        },
        {
            name: 'Veggie Egg Muffins',
            description: 'Portable high-protein breakfast with vegetables for convenient meal prep.',
            mealType: 'breakfast',
            prepTime: 10,
            cookTime: 20,
            servings: 1,
            ingredients: JSON.stringify([
                { name: 'Eggs', amount: 3, unit: 'pieces', category: 'protein' },
                { name: 'Bell Peppers', amount: 0.25, unit: 'cup', category: 'vegetable' },
                { name: 'Spinach', amount: 0.5, unit: 'cup', category: 'vegetable' },
                { name: 'Onion', amount: 2, unit: 'tbsp', category: 'vegetable' },
                { name: 'Cheddar Cheese', amount: 0.25, unit: 'cup', category: 'dairy' },
                { name: 'Turkey Bacon', amount: 2, unit: 'slices', category: 'protein' }
            ]),
            instructions: JSON.stringify([
                'Preheat oven to 375°F and grease muffin tin',
                'Whisk eggs with salt and pepper',
                'Dice vegetables and cooked turkey bacon',
                'Mix vegetables, bacon, and cheese with eggs',
                'Pour into muffin cups and bake 18-20 minutes',
                'Let cool 5 minutes before removing from tin'
            ]),
            nutrition: JSON.stringify({
                calories: 380,
                protein: 30,
                carbs: 8,
                fat: 24,
                fiber: 2,
                sodium: 720
            }),
            tags: JSON.stringify(['high-protein', 'low-carb', 'gluten-free']),
            createdAt: new Date().toISOString()
        },
        {
            name: 'Protein Smoothie Bowl with Granola',
            description: 'Nutrient-dense smoothie bowl with antioxidants for post-workout recovery.',
            mealType: 'breakfast',
            prepTime: 8,
            cookTime: 0,
            servings: 1,
            ingredients: JSON.stringify([
                { name: 'Protein Powder', amount: 1, unit: 'scoop', category: 'protein' },
                { name: 'Frozen Berries', amount: 1, unit: 'cup', category: 'fruit' },
                { name: 'Banana', amount: 1, unit: 'pieces', category: 'fruit' },
                { name: 'Almond Milk', amount: 0.5, unit: 'cup', category: 'dairy' },
                { name: 'Granola', amount: 0.25, unit: 'cup', category: 'grain' },
                { name: 'Almond Butter', amount: 1, unit: 'tbsp', category: 'fat' }
            ]),
            instructions: JSON.stringify([
                'Blend protein powder, frozen berries, banana, and almond milk until thick',
                'Pour into bowl ensuring thick consistency',
                'Top with granola in a line',
                'Add fresh berries if available',
                'Drizzle with almond butter',
                'Serve immediately with spoon'
            ]),
            nutrition: JSON.stringify({
                calories: 485,
                protein: 32,
                carbs: 62,
                fat: 14,
                fiber: 11,
                sodium: 240
            }),
            tags: JSON.stringify(['high-protein', 'recovery', 'immunity-boost', 'dairy-free']),
            createdAt: new Date().toISOString()
        },
        {
            name: 'Almond Butter Banana Toast',
            description: 'Quick energy breakfast with potassium for muscle function and recovery.',
            mealType: 'breakfast',
            prepTime: 3,
            cookTime: 2,
            servings: 1,
            ingredients: JSON.stringify([
                { name: 'Whole Grain Bread', amount: 2, unit: 'slices', category: 'grain' },
                { name: 'Almond Butter', amount: 3, unit: 'tbsp', category: 'fat' },
                { name: 'Banana', amount: 1, unit: 'pieces', category: 'fruit' },
                { name: 'Chia Seeds', amount: 1, unit: 'tsp', category: 'fat' },
                { name: 'Honey', amount: 1, unit: 'tsp', category: 'carbs' },
                { name: 'Cinnamon', amount: 0.25, unit: 'tsp', category: 'grain' }
            ]),
            instructions: JSON.stringify([
                'Toast bread until golden brown',
                'Spread almond butter generously on each slice',
                'Slice banana and arrange on top',
                'Sprinkle with chia seeds',
                'Drizzle with honey and dust with cinnamon',
                'Serve immediately'
            ]),
            nutrition: JSON.stringify({
                calories: 495,
                protein: 16,
                carbs: 58,
                fat: 24,
                fiber: 11,
                sodium: 280
            }),
            tags: JSON.stringify(['energy-boost', 'heart-healthy', 'vegetarian', 'dairy-free']),
            createdAt: new Date().toISOString()
        },
        {
            name: 'Mediterranean Breakfast Scramble',
            description: 'Protein-rich breakfast with Mediterranean flavors for heart health and recovery.',
            mealType: 'breakfast',
            prepTime: 8,
            cookTime: 10,
            servings: 1,
            ingredients: JSON.stringify([
                { name: 'Eggs', amount: 3, unit: 'pieces', category: 'protein' },
                { name: 'Feta Cheese', amount: 0.25, unit: 'cup', category: 'dairy' },
                { name: 'Sun-Dried Tomatoes', amount: 2, unit: 'tbsp', category: 'vegetable' },
                { name: 'Spinach', amount: 1, unit: 'cup', category: 'vegetable' },
                { name: 'Kalamata Olives', amount: 5, unit: 'pieces', category: 'fat' },
                { name: 'Olive Oil', amount: 1, unit: 'tsp', category: 'fat' }
            ]),
            instructions: JSON.stringify([
                'Whisk eggs with salt and pepper',
                'Heat olive oil in pan over medium heat',
                'Add spinach and cook until wilted',
                'Pour in eggs and scramble gently',
                'Add sun-dried tomatoes, olives, and feta',
                'Cook until eggs are set and serve hot'
            ]),
            nutrition: JSON.stringify({
                calories: 425,
                protein: 28,
                carbs: 12,
                fat: 30,
                fiber: 3,
                sodium: 780
            }),
            tags: JSON.stringify(['high-protein', 'heart-healthy', 'anti-inflammatory', 'vegetarian', 'gluten-free']),
            createdAt: new Date().toISOString()
        },

        // LUNCH MEALS (14)
        {
            name: 'Grilled Chicken Caesar Salad',
            description: 'Classic high-protein salad with crisp romaine for sustained energy.',
            mealType: 'lunch',
            prepTime: 10,
            cookTime: 15,
            servings: 1,
            ingredients: JSON.stringify([
                { name: 'Chicken Breast', amount: 5, unit: 'oz', category: 'protein' },
                { name: 'Romaine Lettuce', amount: 3, unit: 'cup', category: 'vegetable' },
                { name: 'Parmesan Cheese', amount: 0.25, unit: 'cup', category: 'dairy' },
                { name: 'Whole Grain Croutons', amount: 0.25, unit: 'cup', category: 'grain' },
                { name: 'Caesar Dressing', amount: 2, unit: 'tbsp', category: 'fat' },
                { name: 'Lemon', amount: 0.5, unit: 'pieces', category: 'fruit' }
            ]),
            instructions: JSON.stringify([
                'Season chicken with salt, pepper, and olive oil',
                'Grill chicken 6-7 minutes per side until cooked through',
                'Let chicken rest 5 minutes, then slice',
                'Chop romaine lettuce and place in large bowl',
                'Add croutons and shaved parmesan',
                'Top with sliced chicken, drizzle dressing, and squeeze lemon'
            ]),
            nutrition: JSON.stringify({
                calories: 425,
                protein: 42,
                carbs: 22,
                fat: 18,
                fiber: 4,
                sodium: 680
            }),
            tags: JSON.stringify(['high-protein', 'performance', 'heart-healthy']),
            createdAt: new Date().toISOString()
        },
        {
            name: 'Quinoa Buddha Bowl with Chickpeas',
            description: 'Plant-based protein bowl with complete nutrients for sustained energy.',
            mealType: 'lunch',
            prepTime: 10,
            cookTime: 20,
            servings: 1,
            ingredients: JSON.stringify([
                { name: 'Quinoa', amount: 0.5, unit: 'cup', category: 'grain' },
                { name: 'Chickpeas', amount: 0.75, unit: 'cup', category: 'protein' },
                { name: 'Sweet Potato', amount: 0.5, unit: 'cup', category: 'carbs' },
                { name: 'Kale', amount: 1, unit: 'cup', category: 'vegetable' },
                { name: 'Avocado', amount: 0.5, unit: 'pieces', category: 'fat' },
                { name: 'Tahini', amount: 2, unit: 'tbsp', category: 'fat' }
            ]),
            instructions: JSON.stringify([
                'Cook quinoa according to package directions',
                'Roast chickpeas and diced sweet potato at 400°F for 20 minutes',
                'Massage kale with olive oil until tender',
                'Arrange quinoa in bowl with sections for each ingredient',
                'Add roasted chickpeas, sweet potato, and kale',
                'Top with sliced avocado and drizzle tahini dressing'
            ]),
            nutrition: JSON.stringify({
                calories: 525,
                protein: 18,
                carbs: 68,
                fat: 22,
                fiber: 16,
                sodium: 285
            }),
            tags: JSON.stringify(['vegetarian', 'heart-healthy', 'gut-health', 'dairy-free', 'gluten-free']),
            createdAt: new Date().toISOString()
        },
        {
            name: 'Turkey & Avocado Wrap',
            description: 'Lean protein wrap with healthy fats for quick energy and recovery.',
            mealType: 'lunch',
            prepTime: 8,
            cookTime: 0,
            servings: 1,
            ingredients: JSON.stringify([
                { name: 'Whole Wheat Tortilla', amount: 1, unit: 'pieces', category: 'grain' },
                { name: 'Turkey Breast', amount: 4, unit: 'oz', category: 'protein' },
                { name: 'Avocado', amount: 0.5, unit: 'pieces', category: 'fat' },
                { name: 'Tomato', amount: 0.5, unit: 'pieces', category: 'vegetable' },
                { name: 'Lettuce', amount: 1, unit: 'cup', category: 'vegetable' },
                { name: 'Hummus', amount: 2, unit: 'tbsp', category: 'protein' }
            ]),
            instructions: JSON.stringify([
                'Lay tortilla flat on clean surface',
                'Spread hummus evenly over tortilla',
                'Layer turkey slices in center',
                'Add sliced avocado, tomato, and lettuce',
                'Fold sides in and roll tightly',
                'Cut in half diagonally and serve'
            ]),
            nutrition: JSON.stringify({
                calories: 445,
                protein: 32,
                carbs: 42,
                fat: 18,
                fiber: 10,
                sodium: 720
            }),
            tags: JSON.stringify(['high-protein', 'heart-healthy', 'dairy-free']),
            createdAt: new Date().toISOString()
        },
        {
            name: 'Mediterranean Grain Bowl',
            description: 'Colorful bowl with Mediterranean flavors for heart health and sustained energy.',
            mealType: 'lunch',
            prepTime: 12,
            cookTime: 15,
            servings: 1,
            ingredients: JSON.stringify([
                { name: 'Brown Rice', amount: 0.5, unit: 'cup', category: 'grain' },
                { name: 'Grilled Chicken', amount: 4, unit: 'oz', category: 'protein' },
                { name: 'Cucumber', amount: 0.5, unit: 'cup', category: 'vegetable' },
                { name: 'Cherry Tomatoes', amount: 0.5, unit: 'cup', category: 'vegetable' },
                { name: 'Feta Cheese', amount: 0.25, unit: 'cup', category: 'dairy' },
                { name: 'Kalamata Olives', amount: 0.25, unit: 'cup', category: 'fat' },
                { name: 'Tzatziki Sauce', amount: 0.25, unit: 'cup', category: 'dairy' }
            ]),
            instructions: JSON.stringify([
                'Cook brown rice according to package directions',
                'Grill or sauté chicken until cooked through',
                'Dice cucumber and halve cherry tomatoes',
                'Place rice in bowl as base',
                'Arrange chicken, vegetables, feta, and olives on top',
                'Drizzle with tzatziki sauce and serve'
            ]),
            nutrition: JSON.stringify({
                calories: 485,
                protein: 36,
                carbs: 45,
                fat: 16,
                fiber: 6,
                sodium: 680
            }),
            tags: JSON.stringify(['high-protein', 'heart-healthy', 'anti-inflammatory', 'gluten-free']),
            createdAt: new Date().toISOString()
        },
        {
            name: 'Asian Chicken Lettuce Wraps',
            description: 'Low-carb, high-protein lunch with Asian-inspired flavors.',
            mealType: 'lunch',
            prepTime: 10,
            cookTime: 12,
            servings: 1,
            ingredients: JSON.stringify([
                { name: 'Ground Chicken', amount: 5, unit: 'oz', category: 'protein' },
                { name: 'Butter Lettuce', amount: 6, unit: 'leaves', category: 'vegetable' },
                { name: 'Water Chestnuts', amount: 0.25, unit: 'cup', category: 'vegetable' },
                { name: 'Green Onions', amount: 2, unit: 'tbsp', category: 'vegetable' },
                { name: 'Ginger', amount: 1, unit: 'tsp', category: 'vegetable' },
                { name: 'Soy Sauce', amount: 2, unit: 'tbsp', category: 'protein' },
                { name: 'Sesame Oil', amount: 1, unit: 'tsp', category: 'fat' }
            ]),
            instructions: JSON.stringify([
                'Heat sesame oil in pan over medium-high heat',
                'Add ground chicken and cook until browned',
                'Add minced ginger and cook 1 minute',
                'Stir in diced water chestnuts and green onions',
                'Add soy sauce and cook 2 more minutes',
                'Spoon mixture into lettuce leaves and serve'
            ]),
            nutrition: JSON.stringify({
                calories: 315,
                protein: 38,
                carbs: 18,
                fat: 10,
                fiber: 4,
                sodium: 780
            }),
            tags: JSON.stringify(['high-protein', 'low-carb', 'dairy-free', 'gluten-free']),
            createdAt: new Date().toISOString()
        },
        {
            name: 'Salmon Poke Bowl',
            description: 'Omega-3 rich bowl with fresh vegetables for anti-inflammatory benefits.',
            mealType: 'lunch',
            prepTime: 15,
            cookTime: 0,
            servings: 1,
            ingredients: JSON.stringify([
                { name: 'Sushi-Grade Salmon', amount: 5, unit: 'oz', category: 'protein' },
                { name: 'Brown Rice', amount: 0.75, unit: 'cup', category: 'grain' },
                { name: 'Edamame', amount: 0.5, unit: 'cup', category: 'protein' },
                { name: 'Cucumber', amount: 0.5, unit: 'cup', category: 'vegetable' },
                { name: 'Avocado', amount: 0.5, unit: 'pieces', category: 'fat' },
                { name: 'Seaweed', amount: 2, unit: 'tbsp', category: 'vegetable' },
                { name: 'Soy Sauce', amount: 1, unit: 'tbsp', category: 'protein' }
            ]),
            instructions: JSON.stringify([
                'Cook brown rice and let cool slightly',
                'Dice salmon into bite-sized cubes',
                'Marinate salmon in soy sauce for 10 minutes',
                'Place rice in bowl as base',
                'Arrange salmon, edamame, cucumber, and avocado on top',
                'Garnish with seaweed and serve with extra soy sauce'
            ]),
            nutrition: JSON.stringify({
                calories: 535,
                protein: 38,
                carbs: 52,
                fat: 18,
                fiber: 10,
                sodium: 620
            }),
            tags: JSON.stringify(['high-protein', 'anti-inflammatory', 'heart-healthy', 'dairy-free']),
            createdAt: new Date().toISOString()
        },
        {
            name: 'Veggie & Hummus Sandwich',
            description: 'Plant-based lunch with fiber and protein for sustained energy.',
            mealType: 'lunch',
            prepTime: 8,
            cookTime: 0,
            servings: 1,
            ingredients: JSON.stringify([
                { name: 'Whole Grain Bread', amount: 2, unit: 'slices', category: 'grain' },
                { name: 'Hummus', amount: 0.25, unit: 'cup', category: 'protein' },
                { name: 'Cucumber', amount: 0.5, unit: 'cup', category: 'vegetable' },
                { name: 'Bell Peppers', amount: 0.5, unit: 'cup', category: 'vegetable' },
                { name: 'Sprouts', amount: 0.25, unit: 'cup', category: 'vegetable' },
                { name: 'Avocado', amount: 0.25, unit: 'pieces', category: 'fat' },
                { name: 'Spinach', amount: 1, unit: 'cup', category: 'vegetable' }
            ]),
            instructions: JSON.stringify([
                'Toast bread lightly if desired',
                'Spread hummus generously on both slices',
                'Layer spinach leaves on bottom slice',
                'Add sliced cucumber, bell peppers, and avocado',
                'Top with sprouts for extra crunch',
                'Close sandwich, cut in half, and serve'
            ]),
            nutrition: JSON.stringify({
                calories: 385,
                protein: 14,
                carbs: 52,
                fat: 15,
                fiber: 14,
                sodium: 520
            }),
            tags: JSON.stringify(['vegetarian', 'heart-healthy', 'gut-health', 'dairy-free']),
            createdAt: new Date().toISOString()
        },
        {
            name: 'Greek Salad with Grilled Chicken',
            description: 'Mediterranean salad with lean protein for heart health and recovery.',
            mealType: 'lunch',
            prepTime: 10,
            cookTime: 12,
            servings: 1,
            ingredients: JSON.stringify([
                { name: 'Chicken Breast', amount: 5, unit: 'oz', category: 'protein' },
                { name: 'Romaine Lettuce', amount: 2, unit: 'cup', category: 'vegetable' },
                { name: 'Cucumber', amount: 0.5, unit: 'cup', category: 'vegetable' },
                { name: 'Cherry Tomatoes', amount: 0.5, unit: 'cup', category: 'vegetable' },
                { name: 'Red Onion', amount: 0.25, unit: 'cup', category: 'vegetable' },
                { name: 'Feta Cheese', amount: 0.25, unit: 'cup', category: 'dairy' },
                { name: 'Kalamata Olives', amount: 0.25, unit: 'cup', category: 'fat' },
                { name: 'Olive Oil', amount: 2, unit: 'tbsp', category: 'fat' }
            ]),
            instructions: JSON.stringify([
                'Season and grill chicken until cooked through',
                'Chop romaine and place in large bowl',
                'Add diced cucumber, halved tomatoes, and sliced onion',
                'Top with olives and crumbled feta',
                'Slice grilled chicken and arrange on top',
                'Drizzle with olive oil and lemon juice'
            ]),
            nutrition: JSON.stringify({
                calories: 465,
                protein: 40,
                carbs: 18,
                fat: 26,
                fiber: 6,
                sodium: 720
            }),
            tags: JSON.stringify(['high-protein', 'heart-healthy', 'anti-inflammatory', 'gluten-free']),
            createdAt: new Date().toISOString()
        },
        {
            name: 'Black Bean & Sweet Potato Bowl',
            description: 'Plant-based bowl with complex carbs and fiber for sustained energy.',
            mealType: 'lunch',
            prepTime: 10,
            cookTime: 25,
            servings: 1,
            ingredients: JSON.stringify([
                { name: 'Sweet Potato', amount: 1, unit: 'pieces', category: 'carbs' },
                { name: 'Black Beans', amount: 0.75, unit: 'cup', category: 'protein' },
                { name: 'Brown Rice', amount: 0.5, unit: 'cup', category: 'grain' },
                { name: 'Bell Peppers', amount: 0.5, unit: 'cup', category: 'vegetable' },
                { name: 'Avocado', amount: 0.5, unit: 'pieces', category: 'fat' },
                { name: 'Lime', amount: 0.5, unit: 'pieces', category: 'fruit' },
                { name: 'Cilantro', amount: 2, unit: 'tbsp', category: 'vegetable' }
            ]),
            instructions: JSON.stringify([
                'Dice sweet potato and roast at 425°F for 25 minutes',
                'Cook brown rice according to package directions',
                'Warm black beans with cumin and garlic',
                'Sauté bell peppers until tender',
                'Assemble bowl with rice, beans, sweet potato, and peppers',
                'Top with avocado, cilantro, and lime juice'
            ]),
            nutrition: JSON.stringify({
                calories: 495,
                protein: 18,
                carbs: 78,
                fat: 14,
                fiber: 18,
                sodium: 340
            }),
            tags: JSON.stringify(['vegetarian', 'heart-healthy', 'gut-health', 'dairy-free', 'gluten-free']),
            createdAt: new Date().toISOString()
        },
        {
            name: 'Tuna Salad with Mixed Greens',
            description: 'Omega-3 rich salad with protein for brain health and recovery.',
            mealType: 'lunch',
            prepTime: 8,
            cookTime: 0,
            servings: 1,
            ingredients: JSON.stringify([
                { name: 'Tuna', amount: 5, unit: 'oz', category: 'protein' },
                { name: 'Mixed Greens', amount: 3, unit: 'cup', category: 'vegetable' },
                { name: 'Cherry Tomatoes', amount: 0.5, unit: 'cup', category: 'vegetable' },
                { name: 'Cucumber', amount: 0.5, unit: 'cup', category: 'vegetable' },
                { name: 'Hard-Boiled Eggs', amount: 2, unit: 'pieces', category: 'protein' },
                { name: 'Olive Oil', amount: 2, unit: 'tbsp', category: 'fat' },
                { name: 'Lemon', amount: 0.5, unit: 'pieces', category: 'fruit' }
            ]),
            instructions: JSON.stringify([
                'Drain tuna and place in large bowl with mixed greens',
                'Halve cherry tomatoes and dice cucumber',
                'Slice hard-boiled eggs',
                'Add all vegetables to bowl',
                'Drizzle with olive oil and lemon juice',
                'Toss gently and serve immediately'
            ]),
            nutrition: JSON.stringify({
                calories: 425,
                protein: 45,
                carbs: 12,
                fat: 22,
                fiber: 4,
                sodium: 520
            }),
            tags: JSON.stringify(['high-protein', 'low-carb', 'heart-healthy', 'dairy-free', 'gluten-free']),
            createdAt: new Date().toISOString()
        },
        {
            name: 'Thai Peanut Noodle Bowl',
            description: 'Asian-inspired bowl with vegetables and protein for balanced nutrition.',
            mealType: 'lunch',
            prepTime: 12,
            cookTime: 15,
            servings: 1,
            ingredients: JSON.stringify([
                { name: 'Rice Noodles', amount: 2, unit: 'oz', category: 'grain' },
                { name: 'Chicken Breast', amount: 4, unit: 'oz', category: 'protein' },
                { name: 'Bell Peppers', amount: 0.5, unit: 'cup', category: 'vegetable' },
                { name: 'Carrots', amount: 0.5, unit: 'cup', category: 'vegetable' },
                { name: 'Cabbage', amount: 1, unit: 'cup', category: 'vegetable' },
                { name: 'Peanut Butter', amount: 2, unit: 'tbsp', category: 'fat' },
                { name: 'Soy Sauce', amount: 1, unit: 'tbsp', category: 'protein' },
                { name: 'Lime', amount: 0.5, unit: 'pieces', category: 'fruit' }
            ]),
            instructions: JSON.stringify([
                'Cook rice noodles according to package directions',
                'Sauté chicken until cooked through and slice',
                'Stir-fry peppers, carrots, and cabbage until tender-crisp',
                'Mix peanut butter, soy sauce, and lime juice for sauce',
                'Toss noodles with vegetables and chicken',
                'Pour sauce over bowl and garnish with peanuts'
            ]),
            nutrition: JSON.stringify({
                calories: 495,
                protein: 35,
                carbs: 52,
                fat: 16,
                fiber: 7,
                sodium: 680
            }),
            tags: JSON.stringify(['high-protein', 'dairy-free']),
            createdAt: new Date().toISOString()
        },
        {
            name: 'Caprese Salad with Chicken',
            description: 'Italian-inspired salad with fresh mozzarella and basil for light nutrition.',
            mealType: 'lunch',
            prepTime: 10,
            cookTime: 12,
            servings: 1,
            ingredients: JSON.stringify([
                { name: 'Chicken Breast', amount: 5, unit: 'oz', category: 'protein' },
                { name: 'Fresh Mozzarella', amount: 3, unit: 'oz', category: 'dairy' },
                { name: 'Tomatoes', amount: 2, unit: 'pieces', category: 'vegetable' },
                { name: 'Fresh Basil', amount: 0.25, unit: 'cup', category: 'vegetable' },
                { name: 'Balsamic Vinegar', amount: 2, unit: 'tbsp', category: 'fat' },
                { name: 'Olive Oil', amount: 1, unit: 'tbsp', category: 'fat' },
                { name: 'Mixed Greens', amount: 2, unit: 'cup', category: 'vegetable' }
            ]),
            instructions: JSON.stringify([
                'Grill chicken breast until cooked through',
                'Slice tomatoes and mozzarella into rounds',
                'Arrange greens on plate',
                'Alternate tomato and mozzarella slices',
                'Top with sliced grilled chicken',
                'Drizzle with balsamic vinegar and olive oil, garnish with basil'
            ]),
            nutrition: JSON.stringify({
                calories: 445,
                protein: 42,
                carbs: 14,
                fat: 24,
                fiber: 3,
                sodium: 420
            }),
            tags: JSON.stringify(['high-protein', 'heart-healthy', 'gluten-free']),
            createdAt: new Date().toISOString()
        },
        {
            name: 'Lentil Soup with Whole Grain Bread',
            description: 'Hearty plant-based soup with fiber and protein for sustained energy.',
            mealType: 'lunch',
            prepTime: 10,
            cookTime: 30,
            servings: 1,
            ingredients: JSON.stringify([
                { name: 'Red Lentils', amount: 0.5, unit: 'cup', category: 'protein' },
                { name: 'Carrots', amount: 0.5, unit: 'cup', category: 'vegetable' },
                { name: 'Celery', amount: 0.5, unit: 'cup', category: 'vegetable' },
                { name: 'Onion', amount: 0.25, unit: 'cup', category: 'vegetable' },
                { name: 'Vegetable Broth', amount: 2, unit: 'cup', category: 'vegetable' },
                { name: 'Whole Grain Bread', amount: 2, unit: 'slices', category: 'grain' },
                { name: 'Olive Oil', amount: 1, unit: 'tbsp', category: 'fat' }
            ]),
            instructions: JSON.stringify([
                'Sauté diced onion, carrots, and celery in olive oil',
                'Add lentils and vegetable broth',
                'Bring to boil, then simmer 25-30 minutes',
                'Season with salt, pepper, and cumin',
                'Toast whole grain bread',
                'Serve soup hot with toasted bread on side'
            ]),
            nutrition: JSON.stringify({
                calories: 425,
                protein: 22,
                carbs: 68,
                fat: 8,
                fiber: 16,
                sodium: 620
            }),
            tags: JSON.stringify(['vegetarian', 'heart-healthy', 'gut-health', 'dairy-free']),
            createdAt: new Date().toISOString()
        },
        {
            name: 'Shrimp & Avocado Salad',
            description: 'Light protein-rich salad with healthy fats for recovery and performance.',
            mealType: 'lunch',
            prepTime: 10,
            cookTime: 8,
            servings: 1,
            ingredients: JSON.stringify([
                { name: 'Shrimp', amount: 6, unit: 'oz', category: 'protein' },
                { name: 'Mixed Greens', amount: 3, unit: 'cup', category: 'vegetable' },
                { name: 'Avocado', amount: 1, unit: 'pieces', category: 'fat' },
                { name: 'Cherry Tomatoes', amount: 0.5, unit: 'cup', category: 'vegetable' },
                { name: 'Cucumber', amount: 0.5, unit: 'cup', category: 'vegetable' },
                { name: 'Lime', amount: 1, unit: 'pieces', category: 'fruit' },
                { name: 'Olive Oil', amount: 1, unit: 'tbsp', category: 'fat' }
            ]),
            instructions: JSON.stringify([
                'Season shrimp with salt, pepper, and garlic powder',
                'Sauté shrimp in olive oil 2-3 minutes per side',
                'Arrange mixed greens in large bowl',
                'Add diced avocado, tomatoes, and cucumber',
                'Top with cooked shrimp',
                'Drizzle with lime juice and olive oil'
            ]),
            nutrition: JSON.stringify({
                calories: 425,
                protein: 38,
                carbs: 22,
                fat: 22,
                fiber: 12,
                sodium: 520
            }),
            tags: JSON.stringify(['high-protein', 'low-carb', 'heart-healthy', 'dairy-free', 'gluten-free']),
            createdAt: new Date().toISOString()
        },

        // SNACK MEALS (14)
        {
            name: 'Apple Slices with Almond Butter',
            description: 'Quick energy snack with fiber and healthy fats for sustained fuel.',
            mealType: 'snack',
            prepTime: 3,
            cookTime: 0,
            servings: 1,
            ingredients: JSON.stringify([
                { name: 'Apple', amount: 1, unit: 'pieces', category: 'fruit' },
                { name: 'Almond Butter', amount: 2, unit: 'tbsp', category: 'fat' },
                { name: 'Cinnamon', amount: 0.25, unit: 'tsp', category: 'fruit' }
            ]),
            instructions: JSON.stringify([
                'Wash and core apple',
                'Slice apple into 8-10 wedges',
                'Spread almond butter on each slice',
                'Sprinkle with cinnamon',
                'Serve immediately'
            ]),
            nutrition: JSON.stringify({
                calories: 245,
                protein: 7,
                carbs: 28,
                fat: 14,
                fiber: 6,
                sodium: 5
            }),
            tags: JSON.stringify(['energy-boost', 'heart-healthy', 'vegetarian', 'dairy-free', 'gluten-free']),
            createdAt: new Date().toISOString()
        },
        {
            name: 'Greek Yogurt with Honey & Walnuts',
            description: 'Protein-rich snack with probiotics for gut health and recovery.',
            mealType: 'snack',
            prepTime: 3,
            cookTime: 0,
            servings: 1,
            ingredients: JSON.stringify([
                { name: 'Greek Yogurt', amount: 0.75, unit: 'cup', category: 'dairy' },
                { name: 'Honey', amount: 1, unit: 'tbsp', category: 'carbs' },
                { name: 'Walnuts', amount: 0.25, unit: 'cup', category: 'fat' }
            ]),
            instructions: JSON.stringify([
                'Place Greek yogurt in bowl',
                'Drizzle honey over yogurt',
                'Chop walnuts and sprinkle on top',
                'Mix gently and serve'
            ]),
            nutrition: JSON.stringify({
                calories: 285,
                protein: 15,
                carbs: 24,
                fat: 14,
                fiber: 2,
                sodium: 65
            }),
            tags: JSON.stringify(['high-protein', 'gut-health', 'recovery', 'vegetarian']),
            createdAt: new Date().toISOString()
        },
        {
            name: 'Hummus with Veggie Sticks',
            description: 'Plant-based protein snack with fiber for sustained energy.',
            mealType: 'snack',
            prepTime: 5,
            cookTime: 0,
            servings: 1,
            ingredients: JSON.stringify([
                { name: 'Hummus', amount: 0.5, unit: 'cup', category: 'protein' },
                { name: 'Carrots', amount: 1, unit: 'cup', category: 'vegetable' },
                { name: 'Celery', amount: 1, unit: 'cup', category: 'vegetable' },
                { name: 'Bell Peppers', amount: 0.5, unit: 'cup', category: 'vegetable' }
            ]),
            instructions: JSON.stringify([
                'Wash all vegetables thoroughly',
                'Cut carrots and celery into sticks',
                'Slice bell peppers into strips',
                'Place hummus in serving bowl',
                'Arrange vegetable sticks around hummus'
            ]),
            nutrition: JSON.stringify({
                calories: 220,
                protein: 8,
                carbs: 28,
                fat: 9,
                fiber: 10,
                sodium: 320
            }),
            tags: JSON.stringify(['vegetarian', 'heart-healthy', 'gut-health', 'dairy-free', 'gluten-free']),
            createdAt: new Date().toISOString()
        },
        {
            name: 'Trail Mix with Dried Fruit',
            description: 'Energy-dense snack with nuts and dried fruit for quick fuel.',
            mealType: 'snack',
            prepTime: 2,
            cookTime: 0,
            servings: 1,
            ingredients: JSON.stringify([
                { name: 'Almonds', amount: 0.25, unit: 'cup', category: 'fat' },
                { name: 'Cashews', amount: 0.25, unit: 'cup', category: 'fat' },
                { name: 'Dried Cranberries', amount: 2, unit: 'tbsp', category: 'fruit' },
                { name: 'Dark Chocolate Chips', amount: 2, unit: 'tbsp', category: 'carbs' },
                { name: 'Pumpkin Seeds', amount: 2, unit: 'tbsp', category: 'fat' }
            ]),
            instructions: JSON.stringify([
                'Combine all ingredients in bowl',
                'Mix well to distribute evenly',
                'Portion into serving size',
                'Store remainder in airtight container'
            ]),
            nutrition: JSON.stringify({
                calories: 385,
                protein: 11,
                carbs: 32,
                fat: 25,
                fiber: 6,
                sodium: 10
            }),
            tags: JSON.stringify(['energy-boost', 'heart-healthy', 'vegetarian', 'dairy-free', 'gluten-free']),
            createdAt: new Date().toISOString()
        },
        {
            name: 'Protein Energy Balls',
            description: 'No-bake protein snack with natural ingredients for quick energy.',
            mealType: 'snack',
            prepTime: 10,
            cookTime: 0,
            servings: 1,
            ingredients: JSON.stringify([
                { name: 'Rolled Oats', amount: 0.5, unit: 'cup', category: 'grain' },
                { name: 'Peanut Butter', amount: 0.25, unit: 'cup', category: 'fat' },
                { name: 'Honey', amount: 2, unit: 'tbsp', category: 'carbs' },
                { name: 'Protein Powder', amount: 2, unit: 'tbsp', category: 'protein' },
                { name: 'Dark Chocolate Chips', amount: 2, unit: 'tbsp', category: 'carbs' },
                { name: 'Chia Seeds', amount: 1, unit: 'tbsp', category: 'fat' }
            ]),
            instructions: JSON.stringify([
                'Mix all ingredients in bowl until well combined',
                'Roll mixture into 6-8 small balls',
                'Refrigerate 30 minutes to firm up',
                'Store in airtight container',
                'Eat 2-3 balls per serving'
            ]),
            nutrition: JSON.stringify({
                calories: 340,
                protein: 16,
                carbs: 38,
                fat: 15,
                fiber: 6,
                sodium: 95
            }),
            tags: JSON.stringify(['high-protein', 'energy-boost', 'vegetarian']),
            createdAt: new Date().toISOString()
        },
        {
            name: 'Cottage Cheese with Berries',
            description: 'High-protein snack with antioxidants for muscle recovery.',
            mealType: 'snack',
            prepTime: 3,
            cookTime: 0,
            servings: 1,
            ingredients: JSON.stringify([
                { name: 'Cottage Cheese', amount: 0.75, unit: 'cup', category: 'dairy' },
                { name: 'Mixed Berries', amount: 0.5, unit: 'cup', category: 'fruit' },
                { name: 'Honey', amount: 1, unit: 'tsp', category: 'carbs' }
            ]),
            instructions: JSON.stringify([
                'Place cottage cheese in bowl',
                'Top with fresh mixed berries',
                'Drizzle with honey',
                'Mix gently and serve'
            ]),
            nutrition: JSON.stringify({
                calories: 185,
                protein: 20,
                carbs: 20,
                fat: 3,
                fiber: 3,
                sodium: 450
            }),
            tags: JSON.stringify(['high-protein', 'recovery', 'gut-health', 'vegetarian', 'gluten-free']),
            createdAt: new Date().toISOString()
        },
        {
            name: 'Rice Cakes with Avocado',
            description: 'Light snack with healthy fats for sustained energy.',
            mealType: 'snack',
            prepTime: 5,
            cookTime: 0,
            servings: 1,
            ingredients: JSON.stringify([
                { name: 'Rice Cakes', amount: 2, unit: 'pieces', category: 'grain' },
                { name: 'Avocado', amount: 0.5, unit: 'pieces', category: 'fat' },
                { name: 'Everything Bagel Seasoning', amount: 0.5, unit: 'tsp', category: 'grain' },
                { name: 'Lemon', amount: 0.25, unit: 'pieces', category: 'fruit' }
            ]),
            instructions: JSON.stringify([
                'Mash avocado in small bowl',
                'Add squeeze of lemon juice and mix',
                'Spread avocado evenly on rice cakes',
                'Sprinkle with everything bagel seasoning',
                'Serve immediately'
            ]),
            nutrition: JSON.stringify({
                calories: 180,
                protein: 4,
                carbs: 20,
                fat: 10,
                fiber: 6,
                sodium: 180
            }),
            tags: JSON.stringify(['heart-healthy', 'vegetarian', 'dairy-free', 'gluten-free']),
            createdAt: new Date().toISOString()
        },
        {
            name: 'Hard-Boiled Eggs with Everything Seasoning',
            description: 'Protein-packed portable snack for muscle recovery.',
            mealType: 'snack',
            prepTime: 2,
            cookTime: 12,
            servings: 1,
            ingredients: JSON.stringify([