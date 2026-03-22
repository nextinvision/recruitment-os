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
 *   { success, skills, experience_years, summary, education, experience, contact, name, raw_text, ... }
 * Education is left as structured [{ degree, institution, specialization }] so Resume Builder can map
 * degree/institution/specialization correctly. ATS Analysis page handles both string and object via educationLabel().
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

        const formData = await request.formData()
        const file = formData.get('resume') as File | null

        if (!file) {
            const response = NextResponse.json(
                { error: 'No resume file provided. Include file as form field "resume".' },
                { status: 400 }
            )
            return addCorsHeaders(response, request.headers.get('origin'))
        }

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

        // If Python returned success: false (e.g. no text extracted, Gemini/parse error), return 422 with actionable message
        if (result.success === false) {
            const msg =
                typeof result.error === 'string' && result.error.trim()
                    ? result.error
                    : typeof result.summary === 'string' && result.summary.trim()
                        ? result.summary
                        : 'Resume could not be parsed. Try a text-based PDF or DOCX, or a different file.'
            const response = NextResponse.json(
                { error: msg, success: false },
                { status: 422 }
            )
            return addCorsHeaders(response, request.headers.get('origin'))
        }

        // Leave education as structured array so Resume Builder gets degree/institution/specialization.
        // Do not flatten to string[] here; both Resume Builder and ATS page support object shape.

        const response = NextResponse.json(result, { status: 200 })
        return addCorsHeaders(response, request.headers.get('origin'))
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to analyze resume'
        const response = NextResponse.json({ error: message }, { status: 500 })
        return addCorsHeaders(response, request.headers.get('origin'))
    }
}
