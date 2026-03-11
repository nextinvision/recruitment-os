import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext, requireAuth } from '@/lib/rbac'
import { analyticsService } from '@/modules/analytics/service'
import { addCorsHeaders, handleCors } from '@/lib/cors'

export async function OPTIONS(request: NextRequest) {
    return handleCors(request) || new NextResponse(null, { status: 204 })
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const corsResponse = handleCors(request)
        if (corsResponse) return corsResponse

        const authHeader = request.headers.get('authorization') ||
            (request.cookies.get('token')?.value ? `Bearer ${request.cookies.get('token')?.value}` : null)
        requireAuth(await getAuthContext(authHeader))

        const { id } = await params
        const metrics = await analyticsService.getClientMetrics(id)

        const response = NextResponse.json(metrics, { status: 200 })
        const origin = request.headers.get('origin')
        return addCorsHeaders(response, origin)
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to fetch client metrics'
        const response = NextResponse.json({ error: message }, { status: 500 })
        const origin = request.headers.get('origin')
        return addCorsHeaders(response, origin)
    }
}
