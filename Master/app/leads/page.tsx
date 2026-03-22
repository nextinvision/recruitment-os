'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { PipelineBoard, Modal, Input, Textarea, Select, Alert, FormActions, PageHeader, Button, Spinner, useToast, ActivityTimeline, SendToWhatsAppButton } from '@/ui'
import { DashboardLayout } from '@/components/DashboardLayout'
import { formatINR } from '@/lib/currency'

interface Lead {
  id: string
  firstName: string
  lastName: string
  currentCompany?: string
  email?: string
  phone?: string
  status: 'NEW' | 'CONTACTED' | 'RESPONSE_RECEIVED' | 'QUALIFIED' | 'LOST'
  source?: string
  industry?: string
  estimatedValue?: string
  notes?: string
  assignedUser?: {
    id: string
    firstName: string
    lastName: string
  }
  client?: { id: string }
  createdAt: string
}

interface LeadDocument {
  id: string
  leadId: string
  fileName: string
  fileUrl: string
  originalFileName: string
  fileSize: number
  mimeType: string | null
  uploadedAt: string
}

interface Activity {
  id: string
  type: 'CALL' | 'EMAIL' | 'MEETING' | 'NOTE' | 'TASK' | 'FOLLOW_UP'
  title: string
  description?: string
  occurredAt: string
  assignedUser: {
    id: string
    firstName: string
    lastName: string
  }
}

const LEAD_STAGES = ['NEW', 'CONTACTED', 'RESPONSE_RECEIVED', 'QUALIFIED', 'LOST']
const STAGE_LABELS: Record<string, string> = {
  NEW: 'New',
  CONTACTED: 'Contacted',
  RESPONSE_RECEIVED: 'Response Received',
  QUALIFIED: 'Qualified',
  LOST: 'Lost',
}

