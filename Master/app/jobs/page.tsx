'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { DataTable, Modal, Input, Textarea, Select, Alert, FormActions, PageHeader, Spinner, Button, JobFilters, Pagination, JobAssignmentModal, DuplicateResolutionModal, useToast, ConfirmDialog, useConfirmDialog } from '@/ui'
import { DashboardLayout } from '@/components/DashboardLayout'
import { JobFetchPanel } from '@/components/jobs/JobFetchPanel'
import { GoogleFetchPanel } from '@/components/jobs/GoogleFetchPanel'
import { JobForm, type Job as JobType } from '@/components/jobs/JobForm'
import Link from 'next/link'
import type { JobFilters as JobFiltersType } from '@/ui'

type Job = JobType

interface JobsResponse {
  jobs: Job[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

type TabType = 'all' | 'fetch' | 'google' | 'linkedin' | 'indeed' | 'naukri' | 'other'

export default function JobsPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<TabType>('all')
  const [jobsData, setJobsData] = useState<JobsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  const [filters, setFilters] = useState<JobFiltersType>({})
  const [sortBy, setSortBy] = useState<string>('createdAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const [showAssignmentModal, setShowAssignmentModal] = useState(false)
  const [assignmentJobId, setAssignmentJobId] = useState<string>('')
  const [assignmentJobTitle, setAssignmentJobTitle] = useState<string>('')
  const [showDuplicatesModal, setShowDuplicatesModal] = useState(false)
  const [duplicateGroups, setDuplicateGroups] = useState<any[]>([])
  const [recruiters, setRecruiters] = useState<Array<{ id: string; firstName: string; lastName: string }>>([])
  const [userRole, setUserRole] = useState<string>('')
  const [selectedJobIds, setSelectedJobIds] = useState<Set<string>>(new Set())
  const [bulkDeleting, setBulkDeleting] = useState(false)
  const { showToast } = useToast()
  const { showConfirm, dialogState, closeDialog, handleConfirm } = useConfirmDialog()

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (userData) {
      const user = JSON.parse(userData)
      setUserRole(user.role)
    }
    loadRecruiters()
  }, [])

  useEffect(() => {
    if (activeTab !== 'fetch' && activeTab !== 'google') {
      loadJobs()
    }
    // userRole: ensures recruiterId param / RBAC align after hydrating from localStorage
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, sortBy, sortOrder, filters, activeTab, userRole])

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

  const handleFiltersChange = (next: JobFiltersType) => {
    setFilters(next)
    setPage(1)
  }

