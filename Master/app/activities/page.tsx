'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/DashboardLayout'
import { DataTable, Modal, Input, Textarea, Select, Alert, FormActions, PageHeader, Button, Badge, Spinner } from '@/ui'
import Link from 'next/link'

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
  lead?: {
    id: string
    companyName: string
  }
  client?: {
    id: string
    firstName: string
    lastName: string
  }
}

const ACTIVITY_TYPES = ['CALL', 'EMAIL', 'MEETING', 'NOTE', 'TASK', 'FOLLOW_UP']
const TYPE_LABELS: Record<string, string> = {
  CALL: 'Call',
  EMAIL: 'Email',
  MEETING: 'Meeting',
  NOTE: 'Note',
  TASK: 'Task',
  FOLLOW_UP: 'Follow-up',
}

export default function ActivitiesPage() {
  const router = useRouter()
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null)
  const [filters, setFilters] = useState({
    type: '',
    leadId: '',
    clientId: '',
    startDate: '',
    endDate: '',
  })

  useEffect(() => {
    loadActivities()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters])

  const loadActivities = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/login')
        return
      }

      const params = new URLSearchParams()
      if (filters.type) params.append('type', filters.type)
      if (filters.leadId) params.append('leadId', filters.leadId)
      if (filters.clientId) params.append('clientId', filters.clientId)
      if (filters.startDate) params.append('startDate', new Date(filters.startDate).toISOString())
      if (filters.endDate) params.append('endDate', new Date(filters.endDate).toISOString())

      const response = await fetch(`/api/activities?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      })

      if (response.ok) {
        const data = await response.json()
        setActivities(data)
      }
    } catch (err) {
      console.error('Failed to load activities:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateActivity = () => {
    setSelectedActivity(null)
    setShowCreateModal(true)
  }

  const handleEditActivity = (activity: Activity) => {
    setSelectedActivity(activity)
    setShowCreateModal(true)
  }

  const columns = [
    {
      key: 'type',
      header: 'Type',
      render: (activity: Activity) => {
        const variantMap: Record<string, 'info' | 'success' | 'warning' | 'neutral'> = {
          CALL: 'info',
          EMAIL: 'success',
          MEETING: 'warning',
          NOTE: 'neutral',
          TASK: 'warning',
          FOLLOW_UP: 'warning',
        }
        return (
          <Badge variant={variantMap[activity.type] || 'neutral'}>
            {TYPE_LABELS[activity.type]}
          </Badge>
        )
      },
    },
    {
      key: 'title',
      header: 'Title',
      render: (activity: Activity) => (
        <div>
          <div className="font-medium text-careerist-text-primary">{activity.title}</div>
          {activity.description && (
            <div className="text-sm text-careerist-text-secondary mt-1 line-clamp-2">
              {activity.description}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'entity',
      header: 'Related To',
      render: (activity: Activity) => (
        <div className="text-sm">
          {activity.lead && (
            <Link 
              href={`/leads/${activity.lead.id}`} 
              className="text-careerist-primary-yellow hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              Lead: {activity.lead.companyName}
            </Link>
          )}
          {activity.client && (
            <Link 
              href={`/clients/${activity.client.id}`} 
              className="text-careerist-primary-yellow hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              Client: {activity.client.firstName} {activity.client.lastName}
            </Link>
          )}
          {!activity.lead && !activity.client && (
            <span className="text-careerist-text-secondary">-</span>
          )}
        </div>
      ),
    },
    {
      key: 'occurredAt',
      header: 'Date & Time',
      render: (activity: Activity) => (
        <span className="text-sm text-careerist-text-primary">
          {new Date(activity.occurredAt).toLocaleString()}
        </span>
      ),
    },
    {
      key: 'assignedUser',
      header: 'Assigned To',
      render: (activity: Activity) => (
        <span className="text-sm text-careerist-text-primary">
          {activity.assignedUser.firstName} {activity.assignedUser.lastName}
        </span>
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
          title="Activities"
          description="Track all interactions and tasks"
          action={{
            label: 'Add Activity',
            onClick: handleCreateActivity,
          }}
        />

        {/* Filters */}
        <div className="bg-careerist-card rounded-lg shadow border border-careerist-border p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-careerist-text-primary mb-2">Type</label>
              <select
                value={filters.type}
                onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                className="block w-full px-3 py-2 border border-careerist-border rounded-md focus:outline-none focus:ring-2 focus:ring-careerist-primary-yellow"
              >
                <option value="">All Types</option>
                {ACTIVITY_TYPES.map((type) => (
                  <option key={type} value={type}>{TYPE_LABELS[type]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-careerist-text-primary mb-2">Start Date</label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                className="block w-full px-3 py-2 border border-careerist-border rounded-md focus:outline-none focus:ring-2 focus:ring-careerist-primary-yellow"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-careerist-text-primary mb-2">End Date</label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                className="block w-full px-3 py-2 border border-careerist-border rounded-md focus:outline-none focus:ring-2 focus:ring-careerist-primary-yellow"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={() => setFilters({ type: '', leadId: '', clientId: '', startDate: '', endDate: '' })}
                className="w-full px-4 py-2 border border-careerist-border rounded-md text-careerist-text-primary hover:bg-careerist-yellow-light transition-colors"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        <DataTable
          data={activities}
          columns={columns}
          searchable
          onRowClick={handleEditActivity}
        />

        {showCreateModal && (
          <Modal
            isOpen={showCreateModal}
            onClose={() => {
              setShowCreateModal(false)
              setSelectedActivity(null)
            }}
            title={selectedActivity ? 'Edit Activity' : 'Create Activity'}
            size="lg"
          >
            <ActivityForm
              activity={selectedActivity}
              onSuccess={() => {
                setShowCreateModal(false)
                setSelectedActivity(null)
                loadActivities()
              }}
              onCancel={() => {
                setShowCreateModal(false)
                setSelectedActivity(null)
              }}
            />
          </Modal>
        )}
      </div>
    </DashboardLayout>
  )
}

function ActivityForm({
  activity,
  onSuccess,
  onCancel,
}: {
  activity: Activity | null
  onSuccess: () => void
  onCancel: () => void
}) {
  const [formData, setFormData] = useState({
    type: activity?.type || 'NOTE',
    title: activity?.title || '',
    description: activity?.description || '',
    occurredAt: activity
      ? new Date(activity.occurredAt).toISOString().slice(0, 16)
      : new Date().toISOString().slice(0, 16),
    leadId: activity?.lead?.id || '',
    clientId: activity?.client?.id || '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [leads, setLeads] = useState<Array<{ id: string; companyName: string }>>([])
  const [clients, setClients] = useState<Array<{ id: string; firstName: string; lastName: string }>>([])

  useEffect(() => {
    loadOptions()
  }, [])

  const loadOptions = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const [leadsRes, clientsRes] = await Promise.all([
        fetch('/api/leads', {
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
          credentials: 'include',
        }),
        fetch('/api/clients', {
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
          credentials: 'include',
        }),
      ])

      if (leadsRes.ok) {
        const leadsData = await leadsRes.json()
        setLeads(leadsData)
      }
      if (clientsRes.ok) {
        const clientsData = await clientsRes.json()
        setClients(clientsData)
      }
      } catch (error) {
        console.error('Failed to load options:', error)
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

      const url = activity ? `/api/activities/${activity.id}` : '/api/activities'
      const method = activity ? 'PATCH' : 'POST'

      const payload: {
        type: string
        title: string
        description?: string
        occurredAt: string
        leadId?: string
        clientId?: string
        assignedUserId?: string
      } = {
        ...formData,
        occurredAt: new Date(formData.occurredAt).toISOString(),
        leadId: formData.leadId || undefined,
        clientId: formData.clientId || undefined,
      }

      if (method === 'POST') {
        payload.assignedUserId = user?.id
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        onSuccess()
      } else {
        const data = await response.json()
        const errorMessage = typeof data.error === 'string' 
          ? data.error 
          : Array.isArray(data.error) 
            ? data.error.map((e: { message?: string } | string) => typeof e === 'string' ? e : e.message || 'Error').join(', ')
            : (data.error as { message?: string })?.message || 'Failed to save activity'
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

      <Select
        label="Type"
        required
        value={formData.type}
        onChange={(e) => {
          const type = e.target.value as 'CALL' | 'EMAIL' | 'MEETING' | 'NOTE' | 'TASK' | 'FOLLOW_UP'
          setFormData({ ...formData, type })
        }}
        options={ACTIVITY_TYPES.map((type) => ({
          value: type,
          label: TYPE_LABELS[type],
        }))}
      />

      <Input
        label="Title"
        type="text"
        required
        value={formData.title}
        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
      />

      <Textarea
        label="Description"
        value={formData.description}
        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        rows={4}
      />

      <Input
        label="Date & Time"
        type="datetime-local"
        required
        value={formData.occurredAt}
        onChange={(e) => setFormData({ ...formData, occurredAt: e.target.value })}
      />

      <div className="grid grid-cols-2 gap-4">
        <Select
          label="Related Lead"
          value={formData.leadId}
          onChange={(e) => {
            const leadId = e.target.value
            setFormData({ ...formData, leadId, clientId: leadId ? '' : formData.clientId })
          }}
          options={[
            { value: '', label: 'None' },
            ...leads.map((lead) => ({
              value: lead.id,
              label: lead.companyName,
            })),
          ]}
        />
        <Select
          label="Related Client"
          value={formData.clientId}
          onChange={(e) => {
            const clientId = e.target.value
            setFormData({ ...formData, clientId, leadId: clientId ? '' : formData.leadId })
          }}
          options={[
            { value: '', label: 'None' },
            ...clients.map((client) => ({
              value: client.id,
              label: `${client.firstName} ${client.lastName}`,
            })),
          ]}
        />
      </div>

      <FormActions
        onCancel={onCancel}
        submitLabel={activity ? 'Update' : 'Create'}
        isLoading={loading}
      />
    </form>
  )
}

