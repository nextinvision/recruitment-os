import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext, requireAuth } from '@/lib/rbac'
import { getCompanyById, updateCompany, deleteCompany } from '@/modules/companies/service'
import { addCorsHeaders, handleCors } from '@/lib/cors'

export async function OPTIONS(request: NextRequest) {
    return handleCors(request) || new NextResponse(null, { status: 204 })
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const corsResponse = handleCors(request)
        if (corsResponse) return corsResponse

        const authHeader =
            request.headers.get('authorization') ||
            (request.cookies.get('token')?.value ? `Bearer ${request.cookies.get('token')?.value}` : null)
        requireAuth(await getAuthContext(authHeader))

        const { id } = await params
        const company = await getCompanyById(id)
        if (!company) {
            const response = NextResponse.json({ error: 'Company not found' }, { status: 404 })
            return addCorsHeaders(response, request.headers.get('origin'))
        }

        const response = NextResponse.json(company, { status: 200 })
        return addCorsHeaders(response, request.headers.get('origin'))
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to fetch company'
        const response = NextResponse.json({ error: message }, { status: 500 })
        return addCorsHeaders(response, request.headers.get('origin'))
    }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const corsResponse = handleCors(request)
        if (corsResponse) return corsResponse

        const authHeader =
            request.headers.get('authorization') ||
            (request.cookies.get('token')?.value ? `Bearer ${request.cookies.get('token')?.value}` : null)
        requireAuth(await getAuthContext(authHeader))

        const { id } = await params
        const body = await request.json()
        const company = await updateCompany({ id, ...body })
        const response = NextResponse.json(company, { status: 200 })
        return addCorsHeaders(response, request.headers.get('origin'))
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to update company'
        const response = NextResponse.json({ error: message }, { status: 400 })
        return addCorsHeaders(response, request.headers.get('origin'))
    }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const corsResponse = handleCors(request)
        if (corsResponse) return corsResponse

        const authHeader =
            request.headers.get('authorization') ||
            (request.cookies.get('token')?.value ? `Bearer ${request.cookies.get('token')?.value}` : null)
        requireAuth(await getAuthContext(authHeader))

        const { id } = await params
        await deleteCompany(id)
        const response = NextResponse.json({ success: true }, { status: 200 })
        return addCorsHeaders(response, request.headers.get('origin'))
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to delete company'
        const response = NextResponse.json({ error: message }, { status: 500 })
        return addCorsHeaders(response, request.headers.get('origin'))
    }
}
