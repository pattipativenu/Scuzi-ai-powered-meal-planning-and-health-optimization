import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, days = 30 } = body;

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    console.log(`🔄 Manual WHOOP sync triggered for user: ${userId} (last ${days} days)`);

    // Calculate date range
    const endDate = new Date().toISOString();
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    // Call the sync-data API
    const syncResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/whoop/sync-data`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, startDate, endDate }),
    });

    const syncResult = await syncResponse.json();

    if (syncResponse.ok) {
      console.log(`✅ Manual sync completed:`, syncResult);
      return NextResponse.json({
        success: true,
        message: `WHOOP data synced for last ${days} days`,
        ...syncResult,
      });
    } else {
      console.error(`❌ Manual sync failed:`, syncResult);
      return NextResponse.json({
        success: false,
        error: syncResult.error || "Sync failed",
      }, { status: 500 });
    }

  } catch (error) {
    console.error("❌ Error in manual sync:", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const userId = searchParams.get("userId");
  const days = parseInt(searchParams.get("days") || "30");

  if (!userId) {
    return NextResponse.json({ error: "userId query parameter is required" }, { status: 400 });
  }

  // Call POST endpoint internally
  return POST(new NextRequest(request.url, {
    method: "POST",
    body: JSON.stringify({ userId, days }),
  }));
}