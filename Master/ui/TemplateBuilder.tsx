'use client'

import { useState, useEffect } from 'react'

interface MessageTemplate {
  id?: string
  name: string
  type: string
  channel: string
  subject?: string
  content: string
  variables: string[]
  enabled: boolean
}

interface TemplateBuilderProps {
  template?: MessageTemplate | null
  onSave: () => void
  onCancel: () => void
}

const TEMPLATE_TYPES = [
  { value: 'FOLLOW_UP', label: 'Follow-up' },
  { value: 'INTERVIEW_REMINDER', label: 'Interview Reminder' },
  { value: 'OFFER_LETTER', label: 'Offer Letter' },
  { value: 'WELCOME', label: 'Welcome' },
  { value: 'REJECTION', label: 'Rejection' },
  { value: 'CUSTOM', label: 'Custom' },
]

const CHANNELS = [
  { value: 'WHATSAPP', label: 'WhatsApp' },
  { value: 'EMAIL', label: 'Email' },
  { value: 'SMS', label: 'SMS' },
]

export function TemplateBuilder({ template, onSave, onCancel }: TemplateBuilderProps) {
  const [formData, setFormData] = useState<MessageTemplate>({
    name: template?.name || '',
    type: template?.type || 'CUSTOM',
    channel: template?.channel || 'WHATSAPP',
    subject: template?.subject || '',
    content: template?.content || '',
    variables: template?.variables || [],
    enabled: template?.enabled ?? true,
  })

  const [saving, setSaving] = useState(false)
  const [variableInput, setVariableInput] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const url = template?.id ? `/api/messages/templates/${template.id}` : '/api/messages/templates'
      const method = template?.id ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          ...(token && { 'Authorization': `Bearer ${token}` }),
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        onSave()
      } else {
        const error = await response.json()
        alert(`Failed to save template: ${error.error}`)
      }
    } catch (err) {
      console.error('Failed to save template:', err)
      alert('Failed to save template')
    } finally {
      setSaving(false)
    }
  }

  const addVariable = () => {
    if (variableInput.trim() && !formData.variables.includes(variableInput.trim())) {
      setFormData({
        ...formData,
        variables: [...formData.variables, variableInput.trim()],
      })
      setVariableInput('')
    }
  }

  const removeVariable = (variable: string) => {
    setFormData({
      ...formData,
      variables: formData.variables.filter((v) => v !== variable),
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">Template Name *</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Type *</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            >
              {TEMPLATE_TYPES.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Channel *</label>
            <select
              value={formData.channel}
              onChange={(e) => setFormData({ ...formData, channel: e.target.value })}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            >
              {CHANNELS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {formData.channel === 'EMAIL' && (
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Subject *</label>
            <input
              type="text"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required={formData.channel === 'EMAIL'}
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">Content *</label>
          <textarea
            value={formData.content}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            rows={10}
            required
            placeholder="Use {{variableName}} for variables"
          />
          <p className="text-xs text-gray-500 mt-1">
            Use {'{{variableName}}'} to insert variables. Example: Hello {'{{name}}'}, your interview is scheduled for {'{{date}}'}.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">Variables</label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={variableInput}
              onChange={(e) => setVariableInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  addVariable()
                }
              }}
              placeholder="Variable name (e.g., name, date)"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
            <button
              type="button"
              onClick={addVariable}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
            >
              Add
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {formData.variables.map((variable) => (
              <span
                key={variable}
                className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded"
              >
                {variable}
                <button
                  type="button"
                  onClick={() => removeVariable(variable)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? 'Saving...' : template?.id ? 'Update Template' : 'Create Template'}
        </button>
      </div>
    </form>
  )
}

