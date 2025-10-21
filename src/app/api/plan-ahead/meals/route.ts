import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Fetching plan-ahead meals (disconnected from home page)');

    // Try to get from plan-ahead API (completely separate from home page)
    const planResponse = await fetch(`${request.nextUrl.origin}/api/plan-ahead/retrieve`);
    const planData = await planResponse.json();

    if (planData.status === "success" && planData.mealPlan?.meals) {
      console.log(`✅ Found ${planData.mealPlan.meals.length} plan-ahead meals`);
      
      return NextResponse.json({
        status: 'success',
        meals: planData.mealPlan.meals,
        source: 'plan_ahead_only',
        message: 'Plan-ahead meals (disconnected from home page)'
      });
    }

    // No plan-ahead meals found
    return NextResponse.json({
      status: 'success',
      meals: [],
      source: 'none',
      message: 'No plan-ahead meals generated yet'
    });

  } catch (error) {
    console.error('Error fetching plan-ahead meals:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch plan-ahead meals',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}