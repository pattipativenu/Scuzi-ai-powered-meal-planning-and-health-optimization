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

    // Get unique user IDs and sample data
    const [users] = await connection.execute(
      'SELECT DISTINCT user_id, COUNT(*) as record_count FROM whoop_health_data GROUP BY user_id'
    );

    // Get sample records
    const [sampleData] = await connection.execute(
      'SELECT user_id, date, recovery_score, strain, sleep_hours FROM whoop_health_data ORDER BY date DESC LIMIT 5'
    );

    await connection.end();

    return NextResponse.json({
      success: true,
      users: users,
      sampleData: sampleData,
      totalUsers: (users as any[]).length
    });

  } catch (error) {
    console.error('Error checking WHOOP users:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}