'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { DataTable } from '@/ui/DataTable'
import { Modal } from '@/ui/Modal'
import { DashboardLayout } from '@/components/DashboardLayout'

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
          'Authorization': `Bearer ${token}`,
        },
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

  const handleEditJob = (job: Job) => {
    setSelectedJob(job)
    setShowCreateModal(true)
  }


  const columns = [
    {
      key: 'title',
      header: 'Title',
      render: (job: Job) => (
        <div>
          <div className="font-medium text-gray-900">{job.title}</div>
          <div className="text-sm text-gray-700">{job.company} • {job.location}</div>
        </div>
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
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Jobs</h2>
              <p className="mt-1 text-sm text-gray-700">
                Manage and track all job postings
              </p>
            </div>
            <button
              onClick={handleCreateJob}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Add Job
            </button>
          </div>

          <DataTable
            data={jobs}
            columns={columns}
            searchable
            onRowClick={handleEditJob}
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
      const method = job ? 'PUT' : 'POST'

      const payload = {
        ...formData,
        ...(method === 'POST' && { recruiterId: user?.id }),
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        onSuccess()
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to save job')
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
        <label className="block text-sm font-medium text-gray-900">Title</label>
        <input
          type="text"
          required
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-900">Company</label>
          <input
            type="text"
            required
            value={formData.company}
            onChange={(e) => setFormData({ ...formData, company: e.target.value })}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-900">Location</label>
          <input
            type="text"
            required
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-900">Description</label>
        <textarea
          required
          rows={4}
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-900">Source</label>
          <select
            value={formData.source}
            onChange={(e) => setFormData({ ...formData, source: e.target.value })}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="LINKEDIN">LinkedIn</option>
            <option value="INDEED">Indeed</option>
            <option value="NAUKRI">Naukri</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-900">Status</label>
          <select
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="ACTIVE">Active</option>
            <option value="CLOSED">Closed</option>
            <option value="FILLED">Filled</option>
          </select>
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-4">
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
          {loading ? 'Saving...' : job ? 'Update' : 'Create'}
        </button>
      </div>
    </form>
  )
}

