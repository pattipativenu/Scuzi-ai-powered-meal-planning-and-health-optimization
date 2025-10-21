import { NextResponse } from 'next/server';
import { db } from '@/db/mysql-connection';
import { meals } from '@/db/mysql-schema';
import { sql } from 'drizzle-orm';
import mysql from 'mysql2/promise';

export async function GET() {
  try {
    console.log('🔍 Starting data audit...');
    
    // Create direct MySQL connection for raw queries
    const connection = await mysql.createConnection({
      host: process.env.RDS_HOST,
      user: process.env.RDS_USER,
      password: process.env.RDS_PASSWORD,
      database: process.env.RDS_DATABASE,
      port: Number(process.env.RDS_PORT) || 3306,
    });

    const auditResults = {
      database: process.env.RDS_DATABASE,
      timestamp: new Date().toISOString(),
      tables: {} as any,
      meals: {} as any,
      whoop: {} as any,
    };

    // 1. Check what tables exist
    console.log('📋 Checking available tables...');
    const [tables] = await connection.execute('SHOW TABLES');
    auditResults.tables.list = tables;
    auditResults.tables.count = (tables as any[]).length;
    
    console.log(`Found ${auditResults.tables.count} tables:`, tables);

    // 2. Check meals data using Drizzle
    console.log('🍽️ Auditing meals data...');
    try {
      const totalMeals = await db.select({ count: sql`count(*)` }).from(meals);
      auditResults.meals.total = totalMeals[0]?.count || 0;

      // Check meals with images
      const mealsWithImages = await db.select({ count: sql`count(*)` })
        .from(meals)
        .where(sql`${meals.imageUrl} IS NOT NULL AND ${meals.imageUrl} != ''`);
      auditResults.meals.withImages = mealsWithImages[0]?.count || 0;

      // Check meal types distribution
      const mealTypes = await db.select({ 
        mealType: meals.mealType, 
        count: sql`count(*)` 
      })
      .from(meals)
      .groupBy(meals.mealType);
      auditResults.meals.byType = mealTypes;

      // Sample meal data
      const sampleMeals = await db.select().from(meals).limit(3);
      auditResults.meals.samples = sampleMeals.map(meal => ({
        id: meal.mealId,
        name: meal.mealName,
        type: meal.mealType,
        hasImage: !!(meal.imageUrl && meal.imageUrl.trim()),
        tags: meal.tags
      }));

    } catch (mealError) {
      console.error('❌ Error auditing meals:', mealError);
      auditResults.meals.error = mealError instanceof Error ? mealError.message : 'Unknown error';
    }

    // 3. Check WHOOP data using raw SQL
    console.log('📊 Auditing WHOOP data...');
    try {
      // Check if whoop_health_data table exists
      const [whoopTableCheck] = await connection.execute(
        "SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = ? AND table_name = 'whoop_health_data'",
        [process.env.RDS_DATABASE]
      );
      
      const whoopTableExists = (whoopTableCheck as any[])[0]?.count > 0;
      auditResults.whoop.tableExists = whoopTableExists;

      if (whoopTableExists) {
        // Count total WHOOP records
        const [whoopCount] = await connection.execute('SELECT COUNT(*) as count FROM whoop_health_data');
        auditResults.whoop.totalRecords = (whoopCount as any[])[0]?.count || 0;

        // Check unique users
        const [uniqueUsers] = await connection.execute('SELECT COUNT(DISTINCT userId) as count FROM whoop_health_data');
        auditResults.whoop.uniqueUsers = (uniqueUsers as any[])[0]?.count || 0;

        // Check date range
        const [dateRange] = await connection.execute(
          'SELECT MIN(date) as earliest, MAX(date) as latest FROM whoop_health_data'
        );
        auditResults.whoop.dateRange = (dateRange as any[])[0];

        // Sample WHOOP data
        const [sampleWhoop] = await connection.execute(
          'SELECT userId, date, recoveryScore, strain, sleepHours, caloriesBurned FROM whoop_health_data ORDER BY date DESC LIMIT 3'
        );
        auditResults.whoop.samples = sampleWhoop;

        // Check data completeness
        const [completeness] = await connection.execute(`
          SELECT 
            COUNT(*) as total,
            COUNT(recoveryScore) as hasRecovery,
            COUNT(strain) as hasStrain,
            COUNT(sleepHours) as hasSleep,
            COUNT(caloriesBurned) as hasCalories
          FROM whoop_health_data
        `);
        auditResults.whoop.completeness = (completeness as any[])[0];

      } else {
        auditResults.whoop.message = 'whoop_health_data table not found';
      }

    } catch (whoopError) {
      console.error('❌ Error auditing WHOOP data:', whoopError);
      auditResults.whoop.error = whoopError instanceof Error ? whoopError.message : 'Unknown error';
    }

    // 4. Check other relevant tables
    console.log('🔍 Checking for other relevant tables...');
    const relevantTables = ['users', 'meal_plans', 'user_preferences', 'whoop_tokens'];
    for (const tableName of relevantTables) {
      try {
        const [tableCheck] = await connection.execute(
          "SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = ? AND table_name = ?",
          [process.env.RDS_DATABASE, tableName]
        );
        const exists = (tableCheck as any[])[0]?.count > 0;
        
        if (exists) {
          const [rowCount] = await connection.execute(`SELECT COUNT(*) as count FROM ${tableName}`);
          auditResults.tables[tableName] = {
            exists: true,
            rows: (rowCount as any[])[0]?.count || 0
          };
        } else {
          auditResults.tables[tableName] = { exists: false };
        }
      } catch (error) {
        auditResults.tables[tableName] = { 
          exists: false, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        };
      }
    }

    await connection.end();

    console.log('✅ Data audit completed');
    
    return NextResponse.json({
      success: true,
      audit: auditResults,
      summary: {
        totalMeals: auditResults.meals.total || 0,
        mealsWithImages: auditResults.meals.withImages || 0,
        imagePercentage: auditResults.meals.total > 0 
          ? Math.round((auditResults.meals.withImages / auditResults.meals.total) * 100) 
          : 0,
        whoopRecords: auditResults.whoop.totalRecords || 0,
        whoopUsers: auditResults.whoop.uniqueUsers || 0,
        readyForGeneration: (auditResults.meals.withImages || 0) >= 20
      }
    });

  } catch (error) {
    console.error('💥 Data audit failed:', error);
    return NextResponse.json({
      success: false,
      error: 'Data audit failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}