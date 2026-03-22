import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext, requireAuth } from '@/lib/rbac'
import { addContact } from '@/modules/companies/service'
import { addCorsHeaders, handleCors } from '@/lib/cors'

export async function OPTIONS(request: NextRequest) {
    return handleCors(request) || new NextResponse(null, { status: 204 })
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const corsResponse = handleCors(request)
        if (corsResponse) return corsResponse

        const authHeader =
            request.headers.get('authorization') ||
            (request.cookies.get('token')?.value ? `Bearer ${request.cookies.get('token')?.value}` : null)
        requireAuth(await getAuthContext(authHeader))

        const { id } = await params
        const body = await request.json()
        const contact = await addContact({ ...body, companyId: id })
        const response = NextResponse.json(contact, { status: 201 })
        return addCorsHeaders(response, request.headers.get('origin'))
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to add contact'
        const response = NextResponse.json({ error: message }, { status: 400 })
        return addCorsHeaders(response, request.headers.get('origin'))
    }
}
