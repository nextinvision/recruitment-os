'use client'

import { useState, useEffect } from 'react'
import { useToast } from './Toast'

interface RuleCondition {
  field: string
  operator: string
  value?: string | number | boolean | null
}

interface RuleAction {
  type: string
  target?: string
  message?: string
  metadata?: Record<string, unknown>
}

interface AutomationRule {
  id?: string
  name: string
  description?: string
  entity: string
  enabled: boolean
  priority: number
  conditions: RuleCondition[]
  actions: RuleAction[]
}

interface RuleBuilderProps {
  rule?: AutomationRule | null
  onSave: () => void
  onCancel: () => void
}

const ENTITY_OPTIONS = [
  { value: 'LEAD', label: 'Lead' },
  { value: 'CLIENT', label: 'Client' },
  { value: 'FOLLOW_UP', label: 'Follow-up' },
  { value: 'APPLICATION', label: 'Application' },
  { value: 'REVENUE', label: 'Revenue' },
  { value: 'PAYMENT', label: 'Payment' },
]

const OPERATOR_OPTIONS = [
  { value: 'EQUALS', label: 'Equals' },
  { value: 'NOT_EQUALS', label: 'Not Equals' },
  { value: 'GREATER_THAN', label: 'Greater Than' },
  { value: 'LESS_THAN', label: 'Less Than' },
  { value: 'GREATER_THAN_OR_EQUAL', label: 'Greater Than or Equal' },
  { value: 'LESS_THAN_OR_EQUAL', label: 'Less Than or Equal' },
  { value: 'CONTAINS', label: 'Contains' },
  { value: 'NOT_CONTAINS', label: 'Not Contains' },
  { value: 'IS_NULL', label: 'Is Null' },
  { value: 'IS_NOT_NULL', label: 'Is Not Null' },
  { value: 'DAYS_SINCE', label: 'Days Since' },
  { value: 'DAYS_UNTIL', label: 'Days Until' },
]

const ACTION_TYPE_OPTIONS = [
  { value: 'NOTIFY_EMPLOYEE', label: 'Notify Employee' },
  { value: 'NOTIFY_MANAGER', label: 'Notify Manager' },
  { value: 'NOTIFY_ADMIN', label: 'Notify Admin' },
  { value: 'ESCALATE', label: 'Escalate' },
  { value: 'CREATE_ACTIVITY', label: 'Create Activity' },
  { value: 'UPDATE_STATUS', label: 'Update Status' },
  { value: 'CREATE_FOLLOW_UP', label: 'Create Follow-up' },
]

export function RuleBuilder({ rule, onSave, onCancel }: RuleBuilderProps) {
  const { showToast } = useToast()
  const [formData, setFormData] = useState<AutomationRule>({
    name: rule?.name || '',
    description: rule?.description || '',
    entity: rule?.entity || 'LEAD',
    enabled: rule?.enabled ?? true,
    priority: rule?.priority || 0,
    conditions: rule?.conditions || [{ field: '', operator: 'EQUALS', value: '' }],
    actions: rule?.actions || [{ type: 'NOTIFY_EMPLOYEE', message: '' }],
  })

  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const url = rule?.id ? `/api/rules/${rule.id}` : '/api/rules'
      const method = rule?.id ? 'PATCH' : 'POST'

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
        showToast(rule?.id ? 'Rule updated successfully' : 'Rule created successfully', 'success')
        onSave()
      } else {
        const error = await response.json()
        showToast(`Failed to save rule: ${error.error}`, 'error')
      }
    } catch (err) {
      console.error('Failed to save rule:', err)
      showToast('Failed to save rule', 'error')
    } finally {
      setSaving(false)
    }
  }

  const addCondition = () => {
    setFormData({
      ...formData,
      conditions: [...formData.conditions, { field: '', operator: 'EQUALS', value: '' }],
    })
  }

  const removeCondition = (index: number) => {
    setFormData({
      ...formData,
      conditions: formData.conditions.filter((_, i) => i !== index),
    })
  }

  const updateCondition = (index: number, updates: Partial<RuleCondition>) => {
    const newConditions = [...formData.conditions]
    newConditions[index] = { ...newConditions[index], ...updates }
    setFormData({ ...formData, conditions: newConditions })
  }

  const addAction = () => {
    setFormData({
      ...formData,
      actions: [...formData.actions, { type: 'NOTIFY_EMPLOYEE', message: '' }],
    })
  }

  const removeAction = (index: number) => {
    setFormData({
      ...formData,
      actions: formData.actions.filter((_, i) => i !== index),
    })
  }

  const updateAction = (index: number, updates: Partial<RuleAction>) => {
    const newActions = [...formData.actions]
    newActions[index] = { ...newActions[index], ...updates }
    setFormData({ ...formData, actions: newActions })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Info */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">Rule Name *</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">Description</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            rows={3}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Entity *</label>
            <select
              value={formData.entity}
              onChange={(e) => setFormData({ ...formData, entity: e.target.value })}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            >
              {ENTITY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Priority</label>
            <input
              type="number"
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              min="0"
            />
            <p className="text-xs text-gray-500 mt-1">Higher priority rules run first</p>
          </div>
        </div>
      </div>

      {/* Conditions */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Conditions</h3>
          <button
            type="button"
            onClick={addCondition}
            className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
          >
            + Add Condition
          </button>
        </div>

        <div className="space-y-3">
          {formData.conditions.map((condition, index) => (
            <div key={index} className="flex gap-2 items-start p-3 bg-gray-50 rounded">
              <div className="flex-1 grid grid-cols-3 gap-2">
                <input
                  type="text"
                  placeholder="Field (e.g., status, daysSinceCreated)"
                  value={condition.field}
                  onChange={(e) => updateCondition(index, { field: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                  required
                />
                <select
                  value={condition.operator}
                  onChange={(e) => updateCondition(index, { operator: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                  required
                >
                  {OPERATOR_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                {condition.operator !== 'IS_NULL' && condition.operator !== 'IS_NOT_NULL' && (
                  <input
                    type="text"
                    placeholder="Value"
                    value={condition.value != null ? String(condition.value) : ''}
                    onChange={(e) => {
                      const val = e.target.value
                      // Try to parse as number if possible
                      const numVal = !isNaN(Number(val)) && val !== '' ? Number(val) : val
                      updateCondition(index, { value: numVal })
                    }}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                    required
                  />
                )}
              </div>
              {formData.conditions.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeCondition(index)}
                  className="px-2 py-1 text-red-600 hover:text-red-800"
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Actions</h3>
          <button
            type="button"
            onClick={addAction}
            className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
          >
            + Add Action
          </button>
        </div>

        <div className="space-y-3">
          {formData.actions.map((action, index) => (
            <div key={index} className="flex gap-2 items-start p-3 bg-gray-50 rounded">
              <div className="flex-1 space-y-2">
                <select
                  value={action.type}
                  onChange={(e) => updateAction(index, { type: e.target.value })}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  required
                >
                  {ACTION_TYPE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="Message (optional)"
                  value={action.message || ''}
                  onChange={(e) => updateAction(index, { message: e.target.value })}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
              </div>
              {formData.actions.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeAction(index)}
                  className="px-2 py-1 text-red-600 hover:text-red-800"
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
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
          {saving ? 'Saving...' : rule?.id ? 'Update Rule' : 'Create Rule'}
        </button>
      </div>
    </form>
  )
}

