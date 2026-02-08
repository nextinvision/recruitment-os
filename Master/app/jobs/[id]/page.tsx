'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { DashboardLayout } from '@/components/DashboardLayout'
import { Modal, Spinner, Badge, Button } from '@/ui'
import Link from 'next/link'

interface Job {
  id: string
  title: string
  company: string
  location: string
  description: string
  source: string
  sourceUrl?: string
  skills: string[]
  experienceRequired?: string
  salaryRange?: string
  status: 'ACTIVE' | 'CLOSED' | 'FILLED'
  notes?: string
  recruiter: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
  createdAt: string
  updatedAt: string
}

interface Application {
  id: string
  stage: string
  notes?: string
  followUpDate?: string
  createdAt: string
  candidate: {
    id: string
    firstName: string
    lastName: string
    email: string
    phone?: string
  }
  recruiter: {
    id: string
    firstName: string
    lastName: string
  }
}

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

export default function JobDetailPage() {
  const router = useRouter()
  const params = useParams()
  const jobId = params.id as string

  const [job, setJob] = useState<Job | null>(null)
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [showEditModal, setShowEditModal] = useState(false)

  useEffect(() => {
    if (jobId) {
      loadJob()
      loadApplications()
    }
  }, [jobId])

  const loadJob = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/login')
        return
      }

      const response = await fetch(`/api/jobs/${jobId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      })

      if (response.ok) {
        const data = await response.json()
        setJob(data)
      } else if (response.status === 404) {
        // Job not found
      }
    } catch (err) {
      console.error('Failed to load job:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadApplications = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const response = await fetch(`/api/applications?jobId=${jobId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      })

      if (response.ok) {
        const data = await response.json()
        setApplications(data)
      }
    } catch (err) {
      console.error('Failed to load applications:', err)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this job? This will also delete all associated applications.')) {
      return
    }

    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const response = await fetch(`/api/jobs/${jobId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      })

      if (response.ok) {
        router.push('/jobs')
      }
    } catch (err) {
      console.error('Failed to delete job:', err)
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <Spinner fullScreen />
      </DashboardLayout>
    )
  }

  if (!job) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-careerist-text-secondary">Job not found</p>
          <Link href="/jobs" className="text-careerist-primary-yellow hover:underline mt-4 inline-block">
            Back to Jobs
          </Link>
        </div>
      </DashboardLayout>
    )
  }

  const statusColors: Record<string, string> = {
    ACTIVE: 'bg-green-100 text-green-800',
    CLOSED: 'bg-gray-100 text-gray-800',
    FILLED: 'bg-blue-100 text-blue-800',
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <Link href="/jobs" className="text-careerist-primary-yellow hover:underline text-sm mb-2 inline-block">
              ← Back to Jobs
            </Link>
            <h1 className="text-3xl font-bold text-careerist-text-primary">{job.title}</h1>
            <p className="text-careerist-text-secondary mt-1">{job.company} • {job.location}</p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant={job.status === 'ACTIVE' ? 'success' : job.status === 'CLOSED' ? 'neutral' : 'info'}>
              {job.status}
            </Badge>
            <Button onClick={() => setShowEditModal(true)}>
              Edit Job
            </Button>
            <Button variant="danger" onClick={handleDelete}>
              Delete
            </Button>
          </div>
        </div>

        {/* Job Details */}
        <div className="bg-careerist-card rounded-lg shadow border border-careerist-border p-6">
          <h2 className="text-lg font-semibold text-careerist-text-primary mb-4">Job Information</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-careerist-text-secondary">Company</label>
              <p className="text-careerist-text-primary font-medium">{job.company}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-careerist-text-secondary">Location</label>
              <p className="text-careerist-text-primary">{job.location}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-careerist-text-secondary">Source</label>
              <p className="text-careerist-text-primary">{job.source}</p>
            </div>
            {job.sourceUrl && (
              <div>
                <label className="text-sm font-medium text-careerist-text-secondary">Source URL</label>
                <p className="text-careerist-text-primary">
                  <a href={job.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-careerist-primary-yellow hover:underline">
                    View Original Posting
                  </a>
                </p>
              </div>
            )}
            {job.experienceRequired && (
              <div>
                <label className="text-sm font-medium text-careerist-text-secondary">Experience Required</label>
                <p className="text-careerist-text-primary">{job.experienceRequired}</p>
              </div>
            )}
            {job.salaryRange && (
              <div>
                <label className="text-sm font-medium text-careerist-text-secondary">Salary Range</label>
                <p className="text-careerist-text-primary font-semibold">{job.salaryRange}</p>
              </div>
            )}
            <div>
              <label className="text-sm font-medium text-careerist-text-secondary">Assigned Recruiter</label>
              <p className="text-careerist-text-primary">
                {job.recruiter.firstName} {job.recruiter.lastName}
              </p>
              <p className="text-sm text-careerist-text-secondary">{job.recruiter.email}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-careerist-text-secondary">Created</label>
              <p className="text-careerist-text-primary">
                {new Date(job.createdAt).toLocaleDateString()}
              </p>
            </div>
            {job.skills && job.skills.length > 0 && (
              <div className="col-span-2">
                <label className="text-sm font-medium text-careerist-text-secondary mb-2 block">Required Skills</label>
                <div className="flex flex-wrap gap-2">
                  {job.skills.map((skill, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-careerist-yellow-light text-careerist-primary-navy rounded-full text-sm font-medium border border-careerist-yellow"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
            <div className="col-span-2">
              <label className="text-sm font-medium text-careerist-text-secondary mb-2 block">Description</label>
              <p className="text-careerist-text-primary whitespace-pre-wrap">{job.description}</p>
            </div>
            {job.notes && (
              <div className="col-span-2">
                <label className="text-sm font-medium text-careerist-text-secondary mb-2 block">Notes</label>
                <p className="text-careerist-text-primary whitespace-pre-wrap">{job.notes}</p>
              </div>
            )}
          </div>
        </div>

        {/* Applications */}
        <div className="bg-careerist-card rounded-lg shadow border border-careerist-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-careerist-text-primary">
              Applications ({applications.length})
            </h2>
            <Link
              href={`/applications?jobId=${jobId}`}
              className="text-sm text-careerist-primary-yellow hover:underline font-medium"
            >
              View All →
            </Link>
          </div>
          {applications.length > 0 ? (
            <div className="space-y-3">
              {applications.map((application) => (
                <div
                  key={application.id}
                  className="border border-careerist-border rounded-lg p-4 hover:bg-careerist-yellow-light transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-semibold text-careerist-text-primary">
                          {application.candidate.firstName} {application.candidate.lastName}
                        </span>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          application.stage === 'OFFER' ? 'bg-green-100 text-green-800' :
                          application.stage === 'REJECTED' ? 'bg-red-100 text-red-800' :
                          application.stage === 'CLOSED' ? 'bg-gray-100 text-gray-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {STAGE_LABELS[application.stage] || application.stage}
                        </span>
                      </div>
                      <div className="text-sm text-careerist-text-secondary space-y-1">
                        <p>{application.candidate.email}</p>
                        {application.candidate.phone && <p>{application.candidate.phone}</p>}
                        {application.followUpDate && (
                          <p className="text-careerist-primary-yellow font-medium">
                            Follow-up: {new Date(application.followUpDate).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      {application.notes && (
                        <p className="text-sm text-careerist-text-secondary mt-2">{application.notes}</p>
                      )}
                    </div>
                    <div className="text-right text-sm text-careerist-text-secondary">
                      <p>Recruiter:</p>
                      <p>{application.recruiter.firstName} {application.recruiter.lastName}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-careerist-text-secondary">
              <p>No applications yet for this job</p>
              <Link
                href={`/applications?jobId=${jobId}`}
                className="text-careerist-primary-yellow hover:underline mt-2 inline-block"
              >
                Create Application
              </Link>
            </div>
          )}
        </div>

        {showEditModal && (
          <Modal
            isOpen={showEditModal}
            onClose={() => setShowEditModal(false)}
            title="Edit Job"
            size="lg"
          >
            <JobEditForm
              job={job}
              onSuccess={() => {
                setShowEditModal(false)
                loadJob()
              }}
              onCancel={() => setShowEditModal(false)}
            />
          </Modal>
        )}
      </div>
    </DashboardLayout>
  )
}

function JobEditForm({
  job,
  onSuccess,
  onCancel,
}: {
  job: Job
  onSuccess: () => void
  onCancel: () => void
}) {
  const [formData, setFormData] = useState({
    title: job.title,
    company: job.company,
    location: job.location,
    description: job.description,
    source: job.source,
    status: job.status,
    sourceUrl: job.sourceUrl || '',
    experienceRequired: job.experienceRequired || '',
    salaryRange: job.salaryRange || '',
    notes: job.notes || '',
    skills: job.skills.join(', '),
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const payload = {
        ...formData,
        skills: formData.skills.split(',').map(s => s.trim()).filter(s => s.length > 0),
        sourceUrl: formData.sourceUrl || undefined,
        experienceRequired: formData.experienceRequired || undefined,
        salaryRange: formData.salaryRange || undefined,
        notes: formData.notes || undefined,
      }

      const response = await fetch(`/api/jobs/${job.id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        onSuccess()
      } else {
        const data = await response.json().catch(() => ({ error: 'Failed to update job' }))
        const errorMessage = typeof data.error === 'string' 
          ? data.error 
          : Array.isArray(data.error) 
            ? data.error.map((e: { message?: string } | string) => typeof e === 'string' ? e : e.message || 'Error').join(', ')
            : (data.error as { message?: string })?.message || 'Failed to update job'
        setError(errorMessage)
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

      <div>
        <label className="block text-sm font-medium text-careerist-text-primary mb-2">Title *</label>
        <input
          type="text"
          required
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          className="block w-full px-3 py-2 border border-careerist-border rounded-md focus:outline-none focus:ring-2 focus:ring-careerist-primary-yellow"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-careerist-text-primary mb-2">Company *</label>
          <input
            type="text"
            required
            value={formData.company}
            onChange={(e) => setFormData({ ...formData, company: e.target.value })}
            className="block w-full px-3 py-2 border border-careerist-border rounded-md focus:outline-none focus:ring-2 focus:ring-careerist-primary-yellow"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-careerist-text-primary mb-2">Location *</label>
          <input
            type="text"
            required
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            className="block w-full px-3 py-2 border border-careerist-border rounded-md focus:outline-none focus:ring-2 focus:ring-careerist-primary-yellow"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-careerist-text-primary mb-2">Description *</label>
        <textarea
          required
          rows={6}
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="block w-full px-3 py-2 border border-careerist-border rounded-md focus:outline-none focus:ring-2 focus:ring-careerist-primary-yellow"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-careerist-text-primary mb-2">Source *</label>
          <select
            required
            value={formData.source}
            onChange={(e) => setFormData({ ...formData, source: e.target.value })}
            className="block w-full px-3 py-2 border border-careerist-border rounded-md focus:outline-none focus:ring-2 focus:ring-careerist-primary-yellow"
          >
            <option value="LINKEDIN">LinkedIn</option>
            <option value="INDEED">Indeed</option>
            <option value="NAUKRI">Naukri</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-careerist-text-primary mb-2">Status *</label>
          <select
            required
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
            className="block w-full px-3 py-2 border border-careerist-border rounded-md focus:outline-none focus:ring-2 focus:ring-careerist-primary-yellow"
          >
            <option value="ACTIVE">Active</option>
            <option value="CLOSED">Closed</option>
            <option value="FILLED">Filled</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-careerist-text-primary mb-2">Source URL</label>
          <input
            type="url"
            value={formData.sourceUrl}
            onChange={(e) => setFormData({ ...formData, sourceUrl: e.target.value })}
            className="block w-full px-3 py-2 border border-careerist-border rounded-md focus:outline-none focus:ring-2 focus:ring-careerist-primary-yellow"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-careerist-text-primary mb-2">Experience Required</label>
          <input
            type="text"
            value={formData.experienceRequired}
            onChange={(e) => setFormData({ ...formData, experienceRequired: e.target.value })}
            placeholder="e.g., 3-5 years"
            className="block w-full px-3 py-2 border border-careerist-border rounded-md focus:outline-none focus:ring-2 focus:ring-careerist-primary-yellow"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-careerist-text-primary mb-2">Salary Range</label>
        <input
          type="text"
          value={formData.salaryRange}
          onChange={(e) => setFormData({ ...formData, salaryRange: e.target.value })}
          placeholder="e.g., ₹15,00,000 - ₹25,00,000"
          className="block w-full px-3 py-2 border border-careerist-border rounded-md focus:outline-none focus:ring-2 focus:ring-careerist-primary-yellow"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-careerist-text-primary mb-2">Skills (comma-separated)</label>
        <input
          type="text"
          value={formData.skills}
          onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
          placeholder="React, Node.js, TypeScript"
          className="block w-full px-3 py-2 border border-careerist-border rounded-md focus:outline-none focus:ring-2 focus:ring-careerist-primary-yellow"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-careerist-text-primary mb-2">Notes</label>
        <textarea
          rows={3}
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          className="block w-full px-3 py-2 border border-careerist-border rounded-md focus:outline-none focus:ring-2 focus:ring-careerist-primary-yellow"
        />
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-careerist-border rounded-md text-careerist-text-primary hover:bg-careerist-yellow-light"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-careerist-primary-yellow text-careerist-primary-navy rounded-md hover:bg-careerist-yellow-hover disabled:opacity-50 font-semibold"
        >
          {loading ? 'Updating...' : 'Update Job'}
        </button>
      </div>
    </form>
  )
}

