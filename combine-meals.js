const fs = require('fs');

console.log('🔗 Combining both processed meal files...\n');

// Read both processed CSV files
const meals1Content = fs.readFileSync('./processed-meals.csv', 'utf8');
const meals2Content = fs.readFileSync('./meals-2-processed.csv', 'utf8');

// Split into lines
const meals1Lines = meals1Content.split('\n').filter(line => line.trim());
const meals2Lines = meals2Content.split('\n').filter(line => line.trim());

// Get header from first file
const header = meals1Lines[0];

// Get data lines (skip headers)
const meals1Data = meals1Lines.slice(1);
const meals2Data = meals2Lines.slice(1);

// Combine all data
const combinedLines = [header, ...meals1Data, ...meals2Data];
const combinedCSV = combinedLines.join('\n');

// Save combined file
fs.writeFileSync('./all-meals-combined.csv', combinedCSV);

console.log('📊 Combination Results:');
console.log(`   - meals-1.csv: ${meals1Data.length} meals`);
console.log(`   - meals-2.csv: ${meals2Data.length} meals`);
console.log(`   - Combined total: ${meals1Data.length + meals2Data.length} meals`);
console.log(`   - Output file: all-meals-combined.csv`);

// Analyze meal types in combined file
const mealTypes = {};
const mealIds = new Set();
let duplicateIds = [];

[...meals1Data, ...meals2Data].forEach((line, index) => {
  const values = line.split(',');
  const mealId = values[0];
  const mealType = values[2];
  
  // Check for duplicate IDs
  if (mealIds.has(mealId)) {
    duplicateIds.push(mealId);
  } else {
    mealIds.add(mealId);
  }
  
  // Count meal types
  mealTypes[mealType] = (mealTypes[mealType] || 0) + 1;
});

console.log('\n🍽️  Combined Meal Distribution:');
Object.entries(mealTypes).forEach(([type, count]) => {
  console.log(`   - ${type}: ${count} meals`);
});

if (duplicateIds.length > 0) {
  console.log('\n⚠️  Duplicate Meal IDs Found:');
  duplicateIds.forEach(id => console.log(`   - ${id}`));
} else {
  console.log('\n✅ No duplicate meal IDs - all meals are unique!');
}

console.log('\n🎉 Combined file ready for upload!');
console.log('\n🚀 Upload Instructions:');
console.log('   1. Fix database connection in .env.local');
console.log('   2. Run: npm run db:migrate');
console.log('   3. Visit: /admin/meal-library');
console.log('   4. Upload: all-meals-combined.csv (84 meals)');
console.log('\n💡 This single upload will populate your entire meal library!');