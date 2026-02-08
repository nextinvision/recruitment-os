'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { DataTable, Modal, Input, Textarea, Select, Alert, FormActions, PageHeader, Spinner } from '@/ui'
import { DashboardLayout } from '@/components/DashboardLayout'
import Link from 'next/link'

interface Job {
  id: string
  title: string
  company: string
  location: string
  source: string
  status: string
  createdAt: string
  description?: string
}

export default function JobsPage() {
  const router = useRouter()
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)

  useEffect(() => {
    loadJobs()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadJobs = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/login')
        return
      }

      const response = await fetch('/api/jobs', {
        headers: {
          ...(token && { 'Authorization': `Bearer ${token}` }),
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      })

      if (response.ok) {
        const data = await response.json()
        setJobs(data)
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
      key: 'createdAt',
      header: 'Created',
      render: (job: Job) => (
        <span className="text-sm text-gray-700">
          {new Date(job.createdAt).toLocaleDateString()}
        </span>
      ),
    },
  ]

  return (
    <DashboardLayout>
      {loading ? (
        <Spinner fullScreen />
      ) : (
        <div className="max-w-7xl mx-auto">
          <PageHeader
            title="Jobs"
            description="Manage and track all job postings"
            action={{
              label: 'Add Job',
              onClick: handleCreateJob,
            }}
          />

          <DataTable
            data={jobs}
            columns={columns}
            searchable
            onRowClick={(job) => {
              // Navigate to detail page using client-side navigation
              router.push(`/jobs/${job.id}`)
            }}
          />

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

      const url = job ? `/api/jobs/${job.id}` : '/api/jobs'
      const method = job ? 'PATCH' : 'POST'

      const payload = {
        ...formData,
        ...(method === 'POST' && { recruiterId: user?.id }),
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
        const data = await response.json().catch(() => ({ error: 'Failed to save job' }))
        // Handle Zod validation errors
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

      <FormActions
        onCancel={onCancel}
        submitLabel={job ? 'Update' : 'Create'}
        isLoading={loading}
      />
    </form>
  )
}

