const fs = require('fs');
const path = require('path');

// Read the CSV file
const csvFile = process.argv[2] || './meals-1.csv';
console.log(`🔄 Processing ${csvFile} into proper format...\n`);

const csvContent = fs.readFileSync(csvFile, 'utf8');
const lines = csvContent.split('\n').filter(line => line.trim());

if (lines.length === 0) {
  console.error('❌ CSV file is empty');
  process.exit(1);
}

// Parse header to understand the structure
const header = lines[0].split(',');
console.log('📋 CSV Structure Analysis:');
console.log(`   - Total columns: ${header.length}`);
console.log(`   - Total meals: ${lines.length - 1}`);

// Process each meal
const processedMeals = [];

for (let i = 1; i < lines.length; i++) {
  const values = parseCSVLine(lines[i]);
  
  if (values.length < 5) {
    console.log(`⚠️  Skipping row ${i + 1}: insufficient data`);
    continue;
  }

  try {
    const meal = processMealRow(header, values, i + 1);
    if (meal) {
      processedMeals.push(meal);
      console.log(`✅ Processed: ${meal.meal_name} (${meal.meal_type})`);
    }
  } catch (error) {
    console.error(`❌ Error processing row ${i + 1}:`, error.message);
  }
}

// Save processed meals to a new CSV file
const outputFileName = csvFile.replace('.csv', '-processed.csv');
const outputCSV = createOutputCSV(processedMeals);
fs.writeFileSync(outputFileName, outputCSV);

console.log(`\n🎉 Processing complete!`);
console.log(`   - Successfully processed: ${processedMeals.length} meals`);
console.log(`   - Output saved to: ${outputFileName}`);
console.log(`\n📋 Meal Types Distribution:`);

const mealTypes = {};
processedMeals.forEach(meal => {
  mealTypes[meal.meal_type] = (mealTypes[meal.meal_type] || 0) + 1;
});

Object.entries(mealTypes).forEach(([type, count]) => {
  console.log(`   - ${type}: ${count} meals`);
});

console.log(`\n🚀 Next steps:`);
console.log(`   1. Fix database connection in .env.local`);
console.log(`   2. Run: npm run db:migrate`);
console.log(`   3. Visit: /admin/meal-library`);
console.log(`   4. Upload: ${outputFileName}`);

// Helper functions
function parseCSVLine(line) {
  const values = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  values.push(current.trim());
  return values;
}

function processMealRow(header, values, rowNum) {
  // Basic meal info
  const meal = {
    meal_id: values[0] || `MEAL-${rowNum}`,
    meal_name: values[1] || `Meal ${rowNum}`,
    tagline: values[2] || '',
    prep_time: values[3] || '15 minutes',
    meal_type: values[4] || 'Snack',
  };

  // Process tags (columns 5, 6, 7)
  const tags = [];
  if (values[5]) tags.push(values[5]);
  if (values[6]) tags.push(values[6]);
  if (values[7]) tags.push(values[7]);
  
  // Process ingredients
  const ingredients = {
    serving_size: values[8] || '1 serving',
    list: []
  };

  // Extract ingredients (pairs of item/quantity starting from column 9)
  for (let i = 9; i < values.length; i += 2) {
    const item = values[i];
    const quantity = values[i + 1];
    
    if (item && item.trim() && !item.startsWith('step ')) {
      ingredients.list.push({
        item: item.trim(),
        quantity: quantity || 'as needed'
      });
    } else if (item && item.startsWith('step ')) {
      // We've reached the method section
      break;
    }
  }

  // Process method (find step columns)
  const method = [];
  for (let i = 0; i < values.length; i++) {
    const value = values[i];
    if (value && value.startsWith('step ')) {
      method.push(value);
    }
  }

  // Process nutrition (look for nutrition columns)
  const nutrition = {
    serving_unit: 'per 1 serving',
    summary: 'Nutritious and balanced meal',
    details: {}
  };

  // Find nutrition details in the row
  const nutritionStartIdx = header.findIndex(col => col.includes('nutrition/details/Calories'));
  if (nutritionStartIdx > -1 && values[nutritionStartIdx]) {
    nutrition.details.Calories = values[nutritionStartIdx];
    nutrition.details.Protein = values[nutritionStartIdx + 1] || '15 g';
    nutrition.details.Carbs = values[nutritionStartIdx + 2] || '30 g';
    nutrition.details.Fiber = values[nutritionStartIdx + 3] || '5 g';
    nutrition.details.Fat = values[nutritionStartIdx + 4] || '10 g';
    nutrition.details.Saturated_Fat = values[nutritionStartIdx + 5] || '2 g';
    nutrition.details.Sugars = values[nutritionStartIdx + 6] || '8 g';
    nutrition.details.Sodium = values[nutritionStartIdx + 7] || '300 mg';
  }

  // Find nutrition summary
  const summaryIdx = header.findIndex(col => col.includes('nutrition/summary'));
  if (summaryIdx > -1 && values[summaryIdx]) {
    nutrition.summary = values[summaryIdx];
  }

  // Find why_this_meal
  const whyIdx = header.findIndex(col => col.includes('why_this_meal'));
  let why_this_meal = '';
  if (whyIdx > -1 && values[whyIdx]) {
    why_this_meal = values[whyIdx];
  }

  return {
    ...meal,
    tags: JSON.stringify(tags),
    ingredients: JSON.stringify(ingredients),
    method: JSON.stringify(method),
    nutrition: JSON.stringify(nutrition),
    why_this_meal
  };
}

function createOutputCSV(meals) {
  const headers = ['meal_id', 'meal_name', 'meal_type', 'tagline', 'prep_time', 'ingredients', 'method', 'nutrition', 'why_this_meal', 'tags'];
  
  let csv = headers.join(',') + '\n';
  
  meals.forEach(meal => {
    const row = headers.map(header => {
      let value = meal[header] || '';
      // Escape quotes and wrap in quotes if contains comma
      if (value.includes(',') || value.includes('"') || value.includes('\n')) {
        value = '"' + value.replace(/"/g, '""') + '"';
      }
      return value;
    });
    csv += row.join(',') + '\n';
  });
  
  return csv;
}