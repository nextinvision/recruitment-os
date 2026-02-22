'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { DashboardLayout } from '@/components/DashboardLayout'
import { ActivityTimeline, Modal, Button, Badge, Spinner, Input, Textarea, Select, Alert, FormActions, ToastContainer, useToast, ConfirmDialog, useConfirmDialog, PreparationPipelineBoard, PreparationStepModal } from '@/ui'
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

export default function ClientProfilePage() {
  const router = useRouter()
  const params = useParams()
  const clientId = params?.id as string | undefined

  const [client, setClient] = useState<Client | null>(null)
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [showEditModal, setShowEditModal] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'preparation' | 'activities'>('overview')
  const [preparationStatus, setPreparationStatus] = useState<any>(null)
  const [selectedStep, setSelectedStep] = useState<string | null>(null)
  const [showStepModal, setShowStepModal] = useState(false)
  const { showConfirm, dialogState, closeDialog, handleConfirm } = useConfirmDialog()
  const { toasts, showToast, removeToast } = useToast()

  useEffect(() => {
    if (!clientId) {
      setError('Client ID is missing')
      setLoading(false)
      return
    }
    
    loadClient()
    loadActivities()
    loadPreparationStatus()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId])

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
        <ToastContainer toasts={toasts} onRemove={removeToast} />
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
      <ToastContainer toasts={toasts} onRemove={removeToast} />
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
                className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'overview'
                    ? 'border-careerist-primary-yellow text-careerist-primary-yellow'
                    : 'border-transparent text-careerist-text-secondary hover:text-careerist-text-primary hover:border-gray-300'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('preparation')}
                className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'preparation'
                    ? 'border-careerist-primary-yellow text-careerist-primary-yellow'
                    : 'border-transparent text-careerist-text-secondary hover:text-careerist-text-primary hover:border-gray-300'
                }`}
              >
                Preparation Pipeline
              </button>
              <button
                onClick={() => setActiveTab('activities')}
                className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'activities'
                    ? 'border-careerist-primary-yellow text-careerist-primary-yellow'
                    : 'border-transparent text-careerist-text-secondary hover:text-careerist-text-primary hover:border-gray-300'
                }`}
              >
                Activities
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
                      if (step && ['Service Type', 'Reverse Recruiter', 'Gmail ID Creation', 'WhatsApp Group Created', 'LinkedIn Optimized'].includes(step.name)) {
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
              </div>
            )}

            {activeTab === 'activities' && (
              <div>
          <ActivityTimeline activities={activities} entityName={`${client.firstName} ${client.lastName}`} />
              </div>
            )}
          </div>
        </div>

        {/* Edit Modal */}
        {showEditModal && client && (
          <Modal
            isOpen={showEditModal}
            onClose={() => setShowEditModal(false)}
            title="Edit Client"
            size="lg"
          >
            <ClientEditForm
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
      </div>
    </DashboardLayout>
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
  const [recruiters, setRecruiters] = useState<Array<{ id: string; firstName: string; lastName: string }>>([])

  useEffect(() => {
    loadRecruiters()
  }, [])

  const loadRecruiters = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const response = await fetch('/api/users?role=RECRUITER', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      })

      if (response.ok) {
        const data = await response.json()
        setRecruiters(data.map((u: any) => ({
          id: u.id,
          firstName: u.firstName,
          lastName: u.lastName,
        })))
      }
    } catch (err) {
      console.error('Failed to load recruiters:', err)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const token = localStorage.getItem('token')

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
          value={formData.reverseRecruiterId}
          onChange={(e) => setFormData({ ...formData, reverseRecruiterId: e.target.value })}
          options={[
            { value: '', label: 'Select Reverse Recruiter' },
            ...recruiters.map(r => ({ value: r.id, label: `${r.firstName} ${r.lastName}` })),
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
