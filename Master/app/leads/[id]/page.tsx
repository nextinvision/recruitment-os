'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { DashboardLayout } from '@/components/DashboardLayout'
import { ActivityTimeline } from '@/ui/ActivityTimeline'
import { ToastContainer, useToast, ConfirmDialog, useConfirmDialog } from '@/ui'
import Link from 'next/link'
import { formatINR } from '@/lib/currency'

interface Lead {
  id: string
  firstName: string
  lastName: string
  currentCompany?: string
  email?: string
  phone?: string
  status: 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'LOST'
  source?: string
  industry?: string
  estimatedValue?: string
  notes?: string
  assignedUser: {
    id: string
    firstName: string
    lastName: string
  }
  client?: {
    id: string
    firstName: string
    lastName: string
  }
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

interface LeadDocument {
  id: string
  originalFileName: string
  fileSize: number
  fileUrl: string
  uploadedAt: string
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function LeadProfilePage() {
  const router = useRouter()
  const params = useParams()
  const leadId = params.id as string

  const [lead, setLead] = useState<Lead | null>(null)
  const [activities, setActivities] = useState<Activity[]>([])
  const [documents, setDocuments] = useState<LeadDocument[]>([])
  const [loading, setLoading] = useState(true)
  const { showConfirm, dialogState, closeDialog, handleConfirm } = useConfirmDialog()
  const { toasts, showToast, removeToast } = useToast()

  useEffect(() => {
    if (leadId) {
      loadLead()
      loadActivities()
      loadDocuments()
    }
  }, [leadId])

  const loadLead = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/login')
        return
      }

      const response = await fetch(`/api/leads/${leadId}`, {
        headers: {
          ...(token && { 'Authorization': `Bearer ${token}` }),
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      })

      if (response.ok) {
        const data = await response.json()
        setLead(data)
      }
    } catch (err) {
      console.error('Failed to load lead:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadDocuments = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return
      const res = await fetch(`/api/leads/${leadId}/documents`, {
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include',
      })
      if (res.ok) {
        const data = await res.json()
        setDocuments(Array.isArray(data) ? data : [])
      }
    } catch (err) {
      console.error('Failed to load documents:', err)
    }
  }

  const loadActivities = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const response = await fetch(`/api/activities/entity/lead/${leadId}`, {
        headers: {
          ...(token && { 'Authorization': `Bearer ${token}` }),
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      })

      if (response.ok) {
        const data = await response.json()
        setActivities(Array.isArray(data) ? data : (data?.activities ?? []))
      }
    } catch (err) {
      console.error('Failed to load activities:', err)
    }
  }

