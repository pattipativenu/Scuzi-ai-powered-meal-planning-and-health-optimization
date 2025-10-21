import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise';

export async function GET() {
  try {
    // Connect to the WHOOPHEALTHDATA database specifically
    const connection = await mysql.createConnection({
      host: process.env.RDS_HOST,
      user: process.env.RDS_USER,
      password: process.env.RDS_PASSWORD,
      database: 'WHOOPHEALTHDATA', // The actual WHOOP database
      port: Number(process.env.RDS_PORT) || 3306,
    });

    const results = {
      database: 'WHOOPHEALTHDATA',
      timestamp: new Date().toISOString(),
      tables: [] as any[],
      dataFound: {} as any
    };

    console.log('🔍 Checking WHOOPHEALTHDATA database...');

    // 1. Get all tables in WHOOPHEALTHDATA
    const [allTables] = await connection.execute('SHOW TABLES');
    results.tables = allTables;
    const tableNames = (allTables as any[]).map(row => Object.values(row)[0] as string);
    
    console.log('📋 Tables in WHOOPHEALTHDATA:', tableNames);

    // 2. Check each table for data
    for (const tableName of tableNames) {
      try {
        console.log(`🔍 Checking table: ${tableName}`);
        
        // Get table structure
        const [structure] = await connection.execute(`DESCRIBE ${tableName}`);
        
        // Get row count
        const [countResult] = await connection.execute(`SELECT COUNT(*) as count FROM ${tableName}`);
        const rowCount = (countResult as any[])[0]?.count || 0;
        
        // Get sample data if exists
        let sampleData = [];
        if (rowCount > 0) {
          const [samples] = await connection.execute(`SELECT * FROM ${tableName} LIMIT 3`);
          sampleData = samples as any[];
        }

        // Check for user data
        let userDataCount = 0;
        let dateRange = null;
        if (rowCount > 0) {
          try {
            // Try different possible user ID column names
            const userColumns = ['user_id', 'userId', 'whoop_user_id', 'id'];
            for (const col of userColumns) {
              try {
                const [userCheck] = await connection.execute(
                  `SELECT COUNT(DISTINCT ${col}) as count FROM ${tableName} WHERE ${col} IS NOT NULL`
                );
                if ((userCheck as any[])[0]?.count > 0) {
                  userDataCount = (userCheck as any[])[0].count;
                  break;
                }
              } catch (e) {
                // Column doesn't exist, try next
              }
            }

            // Check for date columns and get date range
            const dateColumns = (structure as any[]).filter(col => 
              col.Field.toLowerCase().includes('date') || 
              col.Field.toLowerCase().includes('created') ||
              col.Field.toLowerCase().includes('updated') ||
              col.Type.includes('date') ||
              col.Type.includes('timestamp')
            );

            if (dateColumns.length > 0) {
              const dateCol = dateColumns[0].Field;
              const [dateRangeResult] = await connection.execute(
                `SELECT MIN(${dateCol}) as earliest, MAX(${dateCol}) as latest, COUNT(*) as total FROM ${tableName}`
              );
              dateRange = (dateRangeResult as any[])[0];

              // Check for recent data (last 60 days)
              const [recentData] = await connection.execute(
                `SELECT COUNT(*) as count FROM ${tableName} WHERE ${dateCol} >= DATE_SUB(NOW(), INTERVAL 60 DAY)`
              );
              dateRange.recentRecords = (recentData as any[])[0]?.count || 0;
            }
          } catch (e) {
            // Error checking user/date data
          }
        }

        results.dataFound[tableName] = {
          structure: structure,
          rowCount: rowCount,
          userCount: userDataCount,
          dateRange: dateRange,
          sampleData: sampleData.slice(0, 2), // Just first 2 rows
          hasData: rowCount > 0
        };

        console.log(`✅ ${tableName}: ${rowCount} rows, ${userDataCount} users`);

      } catch (error) {
        console.error(`❌ Error checking ${tableName}:`, error);
        results.dataFound[tableName] = {
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    }

    await connection.end();

    // 3. Summary
    const totalRecords = Object.values(results.dataFound)
      .reduce((sum, table: any) => sum + (table.rowCount || 0), 0);

    const tablesWithData = Object.entries(results.dataFound)
      .filter(([_, table]: [string, any]) => table.hasData)
      .map(([name, table]: [string, any]) => ({ 
        name, 
        rows: table.rowCount,
        users: table.userCount,
        dateRange: table.dateRange
      }));

    console.log('✅ WHOOPHEALTHDATA database check completed');
    
    return NextResponse.json({
      success: true,
      database: 'WHOOPHEALTHDATA',
      results: results,
      summary: {
        totalTables: tableNames.length,
        totalRecords: totalRecords,
        tablesWithData: tablesWithData,
        foundYourData: totalRecords > 0,
        tableNames: tableNames
      }
    });

  } catch (error) {
    console.error('💥 WHOOPHEALTHDATA database check failed:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to check WHOOPHEALTHDATA database',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}