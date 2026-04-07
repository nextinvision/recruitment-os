'use client'

import { useEffect, useState } from 'react'
import { Modal, Select, Alert, Button } from '@/ui'

interface Client {
  id: string
  firstName: string
  lastName: string
  email?: string | null
}

interface BulkJobsAssignmentModalProps {
  isOpen: boolean
  onClose: () => void
  jobIds: string[]
  onSuccess: () => void
}

export function BulkJobsAssignmentModal({
  isOpen,
  onClose,
  jobIds,
  onSuccess,
}: BulkJobsAssignmentModalProps) {
  const [clients, setClients] = useState<Client[]>([])
  const [selectedClientId, setSelectedClientId] = useState('')
  const [loadingClients, setLoadingClients] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isOpen) {
      setSelectedClientId('')
      setError('')
      return
    }
    const run = async () => {
      try {
        setLoadingClients(true)
        const token = localStorage.getItem('token')
        const response = await fetch('/api/clients?pageSize=500', {
          headers: {
            ...(token && { Authorization: `Bearer ${token}` }),
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        })
        if (response.ok) {
          const data = await response.json()
          setClients(data.clients || data || [])
        }
      } catch {
        setError('Failed to load clients')
      } finally {
        setLoadingClients(false)
      }
    }
    run()
  }, [isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedClientId) {
      setError('Please select a client')
      return
    }
    if (jobIds.length === 0) {
      setError('Please select at least one job')
      return
    }

    try {
      setSubmitting(true)
      setError('')
      const token = localStorage.getItem('token')
      const response = await fetch('/api/jobs/assign', {
        method: 'POST',
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          jobIds,
          candidateId: selectedClientId,
        }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        setError(data.error || 'Failed to assign selected jobs')
        return
      }

      onSuccess()
      onClose()
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Assign Selected Jobs to Client"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <Alert variant="error">{error}</Alert>}

        <p className="text-sm text-[#64748B]">
          Selected jobs: <span className="font-medium text-[#0F172A]">{jobIds.length}</span>
        </p>
        <p className="text-xs text-[#64748B]">
          All selected jobs will be linked to one client in a single action.
        </p>

        {loadingClients ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#F4B400] border-t-[#1F3A5F] mx-auto" />
            <p className="mt-2 text-sm text-[#64748B]">Loading clients...</p>
          </div>
        ) : (
          <Select
            label="Select Client"
            value={selectedClientId}
            onChange={(e) => setSelectedClientId(e.target.value)}
            options={[
              { value: '', label: 'Choose a client...' },
              ...clients.map((c) => ({
                value: c.id,
                label: `${c.firstName} ${c.lastName}${c.email ? ` (${c.email})` : ''}`,
              })),
            ]}
            required
          />
        )}

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={submitting || !selectedClientId || jobIds.length === 0}>
            {submitting ? 'Assigning...' : 'Assign Selected Jobs'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
