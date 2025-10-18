import { NextRequest, NextResponse } from 'next/server';
import { mysqlPool } from '@/lib/mysql-config';
import { RowDataPacket } from 'mysql2/promise';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    let query = 'SELECT * FROM psychological_cycles';
    const params: string[] = [];

    // Add date range filtering if provided
    if (startDate && endDate) {
      query += ' WHERE date BETWEEN ? AND ?';
      params.push(startDate, endDate);
    } else if (startDate) {
      query += ' WHERE date >= ?';
      params.push(startDate);
    } else if (endDate) {
      query += ' WHERE date <= ?';
      params.push(endDate);
    }

    query += ' ORDER BY date DESC';

    const [rows] = await mysqlPool.execute<RowDataPacket[]>(query, params);

    return NextResponse.json({
      success: true,
      data: rows,
      count: rows.length
    });
  } catch (error) {
    console.error('Error fetching psychological cycles:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch psychological cycles data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}