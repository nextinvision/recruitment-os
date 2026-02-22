'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { DataTable, Modal, Input, Textarea, Select, Alert, FormActions, PageHeader, Button, Badge, Spinner, ClientFilters, Pagination, useToast } from '@/ui'
import { DashboardLayout } from '@/components/DashboardLayout'
import Link from 'next/link'
import type { ClientFilters as ClientFiltersType } from '@/ui'

type FormFieldType = 'text' | 'email' | 'phone' | 'number' | 'textarea' | 'select' | 'section'
interface OnboardingFormField {
  id: string
  key: string
  label: string
  type: FormFieldType
  required?: boolean
  options?: string[]
  placeholder?: string
}
interface OnboardingForm {
  id: string
  title: string
  description: string | null
  fields: OnboardingFormField[]
  _count?: { submissions: number }
}
interface OnboardingSubmission {
  id: string
  submittedAt: string
  data: Record<string, unknown>
  formId: string
  form?: { id: string; title: string }
  clientId: string | null
  client?: { id: string; firstName: string; lastName: string } | null
}

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
  assignedUser?: {
    id: string
    firstName: string
    lastName: string
  }
  createdAt: string
  _count?: {
    activities: number
    followUps: number
    revenues: number
    payments: number
    coverLetters?: number
    documents?: number
  }
}

