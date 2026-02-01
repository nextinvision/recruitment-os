import { NextRequest, NextResponse } from 'next/server'
import { loginUser } from '@/modules/auth/service'
import { addCorsHeaders, handleCors } from '@/lib/cors'

export async function OPTIONS(request: NextRequest) {
  return handleCors(request) || new NextResponse(null, { status: 204 })
}

export async function POST(request: NextRequest) {
  try {
    // Handle CORS preflight
    const corsResponse = handleCors(request)
    if (corsResponse) return corsResponse

    const body = await request.json()
    const result = await loginUser(body)

    const response = NextResponse.json(result, { status: 200 })
    const origin = request.headers.get('origin')
    return addCorsHeaders(response, origin)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Login failed'
    const response = NextResponse.json({ error: message }, { status: 401 })
    const origin = request.headers.get('origin')
    return addCorsHeaders(response, origin)
  }
}

