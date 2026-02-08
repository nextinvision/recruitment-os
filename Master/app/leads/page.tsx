'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { PipelineBoard, Modal, Input, Textarea, Select, Alert, FormActions, PageHeader, Button, Spinner } from '@/ui'
import { DashboardLayout } from '@/components/DashboardLayout'
import { formatINR } from '@/lib/currency'

interface Lead {
  id: string
  companyName: string
  contactName: string
  email?: string
  phone?: string
  status: 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'LOST'
  source?: string
  industry?: string
  estimatedValue?: string
  notes?: string
  assignedUser?: {
    id: string
    firstName: string
    lastName: string
  }
  createdAt: string
}

const LEAD_STAGES = ['NEW', 'CONTACTED', 'QUALIFIED', 'LOST']
const STAGE_LABELS: Record<string, string> = {
  NEW: 'New',
  CONTACTED: 'Contacted',
  QUALIFIED: 'Qualified',
  LOST: 'Lost',
}

export default function LeadsPage() {
  const router = useRouter()
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)

  useEffect(() => {
    loadLeads()
  }, [])

  const loadLeads = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/login')
        return
      }

      const response = await fetch('/api/leads', {
        headers: {
          ...(token && { 'Authorization': `Bearer ${token}` }),
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      })

      if (response.ok) {
        const data = await response.json()
        setLeads(data)
      }
    } catch (err) {
      console.error('Failed to load leads:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateLead = () => {
    setSelectedLead(null)
    setShowCreateModal(true)
  }

  const handleEditLead = (lead: Lead) => {
    setSelectedLead(lead)
    setShowCreateModal(true)
  }

  const handleStageChange = async (leadId: string, newStage: string) => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const response = await fetch(`/api/leads/${leadId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ status: newStage }),
      })

      if (response.ok) {
        await loadLeads()
      }
    } catch (err) {
      console.error('Failed to update lead status:', err)
    }
  }

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
          <h1 className="text-2xl font-bold text-gray-900">Leads</h1>
          <button
            onClick={handleCreateLead}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            + Add Lead
          </button>
        </div>

        <PipelineBoard
          items={leads}
          stages={LEAD_STAGES}
          getStage={(lead) => lead.status}
          onStageChange={handleStageChange}
          renderItem={(lead) => (
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-move">
              <div className="font-semibold text-gray-900">{lead.companyName}</div>
              <div className="text-sm text-gray-600 mt-1">{lead.contactName}</div>
              {lead.email && (
                <div className="text-xs text-gray-500 mt-1">{lead.email}</div>
              )}
              {lead.estimatedValue && (
                <div className="text-sm font-medium text-blue-600 mt-2">
                  {formatINR(lead.estimatedValue)}
                </div>
              )}
              {lead.assignedUser && (
                <div className="text-xs text-gray-500 mt-2">
                  {lead.assignedUser.firstName} {lead.assignedUser.lastName}
                </div>
              )}
            </div>
          )}
          stageLabels={STAGE_LABELS}
        />

        {showCreateModal && (
          <Modal
            isOpen={showCreateModal}
            onClose={() => {
              setShowCreateModal(false)
              setSelectedLead(null)
            }}
            title={selectedLead ? 'Edit Lead' : 'Create Lead'}
          >
            <LeadForm
              lead={selectedLead}
              onSuccess={() => {
                setShowCreateModal(false)
                setSelectedLead(null)
                loadLeads()
              }}
              onCancel={() => {
                setShowCreateModal(false)
                setSelectedLead(null)
              }}
            />
          </Modal>
        )}
      </div>
    </DashboardLayout>
  )
}

function LeadForm({
  lead,
  onSuccess,
  onCancel,
}: {
  lead: Lead | null
  onSuccess: () => void
  onCancel: () => void
}) {
  const [formData, setFormData] = useState({
    companyName: lead?.companyName || '',
    contactName: lead?.contactName || '',
    email: lead?.email || '',
    phone: lead?.phone || '',
    source: lead?.source || '',
    industry: lead?.industry || '',
    estimatedValue: lead?.estimatedValue || '',
    notes: lead?.notes || '',
    status: lead?.status || 'NEW',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const token = localStorage.getItem('token')
      const userData = localStorage.getItem('user')
      const user = userData ? JSON.parse(userData) : null

      const url = lead ? `/api/leads/${lead.id}` : '/api/leads'
      const method = lead ? 'PATCH' : 'POST'

      const payload: any = {
        ...formData,
        estimatedValue: formData.estimatedValue ? parseFloat(formData.estimatedValue) : undefined,
        email: formData.email || undefined,
      }

      if (method === 'POST') {
        payload.assignedUserId = user?.id
      }

      const response = await fetch(url, {
        method,
        headers: {
          ...(token && { 'Authorization': `Bearer ${token}` }),
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        onSuccess()
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to save lead')
      }
    } catch (err) {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <Alert variant="error">{error}</Alert>}

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Company Name"
          type="text"
          required
          value={formData.companyName}
          onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
        />
        <Input
          label="Contact Name"
          type="text"
          required
          value={formData.contactName}
          onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        />
        <Input
          label="Phone"
          type="tel"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Source"
          type="text"
          value={formData.source}
          onChange={(e) => setFormData({ ...formData, source: e.target.value })}
        />
        <Input
          label="Industry"
          type="text"
          value={formData.industry}
          onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
        />
      </div>

      <Input
        label="Estimated Value (INR)"
        type="number"
        step="0.01"
        value={formData.estimatedValue}
        onChange={(e) => setFormData({ ...formData, estimatedValue: e.target.value })}
        placeholder="Enter amount in INR"
      />

      {lead && (
        <Select
          label="Status"
          value={formData.status}
          onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
          options={[
            { value: 'NEW', label: 'New' },
            { value: 'CONTACTED', label: 'Contacted' },
            { value: 'QUALIFIED', label: 'Qualified' },
            { value: 'LOST', label: 'Lost' },
          ]}
        />
      )}

      <Textarea
        label="Notes"
        value={formData.notes}
        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
        rows={3}
      />

      <FormActions
        onCancel={onCancel}
        submitLabel={lead ? 'Update' : 'Create'}
        isLoading={loading}
      />
    </form>
  )
}

