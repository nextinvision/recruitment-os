'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/DashboardLayout'
import { Modal } from '@/ui/Modal'
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
  }
  lead?: {
    id: string
    companyName: string
    contactName: string
  }
  client?: {
    id: string
    companyName: string
    contactName: string
  }
}

export default function FollowUpsPage() {
  const router = useRouter()
  const [followUps, setFollowUps] = useState<FollowUp[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedFollowUp, setSelectedFollowUp] = useState<FollowUp | null>(null)

  useEffect(() => {
    loadFollowUps()
  }, [])

  const loadFollowUps = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/login')
        return
      }

      const response = await fetch('/api/followups', {
        headers: {
          ...(token && { 'Authorization': `Bearer ${token}` }),
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      })

      if (response.ok) {
        const data = await response.json()
        setFollowUps(data)
      }
    } catch (err) {
      console.error('Failed to load follow-ups:', err)
    } finally {
      setLoading(false)
    }
  }

  const getTodayFollowUps = () => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    return followUps.filter((fu) => {
      if (fu.completed) return false
      const scheduled = new Date(fu.scheduledDate)
      return scheduled >= today && scheduled < tomorrow
    })
  }

  const getOverdueFollowUps = () => {
    const now = new Date()
    return followUps.filter((fu) => {
      if (fu.completed) return false
      const scheduled = new Date(fu.scheduledDate)
      return scheduled < now
    })
  }

  const getUpcomingFollowUps = () => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(0, 0, 0, 0)
    const nextWeek = new Date(tomorrow)
    nextWeek.setDate(nextWeek.getDate() + 7)

    return followUps.filter((fu) => {
      if (fu.completed) return false
      const scheduled = new Date(fu.scheduledDate)
      return scheduled >= tomorrow && scheduled < nextWeek
    })
  }

  const getHoursOverdue = (scheduledDate: string): number => {
    const scheduled = new Date(scheduledDate)
    const now = new Date()
    const diff = now.getTime() - scheduled.getTime()
    return Math.floor(diff / (1000 * 60 * 60))
  }

  const handleMarkComplete = async (followUpId: string) => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const response = await fetch(`/api/followups/${followUpId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ completed: true }),
      })

      if (response.ok) {
        await loadFollowUps()
      }
    } catch (err) {
      console.error('Failed to mark follow-up as complete:', err)
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

  const todayFollowUps = getTodayFollowUps()
  const overdueFollowUps = getOverdueFollowUps()
  const upcomingFollowUps = getUpcomingFollowUps()

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Follow-Ups</h1>
          <button
            onClick={() => {
              setSelectedFollowUp(null)
              setShowCreateModal(true)
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            + Schedule Follow-Up
          </button>
        </div>

        {/* Overdue Follow-Ups */}
        {overdueFollowUps.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-red-900">
                Overdue Follow-Ups ({overdueFollowUps.length})
              </h2>
            </div>
            <div className="space-y-3">
              {overdueFollowUps.map((followUp) => {
                const hoursOverdue = getHoursOverdue(followUp.scheduledDate)
                return (
                  <div
                    key={followUp.id}
                    className="bg-white border border-red-300 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-gray-900">{followUp.title}</h3>
                          <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded">
                            {hoursOverdue}h overdue
                          </span>
                        </div>
                        {followUp.description && (
                          <p className="text-sm text-gray-600 mb-2">{followUp.description}</p>
                        )}
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span>
                            Due: {new Date(followUp.scheduledDate).toLocaleString()}
                          </span>
                          <span>
                            Assigned: {followUp.assignedUser.firstName}{' '}
                            {followUp.assignedUser.lastName}
                          </span>
                          {followUp.lead && (
                            <Link
                              href={`/leads/${followUp.lead.id}`}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              Lead: {followUp.lead.companyName}
                            </Link>
                          )}
                          {followUp.client && (
                            <Link
                              href={`/clients/${followUp.client.id}`}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              Client: {followUp.client.companyName}
                            </Link>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleMarkComplete(followUp.id)}
                        className="ml-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                      >
                        Mark Complete
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Today's Follow-Ups */}
        {todayFollowUps.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-blue-900 mb-4">
              Today&apos;s Follow-Ups ({todayFollowUps.length})
            </h2>
            <div className="space-y-3">
              {todayFollowUps.map((followUp) => (
                <div
                  key={followUp.id}
                  className="bg-white border border-blue-300 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-2">{followUp.title}</h3>
                      {followUp.description && (
                        <p className="text-sm text-gray-600 mb-2">{followUp.description}</p>
                      )}
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>
                          Scheduled: {new Date(followUp.scheduledDate).toLocaleTimeString()}
                        </span>
                        <span>
                          Assigned: {followUp.assignedUser.firstName}{' '}
                          {followUp.assignedUser.lastName}
                        </span>
                        {followUp.lead && (
                          <Link
                            href={`/leads/${followUp.lead.id}`}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            Lead: {followUp.lead.companyName}
                          </Link>
                        )}
                        {followUp.client && (
                          <Link
                            href={`/clients/${followUp.client.id}`}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            Client: {followUp.client.companyName}
                          </Link>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleMarkComplete(followUp.id)}
                      className="ml-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                    >
                      Mark Complete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upcoming Follow-Ups */}
        {upcomingFollowUps.length > 0 && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Upcoming Follow-Ups ({upcomingFollowUps.length})
            </h2>
            <div className="space-y-3">
              {upcomingFollowUps.map((followUp) => (
                <div
                  key={followUp.id}
                  className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-2">{followUp.title}</h3>
                      {followUp.description && (
                        <p className="text-sm text-gray-600 mb-2">{followUp.description}</p>
                      )}
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>
                          Scheduled: {new Date(followUp.scheduledDate).toLocaleString()}
                        </span>
                        <span>
                          Assigned: {followUp.assignedUser.firstName}{' '}
                          {followUp.assignedUser.lastName}
                        </span>
                        {followUp.lead && (
                          <Link
                            href={`/leads/${followUp.lead.id}`}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            Lead: {followUp.lead.companyName}
                          </Link>
                        )}
                        {followUp.client && (
                          <Link
                            href={`/clients/${followUp.client.id}`}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            Client: {followUp.client.companyName}
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {todayFollowUps.length === 0 && overdueFollowUps.length === 0 && upcomingFollowUps.length === 0 && (
          <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-gray-600">No follow-ups scheduled</p>
          </div>
        )}

        {showCreateModal && (
          <Modal
            isOpen={showCreateModal}
            onClose={() => {
              setShowCreateModal(false)
              setSelectedFollowUp(null)
            }}
            title="Schedule Follow-Up"
          >
            <FollowUpForm
              followUp={selectedFollowUp}
              onSuccess={() => {
                setShowCreateModal(false)
                setSelectedFollowUp(null)
                loadFollowUps()
              }}
              onCancel={() => {
                setShowCreateModal(false)
                setSelectedFollowUp(null)
              }}
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
  followUp: FollowUp | null
  onSuccess: () => void
  onCancel: () => void
}) {
  const [formData, setFormData] = useState({
    title: followUp?.title || '',
    description: followUp?.description || '',
    scheduledDate: followUp
      ? new Date(followUp.scheduledDate).toISOString().slice(0, 16)
      : new Date().toISOString().slice(0, 16),
    leadId: followUp?.lead?.id || '',
    clientId: followUp?.client?.id || '',
    notes: followUp?.notes || '',
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

      const url = followUp ? `/api/followups/${followUp.id}` : '/api/followups'
      const method = followUp ? 'PATCH' : 'POST'

      const payload: any = {
        ...formData,
        scheduledDate: new Date(formData.scheduledDate).toISOString(),
        leadId: formData.leadId || undefined,
        clientId: formData.clientId || undefined,
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
        setError(data.error || 'Failed to save follow-up')
      }
    } catch (err) {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-900 mb-2">Title *</label>
        <input
          type="text"
          required
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-900 mb-2">Description</label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={3}
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-900 mb-2">Scheduled Date & Time *</label>
        <input
          type="datetime-local"
          required
          value={formData.scheduledDate}
          onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-900 mb-2">Notes</label>
        <textarea
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          rows={2}
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Saving...' : followUp ? 'Update' : 'Schedule'}
        </button>
      </div>
    </form>
  )
}

