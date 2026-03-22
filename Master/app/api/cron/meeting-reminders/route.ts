import { NextRequest, NextResponse } from 'next/server'
import { runMeetingReminderWorker } from '@/workers/meeting-reminder.worker'
import { addCorsHeaders, handleCors } from '@/lib/cors'

/**
 * Cron endpoint for TidyCal meeting reminders (24h, 1h, 15m before).
 * Call every 5-15 minutes via Vercel Cron, GitHub Actions, or external scheduler.
 * Secured by CRON_SECRET or Authorization header.
 */
export async function OPTIONS(request: NextRequest) {
  return handleCors(request) || new NextResponse(null, { status: 204 })
}

export async function POST(request: NextRequest) {
  try {
    const corsResponse = handleCors(request)
    if (corsResponse) return corsResponse

    const authHeader = request.headers.get('authorization')
    const cronSecret = request.headers.get('x-cron-secret') || request.headers.get('authorization')?.replace('Bearer ', '')
    const envSecret = process.env.CRON_SECRET

    if (envSecret && cronSecret !== envSecret && authHeader !== `Bearer ${envSecret}`) {
      const response = NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      const origin = request.headers.get('origin')
      return addCorsHeaders(response, origin)
    }

    const result = await runMeetingReminderWorker()

    const response = NextResponse.json(result, { status: 200 })
    const origin = request.headers.get('origin')
    return addCorsHeaders(response, origin)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to process meeting reminders'
    const response = NextResponse.json({ error: message }, { status: 500 })
    const origin = request.headers.get('origin')
    return addCorsHeaders(response, origin)
  }
}

export async function GET(request: NextRequest) {
  return POST(request)
}
