import { NextRequest, NextResponse } from 'next/server'
import { checkOverdueFollowUps } from '@/lib/scheduler'

/**
 * API endpoint to manually trigger follow-up check
 * Can be called by external cron services (e.g., Vercel Cron, GitHub Actions)
 */
export async function GET(request: NextRequest) {
  try {
    // Optional: Add authentication/authorization here
    // For now, allow unauthenticated access (you may want to add a secret token)
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await checkOverdueFollowUps()

    return NextResponse.json({
      success: true,
      message: 'Follow-up check completed',
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error in cron endpoint:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

