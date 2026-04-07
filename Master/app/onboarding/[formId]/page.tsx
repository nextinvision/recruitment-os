'use client'

import { useEffect, useState, Suspense } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { Input, Textarea, Select, Button, Alert, Card, Spinner } from '@/ui'

type FormField = {
  id: string
  key: string
  label: string
  type: 'text' | 'email' | 'phone' | 'number' | 'textarea' | 'select' | 'section'
  required?: boolean
  options?: string[]
  placeholder?: string
}

type FormPublic = {
  id: string
  title: string
  description: string | null
  fields: FormField[]
}

function OnboardingFormContent() {
  const params = useParams()
  const searchParams = useSearchParams()
  const formId = params?.formId as string
  const leadId = searchParams.get('leadId')
  const [form, setForm] = useState<FormPublic | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [values, setValues] = useState<Record<string, string | number | string[]>>({})

  useEffect(() => {
    if (!formId) return
    fetch(`/api/onboarding-forms/${formId}/public`)
      .then((res) => {
        if (!res.ok) throw new Error('Form not found')
        return res.json()
      })
      .then((data: FormPublic) => {
        setForm(data)
        const initial: Record<string, string | number | string[]> = {}
        ;(data.fields || []).forEach((f) => {
          if (f.type !== 'section') initial[f.id] = ''
        })
        setValues(initial)
      })
      .catch((err) => {
        console.error('Fetch error:', err)
        setError('Form not found or no longer available.')
      })
      .finally(() => setLoading(false))
  }, [formId])

  const handleChange = (fieldId: string, value: string | number | string[]) => {
    setValues((prev) => ({ ...prev, [fieldId]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form) return
    setSubmitting(true)
    setError('')
    try {
      const data: Record<string, string | number | string[]> = {}
      for (const f of form.fields) {
        if (f.type === 'section') continue
        const v = values[f.id]
        if (v !== undefined) data[f.key] = v
      }
      const res = await fetch(`/api/onboarding-forms/${formId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data, leadId: leadId || undefined }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to submit form responses. Please try again.')
      }
      setSuccess(true)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit form responses.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-careerist-bg flex flex-col items-center justify-center p-4">
        <Spinner className="w-12 h-12 text-careerist-primary-navy mb-4" />
        <p className="text-careerist-text-secondary animate-pulse">Loading form details...</p>
      </div>
    )
  }

  if (error && !form) {
    return (
      <div className="min-h-screen bg-careerist-bg flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-t-4 border-careerist-error">
          <div className="text-center py-6">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-careerist-error" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-careerist-text-primary mb-2">Unavailable</h2>
            <p className="text-careerist-text-secondary mb-6">{error}</p>
            <Button variant="ghost" onClick={() => window.location.reload()} className="w-full">
              Try Again
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen bg-careerist-bg flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-t-4 border-careerist-success">
          <div className="text-center py-8">
            <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-careerist-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-careerist-text-primary mb-3">Submission Received</h2>
            <p className="text-careerist-text-secondary mb-8">
              Thank you for providing your information. Our team has received your response and will review it shortly.
            </p>
            <div className="p-4 bg-careerist-bg-secondary rounded-xl text-sm text-careerist-text-secondary">
              You can now close this window or return to your previous page.
            </div>
          </div>
        </Card>
      </div>
    )
  }

  if (!form) return null

  return (
    <div className="min-h-screen bg-careerist-bg relative overflow-hidden flex flex-col items-center">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-96 bg-careerist-primary-navy z-0">
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
          backgroundSize: '32px 32px'
        }}></div>
      </div>
      <div className="absolute top-0 right-0 w-72 h-72 bg-careerist-primary-yellow opacity-10 rounded-full blur-3xl -mr-24 -mt-24 z-0"></div>

      <div className="relative z-10 w-full max-w-3xl px-4 py-12">
        {/* Branded Header */}
        <div className="text-center mb-10">
          <div className="flex justify-center mb-6">
            <img
              src="/logo.png"
              alt="Careerist Logo"
              className="h-20 w-auto object-contain drop-shadow-sm"
            />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">{form.title}</h1>
          {form.description && (
            <p className="text-careerist-sidebar-text max-w-xl mx-auto text-lg leading-relaxed">
              {form.description}
            </p>
          )}
        </div>

        <Card className="shadow-2xl border-none overflow-hidden bg-white/95 backdrop-blur-sm rounded-2xl">
          <form onSubmit={handleSubmit} className="divide-y divide-careerist-border">
            {error && (
              <div className="p-6">
                <Alert variant="error" className="shadow-sm">{error}</Alert>
              </div>
            )}

            <div className="p-6 sm:p-10 space-y-8">
              {form.fields.map((field) => {
                if (field.type === 'section') {
                  return (
                    <div key={field.id} className="pt-6 relative">
                      <div className="absolute -left-10 right-0 top-1/2 border-t border-careerist-border -z-10"></div>
                      <h3 className="text-lg font-bold text-careerist-primary-navy bg-white pr-4 inline-block relative z-10">
                        {field.label}
                      </h3>
                      <p className="text-xs text-careerist-text-secondary mt-1 uppercase tracking-wider font-medium">Form Section</p>
                    </div>
                  )
                }

                const value = values[field.id]
                const commonProps = {
                  id: `onboarding-${field.id}`,
                  name: field.id,
                  label: field.label,
                  required: field.required,
                  placeholder: field.placeholder,
                  className: "transition-all duration-200 focus:ring-2 focus:ring-careerist-primary-yellow/50"
                }

                return (
                  <div key={field.id} className="space-y-1 animation-fade-in">
                    {field.type === 'textarea' ? (
                      <Textarea
                        {...commonProps}
                        value={typeof value === 'string' ? value : ''}
                        onChange={(e) => handleChange(field.id, e.target.value)}
                        rows={4}
                      />
                    ) : field.type === 'select' ? (
                      <Select
                        {...commonProps}
                        value={typeof value === 'string' || typeof value === 'number' ? value : ''}
                        onChange={(e) => handleChange(field.id, e.target.value)}
                        options={[
                          { value: '', label: field.placeholder || 'Please select an option...' },
                          ...(field.options || []).map((o) => ({ value: o, label: o })),
                        ]}
                      />
                    ) : (
                      <Input
                        {...commonProps}
                        type={field.type === 'phone' ? 'tel' : field.type === 'number' ? 'number' : field.type}
                        value={typeof value === 'string' || typeof value === 'number' ? String(value) : ''}
                        onChange={(e) =>
                          handleChange(
                            field.id,
                            field.type === 'number' ? (e.target.value ? Number(e.target.value) : '') : e.target.value
                          )
                        }
                      />
                    )}
                  </div>
                )
              })}
            </div>

            <div className="p-8 bg-gray-50/80 flex flex-col items-center">
              <div className="w-full max-w-sm">
                <Button
                  type="submit"
                  disabled={submitting}
                  className="w-full h-14 text-lg font-bold shadow-lg shadow-careerist-primary-yellow/20"
                  variant="primary"
                  isLoading={submitting}
                >
                  {submitting ? 'Processing Submission...' : 'Finish & Submit'}
                </Button>
              </div>
              <p className="mt-4 text-xs text-careerist-text-secondary text-center">
                By submitting this form, you acknowledge that the information provided is accurate and will be used for onboarding purposes.
              </p>
            </div>
          </form>
        </Card>

        {/* Branded Footer */}
        <div className="mt-12 text-center text-careerist-text-secondary text-sm">
          <p>© {new Date().getFullYear()} Careerist Recruitment Management System. All rights reserved.</p>
        </div>
      </div>

      <style jsx global>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animation-fade-in {
          animation: fade-in 0.4s ease-out forwards;
        }
      `}</style>
    </div>
  )
}

export default function OnboardingFormFillPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-careerist-bg flex items-center justify-center">
        <Spinner />
      </div>
    }>
      <OnboardingFormContent />
    </Suspense>
  )
}
