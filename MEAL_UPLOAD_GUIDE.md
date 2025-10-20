# Scuzi Meal Library Upload & Image Generation Guide

## 🎯 Project Overview

This system allows you to upload your 56 meals to the Scuzi Meals Library and generate AI images for each meal using the G1 V2 model. Once complete, the enhanced Plan Ahead feature will use Claude 3.5 Sonnet V2 with WHOOP data integration to intelligently select meals from your 100+ meal database.

## 🚀 Quick Start

### 1. Access Admin Dashboard
Navigate to: `http://localhost:3003/admin`

### 2. Upload Your 56 Meals
1. Go to **Meal Upload** section
2. Click "Load Sample" to see the exact format
3. Replace with your meal data in JSON format
4. Click "Upload Meals"

### 3. Generate Images
1. Go to **Image Generation** section  
2. Click "Generate All Missing Images"
3. Monitor progress and results

### 4. Test Enhanced Plan Ahead
1. Go to **Plan Ahead Testing**
2. Test the new WHOOP + Claude integration
3. Verify meal selection from your library

## 📋 Meal Data Format

Each meal should follow this structure:

```json
{
  "meals": [
    {
      "name": "Spaghetti Squash Beef & Lentil Bolognese",
      "tagline": "Low-Carb Veggie Pasta with Hearty Sauce",
      "description": "Brief description of the meal",
      "mealType": "dinner",
      "prepTime": 15,
      "cookTime": 45,
      "servings": 4,
      "ingredients": [
        "Spaghetti squash – 1 large (about 3-4 lbs)",
        "Lean ground beef – 8 oz (90-95% lean)",
        "..."
      ],
      "instructions": [
        "Step 1: Preheat oven to 400°F...",
        "Step 2: Heat olive oil in large pot...",
        "..."
      ],
      "nutrition": {
        "calories": 350,
        "protein": 24,
        "fat": 12,
        "carbs": 40,
        "fiber": 10
      },
      "tags": ["Better Performance", "Recovery", "Better Sleep"],
      "whyHelpful": "Detailed explanation of why this meal is beneficial for WHOOP users..."
    }
  ]
}
```

## 🏷️ Meal Types & Tags

### Meal Types (Required)
- `breakfast` - Morning meals
- `lunch` - Midday meals  
- `dinner` - Evening meals
- `snack` - Snacks and small meals

### Recommended Tags
- `Recovery` - Post-workout recovery
- `Better Sleep` - Sleep optimization
- `Better Performance` - Energy & performance
- `Anti-Inflammatory` - Reduces inflammation
- `High Protein` - Protein-rich meals
- `Low Carb` - Lower carbohydrate content

## 🔧 API Endpoints

### Bulk Upload
```
POST /api/meals/library/bulk-upload
Content-Type: application/json

{
  "meals": [...]
}
```

### Generate Images
```
POST /api/meals/library/generate-images
Content-Type: application/json

{
  "generateAll": true
}
```

### View Library
```
GET /api/meals/library?limit=100&meal_type=dinner&search=protein
```

## 📊 Enhanced Plan Ahead Integration

The updated Plan Ahead system:

1. **Analyzes WHOOP Data**: Recovery, HRV, Sleep, Strain metrics
2. **Smart Meal Selection**: Chooses from 100+ meals based on user needs
3. **Claude 3.5 Sonnet V2**: Enhanced AI reasoning for meal planning
4. **Personalized Recommendations**: Matches meals to recovery goals

### WHOOP Integration Features
- Recovery-focused meal selection when recovery is low
- Energy-boosting meals for high strain days
- Sleep-optimizing meals for poor sleep performance
- Anti-inflammatory options for high stress periods

## 🖼️ Image Generation Process

1. **G1 V2 Model**: Generates professional food photography
2. **S3 Storage**: Images stored in AWS S3 bucket
3. **Automatic Prompts**: AI creates detailed image prompts from meal data
4. **Batch Processing**: Generate all images at once or individually

## 📈 Workflow Steps

1. ✅ **Upload 56 Meals** → Bulk upload to meals library
2. ✅ **Generate Images** → Create AI food photography  
3. ✅ **Test Integration** → Verify WHOOP + Claude integration
4. ✅ **Deploy** → Launch enhanced meal planning

## 🔍 Monitoring & Management

### Admin Dashboard Features
- Real-time upload progress
- Image generation statistics  
- Meal library browser
- API endpoint testing
- System health monitoring

### Database Schema Updates
- Added `imageUrl` field for S3 image storage
- Made `prepTime` and `cookTime` optional
- Enhanced JSON field support for ingredients/instructions

## 🚨 Important Notes

1. **Meal Count**: Upload exactly 56 meals (14 of each type)
2. **Image Quality**: G1 V2 generates high-resolution food photography
3. **WHOOP Integration**: Requires active WHOOP connection for optimal results
4. **Claude Model**: Uses latest Claude 3.5 Sonnet V2 for enhanced reasoning

## 📞 Support

If you encounter any issues:
1. Check the admin dashboard for error messages
2. Verify JSON format using the sample template
3. Monitor API responses for validation errors
4. Test individual meal uploads before bulk operations

---

**Ready to transform your meal planning system!** 🍽️✨