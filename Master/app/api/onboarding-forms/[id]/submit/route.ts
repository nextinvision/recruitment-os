import { NextRequest, NextResponse } from 'next/server'
import { handleCors } from '@/lib/cors'
import { submitOnboardingForm } from '@/modules/onboarding-forms/service'

/** Public submit: no auth required so clients can fill the form via shareable link */
export async function OPTIONS(request: NextRequest) {
  return handleCors(request) || new NextResponse(null, { status: 204 })
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const corsResponse = handleCors(request)
    if (corsResponse) return corsResponse

    const { id: formId } = await params
    const body = await request.json()
    const submission = await submitOnboardingForm(formId, body)
    return NextResponse.json(
      { message: 'Submitted successfully', id: submission.id },
      { status: 201 }
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to submit form'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
