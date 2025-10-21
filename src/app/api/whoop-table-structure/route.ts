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

    // Get WHOOP table structure
    const [columns] = await connection.execute('DESCRIBE whoop_health_data');
    
    // Get sample data if any exists
    const [sampleData] = await connection.execute('SELECT * FROM whoop_health_data LIMIT 3');
    
    await connection.end();

    return NextResponse.json({
      success: true,
      table: 'whoop_health_data',
      columns: columns,
      sampleData: sampleData,
      recordCount: (sampleData as any[]).length
    });

  } catch (error) {
    console.error('Error checking WHOOP table:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}