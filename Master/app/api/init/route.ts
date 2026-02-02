import { NextRequest, NextResponse } from 'next/server'
import { initializeBuckets } from '@/lib/storage'
import { addCorsHeaders, handleCors } from '@/lib/cors'

export async function OPTIONS(request: NextRequest) {
  return handleCors(request) || new NextResponse(null, { status: 204 })
}

/**
 * Initialize MinIO buckets
 * This endpoint can be called on startup or manually
 */
export async function POST(request: NextRequest) {
  try {
    const corsResponse = handleCors(request)
    if (corsResponse) return corsResponse

    await initializeBuckets()

    const response = NextResponse.json(
      { success: true, message: 'MinIO buckets initialized successfully' },
      { status: 200 }
    )
    const origin = request.headers.get('origin')
    return addCorsHeaders(response, origin)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to initialize MinIO buckets'
    const response = NextResponse.json({ error: message }, { status: 500 })
    const origin = request.headers.get('origin')
    return addCorsHeaders(response, origin)
  }
}

