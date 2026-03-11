import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext, requireAuth } from '@/lib/rbac'
import { getCompanies, createCompany, getCompanyStats } from '@/modules/companies/service'
import { companyFiltersSchema, companyPaginationSchema } from '@/modules/companies/schemas'
import { addCorsHeaders, handleCors } from '@/lib/cors'

export async function OPTIONS(request: NextRequest) {
    return handleCors(request) || new NextResponse(null, { status: 204 })
}

export async function GET(request: NextRequest) {
    try {
        const corsResponse = handleCors(request)
        if (corsResponse) return corsResponse

        const authHeader =
            request.headers.get('authorization') ||
            (request.cookies.get('token')?.value ? `Bearer ${request.cookies.get('token')?.value}` : null)
        const authContext = requireAuth(await getAuthContext(authHeader))

        const { searchParams } = new URL(request.url)

        // Return stats if requested
        if (searchParams.get('stats') === 'true') {
            const stats = await getCompanyStats()
            const response = NextResponse.json(stats, { status: 200 })
            return addCorsHeaders(response, request.headers.get('origin'))
        }

        const filterData: any = {}
        if (searchParams.get('search')) filterData.search = searchParams.get('search')
        if (searchParams.get('industry')) filterData.industry = searchParams.get('industry')
        if (searchParams.get('size')) filterData.size = searchParams.get('size')
        const filters = companyFiltersSchema.parse(filterData)

        const paginationData: any = {}
        if (searchParams.get('page')) paginationData.page = parseInt(searchParams.get('page') || '1')
        if (searchParams.get('pageSize')) paginationData.pageSize = parseInt(searchParams.get('pageSize') || '25')
        const pagination = companyPaginationSchema.parse(paginationData)

        const result = await getCompanies(authContext.userId, authContext.role, filters, pagination)
        const response = NextResponse.json(result, { status: 200 })
        return addCorsHeaders(response, request.headers.get('origin'))
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to fetch companies'
        const response = NextResponse.json({ error: message }, { status: 500 })
        return addCorsHeaders(response, request.headers.get('origin'))
    }
}

export async function POST(request: NextRequest) {
    try {
        const corsResponse = handleCors(request)
        if (corsResponse) return corsResponse

        const authHeader =
            request.headers.get('authorization') ||
            (request.cookies.get('token')?.value ? `Bearer ${request.cookies.get('token')?.value}` : null)
        const authContext = requireAuth(await getAuthContext(authHeader))

        const body = await request.json()
        const company = await createCompany(body, authContext.userId)
        const response = NextResponse.json(company, { status: 201 })
        return addCorsHeaders(response, request.headers.get('origin'))
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Failed to create company'
        const payload: { error: string; details?: unknown } = { error: message }
        if (error && typeof error === 'object' && 'issues' in error) {
            payload.details = (error as { issues: unknown }).issues
        }
        const response = NextResponse.json(payload, { status: 400 })
        return addCorsHeaders(response, request.headers.get('origin'))
    }
}