  const handleConvertToClient = async () => {
    showConfirm(
      'Convert Lead to Client',
      'Convert this lead to a client? This action cannot be undone.',
      async () => {
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
            body: JSON.stringify({ status: 'QUALIFIED' }),
          })

          if (response.ok) {
            // Create client from lead (lead is already the person / job seeker)
            const clientResponse = await fetch('/api/clients', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
              credentials: 'include',
              body: JSON.stringify({
                firstName: lead?.firstName,
                lastName: lead?.lastName,
                email: lead?.email,
                phone: lead?.phone,
                industry: lead?.industry,
                notes: lead?.notes && lead?.currentCompany
                  ? `Converted from lead (${lead.currentCompany})\n${lead.notes}`
                  : lead?.currentCompany
                    ? `Converted from lead: ${lead.currentCompany}`
                    : lead?.notes || 'Converted from lead',
                leadId: leadId,
                assignedUserId: lead?.assignedUser.id,
              }),
            })

            if (clientResponse.ok) {
              const client = await clientResponse.json()
              showToast('Lead converted to client successfully', 'success')
              router.push(`/clients/${client.id}`)
            } else {
              const data = await clientResponse.json()
              showToast(data.error || 'Failed to create client', 'error')
            }
          } else {
            const data = await response.json()
            showToast(data.error || 'Failed to convert lead', 'error')
          }
        } catch (err) {
          console.error('Failed to convert lead:', err)
          showToast('Failed to convert lead', 'error')
        }
      },
      {
        variant: 'warning',
        confirmText: 'Convert',
        cancelText: 'Cancel',
      }
    )
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-careerist-primary-yellow"></div>
        </div>
      </DashboardLayout>
    )
  }

  if (!lead) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-careerist-text-secondary">Lead not found</p>
          <Link href="/leads" className="text-careerist-primary-yellow hover:underline mt-4 inline-block">
            Back to Leads
          </Link>
        </div>
      </DashboardLayout>
    )
  }

  const statusColors: Record<string, string> = {
    NEW: 'bg-blue-100 text-blue-800',
    CONTACTED: 'bg-yellow-100 text-yellow-800',
    QUALIFIED: 'bg-green-100 text-green-800',
    LOST: 'bg-red-100 text-red-800',
  }

  return (
    <DashboardLayout>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <ConfirmDialog
        isOpen={dialogState.isOpen}
        onClose={closeDialog}
        onConfirm={handleConfirm}
        title={dialogState.title}
        message={dialogState.message}
        variant={dialogState.variant || 'warning'}
        confirmText={dialogState.confirmText}
        cancelText={dialogState.cancelText}
      />
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <Link href="/leads" className="text-careerist-primary-yellow hover:underline text-sm mb-2 inline-block">
              ← Back to Leads
            </Link>
            <h1 className="text-2xl font-bold text-careerist-text-primary">{lead.firstName} {lead.lastName}</h1>
            {(lead.currentCompany || lead.email) && (
              <p className="text-careerist-text-secondary mt-1">
                {lead.currentCompany || lead.email}
              </p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <span className={`px-3 py-1 rounded text-sm font-medium ${statusColors[lead.status]}`}>
              {lead.status}
            </span>
            {lead.status !== 'LOST' && !lead.client && (
              <button
                onClick={handleConvertToClient}
                className="px-4 py-2 bg-careerist-primary-yellow text-careerist-primary-navy rounded-lg hover:bg-careerist-yellow-hover transition-colors font-semibold"
              >
                Convert to Client
              </button>
            )}
            {lead.client && (
              <Link
                href={`/clients/${lead.client.id}`}
                className="px-4 py-2 bg-careerist-primary-yellow text-careerist-primary-navy rounded-lg hover:bg-careerist-yellow-hover transition-colors font-semibold"
              >
                View Client
              </Link>
            )}
          </div>
        </div>

        {/* Lead Details */}
        <div className="bg-careerist-card rounded-lg shadow border border-careerist-border p-6">
          <h2 className="text-lg font-semibold text-careerist-text-primary mb-4">Lead Information</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-careerist-text-secondary">Current Company</label>
              <p className="text-careerist-text-primary">{lead.currentCompany || '-'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-careerist-text-secondary">Email</label>
              <p className="text-careerist-text-primary">{lead.email || '-'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-careerist-text-secondary">Phone</label>
              <p className="text-careerist-text-primary">{lead.phone || '-'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-careerist-text-secondary">Source</label>
              <p className="text-careerist-text-primary">{lead.source || '-'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-careerist-text-secondary">Industry</label>
              <p className="text-careerist-text-primary">{lead.industry || '-'}</p>
            </div>
            {lead.estimatedValue && (
              <div>
                <label className="text-sm font-medium text-careerist-text-secondary">Estimated Value</label>
                <p className="text-careerist-text-primary font-semibold">
                  {formatINR(lead.estimatedValue)}
                </p>
              </div>
            )}
            <div>
              <label className="text-sm font-medium text-careerist-text-secondary">Assigned To</label>
              <p className="text-careerist-text-primary">
                {lead.assignedUser.firstName} {lead.assignedUser.lastName}
              </p>
            </div>
            {lead.notes && (
              <div className="col-span-2">
                <label className="text-sm font-medium text-careerist-text-secondary">Notes</label>
                <p className="text-careerist-text-primary">{lead.notes}</p>
              </div>
            )}
          </div>
        </div>

        {/* Documents */}
        {Array.isArray(documents) && documents.length > 0 && (
          <div className="bg-careerist-card rounded-lg shadow border border-careerist-border p-6">
            <h2 className="text-lg font-semibold text-careerist-text-primary mb-4">Documents</h2>
            <ul className="space-y-2">
              {(Array.isArray(documents) ? documents : []).map((doc) => (
                <li
                  key={doc.id}
                  className="flex items-center justify-between py-2 px-3 bg-careerist-bg-secondary rounded border border-careerist-border"
                >
                  <span className="text-careerist-text-primary truncate flex-1" title={doc.originalFileName}>
                    {doc.originalFileName}
                  </span>
                  <span className="text-careerist-text-secondary text-sm ml-2 shrink-0">
                    {formatFileSize(doc.fileSize)}
                  </span>
                  <a
                    href={doc.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-3 text-careerist-primary-yellow hover:underline text-sm font-medium shrink-0"
                  >
                    Download
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Activity Timeline */}
        <div className="bg-careerist-card rounded-lg shadow border border-careerist-border p-6">
          <h2 className="text-lg font-semibold text-careerist-text-primary mb-4">Activity Timeline</h2>
          <ActivityTimeline activities={activities} entityName={`${lead.firstName} ${lead.lastName}`} />
        </div>
      </div>
    </DashboardLayout>
  )
}

