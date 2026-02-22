'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { DashboardLayout } from '@/components/DashboardLayout'
import { Modal, Input, Textarea, Alert, FormActions, Button, Badge, Spinner, ToastContainer, useToast, ConfirmDialog, useConfirmDialog } from '@/ui'
import Link from 'next/link'

interface FollowUp {
  id: string
  title: string
  description?: string
  scheduledDate: string
  completed: boolean
  completedAt?: string
  notes?: string
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

export default function FollowUpDetailPage() {
  const router = useRouter()
  const params = useParams()
  const followUpId = params.id as string

  const [followUp, setFollowUp] = useState<FollowUp | null>(null)
  const [loading, setLoading] = useState(true)
  const [showEditModal, setShowEditModal] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const { showConfirm, dialogState, closeDialog, handleConfirm } = useConfirmDialog()
  const { toasts, showToast, removeToast } = useToast()

  useEffect(() => {
    if (followUpId) {
      loadFollowUp()
    }
  }, [followUpId])

  const loadFollowUp = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/login')
        return
      }

      const response = await fetch(`/api/followups/${followUpId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      })

      if (response.ok) {
        const data = await response.json()
        setFollowUp(data)
      } else if (response.status === 404) {
        router.push('/followups')
      }
    } catch (err) {
      console.error('Failed to load follow-up:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleMarkComplete = async () => {
    if (!followUp) return

    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const response = await fetch(`/api/followups/${followUp.id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ completed: true }),
      })

      if (response.ok) {
        await loadFollowUp()
        showToast('Follow-up marked as complete', 'success')
      } else {
        const data = await response.json()
        showToast(data.error || 'Failed to mark follow-up as complete', 'error')
      }
    } catch (err) {
      console.error('Failed to mark follow-up as complete:', err)
      showToast('Failed to mark follow-up as complete', 'error')
    }
  }

  const handleDelete = async () => {
    if (!followUp) return
    
    showConfirm(
      'Delete Follow-Up',
      'Are you sure you want to delete this follow-up? This action cannot be undone.',
      async () => {
        try {
          setDeleting(true)
          const token = localStorage.getItem('token')
          if (!token) return

          const response = await fetch(`/api/followups/${followUp.id}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            credentials: 'include',
          })

          if (response.ok) {
            showToast('Follow-up deleted successfully', 'success')
            router.push('/followups')
          } else {
            const data = await response.json()
            showToast(data.error || 'Failed to delete follow-up', 'error')
          }
        } catch (err) {
          console.error('Failed to delete follow-up:', err)
          showToast('Failed to delete follow-up', 'error')
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

  const getHoursOverdue = (scheduledDate: string): number => {
    const scheduled = new Date(scheduledDate)
    const now = new Date()
    const diff = now.getTime() - scheduled.getTime()
    return Math.floor(diff / (1000 * 60 * 60))
  }

  const isOverdue = (): boolean => {
    if (!followUp || followUp.completed) return false
    return new Date(followUp.scheduledDate) < new Date()
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Spinner />
        </div>
      </DashboardLayout>
    )
  }

  if (!followUp) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-gray-600">Follow-up not found</p>
          <Button onClick={() => router.push('/followups')} className="mt-4">
            Back to Follow-ups
          </Button>
        </div>
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
        isLoading={deleting}
      />
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              onClick={() => router.push('/followups')}
              variant="secondary"
            >
              ← Back
            </Button>
            <h1 className="text-2xl font-bold text-gray-900">{followUp.title}</h1>
          </div>
          <div className="flex items-center gap-3">
            {!followUp.completed && (
              <Button
                onClick={handleMarkComplete}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                Mark Complete
              </Button>
            )}
            <Button
              onClick={() => setShowEditModal(true)}
              variant="secondary"
            >
              Edit
            </Button>
            <Button
              onClick={handleDelete}
              variant="danger"
              disabled={deleting}
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </div>

        <div className="bg-white shadow-md rounded-xl border border-[#E5E7EB] p-6">
          <div className="space-y-6">
            {/* Status Badges */}
            <div className="flex items-center gap-3">
              {followUp.completed ? (
                <Badge variant="success">Completed</Badge>
              ) : isOverdue() ? (
                <Badge variant="error">
                  Overdue ({getHoursOverdue(followUp.scheduledDate)}h)
                </Badge>
              ) : (
                <Badge variant="info">Pending</Badge>
              )}
            </div>

            {/* Description */}
            {followUp.description && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Description</h3>
                <p className="text-gray-900 whitespace-pre-wrap">{followUp.description}</p>
              </div>
            )}

            {/* Scheduled Date */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Scheduled Date & Time</h3>
              <p className="text-gray-900">
                {new Date(followUp.scheduledDate).toLocaleString()}
              </p>
            </div>

            {/* Assigned To */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Assigned To</h3>
              <p className="text-gray-900">
                {followUp.assignedUser.firstName} {followUp.assignedUser.lastName}
              </p>
              <p className="text-sm text-gray-500">{followUp.assignedUser.email}</p>
            </div>

            {/* Related Entity */}
            {(followUp.lead || followUp.client) && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Related To</h3>
                {followUp.lead && (
                  <Link
                    href={`/leads/${followUp.lead.id}`}
                    className="text-[#1F3A5F] hover:text-[#0F2A4F] font-medium"
                  >
                    Lead: {followUp.lead.firstName} {followUp.lead.lastName}{followUp.lead.currentCompany ? ` (${followUp.lead.currentCompany})` : ''}
                  </Link>
                )}
                {followUp.client && (
                  <Link
                    href={`/clients/${followUp.client.id}`}
                    className="text-[#1F3A5F] hover:text-[#0F2A4F] font-medium"
                  >
                    Client: {followUp.client.firstName} {followUp.client.lastName}
                  </Link>
                )}
              </div>
            )}

            {/* Notes */}
            {followUp.notes && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Notes</h3>
                <p className="text-gray-900 whitespace-pre-wrap">{followUp.notes}</p>
              </div>
            )}

            {/* Completed At */}
            {followUp.completed && followUp.completedAt && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Completed At</h3>
                <p className="text-gray-900">
                  {new Date(followUp.completedAt).toLocaleString()}
                </p>
              </div>
            )}

            {/* Metadata */}
            <div className="pt-4 border-t border-gray-200">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Created:</span>{' '}
                  <span className="text-gray-900">
                    {new Date(followUp.createdAt).toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Last Updated:</span>{' '}
                  <span className="text-gray-900">
                    {new Date(followUp.updatedAt).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {showEditModal && (
          <Modal
            isOpen={showEditModal}
            onClose={() => setShowEditModal(false)}
            title="Edit Follow-Up"
          >
            <FollowUpForm
              followUp={followUp}
              onSuccess={() => {
                setShowEditModal(false)
                loadFollowUp()
              }}
              onCancel={() => setShowEditModal(false)}
            />
          </Modal>
        )}
      </div>
    </DashboardLayout>
  )
}

function FollowUpForm({
  followUp,
  onSuccess,
  onCancel,
}: {
  followUp: FollowUp
  onSuccess: () => void
  onCancel: () => void
}) {
  const [formData, setFormData] = useState({
    title: followUp.title,
    description: followUp.description || '',
    scheduledDate: new Date(followUp.scheduledDate).toISOString().slice(0, 16),
    leadId: followUp.lead?.id || '',
    clientId: followUp.client?.id || '',
    notes: followUp.notes || '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const payload: any = {
        ...formData,
        scheduledDate: new Date(formData.scheduledDate).toISOString(),
        leadId: formData.leadId || undefined,
        clientId: formData.clientId || undefined,
      }

      const response = await fetch(`/api/followups/${followUp.id}`, {
        method: 'PATCH',
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
        setError(data.error || 'Failed to update follow-up')
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
        rows={3}
      />

      <Input
        label="Scheduled Date & Time"
        type="datetime-local"
        required
        value={formData.scheduledDate}
        onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
      />

      <Textarea
        label="Notes"
        value={formData.notes}
        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
        rows={2}
      />

      <FormActions
        onCancel={onCancel}
        submitLabel="Update"
        isLoading={loading}
      />
    </form>
  )
}

