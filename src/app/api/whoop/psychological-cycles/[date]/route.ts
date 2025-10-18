import { NextRequest, NextResponse } from 'next/server';
import { mysqlPool } from '@/lib/mysql-config';
import { RowDataPacket } from 'mysql2/promise';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ date: string }> }
) {
  try {
    const { date } = await params;

    const [rows] = await mysqlPool.execute<RowDataPacket[]>(
      'SELECT * FROM psychological_cycles WHERE date = ?',
      [date]
    );

    if (rows.length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'No data found for the specified date' 
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: rows[0]
    });
  } catch (error) {
    console.error('Error fetching psychological cycle by date:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch psychological cycle data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}