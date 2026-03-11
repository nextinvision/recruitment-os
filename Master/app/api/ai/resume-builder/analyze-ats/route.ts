import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext, requireAuth } from '@/lib/rbac'

export async function POST(request: NextRequest) {
    try {
        const authHeader =
            request.headers.get('authorization') ||
            (request.cookies.get('token')?.value
                ? `Bearer ${request.cookies.get('token')?.value}`
                : null)
        requireAuth(await getAuthContext(authHeader))

        const pythonBackendUrl = process.env.PYTHON_BACKEND_URL || 'http://localhost:8080'

        const body = await request.json()
        const { resume_data } = body

        if (!resume_data) {
            return NextResponse.json(
                { error: 'No resume_data provided.' },
                { status: 400 }
            )
        }

        const pythonResponse = await fetch(`${pythonBackendUrl}/api/analyze-resume-json`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ resume_data }),
        })

        if (!pythonResponse.ok) {
            const errText = await pythonResponse.text().catch(() => 'Unknown error')
            return NextResponse.json(
                { error: `ATS analysis failed: ${errText}` },
                { status: 502 }
            )
        }

        const result = await pythonResponse.json()
        return NextResponse.json(result, { status: 200 })
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to analyze ATS'
        return NextResponse.json({ error: message }, { status: 500 })
    }
}
