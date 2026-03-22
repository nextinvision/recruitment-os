import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { outreachService } from '@/modules/companies/outreach.service'
import { getAuthContext, requireAuth } from '@/lib/rbac'
import { addCorsHeaders, handleCors } from '@/lib/cors'

export async function OPTIONS(request: NextRequest) {
    return handleCors(request) || new NextResponse(null, { status: 204 })
}

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string; contactId: string }> }
) {
    try {
        const corsResponse = handleCors(req)
        if (corsResponse) return corsResponse

        const authHeader =
            req.headers.get('authorization') ||
            (req.cookies.get('token')?.value ? `Bearer ${req.cookies.get('token')?.value}` : null)
        const context = requireAuth(await getAuthContext(authHeader))

        const { id: companyId, contactId } = await params

        const contact = await outreachService.startOutreachSequence({
            companyId,
            contactId,
            userId: context.userId,
        })

        const response = NextResponse.json(contact, { status: 200 })
        return addCorsHeaders(response, req.headers.get('origin'))
    } catch (error: any) {
        console.error('[Outreach API POST] Error:', error)
        const message = error instanceof Error ? error.message : 'Internal Server Error'
        const response = NextResponse.json({ error: message }, { status: 500 })
        return addCorsHeaders(response, req.headers.get('origin'))
    }
}

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string; contactId: string }> }
) {
    try {
        const corsResponse = handleCors(req)
        if (corsResponse) return corsResponse

        const authHeader =
            req.headers.get('authorization') ||
            (req.cookies.get('token')?.value ? `Bearer ${req.cookies.get('token')?.value}` : null)
        const context = requireAuth(await getAuthContext(authHeader))

        const { contactId } = await params
        const { status } = await req.json()

        if (!['REPLIED', 'NOT_INTERESTED'].includes(status)) {
            return NextResponse.json({ error: 'Invalid status update via this endpoint' }, { status: 400 })
        }

        await outreachService.cancelOutreachSequence(contactId, status)

        const response = NextResponse.json({ success: true, status }, { status: 200 })
        return addCorsHeaders(response, req.headers.get('origin'))
    } catch (error: any) {
        console.error('[Outreach API PATCH] Error:', error)
        const message = error instanceof Error ? error.message : 'Internal Server Error'
        const response = NextResponse.json({ error: message }, { status: 500 })
        return addCorsHeaders(response, req.headers.get('origin'))
    }
}
