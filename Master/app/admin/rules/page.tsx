'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/DashboardLayout'
import { DataTable } from '@/ui/DataTable'
import { Modal } from '@/ui/Modal'
import { RuleBuilder } from '@/ui/RuleBuilder'

interface AutomationRule {
  id: string
  name: string
  description?: string
  entity: string
  enabled: boolean
  priority: number
  conditions: Array<{
    field: string
    operator: string
    value?: string | number | boolean | null
  }>
  actions: Array<{
    type: string
    target?: string
    message?: string
    metadata?: Record<string, unknown>
  }>
  createdAt: string
  updatedAt: string
  lastRunAt?: string
  runCount: number
  creator: {
    id: string
    email: string
    firstName: string
    lastName: string
  }
}

export default function RulesPage() {
  const router = useRouter()
  const [rules, setRules] = useState<AutomationRule[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingRule, setEditingRule] = useState<AutomationRule | null>(null)

  useEffect(() => {
    loadRules()
  }, [])

  const loadRules = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/login')
        return
      }

      const response = await fetch('/api/rules', {
        headers: {
          ...(token && { 'Authorization': `Bearer ${token}` }),
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      })

      if (response.ok) {
        const data = await response.json()
        setRules(data)
      }
    } catch (err) {
      console.error('Failed to load rules:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleToggle = async (ruleId: string, enabled: boolean) => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const response = await fetch(`/api/rules/${ruleId}/toggle`, {
        method: 'PATCH',
        headers: {
          ...(token && { 'Authorization': `Bearer ${token}` }),
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ enabled: !enabled }),
      })

      if (response.ok) {
        await loadRules()
      }
    } catch (err) {
      console.error('Failed to toggle rule:', err)
    }
  }

  const handleDelete = async (ruleId: string) => {
    if (!confirm('Are you sure you want to delete this rule?')) {
      return
    }

    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const response = await fetch(`/api/rules/${ruleId}`, {
        method: 'DELETE',
        headers: {
          ...(token && { 'Authorization': `Bearer ${token}` }),
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      })

      if (response.ok) {
        await loadRules()
      }
    } catch (err) {
      console.error('Failed to delete rule:', err)
    }
  }

  const handleEdit = (rule: AutomationRule) => {
    setEditingRule(rule)
    setShowModal(true)
  }

  const handleCreate = () => {
    setEditingRule(null)
    setShowModal(true)
  }

  const handleModalClose = () => {
    setShowModal(false)
    setEditingRule(null)
    loadRules()
  }

  const columns = [
    {
      key: 'name',
      header: 'Rule Name',
      render: (rule: AutomationRule) => (
        <div>
          <div className="font-medium text-gray-900">{rule.name}</div>
          {rule.description && (
            <div className="text-sm text-gray-500">{rule.description}</div>
          )}
        </div>
      ),
    },
    {
      key: 'entity',
      header: 'Entity',
      render: (rule: AutomationRule) => (
        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
          {rule.entity}
        </span>
      ),
    },
    {
      key: 'conditions',
      header: 'Conditions',
      render: (rule: AutomationRule) => (
        <div className="text-sm text-gray-600">
          {rule.conditions.length} condition{rule.conditions.length !== 1 ? 's' : ''}
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (rule: AutomationRule) => (
        <div className="text-sm text-gray-600">
          {rule.actions.length} action{rule.actions.length !== 1 ? 's' : ''}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (rule: AutomationRule) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleToggle(rule.id, rule.enabled)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              rule.enabled ? 'bg-green-600' : 'bg-gray-300'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                rule.enabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
          <span className="text-sm text-gray-600">
            {rule.enabled ? 'Enabled' : 'Disabled'}
          </span>
        </div>
      ),
    },
    {
      key: 'stats',
      header: 'Stats',
      render: (rule: AutomationRule) => (
        <div className="text-sm text-gray-600">
          <div>Runs: {rule.runCount}</div>
          {rule.lastRunAt && (
            <div className="text-xs text-gray-500">
              Last: {new Date(rule.lastRunAt).toLocaleDateString()}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (rule: AutomationRule) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleEdit(rule)}
            className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800"
          >
            Edit
          </button>
          <button
            onClick={() => handleDelete(rule.id)}
            className="px-3 py-1 text-sm text-red-600 hover:text-red-800"
          >
            Delete
          </button>
        </div>
      ),
    },
  ]

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Automation Rules</h1>
            <p className="text-sm text-gray-600 mt-1">Manage automation rules for your recruitment pipeline</p>
          </div>
          <button
            onClick={handleCreate}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            + Create Rule
          </button>
        </div>

        <DataTable
          data={rules}
          columns={columns}
          searchable
          searchPlaceholder="Search rules..."
        />

        {showModal && (
          <Modal
            isOpen={showModal}
            onClose={handleModalClose}
            title={editingRule ? 'Edit Rule' : 'Create Rule'}
          >
            <RuleBuilder
              rule={editingRule}
              onSave={handleModalClose}
              onCancel={handleModalClose}
            />
          </Modal>
        )}
      </div>
    </DashboardLayout>
  )
}

