'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/DashboardLayout'
import { Modal, Input, Textarea, Alert, FormActions, Button, Badge, Spinner, ActivityFilters, Pagination, ToastContainer, useToast, ConfirmDialog, useConfirmDialog, ActivityTimeline } from '@/ui'
import Link from 'next/link'
import type { ActivityFilters as ActivityFiltersType } from '@/ui'
import { UserRole } from '@prisma/client'

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

interface ActivitiesData {
  activities: Activity[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

type ViewMode = 'list' | 'timeline'

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
  const [activitiesData, setActivitiesData] = useState<ActivitiesData | null>(null)
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null)
  const [filters, setFilters] = useState<ActivityFiltersType>({})
  const [sortBy, setSortBy] = useState<'occurredAt' | 'title' | 'type' | 'createdAt'>('occurredAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [userRole, setUserRole] = useState<UserRole | null>(null)

  const { toasts, showToast, removeToast } = useToast()
  const { dialogState, showConfirm, closeDialog } = useConfirmDialog()

  useEffect(() => {
    const storedUser = localStorage.getItem('user')
    if (storedUser) {
      const user = JSON.parse(storedUser)
      setUserRole(user.role)
    }
    loadActivities()
  }, [filters, sortBy, sortOrder, page, pageSize])

  const loadActivities = useCallback(async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/login')
        return
      }

      const queryParams = new URLSearchParams()
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, String(value))
        }
      })
      if (sortBy) queryParams.append('sortBy', sortBy)
      if (sortOrder) queryParams.append('sortOrder', sortOrder)
      queryParams.append('page', String(page))
      queryParams.append('pageSize', String(pageSize))

      const response = await fetch(`/api/activities?${queryParams.toString()}`, {
        headers: {
          ...(token && { 'Authorization': `Bearer ${token}` }),
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      })

      if (response.ok) {
        const data = await response.json()
        setActivitiesData(data)
      } else {
        console.error('Failed to load activities:', response.status, await response.text())
        showToast('Failed to load activities', 'error')
        setActivitiesData({ activities: [], total: 0, page: 1, pageSize: 25, totalPages: 0 })
      }
    } catch (err) {
      console.error('Failed to load activities:', err)
      showToast('Failed to load activities due to a network error.', 'error')
      setActivitiesData({ activities: [], total: 0, page: 1, pageSize: 25, totalPages: 0 })
    } finally {
      setLoading(false)
    }
  }, [filters, sortBy, sortOrder, page, pageSize, router, showToast])

  const handleSort = (key: typeof sortBy) => {
    if (sortBy === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(key)
      setSortOrder('desc')
    }
    setPage(1) // Reset to first page on sort change
  }

  const handleExport = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/login')
        return
      }

      const queryParams = new URLSearchParams()
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, String(value))
        }
      })
      if (sortBy) queryParams.append('sortBy', sortBy)
      if (sortOrder) queryParams.append('sortOrder', sortOrder)

      const response = await fetch(`/api/activities/export?${queryParams.toString()}`, {
        headers: {
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        credentials: 'include',
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `activities-${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        showToast('Activities exported successfully', 'success')
      } else {
        const errorText = await response.text()
        console.error('Failed to export activities:', response.status, errorText)
        showToast(`Failed to export activities: ${errorText}`, 'error')
      }
    } catch (err) {
      console.error('Failed to export activities:', err)
      showToast('Failed to export activities due to a network error.', 'error')
    }
  }

  const handleDelete = async (activityId: string) => {
    showConfirm(
      'Delete Activity',
      'Are you sure you want to delete this activity? This action cannot be undone.',
      async () => {
        try {
          const token = localStorage.getItem('token')
          if (!token) return

          const response = await fetch(`/api/activities/${activityId}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`,
            },
            credentials: 'include',
          })

          if (response.ok) {
            await loadActivities()
            showToast('Activity deleted successfully', 'success')
          } else {
            const data = await response.json()
            showToast(data.error || 'Failed to delete activity', 'error')
          }
        } catch (err) {
          console.error('Failed to delete activity:', err)
          showToast('Failed to delete activity due to a network error.', 'error')
        }
      },
      {
        variant: 'danger',
        confirmText: 'Delete',
        cancelText: 'Cancel',
      }
    )
  }

  const activities = activitiesData?.activities || []
  const total = activitiesData?.total || 0
  const totalPages = activitiesData?.totalPages || 0

  const variantMap: Record<string, 'info' | 'success' | 'warning' | 'neutral'> = {
    CALL: 'info',
    EMAIL: 'success',
    MEETING: 'warning',
    NOTE: 'neutral',
    TASK: 'warning',
    FOLLOW_UP: 'warning',
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
      />
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Activities</h1>
            <p className="text-sm text-gray-600 mt-1">Track all interactions and tasks</p>
          </div>
          <div className="flex items-center gap-3">
            {(userRole === UserRole.ADMIN || userRole === UserRole.MANAGER) && (
              <Button variant="secondary" onClick={handleExport}>
                Export CSV
              </Button>
            )}
            <Button
              onClick={() => setViewMode(viewMode === 'list' ? 'timeline' : 'list')}
              variant="ghost"
            >
              {viewMode === 'list' ? 'Timeline View' : 'List View'}
            </Button>
            <Button
              onClick={() => {
                setSelectedActivity(null)
                setShowCreateModal(true)
              }}
            >
              + Add Activity
            </Button>
          </div>
        </div>

        <ActivityFilters
          filters={filters}
          onChange={setFilters}
          onClear={() => setFilters({})}
        />

        {loading ? (
          <Spinner fullScreen />
        ) : (
          <>
            {viewMode === 'timeline' ? (
              <div className="bg-white shadow-md rounded-xl border border-[#E5E7EB] p-6">
                <ActivityTimeline activities={activities} />
              </div>
            ) : (
              <>
                <div className="bg-white shadow-md rounded-xl border border-[#E5E7EB] overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-[#E5E7EB]">
                      <thead className="bg-[#1F3A5F]">
                        <tr>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider cursor-pointer hover:bg-[#152A4A] transition-colors align-middle"
                            onClick={() => handleSort('type')}
                          >
                            <div className="flex items-center space-x-1">
                              <span>Type</span>
                              {sortBy === 'type' && (
                                <span className="text-[#F4B400]">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                              )}
                            </div>
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider cursor-pointer hover:bg-[#152A4A] transition-colors align-middle"
                            onClick={() => handleSort('title')}
                          >
                            <div className="flex items-center space-x-1">
                              <span>Title</span>
                              {sortBy === 'title' && (
                                <span className="text-[#F4B400]">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                              )}
                            </div>
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider align-middle"
                          >
                            Related To
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider cursor-pointer hover:bg-[#152A4A] transition-colors align-middle"
                            onClick={() => handleSort('occurredAt')}
                          >
                            <div className="flex items-center space-x-1">
                              <span>Date & Time</span>
                              {sortBy === 'occurredAt' && (
                                <span className="text-[#F4B400]">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                              )}
                            </div>
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider align-middle"
                          >
                            Assigned To
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider align-middle"
                          >
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-[#E5E7EB]">
                        {activities.map((activity) => (
                          <tr
                            key={activity.id}
                            className="hover:bg-[rgba(244,180,0,0.05)] transition-colors"
                          >
                            <td className="px-6 py-4 whitespace-nowrap align-middle">
                              <Badge variant={variantMap[activity.type] || 'neutral'}>
                                {TYPE_LABELS[activity.type]}
                              </Badge>
                            </td>
                            <td className="px-6 py-4 align-middle">
                              <div className="flex items-center gap-2">
                                <Link
                                  href={`/activities/${activity.id}`}
                                  className="font-medium text-[#1F3A5F] hover:text-[#0F2A4F]"
                                >
                                  {activity.title}
                                </Link>
                              </div>
                              {activity.description && (
                                <div className="text-sm text-gray-500 mt-1 line-clamp-2">
                                  {activity.description}
                                </div>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap align-middle">
                              <div className="text-sm">
                                {activity.lead && (
                                  <Link
                                    href={`/leads/${activity.lead.id}`}
                                    className="text-[#1F3A5F] hover:text-[#0F2A4F]"
                                  >
                                    Lead: {activity.lead.firstName} {activity.lead.lastName}
                                  </Link>
                                )}
                                {activity.client && (
                                  <Link
                                    href={`/clients/${activity.client.id}`}
                                    className="text-[#1F3A5F] hover:text-[#0F2A4F]"
                                  >
                                    Client: {activity.client.firstName} {activity.client.lastName}
                                  </Link>
                                )}
                                {!activity.lead && !activity.client && (
                                  <span className="text-gray-400">—</span>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap align-middle">
                              <div className="text-sm text-gray-900">
                                {new Date(activity.occurredAt).toLocaleDateString()}
                              </div>
                              <div className="text-xs text-gray-500">
                                {new Date(activity.occurredAt).toLocaleTimeString()}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap align-middle">
                              <span className="text-sm text-gray-700">
                                {activity.assignedUser.firstName} {activity.assignedUser.lastName}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap align-middle">
                              <div className="flex items-center gap-2 justify-start">
                                <Button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setSelectedActivity(activity)
                                    setShowCreateModal(true)
                                  }}
                                  variant="secondary"
                                  size="sm"
                                  className="flex-shrink-0 whitespace-nowrap"
                                >
                                  Edit
                                </Button>
                                <Button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleDelete(activity.id)
                                  }}
                                  variant="danger"
                                  size="sm"
                                  className="flex-shrink-0 whitespace-nowrap"
                                >
                                  Delete
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {activities.length === 0 && !loading && (
                    <div className="text-center py-12 bg-gray-50 rounded-b-lg border-t border-gray-200">
                      <p className="text-gray-600">No activities found matching your criteria.</p>
                    </div>
                  )}
                </div>

                {totalPages > 1 && (
                  <Pagination
                    currentPage={page}
                    totalPages={totalPages}
                    total={total}
                    pageSize={pageSize}
                    onPageChange={setPage}
                    onPageSizeChange={(newSize) => {
                      setPageSize(newSize)
                      setPage(1)
                    }}
                  />
                )}
              </>
            )}
          </>
        )}

        {showCreateModal && (
          <Modal
            isOpen={showCreateModal}
            onClose={() => {
              setShowCreateModal(false)
              setSelectedActivity(null)
            }}
            title={selectedActivity ? 'Edit Activity' : 'Create Activity'}
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
    type: (activity?.type || 'NOTE') as 'CALL' | 'EMAIL' | 'MEETING' | 'NOTE' | 'TASK' | 'FOLLOW_UP',
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
  const { showToast } = useToast()

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

      const payload: any = {
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
          ...(token && { 'Authorization': `Bearer ${token}` }),
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        showToast(`Activity ${activity ? 'updated' : 'created'} successfully`, 'success')
        onSuccess()
      } else {
        const data = await response.json()
        const errorMessage = typeof data.error === 'string' 
          ? data.error 
          : Array.isArray(data.error) 
            ? data.error.map((e: { message?: string } | string) => typeof e === 'string' ? e : e.message || 'Error').join(', ')
            : (data.error as { message?: string })?.message || 'Failed to save activity'
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
            {/* Leads would be loaded here */}
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
            {/* Clients would be loaded here */}
          </select>
        </div>
      </div>

      <FormActions
        onCancel={onCancel}
        submitLabel={activity ? 'Update' : 'Create'}
        isLoading={loading}
      />
    </form>
  )
}
