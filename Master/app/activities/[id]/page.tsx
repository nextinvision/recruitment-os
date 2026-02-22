'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { DashboardLayout } from '@/components/DashboardLayout'
import { Modal, Input, Textarea, Alert, FormActions, Button, Badge, Spinner, ToastContainer, useToast, ConfirmDialog, useConfirmDialog } from '@/ui'
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
    email: string
  }
  lead?: {
    id: string
    firstName: string
    lastName: string
    currentCompany?: string
  }
  client?: {
    id: string
    firstName: string
    lastName: string
  }
  createdAt: string
  updatedAt: string
}

const TYPE_LABELS: Record<string, string> = {
  CALL: 'Call',
  EMAIL: 'Email',
  MEETING: 'Meeting',
  NOTE: 'Note',
  TASK: 'Task',
  FOLLOW_UP: 'Follow-up',
}

const variantMap: Record<string, 'info' | 'success' | 'warning' | 'neutral'> = {
  CALL: 'info',
  EMAIL: 'success',
  MEETING: 'warning',
  NOTE: 'neutral',
  TASK: 'warning',
  FOLLOW_UP: 'warning',
}

export default function ActivityDetailPage() {
  const router = useRouter()
  const params = useParams()
  const activityId = params.id as string

  const [activity, setActivity] = useState<Activity | null>(null)
  const [loading, setLoading] = useState(true)
  const [showEditModal, setShowEditModal] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const { toasts, showToast, removeToast } = useToast()
  const { dialogState, showConfirm, closeDialog } = useConfirmDialog()

  useEffect(() => {
    if (activityId) {
      loadActivity()
    }
  }, [activityId])

  const loadActivity = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/login')
        return
      }

      const response = await fetch(`/api/activities/${activityId}`, {
        headers: {
          ...(token && { 'Authorization': `Bearer ${token}` }),
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      })

      if (response.ok) {
        const data = await response.json()
        setActivity(data)
      } else if (response.status === 404) {
        router.push('/activities')
      }
    } catch (err) {
      console.error('Failed to load activity:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!activity) return

    showConfirm(
      'Delete Activity',
      'Are you sure you want to delete this activity? This action cannot be undone.',
      async () => {
        try {
          setDeleting(true)
          const token = localStorage.getItem('token')
          if (!token) return

          const response = await fetch(`/api/activities/${activity.id}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            credentials: 'include',
          })

          if (response.ok) {
            showToast('Activity deleted successfully', 'success')
            router.push('/activities')
          } else {
            const data = await response.json()
            showToast(data.error || 'Failed to delete activity', 'error')
          }
        } catch (err) {
          console.error('Failed to delete activity:', err)
          showToast('Failed to delete activity', 'error')
        } finally {
          setDeleting(false)
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
        <ToastContainer toasts={toasts} onRemove={removeToast} />
      </DashboardLayout>
    )
  }

  if (!activity) {
    return (
      <DashboardLayout>
        <Alert variant="info">Activity not found.</Alert>
        <Button onClick={() => router.push('/activities')} variant="ghost">
          ← Back to Activities
        </Button>
        <ToastContainer toasts={toasts} onRemove={removeToast} />
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <ConfirmDialog
        isOpen={dialogState.isOpen}
        onClose={closeDialog}
        onConfirm={dialogState.onConfirm}
        title={dialogState.title}
        message={dialogState.message}
        variant={dialogState.variant || 'danger'}
        confirmText={dialogState.confirmText}
        cancelText={dialogState.cancelText}
        isLoading={deleting}
      />
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Button
            onClick={() => router.push('/activities')}
            variant="ghost"
          >
            ← Back
          </Button>
          <div className="flex items-center gap-3">
            <Button onClick={() => setShowEditModal(true)} variant="secondary">
              Edit
            </Button>
            <Button onClick={handleDelete} variant="danger">
              Delete
            </Button>
          </div>
        </div>

        <div>
          <h1 className="text-2xl font-bold text-gray-900">{activity.title}</h1>
          <p className="text-sm text-gray-600 mt-1">
            {activity.description || 'No description provided.'}
          </p>
        </div>

        <div className="bg-white shadow-md rounded-xl border border-[#E5E7EB] p-6 space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
              <div>
                <p className="font-medium">Type:</p>
                <Badge variant={variantMap[activity.type] || 'neutral'} className="mt-1">
                  {TYPE_LABELS[activity.type]}
                </Badge>
              </div>
              <div>
                <p className="font-medium">Occurred At:</p>
                <p>{new Date(activity.occurredAt).toLocaleString()}</p>
              </div>
              <div>
                <p className="font-medium">Assigned To:</p>
                <p>{activity.assignedUser.firstName} {activity.assignedUser.lastName} ({activity.assignedUser.email})</p>
              </div>
              {activity.lead && (
                <div>
                  <p className="font-medium">Related Lead:</p>
                  <Link href={`/leads/${activity.lead.id}`} className="text-blue-600 hover:underline">
                    {activity.lead.firstName} {activity.lead.lastName}{activity.lead.currentCompany ? ` (${activity.lead.currentCompany})` : ''}
                  </Link>
                </div>
              )}
              {activity.client && (
                <div>
                  <p className="font-medium">Related Client:</p>
                  <Link href={`/clients/${activity.client.id}`} className="text-blue-600 hover:underline">
                    {activity.client.firstName} {activity.client.lastName}
                  </Link>
                </div>
              )}
              {!activity.lead && !activity.client && (
                <div>
                  <p className="font-medium">Related To:</p>
                  <span className="text-gray-400">—</span>
                </div>
              )}
              <div>
                <p className="font-medium">Created At:</p>
                <p>{new Date(activity.createdAt).toLocaleString()}</p>
              </div>
              <div>
                <p className="font-medium">Last Updated:</p>
                <p>{new Date(activity.updatedAt).toLocaleString()}</p>
              </div>
            </div>
          </div>
          {activity.description && (
            <div>
              <p className="font-medium mb-2">Description:</p>
              <p className="whitespace-pre-wrap text-gray-700">{activity.description}</p>
            </div>
          )}
        </div>

        {showEditModal && (
          <Modal
            isOpen={showEditModal}
            onClose={() => setShowEditModal(false)}
            title="Edit Activity"
          >
            <ActivityEditForm
              activity={activity}
              onSuccess={() => {
                setShowEditModal(false)
                loadActivity()
              }}
              onCancel={() => setShowEditModal(false)}
            />
          </Modal>
        )}
      </div>
    </DashboardLayout>
  )
}

function ActivityEditForm({
  activity,
  onSuccess,
  onCancel,
}: {
  activity: Activity
  onSuccess: () => void
  onCancel: () => void
}) {
  const [formData, setFormData] = useState({
    type: activity.type,
    title: activity.title,
    description: activity.description || '',
    occurredAt: new Date(activity.occurredAt).toISOString().slice(0, 16),
    leadId: activity.lead?.id || '',
    clientId: activity.client?.id || '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { showToast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const payload: any = {
        ...formData,
        occurredAt: new Date(formData.occurredAt).toISOString(),
        leadId: formData.leadId || undefined,
        clientId: formData.clientId || undefined,
      }

      const response = await fetch(`/api/activities/${activity.id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        showToast('Activity updated successfully', 'success')
        onSuccess()
      } else {
        const data = await response.json()
        const errorMessage = typeof data.error === 'string' 
          ? data.error 
          : Array.isArray(data.error) 
            ? data.error.map((e: { message?: string } | string) => typeof e === 'string' ? e : e.message || 'Error').join(', ')
            : (data.error as { message?: string })?.message || 'Failed to update activity'
        setError(errorMessage)
        showToast(errorMessage, 'error')
      }
    } catch (err) {
      setError('Network error. Please try again.')
      showToast('Network error. Please try again.', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <Alert variant="error">{error}</Alert>}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
        <select
          required
          value={formData.type}
          onChange={(e) => {
            const type = e.target.value as 'CALL' | 'EMAIL' | 'MEETING' | 'NOTE' | 'TASK' | 'FOLLOW_UP'
            setFormData({ ...formData, type })
          }}
          className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#F4B400]"
        >
          {Object.entries(TYPE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>

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
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Related Lead</label>
          <select
            value={formData.leadId}
            onChange={(e) => {
              const leadId = e.target.value
              setFormData({ ...formData, leadId, clientId: leadId ? '' : formData.clientId })
            }}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#F4B400]"
          >
            <option value="">None</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Related Client</label>
          <select
            value={formData.clientId}
            onChange={(e) => {
              const clientId = e.target.value
              setFormData({ ...formData, clientId, leadId: clientId ? '' : formData.leadId })
            }}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#F4B400]"
          >
            <option value="">None</option>
          </select>
        </div>
      </div>

      <FormActions
        onCancel={onCancel}
        submitLabel="Update"
        isLoading={loading}
      />
    </form>
  )
}

