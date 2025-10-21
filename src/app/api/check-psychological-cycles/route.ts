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

    const results = {
      database: process.env.RDS_DATABASE,
      timestamp: new Date().toISOString(),
      psychologicalCycles: {} as any
    };

    // Check if psychological_cycles table exists
    console.log('🔍 Checking for psychological_cycles table...');
    
    try {
      const [tableCheck] = await connection.execute(
        "SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = ? AND table_name = 'psychological_cycles'",
        [process.env.RDS_DATABASE]
      );
      
      const tableExists = (tableCheck as any[])[0]?.count > 0;
      results.psychologicalCycles.tableExists = tableExists;

      if (tableExists) {
        // Get table structure
        const [structure] = await connection.execute('DESCRIBE psychological_cycles');
        results.psychologicalCycles.structure = structure;

        // Get row count
        const [countResult] = await connection.execute('SELECT COUNT(*) as count FROM psychological_cycles');
        const rowCount = (countResult as any[])[0]?.count || 0;
        results.psychologicalCycles.rowCount = rowCount;

        if (rowCount > 0) {
          // Get date range
          const [dateRange] = await connection.execute(
            'SELECT MIN(date) as earliest, MAX(date) as latest FROM psychological_cycles'
          );
          results.psychologicalCycles.dateRange = (dateRange as any[])[0];

          // Get unique users
          const [uniqueUsers] = await connection.execute('SELECT COUNT(DISTINCT user_id) as count FROM psychological_cycles');
          results.psychologicalCycles.uniqueUsers = (uniqueUsers as any[])[0]?.count || 0;

          // Get sample data
          const [sampleData] = await connection.execute('SELECT * FROM psychological_cycles ORDER BY date DESC LIMIT 5');
          results.psychologicalCycles.sampleData = sampleData;

          // Check for recent data (last 60 days)
          const [recentData] = await connection.execute(
            'SELECT COUNT(*) as count FROM psychological_cycles WHERE date >= DATE_SUB(NOW(), INTERVAL 60 DAY)'
          );
          results.psychologicalCycles.recentRecords = (recentData as any[])[0]?.count || 0;

          console.log(`✅ Found ${rowCount} records in psychological_cycles table`);
        } else {
          console.log('📋 psychological_cycles table exists but is empty');
        }
      } else {
        console.log('❌ psychological_cycles table does not exist');
      }

    } catch (error) {
      console.error('❌ Error checking psychological_cycles:', error);
      results.psychologicalCycles.error = error instanceof Error ? error.message : 'Unknown error';
    }

    await connection.end();

    return NextResponse.json({
      success: true,
      results: results,
      summary: {
        foundPsychologicalCycles: results.psychologicalCycles.tableExists,
        recordCount: results.psychologicalCycles.rowCount || 0,
        recentRecords: results.psychologicalCycles.recentRecords || 0,
        uniqueUsers: results.psychologicalCycles.uniqueUsers || 0,
        hasYourData: (results.psychologicalCycles.rowCount || 0) > 0
      }
    });

  } catch (error) {
    console.error('💥 Error checking psychological cycles:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to check psychological cycles',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}