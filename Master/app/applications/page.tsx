'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { PipelineBoard, Modal, ApplicationFilters, Pagination, Button, Spinner, PageHeader, ApplicationActionForm, ToastContainer, useToast, ConfirmDialog, useConfirmDialog, Input } from '@/ui'
import { DashboardLayout } from '@/components/DashboardLayout'
import type { ApplicationFilters as ApplicationFiltersType } from '@/ui'
import { ApplicationStage } from '@prisma/client'

interface Application {
  id: string
  stage: string
  daysInCurrentStage?: number
  daysSinceCreation?: number
  job?: {
    id: string
    title: string
    company: string
  } | null
  client?: {
    id: string
    firstName: string
    lastName: string
    email?: string
  } | null
  recruiter?: {
    id: string
    firstName: string
    lastName: string
  } | null
  createdAt: string
  followUpDate?: string
  notes?: string
}

interface ApplicationsResponse {
  applications: Application[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

const STAGES = [
  ApplicationStage.IDENTIFIED,
  ApplicationStage.RESUME_UPDATED,
  ApplicationStage.COLD_MESSAGE_SENT,
  ApplicationStage.CONNECTION_ACCEPTED,
  ApplicationStage.APPLIED,
  ApplicationStage.INTERVIEW_SCHEDULED,
  ApplicationStage.OFFER,
  ApplicationStage.REJECTED,
  ApplicationStage.CLOSED,
]

const STAGE_LABELS: Record<string, string> = {
  IDENTIFIED: 'Identified',
  RESUME_UPDATED: 'Resume Updated',
  COLD_MESSAGE_SENT: 'Cold Message Sent',
  CONNECTION_ACCEPTED: 'Connection Accepted',
  APPLIED: 'Applied',
  INTERVIEW_SCHEDULED: 'Interview Scheduled',
  OFFER: 'Offer',
  REJECTED: 'Rejected',
  CLOSED: 'Closed',
}

export default function ApplicationsPage() {
  const router = useRouter()
  const [applicationsData, setApplicationsData] = useState<ApplicationsResponse | null>(null)
  const [allApplications, setAllApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [showActionModal, setShowActionModal] = useState(false)
  const [filters, setFilters] = useState<ApplicationFiltersType>({})
  const [sortBy, setSortBy] = useState<string>('createdAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const [recruiters, setRecruiters] = useState<Array<{ id: string; firstName: string; lastName: string }>>([])
  const [userRole, setUserRole] = useState<string>('')
  const [viewMode, setViewMode] = useState<'pipeline' | 'list'>('pipeline')

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (userData) {
      const user = JSON.parse(userData)
      setUserRole(user.role)
    }
    loadRecruiters()
    loadApplications()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, sortBy, sortOrder, filters, viewMode])

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

  const loadApplications = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/login')
        return
      }

      // Build query string
      const params = new URLSearchParams()
      if (filters.stage) params.append('stage', filters.stage)
      if (filters.recruiterId) params.append('recruiterId', filters.recruiterId)
      if (filters.startDate) params.append('startDate', filters.startDate)
      if (filters.endDate) params.append('endDate', filters.endDate)
      if (filters.search) params.append('search', filters.search)
      if (filters.hasFollowUp !== undefined) params.append('hasFollowUp', String(filters.hasFollowUp))
      if (filters.overdueFollowUps !== undefined) params.append('overdueFollowUps', String(filters.overdueFollowUps))
      params.append('sortBy', sortBy)
      params.append('sortOrder', sortOrder)
      params.append('page', String(page))
      params.append('pageSize', String(pageSize))

      const response = await fetch(`/api/applications?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      })

      if (response.ok) {
        const data: ApplicationsResponse = await response.json()
        setApplicationsData(data)
        setAllApplications(data.applications)
      }
    } catch (err) {
      console.error('Failed to load applications:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleStageChange = async (applicationId: string, newStage: string) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/applications/${applicationId}`, {
        method: 'PATCH',
        headers: {
          ...(token && { 'Authorization': `Bearer ${token}` }),
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ stage: newStage }),
      })

