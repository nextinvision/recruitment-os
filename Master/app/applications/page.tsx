'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { PipelineBoard, Modal, ApplicationFilters, Pagination, Button, Spinner, PageHeader, ApplicationActionForm, useToast, ConfirmDialog, useConfirmDialog } from '@/ui'
import { DashboardLayout } from '@/components/DashboardLayout'
import type { ApplicationFilters as ApplicationFiltersType } from '@/ui'
import { STAGES, STAGE_LABELS } from '@/components/applications/constants'
import { ApplicationDetails, type Application } from '@/components/applications/ApplicationDetails'
import { ApplicationForm } from '@/components/applications/ApplicationForm'
import { openWhatsAppWithMessage } from '@/lib/whatsapp'

interface ApplicationsResponse {
  applications: Application[]
  total: number
  page: number
  pageSize: number
  totalPages: number
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
  const [viewMode, setViewMode] = useState<'pipeline' | 'list'>('list')
  const [updatingStageId, setUpdatingStageId] = useState<string | null>(null)
  const [selectedApplicationIds, setSelectedApplicationIds] = useState<string[]>([])
  const { showToast } = useToast()
  const { showConfirm, dialogState, closeDialog, handleConfirm } = useConfirmDialog()
  const [appBaseUrl, setAppBaseUrl] = useState<string>('')

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setAppBaseUrl(window.location.origin)
    }
  }, [])

  const handleFiltersChange = useCallback((next: ApplicationFiltersType) => {
    setPage(1)
    setFilters(next)
  }, [])

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

  useEffect(() => {
    const availableIds = new Set((applicationsData?.applications || []).map((app) => app.id))
    setSelectedApplicationIds((prev) => prev.filter((id) => availableIds.has(id)))
  }, [applicationsData])

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
    setUpdatingStageId(applicationId)
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
        showToast('Stage updated successfully', 'success')
        loadApplications()
      } else {
        const data = await response.json().catch(() => ({}))
        showToast(data.error || 'Failed to update stage', 'error')
      }
    } catch (err) {
      console.error('Failed to update stage:', err)
      showToast('Failed to update stage', 'error')
    } finally {
      setUpdatingStageId(null)
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

  const toggleApplicationSelection = (applicationId: string) => {
    setSelectedApplicationIds((prev) =>
      prev.includes(applicationId)
        ? prev.filter((id) => id !== applicationId)
        : [...prev, applicationId]
    )
  }

  const toggleSelectAllOnPage = () => {
    const pageIds = (applicationsData?.applications || []).map((app) => app.id)
    if (pageIds.length === 0) return
    const allSelected = pageIds.every((id) => selectedApplicationIds.includes(id))
    setSelectedApplicationIds((prev) => {
      if (allSelected) {
        return prev.filter((id) => !pageIds.includes(id))
      }
      const merged = new Set([...prev, ...pageIds])
      return Array.from(merged)
    })
  }

  const handleBulkDelete = async () => {
    if (selectedApplicationIds.length === 0) return
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/applications', {
        method: 'DELETE',
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ applicationIds: selectedApplicationIds }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        showToast(data.error || 'Failed to delete selected applications', 'error')
        return
      }

      const deletedCount = Array.isArray(data.deletedIds) ? data.deletedIds.length : 0
      const errorCount = Array.isArray(data.errors) ? data.errors.length : 0

      if (deletedCount > 0) {
        showToast(`Deleted ${deletedCount} application(s)`, 'success')
      }
      if (errorCount > 0) {
        showToast(`${errorCount} application(s) could not be deleted`, 'error')
      }

      setSelectedApplicationIds([])
      loadApplications()
    } catch {
      showToast('Failed to delete selected applications', 'error')
    }
  }

  const getApplicationNumber = (app: Application) => `APP-${app.id.slice(-6).toUpperCase()}`

  const isWhatsAppEnabledForApplication = (app: Application) => {
    const isPendingStage = app.stage === 'PENDING_CLIENT_APPROVAL'
    const hasApprovedJob = (app.applicationJobs || []).some((aj) => aj.status === 'APPROVED')
    return isPendingStage || hasApprovedJob
  }

  const handleSendApplicationWhatsApp = (app: Application) => {
    if (!isWhatsAppEnabledForApplication(app)) return

    const phone = app.client?.phone
    if (!phone) {
      showToast('Client phone number is missing', 'error')
      return
    }

    const jobs = (app.applicationJobs || [])
      .map((aj) => aj.job)
      .filter(Boolean) as { id: string; title: string; company: string }[]
    const primaryJob = jobs[0] || app.job || null

    const jobsText = jobs.length
      ? jobs.map((job, idx) => `${idx + 1}. ${job.title} at ${job.company}`).join('\n')
      : (primaryJob ? `1. ${primaryJob.title} at ${primaryJob.company}` : 'No jobs assigned')

    const approvalLink = app.approvalToken ? `${appBaseUrl}/public/approvals/${app.approvalToken}` : ''
    const message = [
      `Hi ${app.client?.firstName || 'there'},`,
      '',
      'Please review the following assigned job opportunities:',
      jobsText,
      approvalLink ? '' : '(No approval link available for this application)',
      approvalLink ? `\nReview link: ${approvalLink}` : '',
    ]
      .filter(Boolean)
      .join('\n')

    const opened = openWhatsAppWithMessage(phone, message)
    if (!opened) {
      showToast('Invalid or missing phone number', 'error')
      return
    }
    showToast('WhatsApp opened with application details', 'success')
  }

  return (
    <DashboardLayout>
      <ConfirmDialog
        isOpen={dialogState.isOpen}
        onClose={closeDialog}
        onConfirm={handleConfirm}
        title={dialogState.title}
        message={dialogState.message}
        variant={dialogState.variant || 'danger'}
        confirmText={dialogState.confirmText || 'Delete'}
        cancelText={dialogState.cancelText || 'Cancel'}
      />
      {loading && !applicationsData ? (
        <Spinner fullScreen />
      ) : (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
            <PageHeader
              title="Applications"
              description="Manage and track client applications"
            />
            <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
              <div className="flex items-center gap-2 border border-[#E5E7EB] rounded-lg p-1 bg-white">
                <button
                  onClick={() => setViewMode('pipeline')}
                  className={`px-2 sm:px-3 py-1 text-xs sm:text-sm rounded transition-colors ${viewMode === 'pipeline'
                    ? 'bg-[#1F3A5F] text-white'
                    : 'text-[#64748B] hover:text-[#0F172A]'
                    }`}
                >
                  Pipeline
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-2 sm:px-3 py-1 text-xs sm:text-sm rounded transition-colors ${viewMode === 'list'
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
              {viewMode === 'list' && selectedApplicationIds.length > 0 && (
                <Button
                  variant="danger"
                  onClick={() =>
                    showConfirm(
                      'Delete selected applications',
                      `Delete ${selectedApplicationIds.length} selected application(s)? This action cannot be undone.`,
                      handleBulkDelete
                    )
                  }
                >
                  Delete Selected ({selectedApplicationIds.length})
                </Button>
              )}
            </div>
          </div>

          <ApplicationFilters
            filters={filters}
            onChange={handleFiltersChange}
            recruiters={recruiters}
          />

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
                    {(() => {
                      const jobs = (app.applicationJobs || [])
                        .map((aj) => aj.job)
                        .filter(Boolean) as { id: string; title: string; company: string }[]
                      const primaryJob = jobs[0] || app.job || null
                      const extraCount = jobs.length > 1 ? jobs.length - 1 : 0
                      return (
                        <>
                          <div className="text-sm font-medium text-gray-900">
                            {app.client ? `${app.client.firstName} ${app.client.lastName}` : '—'}
                          </div>
                          <div className="text-xs text-gray-700 mt-1">
                            {primaryJob?.title ?? '—'}
                            {extraCount > 0 && (
                              <span className="ml-1 text-[10px] text-gray-500 font-medium">
                                (+{extraCount} more)
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-gray-600 mt-1">
                            {primaryJob?.company ?? '—'}
                          </div>
                        </>
                      )
                    })()}
                    {app.daysInCurrentStage !== undefined && (
                      <div className="text-xs text-blue-600 mt-1 font-medium">
                        {app.daysInCurrentStage} days in stage
                      </div>
                    )}
                    {app.followUpDate && (
                      <div className={`text-xs mt-1 font-medium ${new Date(app.followUpDate) < new Date()
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
                          <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-white uppercase">
                            <input
                              type="checkbox"
                              checked={
                                (applicationsData?.applications || []).length > 0 &&
                                (applicationsData?.applications || []).every((app) =>
                                  selectedApplicationIds.includes(app.id)
                                )
                              }
                              onChange={(e) => {
                                e.stopPropagation()
                                toggleSelectAllOnPage()
                              }}
                              className="h-4 w-4 rounded border-white/50"
                              aria-label="Select all applications on current page"
                            />
                          </th>
                          <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-white uppercase">Application #</th>
                          <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-white uppercase">Client</th>
                          <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-white uppercase">Job</th>
                          <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-white uppercase">Stage</th>
                          <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-white uppercase">WhatsApp</th>
                          <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-white uppercase hidden md:table-cell">Days in Stage</th>
                          <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-white uppercase hidden md:table-cell">Follow-up</th>
                          <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-white uppercase text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-[#E5E7EB]">
                        {applicationsData.applications.map((app) => {
                          const jobs = (app.applicationJobs || [])
                            .map((aj) => aj.job)
                            .filter(Boolean) as { id: string; title: string; company: string }[]
                          const primaryJob = jobs[0] || app.job || null
                          const extraCount = jobs.length > 1 ? jobs.length - 1 : 0
                          return (
                            <tr
                              key={app.id}
                              onClick={() => handleItemClick(app)}
                              className="hover:bg-[rgba(244,180,0,0.05)] cursor-pointer transition-colors"
                            >
                              <td
                                className="px-4 sm:px-6 py-4 whitespace-nowrap"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <input
                                  type="checkbox"
                                  checked={selectedApplicationIds.includes(app.id)}
                                  onChange={() => toggleApplicationSelection(app.id)}
                                  className="h-4 w-4 rounded border-gray-300"
                                  aria-label={`Select application ${getApplicationNumber(app)}`}
                                />
                              </td>
                              <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                                <span className="text-xs font-semibold text-[#0F172A]">{getApplicationNumber(app)}</span>
                              </td>
                              <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-[#0F172A]">
                                  {app.client ? `${app.client.firstName} ${app.client.lastName}` : '—'}
                                </div>
                                <div className="text-xs text-[#64748B]">{app.client?.email || '-'}</div>
                              </td>
                              <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-[#0F172A]">
                                  {primaryJob?.title ?? '—'}
                                  {extraCount > 0 && (
                                    <span className="ml-1 text-[10px] text-gray-500 font-medium">
                                      (+{extraCount} more)
                                    </span>
                                  )}
                                </div>
                                <div className="text-xs text-[#64748B]">{primaryJob?.company ?? '—'}</div>
                              </td>
                              <td
                                className="px-4 sm:px-6 py-4 whitespace-nowrap"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <select
                                  value={app.stage}
                                  onChange={(e) => {
                                    e.stopPropagation()
                                    const newStage = e.target.value
                                    if (newStage && newStage !== app.stage) {
                                      handleStageChange(app.id, newStage)
                                    }
                                  }}
                                  disabled={updatingStageId === app.id}
                                  className="min-w-[140px] px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 border border-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                  {STAGES.map((s) => (
                                    <option key={s} value={s}>
                                      {STAGE_LABELS[s] || s}
                                    </option>
                                  ))}
                                </select>
                              </td>
                              <td
                                className="px-4 sm:px-6 py-4 whitespace-nowrap"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  disabled={!isWhatsAppEnabledForApplication(app)}
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleSendApplicationWhatsApp(app)
                                  }}
                                >
                                  WhatsApp
                                </Button>
                              </td>
                              <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-[#0F172A] hidden md:table-cell">
                                {app.daysInCurrentStage !== undefined ? `${app.daysInCurrentStage} days` : '-'}
                              </td>
                              <td className="px-4 sm:px-6 py-4 whitespace-nowrap hidden md:table-cell">
                                {app.followUpDate ? (
                                  <span className={`text-xs font-medium ${new Date(app.followUpDate) < new Date()
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
                              <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-right">
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
                          )
                        })}
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
