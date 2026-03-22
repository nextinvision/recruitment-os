import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext, requireAuth } from '@/lib/rbac'
import { importCompanies } from '@/modules/companies/service'
import { importCompaniesBodySchema } from '@/modules/companies/schemas'
import { addCorsHeaders, handleCors } from '@/lib/cors'
import { logMutation } from '@/lib/mutation-logger'

export async function OPTIONS(request: NextRequest) {
    return handleCors(request) || new NextResponse(null, { status: 204 })
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
        const validated = importCompaniesBodySchema.parse(body)

        const result = await importCompanies(validated.companies, authContext.userId)

        for (const company of result.created) {
            await logMutation({
                request,
                userId: authContext.userId,
                action: 'CREATE',
                entity: 'Company',
                entityId: company.id,
                entityName: company.name,
                newData: company,
                metadata: { companyId: company.id, source: 'import' },
            }).catch((err) => {
                console.error('Failed to log mutation:', err)
            })
        }

        const response = NextResponse.json(
            { created: result.created.length, errors: result.errors, companies: result.created },
            { status: 200 }
        )
        const origin = request.headers.get('origin')
        return addCorsHeaders(response, origin)
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Import failed'
        const response = NextResponse.json({ error: message }, { status: 400 })
        const origin = request.headers.get('origin')
        return addCorsHeaders(response, origin)
    }
}
