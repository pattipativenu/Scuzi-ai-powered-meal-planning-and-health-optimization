import { NextResponse } from 'next/server';
import { testConnection } from '@/lib/mysql-config';

export async function GET() {
  try {
    const isConnected = await testConnection();
    
    if (isConnected) {
      return NextResponse.json({
        success: true,
        message: 'AWS RDS MySQL connection successful',
        database: 'WHOOPHEALTHDATA'
      });
    } else {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to connect to AWS RDS MySQL database' 
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Connection test error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Connection test failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}