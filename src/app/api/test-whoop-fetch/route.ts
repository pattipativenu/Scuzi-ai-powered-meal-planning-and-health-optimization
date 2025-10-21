import { NextResponse } from 'next/server';
import { fetchUserWhoopData, analyzeWhoopData } from '@/lib/whoop-analyzer';

export async function GET() {
  try {
    console.log('🧪 Testing WHOOP data fetch...');
    
    // Test with the correct user ID
    const userId = 'whoop_user_main';
    const days = 7;
    
    console.log(`Fetching WHOOP data for user: ${userId}, days: ${days}`);
    
    const whoopData = await fetchUserWhoopData(userId, days);
    console.log(`Fetched ${whoopData.length} records`);
    
    if (whoopData.length > 0) {
      const analysis = analyzeWhoopData(whoopData);
      
      return NextResponse.json({
        success: true,
        userId: userId,
        dataPoints: whoopData.length,
        sampleData: whoopData.slice(0, 3),
        analysis: {
          dataPoints: analysis.dataPoints,
          dateRange: analysis.dateRange,
          averages: analysis.averages,
          physiologicalState: analysis.physiologicalState
        }
      });
    } else {
      return NextResponse.json({
        success: false,
        message: 'No WHOOP data found',
        userId: userId
      });
    }
    
  } catch (error) {
    console.error('Error testing WHOOP fetch:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}