import { NextRequest, NextResponse } from 'next/server'
import { processApplicationFollowUpReminders } from '@/workers/application-followup-reminder'
import { addCorsHeaders, handleCors } from '@/lib/cors'

export async function OPTIONS(request: NextRequest) {
  return handleCors(request) || new NextResponse(null, { status: 204 })
}

export async function POST(request: NextRequest) {
  try {
    const corsResponse = handleCors(request)
    if (corsResponse) return corsResponse

    // Optional: Add authentication/authorization check here
    // For cron jobs, you might want to check for a secret token
    const authHeader = request.headers.get('authorization')
    const cronSecret = request.headers.get('x-cron-secret')
    
    // Simple security check - in production, use proper authentication
    if (!cronSecret && !authHeader) {
      const response = NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      const origin = request.headers.get('origin')
      return addCorsHeaders(response, origin)
    }

    const result = await processApplicationFollowUpReminders()

    const response = NextResponse.json(result, { status: 200 })
    const origin = request.headers.get('origin')
    return addCorsHeaders(response, origin)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to process follow-up reminders'
    const response = NextResponse.json({ error: message }, { status: 500 })
    const origin = request.headers.get('origin')
    return addCorsHeaders(response, origin)
  }
}