interface ClientsResponse {
  clients: Client[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export default function ClientsPage() {
  const router = useRouter()
  const [clientsData, setClientsData] = useState<ClientsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [filters, setFilters] = useState<ClientFiltersType>({})
  const [sortBy, setSortBy] = useState<string>('createdAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const [recruiters, setRecruiters] = useState<Array<{ id: string; firstName: string; lastName: string }>>([])
  const [userRole, setUserRole] = useState<string>('')
  const [activeTab, setActiveTab] = useState<'clients' | 'onboarding'>('clients')
  const [onboardingForms, setOnboardingForms] = useState<OnboardingForm[]>([])
  const [onboardingSubmissions, setOnboardingSubmissions] = useState<OnboardingSubmission[]>([])
  const [onboardingFormsLoading, setOnboardingFormsLoading] = useState(false)
  const [onboardingSubmissionsLoading, setOnboardingSubmissionsLoading] = useState(false)
  const [showFormBuilderModal, setShowFormBuilderModal] = useState(false)
  const [editingForm, setEditingForm] = useState<OnboardingForm | null>(null)
  const [createClientLoadingId, setCreateClientLoadingId] = useState<string | null>(null)
  const { showToast } = useToast()

  const loadOnboardingForms = useCallback(async () => {
    const token = localStorage.getItem('token')
    if (!token) return
    setOnboardingFormsLoading(true)
    try {
      const res = await fetch('/api/onboarding-forms', {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        credentials: 'include',
      })
      if (res.ok) setOnboardingForms(await res.json())
    } finally {
      setOnboardingFormsLoading(false)
    }
  }, [])

  const loadOnboardingSubmissions = useCallback(async () => {
    const token = localStorage.getItem('token')
    if (!token) return
    setOnboardingSubmissionsLoading(true)
    try {
      const res = await fetch('/api/onboarding-forms/submissions', {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        credentials: 'include',
      })
      if (res.ok) setOnboardingSubmissions(await res.json())
    } finally {
      setOnboardingSubmissionsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (activeTab === 'onboarding') {
      loadOnboardingForms()
      loadOnboardingSubmissions()
    }
  }, [activeTab, loadOnboardingForms, loadOnboardingSubmissions])

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (userData) {
      const user = JSON.parse(userData)
      setUserRole(user.role)
    }
    loadRecruiters()
    loadClients()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, sortBy, sortOrder, filters])

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

  const loadClients = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/login')
        return
      }

      // Build query string
      const params = new URLSearchParams()
      if (filters.status) params.append('status', filters.status)
      if (filters.assignedUserId) params.append('assignedUserId', filters.assignedUserId)
      if (filters.industry) params.append('industry', filters.industry)
      if (filters.startDate) params.append('startDate', filters.startDate)
      if (filters.endDate) params.append('endDate', filters.endDate)
      if (filters.search) params.append('search', filters.search)
      if (filters.hasSkills !== undefined) params.append('hasSkills', String(filters.hasSkills))
      params.append('sortBy', sortBy)
      params.append('sortOrder', sortOrder)
      params.append('page', String(page))
      params.append('pageSize', String(pageSize))

      const response = await fetch(`/api/clients?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      })

      if (response.ok) {
        const data: ClientsResponse = await response.json()
        setClientsData(data)
      }
    } catch (err) {
      console.error('Failed to load clients:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateClient = () => {
    setSelectedClient(null)
    setShowCreateModal(true)
  }

  const handleEditClient = (client: Client) => {
    setSelectedClient(client)
    setShowCreateModal(true)
  }

  const handleExport = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const params = new URLSearchParams()
      if (filters.status) params.append('status', filters.status)
      if (filters.assignedUserId) params.append('assignedUserId', filters.assignedUserId)
      if (filters.industry) params.append('industry', filters.industry)
      if (filters.startDate) params.append('startDate', filters.startDate)
      if (filters.endDate) params.append('endDate', filters.endDate)
      if (filters.search) params.append('search', filters.search)
      if (filters.hasSkills !== undefined) params.append('hasSkills', String(filters.hasSkills))

      const response = await fetch(`/api/clients/export?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `clients-${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (err) {
      console.error('Failed to export clients:', err)
    }
  }

  const columns = [
    {
      key: 'name',
      header: 'Name',
      render: (client: Client) => (
        <Link
          href={`/clients/${client.id}`}
          className="font-medium text-careerist-text-primary hover:text-careerist-primary-yellow transition-colors"
          onClick={(e) => e.stopPropagation()}
        >
          {client.firstName} {client.lastName}
        </Link>
      ),
    },
    {
      key: 'preparationStatus',
      header: 'Preparation',
      render: (client: Client) => {
        if (client.jobSearchInitiated) {
          return <Badge variant="success">Ready</Badge>
        }
        if (client.serviceType && client.reverseRecruiterId) {
          return <Badge variant="warning">In Progress</Badge>
        }
        return <Badge variant="neutral">Not Started</Badge>
      },
    },
    {
      key: 'email',
      header: 'Email',
      render: (client: Client) => <span className="text-careerist-text-primary">{client.email || '-'}</span>,
    },
    {
      key: 'phone',
      header: 'Phone',
      render: (client: Client) => <span className="text-careerist-text-primary">{client.phone || '-'}</span>,
    },
    {
      key: 'industry',
      header: 'Industry',
      render: (client: Client) => <span className="text-careerist-text-secondary">{client.industry || '-'}</span>,
    },
    {
      key: 'currentJobTitle',
      header: 'Current Job',
      render: (client: Client) => <span className="text-careerist-text-secondary">{client.currentJobTitle || '-'}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (client: Client) => (
        <Badge variant={client.status === 'ACTIVE' ? 'success' : 'neutral'}>
          {client.status}
        </Badge>
      ),
    },
    {
      key: 'assignedUser',
      header: 'Assigned To',
      render: (client: Client) => (
        <span className="text-careerist-text-secondary">
          {client.assignedUser ? `${client.assignedUser.firstName} ${client.assignedUser.lastName}` : '-'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (client: Client) => (
        <button
          onClick={() => handleEditClient(client)}
          className="text-careerist-primary-navy hover:text-careerist-primary-yellow text-sm transition-colors"
        >
          Edit
        </button>
      ),
    },
  ]

  if (loading && !clientsData) {
    return (
      <DashboardLayout>
        <Spinner fullScreen />
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <PageHeader
            title="Clients"
            description="Manage job seekers who are taking our placement services"
          />
          <div className="flex items-center gap-3">
            {(userRole === 'ADMIN' || userRole === 'MANAGER') && (
              <Button variant="secondary" onClick={handleExport}>
                Export CSV
              </Button>
            )}
            <Button onClick={handleCreateClient}>
              Add Client
            </Button>
          </div>
        </div>

        <div className="border-b border-gray-200">
          <nav className="flex gap-6">
            <button
              type="button"
              onClick={() => setActiveTab('clients')}
              className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'clients'
                  ? 'border-careerist-primary-yellow text-careerist-primary-navy'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Clients
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('onboarding')}
              className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'onboarding'
                  ? 'border-careerist-primary-yellow text-careerist-primary-navy'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Onboarding Forms
            </button>
          </nav>
        </div>

        {activeTab === 'onboarding' && (
          <OnboardingFormsSection
            forms={onboardingForms}
            submissions={onboardingSubmissions}
            formsLoading={onboardingFormsLoading}
            submissionsLoading={onboardingSubmissionsLoading}
            onRefreshForms={loadOnboardingForms}
            onRefreshSubmissions={loadOnboardingSubmissions}
            onCreateForm={() => {
              setEditingForm(null)
              setShowFormBuilderModal(true)
            }}
            onEditForm={(form) => {
              setEditingForm(form)
              setShowFormBuilderModal(true)
            }}
            onCopyLink={(formId) => {
              const url = `${typeof window !== 'undefined' ? window.location.origin : ''}/onboarding/${formId}`
              navigator.clipboard.writeText(url).then(() => showToast('Link copied to clipboard', 'success'))
            }}
            onDeleteForm={async (formId) => {
              const token = localStorage.getItem('token')
              if (!token) return
              try {
                const res = await fetch(`/api/onboarding-forms/${formId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` }, credentials: 'include' })
                if (res.ok) {
                  loadOnboardingForms()
                  loadOnboardingSubmissions()
                } else {
                  const data = await res.json().catch(() => ({}))
                  showToast(data.error || 'Failed to delete form', 'error')
                }
              } catch {
                showToast('Failed to delete form', 'error')
              }
            }}
            onCreateClient={async (submissionId) => {
              const token = localStorage.getItem('token')
              if (!token) return
              setCreateClientLoadingId(submissionId)
              try {
                const res = await fetch(`/api/onboarding-forms/submissions/${submissionId}/create-client`, {
                  method: 'POST',
                  headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                  credentials: 'include',
                })
                if (res.ok) {
                  const client = await res.json()
                  loadOnboardingSubmissions()
                  loadClients()
                  showToast(`Client "${client.firstName} ${client.lastName}" created`, 'success')
                  router.push(`/clients/${client.id}`)
                } else {
                  const data = await res.json().catch(() => ({}))
                  showToast(data.error || 'Failed to create client', 'error')
                }
              } catch {
                showToast('Failed to create client', 'error')
              } finally {
                setCreateClientLoadingId(null)
              }
            }}
            createClientLoadingId={createClientLoadingId}
          />
        )}

        {activeTab === 'clients' && (
          <>
        <ClientFilters
          filters={filters}
          onChange={setFilters}
          recruiters={recruiters}
        />

        {clientsData && clientsData.clients.length > 0 ? (
          <>
            <DataTable
              data={clientsData.clients}
              columns={columns}
              searchable={false}
            />

            {clientsData.totalPages > 1 && (
              <Pagination
                currentPage={clientsData.page}
                totalPages={clientsData.totalPages}
                pageSize={clientsData.pageSize}
                total={clientsData.total}
                onPageChange={setPage}
                onPageSizeChange={(newSize) => {
                  setPageSize(newSize)
                  setPage(1)
                }}
              />
            )}
          </>
        ) : (
          <div className="text-center py-12 bg-white rounded-lg shadow border border-gray-200">
            <p className="text-gray-700">No clients found.</p>
          </div>
        )}
          </>
        )}

        {showFormBuilderModal && (
          <Modal
            isOpen={showFormBuilderModal}
            onClose={() => {
              setShowFormBuilderModal(false)
              setEditingForm(null)
            }}
            title={editingForm ? 'Edit Form' : 'Create Onboarding Form'}
            size="lg"
          >
            <OnboardingFormBuilder
              form={editingForm}
              onSuccess={() => {
                setShowFormBuilderModal(false)
                setEditingForm(null)
                loadOnboardingForms()
              }}
              onCancel={() => {
                setShowFormBuilderModal(false)
                setEditingForm(null)
              }}
            />
          </Modal>
        )}

        {showCreateModal && (
          <Modal
            isOpen={showCreateModal}
            onClose={() => {
              setShowCreateModal(false)
              setSelectedClient(null)
            }}
            title={selectedClient ? 'Edit Client' : 'Create Client'}
            size="lg"
          >
            <ClientForm
              client={selectedClient}
              onSuccess={() => {
                setShowCreateModal(false)
                setSelectedClient(null)
                loadClients()
              }}
              onCancel={() => {
                setShowCreateModal(false)
                setSelectedClient(null)
              }}
            />
          </Modal>
        )}
      </div>
    </DashboardLayout>
  )
}

function ClientForm({
  client,
  onSuccess,
  onCancel,
}: {
  client: Client | null
  onSuccess: () => void
  onCancel: () => void
}) {
  const [formData, setFormData] = useState({
    firstName: client?.firstName || '',
    lastName: client?.lastName || '',
    email: client?.email || '',
    phone: client?.phone || '',
    address: client?.address || '',
    industry: client?.industry || '',
    currentJobTitle: client?.currentJobTitle || '',
    experience: client?.experience || '',
    skills: client?.skills?.join(', ') || '',
    notes: client?.notes || '',
    status: client?.status || 'ACTIVE',
    serviceType: client?.serviceType || '',
    reverseRecruiterId: client?.reverseRecruiterId || '',
    gmailId: (client as any)?.gmailId || '',
    gmailCreated: (client as any)?.gmailCreated || false,
    whatsappGroupCreated: (client as any)?.whatsappGroupCreated || false,
    linkedInOptimized: (client as any)?.linkedInOptimized || false,
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
      const userData = localStorage.getItem('user')
      const user = userData ? JSON.parse(userData) : null

      const url = client ? `/api/clients/${client.id}` : '/api/clients'
      const method = client ? 'PATCH' : 'POST'

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
        serviceType: formData.serviceType || undefined,
        reverseRecruiterId: formData.reverseRecruiterId || undefined,
        gmailId: formData.gmailId && formData.gmailId.trim() !== '' ? formData.gmailId.trim() : undefined,
        gmailCreated: formData.gmailCreated,
        whatsappGroupCreated: formData.whatsappGroupCreated,
        linkedInOptimized: formData.linkedInOptimized,
      }

      if (method === 'POST') {
        payload.assignedUserId = user?.id
        // Set onboardedDate on creation
        payload.onboardedDate = new Date().toISOString()
      } else if (client) {
        payload.status = formData.status
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
        const data = await response.json().catch(() => ({ error: 'Failed to save client' }))
        const errorMessage = typeof data.error === 'string'
          ? data.error
          : Array.isArray(data.error)
            ? data.error.map((e: { message?: string } | string) => typeof e === 'string' ? e : e.message || 'Error').join(', ')
            : (data.error as { message?: string })?.message || 'Failed to save client. Please check your input and try again.'
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

      {client && (
        <Select
          label="Status"
          value={formData.status}
          onChange={(e) => setFormData({ ...formData, status: e.target.value as 'ACTIVE' | 'INACTIVE' })}
          options={[
            { value: 'ACTIVE', label: 'Active' },
            { value: 'INACTIVE', label: 'Inactive' },
          ]}
        />
      )}

      <Textarea
        label="Notes"
        value={formData.notes}
        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
        rows={3}
        placeholder="Additional notes about the client..."
      />

      <FormActions
        onCancel={onCancel}
        submitLabel={client ? 'Update' : 'Create'}
        isLoading={loading}
      />
    </form>
  )
}

function OnboardingFormsSection({
  forms,
  submissions,
  formsLoading,
  submissionsLoading,
  onRefreshForms,
  onRefreshSubmissions,
  onCreateForm,
  onEditForm,
  onCopyLink,
  onDeleteForm,
  onCreateClient,
  createClientLoadingId,
}: {
  forms: OnboardingForm[]
  submissions: OnboardingSubmission[]
  formsLoading: boolean
  submissionsLoading: boolean
  onRefreshForms: () => void
  onRefreshSubmissions: () => void
  onCreateForm: () => void
  onEditForm: (form: OnboardingForm) => void
  onCopyLink: (formId: string) => void
  onDeleteForm: (formId: string) => void
  onCreateClient: (submissionId: string) => void
  createClientLoadingId: string | null
}) {
  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button onClick={onCreateForm}>Create Form</Button>
      </div>

      <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
        <h3 className="px-4 py-3 bg-gray-50 border-b border-gray-200 font-medium text-careerist-primary-navy">Forms</h3>
        {formsLoading ? (
          <div className="p-8 text-center text-gray-500">Loading forms...</div>
        ) : forms.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No onboarding forms yet. Create one to collect client details via a shareable link.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Link</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Submissions</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {forms.map((f) => (
                  <tr key={f.id}>
                    <td className="px-4 py-3 text-sm text-careerist-text-primary">{f.title}</td>
                    <td className="px-4 py-3">
                      <Button variant="secondary" size="sm" onClick={() => onCopyLink(f.id)}>Copy link</Button>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{f._count?.submissions ?? 0}</td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <button type="button" onClick={() => onEditForm(f)} className="text-careerist-primary-navy hover:text-careerist-primary-yellow text-sm">Edit</button>
                      <button type="button" onClick={() => onDeleteForm(f.id)} className="text-red-600 hover:text-red-800 text-sm">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
        <h3 className="px-4 py-3 bg-gray-50 border-b border-gray-200 font-medium text-careerist-primary-navy">Submissions</h3>
        {submissionsLoading ? (
          <div className="p-8 text-center text-gray-500">Loading submissions...</div>
        ) : submissions.length === 0 ? (
          <div className="p-8 text-center text-gray-500">Form submissions will appear here. Share a form link with clients to collect responses.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Form</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Submitted</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Preview</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {submissions.map((s) => {
                  const d = s.data as Record<string, unknown>
                  const preview = [d.email, d.firstName || d.first_name, d.lastName || d.last_name, d.fullName, d.currentRole, d.phone].filter(Boolean).map(String).slice(0, 2).join(' · ') || '—'
                  return (
                    <tr key={s.id}>
                      <td className="px-4 py-3 text-sm text-gray-700">{s.form?.title ?? '—'}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{new Date(s.submittedAt).toLocaleString()}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate" title={preview}>{preview}</td>
                      <td className="px-4 py-3 text-sm">
                        {s.clientId && s.client ? (
                          <Link href={`/clients/${s.client.id}`} className="text-careerist-primary-navy hover:text-careerist-primary-yellow">
                            {s.client.firstName} {s.client.lastName}
                          </Link>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {!s.clientId ? (
                          <Button
                            size="sm"
                            onClick={() => onCreateClient(s.id)}
                            disabled={createClientLoadingId === s.id}
                          >
                            {createClientLoadingId === s.id ? 'Creating...' : 'Create client'}
                          </Button>
                        ) : null}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

function OnboardingFormBuilder({
  form,
  onSuccess,
  onCancel,
}: {
  form: OnboardingForm | null
  onSuccess: () => void
  onCancel: () => void
}) {
  const [title, setTitle] = useState(form?.title ?? '')
  const [description, setDescription] = useState(form?.description ?? '')
  const [fields, setFields] = useState<OnboardingFormField[]>(form?.fields?.length ? [...form.fields] : [{ id: crypto.randomUUID(), key: 'fullName', label: 'Full Name', type: 'text', required: true }])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const addField = () => {
    setFields((prev) => [...prev, { id: crypto.randomUUID(), key: `field_${prev.length}`, label: 'New field', type: 'text', required: false }])
  }
  const removeField = (id: string) => {
    setFields((prev) => prev.filter((f) => f.id !== id))
  }
  const updateField = (id: string, updates: Partial<OnboardingFormField>) => {
    setFields((prev) => prev.map((f) => (f.id === id ? { ...f, ...updates } : f)))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!title.trim()) {
      setError('Title is required')
      return
    }
    if (fields.filter((f) => f.type !== 'section').length === 0) {
      setError('Add at least one input field')
      return
    }
    for (const f of fields) {
      if (f.type !== 'section' && (!f.key?.trim() || !f.label?.trim())) {
        setError('Each field must have a key and label')
        return
      }
    }
    const token = localStorage.getItem('token')
    if (!token) return
    setSaving(true)
    try {
      const payload = { title: title.trim(), description: description.trim() || undefined, fields }
      const url = form ? `/api/onboarding-forms/${form.id}` : '/api/onboarding-forms'
      const method = form ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      })
      if (res.ok) {
        onSuccess()
      } else {
        const data = await res.json().catch(() => ({}))
        setError(typeof data.error === 'string' ? data.error : 'Failed to save form')
      }
    } catch {
      setError('Network error')
    } finally {
      setSaving(false)
    }
  }

  const fieldTypes: { value: FormFieldType; label: string }[] = [
    { value: 'text', label: 'Text' },
    { value: 'email', label: 'Email' },
    { value: 'phone', label: 'Phone' },
    { value: 'number', label: 'Number' },
    { value: 'textarea', label: 'Long text' },
    { value: 'select', label: 'Dropdown' },
    { value: 'section', label: 'Section header' },
  ]

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <Alert variant="error">{error}</Alert>}
      <Input label="Form title" value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="e.g. Profile details" />
      <Textarea label="Description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="Shown at top of form" />

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-900">Fields</label>
          <Button type="button" variant="secondary" size="sm" onClick={addField}>Add field</Button>
        </div>
        <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
          {fields.map((f) => (
            <div key={f.id} className="p-3 border border-gray-200 rounded-lg space-y-2 bg-gray-50/50">
              {f.type === 'section' ? (
                <>
                  <Input label="Section label" value={f.label} onChange={(e) => updateField(f.id, { label: e.target.value })} />
                  <button type="button" onClick={() => removeField(f.id)} className="text-sm text-red-600 hover:text-red-800">Remove section</button>
                </>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    <Input label="Key (e.g. email, currentRole)" value={f.key} onChange={(e) => updateField(f.id, { key: e.target.value.replace(/\s/g, '_') })} placeholder="uniqueKey" />
                    <Input label="Label" value={f.label} onChange={(e) => updateField(f.id, { label: e.target.value })} placeholder="Display label" />
                  </div>
                  <div className="flex flex-wrap gap-2 items-center">
                    <Select
                      label="Type"
                      value={f.type}
                      onChange={(e) => updateField(f.id, { type: e.target.value as FormFieldType })}
                      options={fieldTypes.map((t) => ({ value: t.value, label: t.label }))}
                    />
                    <label className="flex items-center gap-1 text-sm mt-4">
                      <input type="checkbox" checked={f.required} onChange={(e) => updateField(f.id, { required: e.target.checked })} />
                      Required
                    </label>
                    {f.type === 'select' && (
                      <div className="flex-1 min-w-[200px]">
                        <Input
                          label="Options (comma-separated)"
                          value={f.options?.join(', ') ?? ''}
                          onChange={(e) => updateField(f.id, { options: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })}
                          placeholder="Option 1, Option 2"
                        />
                      </div>
                    )}
                    <button type="button" onClick={() => removeField(f.id)} className="text-sm text-red-600 hover:text-red-800 mt-4">Remove</button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      <FormActions onCancel={onCancel} submitLabel={form ? 'Update' : 'Create'} isLoading={saving} />
    </form>
  )
}
