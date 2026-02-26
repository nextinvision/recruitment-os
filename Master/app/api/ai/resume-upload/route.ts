import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext, requireAuth } from '@/lib/rbac'
import { addCorsHeaders, handleCors } from '@/lib/cors'

export async function OPTIONS(request: NextRequest) {
    return handleCors(request) || new NextResponse(null, { status: 204 })
}

/**
 * POST /api/ai/resume-upload
 *
 * Accepts a multipart/form-data resume file (PDF, DOC, DOCX).
 * Forwards it to the Python backend /api/analyze-resume endpoint.
 * Returns:
 *   { success, skills, experience_years, summary, education, contact, name, raw_text }
 */
export async function POST(request: NextRequest) {
    try {
        const corsResponse = handleCors(request)
        if (corsResponse) return corsResponse

        const authHeader =
            request.headers.get('authorization') ||
            (request.cookies.get('token')?.value
                ? `Bearer ${request.cookies.get('token')?.value}`
                : null)
        requireAuth(await getAuthContext(authHeader))

        const pythonBackendUrl = process.env.PYTHON_BACKEND_URL || 'http://localhost:8080'

        // Forward the raw multipart body to Python backend unchanged
        const formData = await request.formData()
        const file = formData.get('resume') as File | null

        if (!file) {
            const response = NextResponse.json(
                { error: 'No resume file provided. Include file as form field "resume".' },
                { status: 400 }
            )
            return addCorsHeaders(response, request.headers.get('origin'))
        }

        // Re-create a FormData to forward
        const forwardForm = new FormData()
        forwardForm.append('resume', file)

        const pythonResponse = await fetch(`${pythonBackendUrl}/api/analyze-resume`, {
            method: 'POST',
            body: forwardForm,
        })

        if (!pythonResponse.ok) {
            const errText = await pythonResponse.text().catch(() => 'Unknown error')
            const response = NextResponse.json(
                { error: `Resume analysis failed: ${errText}` },
                { status: 502 }
            )
            return addCorsHeaders(response, request.headers.get('origin'))
        }

        const result = await pythonResponse.json()
        const response = NextResponse.json(result, { status: 200 })
        return addCorsHeaders(response, request.headers.get('origin'))
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to analyze resume'
        const response = NextResponse.json({ error: message }, { status: 500 })
        return addCorsHeaders(response, request.headers.get('origin'))
    }
}