  const loadJobs = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/login')
        return
      }

      // Build query string
      const params = new URLSearchParams()

      // Apply source filter based on active tab
      if (activeTab === 'linkedin') {
        params.append('source', 'LINKEDIN')
      } else if (activeTab === 'indeed') {
        params.append('source', 'INDEED')
      } else if (activeTab === 'naukri') {
        params.append('source', 'NAUKRI')
      } else if (activeTab === 'other') {
        params.append('source', 'OTHER')
      }
      // 'all'/'fetch'/'google' tabs show all sources, no filter needed

      if (filters.source && activeTab === 'all') params.append('source', filters.source)
      if (filters.status) params.append('status', filters.status)
      if (
        filters.recruiterId &&
        (userRole === 'ADMIN' || userRole === 'MANAGER')
      ) {
        params.append('recruiterId', filters.recruiterId)
      }
      if (filters.startDate) params.append('startDate', filters.startDate)
      if (filters.endDate) params.append('endDate', filters.endDate)
      if (filters.search) params.append('search', filters.search)
      if (filters.isDuplicate !== undefined) params.append('isDuplicate', String(filters.isDuplicate))
      if (filters.jobType) params.append('jobType', filters.jobType)
      if (filters.title) params.append('title', filters.title)
      if (filters.company) params.append('company', filters.company)
      if (filters.location) params.append('location', filters.location)
      if (filters.skills) params.append('skills', filters.skills)
      if (filters.ctcRange) params.append('ctcRange', filters.ctcRange)
      if (filters.yearsOfExperience) params.append('yearsOfExperience', filters.yearsOfExperience)
      params.append('sortBy', sortBy)
      params.append('sortOrder', sortOrder)
      params.append('page', String(page))
      params.append('pageSize', String(pageSize))

      const response = await fetch(`/api/jobs?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      })

      if (response.ok) {
        const data: JobsResponse = await response.json()
        setJobsData(data)
      }
    } catch (err) {
      console.error('Failed to load jobs:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateJob = () => {
    setSelectedJob(null)
    setShowCreateModal(true)
  }

  const handleEditJob = (job: Job) => {
    setSelectedJob(job)
    setShowCreateModal(true)
  }

  const handleAssignJob = (job: Job) => {
    setAssignmentJobId(job.id)
    setAssignmentJobTitle(job.title)
    setShowAssignmentModal(true)
  }

  const handleExportJobs = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const params = new URLSearchParams()
      if (activeTab === 'linkedin') params.append('source', 'LINKEDIN')
      else if (activeTab === 'indeed') params.append('source', 'INDEED')
      else if (activeTab === 'naukri') params.append('source', 'NAUKRI')
      else if (activeTab === 'other') params.append('source', 'OTHER')

      if (filters.source && activeTab === 'all') params.append('source', filters.source)
      if (filters.status) params.append('status', filters.status)
      if (
        filters.recruiterId &&
        (userRole === 'ADMIN' || userRole === 'MANAGER')
      ) {
        params.append('recruiterId', filters.recruiterId)
      }
      if (filters.startDate) params.append('startDate', filters.startDate)
      if (filters.endDate) params.append('endDate', filters.endDate)
      if (filters.search) params.append('search', filters.search)
      if (filters.isDuplicate !== undefined) params.append('isDuplicate', String(filters.isDuplicate))
      if (filters.title) params.append('title', filters.title)
      if (filters.company) params.append('company', filters.company)
      if (filters.location) params.append('location', filters.location)
      if (filters.jobType) params.append('jobType', filters.jobType)
      if (filters.skills) params.append('skills', filters.skills)
      if (filters.ctcRange) params.append('ctcRange', filters.ctcRange)
      if (filters.yearsOfExperience) params.append('yearsOfExperience', filters.yearsOfExperience)

      const response = await fetch(`/api/jobs/export?${params.toString()}`, {
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
        a.download = `jobs-${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (err) {
      console.error('Failed to export jobs:', err)
    }
  }

  const loadDuplicates = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const response = await fetch('/api/jobs/duplicates', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      })

      if (response.ok) {
        const data = await response.json()
        setDuplicateGroups(data)
        setShowDuplicatesModal(true)
      }
    } catch (err) {
      console.error('Failed to load duplicates:', err)
    }
  }

  const handleResolveDuplicate = async (duplicateId: string, originalId: string, action: 'merge' | 'delete') => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const response = await fetch('/api/jobs/duplicates', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ duplicateId, originalId, action }),
      })

      if (response.ok) {
        // Reload duplicates and jobs
        loadDuplicates()
        loadJobs()
      } else {
        const data = await response.json()
        throw new Error(data.error || 'Failed to resolve duplicate')
      }
    } catch (err) {
      throw err
    }
  }

  const handleFetchComplete = () => {
    // Reload jobs after fetching
    if (activeTab !== 'fetch') {
      loadJobs()
    }
  }

  const handleBulkDelete = async () => {
    if (selectedJobIds.size === 0) return
    const token = localStorage.getItem('token')
    if (!token) {
      showToast('Please log in', 'error')
      return
    }
    setBulkDeleting(true)
    try {
      const res = await fetch('/api/jobs/bulk-delete', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ jobIds: Array.from(selectedJobIds) }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok) {
        const deleted = data.deleted ?? 0
        setSelectedJobIds(new Set())
        loadJobs()
        showToast(deleted > 0 ? `${deleted} job(s) deleted` : 'No jobs deleted', deleted > 0 ? 'success' : 'info')
        if (data.errors?.length > 0) {
          showToast(`${data.errors.length} job(s) could not be deleted`, 'error')
        }
      } else {
        showToast(data.error || 'Bulk delete failed', 'error')
      }
    } catch {
      showToast('Request failed', 'error')
    } finally {
      setBulkDeleting(false)
    }
  }

  const tabs = [
    { id: 'all' as TabType, label: 'All Jobs', count: jobsData?.total },
    { id: 'fetch' as TabType, label: 'Fetch Jobs', count: null },
    { id: 'google' as TabType, label: 'Google Search', count: null },
    { id: 'linkedin' as TabType, label: 'LinkedIn', count: null },
    { id: 'indeed' as TabType, label: 'Indeed', count: null },
    { id: 'naukri' as TabType, label: 'Naukri', count: null },
    { id: 'other' as TabType, label: 'Other Sources', count: null },
  ]

  const pageJobIds = jobsData?.jobs?.map((j) => j.id) ?? []
  const allPageSelected = pageJobIds.length > 0 && pageJobIds.every((id) => selectedJobIds.has(id))

  const columns = [
    {
      key: '_select' as const,
      header: '',
      headerRender: () => (
        <input
          type="checkbox"
          checked={allPageSelected}
          onChange={() => {
            if (allPageSelected) {
              setSelectedJobIds((prev) => {
                const next = new Set(prev)
                pageJobIds.forEach((id) => next.delete(id))
                return next
              })
            } else {
              setSelectedJobIds((prev) => new Set([...prev, ...pageJobIds]))
            }
          }}
          onClick={(e) => e.stopPropagation()}
          className="h-4 w-4 rounded border-gray-300 text-[#1F3A5F] focus:ring-[#F4B400]"
        />
      ),
      render: (job: Job) => (
        <input
          type="checkbox"
          checked={selectedJobIds.has(job.id)}
          onChange={() => {
            setSelectedJobIds((prev) => {
              const next = new Set(prev)
              if (next.has(job.id)) next.delete(job.id)
              else next.add(job.id)
              return next
            })
          }}
          onClick={(e) => e.stopPropagation()}
          className="h-4 w-4 rounded border-gray-300 text-[#1F3A5F] focus:ring-[#F4B400]"
        />
      ),
    },
    {
      key: 'title',
      header: 'Title',
      render: (job: Job) => (
        <Link
          href={`/jobs/${job.id}`}
          className="block hover:opacity-80 transition-opacity"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="font-medium text-careerist-text-primary">{job.title}</div>
          <div className="text-sm text-careerist-text-secondary">{job.company} • {job.location}</div>
          {job.isDuplicate && (
            <span className="inline-block mt-1 px-2 py-0.5 text-xs font-medium bg-[#FEF3C7] text-[#92400E] rounded">
              Duplicate
            </span>
          )}
        </Link>
      ),
    },
    {
      key: 'source',
      header: 'Source',
      render: (job: Job) => (
        <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 border border-blue-200">
          {job.source}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (job: Job) => (
        <span className={`px-2 py-1 text-xs font-medium rounded-full border ${job.status === 'ACTIVE' ? 'bg-green-100 text-green-800 border-green-200' :
          job.status === 'CLOSED' ? 'bg-gray-100 text-gray-800 border-gray-200' :
            'bg-yellow-100 text-yellow-800 border-yellow-200'
          }`}>
          {job.status}
        </span>
      ),
    },
    {
      key: 'applications',
      header: 'Applications',
      render: (job: Job) => (
        <span className="text-sm text-gray-700">
          {job.applications?.length || 0}
        </span>
      ),
    },
    {
      key: 'createdAt',
      header: 'Created',
      render: (job: Job) => (
        <span className="text-sm text-gray-700">
          {new Date(job.createdAt).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (job: Job) => (
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={(e) => {
              e.stopPropagation()
              handleAssignJob(job)
            }}
          >
            Assign
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={(e) => {
              e.stopPropagation()
              handleEditJob(job)
            }}
          >
            Edit
          </Button>
        </div>
      ),
    },
  ]

  return (
    <DashboardLayout>
      <ConfirmDialog
        isOpen={dialogState.isOpen}
        onClose={closeDialog}
        onConfirm={handleConfirm}
        title={dialogState.title}
        message={dialogState.message}
        variant={dialogState.variant ?? 'danger'}
        confirmText={dialogState.confirmText ?? 'Delete'}
        cancelText={dialogState.cancelText ?? 'Cancel'}
      />
      {loading && !jobsData && activeTab !== 'fetch' ? (
        <Spinner fullScreen />
      ) : (
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <PageHeader
              title="Jobs"
              description="Manage and track all job postings from multiple sources"
            />
            <div className="flex items-center gap-3">
              {selectedJobIds.size > 0 && (
                <Button
                  variant="secondary"
                  onClick={() =>
                    showConfirm(
                      'Delete selected jobs',
                      `Delete ${selectedJobIds.size} selected job(s)? This cannot be undone.`,
                      () => handleBulkDelete(),
                      { variant: 'danger', confirmText: 'Delete' }
                    )
                  }
                  disabled={bulkDeleting}
                >
                  {bulkDeleting ? 'Deleting…' : `Delete selected (${selectedJobIds.size})`}
                </Button>
              )}
              {(userRole === 'ADMIN' || userRole === 'MANAGER') && activeTab !== 'fetch' && (
                <>
                  <Button variant="secondary" onClick={loadDuplicates}>
                    View Duplicates
                  </Button>
                  <Button variant="secondary" onClick={handleExportJobs}>
                    Export CSV
                  </Button>
                </>
              )}
              {activeTab !== 'fetch' && (
                <Button onClick={handleCreateJob}>
                  Add Job
                </Button>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200 mb-6">
            <nav className="-mb-px flex space-x-8" aria-label="Tabs">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id)
                    setPage(1) // Reset to first page when switching tabs
                    setSelectedJobIds(new Set()) // Clear selection when switching tabs
                  }}
                  className={`
                    whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors
                    ${activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  {tab.label}
                  {tab.count !== null && tab.count !== undefined && (
                    <span className={`ml-2 py-0.5 px-2 rounded-full text-xs ${activeTab === tab.id
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-gray-100 text-gray-600'
                      }`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          {activeTab === 'fetch' ? (
            <JobFetchPanel onFetchComplete={handleFetchComplete} />
          ) : activeTab === 'google' ? (
            <GoogleFetchPanel onFetchComplete={handleFetchComplete} />
          ) : (
            <>
              <JobFilters
                filters={filters}
                onChange={handleFiltersChange}
                recruiters={recruiters}
                showRecruiterFilter={userRole === 'ADMIN' || userRole === 'MANAGER'}
              />

              {loading ? (
                <div className="flex justify-center py-12">
                  <Spinner />
                </div>
              ) : jobsData && jobsData.jobs.length > 0 ? (
                <>
                  <DataTable
                    data={jobsData.jobs}
                    columns={columns}
                    searchable={false}
                    onRowClick={(job) => {
                      router.push(`/jobs/${job.id}`)
                    }}
                  />

                  {jobsData.totalPages > 1 && (
                    <Pagination
                      currentPage={jobsData.page}
                      totalPages={jobsData.totalPages}
                      pageSize={jobsData.pageSize}
                      total={jobsData.total}
                      onPageChange={setPage}
                      onPageSizeChange={(newSize) => {
                        setPageSize(newSize)
                        setPage(1)
                      }}
                    />
                  )}
                </>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500">
                    No jobs found{activeTab !== 'all' ? ` from ${tabs.find(t => t.id === activeTab)?.label}` : ''}.
                  </p>
                  <Button
                    onClick={() => setActiveTab('fetch')}
                    className="mt-4"
                  >
                    Get more jobs
                  </Button>
                </div>
              )}
            </>
          )}

          <Modal
            isOpen={showCreateModal}
            onClose={() => {
              setShowCreateModal(false)
              setSelectedJob(null)
            }}
            title={selectedJob ? 'Edit Job' : 'Create Job'}
            size="lg"
          >
            <JobForm
              job={selectedJob}
              onSuccess={() => {
                setShowCreateModal(false)
                setSelectedJob(null)
                loadJobs()
              }}
              onCancel={() => {
                setShowCreateModal(false)
                setSelectedJob(null)
              }}
            />
          </Modal>

          <JobAssignmentModal
            isOpen={showAssignmentModal}
            onClose={() => {
              setShowAssignmentModal(false)
              setAssignmentJobId('')
              setAssignmentJobTitle('')
            }}
            jobId={assignmentJobId}
            jobTitle={assignmentJobTitle}
            onSuccess={() => {
              loadJobs()
            }}
          />

          {duplicateGroups.length > 0 && (
            <DuplicateResolutionModal
              isOpen={showDuplicatesModal}
              onClose={() => {
                setShowDuplicatesModal(false)
                setDuplicateGroups([])
              }}
              duplicateGroup={duplicateGroups[0]}
              onResolve={handleResolveDuplicate}
            />
          )}
        </div>
      )}
    </DashboardLayout>
  )
}
