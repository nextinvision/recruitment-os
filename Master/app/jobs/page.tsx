'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { DataTable, Modal, Input, Textarea, Select, Alert, FormActions, PageHeader, Spinner, Button, JobFilters, Pagination, JobAssignmentModal, DuplicateResolutionModal } from '@/ui'
import { DashboardLayout } from '@/components/DashboardLayout'
import { JobFetchPanel } from '@/components/jobs/JobFetchPanel'
import Link from 'next/link'
import type { JobFilters as JobFiltersType } from '@/ui'

interface Job {
  id: string
  title: string
  company: string
  location: string
  source: string
  status: string
  createdAt: string
  description?: string
  isDuplicate?: boolean
  applications?: Array<{ id: string }>
  recruiter?: {
    id: string
    firstName: string
    lastName: string
  }
}

interface JobsResponse {
  jobs: Job[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

type TabType = 'all' | 'fetch' | 'linkedin' | 'indeed' | 'naukri' | 'other'

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

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (userData) {
      const user = JSON.parse(userData)
      setUserRole(user.role)
    }
    loadRecruiters()
  }, [])

  useEffect(() => {
    if (activeTab !== 'fetch') {
      loadJobs()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, sortBy, sortOrder, filters, activeTab])

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
      // 'all' tab shows all sources, no filter needed
      
      if (filters.source && activeTab === 'all') params.append('source', filters.source)
      if (filters.status) params.append('status', filters.status)
      if (filters.recruiterId) params.append('recruiterId', filters.recruiterId)
      if (filters.startDate) params.append('startDate', filters.startDate)
      if (filters.endDate) params.append('endDate', filters.endDate)
      if (filters.search) params.append('search', filters.search)
      if (filters.isDuplicate !== undefined) params.append('isDuplicate', String(filters.isDuplicate))
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
      if (filters.recruiterId) params.append('recruiterId', filters.recruiterId)
      if (filters.startDate) params.append('startDate', filters.startDate)
      if (filters.endDate) params.append('endDate', filters.endDate)
      if (filters.search) params.append('search', filters.search)

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

  const tabs = [
    { id: 'all' as TabType, label: 'All Jobs', count: jobsData?.total },
    { id: 'fetch' as TabType, label: 'Fetch Jobs', count: null },
    { id: 'linkedin' as TabType, label: 'LinkedIn', count: null },
    { id: 'indeed' as TabType, label: 'Indeed', count: null },
    { id: 'naukri' as TabType, label: 'Naukri', count: null },
    { id: 'other' as TabType, label: 'Other Sources', count: null },
  ]

  const columns = [
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
        <span className={`px-2 py-1 text-xs font-medium rounded-full border ${
          job.status === 'ACTIVE' ? 'bg-green-100 text-green-800 border-green-200' :
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
                  }}
                  className={`
                    whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors
                    ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  {tab.label}
                  {tab.count !== null && tab.count !== undefined && (
                    <span className={`ml-2 py-0.5 px-2 rounded-full text-xs ${
                      activeTab === tab.id
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
          ) : (
            <>
              <JobFilters
                filters={filters}
                onChange={setFilters}
                recruiters={recruiters}
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
                    Fetch Jobs from External Sources
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

function JobForm({ job, onSuccess, onCancel }: { job: Job | null; onSuccess: () => void; onCancel: () => void }) {
  const [formData, setFormData] = useState({
    title: job?.title || '',
    company: job?.company || '',
    location: job?.location || '',
    description: job?.description || '',
    source: job?.source || 'LINKEDIN',
    status: job?.status || 'ACTIVE',
    sourceUrl: '',
    experienceRequired: '',
    salaryRange: '',
    skills: '',
    notes: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (job) {
      setFormData({
        title: job.title || '',
        company: job.company || '',
        location: job.location || '',
        description: job.description || '',
        source: job.source || 'LINKEDIN',
        status: job.status || 'ACTIVE',
        sourceUrl: (job as any).sourceUrl || '',
        experienceRequired: (job as any).experienceRequired || '',
        salaryRange: (job as any).salaryRange || '',
        skills: ((job as any).skills || []).join(', '),
        notes: (job as any).notes || '',
      })
    }
  }, [job])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const token = localStorage.getItem('token')
      const userData = localStorage.getItem('user')
      const user = userData ? JSON.parse(userData) : null

      const url = job ? `/api/jobs/${job.id}` : '/api/jobs'
      const method = job ? 'PATCH' : 'POST'

      const payload: any = {
        ...formData,
        skills: formData.skills.split(',').map(s => s.trim()).filter(s => s.length > 0),
        ...(method === 'POST' && { recruiterId: user?.id }),
      }

      // Remove empty optional fields
      if (!payload.sourceUrl) delete payload.sourceUrl
      if (!payload.experienceRequired) delete payload.experienceRequired
      if (!payload.salaryRange) delete payload.salaryRange
      if (!payload.notes) delete payload.notes

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
        const data = await response.json().catch(() => ({ error: 'Failed to save job' }))
        if (Array.isArray(data.error)) {
          setError(data.error.join(', '))
        } else if (typeof data.error === 'string') {
          setError(data.error)
        } else if (data.message) {
          setError(data.message)
        } else {
          setError('Failed to save job. Please check your input and try again.')
        }
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

      <Input
        label="Title"
        type="text"
        required
        value={formData.title}
        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
      />

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Company"
          type="text"
          required
          value={formData.company}
          onChange={(e) => setFormData({ ...formData, company: e.target.value })}
        />
        <Input
          label="Location"
          type="text"
          required
          value={formData.location}
          onChange={(e) => setFormData({ ...formData, location: e.target.value })}
        />
      </div>

      <Textarea
        label="Description"
        required
        rows={4}
        value={formData.description}
        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
      />

      <div className="grid grid-cols-2 gap-4">
        <Select
          label="Source"
          value={formData.source}
          onChange={(e) => setFormData({ ...formData, source: e.target.value })}
          options={[
            { value: 'LINKEDIN', label: 'LinkedIn' },
            { value: 'INDEED', label: 'Indeed' },
            { value: 'NAUKRI', label: 'Naukri' },
            { value: 'OTHER', label: 'Other' },
          ]}
        />
        <Select
          label="Status"
          value={formData.status}
          onChange={(e) => setFormData({ ...formData, status: e.target.value })}
          options={[
            { value: 'ACTIVE', label: 'Active' },
            { value: 'CLOSED', label: 'Closed' },
            { value: 'FILLED', label: 'Filled' },
          ]}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Source URL"
          type="url"
          value={formData.sourceUrl}
          onChange={(e) => setFormData({ ...formData, sourceUrl: e.target.value })}
        />
        <Input
          label="Experience Required"
          type="text"
          placeholder="e.g., 3-5 years"
          value={formData.experienceRequired}
          onChange={(e) => setFormData({ ...formData, experienceRequired: e.target.value })}
        />
      </div>

      <Input
        label="Salary Range"
        type="text"
        placeholder="e.g., ₹15,00,000 - ₹25,00,000"
        value={formData.salaryRange}
        onChange={(e) => setFormData({ ...formData, salaryRange: e.target.value })}
      />

      <Input
        label="Skills (comma-separated)"
        type="text"
        placeholder="React, Node.js, TypeScript"
        value={formData.skills}
        onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
      />

      <Textarea
        label="Notes"
        rows={3}
        value={formData.notes}
        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
      />

      <FormActions
        onCancel={onCancel}
        submitLabel={job ? 'Update' : 'Create'}
        isLoading={loading}
      />
    </form>
  )
}
