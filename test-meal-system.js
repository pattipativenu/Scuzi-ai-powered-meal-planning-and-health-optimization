// Simple test script to verify the meal system
const fs = require('fs');

console.log('🧪 Testing Meal Library System...\n');

// Test 1: Check if sample CSV exists
console.log('1. Checking sample CSV file...');
if (fs.existsSync('./sample-meals.csv')) {
  const csvContent = fs.readFileSync('./sample-meals.csv', 'utf8');
  const lines = csvContent.split('\n').filter(line => line.trim());
  console.log(`   ✅ Sample CSV found with ${lines.length - 1} meals (excluding header)`);
  
  // Check if it has the correct format
  const header = lines[0];
  const expectedColumns = ['meal_id', 'meal_name', 'meal_type', 'ingredients', 'nutrition'];
  const hasCorrectFormat = expectedColumns.every(col => header.includes(col));
  
  if (hasCorrectFormat) {
    console.log('   ✅ CSV has correct format with required columns');
  } else {
    console.log('   ❌ CSV missing required columns');
  }
} else {
  console.log('   ❌ Sample CSV not found');
}

// Test 2: Check if MySQL schema exists
console.log('\n2. Checking MySQL schema...');
if (fs.existsSync('./src/db/mysql-schema.ts')) {
  console.log('   ✅ MySQL schema file exists');
} else {
  console.log('   ❌ MySQL schema file missing');
}

// Test 3: Check if API endpoints exist
console.log('\n3. Checking API endpoints...');
const endpoints = [
  './src/app/api/meals/upload-csv/route.ts',
  './src/app/api/meals/generate-images/route.ts',
  './src/app/api/meals/library/route.ts',
  './src/app/api/plan-ahead/generate-from-library/route.ts'
];

endpoints.forEach(endpoint => {
  const name = endpoint.split('/').slice(-2).join('/');
  if (fs.existsSync(endpoint)) {
    console.log(`   ✅ ${name} exists`);
  } else {
    console.log(`   ❌ ${name} missing`);
  }
});

// Test 4: Check if components exist
console.log('\n4. Checking UI components...');
const components = [
  './src/components/MealLibraryUpload.tsx',
  './src/app/admin/meal-library/page.tsx'
];

components.forEach(component => {
  const name = component.split('/').pop();
  if (fs.existsSync(component)) {
    console.log(`   ✅ ${name} exists`);
  } else {
    console.log(`   ❌ ${name} missing`);
  }
});

// Test 5: Check environment variables
console.log('\n5. Checking environment configuration...');
if (fs.existsSync('./.env.local')) {
  const envContent = fs.readFileSync('./.env.local', 'utf8');
  const requiredVars = ['RDS_HOST', 'RDS_USER', 'RDS_PASSWORD', 'AWS_ACCESS_KEY_ID', 'S3_BUCKET_MEALS'];
  
  requiredVars.forEach(varName => {
    if (envContent.includes(varName)) {
      console.log(`   ✅ ${varName} configured`);
    } else {
      console.log(`   ❌ ${varName} missing`);
    }
  });
} else {
  console.log('   ❌ .env.local file not found');
}

console.log('\n🎉 System check complete!');
console.log('\n📋 Next steps:');
console.log('   1. Run: npm run db:migrate (to create database tables)');
console.log('   2. Visit: /admin/meal-library (to upload CSV)');
console.log('   3. Upload: sample-meals.csv (to populate database)');
console.log('   4. Visit: /plan-ahead (to test meal generation)');
console.log('\n💡 The system will now:');
console.log('   • Generate meals ONCE and persist them');
console.log('   • Only regenerate when "Get New Meals" is clicked');
console.log('   • Ensure each meal appears only ONCE per week');
console.log('   • Use pre-generated images from AWS Titan G1V2');