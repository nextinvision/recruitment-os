'use client'

import React, { useState } from 'react'
import { Modal, Button, Alert } from './index'

interface Job {
  id: string
  title: string
  company: string
  location: string
  source: string
  createdAt: string
  similarityScore?: number
  applications: Array<{ id: string }>
}

interface DuplicateGroup {
  original: Job
  duplicates: Job[]
}

interface DuplicateResolutionModalProps {
  isOpen: boolean
  onClose: () => void
  duplicateGroup: DuplicateGroup
  onResolve: (duplicateId: string, originalId: string, action: 'merge' | 'delete') => Promise<void>
}

export function DuplicateResolutionModal({
  isOpen,
  onClose,
  duplicateGroup,
  onResolve,
}: DuplicateResolutionModalProps) {
  const [resolving, setResolving] = useState<string | null>(null)
  const [error, setError] = useState('')

  const handleResolve = async (duplicate: Job, action: 'merge' | 'delete') => {
    setResolving(duplicate.id)
    setError('')

    try {
      await onResolve(duplicate.id, duplicateGroup.original.id, action)
      // Modal will close and parent will refresh
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resolve duplicate')
    } finally {
      setResolving(null)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Resolve Duplicate Jobs" size="lg">
      <div className="space-y-4">
        {error && <Alert variant="error">{error}</Alert>}

        <div className="bg-[#F0F9FF] border border-[#1F3A5F] rounded-lg p-4 mb-4">
          <h4 className="font-semibold text-[#0F172A] mb-2">Original Job</h4>
          <div className="text-sm text-[#64748B]">
            <p className="font-medium text-[#0F172A]">{duplicateGroup.original.title}</p>
            <p>{duplicateGroup.original.company} • {duplicateGroup.original.location}</p>
            <p className="mt-1">Source: {duplicateGroup.original.source}</p>
            <p>Applications: {duplicateGroup.original.applications.length}</p>
          </div>
        </div>

        <div>
          <h4 className="font-semibold text-[#0F172A] mb-3">Duplicate Jobs ({duplicateGroup.duplicates.length})</h4>
          <div className="space-y-3">
            {duplicateGroup.duplicates.map((duplicate) => (
              <div
                key={duplicate.id}
                className="border border-[#E5E7EB] rounded-lg p-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <p className="font-medium text-[#0F172A]">{duplicate.title}</p>
                      {duplicate.similarityScore && (
                        <span className="px-2 py-1 text-xs font-medium bg-[#FEF3C7] text-[#92400E] rounded">
                          {duplicate.similarityScore}% similar
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-[#64748B]">
                      {duplicate.company} • {duplicate.location}
                    </p>
                    <p className="text-xs text-[#64748B] mt-1">
                      Source: {duplicate.source} • Applications: {duplicate.applications.length}
                    </p>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleResolve(duplicate, 'merge')}
                      disabled={resolving === duplicate.id}
                    >
                      {resolving === duplicate.id ? 'Merging...' : 'Merge'}
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleResolve(duplicate, 'delete')}
                      disabled={resolving === duplicate.id}
                    >
                      {resolving === duplicate.id ? 'Deleting...' : 'Delete'}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#FEF3C7] border border-[#F4B400] rounded-lg p-3">
          <p className="text-sm text-[#92400E]">
            <strong>Merge:</strong> Transfers all applications from duplicate to original, then deletes duplicate.
            <br />
            <strong>Delete:</strong> Permanently deletes the duplicate job and all its applications.
          </p>
        </div>

        <div className="flex justify-end pt-4">
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  )
}

