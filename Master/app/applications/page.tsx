'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { PipelineBoard, Modal, ApplicationFilters, Pagination, Button, Spinner, PageHeader, ApplicationActionForm, useToast } from '@/ui'
import { DashboardLayout } from '@/components/DashboardLayout'
import type { ApplicationFilters as ApplicationFiltersType } from '@/ui'
import { STAGES, STAGE_LABELS } from '@/components/applications/constants'
import { ApplicationDetails, type Application } from '@/components/applications/ApplicationDetails'
import { ApplicationForm } from '@/components/applications/ApplicationForm'

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
  const { showToast } = useToast()

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

  return (
    <DashboardLayout>
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
                          <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-white uppercase">Client</th>
                          <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-white uppercase">Job</th>
                          <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-white uppercase">Stage</th>
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
