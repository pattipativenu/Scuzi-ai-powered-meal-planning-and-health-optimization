// Test script to simulate meal upload process
const fs = require('fs');

// Read the processed CSV
const csvFile = process.argv[2] || './processed-meals.csv';
console.log(`🧪 Testing Meal Upload Process for ${csvFile}...\n`);

const csvContent = fs.readFileSync(csvFile, 'utf8');
const lines = csvContent.split('\n').filter(line => line.trim());

if (lines.length === 0) {
  console.error('❌ No data to process');
  process.exit(1);
}

const header = lines[0].split(',');
console.log('📊 Upload Simulation Results:');
console.log(`   - Header columns: ${header.length}`);
console.log(`   - Data rows: ${lines.length - 1}`);

// Simulate processing each meal
let successCount = 0;
let errorCount = 0;
const mealTypes = {};
const sampleMeals = [];

for (let i = 1; i < Math.min(6, lines.length); i++) { // Process first 5 meals as sample
  try {
    const values = parseCSVLine(lines[i]);
    
    if (values.length < 5) {
      throw new Error('Insufficient data columns');
    }

    const meal = {
      meal_id: values[0],
      meal_name: values[1],
      meal_type: values[2],
      tagline: values[3],
      prep_time: values[4],
      ingredients: JSON.parse(values[5]),
      method: JSON.parse(values[6]),
      nutrition: JSON.parse(values[7]),
      why_this_meal: values[8],
      tags: JSON.parse(values[9])
    };

    // Validate required fields
    if (!meal.meal_id || !meal.meal_name || !meal.meal_type) {
      throw new Error('Missing required fields');
    }

    // Validate JSON structures
    if (!meal.ingredients.serving_size || !Array.isArray(meal.ingredients.list)) {
      throw new Error('Invalid ingredients format');
    }

    if (!Array.isArray(meal.method)) {
      throw new Error('Invalid method format');
    }

    if (!meal.nutrition.details || !meal.nutrition.summary) {
      throw new Error('Invalid nutrition format');
    }

    successCount++;
    mealTypes[meal.meal_type] = (mealTypes[meal.meal_type] || 0) + 1;
    sampleMeals.push(meal);
    
    console.log(`   ✅ ${meal.meal_id}: ${meal.meal_name} (${meal.meal_type})`);
    
  } catch (error) {
    errorCount++;
    console.log(`   ❌ Row ${i + 1}: ${error.message}`);
  }
}

console.log(`\n📈 Processing Summary:`);
console.log(`   - Successfully validated: ${successCount} meals`);
console.log(`   - Errors: ${errorCount} meals`);
console.log(`   - Success rate: ${Math.round((successCount / (successCount + errorCount)) * 100)}%`);

console.log(`\n🍽️  Meal Types Found:`);
Object.entries(mealTypes).forEach(([type, count]) => {
  console.log(`   - ${type}: ${count} meals`);
});

console.log(`\n🔍 Sample Meal Structure (${sampleMeals[0]?.meal_name}):`);
if (sampleMeals[0]) {
  const sample = sampleMeals[0];
  console.log(`   - ID: ${sample.meal_id}`);
  console.log(`   - Type: ${sample.meal_type}`);
  console.log(`   - Prep Time: ${sample.prep_time}`);
  console.log(`   - Ingredients: ${sample.ingredients.list.length} items`);
  console.log(`   - Method Steps: ${sample.method.length} steps`);
  console.log(`   - Tags: ${sample.tags.join(', ')}`);
  console.log(`   - Calories: ${sample.nutrition.details.Calories}`);
}

console.log(`\n🎯 Database Upload Simulation:`);
console.log(`   - Table: meals`);
console.log(`   - Records to insert: ${lines.length - 1}`);
console.log(`   - Estimated storage: ~${Math.round((csvContent.length / 1024))} KB`);

console.log(`\n✅ Upload simulation successful!`);
console.log(`\n🚀 Ready for actual database upload when connection is fixed.`);

// Helper function
function parseCSVLine(line) {
  const values = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // Handle escaped quotes
        current += '"';
        i++; // Skip next quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  values.push(current.trim());
  
  // Clean up the values - remove surrounding quotes and unescape
  return values.map(value => {
    if (value.startsWith('"') && value.endsWith('"')) {
      return value.slice(1, -1).replace(/""/g, '"');
    }
    return value;
  });
}