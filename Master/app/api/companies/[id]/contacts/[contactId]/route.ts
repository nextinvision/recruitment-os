import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext, requireAuth } from '@/lib/rbac'
import { updateContact, deleteContact } from '@/modules/companies/service'
import { addCorsHeaders, handleCors } from '@/lib/cors'

export async function OPTIONS(request: NextRequest) {
    return handleCors(request) || new NextResponse(null, { status: 204 })
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string; contactId: string }> }
) {
    try {
        const corsResponse = handleCors(request)
        if (corsResponse) return corsResponse

        const authHeader =
            request.headers.get('authorization') ||
            (request.cookies.get('token')?.value ? `Bearer ${request.cookies.get('token')?.value}` : null)
        requireAuth(await getAuthContext(authHeader))

        const { contactId } = await params
        const body = await request.json()
        const contact = await updateContact({ id: contactId, ...body })
        const response = NextResponse.json(contact, { status: 200 })
        return addCorsHeaders(response, request.headers.get('origin'))
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to update contact'
        const response = NextResponse.json({ error: message }, { status: 400 })
        return addCorsHeaders(response, request.headers.get('origin'))
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string; contactId: string }> }
) {
    try {
        const corsResponse = handleCors(request)
        if (corsResponse) return corsResponse

        const authHeader =
            request.headers.get('authorization') ||
            (request.cookies.get('token')?.value ? `Bearer ${request.cookies.get('token')?.value}` : null)
        requireAuth(await getAuthContext(authHeader))

        const { contactId } = await params
        await deleteContact(contactId)
        const response = NextResponse.json({ success: true }, { status: 200 })
        return addCorsHeaders(response, request.headers.get('origin'))
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to delete contact'
        const response = NextResponse.json({ error: message }, { status: 500 })
        return addCorsHeaders(response, request.headers.get('origin'))
    }
}
