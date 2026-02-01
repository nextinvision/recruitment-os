import { NextRequest, NextResponse } from 'next/server'
import { addCorsHeaders, handleCors } from './cors'

export function createApiResponse(
  request: NextRequest,
  data: any,
  status: number = 200
): NextResponse {
  const response = NextResponse.json(data, { status })
  const origin = request.headers.get('origin')
  return addCorsHeaders(response, origin)
}

export function createApiError(
  request: NextRequest,
  message: string,
  status: number = 500
): NextResponse {
  const response = NextResponse.json({ error: message }, { status })
  const origin = request.headers.get('origin')
  return addCorsHeaders(response, origin)
}

export function handleApiRequest(request: NextRequest): NextResponse | null {
  return handleCors(request)
}

