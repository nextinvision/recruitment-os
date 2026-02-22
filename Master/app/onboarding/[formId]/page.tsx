'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Input, Textarea, Select, Button, Alert } from '@/ui'

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

export default function OnboardingFormFillPage() {
  const params = useParams()
  const formId = params?.formId as string
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
          if (f.type !== 'section') initial[f.key] = ''
        })
        setValues(initial)
      })
      .catch(() => setError('Form not found or no longer available.'))
      .finally(() => setLoading(false))
  }, [formId])

  const handleChange = (key: string, value: string | number | string[]) => {
    setValues((prev) => ({ ...prev, [key]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form) return
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch(`/api/onboarding-forms/${formId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: values }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to submit')
      }
      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Loading form...</p>
      </div>
    )
  }

  if (error && !form) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Alert variant="error">{error}</Alert>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow border border-gray-200 p-8 max-w-md text-center">
          <h2 className="text-xl font-semibold text-careerist-primary-navy mb-2">Thank you</h2>
          <p className="text-gray-600">Your responses have been submitted successfully.</p>
        </div>
      </div>
    )
  }

  if (!form) return null

  const inputFields = form.fields.filter((f) => f.type !== 'section')

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
        <div className="bg-careerist-primary-navy text-white px-6 py-4">
          <h1 className="text-xl font-semibold">{form.title}</h1>
          {form.description && (
            <p className="text-careerist-primary-yellow/90 text-sm mt-1">{form.description}</p>
          )}
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <Alert variant="error">{error}</Alert>}
          {form.fields.map((field) => {
            if (field.type === 'section') {
              return (
                <div key={field.id} className="pt-4">
                  <h3 className="text-sm font-semibold text-gray-800 border-b border-gray-200 pb-2">
                    {field.label}
                  </h3>
                </div>
              )
            }
            const value = values[field.key]
            const common = {
              label: field.label,
              required: field.required,
              placeholder: field.placeholder,
            }
            if (field.type === 'textarea') {
              return (
                <Textarea
                  key={field.id}
                  {...common}
                  value={typeof value === 'string' ? value : ''}
                  onChange={(e) => handleChange(field.key, e.target.value)}
                  rows={3}
                />
              )
            }
            if (field.type === 'select') {
              return (
                <Select
                  key={field.id}
                  {...common}
                  value={typeof value === 'string' || typeof value === 'number' ? value : ''}
                  onChange={(e) => handleChange(field.key, e.target.value)}
                  options={[
                    { value: '', label: field.placeholder || 'Select...' },
                    ...(field.options || []).map((o) => ({ value: o, label: o })),
                  ]}
                />
              )
            }
            return (
              <Input
                key={field.id}
                {...common}
                type={field.type === 'phone' ? 'tel' : field.type === 'number' ? 'number' : field.type}
                value={typeof value === 'string' || typeof value === 'number' ? String(value) : ''}
                onChange={(e) =>
                  handleChange(
                    field.key,
                    field.type === 'number' ? (e.target.value ? Number(e.target.value) : '') : e.target.value
                  )
                }
              />
            )
          })}
          <div className="pt-4">
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Submitting...' : 'Submit'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
