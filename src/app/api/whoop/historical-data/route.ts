import { NextRequest, NextResponse } from 'next/server';
import { mysqlPool } from '@/lib/mysql-config';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

// Enhanced connection pool with retry logic
async function executeQuery<T>(query: string, params: any[] = [], retries = 3): Promise<T> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const [rows] = await mysqlPool.execute<T & RowDataPacket[]>(query, params);
      return rows as T;
    } catch (error: any) {
      console.error(`Query attempt ${attempt} failed:`, error.message);
      
      if (attempt === retries) {
        throw error;
      }
      
      // Exponential backoff: 1s, 2s, 4s
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt - 1) * 1000));
    }
  }
  throw new Error('Query failed after all retries');
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Test connection endpoint
    if (searchParams.get('test') === 'connection') {
      try {
        const connection = await mysqlPool.getConnection();
        
        // Test query to verify table access
        const [rows] = await connection.execute<RowDataPacket[]>(
          'SELECT COUNT(*) as count FROM physiological_cycles'
        );
        
        connection.release();
        
        return NextResponse.json({
          status: 'success',
          message: '✅ Database connection successful',
          details: {
            database: process.env.RDS_DATABASE || 'WHOOPHEALTHDATA',
            table: 'physiological_cycles',
            recordCount: rows[0]?.count || 0
          }
        });
      } catch (error: any) {
        console.error('Connection test failed:', error);
        return NextResponse.json({
          status: 'error',
          message: '❌ Database connection failed',
          error: error.message,
          details: {
            code: error.code,
            errno: error.errno,
            sqlState: error.sqlState
          }
        }, { status: 500 });
      }
    }
    
    // Fetch data with optional filters
    const limit = parseInt(searchParams.get('limit') || '50');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    
    let query = 'SELECT * FROM physiological_cycles';
    const params: any[] = [];
    const conditions: string[] = [];
    
    if (startDate) {
      conditions.push('Cycle_start_time >= ?');
      params.push(startDate);
    }
    
    if (endDate) {
      conditions.push('Cycle_start_time <= ?');
      params.push(endDate);
    }
    
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    
    query += ` ORDER BY Cycle_start_time DESC LIMIT ${limit}`;
    
    const rows = await executeQuery<RowDataPacket[]>(query, params);
    
    return NextResponse.json({
      status: 'success',
      count: rows.length,
      data: rows,
      filters: {
        limit,
        startDate: startDate || null,
        endDate: endDate || null
      }
    });
    
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({
      status: 'error',
      message: 'Failed to fetch WHOOP historical data',
      error: error.message,
      details: {
        code: error.code,
        errno: error.errno
      }
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    // Validate required fields
    const requiredFields = [
      'Cycle_start_time',
      'Cycle_end_time',
      'Cycle_timezone_offset',
      'Sleep_performance_percentage',
      'Recovery_score'
    ];
    
    const missingFields = requiredFields.filter(field => !(field in data));
    
    if (missingFields.length > 0) {
      return NextResponse.json({
        status: 'error',
        message: 'Missing required fields',
        missingFields
      }, { status: 400 });
    }
    
    // Prepare insert query
    const fields = Object.keys(data);
    const placeholders = fields.map(() => '?').join(', ');
    const values = fields.map(field => data[field]);
    
    const query = `
      INSERT INTO physiological_cycles (${fields.join(', ')})
      VALUES (${placeholders})
    `;
    
    const result = await executeQuery<ResultSetHeader>(query, values);
    
    return NextResponse.json({
      status: 'success',
      message: 'Data inserted successfully',
      insertedId: result.insertId,
      affectedRows: result.affectedRows
    }, { status: 201 });
    
  } catch (error: any) {
    console.error('Insert Error:', error);
    return NextResponse.json({
      status: 'error',
      message: 'Failed to insert data',
      error: error.message,
      details: {
        code: error.code,
        errno: error.errno,
        sqlMessage: error.sqlMessage
      }
    }, { status: 500 });
  }
}