# Plan Ahead Strategy - Meal Selection from Library

## Overview
The Plan Ahead page will use Claude 3.5 Sonnet v2 to intelligently select meals from our existing meals library database based on WHOOP health data. No new recipe creation - only smart selection and recommendation.

## Architecture

### 1. Data Sources
- **WHOOP Health Data**: Recovery score, strain, sleep, calories burned, HRV
- **Meals Library Database**: All AI-generated recipes stored from chat history
- **User Preferences**: Dietary restrictions, cuisine preferences, meal types

### 2. Claude 3.5 Sonnet Role
**Input**: WHOOP data + Available meals from library
**Output**: Curated meal selections with reasoning
**NO**: Recipe creation or modification

### 3. Workflow
```
1. Fetch WHOOP data for user
2. Query meals library with filters (dietary preferences, etc.)
3. Send to Claude with prompt: "Select best meals for this health profile"
4. Claude returns meal IDs with reasoning
5. Display selected meals with health-based explanations
```

## Implementation Plan

### Phase 1: Meal Library Query Enhancement
- Add advanced filtering by nutrition (high-protein, low-carb, etc.)
- Add WHOOP-specific tags (recovery, high-strain, sleep-support)
- Create meal scoring system based on nutritional density

### Phase 2: Claude Integration
- Create specialized prompt for meal selection (not creation)
- Include WHOOP metrics in decision-making
- Return meal recommendations with health reasoning

### Phase 3: Image Generation for Selected Meals
- Use AWS Titan G1V2 to generate images for library meals that don't have images
- Store generated images back to S3 and update meal records
- Ensure all recommended meals have appealing visuals

## Benefits
- **Reliability**: No risk of recipe generation failures
- **Consistency**: All meals are pre-validated and stored
- **Performance**: Fast selection vs. slow generation
- **Quality**: Curated library of proven recipes
- **Scalability**: Library grows automatically from chat interactions

## Next Steps
1. Enhance meals library API with WHOOP-specific filtering
2. Create Claude meal selection prompt
3. Implement Plan Ahead page with library-based recommendations
4. Add image generation for meals without images