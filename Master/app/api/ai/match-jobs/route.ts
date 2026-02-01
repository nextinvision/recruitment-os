import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext, requireAuth } from '@/lib/rbac'
import { aiService } from '@/modules/ai/service'
import { matchJobsSchema } from '@/modules/ai/schemas'
import { addCorsHeaders, handleCors } from '@/lib/cors'

export async function OPTIONS(request: NextRequest) {
  return handleCors(request) || new NextResponse(null, { status: 204 })
}

export async function POST(request: NextRequest) {
  try {
    const corsResponse = handleCors(request)
    if (corsResponse) return corsResponse

    const authHeader = request.headers.get('authorization')
    const authContext = requireAuth(await getAuthContext(authHeader))

    const body = await request.json()
    const input = matchJobsSchema.parse(body)

    const result = await aiService.matchJobs(input)

    const response = NextResponse.json(result, { status: 200 })
    const origin = request.headers.get('origin')
    return addCorsHeaders(response, origin)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to match jobs'
    const response = NextResponse.json({ error: message }, { status: 400 })
    const origin = request.headers.get('origin')
    return addCorsHeaders(response, origin)
  }
}

