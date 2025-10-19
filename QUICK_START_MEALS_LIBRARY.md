# 🚀 Quick Start: Meals Library Integration

## What This Does

Your 56 WHOOP-optimized meals from the PDF are now integrated into your app! The system will:

1. ✅ **Use pre-defined meals** from your library (FAST - 1-2 seconds)
2. ✅ **Automatically generate images** with AWS Titan G1V2
3. ✅ **Fall back to Claude** if more variety is needed
4. ✅ **Save costs** by reusing meals instead of generating new ones every time

---

## 🎯 3-Step Setup

### Step 1: Populate the Database (1 minute)

Run this command to upload all 56 meals to DynamoDB:

```bash
npx tsx src/scripts/seedMealsLibrary.ts
```

**Expected Output:**
```
🚀 Starting meals library seed...
📊 Total meals to upload: 56
📋 Meal distribution:
   Breakfast: 14
   Lunch: 14
   Snacks: 14
   Dinner: 14

✅ Uploaded batch 1/3
✅ Uploaded batch 2/3
✅ Uploaded batch 3/3
✅ All meals uploaded successfully!
```

### Step 2: Generate All Images (5-10 minutes)

Run this automated script to generate images for all meals:

```bash
npx tsx src/scripts/generateAllMealImages.ts
```

**What it does:**
- Generates professional food photography for each meal
- Uses AWS Titan Image Generator V2
- Uploads images to S3 automatically
- Processes in batches of 5 (safe and efficient)
- Shows progress for each batch

**Expected Output:**
```
🚀 Starting automated image generation for meals library...

📸 Processing Batch 1...
✅ Batch 1 completed:
   - Processed: 5 meals
   - Failed: 0 meals
   - Remaining: 51 meals
   - Total in library: 56 meals

⏳ Waiting 3 seconds before next batch...

📸 Processing Batch 2...
...

🎉 All images generated successfully!

📊 GENERATION SUMMARY
Total Batches Processed: 12
Total Images Generated: 56
Total Failures: 0
Success Rate: 100.0%
```

### Step 3: Test It! (30 seconds)

1. Go to **`/plan-ahead`** page
2. Click **"Generate Meals"** button
3. Watch it generate meals in ~2 seconds instead of 3-5 minutes! ⚡

---

## 🔍 How to Verify It's Working

### Check Database
Visit AWS DynamoDB Console → `meals_library` table → Should show 56 items

### Check Logs
When generating meals, look for this in your console:
```
[GENERATE] Fetching meals from library...
[GENERATE] Found 56 meals in library
[GENERATE] Using meals from library (enough meals available)
[GENERATE] Selected 28 meals from library
```

If you see `"Using meals from library"` - it's working! 🎉

### Check Images
- All meal cards on plan-ahead page should show images
- Images should load from your S3 bucket
- Format: `https://[bucket].s3.[region].amazonaws.com/meal-images/...`

---

## 📋 Your 56 Meals Overview

From your PDF, we have:

### Breakfast (14 meals)
- Blueberry Almond Overnight Oats
- Spinach & Feta Omelette with Whole Grain Toast
- Banana Almond Chia Smoothie
- Avocado & Cottage Cheese Power Toast
- Protein Pancakes with Berries & Kefir
- Turmeric Tofu Scramble with Vegetables
- Sweet Potato & Black Bean Breakfast Bowl
- Greek Yogurt Parfait with Granola & Berries
- Salmon & Cream Cheese Bagel
- Quinoa Breakfast Bowl with Cinnamon & Berries
- Chia Seed Pudding with Mango
- Veggie-Loaded Breakfast Burrito
- Cottage Cheese with Pineapple & Walnuts
- Breakfast Egg Muffins with Vegetables

### Lunch (14 meals)
- Grilled Chicken Caesar Salad
- Mediterranean Quinoa Bowl
- Turkey and Avocado Wrap
- Salmon Teriyaki with Brown Rice and Broccoli
- Black Bean and Sweet Potato Burrito Bowl
- Greek Chicken Gyro with Tzatziki
- Thai Peanut Noodle Bowl with Chicken
- Caprese Sandwich with Balsamic Glaze
- Tuna Poke Bowl
- Chicken and Vegetable Stir-Fry
- Lentil and Vegetable Soup
- Shrimp Tacos with Lime Crema
- Chickpea Salad Sandwich
- BBQ Pulled Chicken Bowl

