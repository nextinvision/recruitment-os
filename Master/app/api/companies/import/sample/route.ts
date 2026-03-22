import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext, requireAuth } from '@/lib/rbac'
import { addCorsHeaders, handleCors } from '@/lib/cors'

/** Matches the bulk-import template: only Company Name is required; all other columns optional. */
const SAMPLE_HEADERS = [
    'Contact Name',
    'Company Name',
    'Designation',
    'Location',
    'Phone Number',
    'Email ID',
    'Outreach Status',
    'LinkedIn profile link',
    'Comments',
]

const SAMPLE_ROW = [
    'Jane Smith',
    'Acme Corp',
    'HR Manager',
    'Bangalore, India',
    '+91 98765 43210',
    'jane.smith@example.com',
    'PENDING',
    'https://linkedin.com/in/janesmith',
    'Met at conference; follow up Q2.',
]

function escapeCsvCell(val: string): string {
    if (/[,"\n\r]/.test(val)) return `"${val.replace(/"/g, '""')}"`
    return val
}

function buildSampleCsv(): string {
    const headerLine = SAMPLE_HEADERS.map(escapeCsvCell).join(',')
    const dataLine = SAMPLE_ROW.map(escapeCsvCell).join(',')
    return [headerLine, dataLine].join('\n')
}

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
        requireAuth(await getAuthContext(authHeader))

        const csv = buildSampleCsv()
        const filename = `companies-import-sample-${new Date().toISOString().slice(0, 10)}.csv`

        const response = new NextResponse(csv, {
            status: 200,
            headers: {
                'Content-Type': 'text/csv; charset=utf-8',
                'Content-Disposition': `attachment; filename="${filename}"`,
            },
        })
        const origin = request.headers.get('origin')
        return addCorsHeaders(response, origin)
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to download sample'
        const response = NextResponse.json({ error: message }, { status: 401 })
        const origin = request.headers.get('origin')
        return addCorsHeaders(response, origin)
    }
}
