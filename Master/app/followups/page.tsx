'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/DashboardLayout'
import { Modal, Input, Textarea, Alert, FormActions, Button, Badge, Spinner, FollowUpFilters, FollowUpCalendar, Pagination, ToastContainer, useToast, ConfirmDialog, useConfirmDialog } from '@/ui'
import Link from 'next/link'
import type { FollowUpFilters as FollowUpFiltersType } from '@/ui'

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
}

type ViewMode = 'list' | 'calendar'

export default function FollowUpsPage() {
  const router = useRouter()
  const [followUps, setFollowUps] = useState<FollowUp[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedFollowUp, setSelectedFollowUp] = useState<FollowUp | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  
  // Filters
  const [filters, setFilters] = useState<FollowUpFiltersType>({})
  
  // Pagination
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  
  // Sorting
  const [sortBy, setSortBy] = useState<'scheduledDate' | 'title' | 'createdAt' | 'completed'>('scheduledDate')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  
  // Additional data
  const [recruiters, setRecruiters] = useState<Array<{ id: string; firstName: string; lastName: string }>>([])
  const [leads, setLeads] = useState<Array<{ id: string; firstName: string; lastName: string; currentCompany?: string }>>([])
  const [clients, setClients] = useState<Array<{ id: string; firstName: string; lastName: string }>>([])
  
  // Toast and Confirm Dialog
  const { showConfirm, dialogState, closeDialog, handleConfirm } = useConfirmDialog()
  const { toasts, showToast, removeToast } = useToast()

  useEffect(() => {
    loadFollowUps()
    loadAdditionalData()
  }, [page, pageSize, sortBy, sortOrder, filters])

  const loadAdditionalData = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      // Load recruiters, leads, clients for filters
      // These would be separate API calls in a real app
      // For now, we'll skip them or load from existing follow-ups
    } catch (err) {
      console.error('Failed to load additional data:', err)
    }
  }

  const loadFollowUps = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/login')
        return
      }

      const params = new URLSearchParams()
      params.append('page', page.toString())
      params.append('pageSize', pageSize.toString())
      params.append('sortBy', sortBy)
      params.append('sortOrder', sortOrder)
      
      if (filters.search) params.append('search', filters.search)
      if (filters.leadId) params.append('leadId', filters.leadId)
      if (filters.clientId) params.append('clientId', filters.clientId)
      if (filters.assignedUserId) params.append('assignedUserId', filters.assignedUserId)
      if (filters.completed !== undefined) params.append('completed', filters.completed.toString())
      if (filters.overdue) params.append('overdue', 'true')
      if (filters.entityType) params.append('entityType', filters.entityType)
      if (filters.startDate) params.append('startDate', filters.startDate)
      if (filters.endDate) params.append('endDate', filters.endDate)

      const response = await fetch(`/api/followups?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      })

      if (response.ok) {
        const data = await response.json()
        setFollowUps(data.followUps || [])
        setTotal(data.total || 0)
        setTotalPages(data.totalPages || 0)
      }
    } catch (err) {
      console.error('Failed to load follow-ups:', err)
    } finally {
      setLoading(false)
    }
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

  const handleDelete = async (followUpId: string) => {
    showConfirm(
      'Delete Follow-Up',
      'Are you sure you want to delete this follow-up? This action cannot be undone.',
      async () => {
        try {
          const token = localStorage.getItem('token')
          if (!token) return

          const response = await fetch(`/api/followups/${followUpId}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            credentials: 'include',
          })

          if (response.ok) {
            await loadFollowUps()
            showToast('Follow-up deleted successfully', 'success')
          } else {
            const data = await response.json()
            showToast(data.error || 'Failed to delete follow-up', 'error')
          }
        } catch (err) {
          console.error('Failed to delete follow-up:', err)
          showToast('Failed to delete follow-up', 'error')
        }
      },
      {
        variant: 'danger',
        confirmText: 'Delete',
        cancelText: 'Cancel',
      }
    )
  }

  const handleExport = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const params = new URLSearchParams()
      if (filters.search) params.append('search', filters.search)
      if (filters.leadId) params.append('leadId', filters.leadId)
      if (filters.clientId) params.append('clientId', filters.clientId)
      if (filters.assignedUserId) params.append('assignedUserId', filters.assignedUserId)
      if (filters.completed !== undefined) params.append('completed', filters.completed.toString())
      if (filters.overdue) params.append('overdue', 'true')
      if (filters.entityType) params.append('entityType', filters.entityType)
      if (filters.startDate) params.append('startDate', filters.startDate)
      if (filters.endDate) params.append('endDate', filters.endDate)

      const response = await fetch(`/api/followups/export?${params.toString()}`, {
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
        a.download = `followups-${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        showToast('Follow-ups exported successfully', 'success')
      } else {
        showToast('Failed to export follow-ups', 'error')
      }
    } catch (err) {
      console.error('Failed to export follow-ups:', err)
      showToast('Failed to export follow-ups', 'error')
    }
  }

  const handleSort = (column: 'scheduledDate' | 'title' | 'createdAt' | 'completed') => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(column)
      setSortOrder('asc')
    }
  }

  const getHoursOverdue = (scheduledDate: string): number => {
    const scheduled = new Date(scheduledDate)
    const now = new Date()
    const diff = now.getTime() - scheduled.getTime()
    return Math.floor(diff / (1000 * 60 * 60))
  }

  const isOverdue = (followUp: FollowUp): boolean => {
    if (followUp.completed) return false
    return new Date(followUp.scheduledDate) < new Date()
  }

  if (loading && followUps.length === 0) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Spinner />
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
      />
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Follow-Ups</h1>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 border border-gray-300 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('list')}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  viewMode === 'list'
                    ? 'bg-[#1F3A5F] text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                List
              </button>
              <button
                onClick={() => setViewMode('calendar')}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  viewMode === 'calendar'
                    ? 'bg-[#1F3A5F] text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                Calendar
              </button>
            </div>
            <Button
              onClick={handleExport}
              variant="secondary"
              className="text-sm"
            >
              Export CSV
            </Button>
            <Button
              onClick={() => {
                setSelectedFollowUp(null)
                setShowCreateModal(true)
              }}
              className="bg-[#1F3A5F] hover:bg-[#0F2A4F] text-white"
            >
              + Schedule Follow-Up
            </Button>
          </div>
        </div>

        <FollowUpFilters
          filters={filters}
          onChange={setFilters}
          recruiters={recruiters}
          leads={leads}
          clients={clients}
        />

        {viewMode === 'calendar' ? (
          <FollowUpCalendar
            followUps={followUps}
            onFollowUpClick={(fu) => {
              setSelectedFollowUp(fu as FollowUp)
              setShowCreateModal(true)
            }}
          />
        ) : (
          <>
            <div className="bg-white shadow-md rounded-xl border border-[#E5E7EB] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-[#E5E7EB]">
                  <thead className="bg-[#1F3A5F]">
                    <tr>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider cursor-pointer hover:bg-[#152A4A] transition-colors"
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
                        className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider cursor-pointer hover:bg-[#152A4A] transition-colors"
                        onClick={() => handleSort('scheduledDate')}
                      >
                        <div className="flex items-center space-x-1">
                          <span>Scheduled Date</span>
                          {sortBy === 'scheduledDate' && (
                            <span className="text-[#F4B400]">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                          )}
                        </div>
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider"
                      >
                        Assigned To
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider"
                      >
                        Related To
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider align-middle"
                      >
                        Status
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
                    {followUps.map((followUp) => (
                      <tr
                        key={followUp.id}
                        className="hover:bg-[rgba(244,180,0,0.05)] transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap align-middle">
                          <div className="flex items-center gap-2">
                            <Link
                              href={`/followups/${followUp.id}`}
                              className="font-medium text-[#1F3A5F] hover:text-[#0F2A4F]"
                            >
                              {followUp.title}
                            </Link>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap align-middle">
                          <div>
                            <div className="text-sm text-gray-900">
                              {new Date(followUp.scheduledDate).toLocaleDateString()}
                            </div>
                            <div className="text-xs text-gray-500">
                              {new Date(followUp.scheduledDate).toLocaleTimeString()}
                            </div>
                            {isOverdue(followUp) && (
                              <div className="text-xs text-red-600 font-medium">
                                {getHoursOverdue(followUp.scheduledDate)}h overdue
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap align-middle">
                          <span className="text-sm text-gray-700">
                            {followUp.assignedUser.firstName} {followUp.assignedUser.lastName}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap align-middle">
                          <div className="text-sm">
                            {followUp.lead && (
                              <Link
                                href={`/leads/${followUp.lead.id}`}
                                className="text-[#1F3A5F] hover:text-[#0F2A4F]"
                              >
                                Lead: {followUp.lead.firstName} {followUp.lead.lastName}
                              </Link>
                            )}
                            {followUp.client && (
                              <Link
                                href={`/clients/${followUp.client.id}`}
                                className="text-[#1F3A5F] hover:text-[#0F2A4F]"
                              >
                                Client: {followUp.client.firstName} {followUp.client.lastName}
                              </Link>
                            )}
                            {!followUp.lead && !followUp.client && (
                              <span className="text-gray-400">—</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap align-middle">
                          <div className="flex items-center justify-start gap-2">
                            {isOverdue(followUp) && (
                              <Badge variant="error" className="text-xs">
                                Overdue
                              </Badge>
                            )}
                            {followUp.completed && (
                              <Badge variant="success" className="text-xs">
                                Completed
                              </Badge>
                            )}
                            {!isOverdue(followUp) && !followUp.completed && (
                              <Badge variant="info" className="text-xs">
                                Pending
                              </Badge>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap align-middle">
                          <div className="flex items-center justify-start gap-2">
                            {!followUp.completed && (
                              <Button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleMarkComplete(followUp.id)
                                }}
                                variant="success"
                                size="sm"
                                className="flex-shrink-0 whitespace-nowrap"
                              >
                                Complete
                              </Button>
                            )}
                            <Button
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedFollowUp(followUp)
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
                                handleDelete(followUp.id)
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
              {followUps.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-[#64748B]">No follow-ups found</p>
                </div>
              )}
            </div>

            {totalPages > 1 && (
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                pageSize={pageSize}
                total={total}
                onPageChange={setPage}
                onPageSizeChange={(newSize) => {
                  setPageSize(newSize)
                  setPage(1)
                }}
              />
            )}
          </>
        )}

        {followUps.length === 0 && !loading && (
          <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-gray-600">No follow-ups found</p>
          </div>
        )}

        {showCreateModal && (
          <Modal
            isOpen={showCreateModal}
            onClose={() => {
              setShowCreateModal(false)
              setSelectedFollowUp(null)
            }}
            title={selectedFollowUp ? 'Edit Follow-Up' : 'Schedule Follow-Up'}
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
  const { showToast } = useToast()
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
        showToast(followUp ? 'Follow-up updated successfully' : 'Follow-up created successfully', 'success')
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
        submitLabel={followUp ? 'Update' : 'Schedule'}
        isLoading={loading}
      />
    </form>
  )
}
