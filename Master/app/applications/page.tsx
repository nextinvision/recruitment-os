'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { PipelineBoard } from '@/ui/PipelineBoard'
import { Modal } from '@/ui/Modal'
import { DashboardLayout } from '@/components/DashboardLayout'

interface Application {
  id: string
  stage: string
  job: {
    id: string
    title: string
    company: string
  }
  candidate: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
  createdAt: string
  followUpDate?: string
}

const STAGES = [
  'IDENTIFIED',
  'RESUME_UPDATED',
  'COLD_MESSAGE_SENT',
  'CONNECTION_ACCEPTED',
  'APPLIED',
  'INTERVIEW_SCHEDULED',
  'OFFER',
  'REJECTED',
  'CLOSED',
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
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    loadApplications()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadApplications = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/login')
        return
      }

      const response = await fetch('/api/applications', {
        headers: {
          ...(token && { 'Authorization': `Bearer ${token}` }),
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
        // Update local state
        setApplications((prev) =>
          prev.map((app) =>
            app.id === applicationId ? { ...app, stage: newStage } : app
          )
        )
      }
    } catch (err) {
      console.error('Failed to update stage:', err)
    }
  }

  const handleItemClick = (app: Application) => {
    setSelectedApplication(app)
    setShowModal(true)
  }

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
              <h2 className="text-2xl font-bold text-gray-900">Application Pipeline</h2>
              <p className="mt-1 text-sm text-gray-700">
                Drag and drop to move applications between stages
              </p>
            </div>
            <button
              onClick={() => {
                setSelectedApplication(null)
                setShowModal(true)
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Create Application
            </button>
          </div>

          {applications.length > 0 ? (
            <PipelineBoard
              items={applications}
              stages={STAGES}
              getStage={(app) => app.stage}
              onStageChange={handleStageChange}
              stageLabels={STAGE_LABELS}
              renderItem={(app) => (
                <div onClick={() => handleItemClick(app)}>
                  <div className="text-sm font-medium text-gray-900">
                    {app.candidate.firstName} {app.candidate.lastName}
                  </div>
                  <div className="text-xs text-gray-700 mt-1">
                    {app.job.title}
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    {app.job.company}
                  </div>
                  {app.followUpDate && (
                    <div className="text-xs text-blue-600 mt-1 font-medium">
                      Follow-up: {new Date(app.followUpDate).toLocaleDateString()}
                    </div>
                  )}
                </div>
              )}
            />
          ) : (
            <div className="text-center py-12 bg-white rounded-lg shadow border border-gray-200">
              <p className="text-gray-700">No applications found. Create applications to track candidate progress.</p>
            </div>
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
        </div>
      )}
    </DashboardLayout>
  )
}

function ApplicationDetails({ application, onUpdate }: { application: Application; onUpdate: () => void }) {
  const [stage, setStage] = useState(application.stage)
  const [loading, setLoading] = useState(false)

  const handleUpdate = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/applications/${application.id}`, {
        method: 'PATCH',
        headers: {
          ...(token && { 'Authorization': `Bearer ${token}` }),
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ stage }),
      })

      if (response.ok) {
        onUpdate()
      }
    } catch (err) {
      console.error('Failed to update:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-900 mb-2">Candidate</label>
        <div className="text-sm text-gray-900">
          {application.candidate.firstName} {application.candidate.lastName}
        </div>
        <div className="text-xs text-gray-700">{application.candidate.email}</div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-900 mb-2">Job</label>
        <div className="text-sm text-gray-900">{application.job.title}</div>
        <div className="text-xs text-gray-700">{application.job.company}</div>
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

      <div className="flex justify-end space-x-3 pt-4">
        <button
          onClick={handleUpdate}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Updating...' : 'Update'}
        </button>
      </div>
    </div>
  )
}

function ApplicationForm({ onSuccess, onCancel }: { onSuccess: () => void; onCancel: () => void }) {
  const [formData, setFormData] = useState({
    jobId: '',
    candidateId: '',
    stage: 'IDENTIFIED',
  })
  const [jobs, setJobs] = useState<Array<{ id: string; title: string; company: string }>>([])
  const [candidates, setCandidates] = useState<Array<{ id: string; firstName: string; lastName: string; email: string }>>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    loadOptions()
  }, [])

  const loadOptions = async () => {
    try {
      const token = localStorage.getItem('token')
      const [jobsRes, candidatesRes] = await Promise.all([
        fetch('/api/jobs', {
          headers: {
            ...(token && { 'Authorization': `Bearer ${token}` }),
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        }),
        fetch('/api/candidates', {
          headers: {
            ...(token && { 'Authorization': `Bearer ${token}` }),
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        }),
      ])

      if (jobsRes.ok) {
        const jobsData = await jobsRes.json()
        setJobs(jobsData)
      }

      if (candidatesRes.ok) {
        const candidatesData = await candidatesRes.json()
        setCandidates(candidatesData)
      }
    } catch (err) {
      console.error('Failed to load options:', err)
    }
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

      <div>
        <label className="block text-sm font-medium text-gray-900 mb-2">Job</label>
        <select
          required
          value={formData.jobId}
          onChange={(e) => setFormData({ ...formData, jobId: e.target.value })}
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">Select a job</option>
          {jobs.map((job) => (
            <option key={job.id} value={job.id}>
              {job.title} @ {job.company}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-900 mb-2">Candidate</label>
        <select
          required
          value={formData.candidateId}
          onChange={(e) => setFormData({ ...formData, candidateId: e.target.value })}
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">Select a candidate</option>
          {candidates.map((candidate) => (
            <option key={candidate.id} value={candidate.id}>
              {candidate.firstName} {candidate.lastName} ({candidate.email})
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-900 mb-2">Initial Stage</label>
        <select
          value={formData.stage}
          onChange={(e) => setFormData({ ...formData, stage: e.target.value })}
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
          {loading ? 'Creating...' : 'Create'}
        </button>
      </div>
    </form>
  )
}

