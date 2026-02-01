'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { DataTable } from '@/ui/DataTable'
import { Modal } from '@/ui/Modal'

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
  }, [router])

  const loadCandidates = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/login')
        return
      }

      const response = await fetch('/api/candidates', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
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
          <div className="text-sm text-gray-500">{candidate.email}</div>
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
            className="text-blue-600 hover:text-blue-800 text-sm"
          >
            View Profile
          </a>
        ) : (
          <span className="text-sm text-gray-400">N/A</span>
        )
      ),
    },
    {
      key: 'createdAt',
      header: 'Created',
      render: (candidate: Candidate) => (
        <span className="text-sm text-gray-500">
          {new Date(candidate.createdAt).toLocaleDateString()}
        </span>
      ),
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <Link href="/dashboard" className="flex items-center text-xl font-bold">
                Recruitment OS
              </Link>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <Link href="/dashboard" className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                  Dashboard
                </Link>
                <Link href="/jobs" className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                  Jobs
                </Link>
                <Link href="/candidates" className="border-blue-500 text-gray-900 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                  Candidates
                </Link>
                <Link href="/applications" className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                  Applications
                </Link>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Candidates</h2>
              <p className="mt-1 text-sm text-gray-500">
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
        </div>
      </main>

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
  )
}

function CandidateForm({ candidate, onSuccess, onCancel }: { candidate: Candidate | null; onSuccess: () => void; onCancel: () => void }) {
  const [formData, setFormData] = useState({
    firstName: candidate?.firstName || '',
    lastName: candidate?.lastName || '',
    email: candidate?.email || '',
    phone: candidate?.phone || '',
    linkedinUrl: candidate?.linkedinUrl || '',
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

      const url = candidate ? `/api/candidates/${candidate.id}` : '/api/candidates'
      const method = candidate ? 'PUT' : 'POST'

      const payload = {
        ...formData,
        ...(method === 'POST' && { assignedRecruiterId: user?.id }),
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
        setError(data.error || 'Failed to save candidate')
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
          <label className="block text-sm font-medium text-gray-700">First Name</label>
          <input
            type="text"
            required
            value={formData.firstName}
            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Last Name</label>
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
        <label className="block text-sm font-medium text-gray-700">Email</label>
        <input
          type="email"
          required
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Phone</label>
        <input
          type="tel"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">LinkedIn URL</label>
        <input
          type="url"
          value={formData.linkedinUrl}
          onChange={(e) => setFormData({ ...formData, linkedinUrl: e.target.value })}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          placeholder="https://linkedin.com/in/..."
        />
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
          {loading ? 'Saving...' : candidate ? 'Update' : 'Create'}
        </button>
      </div>
    </form>
  )
}

