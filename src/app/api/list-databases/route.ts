import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise';

export async function GET() {
  try {
    // Connect without specifying a database to list all databases
    const connection = await mysql.createConnection({
      host: process.env.RDS_HOST,
      user: process.env.RDS_USER,
      password: process.env.RDS_PASSWORD,
      port: Number(process.env.RDS_PORT) || 3306,
    });

    console.log('🔍 Listing all databases on RDS instance...');

    // Get all databases
    const [databases] = await connection.execute('SHOW DATABASES');
    
    const results = {
      rdsHost: process.env.RDS_HOST,
      timestamp: new Date().toISOString(),
      databases: databases,
      currentEnvDatabase: process.env.RDS_DATABASE
    };

    // Check each database for WHOOP-related tables
    const databaseNames = (databases as any[]).map(row => Object.values(row)[0] as string);
    const whoopDatabases = [];

    for (const dbName of databaseNames) {
      // Skip system databases
      if (['information_schema', 'mysql', 'performance_schema', 'sys'].includes(dbName)) {
        continue;
      }

      try {
        console.log(`🔍 Checking database: ${dbName}`);
        
        // Switch to this database
        await connection.execute(`USE ${dbName}`);
        
        // Get tables in this database
        const [tables] = await connection.execute('SHOW TABLES');
        const tableNames = (tables as any[]).map(row => Object.values(row)[0] as string);
        
        // Look for WHOOP-related tables
        const whoopTables = tableNames.filter(name => 
          name.toLowerCase().includes('whoop') || 
          name.toLowerCase().includes('health') || 
          name.toLowerCase().includes('cycle') || 
          name.toLowerCase().includes('physiological') ||
          name.toLowerCase().includes('recovery') ||
          name.toLowerCase().includes('strain') ||
          name.toLowerCase().includes('sleep')
        );

        if (whoopTables.length > 0 || tableNames.length > 0) {
          // Check for data in WHOOP tables
          const tableData = {};
          for (const tableName of whoopTables) {
            try {
              const [countResult] = await connection.execute(`SELECT COUNT(*) as count FROM ${tableName}`);
              const rowCount = (countResult as any[])[0]?.count || 0;
              (tableData as any)[tableName] = rowCount;
            } catch (e) {
              (tableData as any)[tableName] = 'error';
            }
          }

          whoopDatabases.push({
            database: dbName,
            totalTables: tableNames.length,
            whoopTables: whoopTables,
            tableData: tableData,
            allTables: tableNames
          });
        }

      } catch (error) {
        console.error(`❌ Error checking database ${dbName}:`, error);
      }
    }

    await connection.end();

    console.log('✅ Database listing completed');
    
    return NextResponse.json({
      success: true,
      results: results,
      whoopDatabases: whoopDatabases,
      summary: {
        totalDatabases: databaseNames.length,
        databasesWithWhoopTables: whoopDatabases.length,
        foundWhoopData: whoopDatabases.some(db => 
          Object.values(db.tableData).some(count => typeof count === 'number' && count > 0)
        )
      }
    });

  } catch (error) {
    console.error('💥 Database listing failed:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to list databases',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}