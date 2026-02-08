'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { DataTable } from '@/ui/DataTable'
import { Modal } from '@/ui/Modal'
import { DashboardLayout } from '@/components/DashboardLayout'

interface Candidate {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string | null
  linkedinUrl: string | null
  createdAt: string
}

export default function CandidatesPage() {
  const router = useRouter()
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null)

  useEffect(() => {
    loadCandidates()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadCandidates = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/login')
        return
      }

      const response = await fetch('/api/candidates', {
        headers: {
          ...(token && { 'Authorization': `Bearer ${token}` }),
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      })

      if (response.ok) {
        const data = await response.json()
        setCandidates(data)
      }
    } catch (err) {
      console.error('Failed to load candidates:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateCandidate = () => {
    setSelectedCandidate(null)
    setShowCreateModal(true)
  }

  const handleEditCandidate = (candidate: Candidate) => {
    setSelectedCandidate(candidate)
    setShowCreateModal(true)
  }


  const columns = [
    {
      key: 'name',
      header: 'Name',
      render: (candidate: Candidate) => (
        <div>
          <div className="font-medium text-gray-900">
            {candidate.firstName} {candidate.lastName}
          </div>
          <div className="text-sm text-gray-700">{candidate.email}</div>
        </div>
      ),
    },
    {
      key: 'phone',
      header: 'Phone',
      render: (candidate: Candidate) => (
        <span className="text-sm text-gray-900">
          {candidate.phone || 'N/A'}
        </span>
      ),
    },
    {
      key: 'linkedinUrl',
      header: 'LinkedIn',
      render: (candidate: Candidate) => (
        candidate.linkedinUrl ? (
          <a
            href={candidate.linkedinUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            View Profile
          </a>
        ) : (
          <span className="text-sm text-gray-700">N/A</span>
        )
      ),
    },
    {
      key: 'createdAt',
      header: 'Created',
      render: (candidate: Candidate) => (
        <span className="text-sm text-gray-700">
          {new Date(candidate.createdAt).toLocaleDateString()}
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
              <h2 className="text-2xl font-bold text-gray-900">Candidates</h2>
              <p className="mt-1 text-sm text-gray-700">
                Manage your candidate database
              </p>
            </div>
            <button
              onClick={handleCreateCandidate}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Add Candidate
            </button>
          </div>

          <DataTable
            data={candidates}
            columns={columns}
            searchable
            onRowClick={handleEditCandidate}
          />

          <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false)
          setSelectedCandidate(null)
        }}
        title={selectedCandidate ? 'Edit Candidate' : 'Create Candidate'}
        size="lg"
      >
        <CandidateForm
          candidate={selectedCandidate}
          onSuccess={() => {
            setShowCreateModal(false)
            setSelectedCandidate(null)
            loadCandidates()
          }}
          onCancel={() => {
            setShowCreateModal(false)
            setSelectedCandidate(null)
          }}
        />
        </Modal>
        </div>
      )}
    </DashboardLayout>
  )
}

interface Resume {
  id: string
  fileName: string
  fileUrl: string
  version: number
  uploadedAt: string
}

function CandidateForm({ candidate, onSuccess, onCancel }: { candidate: Candidate | null; onSuccess: () => void; onCancel: () => void }) {
  const [formData, setFormData] = useState({
    firstName: candidate?.firstName || '',
    lastName: candidate?.lastName || '',
    email: candidate?.email || '',
    phone: candidate?.phone || '',
    linkedinUrl: candidate?.linkedinUrl || '',
  })
  const [resumes, setResumes] = useState<Resume[]>([])
  const [uploadingResume, setUploadingResume] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (candidate?.id) {
      loadResumes()
    }
  }, [candidate?.id])

  const loadResumes = async () => {
    if (!candidate?.id) return
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      // Load resumes from candidate detail - we'll need to fetch candidate with resumes
      const response = await fetch(`/api/candidates/${candidate.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      })

      if (response.ok) {
        const data = await response.json()
        setResumes(data.resumes || [])
      }
    } catch (err) {
      console.error('Failed to load resumes:', err)
    }
  }

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !candidate?.id) return

    setUploadingResume(true)
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      // Upload file
      const formData = new FormData()
      formData.append('file', file)
      formData.append('fileType', 'RESUME')

      const uploadResponse = await fetch('/api/files/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
        body: formData,
      })

      if (uploadResponse.ok) {
        const fileRecord = await uploadResponse.json()
        // Create resume record - we'll need a resume API endpoint for this
        // For now, just reload resumes
        await loadResumes()
      }
    } catch (err) {
      console.error('Failed to upload resume:', err)
    } finally {
      setUploadingResume(false)
      e.target.value = '' // Reset input
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

      const url = candidate ? `/api/candidates/${candidate.id}` : '/api/candidates'
      const method = candidate ? 'PATCH' : 'POST'

      const payload = {
        ...formData,
        ...(method === 'POST' && { assignedRecruiterId: user?.id }),
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
        const data = await response.json().catch(() => ({ error: 'Failed to save candidate' }))
        // Handle Zod validation errors
        if (Array.isArray(data.error)) {
          setError(data.error.join(', '))
        } else if (typeof data.error === 'string') {
          setError(data.error)
        } else if (data.message) {
          setError(data.message)
        } else {
          setError('Failed to save candidate. Please check your input and try again.')
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
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-900">First Name</label>
          <input
            type="text"
            required
            value={formData.firstName}
            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-900">Last Name</label>
          <input
            type="text"
            required
            value={formData.lastName}
            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-900">Email</label>
        <input
          type="email"
          required
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-900">Phone</label>
        <input
          type="tel"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-900">LinkedIn URL</label>
        <input
          type="url"
          value={formData.linkedinUrl}
          onChange={(e) => setFormData({ ...formData, linkedinUrl: e.target.value })}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          placeholder="https://linkedin.com/in/..."
        />
      </div>

      {candidate?.id && (
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">Resumes</label>
          <div className="space-y-2">
            {resumes.length > 0 && (
              <div className="space-y-1">
                {resumes.map((resume) => (
                  <div key={resume.id} className="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-200">
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span className="text-sm text-gray-900">{resume.fileName}</span>
                      <span className="text-xs text-gray-500">v{resume.version}</span>
                    </div>
                    <a
                      href={resume.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:text-blue-700"
                    >
                      Download
                    </a>
                  </div>
                ))}
              </div>
            )}
            <label className="flex items-center justify-center w-full px-4 py-2 border-2 border-dashed border-gray-300 rounded-md cursor-pointer hover:border-blue-500 transition-colors">
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleResumeUpload}
                disabled={uploadingResume}
                className="hidden"
              />
              <span className="text-sm text-gray-600">
                {uploadingResume ? 'Uploading...' : '+ Upload Resume (PDF, DOC, DOCX)'}
              </span>
            </label>
          </div>
        </div>
      )}

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
          {loading ? 'Saving...' : candidate ? 'Update' : 'Create'}
        </button>
      </div>
    </form>
  )
}

