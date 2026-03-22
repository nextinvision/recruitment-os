'use client'

import { useRef, useEffect, useState, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { DashboardLayout } from '@/components/DashboardLayout'
import { ActivityTimeline, Modal, Button, Badge, Spinner, Input, Textarea, Select, Alert, FormActions, useToast, ConfirmDialog, useConfirmDialog, PreparationPipelineBoard, PreparationStepModal, FunnelChartWidget, StatsCard, SendToWhatsAppButton } from '@/ui'
import { ChevronDown, Clock, MapPin } from 'lucide-react'
import { ResumePreview } from '@/components/resume-builder/ResumePreview'
import { RESUME_PREVIEW_PADDING_CSS } from '@/modules/resume-builder/constants'
import { formatINR } from '@/lib/currency'
import Link from 'next/link'

interface Client {
  id: string
  firstName: string
  lastName: string
  email?: string
  phone?: string
  status: 'ACTIVE' | 'INACTIVE'
  industry?: string
  currentJobTitle?: string
  experience?: string
  skills?: string[]
  address?: string
  notes?: string
  serviceType?: 'STANDARD' | 'PREMIUM' | 'EXECUTIVE' | 'CONTRACT' | 'CUSTOM'
  reverseRecruiterId?: string
  reverseRecruiter?: {
    id: string
    firstName: string
    lastName: string
  }
  jobSearchInitiated?: boolean
  linkedInOptimized?: boolean
  whatsappGroupCreated?: boolean
  gmailId?: string
  gmailCreated?: boolean
  assignedUser: {
    id: string
    firstName: string
    lastName: string
  }
  _count?: {
    activities: number
    followUps: number
    revenues: number
    payments: number
    coverLetters?: number
    documents?: number
    resumeDrafts?: number
  }
  resumeDrafts?: ResumeDraft[]
  /** Cover letters / resumes from Preparation step (from API include) */
  coverLetters?: Array<{
    id: string
    fileName: string
    originalFileName?: string | null
    fileUrl: string
    fileSize: number
    description?: string | null
    uploadedAt: string
  }>
  /** Client documents (from API include): job search strategy, etc. */
  documents?: Array<{
    id: string
    type: string
    fileName: string
    originalFileName?: string | null
    fileUrl: string
    fileSize: number
    description?: string | null
    uploadedAt: string
  }>
  /** Resume links sent to client (email with public URL); responses shown in Resume tab */
  resumeLinks?: Array<{
    id: string
    token: string
    sentAt: string
    response: 'PENDING' | 'ACCEPTED' | 'REJECTED'
    respondedAt: string | null
    resumeDraft: { id: string; template: string; updatedAt: string }
  }>
}

interface ResumeDraft {
  id: string
  content: any
  template: string
  atsScore?: number
  updatedAt: string
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

export default function ClientProfilePage() {
  const router = useRouter()
  const params = useParams()
  const clientId = params?.id as string | undefined

  const [client, setClient] = useState<Client | null>(null)
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [showEditModal, setShowEditModal] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'preparation' | 'resumes' | 'approvals' | 'activities' | 'reports'>('overview')
  const [preparationStatus, setPreparationStatus] = useState<any>(null)
  const [selectedStep, setSelectedStep] = useState<string | null>(null)
  const [showStepModal, setShowStepModal] = useState(false)
  const { showConfirm, dialogState, closeDialog, handleConfirm } = useConfirmDialog()
  const { showToast } = useToast()
  const [previewingDraft, setPreviewingDraft] = useState<ResumeDraft | null>(null)
  const previewRef = useRef<HTMLDivElement>(null)
  const [reportsData, setReportsData] = useState<any>(null)
  const [loadingReports, setLoadingReports] = useState(false)
  const [reportSnapshot, setReportSnapshot] = useState<any>(null)
  const [generatingSnapshot, setGeneratingSnapshot] = useState(false)
  const [showReportNotificationModal, setShowReportNotificationModal] = useState(false)
  const [reportTemplates, setReportTemplates] = useState<any[]>([])
  const [reportTemplateId, setReportTemplateId] = useState('')

  // Send Resume State
  const [showSendResumeModal, setShowSendResumeModal] = useState(false)
  const [resumeToSend, setResumeToSend] = useState<ResumeDraft | null>(null)
  const [sendResumeTemplateId, setSendResumeTemplateId] = useState('')
  const [sendingResume, setSendingResume] = useState(false)
  const [emailTemplates, setEmailTemplates] = useState<any[]>([])

  const activeTabRef = useRef(activeTab)
  useEffect(() => {
    activeTabRef.current = activeTab
  }, [activeTab])

  const loadReportsData = useCallback(async () => {
    if (!clientId) return
    setLoadingReports(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/clients/${clientId}/analytics`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: 'no-store',
      })
      if (response.ok) {
        const data = await response.json()
        setReportsData(data)
      } else {
        showToast('Failed to load reports data', 'error')
      }
    } catch (err) {
      console.error('Error loading reports:', err)
      showToast('Error loading reports data', 'error')
    } finally {
      setLoadingReports(false)
    }
  }, [clientId, showToast])

  const refreshReportsIfOnTab = useCallback(() => {
    if (activeTabRef.current === 'reports') void loadReportsData()
  }, [loadReportsData])

  useEffect(() => {
    if (activeTab !== 'reports' || !clientId) return
    const onVisible = () => {
      if (document.visibilityState === 'visible') void loadReportsData()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [activeTab, clientId, loadReportsData])

  useEffect(() => {
    if (!clientId) {
      setError('Client ID is missing')
      setLoading(false)
      return
    }

    loadClient()
    loadActivities()
    loadPreparationStatus()
    loadEmailTemplates()
    if (activeTab === 'reports') {
      loadReportsData()
      loadReportSnapshot()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId, activeTab])

  const loadEmailTemplates = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return
      const response = await fetch('/api/messages/templates?channel=EMAIL', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        setEmailTemplates(data)
      }
    } catch (err) {
      console.error('Failed to load email templates', err)
    }
  }

  const loadClient = async () => {
    if (!clientId) {
      setError('Client ID is missing')
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/login')
        return
      }

      const response = await fetch(`/api/clients/${clientId}`, {
        headers: {
          ...(token && { 'Authorization': `Bearer ${token}` }),
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      })

      if (response.ok) {
        const data = await response.json()
        setClient(data)
        refreshReportsIfOnTab()
      } else if (response.status === 404) {
        setError('Client not found')
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Failed to load client' }))
        setError(errorData.error || 'Failed to load client')
      }
    } catch (err) {
      console.error('Failed to load client:', err)
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const loadActivities = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const response = await fetch(`/api/activities/entity/client/${clientId}`, {
        headers: {
          ...(token && { 'Authorization': `Bearer ${token}` }),
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      })

      if (response.ok) {
        const data = await response.json()
        // Handle ActivitiesResult object structure
        if (data && typeof data === 'object' && 'activities' in data) {
          setActivities(data.activities || [])
        } else if (Array.isArray(data)) {
          setActivities(data)
        } else {
          setActivities([])
        }
        refreshReportsIfOnTab()
      }
    } catch (err) {
      console.error('Failed to load activities:', err)
      setActivities([])
    }
  }

  const loadPreparationStatus = async () => {
    if (!clientId) return
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const response = await fetch(`/api/clients/${clientId}/preparation/status`, {
        headers: {
          ...(token && { 'Authorization': `Bearer ${token}` }),
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      })

      if (response.ok) {
        const data = await response.json()
        setPreparationStatus(data)
      }
    } catch (err) {
      console.error('Failed to load preparation status:', err)
    }
  }

  const handleInitiateJobSearch = async () => {
    if (!clientId) return
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const response = await fetch(`/api/clients/${clientId}/preparation/initiate-job-search`, {
        method: 'POST',
        headers: {
          ...(token && { 'Authorization': `Bearer ${token}` }),
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      })

      if (response.ok) {
        showToast('Job search initiated successfully', 'success')
        loadClient()
        loadPreparationStatus()
      } else {
        const data = await response.json()
        showToast(data.error || 'Failed to initiate job search', 'error')
      }
    } catch (err) {
      console.error('Failed to initiate job search:', err)
      showToast('Failed to initiate job search', 'error')
    }
  }

  const handleSendResumeEmail = async () => {
    if (!clientId || !resumeToSend || !sendResumeTemplateId) return
    setSendingResume(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/messages/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify({
          channel: 'EMAIL',
          clientId: clientId,
          templateId: sendResumeTemplateId,
          // We can attach context to trigger ATS / Resume merging in the backend if needed.
          // For now, we rely on the backend being able to fetch the latest draft or we send the ID.
          context: {
            resumeDraftId: resumeToSend.id,
            atsScore: resumeToSend.atsScore
          }
        })
      })

      if (response.ok) {
        showToast('Resume sent successfully', 'success')
        setShowSendResumeModal(false)
        setResumeToSend(null)
        setSendResumeTemplateId('')
        loadClient()
      } else {
        const data = await response.json()
        showToast(data.error || 'Failed to send resume', 'error')
      }
    } catch (err) {
      console.error('Error sending resume:', err)
      showToast('Failed to send resume', 'error')
    } finally {
      setSendingResume(false)
    }
  }

  const handleDelete = async () => {
    showConfirm(
      'Delete Client',
      'Are you sure you want to delete this client? This action cannot be undone.',
      async () => {
        try {
          const token = localStorage.getItem('token')
          const response = await fetch(`/api/clients/${clientId}`, {
            method: 'DELETE',
            headers: {
              ...(token && { 'Authorization': `Bearer ${token}` }),
            },
            credentials: 'include',
          })

          if (response.ok) {
            showToast('Client deleted successfully', 'success')
            router.push('/clients')
          } else {
            const data = await response.json()
            showToast(data.error || 'Failed to delete client', 'error')
          }
        } catch (err) {
          console.error('Failed to delete client:', err)
          showToast('Failed to delete client', 'error')
        }
      },
      {
        variant: 'danger',
        confirmText: 'Delete',
        cancelText: 'Cancel',
      }
    )
  }

  const handleDeleteDraft = async (draftId: string) => {
    showConfirm(
      'Delete Resume',
      'Are you sure you want to delete this resume? This action cannot be undone.',
      async () => {
        try {
          const token = localStorage.getItem('token')
          const response = await fetch(`/api/resume-drafts/${draftId}`, {
            method: 'DELETE',
            headers: {
              ...(token && { 'Authorization': `Bearer ${token}` }),
            },
            credentials: 'include',
          })

          if (response.ok) {
            showToast('Resume deleted successfully', 'success')
            loadClient() // Refresh to show updated list
          } else {
            const data = await response.json()
            showToast(data.error || 'Failed to delete resume', 'error')
          }
        } catch (err) {
          console.error('Failed to delete resume:', err)
          showToast('Failed to delete resume', 'error')
        }
      },
      {
        variant: 'danger',
        confirmText: 'Delete',
        cancelText: 'Cancel',
      }
    )
  }

  const handlePreview = (draft: ResumeDraft) => {
    setPreviewingDraft(draft)
  }

  const handleExportPDF = (draft: ResumeDraft) => {
    // We need to render the document to get the ref
    // Since ResumePreview isn't rendered yet for this draft, 
    // we use a temporary print window approach similar to the builder
    // but we can actually use the ref from the modal if we want.
    // However, the builder's logic is robust.

    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      showToast('Pop-up blocked. Please allow pop-ups to export PDF.', 'error')
      return
    }

    const title = `Resume - ${draft.content?.contact?.name || 'Resume'}`

    // We'll use a hidden div or just render the content
    // For now, let's use the robust logic from builder
    // Note: This requires the content to be formatted correctly.

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${title}</title>
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap" rel="stylesheet">
          <style>
            @page { size: A4; margin: 0; }
            body { margin: 0; padding: 0; font-family: Arial, sans-serif; }
            * { box-sizing: border-box; }
            @media print {
              .resume-preview { width: 100% !important; margin: 0 !important; padding: ${RESUME_PREVIEW_PADDING_CSS} !important; box-shadow: none !important; }
            }
          </style>
        </head>
        <body>
          <div id="preview-root"></div>
        </body>
      </html>
    `)

    // We can't easily react-render into another window here without complex setup
    // but the builder's logic copied the innerHTML of a rendered component.
    // If the modal is open, we can use previewRef.current.innerHTML.
    // If not, we have to mount it briefly.

    // Simpler approach for now: Always open the preview modal first, or provide a way to export from modal.
    // But user asked for an export button in the list.

    // Let's implement it by opening a second hidden ResumePreview or similar.
    // Or just open the modal and tell the user to print.

    // Actually, let's just use the logic from ResumeBuilder but we need the HTML.
    // Easiest is to setPreviewingDraft, wait for mount, then print.
    setPreviewingDraft(draft)
    setTimeout(() => {
      if (previewRef.current) {
        const content = previewRef.current.outerHTML
        printWindow.document.getElementById('preview-root')!.innerHTML = content
        printWindow.document.close()
        printWindow.focus()
        setTimeout(() => {
          printWindow.print()
          printWindow.close()
        }, 500)
      } else {
        printWindow.close()
        showToast('Failed to generate preview for export', 'error')
      }
    }, 300)
  }

  const handleExportWord = (draft: ResumeDraft) => {
    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      showToast('Pop-up blocked. Please allow pop-ups to export Word.', 'error')
      return
    }

    const title = `Resume - ${draft.content?.contact?.name || 'Resume'}`

    printWindow.document.write(`
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head><meta charset='utf-8'><title>${title}</title>
      <style>
        body { font-family: Arial, sans-serif; }
        .resume-preview { width: 100%; margin: 0; padding: 20px; }
      </style>
      </head>
      <body>
        <div id="preview-root"></div>
      </body>
      </html>
    `)

    setPreviewingDraft(draft)
    setTimeout(() => {
      if (previewRef.current) {
        const content = previewRef.current.outerHTML
        printWindow.document.getElementById('preview-root')!.innerHTML = content
        printWindow.document.close()

        const html = printWindow.document.documentElement.outerHTML
        const blob = new Blob(['\ufeff', html], { type: 'application/msword' })
        const url = URL.createObjectURL(blob)
        const link = window.document.createElement('a')
        link.href = url
        link.download = `${title}.doc`
        window.document.body.appendChild(link)
        link.click()
        window.document.body.removeChild(link)
        URL.revokeObjectURL(url)
        printWindow.close()
      } else {
        printWindow.close()
        showToast('Failed to generate preview for export', 'error')
      }
    }, 300)
  }

  const loadReportSnapshot = async () => {
    if (!clientId) return
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/clients/${clientId}/report-snapshot`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        setReportSnapshot(data)
      }
    } catch (err) {
      console.error('Error loading snapshot:', err)
    }
  }

  const handleUpdateSnapshot = async (templateId?: string, sendEmail: boolean = false) => {
    if (!clientId) return
    try {
      setGeneratingSnapshot(true)
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/clients/${clientId}/report-snapshot`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ templateId, sendEmail })
      })
      if (response.ok) {
        const data = await response.json()
        setReportSnapshot(data)
        refreshReportsIfOnTab()
        showToast(sendEmail ? 'Report updated and email sent' : 'Shared report updated successfully', 'success')
        setShowReportNotificationModal(false)
      } else {
        const data = await response.json().catch(() => ({}))
        showToast(data.error || 'Failed to update shared report', 'error')
      }
    } catch (err) {
      console.error('Error updating snapshot:', err)
      showToast('Error updating shared report', 'error')
    } finally {
      setGeneratingSnapshot(false)
    }
  }

  const loadReportTemplates = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/messages/templates', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        setReportTemplates(data)
      }
    } catch (err) {
      console.error('Error loading templates:', err)
    }
  }

  useEffect(() => {
    if (showReportNotificationModal) {
      loadReportTemplates()
      setReportTemplateId('')
    }
  }, [showReportNotificationModal])

  if (loading) {
    return (
      <DashboardLayout>
        <Spinner fullScreen />
      </DashboardLayout>
    )
  }

  if (!loading && (!client || error)) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-careerist-text-secondary">{error || 'Client not found'}</p>
          <Link href="/clients" className="text-careerist-primary-yellow hover:underline mt-4 inline-block">
            Back to Clients
          </Link>
        </div>
      </DashboardLayout>
    )
  }

  if (!client) {
    return (
      <DashboardLayout>
        <Spinner fullScreen />
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <ConfirmDialog
        isOpen={dialogState.isOpen}
        onClose={closeDialog}
        onConfirm={handleConfirm}
        title={dialogState.title}
        message={dialogState.message}
        variant={dialogState.variant || 'danger'}
        confirmText={dialogState.confirmText}
        cancelText={dialogState.cancelText}
      />
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <Link href="/clients" className="text-careerist-primary-yellow hover:underline text-sm mb-2 inline-block">
              ← Back to Clients
            </Link>
            <h1 className="text-3xl font-bold text-careerist-text-primary">
              {client.firstName} {client.lastName}
            </h1>
            {client.currentJobTitle && (
              <p className="text-careerist-text-secondary mt-1">{client.currentJobTitle}</p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Badge variant={client.status === 'ACTIVE' ? 'success' : 'neutral'}>
              {client.status}
            </Badge>
            <Button onClick={() => setShowEditModal(true)}>
              Edit Client
            </Button>
            <Button variant="danger" onClick={handleDelete}>
              Delete
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        {client._count && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-careerist-card rounded-lg shadow border border-careerist-border p-4">
              <div className="text-sm font-medium text-careerist-text-secondary">Activities</div>
              <div className="text-2xl font-bold text-careerist-text-primary mt-1">{client._count.activities}</div>
            </div>
            <div className="bg-careerist-card rounded-lg shadow border border-careerist-border p-4">
              <div className="text-sm font-medium text-careerist-text-secondary">Follow-ups</div>
              <div className="text-2xl font-bold text-careerist-text-primary mt-1">{client._count.followUps}</div>
            </div>
            <div className="bg-careerist-card rounded-lg shadow border border-careerist-border p-4">
              <div className="text-sm font-medium text-careerist-text-secondary">Revenues</div>
              <div className="text-2xl font-bold text-careerist-text-primary mt-1">{client._count.revenues}</div>
            </div>
            <div className="bg-careerist-card rounded-lg shadow border border-careerist-border p-4">
              <div className="text-sm font-medium text-careerist-text-secondary">Payments</div>
              <div className="text-2xl font-bold text-careerist-text-primary mt-1">{client._count.payments}</div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-careerist-card rounded-lg shadow border border-careerist-border">
          <div className="border-b border-careerist-border">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'overview'
                  ? 'border-careerist-primary-yellow text-careerist-primary-yellow'
                  : 'border-transparent text-careerist-text-secondary hover:text-careerist-text-primary hover:border-gray-300'
                  }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('preparation')}
                className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'preparation'
                  ? 'border-careerist-primary-yellow text-careerist-primary-yellow'
                  : 'border-transparent text-careerist-text-secondary hover:text-careerist-text-primary hover:border-gray-300'
                  }`}
              >
                Preparation Pipeline
              </button>
              <button
                onClick={() => setActiveTab('resumes')}
                className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'resumes'
                  ? 'border-careerist-primary-yellow text-careerist-primary-yellow'
                  : 'border-transparent text-careerist-text-secondary hover:text-careerist-text-primary hover:border-gray-300'
                  }`}
              >
                Resumes
              </button>
              <button
                onClick={() => setActiveTab('approvals')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'approvals'
                  ? 'border-[#F4B400] text-[#1F3A5F]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                Approvals
              </button>
              <button
                onClick={() => setActiveTab('activities')}
                className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'activities'
                  ? 'border-careerist-primary-yellow text-careerist-primary-yellow'
                  : 'border-transparent text-careerist-text-secondary hover:text-careerist-text-primary hover:border-gray-300'
                  }`}
              >
                Activities
              </button>
              <button
                onClick={() => setActiveTab('reports')}
                className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'reports'
                  ? 'border-careerist-primary-yellow text-careerist-primary-yellow'
                  : 'border-transparent text-careerist-text-secondary hover:text-careerist-text-primary hover:border-gray-300'
                  }`}
              >
                Reports
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'overview' && (
              <>
                {/* Client Details */}
                <div className="bg-careerist-card rounded-lg shadow border border-careerist-border p-6">
                  <h2 className="text-lg font-semibold text-careerist-text-primary mb-4">Client Information</h2>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-careerist-text-secondary">Email</label>
                      <p className="text-careerist-text-primary">{client.email || '-'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-careerist-text-secondary">Phone</label>
                      <p className="text-careerist-text-primary">{client.phone || '-'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-careerist-text-secondary">Industry (Desired)</label>
                      <p className="text-careerist-text-primary">{client.industry || '-'}</p>
                    </div>
                    {client.currentJobTitle && (
                      <div>
                        <label className="text-sm font-medium text-careerist-text-secondary">Current Job Title</label>
                        <p className="text-careerist-text-primary">{client.currentJobTitle}</p>
                      </div>
                    )}
                    {client.experience && (
                      <div>
                        <label className="text-sm font-medium text-careerist-text-secondary">Experience</label>
                        <p className="text-careerist-text-primary">{client.experience}</p>
                      </div>
                    )}
                    <div className="col-span-2">
                      <label className="text-sm font-medium text-careerist-text-secondary">Address</label>
                      <p className="text-careerist-text-primary">{client.address || '-'}</p>
                    </div>
                    {client.skills && client.skills.length > 0 && (
                      <div className="col-span-2">
                        <label className="text-sm font-medium text-careerist-text-secondary mb-2 block">Skills</label>
                        <div className="flex flex-wrap gap-2">
                          {client.skills.map((skill, index) => (
                            <span
                              key={index}
                              className="px-3 py-1 bg-careerist-yellow-light text-careerist-primary-navy rounded-full text-sm font-medium border border-careerist-yellow"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    <div>
                      <label className="text-sm font-medium text-careerist-text-secondary">Assigned To</label>
                      <p className="text-careerist-text-primary">
                        {client.assignedUser.firstName} {client.assignedUser.lastName}
                      </p>
                    </div>
                    {client.notes && (
                      <div className="col-span-2">
                        <label className="text-sm font-medium text-careerist-text-secondary">Notes</label>
                        <p className="text-careerist-text-primary whitespace-pre-wrap">{client.notes}</p>
                      </div>
                    )}
                  </div>
                </div>

              </>
            )}

            {activeTab === 'preparation' && (
              <div>
                {preparationStatus ? (
                  <PreparationPipelineBoard
                    steps={preparationStatus.steps.map((step: any, index: number) => ({
                      id: `step-${index}`,
                      name: step.name,
                      completed: step.completed,
                      completedAt: step.completedAt,
                      canEdit: true,
                    }))}
                    completedSteps={preparationStatus.completedSteps}
                    totalSteps={preparationStatus.totalSteps}
                    progressPercentage={preparationStatus.progressPercentage}
                    isReady={preparationStatus.isReady}
                    onStepClick={(stepId) => {
                      const stepIndex = parseInt(stepId.replace('step-', ''))
                      const step = preparationStatus.steps[stepIndex]
                      const modalSteps = [
                        'Service Type',
                        'Reverse Recruiter',
                        'Gmail ID Creation',
                        'WhatsApp Group Created',
                        'LinkedIn Optimized',
                        'Job Search Strategy',
                        'Resume + Cover Letter',
                      ]

                      if (!step) {
                        showToast('This step cannot be edited directly', 'info')
                        return
                      }

                      if (step.name === 'Job Search Initiated') {
                        if (step.completed) {
                          showToast('Job search has already been initiated for this client.', 'info')
                          return
                        }

                        showConfirm(
                          'Initiate Job Search',
                          'This will mark the preparation pipeline as ready and record that job search has started for this client. Are you sure you want to continue?',
                          async () => {
                            await handleInitiateJobSearch()
                          },
                          {
                            variant: 'info',
                            confirmText: 'Yes, initiate',
                            cancelText: 'Cancel',
                          }
                        )
                        return
                      }

                      if (modalSteps.includes(step.name)) {
                        setSelectedStep(step.name)
                        setShowStepModal(true)
                      } else {
                        showToast('This step cannot be edited directly', 'info')
                      }
                    }}
                    onInitiateJobSearch={handleInitiateJobSearch}
                  />
                ) : (
                  <Spinner />
                )}
                {/* Job Search Strategy documents: where to find what was added in Step 6 */}
                {client?.documents && client.documents.filter((d: { type: string }) => d.type === 'JOB_SEARCH_STRATEGY').length > 0 && (
                  <div className="mt-6 bg-careerist-card rounded-lg shadow border border-careerist-border p-6">
                    <h3 className="text-lg font-semibold text-careerist-text-primary mb-2">Job Search Strategy</h3>
                    <p className="text-sm text-careerist-text-secondary mb-4">
                      Documents and links added in Step 6 of the Preparation pipeline.
                    </p>
                    <ul className="space-y-2">
                      {client.documents
                        .filter((d: { type: string }) => d.type === 'JOB_SEARCH_STRATEGY')
                        .map((doc: { id: string; fileName: string; originalFileName?: string | null; fileUrl: string; fileSize: number; description?: string | null }) => (
                          <li
                            key={doc.id}
                            className="flex items-center justify-between gap-4 py-2 px-3 bg-careerist-bg-secondary rounded border border-careerist-border"
                          >
                            <div className="min-w-0 flex-1">
                              <span className="font-medium text-careerist-text-primary truncate block" title={doc.originalFileName || doc.fileName}>
                                {doc.originalFileName || doc.fileName}
                              </span>
                              {doc.description && (
                                <p className="text-xs text-careerist-text-secondary mt-0.5 line-clamp-2">{doc.description}</p>
                              )}
                            </div>
                            <a
                              href={`/api/clients/${clientId}/documents/${doc.id}/download`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="shrink-0 text-sm font-medium text-careerist-primary-yellow hover:underline"
                            >
                              Open / Download
                            </a>
                          </li>
                        ))}
                    </ul>
                  </div>
                )}

                {/* Resume + Cover Letter: where to find what was added in Step 8 */}
                {client?.coverLetters && client.coverLetters.length > 0 && (
                  <div className="mt-6 bg-careerist-card rounded-lg shadow border border-careerist-border p-6">
                    <h3 className="text-lg font-semibold text-careerist-text-primary mb-2">Resume + Cover Letter</h3>
                    <p className="text-sm text-careerist-text-secondary mb-4">
                      Files and links added in Step 8 of the Preparation pipeline.
                    </p>
                    <ul className="space-y-2">
                      {client.coverLetters.map((letter: { id: string; fileName: string; originalFileName?: string | null; fileUrl: string; fileSize: number; description?: string | null }) => (
                        <li
                          key={letter.id}
                          className="flex items-center justify-between gap-4 py-2 px-3 bg-careerist-bg-secondary rounded border border-careerist-border"
                        >
                          <div className="min-w-0 flex-1">
                            <span className="font-medium text-careerist-text-primary truncate block" title={letter.originalFileName || letter.fileName}>
                              {letter.originalFileName || letter.fileName}
                            </span>
                            {letter.description && (
                              <p className="text-xs text-careerist-text-secondary mt-0.5 line-clamp-2">{letter.description}</p>
                            )}
                          </div>
                          <a
                            href={`/api/clients/${clientId}/cover-letters/${letter.id}/download`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="shrink-0 text-sm font-medium text-careerist-primary-yellow hover:underline"
                          >
                            Open / Download
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'resumes' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-careerist-text-primary">Tailored Resumes</h2>
                  <Button
                    size="sm"
                    onClick={() => router.push(`/resume-builder?clientId=${clientId}`)}
                  >
                    Create New Resume
                  </Button>
                </div>

                {client.resumeDrafts && client.resumeDrafts.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {client.resumeDrafts.map((draft) => (
                      <div
                        key={draft.id}
                        className="bg-careerist-card border border-careerist-border rounded-lg p-4 hover:border-careerist-primary-yellow transition-colors group"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <div className="text-careerist-text-primary font-bold truncate">
                              {draft.content?.contact?.name || 'Untitled Resume'}
                            </div>
                            <div className="text-xs text-careerist-text-secondary">
                              Last updated: {new Date(draft.updatedAt).toLocaleDateString()}
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <Badge variant="neutral" className="text-[10px] uppercase">
                              {draft.template}
                            </Badge>
                            {draft.atsScore !== undefined && draft.atsScore !== null && (
                              <Badge variant={draft.atsScore >= 80 ? 'success' : draft.atsScore >= 60 ? 'warning' : 'error'} className="text-[10px]">
                                ATS: {draft.atsScore}/100
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            size="sm"
                            variant="secondary"
                            className="bg-careerist-yellow-light text-careerist-primary-navy border-careerist-yellow hover:bg-careerist-primary-yellow text-xs py-1 px-3"
                            onClick={() => handlePreview(draft)}
                          >
                            Preview
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            className="text-xs py-1 px-3"
                            onClick={() => {
                              setResumeToSend(draft)
                              setShowSendResumeModal(true)
                            }}
                          >
                            Send
                          </Button>
                          <div className="relative group">
                            <Button
                              size="sm"
                              variant="secondary"
                              className="text-xs py-1 px-3 flex items-center gap-1"
                            >
                              Download
                              <ChevronDown className="h-3 w-3" />
                            </Button>
                            <div className="absolute right-0 top-full mt-1 w-40 bg-white border border-careerist-border rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                              <div className="p-1">
                                <button
                                  onClick={() => handleExportPDF(draft)}
                                  className="w-full text-left px-3 py-2 text-xs text-careerist-text-primary hover:bg-gray-50 rounded-md transition-colors"
                                >
                                  Download PDF
                                </button>
                                <button
                                  onClick={() => handleExportWord(draft)}
                                  className="w-full text-left px-3 py-2 text-xs text-careerist-text-primary hover:bg-gray-50 rounded-md transition-colors"
                                >
                                  Download Word
                                </button>
                              </div>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="secondary"
                            className="text-xs py-1 px-3"
                            onClick={() => router.push(`/resume-builder?id=${draft.id}&clientId=${clientId}`)}
                          >
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            className="text-xs py-1 px-3"
                            onClick={() => handleDeleteDraft(draft.id)}
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 border-2 border-dashed border-careerist-border rounded-lg">
                    <p className="text-careerist-text-secondary mb-4">No tailored resumes found for this client.</p>
                    <Button
                      variant="secondary"
                      onClick={() => router.push(`/resume-builder?clientId=${clientId}`)}
                    >
                      Start Building
                    </Button>
                  </div>
                )}

                {/* Resume link responses: sent resume emails and client accept/reject */}
                {client.resumeLinks && client.resumeLinks.length > 0 && (
                  <div className="mt-10 pt-8 border-t border-careerist-border">
                    <h3 className="text-base font-semibold text-careerist-text-primary mb-3">Resume link responses</h3>
                    <p className="text-sm text-careerist-text-secondary mb-4">
                      When you send a resume via email, the client can open the link to preview, download, and accept or reject. Responses appear below.
                    </p>
                    <div className="space-y-3">
                      {client.resumeLinks.map((link) => (
                        <div
                          key={link.id}
                          className="flex flex-wrap items-center justify-between gap-3 p-4 bg-careerist-bg-gray border border-careerist-border rounded-lg"
                        >
                          <div>
                            <span className="font-medium text-careerist-text-primary">
                              {link.resumeDraft?.template ?? 'Resume'}
                            </span>
                            <span className="text-careerist-text-secondary text-sm ml-2">
                              Sent {new Date(link.sentAt).toLocaleString()}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            {link.response === 'PENDING' && (
                              <Badge variant="warning">Pending</Badge>
                            )}
                            {link.response === 'ACCEPTED' && (
                              <Badge variant="success">Accepted</Badge>
                            )}
                            {link.response === 'REJECTED' && (
                              <Badge variant="error">Rejected</Badge>
                            )}
                            {link.respondedAt && (
                              <span className="text-xs text-careerist-text-secondary">
                                {new Date(link.respondedAt).toLocaleString()}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Approvals Tab */}
            {activeTab === 'approvals' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Pending Job Approvals</h3>
                  <Badge variant="warning">{client?.id ? 'Awaiting Client Action' : '...'}</Badge>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <PendingApprovalsList clientId={clientId!} />
                </div>
              </div>
            )}

            {/* Activities Tab */}
            {activeTab === 'activities' && (
              <div>
                <ActivityTimeline activities={activities} entityName={`${client.firstName} ${client.lastName}`} />
              </div>
            )}

            {activeTab === 'reports' && (
              <div className="space-y-8">
                {loadingReports ? (
                  <div className="flex justify-center py-12">
                    <Spinner />
                  </div>
                ) : reportsData ? (
                  <>
                    {/* Application Funnel & Activity Distribution */}

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      {/* Application Funnel */}
                      <FunnelChartWidget data={reportsData.funnelPerformance} />

                      {/* Activity Distribution */}
                      <div className="bg-careerist-card rounded-xl p-6 border border-careerist-border shadow-md">
                        <h3 className="text-lg font-semibold text-careerist-text-primary mb-4">Activity Distribution</h3>
                        {reportsData.activityDistribution.length > 0 ? (
                          <div className="space-y-4">
                            {(() => {
                              const counts = reportsData.activityDistribution.map((a: { count: number }) =>
                                typeof a.count === 'number' && !Number.isNaN(a.count) ? a.count : 0
                              )
                              const maxAct = Math.max(...counts, 1)
                              return reportsData.activityDistribution.map((activity: any) => (
                              <div key={activity.type}>
                                <div className="flex justify-between items-center mb-1">
                                  <span className="text-sm font-medium text-careerist-text-primary">{activity.type}</span>
                                  <span className="text-sm font-semibold text-careerist-text-primary">{activity.count}</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                  <div
                                    className="bg-careerist-primary-navy h-2 rounded-full"
                                    style={{ width: `${Math.min(((typeof activity.count === 'number' ? activity.count : 0) / maxAct) * 100, 100)}%` }}
                                  />
                                </div>
                              </div>
                            ))
                            })()}
                          </div>
                        ) : (
                          <p className="text-sm text-careerist-text-secondary">No activity data recorded.</p>
                        )}
                      </div>
                    </div>

                    {/* Notes entered for this client (from NOTE activities) */}
                    <div className="bg-careerist-card rounded-xl p-6 border border-careerist-border shadow-md">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-careerist-text-primary">Notes</h3>
                        <Badge variant="neutral">{reportsData.notes?.length ?? 0}</Badge>
                      </div>
                      {reportsData.notes && reportsData.notes.length > 0 ? (
                        <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
                          {reportsData.notes.map((note: any) => (
                            <div key={note.id} className="p-3 rounded-lg border border-careerist-border bg-white">
                              <div className="flex items-center justify-between gap-3">
                                <p className="text-sm font-semibold text-careerist-text-primary">{note.title}</p>
                                <p className="text-xs text-careerist-text-secondary whitespace-nowrap">
                                  {new Date(note.occurredAt).toLocaleString()}
                                </p>
                              </div>
                              {note.description && (
                                <p className="text-sm text-careerist-text-primary whitespace-pre-wrap mt-1">
                                  {note.description}
                                </p>
                              )}
                              <p className="text-xs text-careerist-text-secondary mt-2">By {note.createdBy}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-careerist-text-secondary">No notes recorded for this client yet.</p>
                      )}
                    </div>

                    {/* Reports Tab Footer: Share Functionality */}
                    <div className="mt-8 pt-8 border-t border-careerist-border">
                      <div className="bg-gray-50 rounded-xl p-6 border border-careerist-border text-careerist-text-primary">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div>
                            <h3 className="text-lg font-semibold">Share this Report</h3>
                            <p className="text-sm text-careerist-text-secondary mt-1">
                              {reportSnapshot
                                ? `Last updated: ${new Date(reportSnapshot.updatedAt).toLocaleString()}`
                                : "Generate a fixed link to share this report with others."}
                            </p>
                          </div>
                          <div className="flex gap-3">
                            {reportSnapshot && (
                              <Button
                                variant="secondary"
                                onClick={() => {
                                  const url = `${window.location.origin}/public/reports/${reportSnapshot.token}`;
                                  navigator.clipboard.writeText(url);
                                  showToast('Link copied to clipboard', 'success');
                                }}
                              >
                                Copy Link
                              </Button>
                            )}
                            <Button
                              onClick={() => setShowReportNotificationModal(true)}
                              isLoading={generatingSnapshot}
                            >
                              {reportSnapshot ? 'Update Progress' : 'Generate Share Link'}
                            </Button>
                          </div>
                        </div>
                        {reportSnapshot && (
                          <div className="mt-4 p-3 bg-white border border-careerist-border rounded-lg flex items-center justify-between overflow-hidden">
                            <span className="text-sm text-careerist-text-primary truncate mr-2">
                              {`${window.location.origin}/public/reports/${reportSnapshot.token}`}
                            </span>
                            <Link
                              href={`/public/reports/${reportSnapshot.token}`}
                              target="_blank"
                              className="text-xs font-medium text-careerist-primary-yellow hover:underline"
                            >
                              View Live
                            </Link>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-careerist-text-secondary">Failed to load report data.</p>
                    <Button variant="secondary" onClick={loadReportsData} className="mt-4">
                      Try Again
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Send Resume Modal */}
        {showSendResumeModal && resumeToSend && (
          <Modal
            isOpen={showSendResumeModal}
            onClose={() => setShowSendResumeModal(false)}
            title="Send Resume to Client"
          >
            <div className="space-y-4">
              <div className="p-4 bg-careerist-bg-gray rounded-lg border border-careerist-border">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-careerist-text-primary">Resume: {resumeToSend.template}</span>
                  {resumeToSend.atsScore && (
                    <Badge variant={resumeToSend.atsScore >= 80 ? 'success' : resumeToSend.atsScore >= 60 ? 'warning' : 'error'}>
                      ATS: {resumeToSend.atsScore}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-careerist-text-secondary">Updated: {new Date(resumeToSend.updatedAt).toLocaleDateString()}</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-careerist-text-primary">Select Email Template</label>
                <select
                  className="w-full p-2 border border-careerist-border rounded-lg bg-white text-sm focus:border-careerist-primary-yellow focus:outline-none"
                  value={sendResumeTemplateId}
                  onChange={(e) => setSendResumeTemplateId(e.target.value)}
                >
                  <option value="">Select a template...</option>
                  {emailTemplates.map((t: any) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
                <p className="text-[10px] text-careerist-text-secondary italic">The email will include a unique link for the client to preview the resume, download it, and accept or reject. In your template, use <code className="bg-gray-100 px-1 rounded">{"{{resumeViewUrl}}"}</code> to insert this link.</p>
              </div>

              <div className="flex flex-wrap justify-end gap-3 pt-4">
                <Button variant="secondary" onClick={() => setShowSendResumeModal(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleSendResumeEmail}
                  isLoading={sendingResume}
                  disabled={!sendResumeTemplateId}
                >
                  Send Email
                </Button>
                {clientId && resumeToSend && (
                  <SendToWhatsAppButton
                    disabled={!sendResumeTemplateId || !client?.phone}
                    onFetch={async () => {
                      const token = localStorage.getItem('token')
                      const res = await fetch('/api/messages/whatsapp-preview', {
                        method: 'POST',
                        headers: {
                          Authorization: `Bearer ${token}`,
                          'Content-Type': 'application/json',
                        },
                        credentials: 'include',
                        body: JSON.stringify({
                          clientId,
                          templateId: sendResumeTemplateId,
                          resumeDraftId: resumeToSend.id,
                        }),
                      })
                      if (!res.ok) throw new Error((await res.json()).error || 'Failed to get preview')
                      return res.json()
                    }}
                    entityName={client ? `${client.firstName} ${client.lastName}` : 'client'}
                  />
                )}
              </div>
            </div>
          </Modal>
        )}

        {/* Edit Modal */}

        {showEditModal && client && (
          <Modal
            isOpen={showEditModal}
            onClose={() => setShowEditModal(false)}
            title="Edit Client"
            size="lg"
          >
            <ClientEditForm
              key={client.id}
              client={client}
              onSuccess={() => {
                setShowEditModal(false)
                loadClient()
                loadPreparationStatus()
              }}
              onCancel={() => setShowEditModal(false)}
            />
          </Modal>
        )}

        {/* Resume Preview Modal */}
        {previewingDraft && (
          <Modal
            isOpen={!!previewingDraft}
            onClose={() => setPreviewingDraft(null)}
            title={`Preview: ${previewingDraft.content?.contact?.name || 'Resume'}`}
            size="lg"
          >
            <div className="bg-gray-50 p-6 rounded-lg overflow-y-auto max-h-[70vh]">
              <div className="bg-white shadow-lg mx-auto">
                <ResumePreview ref={previewRef} document={previewingDraft.content} />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setPreviewingDraft(null)}>
                Close
              </Button>
              <div className="relative group">
                <Button className="flex items-center gap-1 pr-1.5">
                  Download
                  <ChevronDown className="h-4 w-4" />
                </Button>
                <div className="absolute right-0 bottom-full mb-1 w-40 bg-white border border-careerist-border rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                  <div className="p-1">
                    <button
                      onClick={() => handleExportPDF(previewingDraft)}
                      className="w-full text-left px-3 py-2 text-xs text-careerist-text-primary hover:bg-gray-50 rounded-md transition-colors"
                    >
                      Download PDF
                    </button>
                    <button
                      onClick={() => handleExportWord(previewingDraft)}
                      className="w-full text-left px-3 py-2 text-xs text-careerist-text-primary hover:bg-gray-50 rounded-md transition-colors"
                    >
                      Download Word
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </Modal>
        )}

        {/* Preparation Step Modal */}
        {selectedStep && clientId && (
          <PreparationStepModal
            isOpen={showStepModal}
            onClose={() => {
              setShowStepModal(false)
              setSelectedStep(null)
            }}
            stepName={selectedStep}
            clientId={clientId}
            currentValue={
              selectedStep === 'Service Type' ? client.serviceType :
                selectedStep === 'Reverse Recruiter' ? client.reverseRecruiterId :
                  selectedStep === 'Gmail ID Creation' ? { gmailId: client.gmailId, gmailCreated: client.gmailCreated } :
                    selectedStep === 'WhatsApp Group Created' ? { whatsappGroupCreated: client.whatsappGroupCreated, whatsappGroupId: (client as any).whatsappGroupId } :
                      selectedStep === 'LinkedIn Optimized' ? client.linkedInOptimized :
                        undefined
            }
            onSuccess={() => {
              loadClient()
              loadPreparationStatus()
            }}
          />
        )}

        {/* Report Notification Modal */}
        {showReportNotificationModal && (
          <Modal
            isOpen={showReportNotificationModal}
            onClose={() => setShowReportNotificationModal(false)}
            title={reportSnapshot ? "Update Progress & Notify" : "Generate Share Link"}
            size="md"
          >
            <div className="space-y-4">
              <p className="text-sm text-careerist-text-secondary">
                Select an email template for the message text. The <strong>report link</strong> is always added below your template
                automatically, so clients always receive a working URL even if the template omits link placeholders.
              </p>
              <div className="text-xs text-careerist-text-secondary bg-careerist-bg-secondary rounded-lg p-3 border border-careerist-border space-y-1">
                <p className="font-medium text-careerist-text-primary">Body placeholders (link vars optional / legacy)</p>
                <ul className="list-disc list-inside space-y-0.5">
                  <li>
                    <code className="bg-white px-1 rounded">{'{{reportLink}}'}</code>, <code className="bg-white px-1 rounded">{'{{reportUrl}}'}</code>,{' '}
                    <code className="bg-white px-1 rounded">{'{{link}}'}</code> — optional in the template body; the real link is appended after the template
                  </li>
                  <li>
                    <code className="bg-white px-1 rounded">{'{{firstName}}'}</code>, <code className="bg-white px-1 rounded">{'{{lastName}}'}</code>,{' '}
                    <code className="bg-white px-1 rounded">{'{{fullName}}'}</code>
                  </li>
                  <li>
                    <code className="bg-white px-1 rounded">{'{{reportSummary}}'}</code> — plain-text funnel & activity summary
                  </li>
                  <li>
                    <code className="bg-white px-1 rounded">{'{{reportSummaryHtml}}'}</code> — HTML block for rich email bodies
                  </li>
                </ul>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-careerist-text-primary">Email Template</label>
                <select
                  className="w-full p-2 border border-careerist-border rounded-lg bg-white text-sm"
                  value={reportTemplateId}
                  onChange={(e) => setReportTemplateId(e.target.value)}
                >
                  <option value="">Select a template...</option>
                  {reportTemplates.map((t: any) => (
                    <option key={t.id} value={t.id}>{`${t.name} (${t.channel})`}</option>
                  ))}
                </select>
                <p className="text-[10px] text-careerist-text-secondary">
                  All templates from Admin Communications are listed here. For <strong>Update & Send Email</strong>, choose an
                  <strong> EMAIL</strong> template.
                </p>
                <p className="text-[10px] text-careerist-text-secondary">
                  <strong>Send to WhatsApp</strong> uses the same template body (placeholders filled) and opens{' '}
                  <code className="bg-gray-100 px-1 rounded">wa.me</code> so your installed WhatsApp Desktop or browser can send the message.
                </p>
              </div>

              {!client?.phone && (
                <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                  Add a phone number on this client&apos;s profile to use Send to WhatsApp.
                </p>
              )}

              <div className="flex flex-col gap-3 pt-4">
                <div className="flex flex-wrap gap-3">
                  <Button
                    onClick={() => {
                      const templateId = reportTemplateId
                      const selectedTemplate = reportTemplates.find((t: any) => t.id === templateId)
                      if (!templateId && !reportSnapshot) {
                        showToast('Please select a template for initial link generation', 'error');
                        return;
                      }
                      if (templateId && selectedTemplate?.channel !== 'EMAIL') {
                        showToast('Please select an EMAIL template to send report notification email', 'error')
                        return
                      }
                      handleUpdateSnapshot(templateId || undefined, !!templateId);
                    }}
                    isLoading={generatingSnapshot}
                  >
                    Update & Send Email
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => handleUpdateSnapshot(undefined, false)}
                    isLoading={generatingSnapshot}
                  >
                    Update Without Email
                  </Button>
                  {clientId && client?.phone && (
                    <SendToWhatsAppButton
                      disabled={generatingSnapshot}
                      onFetch={async () => {
                        const templateId = reportTemplateId
                        if (!templateId) throw new Error('Please select a template first')
                        const token = localStorage.getItem('token')
                        if (!token) throw new Error('Please log in')

                        let snapshot = reportSnapshot
                        if (!snapshot) {
                          const snapRes = await fetch(`/api/clients/${clientId}/report-snapshot`, {
                            method: 'POST',
                            headers: {
                              Authorization: `Bearer ${token}`,
                              'Content-Type': 'application/json',
                            },
                            credentials: 'include',
                            body: JSON.stringify({ sendEmail: false }),
                          })
                          if (!snapRes.ok) {
                            const err = await snapRes.json().catch(() => ({}))
                            throw new Error((err as { error?: string }).error || 'Could not generate report link. Try Update first.')
                          }
                          snapshot = await snapRes.json()
                          setReportSnapshot(snapshot)
                        }

                        const res = await fetch(`/api/clients/${clientId}/report-whatsapp-preview`, {
                          method: 'POST',
                          headers: {
                            Authorization: `Bearer ${token}`,
                            'Content-Type': 'application/json',
                          },
                          credentials: 'include',
                          body: JSON.stringify({ templateId }),
                        })
                        if (!res.ok) {
                          const err = await res.json().catch(() => ({}))
                          throw new Error((err as { error?: string }).error || 'Failed to build WhatsApp message')
                        }
                        return res.json()
                      }}
                      entityName={client ? `${client.firstName} ${client.lastName}` : 'client'}
                    />
                  )}
                </div>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </DashboardLayout >
  )
}

function ClientEditForm({
  client,
  onSuccess,
  onCancel,
}: {
  client: Client
  onSuccess: () => void
  onCancel: () => void
}) {
  const { showToast } = useToast()
  const [formData, setFormData] = useState({
    firstName: client.firstName,
    lastName: client.lastName,
    email: client.email || '',
    phone: client.phone || '',
    address: client.address || '',
    industry: client.industry || '',
    currentJobTitle: client.currentJobTitle || '',
    experience: client.experience || '',
    skills: client.skills?.join(', ') || '',
    notes: client.notes || '',
    status: client.status,
    serviceType: (client as any).serviceType || '',
    reverseRecruiterId: (client as any).reverseRecruiterId || '',
    gmailId: (client as any).gmailId || '',
    gmailCreated: (client as any).gmailCreated || false,
    whatsappGroupCreated: (client as any).whatsappGroupCreated || false,
    linkedInOptimized: (client as any).linkedInOptimized || false,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [assignableUsers, setAssignableUsers] = useState<
    Array<{ id: string; firstName: string; lastName: string; role?: string }>
  >([])
  const [assignedUserId, setAssignedUserId] = useState(client.assignedUser.id)

  useEffect(() => {
    setAssignedUserId(client.assignedUser.id)
  }, [client.id, client.assignedUser.id])

  useEffect(() => {
    const loadAssignable = async () => {
      const token = localStorage.getItem('token')
      const raw = localStorage.getItem('user')
      if (!token || !raw) return
      let me: { id: string; firstName: string; lastName: string; role?: string }
      try {
        me = JSON.parse(raw)
      } catch {
        return
      }
      try {
        if (me.role === 'ADMIN' || me.role === 'MANAGER') {
          const response = await fetch('/api/users?role=RECRUITER,MANAGER', {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            credentials: 'include',
          })
          if (response.ok) {
            const data = await response.json()
            setAssignableUsers(
              data
                .map((u: { id: string; firstName: string; lastName: string; role?: string }) => ({
                  id: u.id,
                  firstName: u.firstName,
                  lastName: u.lastName,
                  role: u.role,
                }))
                .sort((a: { firstName: string; lastName: string }, b: { firstName: string; lastName: string }) =>
                  `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`)
                )
            )
          }
        } else {
          setAssignableUsers([
            { id: me.id, firstName: me.firstName, lastName: me.lastName, role: me.role },
          ])
        }
      } catch (err) {
        console.error('Failed to load assignable users:', err)
      }
    }
    void loadAssignable()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const token = localStorage.getItem('token')
      const raw = localStorage.getItem('user')
      const sessionUser = raw ? (() => { try { return JSON.parse(raw) as { role?: string } } catch { return null } })() : null
      const canSetPrimaryAssignee = sessionUser?.role === 'ADMIN' || sessionUser?.role === 'MANAGER'

      const payload: Record<string, unknown> = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email && formData.email.trim() !== '' ? formData.email.trim() : undefined,
        phone: formData.phone && formData.phone.trim() !== '' ? formData.phone.trim() : undefined,
        address: formData.address && formData.address.trim() !== '' ? formData.address.trim() : undefined,
        industry: formData.industry && formData.industry.trim() !== '' ? formData.industry.trim() : undefined,
        currentJobTitle: formData.currentJobTitle && formData.currentJobTitle.trim() !== '' ? formData.currentJobTitle.trim() : undefined,
        experience: formData.experience && formData.experience.trim() !== '' ? formData.experience.trim() : undefined,
        skills: formData.skills ? formData.skills.split(',').map(s => s.trim()).filter(s => s.length > 0) : [],
        notes: formData.notes && formData.notes.trim() !== '' ? formData.notes.trim() : undefined,
        status: formData.status,
        serviceType: formData.serviceType || undefined,
        reverseRecruiterId: formData.reverseRecruiterId || undefined,
        gmailId: formData.gmailId && formData.gmailId.trim() !== '' ? formData.gmailId.trim() : undefined,
        gmailCreated: formData.gmailCreated,
        whatsappGroupCreated: formData.whatsappGroupCreated,
        linkedInOptimized: formData.linkedInOptimized,
      }

      if (canSetPrimaryAssignee && assignedUserId.trim()) {
        payload.assignedUserId = assignedUserId.trim()
      }

      const response = await fetch(`/api/clients/${client.id}`, {
        method: 'PATCH',
        headers: {
          ...(token && { 'Authorization': `Bearer ${token}` }),
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        showToast('Client updated successfully', 'success')
        onSuccess()
      } else {
        const data = await response.json().catch(() => ({ error: 'Failed to update client' }))
        const errorMessage = typeof data.error === 'string'
          ? data.error
          : Array.isArray(data.error)
            ? data.error.map((e: { message?: string } | string) => typeof e === 'string' ? e : e.message || 'Error').join(', ')
            : (data.error as { message?: string })?.message || 'Failed to update client. Please check your input and try again.'
        setError(errorMessage)
      }
    } catch {
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
          label="Industry (Desired)"
          type="text"
          value={formData.industry}
          onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
          placeholder="e.g., IT, Finance, Healthcare"
        />
        <Input
          label="Current Job Title"
          type="text"
          value={formData.currentJobTitle}
          onChange={(e) => setFormData({ ...formData, currentJobTitle: e.target.value })}
          placeholder="e.g., Software Developer"
        />
      </div>

      <Input
        label="Experience"
        type="text"
        value={formData.experience}
        onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
        placeholder="e.g., 5 years in Software Development"
      />

      <Input
        label="Skills (comma-separated)"
        type="text"
        value={formData.skills}
        onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
        placeholder="e.g., React, Node.js, TypeScript, AWS"
      />

      <Textarea
        label="Address"
        value={formData.address}
        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
        rows={2}
      />

      <Select
        label="Assigned to (primary)"
        helperText="Account owner shown on the client list. Separate from reverse recruiter below."
        value={assignedUserId}
        onChange={(e) => setAssignedUserId(e.target.value)}
        options={(() => {
          const opts: { value: string; label: string }[] = assignableUsers.map((u) => ({
            value: u.id,
            label: `${u.firstName} ${u.lastName}${u.role === 'MANAGER' ? ' (Manager)' : ''}`,
          }))
          const raw = localStorage.getItem('user')
          if (raw) {
            try {
              const u = JSON.parse(raw) as { id?: string; firstName?: string; lastName?: string }
              if (u?.id && !opts.some((o) => o.value === u.id)) {
                opts.push({ value: u.id, label: `${u.firstName ?? ''} ${u.lastName ?? ''} (you)`.trim() })
              }
            } catch {
              /* noop */
            }
          }
          if (!opts.some((o) => o.value === client.assignedUser.id)) {
            opts.push({
              value: client.assignedUser.id,
              label: `${client.assignedUser.firstName} ${client.assignedUser.lastName} (current assignee)`,
            })
          }
          opts.sort((a, b) => a.label.localeCompare(b.label))
          return [{ value: '', label: 'Select assignee' }, ...opts]
        })()}
      />

      <div className="grid grid-cols-2 gap-4">
        <Select
          label="Service Type"
          value={formData.serviceType}
          onChange={(e) => setFormData({ ...formData, serviceType: e.target.value })}
          options={[
            { value: '', label: 'Select Service Type' },
            { value: 'STANDARD', label: 'Standard' },
            { value: 'PREMIUM', label: 'Premium' },
            { value: 'EXECUTIVE', label: 'Executive' },
            { value: 'CONTRACT', label: 'Contract' },
            { value: 'CUSTOM', label: 'Custom' },
          ]}
        />
        <Select
          label="Reverse Recruiter"
          helperText="Optional reverse-hire partner—not the primary assignee."
          value={formData.reverseRecruiterId}
          onChange={(e) => setFormData({ ...formData, reverseRecruiterId: e.target.value })}
          options={[
            { value: '', label: 'Select Reverse Recruiter' },
            ...assignableUsers.map((r) => ({ value: r.id, label: `${r.firstName} ${r.lastName}` })),
          ]}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Gmail ID"
          type="text"
          value={formData.gmailId}
          onChange={(e) => setFormData({ ...formData, gmailId: e.target.value })}
          placeholder="e.g., john.doe@gmail.com"
        />
        <div className="flex items-center pt-6">
          <input
            type="checkbox"
            id="gmailCreated"
            checked={formData.gmailCreated}
            onChange={(e) => setFormData({ ...formData, gmailCreated: e.target.checked })}
            className="mr-2"
          />
          <label htmlFor="gmailCreated" className="text-sm text-gray-700">Gmail Created</label>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex items-center">
          <input
            type="checkbox"
            id="whatsappGroupCreated"
            checked={formData.whatsappGroupCreated}
            onChange={(e) => setFormData({ ...formData, whatsappGroupCreated: e.target.checked })}
            className="mr-2"
          />
          <label htmlFor="whatsappGroupCreated" className="text-sm text-gray-700">WhatsApp Group Created</label>
        </div>
        <div className="flex items-center">
          <input
            type="checkbox"
            id="linkedInOptimized"
            checked={formData.linkedInOptimized}
            onChange={(e) => setFormData({ ...formData, linkedInOptimized: e.target.checked })}
            className="mr-2"
          />
          <label htmlFor="linkedInOptimized" className="text-sm text-gray-700">LinkedIn Optimized</label>
        </div>
      </div>

      <Select
        label="Status"
        value={formData.status}
        onChange={(e) => setFormData({ ...formData, status: e.target.value as 'ACTIVE' | 'INACTIVE' })}
        options={[
          { value: 'ACTIVE', label: 'Active' },
          { value: 'INACTIVE', label: 'Inactive' },
        ]}
      />

      <Textarea
        label="Notes"
        value={formData.notes}
        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
        rows={3}
        placeholder="Additional notes about the client..."
      />

      <FormActions
        onCancel={onCancel}
        submitLabel="Update"
        isLoading={loading}
      />
    </form>
  )
}

function PendingApprovalsList({ clientId }: { clientId: string }) {
  const [applications, setApplications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeSubTab, setActiveSubTab] = useState<'pending' | 'approved'>('pending')

  useEffect(() => {
    loadApprovals()
  }, [clientId])

  const loadApprovals = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`/api/clients/${clientId}/applications?pageSize=100`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setApplications(data.applications || [])
      }
    } catch (err) {
      console.error('Failed to load pending approvals', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="p-8 text-center"><Spinner /></div>

  const pending = applications.filter((app) => app.stage === 'PENDING_CLIENT_APPROVAL')
  const decided = applications.filter((app) => app.stage === 'IDENTIFIED' || app.stage === 'REJECTED')

  const hasPending = pending.length > 0
  const hasDecided = decided.length > 0

  const renderApplicationCard = (app: any) => {
    const jobs = (app.applicationJobs || [])
      .map((aj: any) => aj.job)
      .filter((j: any) => j) as Array<{ id: string; title: string; company: string; location?: string }>
    const primaryJob = jobs[0] || app.job || null
    const extraCount = jobs.length > 1 ? jobs.length - 1 : 0
    return (
      <div key={app.id} className="p-6 hover:bg-gray-50 transition-colors">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-md font-bold text-gray-900">
              {primaryJob?.title || '—'}
              {extraCount > 0 && (
                <span className="ml-1 text-[11px] text-gray-500 font-medium">
                  (+{extraCount} more)
                </span>
              )}
            </h4>
            <p className="text-sm text-gray-600 font-medium">{primaryJob?.company || '—'}</p>
            <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
              <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {primaryJob?.location || '-'}</span>
              <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Sourced {new Date(app.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
          <div className="text-right">
            {app.stage === 'PENDING_CLIENT_APPROVAL' && app.approvalToken && (
              <>
                <Badge variant="info" className="mb-2 block w-fit ml-auto border-blue-100 text-blue-700 bg-blue-50">Token Generated</Badge>
                <p className="text-[10px] text-gray-400 font-mono select-all">/public/approvals/{app.approvalToken}</p>
              </>
            )}
            {app.stage === 'IDENTIFIED' && app.approvedAt && (
              <Badge variant="success" className="mb-1">Client Approved</Badge>
            )}
            {app.stage === 'REJECTED' && (
              <Badge variant="error" className="mb-1">Client Rejected</Badge>
            )}
          </div>
        </div>
      </div>
    )
  }

  if (!hasPending && !hasDecided) {
    return (
      <div className="p-12 text-center text-gray-500">
        <Clock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <p>No jobs currently pending or recently decided for this client.</p>
      </div>
    )
  }

  return (
    <div>
      <div className="border-b border-gray-200 mb-4">
        <nav className="flex -mb-px">
          <button
            onClick={() => setActiveSubTab('pending')}
            className={`mr-6 py-2 px-1 border-b-2 text-sm font-medium ${
              activeSubTab === 'pending'
                ? 'border-[#F4B400] text-[#1F3A5F]'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Pending
          </button>
          <button
            onClick={() => setActiveSubTab('approved')}
            className={`py-2 px-1 border-b-2 text-sm font-medium ${
              activeSubTab === 'approved'
                ? 'border-[#16A34A] text-[#166534]'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Approved / Rejected
          </button>
        </nav>
      </div>

      {activeSubTab === 'pending' ? (
        pending.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <Clock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p>No jobs currently pending client approval.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {pending.map(renderApplicationCard)}
          </div>
        )
      ) : decided.length === 0 ? (
        <div className="p-12 text-center text-gray-500">
          <p>No recently approved or rejected jobs for this client.</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {decided.map(renderApplicationCard)}
        </div>
      )}
    </div>
  )
}