export default function LeadsPage() {
  const router = useRouter()
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [leadToView, setLeadToView] = useState<Lead | null>(null)
  const [showSendOnboardingModal, setShowSendOnboardingModal] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const { showToast } = useToast()

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
        setLeads(Array.isArray(data) ? data : [])
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

  const handleViewLead = (lead: Lead) => {
    setLeadToView(lead)
  }

  const handleEditLead = (lead: Lead) => {
    setSelectedLead(lead)
    setLeadToView(null)
    setShowCreateModal(true)
  }

  const handleConvertToClient = async (lead: Lead) => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const patchRes = await fetch(`/api/leads/${lead.id}`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: 'QUALIFIED' }),
      })
      if (!patchRes.ok) {
        const data = await patchRes.json().catch(() => ({}))
        showToast(data.error || 'Failed to update lead', 'error')
        return
      }

      const clientRes = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          firstName: lead.firstName,
          lastName: lead.lastName,
          email: lead.email,
          phone: lead.phone,
          industry: lead.industry,
          notes: lead.notes && lead.currentCompany
            ? `Converted from lead (${lead.currentCompany})\n${lead.notes}`
            : lead.currentCompany
              ? `Converted from lead: ${lead.currentCompany}`
              : lead.notes || 'Converted from lead',
          leadId: lead.id,
          assignedUserId: lead.assignedUser?.id,
        }),
      })

      if (clientRes.ok) {
        const client = await clientRes.json()
        setLeadToView(null)
        loadLeads()
        showToast('Lead converted to client. Add more details on the client page.', 'success')
        router.push(`/clients/${client.id}`)
      } else {
        const data = await clientRes.json().catch(() => ({}))
        showToast(data.error || 'Failed to create client', 'error')
      }
    } catch (err) {
      console.error('Convert lead error:', err)
      showToast('Failed to convert lead to client', 'error')
    }
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

  const handleTidyCalSync = async () => {
    setSyncing(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/tidycal/sync', {
        method: 'POST',
        headers: {
          ...(token && { 'Authorization': `Bearer ${token}` }),
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      })

      if (response.ok) {
        const data = await response.json()
        showToast(data.message || 'TidyCal sync complete', 'success')
        loadLeads()
      } else {
        const data = await response.json()
        showToast(data.error || 'Failed to sync TidyCal', 'error')
      }
    } catch (err) {
      console.error('TidyCal sync error:', err)
      showToast('TidyCal sync error', 'error')
    } finally {
      setSyncing(false)
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
          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={handleTidyCalSync}
              isLoading={syncing}
            >
              Sync TidyCal
            </Button>
            <button
              onClick={handleCreateLead}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              + Add Lead
            </button>
          </div>
        </div>

        <PipelineBoard
          items={leads}
          stages={LEAD_STAGES}
          getStage={(lead) => lead.status}
          onStageChange={handleStageChange}
          onItemClick={handleViewLead}
          condensed={true}
          searchable={true}
          getSearchableFields={(lead) => [
            lead.firstName ?? '',
            lead.lastName ?? '',
            lead.email ?? '',
            lead.currentCompany ?? '',
            lead.phone ?? '',
            lead.industry ?? '',
            lead.source ?? '',
          ]}
          searchPlaceholder="Search leads in this stage…"
          renderItem={(lead) => (
            <div className="flex flex-col gap-0.5 w-full min-w-0">
              <div className="flex justify-between items-start gap-2">
                <span className="font-bold text-gray-800 truncate text-[13px] leading-tight">
                  {lead.firstName} {lead.lastName}
                </span>
                {lead.estimatedValue && (
                  <span className="text-[9px] font-bold text-blue-600 bg-blue-50/50 px-1.5 py-0.5 rounded border border-blue-100 shrink-0">
                    {formatINR(lead.estimatedValue)}
                  </span>
                )}
              </div>

              <div className="flex flex-col gap-0.5">
                {lead.currentCompany && (
                  <span className="text-[11px] text-gray-500 truncate font-medium flex items-center gap-1">
                    <svg className="w-2.5 h-2.5 opacity-50" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clipRule="evenodd" />
                    </svg>
                    {lead.currentCompany}
                  </span>
                )}
                {lead.email && (
                  <span className="text-[10px] text-gray-400 truncate flex items-center gap-1">
                    <svg className="w-2.5 h-2.5 opacity-50" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                      <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                    </svg>
                    {lead.email}
                  </span>
                )}
              </div>

              {lead.assignedUser && (
                <div className="flex items-center gap-1.5 mt-1 border-t border-gray-50 pt-1.5 opacity-70 group-hover:opacity-100 transition-opacity">
                  <div className="w-4 h-4 rounded-full bg-blue-50 flex items-center justify-center text-[8px] font-extrabold text-blue-600 uppercase border border-blue-100 shrink-0">
                    {lead.assignedUser.firstName[0]}
                  </div>
                  <span className="text-[10px] text-gray-400 font-semibold truncate leading-none">
                    {lead.assignedUser.firstName} {lead.assignedUser.lastName}
                  </span>
                </div>
              )}
            </div>
          )}
          stageLabels={STAGE_LABELS}
        />

        {/* Lead detail popup */}
        {leadToView && (
          <Modal
            isOpen={!!leadToView}
            onClose={() => setLeadToView(null)}
            title={`${leadToView.firstName} ${leadToView.lastName}`}
            size="lg"
          >
            <LeadDetailView
              lead={leadToView}
              onEdit={() => {
                setSelectedLead(leadToView)
                setLeadToView(null)
                setShowCreateModal(true)
              }}
              onClose={() => setLeadToView(null)}
              onConvertToClient={handleConvertToClient}
              onSendOnboarding={() => setShowSendOnboardingModal(true)}
            />
          </Modal>
        )}

        {showSendOnboardingModal && leadToView && (
          <Modal
            isOpen={showSendOnboardingModal}
            onClose={() => setShowSendOnboardingModal(false)}
            title="Send Onboarding Form"
          >
            <SendOnboardingModal
              lead={leadToView}
              onSuccess={() => {
                setShowSendOnboardingModal(false)
                loadLeads()
                showToast('Onboarding form sent successfully', 'success')
              }}
              onCancel={() => setShowSendOnboardingModal(false)}
            />
          </Modal>
        )}

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

function LeadDetailView({
  lead,
  onEdit,
  onClose,
  onConvertToClient,
  onSendOnboarding,
}: {
  lead: Lead
  onEdit: () => void
  onClose: () => void
  onConvertToClient?: (lead: Lead) => void
  onSendOnboarding?: () => void
}) {
  const [activities, setActivities] = useState<Activity[]>([])
  const [activitiesLoading, setActivitiesLoading] = useState(true)

  useEffect(() => {
    if (!lead?.id) return
    const token = localStorage.getItem('token')
    if (!token) {
      setActivitiesLoading(false)
      return
    }
    setActivitiesLoading(true)
    fetch(`/api/activities/entity/lead/${lead.id}`, {
      headers: { Authorization: `Bearer ${token}` },
      credentials: 'include',
    })
      .then((res) => (res.ok ? res.json() : { activities: [] }))
      .then((data) => {
        setActivities(Array.isArray(data) ? data : (data?.activities ?? []))
      })
      .catch(() => setActivities([]))
      .finally(() => setActivitiesLoading(false))
  }, [lead?.id])

  const statusColors: Record<string, string> = {
    NEW: 'bg-blue-100 text-blue-800',
    CONTACTED: 'bg-yellow-100 text-yellow-800',
    RESPONSE_RECEIVED: 'bg-purple-100 text-purple-800',
    QUALIFIED: 'bg-green-100 text-green-800',
    LOST: 'bg-red-100 text-red-800',
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className={`px-2 py-1 rounded text-sm font-medium ${statusColors[lead.status] || 'bg-gray-100 text-gray-800'}`}>
          {lead.status}
        </span>
        {lead.assignedUser && (
          <span className="text-sm text-gray-600">
            Assigned: {lead.assignedUser.firstName} {lead.assignedUser.lastName}
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <label className="font-medium text-gray-500 block">Current Company</label>
          <p className="text-gray-900">{lead.currentCompany || '—'}</p>
        </div>
        <div>
          <label className="font-medium text-gray-500 block">Email</label>
          <p className="text-gray-900">{lead.email || '—'}</p>
        </div>
        <div>
          <label className="font-medium text-gray-500 block">Phone</label>
          <p className="text-gray-900">{lead.phone || '—'}</p>
        </div>
        <div>
          <label className="font-medium text-gray-500 block">Source</label>
          <p className="text-gray-900">{lead.source || '—'}</p>
        </div>
        <div>
          <label className="font-medium text-gray-500 block">Industry</label>
          <p className="text-gray-900">{lead.industry || '—'}</p>
        </div>
        {lead.estimatedValue != null && lead.estimatedValue !== '' && (
          <div>
            <label className="font-medium text-gray-500 block">Estimated Value</label>
            <p className="text-gray-900 font-medium">{formatINR(lead.estimatedValue)}</p>
          </div>
        )}
      </div>

      {lead.notes && (
        <div>
          <label className="font-medium text-gray-500 block text-sm mb-1">Notes</label>
          <p className="text-gray-900 text-sm whitespace-pre-wrap bg-gray-50 p-3 rounded border border-gray-200">{lead.notes}</p>
        </div>
      )}

      <div className="border-t border-gray-200 pt-4">
        <label className="font-medium text-gray-500 block text-sm mb-2">Activities & Meetings</label>
        {activitiesLoading ? (
          <div className="flex items-center justify-center py-6">
            <Spinner />
          </div>
        ) : (
          <ActivityTimeline activities={activities} entityName={`${lead.firstName} ${lead.lastName}`} />
        )}
      </div>

      <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-200">
        <button
          type="button"
          onClick={onEdit}
          className="px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          Edit
        </button>
        {onConvertToClient && !lead.client && (
          <button
            type="button"
            onClick={() => onConvertToClient(lead)}
            className="px-3 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
          >
            Convert to Client
          </button>
        )}
        {onSendOnboarding && !lead.client && (
          <button
            type="button"
            onClick={onSendOnboarding}
            className="px-3 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors"
          >
            Send to Client
          </button>
        )}
        {lead.client && (
          <a
            href={`/clients/${lead.client.id}`}
            className="px-3 py-2 bg-gray-100 text-gray-800 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors inline-block"
          >
            View Client
          </a>
        )}
        <button
          type="button"
          onClick={onClose}
          className="px-3 py-2 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-100 transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  )
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
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
    firstName: lead?.firstName || '',
    lastName: lead?.lastName || '',
    currentCompany: lead?.currentCompany || '',
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
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [existingDocuments, setExistingDocuments] = useState<LeadDocument[]>([])
  const [documentsLoading, setDocumentsLoading] = useState(false)

  useEffect(() => {
    if (lead?.id) {
      setDocumentsLoading(true)
      const token = localStorage.getItem('token')
      if (!token) {
        setDocumentsLoading(false)
        return
      }
      fetch(`/api/leads/${lead.id}/documents`, {
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include',
      })
        .then((res) => (res.ok ? res.json() : []))
        .then((list) => {
          setExistingDocuments(Array.isArray(list) ? list : [])
        })
        .catch(() => setExistingDocuments([]))
        .finally(() => setDocumentsLoading(false))
    } else {
      setExistingDocuments([])
    }
  }, [lead?.id])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files?.length) return
    setSelectedFiles((prev) => [...prev, ...Array.from(files)])
    e.target.value = ''
  }

  const removeSelectedFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const handleDeleteDocument = async (docId: string) => {
    const token = localStorage.getItem('token')
    if (!token || !lead?.id) return
    try {
      const res = await fetch(`/api/leads/${lead.id}/documents/${docId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include',
      })
      if (res.ok) {
        setExistingDocuments((prev) => prev.filter((d) => d.id !== docId))
      }
    } catch (err) {
      console.error('Failed to delete document', err)
    }
  }

  const uploadFilesForLead = async (
    leadId: string,
    token: string,
    files: File[]
  ): Promise<{ ok: boolean; error?: string }> => {
    for (const file of files) {
      if (!file || file.size === 0) continue
      const formDataUpload = new FormData()
      formDataUpload.append('file', file, file.name || 'upload')
      const res = await fetch(`/api/leads/${leadId}/documents`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include',
        body: formDataUpload,
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        return { ok: false, error: data?.error || `Upload failed (${res.status})` }
      }
    }
    return { ok: true }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const token = localStorage.getItem('token')
      const userData = localStorage.getItem('user')
      const user = userData ? JSON.parse(userData) : null
      if (!token) {
        setError('Not authenticated')
        setLoading(false)
        return
      }

      const url = lead ? `/api/leads/${lead.id}` : '/api/leads'
      const method = lead ? 'PATCH' : 'POST'

      const payload: Record<string, unknown> = {
        ...formData,
        estimatedValue: formData.estimatedValue ? parseFloat(formData.estimatedValue) : undefined,
        email: formData.email || undefined,
      }

      if (method === 'POST') {
        (payload as Record<string, string>).assignedUserId = user?.id
      }

      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const data = await response.json()
        setError(data.error || 'Failed to save lead')
        setLoading(false)
        return
      }

      let leadId = lead?.id
      if (method === 'POST') {
        const created = await response.json()
        leadId = created.id
      }

      const filesToUpload = selectedFiles.slice()
      if (leadId && filesToUpload.length > 0) {
        const uploadResult = await uploadFilesForLead(leadId, token, filesToUpload)
        if (!uploadResult.ok) {
          setError(uploadResult.error ?? 'Lead saved but some file uploads failed.')
          setLoading(false)
          return
        }
      }

      onSuccess()
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
          label="First Name"
          type="text"
          required
          value={formData.firstName}
          onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
        />
        <Input
          label="Last Name"
          type="text"
          required
          value={formData.lastName}
          onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
        />
      </div>

      <Input
        label="Current Company (optional)"
        type="text"
        value={formData.currentCompany}
        onChange={(e) => setFormData({ ...formData, currentCompany: e.target.value })}
        placeholder="Where they work or referring company"
      />

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
            { value: 'RESPONSE_RECEIVED', label: 'Response Received' },
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

      <div>
        <label className="block text-sm font-medium text-gray-900 mb-2">Attachments</label>
        <p className="text-xs text-gray-500 mb-2">Upload any format (PDF, DOC, images, etc.)</p>
        <input
          type="file"
          multiple
          accept="*"
          onChange={handleFileSelect}
          className="block w-full text-sm text-gray-700 border border-gray-300 rounded-lg cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#1F3A5F] focus:border-transparent"
        />
        {documentsLoading && (
          <p className="mt-2 text-sm text-gray-500">Loading existing files…</p>
        )}
        {Array.isArray(existingDocuments) && existingDocuments.length > 0 && (
          <ul className="mt-3 space-y-2">
            {(Array.isArray(existingDocuments) ? existingDocuments : []).map((doc) => (
              <li
                key={doc.id}
                className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded border border-gray-200 text-sm"
              >
                <span className="text-gray-900 truncate flex-1" title={doc.originalFileName}>
                  {doc.originalFileName}
                </span>
                <span className="text-gray-500 text-xs ml-2 shrink-0">
                  {formatFileSize(doc.fileSize)}
                </span>
                <button
                  type="button"
                  onClick={() => handleDeleteDocument(doc.id)}
                  className="ml-2 text-red-600 hover:text-red-800 text-xs font-medium shrink-0"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
        {selectedFiles.length > 0 && (
          <ul className="mt-3 space-y-2">
            {selectedFiles.map((file, index) => (
              <li
                key={`${file.name}-${index}`}
                className="flex items-center justify-between py-2 px-3 bg-blue-50 rounded border border-blue-100 text-sm"
              >
                <span className="text-gray-900 truncate flex-1" title={file.name}>
                  {file.name}
                </span>
                <span className="text-gray-500 text-xs ml-2 shrink-0">
                  {formatFileSize(file.size)}
                </span>
                <button
                  type="button"
                  onClick={() => removeSelectedFile(index)}
                  className="ml-2 text-red-600 hover:text-red-800 text-xs font-medium shrink-0"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <FormActions
        onCancel={onCancel}
        submitLabel={lead ? 'Update' : 'Create'}
        isLoading={loading}
      />
    </form>
  )
}

function SendOnboardingModal({
  lead,
  onSuccess,
  onCancel,
}: {
  lead: Lead
  onSuccess: () => void
  onCancel: () => void
}) {
  const [forms, setForms] = useState<any[]>([])
  const [templates, setTemplates] = useState<any[]>([])
  const [selectedFormId, setSelectedFormId] = useState('')
  const [selectedTemplateId, setSelectedTemplateId] = useState('')
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('token')
      if (!token) return

      try {
        const [formsRes, templatesRes] = await Promise.all([
          fetch('/api/onboarding-forms', {
            headers: { Authorization: `Bearer ${token}` },
            credentials: 'include',
          }),
          fetch('/api/messages/templates?channel=EMAIL', {
            headers: { Authorization: `Bearer ${token}` },
            credentials: 'include',
          }),
        ])

        if (formsRes.ok) setForms(await formsRes.json())
        if (templatesRes.ok) setTemplates(await templatesRes.json())
      } catch (err) {
        console.error('Failed to fetch modal data:', err)
      } finally {
        setInitialLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedFormId || !selectedTemplateId) {
      setError('Please select both a form and a template')
      return
    }

    setLoading(true)
    setError('')

    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`/api/leads/${lead.id}/send-onboarding`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          formId: selectedFormId,
          templateId: selectedTemplateId,
        }),
      })

      if (res.ok) {
        onSuccess()
      } else {
        const data = await res.json()
        setError(data.error || 'Failed to send onboarding form')
      }
    } catch (err) {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (initialLoading) {
    return (
      <div className="flex justify-center p-8">
        <Spinner />
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <Alert variant="error">{error}</Alert>}

      <p className="text-sm text-gray-600">
        Sending onboarding form to <strong>{lead.firstName} {lead.lastName}</strong> ({lead.email})
      </p>

      <Select
        label="Onboarding Form"
        value={selectedFormId}
        onChange={(e) => setSelectedFormId(e.target.value)}
        required
        options={[
          { value: '', label: 'Select a form' },
          ...forms.map((f) => ({ value: f.id, label: f.title })),
        ]}
      />

      <Select
        label="Email Template"
        value={selectedTemplateId}
        onChange={(e) => setSelectedTemplateId(e.target.value)}
        required
        options={[
          { value: '', label: 'Select a template' },
          ...templates.map((t) => ({ value: t.id, label: t.name })),
        ]}
      />

      <div className="bg-blue-50 p-3 rounded text-xs text-blue-700">
        The email will include a link to the form with the lead's ID automatically attached.
      </div>

      <div className="flex flex-wrap items-center gap-3 pt-4">
        <FormActions
          onCancel={onCancel}
          submitLabel="Send Email"
          isLoading={loading}
          className="pt-0"
        />
        <SendToWhatsAppButton
          disabled={!selectedFormId || !selectedTemplateId || !lead.phone}
          onFetch={async () => {
            const token = localStorage.getItem('token')
            const res = await fetch(`/api/leads/${lead.id}/whatsapp-preview`, {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
              credentials: 'include',
              body: JSON.stringify({ formId: selectedFormId, templateId: selectedTemplateId }),
            })
            if (!res.ok) throw new Error((await res.json()).error || 'Failed to get preview')
            const { message, phone } = await res.json()
            return { message, phone }
          }}
          entityName={`${lead.firstName} ${lead.lastName}`}
        />
      </div>
    </form>
  )
}