### Snacks (14 meals)
- Apple Slices with Peanut Butter
- Hummus and Veggie Sticks
- Greek Yogurt with Honey and Nuts
- Trail Mix Energy Balls
- Banana with Almond Butter
- Hard-Boiled Eggs with Everything Bagel Seasoning
- Cheese and Whole Grain Crackers
- Edamame with Sea Salt
- Avocado Toast Bites
- Protein Shake
- Rice Cakes with Cottage Cheese and Berries
- Dark Chocolate and Almonds
- Celery Sticks with Cream Cheese
- Roasted Chickpeas

### Dinner (14 meals)
- Grilled Steak with Roasted Vegetables
- Baked Salmon with Asparagus and Quinoa
- Chicken Breast with Sweet Potato and Green Beans
- Shrimp Stir-Fry with Brown Rice
- Turkey Meatballs with Zucchini Noodles
- Beef and Broccoli Stir-Fry
- Baked Cod with Roasted Brussels Sprouts
- Chicken Fajita Bowl
- Pork Tenderloin with Roasted Root Vegetables
- Vegetarian Lentil Curry
- Grilled Chicken with Cauliflower Rice and Avocado
- Baked Chicken Parmesan with Whole Wheat Pasta
- Tuna Steak with Quinoa and Sautéed Spinach
- Stuffed Bell Peppers with Ground Turkey

---

## 🎨 About the Images

Each meal image is generated with this strategy:

**Prompt Template:**
```
Professional food photography of [MEAL NAME]: [DESCRIPTION]. 
Beautifully plated on a white ceramic dish, garnished elegantly, 
natural daylight, high resolution, appetizing, gourmet presentation, 
top-down view
```

**Quality:**
- Resolution: 512x512 (perfect for meal cards)
- Quality: Premium
- Model: AWS Titan Image Generator V2
- Style: Professional food photography

---

## ⚡ Performance Comparison

### Before Integration
- **Meal Generation**: 30-45 seconds (Claude AI)
- **Image Generation**: 140-280 seconds (5-10s per image × 28)
- **Total Time**: 3-5 minutes per meal plan
- **Cost**: ~$0.10-0.15 per meal plan

### After Integration
- **Meal Selection**: 1-2 seconds (from library)
- **Images**: 0 seconds (pre-generated)
- **Total Time**: 1-2 seconds per meal plan ⚡
- **Cost**: ~$0.00 per meal plan (after initial setup)

**Result**: 150x faster + significant cost savings!

---

## 🔧 Optional: Add More Meals

Want to add more meals to your library? Easy!

1. Edit `src/scripts/seedMealsLibrary.ts`
2. Add new meal objects to the `meals` array:

```typescript
{
  id: uuidv4(),
  name: "Your New Meal",
  mealType: "breakfast", // or lunch, snacks, dinner
  description: "Brief description",
  prepTime: 10,
  cookTime: 15,
  servings: 2,
  ingredients: [
    { name: "ingredient 1", quantity: 1, unit: "cup", category: "cupboard" }
  ],
  instructions: [
    "Step 1",
    "Step 2"
  ],
  nutrition: {
    calories: 400,
    protein: 25,
    carbs: 45,
    fat: 12,
    fiber: 8,
    sugar: 10,
    sodium: 350
  },
  tags: ["high-protein", "quick"],
  imageUrl: "",
  createdAt: new Date().toISOString()
}
```

3. Run the seed script again
4. Run the image generation script to create images for new meals

---

## 🐛 Troubleshooting

### "meals_library table not found"
Check your DynamoDB table name - it should be exactly `meals_library`

### Images not generating
1. Check AWS credentials in `.env`
2. Verify S3 bucket name: `AWS_S3_BUCKET_NAME`
3. Ensure AWS Titan is available in your region

### Still using Claude instead of library
1. Verify you have 56 meals in the database
2. Check meal type distribution (should have 14 of each)
3. Look for this log: `[GENERATE] Using meals from library`

---

## 📚 Additional Documentation

- **Full Integration Guide**: `MEALS_LIBRARY_INTEGRATION.md`
- **API Reference**: See integration guide for endpoint details
- **Meal Data Structure**: Check `src/scripts/seedMealsLibrary.ts`

---

## ✅ Checklist

- [ ] Run seed script to populate 56 meals
- [ ] Run image generation script for all meals
- [ ] Test meal generation on `/plan-ahead` page
- [ ] Verify images are loading correctly
- [ ] Check console logs for "Using meals from library"
- [ ] Celebrate the speed improvement! 🎉

---

## 🎉 You're All Set!

Your WHOOP-optimized meals are now integrated and ready to use. The system will automatically select from your library, making meal planning instant and cost-effective.

**Questions?** Check `MEALS_LIBRARY_INTEGRATION.md` for detailed documentation.

---

**Last Updated**: January 2025  
**Setup Time**: ~10 minutes  
**Performance Gain**: 150x faster