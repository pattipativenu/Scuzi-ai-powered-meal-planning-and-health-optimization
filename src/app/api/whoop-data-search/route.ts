import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise';

export async function GET() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.RDS_HOST,
      user: process.env.RDS_USER,
      password: process.env.RDS_PASSWORD,
      database: process.env.RDS_DATABASE,
      port: Number(process.env.RDS_PORT) || 3306,
    });

    const searchResults = {
      database: process.env.RDS_DATABASE,
      timestamp: new Date().toISOString(),
      allTables: [] as any[],
      whoopTables: [] as any[],
      dataFound: {} as any
    };

    // 1. Get ALL tables in the database
    console.log('🔍 Searching for ALL tables...');
    const [allTables] = await connection.execute('SHOW TABLES');
    searchResults.allTables = allTables;

    // 2. Look for any table that might contain WHOOP data
    const tableNames = (allTables as any[]).map(row => Object.values(row)[0] as string);
    console.log('📋 All tables found:', tableNames);

    // 3. Search for tables with "whoop", "health", "cycle", "physiological" in name
    const whoopRelatedTables = tableNames.filter(name => 
      name.toLowerCase().includes('whoop') || 
      name.toLowerCase().includes('health') || 
      name.toLowerCase().includes('cycle') || 
      name.toLowerCase().includes('physiological') ||
      name.toLowerCase().includes('recovery') ||
      name.toLowerCase().includes('strain') ||
      name.toLowerCase().includes('sleep')
    );

    searchResults.whoopTables = whoopRelatedTables;
    console.log('🎯 WHOOP-related tables:', whoopRelatedTables);

    // 4. Check each WHOOP-related table for data
    for (const tableName of whoopRelatedTables) {
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
          const [samples] = await connection.execute(`SELECT * FROM ${tableName} LIMIT 5`);
          sampleData = samples as any[];
        }

        // Check for specific user data
        let userDataCount = 0;
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
          } catch (e) {
            // No user columns found
          }
        }

        searchResults.dataFound[tableName] = {
          structure: structure,
          rowCount: rowCount,
          userCount: userDataCount,
          sampleData: sampleData.slice(0, 2), // Just first 2 rows
          hasData: rowCount > 0
        };

        console.log(`✅ ${tableName}: ${rowCount} rows, ${userDataCount} users`);

      } catch (error) {
        console.error(`❌ Error checking ${tableName}:`, error);
        searchResults.dataFound[tableName] = {
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    }

    // 5. Also check if there are any tables with recent data (last 60 days)
    console.log('📅 Checking for recent data in WHOOP tables...');
    for (const tableName of whoopRelatedTables) {
      if (searchResults.dataFound[tableName]?.hasData) {
        try {
          // Look for date columns
          const structure = searchResults.dataFound[tableName].structure;
          const dateColumns = (structure as any[]).filter(col => 
            col.Field.toLowerCase().includes('date') || 
            col.Field.toLowerCase().includes('created') ||
            col.Field.toLowerCase().includes('updated') ||
            col.Type.includes('date') ||
            col.Type.includes('timestamp')
          );

          if (dateColumns.length > 0) {
            const dateCol = dateColumns[0].Field;
            const [recentData] = await connection.execute(
              `SELECT COUNT(*) as count FROM ${tableName} WHERE ${dateCol} >= DATE_SUB(NOW(), INTERVAL 60 DAY)`
            );
            searchResults.dataFound[tableName].recentData = (recentData as any[])[0]?.count || 0;
            
            // Get date range
            const [dateRange] = await connection.execute(
              `SELECT MIN(${dateCol}) as earliest, MAX(${dateCol}) as latest FROM ${tableName}`
            );
            searchResults.dataFound[tableName].dateRange = (dateRange as any[])[0];
          }
        } catch (e) {
          // Date check failed
        }
      }
    }

    await connection.end();

    // 6. Summary
    const totalWhoopRecords = Object.values(searchResults.dataFound)
      .reduce((sum, table: any) => sum + (table.rowCount || 0), 0);

    const tablesWithData = Object.entries(searchResults.dataFound)
      .filter(([_, table]: [string, any]) => table.hasData)
      .map(([name, table]: [string, any]) => ({ name, rows: table.rowCount }));

    console.log('✅ WHOOP data search completed');
    
    return NextResponse.json({
      success: true,
      search: searchResults,
      summary: {
        totalTables: tableNames.length,
        whoopRelatedTables: whoopRelatedTables.length,
        totalWhoopRecords: totalWhoopRecords,
        tablesWithData: tablesWithData,
        foundYourData: totalWhoopRecords > 0
      }
    });

  } catch (error) {
    console.error('💥 WHOOP data search failed:', error);
    return NextResponse.json({
      success: false,
      error: 'WHOOP data search failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}