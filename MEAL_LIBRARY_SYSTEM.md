# Meal Library System - Complete Implementation

## 🎯 System Overview

The meal library system has been successfully implemented with the following key features:

### ✅ **Persistent Meal Generation**
- Meals are generated **ONCE** and stored persistently
- No weekly regeneration - meals stay until user clicks "Get New Meals"
- Each meal appears **only ONCE** per week (unique meal constraint)

### ✅ **WHOOP Data Integration**
- AWS Bedrock Claude 3.5 Sonnet v2 analyzes WHOOP health data
- Selects optimal meals from library based on:
  - Recovery status (poor/good/excellent)
  - Fatigue level (low/moderate/high)
  - Sleep quality
  - Metabolic demand
  - Nutritional recommendations

### ✅ **AWS Titan G1V2 Image Generation**
- Automatically generates high-quality meal images
- Images stored in S3 bucket with permanent URLs
- One-time generation per meal (no regeneration needed)

### ✅ **Complete Database Structure**
- MySQL/RDS database with comprehensive meal schema
- Supports your exact meal format with all fields
- Proper indexing for fast queries

## 📊 Database Schema

```sql
meals table:
- id (primary key)
- meal_id (B-0001, L-0001, etc.)
- meal_name
- tagline
- prep_time
- meal_type (Breakfast, Lunch, Dinner, Snack, Lunch/Dinner)
- tags (JSON array)
- serving_size
- ingredients (JSON with serving_size and list)
- method (JSON array of steps)
- nutrition_summary
- nutrition_details (JSON with serving_unit, summary, details)
- why_this_meal
- image_url (AWS S3 URL)
- created_at, updated_at
```

## 🔄 Meal Generation Flow

1. **User clicks "Generate Meal Plan" or "Get New Meals"**
2. **System fetches WHOOP data** (last 7 days or available data)
3. **Bedrock analyzes health patterns** and creates selection criteria
4. **System queries meal library** with WHOOP-based filters
5. **Selects 28 unique meals** (4 per day × 7 days)
6. **Returns meals with pre-generated images**
7. **Persists meal plan** until next regeneration

## 📁 File Structure

```
src/
├── app/api/meals/
│   ├── upload-csv/route.ts          # CSV upload endpoint
│   ├── generate-images/route.ts     # Titan image generation
│   └── library/route.ts             # Meal library queries
├── app/api/plan-ahead/
│   └── generate-from-library/route.ts # WHOOP-based meal selection
├── app/admin/meal-library/page.tsx   # Admin interface
├── components/MealLibraryUpload.tsx  # CSV upload UI
├── db/
│   ├── mysql-schema.ts              # Database schema
│   └── mysql-connection.ts          # Database connection
└── lib/
    ├── meal-library-service.ts      # Core meal selection logic
    └── image-generation.ts          # AWS Titan integration
```

## 🚀 Setup Instructions

### 1. Database Setup
```bash
npm run db:generate  # Generate migrations
npm run db:migrate   # Apply to database
```

### 2. Upload Meals
1. Visit `/admin/meal-library`
2. Upload `sample-meals.csv` or your own CSV
3. System automatically generates images with AWS Titan G1V2

### 3. Test System
1. Visit `/plan-ahead`
2. Click "Generate Meal Plan"
3. System selects meals based on WHOOP data
4. Meals persist until "Get New Meals" is clicked

## 📋 CSV Format

Your exact format is supported:

```csv
meal_id,meal_name,meal_type,tagline,prep_time,ingredients,method,nutrition,why_this_meal,tags
B-0001,Blueberry Almond Overnight Oats,Breakfast,Fiber & Probiotic Power Bowl,5 minutes (plus 6+ hours refrigeration),"{"serving_size": "1 serving", "list": [{"item": "Rolled oats", "quantity": "1/2 cup"}]}","["step 1: In a jar or bowl, combine oats..."]","{"serving_unit": "per 1 serving", "summary": "High in protein...", "details": {"Calories": "380 kcal"}}",This make-ahead breakfast combines...,"["Recovery", "Energy", "Better Performance"]"
```

## 🎯 Key Features

### **Meal Uniqueness**
- Each meal appears only once per week
- No duplicates across the 28-meal plan
- Proper variety across meal types

### **WHOOP Integration**
- Recovery-focused meals for poor recovery days
- Energy-boosting meals for high fatigue
- Anti-inflammatory meals for poor sleep
- Performance meals for excellent recovery

### **Image Management**
- AWS Titan G1V2 generates realistic food images
- Images stored permanently in S3
- No regeneration needed - one-time creation

### **Persistent Storage**
- Meals saved to `persistentMealPlan` in localStorage
- Database backup for meal plans
- Only changes when user requests new meals

## 🔧 Environment Variables

Required in `.env.local`:

```env
# Database
RDS_HOST=your-rds-host
RDS_PORT=3306
RDS_USER=admin
RDS_PASSWORD=your-password
RDS_DATABASE=scuzi_meals

# AWS
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
AWS_REGION=us-east-1
S3_BUCKET_MEALS=scuzi-meals

# Bedrock
AWS_BEARER_TOKEN_BEDROCK=your-bedrock-token
```

## 🎉 System Benefits

1. **Performance**: No weekly regeneration overhead
2. **Consistency**: Same meals until user wants change
3. **Personalization**: WHOOP data drives meal selection
4. **Quality**: Pre-generated high-quality images
5. **Uniqueness**: Each meal appears only once per week
6. **Scalability**: Easy to add more meals to library

The system is now ready for production use! 🚀