      if (response.ok) {
        loadApplications()
      }
    } catch (err) {
      console.error('Failed to update stage:', err)
    }
  }

  const handleItemClick = (app: Application) => {
    setSelectedApplication(app)
    setShowModal(true)
  }

  const handleExport = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const params = new URLSearchParams()
      if (filters.stage) params.append('stage', filters.stage)
      if (filters.recruiterId) params.append('recruiterId', filters.recruiterId)
      if (filters.startDate) params.append('startDate', filters.startDate)
      if (filters.endDate) params.append('endDate', filters.endDate)
      if (filters.search) params.append('search', filters.search)

      const response = await fetch(`/api/applications/export?${params.toString()}`, {
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
        a.download = `applications-${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (err) {
      console.error('Failed to export applications:', err)
    }
  }

  return (
    <DashboardLayout>
      {loading && !applicationsData ? (
        <Spinner fullScreen />
      ) : (
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <PageHeader
              title="Applications"
              description="Manage and track client applications"
            />
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 border border-[#E5E7EB] rounded-lg p-1">
                <button
                  onClick={() => setViewMode('pipeline')}
                  className={`px-3 py-1 text-sm rounded transition-colors ${
                    viewMode === 'pipeline'
                      ? 'bg-[#1F3A5F] text-white'
                      : 'text-[#64748B] hover:text-[#0F172A]'
                  }`}
                >
                  Pipeline
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-3 py-1 text-sm rounded transition-colors ${
                    viewMode === 'list'
                      ? 'bg-[#1F3A5F] text-white'
                      : 'text-[#64748B] hover:text-[#0F172A]'
                  }`}
                >
                  List
                </button>
              </div>
              {(userRole === 'ADMIN' || userRole === 'MANAGER') && (
                <Button variant="secondary" onClick={handleExport}>
                  Export CSV
                </Button>
              )}
              <Button onClick={() => {
                setSelectedApplication(null)
                setShowModal(true)
              }}>
                Create Application
              </Button>
            </div>
          </div>

          {viewMode === 'list' && (
            <ApplicationFilters
              filters={filters}
              onChange={setFilters}
              recruiters={recruiters}
            />
          )}

          {viewMode === 'pipeline' ? (
            allApplications.length > 0 ? (
              <PipelineBoard
                items={allApplications}
                stages={STAGES}
                getStage={(app) => app.stage}
                onStageChange={handleStageChange}
                stageLabels={STAGE_LABELS}
                renderItem={(app) => (
                  <div onClick={() => handleItemClick(app)} className="cursor-pointer">
                    <div className="text-sm font-medium text-gray-900">
                      {app.client ? `${app.client.firstName} ${app.client.lastName}` : '—'}
                    </div>
                    <div className="text-xs text-gray-700 mt-1">
                      {app.job?.title ?? '—'}
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      {app.job?.company ?? '—'}
                    </div>
                    {app.daysInCurrentStage !== undefined && (
                      <div className="text-xs text-blue-600 mt-1 font-medium">
                        {app.daysInCurrentStage} days in stage
                      </div>
                    )}
                    {app.followUpDate && (
                      <div className={`text-xs mt-1 font-medium ${
                        new Date(app.followUpDate) < new Date()
                          ? 'text-red-600'
                          : 'text-blue-600'
                      }`}>
                        Follow-up: {new Date(app.followUpDate).toLocaleDateString()}
                        {new Date(app.followUpDate) < new Date() && ' (Overdue)'}
                      </div>
                    )}
                  </div>
                )}
              />
            ) : (
              <div className="text-center py-12 bg-white rounded-lg shadow border border-gray-200">
                <p className="text-gray-700">No applications found. Create applications to track client progress.</p>
              </div>
            )
          ) : (
            <>
              {applicationsData && applicationsData.applications.length > 0 ? (
                <div className="bg-white shadow-md rounded-xl border border-[#E5E7EB] overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-[#E5E7EB]">
                      <thead className="bg-[#1F3A5F]">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-white uppercase">Client</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-white uppercase">Job</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-white uppercase">Stage</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-white uppercase">Days in Stage</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-white uppercase">Follow-up</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-white uppercase">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-[#E5E7EB]">
                        {applicationsData.applications.map((app) => (
                          <tr
                            key={app.id}
                            onClick={() => handleItemClick(app)}
                            className="hover:bg-[rgba(244,180,0,0.05)] cursor-pointer transition-colors"
                          >
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-[#0F172A]">
                                {app.client ? `${app.client.firstName} ${app.client.lastName}` : '—'}
                              </div>
                              <div className="text-xs text-[#64748B]">{app.client?.email || '-'}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-[#0F172A]">{app.job?.title ?? '—'}</div>
                              <div className="text-xs text-[#64748B]">{app.job?.company ?? '—'}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                                {STAGE_LABELS[app.stage] || app.stage}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-[#0F172A]">
                              {app.daysInCurrentStage !== undefined ? `${app.daysInCurrentStage} days` : '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {app.followUpDate ? (
                                <span className={`text-xs font-medium ${
                                  new Date(app.followUpDate) < new Date()
                                    ? 'text-red-600'
                                    : 'text-blue-600'
                                }`}>
                                  {new Date(app.followUpDate).toLocaleDateString()}
                                  {new Date(app.followUpDate) < new Date() && ' (Overdue)'}
                                </span>
                              ) : (
                                <span className="text-xs text-[#64748B]">-</span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setSelectedApplication(app)
                                  setShowActionModal(true)
                                }}
                              >
                                Log Action
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 bg-white rounded-lg shadow border border-gray-200">
                  <p className="text-gray-700">No applications found.</p>
                </div>
              )}

              {applicationsData && applicationsData.totalPages > 1 && (
                <Pagination
                  currentPage={applicationsData.page}
                  totalPages={applicationsData.totalPages}
                  pageSize={applicationsData.pageSize}
                  total={applicationsData.total}
                  onPageChange={setPage}
                  onPageSizeChange={(newSize) => {
                    setPageSize(newSize)
                    setPage(1)
                  }}
                />
              )}
            </>
          )}

          <Modal
            isOpen={showModal}
            onClose={() => {
              setShowModal(false)
              setSelectedApplication(null)
            }}
            title={selectedApplication ? 'Application Details' : 'Create Application'}
            size="lg"
          >
            {selectedApplication ? (
              <ApplicationDetails
                application={selectedApplication}
                onUpdate={loadApplications}
                onLogAction={() => {
                  setShowModal(false)
                  setShowActionModal(true)
                }}
              />
            ) : (
              <ApplicationForm
                onSuccess={() => {
                  setShowModal(false)
                  loadApplications()
                }}
                onCancel={() => setShowModal(false)}
              />
            )}
          </Modal>

          {selectedApplication && (
            <ApplicationActionForm
              isOpen={showActionModal}
              onClose={() => {
                setShowActionModal(false)
                setSelectedApplication(null)
              }}
              applicationId={selectedApplication.id}
              onSuccess={() => {
                loadApplications()
                setShowActionModal(false)
              }}
            />
          )}
        </div>
      )}
    </DashboardLayout>
  )
}

function ApplicationDetails({
  application,
  onUpdate,
  onLogAction,
}: {
  application: Application
  onUpdate: () => void
  onLogAction: () => void
}) {
  const { showConfirm, dialogState, closeDialog, handleConfirm } = useConfirmDialog()
  const { showToast } = useToast()
  const [stage, setStage] = useState(application.stage)
  const [notes, setNotes] = useState(application.notes || '')
  const [followUpDate, setFollowUpDate] = useState(
    application.followUpDate ? new Date(application.followUpDate).toISOString().split('T')[0] : ''
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [timeline, setTimeline] = useState<any[]>([])

  useEffect(() => {
    loadTimeline()
  }, [application.id])

  const loadTimeline = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/applications/${application.id}/actions`, {
        headers: {
          ...(token && { 'Authorization': `Bearer ${token}` }),
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      })

      if (response.ok) {
        const data = await response.json()
        setTimeline(data)
      }
    } catch (err) {
      console.error('Failed to load timeline:', err)
    }
  }

  const handleUpdate = async () => {
    setLoading(true)
    setError('')
    try {
      const token = localStorage.getItem('token')
      const payload: any = {
        stage,
        notes: notes || undefined,
      }
      if (followUpDate) {
        payload.followUpDate = new Date(followUpDate).toISOString()
      } else {
        payload.followUpDate = null
      }

      const response = await fetch(`/api/applications/${application.id}`, {
        method: 'PATCH',
        headers: {
          ...(token && { 'Authorization': `Bearer ${token}` }),
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        showToast('Application updated successfully', 'success')
        onUpdate()
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to update')
      }
    } catch (err) {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteClick = () => {
    showConfirm(
      'Delete Application',
      'Are you sure you want to delete this application? This action cannot be undone.',
      async () => {
        try {
          const token = localStorage.getItem('token')
          const response = await fetch(`/api/applications/${application.id}`, {
            method: 'DELETE',
            headers: {
              ...(token && { 'Authorization': `Bearer ${token}` }),
            },
            credentials: 'include',
          })

          if (response.ok) {
            showToast('Application deleted successfully', 'success')
            onUpdate()
          } else {
            const data = await response.json()
            showToast(data.error || 'Failed to delete application', 'error')
          }
        } catch (err) {
          console.error('Failed to delete:', err)
          showToast('Failed to delete application', 'error')
        }
      },
      {
        variant: 'danger',
        confirmText: 'Delete',
        cancelText: 'Cancel',
      }
    )
  }

  return (
    <>
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
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-900 mb-2">Client</label>
        <div className="text-sm text-gray-900">
          {application.client ? `${application.client.firstName} ${application.client.lastName}` : '—'}
        </div>
        <div className="text-xs text-gray-700">{application.client?.email || '-'}</div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-900 mb-2">Job</label>
        <div className="text-sm text-gray-900">{application.job?.title ?? '—'}</div>
        <div className="text-xs text-gray-700">{application.job?.company ?? '—'}</div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-900 mb-2">Stage</label>
        <select
          value={stage}
          onChange={(e) => setStage(e.target.value)}
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        >
          {STAGES.map((s) => (
            <option key={s} value={s}>
              {STAGE_LABELS[s]}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-900 mb-2">Follow-up Date</label>
        <input
          type="date"
          value={followUpDate}
          onChange={(e) => setFollowUpDate(e.target.value)}
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-900 mb-2">Notes</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          placeholder="Internal notes..."
        />
      </div>

      {timeline.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">Action Timeline</label>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {timeline.map((action) => (
              <div key={action.id} className="border border-gray-200 rounded p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{action.type}</div>
                    {action.description && (
                      <div className="text-xs text-gray-700 mt-1">{action.description}</div>
                    )}
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(action.performedAt).toLocaleString()}
                  </div>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  by {action.performedBy ? `${action.performedBy.firstName} ${action.performedBy.lastName}` : '—'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-between items-center pt-4 border-t">
        <div className="flex gap-3">
          <Button onClick={onLogAction} variant="secondary">
            Log Action
          </Button>
          <Button variant="danger" onClick={handleDeleteClick}>
            Delete
          </Button>
        </div>
        <Button onClick={handleUpdate} disabled={loading}>
          {loading ? 'Updating...' : 'Update'}
        </Button>
      </div>
    </div>
    </>
  )
}

const JOB_SEARCH_DEBOUNCE_MS = 300

function ApplicationForm({ onSuccess, onCancel }: { onSuccess: () => void; onCancel: () => void }) {
  const [formData, setFormData] = useState<{
    jobId: string
    clientId: string
    stage: ApplicationStage
  }>({
    jobId: '',
    clientId: '',
    stage: ApplicationStage.IDENTIFIED,
  })
  const [selectedJob, setSelectedJob] = useState<{ id: string; title: string; company: string } | null>(null)
  const [jobSearchQuery, setJobSearchQuery] = useState('')
  const [jobSearchResults, setJobSearchResults] = useState<Array<{ id: string; title: string; company: string }>>([])
  const [jobSearchOpen, setJobSearchOpen] = useState(false)
  const [jobSearchLoading, setJobSearchLoading] = useState(false)
  const [clients, setClients] = useState<Array<{ id: string; firstName: string; lastName: string; email?: string }>>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const jobSearchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const jobPickerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) return
    fetch('/api/clients?pageSize=100', {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      credentials: 'include',
    })
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        if (data) setClients(data.clients || data)
      })
      .catch(() => {})
  }, [])

  const fetchJobs = useCallback(async (search: string) => {
    const token = localStorage.getItem('token')
    if (!token) return
    setJobSearchLoading(true)
    try {
      const params = new URLSearchParams({ pageSize: '25' })
      if (search.trim()) params.set('search', search.trim())
      const res = await fetch(`/api/jobs?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        credentials: 'include',
      })
      if (res.ok) {
        const data = await res.json()
        setJobSearchResults(data.jobs || data)
      } else {
        setJobSearchResults([])
      }
    } catch {
      setJobSearchResults([])
    } finally {
      setJobSearchLoading(false)
    }
  }, [])

  useEffect(() => {
    if (jobSearchDebounceRef.current) clearTimeout(jobSearchDebounceRef.current)
    if (!jobSearchOpen) return
    jobSearchDebounceRef.current = setTimeout(() => {
      fetchJobs(jobSearchQuery)
    }, JOB_SEARCH_DEBOUNCE_MS)
    return () => {
      if (jobSearchDebounceRef.current) clearTimeout(jobSearchDebounceRef.current)
    }
  }, [jobSearchQuery, jobSearchOpen, fetchJobs])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (jobPickerRef.current && !jobPickerRef.current.contains(e.target as Node)) {
        setJobSearchOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelectJob = (job: { id: string; title: string; company: string }) => {
    setFormData((prev) => ({ ...prev, jobId: job.id }))
    setSelectedJob(job)
    setJobSearchQuery('')
    setJobSearchOpen(false)
  }

  const handleClearJob = () => {
    setFormData((prev) => ({ ...prev, jobId: '' }))
    setSelectedJob(null)
    setJobSearchQuery('')
    setJobSearchOpen(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const token = localStorage.getItem('token')
      const userData = localStorage.getItem('user')
      const user = userData ? JSON.parse(userData) : null

      const payload = {
        ...formData,
        jobId: formData.jobId || undefined,
        recruiterId: user?.id,
      }

      const response = await fetch('/api/applications', {
        method: 'POST',
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
        setError(data.error || 'Failed to create application')
      }
    } catch {
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

      <div ref={jobPickerRef}>
        <label className="block text-sm font-medium text-gray-900 mb-2">Job (optional)</label>
        {selectedJob ? (
          <div className="flex items-center gap-2 p-3 border border-gray-300 rounded-md bg-gray-50">
            <span className="flex-1 text-sm text-gray-900">
              {selectedJob.title} @ {selectedJob.company}
            </span>
            <Button type="button" variant="ghost" size="sm" onClick={handleClearJob}>
              Clear
            </Button>
          </div>
        ) : (
          <>
            <Input
              label=""
              type="text"
              value={jobSearchQuery}
              onChange={(e) => {
                setJobSearchQuery(e.target.value)
                setJobSearchOpen(true)
              }}
              onFocus={() => setJobSearchOpen(true)}
              placeholder="Search jobs by title, company, or location..."
              className="mb-0"
            />
            {jobSearchOpen && (
              <div className="mt-1 border border-gray-200 rounded-md shadow-lg bg-white max-h-60 overflow-y-auto z-10">
                {jobSearchLoading ? (
                  <div className="px-4 py-6 text-center text-sm text-gray-500">Searching...</div>
                ) : jobSearchResults.length === 0 ? (
                  <div className="px-4 py-6 text-center text-sm text-gray-500">
                    {jobSearchQuery.trim() ? 'No jobs found. Try a different search.' : 'Type to search jobs in the database.'}
                  </div>
                ) : (
                  <ul className="py-1">
                    {jobSearchResults.map((job) => (
                      <li key={job.id}>
                        <button
                          type="button"
                          onClick={() => handleSelectJob(job)}
                          className="w-full px-4 py-2 text-left text-sm text-gray-900 hover:bg-careerist-yellow-light focus:bg-careerist-yellow-light focus:outline-none"
                        >
                          {job.title} @ {job.company}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-900 mb-2">Client</label>
        <select
          required
          value={formData.clientId}
          onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">Select a client</option>
          {clients.map((client) => (
            <option key={client.id} value={client.id}>
              {client.firstName} {client.lastName} {client.email ? `(${client.email})` : ''}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-900 mb-2">Initial Stage</label>
        <select
          value={formData.stage}
          onChange={(e) => setFormData({ ...formData, stage: e.target.value as ApplicationStage })}
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        >
          {STAGES.map((s) => (
            <option key={s} value={s}>
              {STAGE_LABELS[s]}
            </option>
          ))}
        </select>
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Creating...' : 'Create'}
        </Button>
      </div>
    </form>
  )
}
