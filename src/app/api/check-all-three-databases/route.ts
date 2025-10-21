import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise';

export async function GET() {
  try {
    const results = {
      timestamp: new Date().toISOString(),
      databases: {} as any
    };

    // Try all three database names from your screenshot
    const databaseNames = [
      'mealslabdb',
      'scuzi-meals-database', 
      'whoophealthdata'
    ];

    for (const dbName of databaseNames) {
      console.log(`🔍 Checking database: ${dbName}`);
      
      try {
        const connection = await mysql.createConnection({
          host: process.env.RDS_HOST,
          user: process.env.RDS_USER,
          password: process.env.RDS_PASSWORD,
          database: dbName,
          port: Number(process.env.RDS_PORT) || 3306,
        });

        // Get all tables
        const [allTables] = await connection.execute('SHOW TABLES');
        const tableNames = (allTables as any[]).map(row => Object.values(row)[0] as string);
        
        console.log(`📋 Tables in ${dbName}:`, tableNames);

        const dbData = {
          accessible: true,
          tables: tableNames,
          tableCount: tableNames.length,
          tablesWithData: {} as any
        };

        // Check each table for data
        for (const tableName of tableNames) {
          try {
            const [countResult] = await connection.execute(`SELECT COUNT(*) as count FROM ${tableName}`);
            const rowCount = (countResult as any[])[0]?.count || 0;
            
            if (rowCount > 0) {
              // Get sample data
              const [samples] = await connection.execute(`SELECT * FROM ${tableName} LIMIT 2`);
              
              // Check for date range if possible
              let dateInfo = null;
              try {
                const [structure] = await connection.execute(`DESCRIBE ${tableName}`);
                const dateColumns = (structure as any[]).filter(col => 
                  col.Field.toLowerCase().includes('date') || 
                  col.Type.includes('date') ||
                  col.Type.includes('timestamp')
                );

                if (dateColumns.length > 0) {
                  const dateCol = dateColumns[0].Field;
                  const [dateRange] = await connection.execute(
                    `SELECT MIN(${dateCol}) as earliest, MAX(${dateCol}) as latest FROM ${tableName}`
                  );
                  dateInfo = (dateRange as any[])[0];
                  
                  if (dateInfo.earliest && dateInfo.latest) {
                    const startDate = new Date(dateInfo.earliest);
                    const endDate = new Date(dateInfo.latest);
                    const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
                    dateInfo.totalDays = daysDiff;
                  }
                }
              } catch (e) {
                // Date check failed
              }

              dbData.tablesWithData[tableName] = {
                rowCount: rowCount,
                sampleData: samples,
                dateInfo: dateInfo
              };
            }
          } catch (error) {
            console.error(`❌ Error checking table ${tableName}:`, error);
          }
        }

        await connection.end();
        results.databases[dbName] = dbData;
        
        console.log(`✅ ${dbName}: ${tableNames.length} tables, ${Object.keys(dbData.tablesWithData).length} with data`);

      } catch (error) {
        console.error(`❌ Cannot access database ${dbName}:`, error);
        results.databases[dbName] = {
          accessible: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    }

    // Summary
    const accessibleDatabases = Object.entries(results.databases)
      .filter(([_, db]: [string, any]) => db.accessible)
      .map(([name, db]: [string, any]) => ({
        name,
        tables: db.tableCount,
        tablesWithData: Object.keys(db.tablesWithData).length,
        totalRecords: Object.values(db.tablesWithData).reduce((sum: number, table: any) => sum + table.rowCount, 0)
      }));

    console.log('✅ All database checks completed');
    
    return NextResponse.json({
      success: true,
      results: results,
      summary: {
        accessibleDatabases: accessibleDatabases,
        foundWhoopData: accessibleDatabases.some(db => 
          Object.keys(results.databases[db.name].tablesWithData).some(table => 
            table.toLowerCase().includes('whoop') || 
            table.toLowerCase().includes('health') ||
            table.toLowerCase().includes('cycle')
          )
        )
      }
    });

  } catch (error) {
    console.error('💥 Database check failed:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to check databases',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}