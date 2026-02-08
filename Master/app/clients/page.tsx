'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { DataTable, Modal, Input, Textarea, Select, Alert, FormActions, PageHeader, Button, Badge, Spinner } from '@/ui'
import { DashboardLayout } from '@/components/DashboardLayout'
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
  assignedUser?: {
    id: string
    firstName: string
    lastName: string
  }
  createdAt: string
}

export default function ClientsPage() {
  const router = useRouter()
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)

  useEffect(() => {
    loadClients()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadClients = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/login')
        return
      }

      const response = await fetch('/api/clients', {
        headers: {
          ...(token && { 'Authorization': `Bearer ${token}` }),
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      })

      if (response.ok) {
        const data = await response.json()
        setClients(data)
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

  if (loading) {
    return (
      <DashboardLayout>
        <Spinner fullScreen />
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          title="Clients"
          description="Manage job seekers who are taking our placement services"
          action={{
            label: 'Add Client',
            onClick: handleCreateClient,
          }}
        />

        <DataTable
          data={clients}
          columns={columns}
          searchable
          searchPlaceholder="Search clients by name, email, or industry..."
        />

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
      }

      if (method === 'POST') {
        payload.assignedUserId = user?.id
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

