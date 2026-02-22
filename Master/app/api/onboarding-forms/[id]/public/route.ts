import { NextRequest, NextResponse } from 'next/server'
import { getOnboardingFormById } from '@/modules/onboarding-forms/service'

/** Public: no auth. Returns form structure so anyone with the link can fill the form. */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const form = await getOnboardingFormById(id)
    if (!form) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 })
    }
    return NextResponse.json({
      id: form.id,
      title: form.title,
      description: form.description,
      fields: form.fields,
    })
  } catch {
    return NextResponse.json({ error: 'Failed to load form' }, { status: 500 })
  }
}
