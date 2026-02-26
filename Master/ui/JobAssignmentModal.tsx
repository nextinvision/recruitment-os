'use client'

import React, { useState, useEffect } from 'react'
import { Modal, Select, Alert, Button } from './index'

interface Client {
  id: string
  firstName: string
  lastName: string
  email?: string | null
}

interface JobAssignmentModalProps {
  isOpen: boolean
  onClose: () => void
  jobId: string
  jobTitle: string
  onSuccess: () => void
}

export function JobAssignmentModal({
  isOpen,
  onClose,
  jobId,
  jobTitle,
  onSuccess,
}: JobAssignmentModalProps) {
  const [clients, setClients] = useState<Client[]>([])
  const [selectedClientId, setSelectedClientId] = useState<string>('')
  const [selectedClientIds, setSelectedClientIds] = useState<string[]>([])
  const [isBulkMode, setIsBulkMode] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loadingClients, setLoadingClients] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isOpen) {
      loadClients()
    } else {
      // Reset state when modal closes
      setSelectedClientId('')
      setSelectedClientIds([])
      setIsBulkMode(false)
      setError('')
    }
  }, [isOpen])

  const loadClients = async () => {
    try {
      setLoadingClients(true)
      const token = localStorage.getItem('token')
      const response = await fetch('/api/clients?pageSize=500', {
        headers: {
          ...(token && { 'Authorization': `Bearer ${token}` }),
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      })

      if (response.ok) {
        const data = await response.json()
        setClients(data.clients || data || [])
      }
    } catch (err) {
      console.error('Failed to load clients:', err)
    } finally {
      setLoadingClients(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const token = localStorage.getItem('token')
      
      if (isBulkMode) {
        if (selectedClientIds.length === 0) {
          setError('Please select at least one client')
          setLoading(false)
          return
        }

        const response = await fetch('/api/jobs/assign', {
          method: 'POST',
          headers: {
            ...(token && { 'Authorization': `Bearer ${token}` }),
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            jobId,
            candidateIds: selectedClientIds,
          }),
        })

        if (response.ok) {
          onSuccess()
          onClose()
        } else {
          const data = await response.json()
          setError(data.error || 'Failed to assign job')
        }
      } else {
        if (!selectedClientId) {
          setError('Please select a client')
          setLoading(false)
          return
        }

        const response = await fetch('/api/jobs/assign', {
          method: 'POST',
          headers: {
            ...(token && { 'Authorization': `Bearer ${token}` }),
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            jobId,
            candidateId: selectedClientId,
          }),
        })

        if (response.ok) {
          onSuccess()
          onClose()
        } else {
          const data = await response.json()
          setError(data.error || 'Failed to assign job')
        }
      }
    } catch (err) {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const toggleClientSelection = (clientId: string) => {
    if (selectedClientIds.includes(clientId)) {
      setSelectedClientIds(selectedClientIds.filter(id => id !== clientId))
    } else {
      setSelectedClientIds([...selectedClientIds, clientId])
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Assign Job to Client(s)" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <Alert variant="error">{error}</Alert>}

        <div>
          <p className="text-sm text-[#64748B] mb-4">
            Assigning: <span className="font-medium text-[#0F172A]">{jobTitle}</span>
          </p>
        </div>

        <div className="flex items-center gap-4 mb-4">
          <label className="flex items-center">
            <input
              type="radio"
              checked={!isBulkMode}
              onChange={() => setIsBulkMode(false)}
              className="h-4 w-4 text-[#1F3A5F] border-[#E5E7EB] focus:ring-[#F4B400]"
            />
            <span className="ml-2 text-sm text-[#0F172A]">Single Assignment</span>
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              checked={isBulkMode}
              onChange={() => setIsBulkMode(true)}
              className="h-4 w-4 text-[#1F3A5F] border-[#E5E7EB] focus:ring-[#F4B400]"
            />
            <span className="ml-2 text-sm text-[#0F172A]">Bulk Assignment</span>
          </label>
        </div>

        {loadingClients ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#F4B400] border-t-[#1F3A5F] mx-auto"></div>
            <p className="mt-2 text-sm text-[#64748B]">Loading clients...</p>
          </div>
        ) : isBulkMode ? (
          <div className="max-h-64 overflow-y-auto border border-[#E5E7EB] rounded-lg p-4">
            {clients.length === 0 ? (
              <p className="text-sm text-[#64748B] text-center py-4">No clients available. Add clients in the Clients section first.</p>
            ) : (
              <div className="space-y-2">
                {clients.map((client) => (
                  <label
                    key={client.id}
                    className="flex items-center p-2 hover:bg-[rgba(244,180,0,0.05)] rounded cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedClientIds.includes(client.id)}
                      onChange={() => toggleClientSelection(client.id)}
                      className="h-4 w-4 text-[#1F3A5F] border-[#E5E7EB] rounded focus:ring-[#F4B400]"
                    />
                    <div className="ml-3">
                      <div className="text-sm font-medium text-[#0F172A]">
                        {client.firstName} {client.lastName}
                      </div>
                      <div className="text-xs text-[#64748B]">{client.email || 'No email'}</div>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>
        ) : (
          <Select
            label="Select Client"
            value={selectedClientId}
            onChange={(e) => setSelectedClientId(e.target.value)}
            options={[
              { value: '', label: 'Choose a client...' },
              ...clients.map(c => ({
                value: c.id,
                label: `${c.firstName} ${c.lastName}${c.email ? ` (${c.email})` : ''}`,
              })),
            ]}
            required
          />
        )}

        {isBulkMode && selectedClientIds.length > 0 && (
          <div className="text-sm text-[#64748B]">
            {selectedClientIds.length} client(s) selected
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={loading || (isBulkMode ? selectedClientIds.length === 0 : !selectedClientId)}
          >
            {loading ? 'Assigning...' : 'Assign Job'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

