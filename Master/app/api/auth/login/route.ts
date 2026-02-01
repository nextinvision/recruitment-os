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
    
    // Detect client type: Extension vs Web Dashboard
    const userAgent = request.headers.get('user-agent') || ''
    const requestOrigin = request.headers.get('origin') || ''
    const isExtension = request.headers.get('x-client-type') === 'extension' || 
                       userAgent.includes('chrome-extension://') ||
                       requestOrigin.includes('chrome-extension://')
    
    // Only set cookies for web dashboard (not for extension)
    // Extension uses Bearer token in Authorization header
    if (!isExtension) {
      // Set cookie with proper attributes for web dashboard
      // Important: Use sameSite: 'lax' for top-level navigations
      // Use httpOnly: false to allow client-side access if needed
      response.cookies.set('token', result.token, {
        httpOnly: false, // Allow client-side access for API calls
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax', // Allows cookie to be sent with top-level navigations (GET requests)
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: '/', // Available for all paths
        // Don't set domain - let it default to current domain
      })
      
    }
    
    return addCorsHeaders(response, requestOrigin)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Login failed'
    const errorResponse = NextResponse.json({ error: message }, { status: 401 })
    const errorOrigin = request.headers.get('origin')
    return addCorsHeaders(errorResponse, errorOrigin)
  }
}

