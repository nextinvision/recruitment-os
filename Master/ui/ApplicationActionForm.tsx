'use client'

import React, { useState } from 'react'
import { Modal, Select, Textarea, Button, Alert } from './index'
import { ApplicationActionType } from '@prisma/client'

interface ApplicationActionFormProps {
  isOpen: boolean
  onClose: () => void
  applicationId: string
  onSuccess: () => void
}

const ACTION_TYPE_LABELS: Record<string, string> = {
  APPLIED: 'Applied',
  OUTREACH: 'Outreach',
  FOLLOW_UP: 'Follow-up',
  INTERVIEW: 'Interview',
  OFFER: 'Offer',
  REJECTION: 'Rejection',
  NOTE: 'Note',
}

export function ApplicationActionForm({
  isOpen,
  onClose,
  applicationId,
  onSuccess,
}: ApplicationActionFormProps) {
  const [formData, setFormData] = useState<{
    type: ApplicationActionType
    description: string
  }>({
    type: ApplicationActionType.NOTE,
    description: '',
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

      if (!user) {
        setError('User not found')
        setLoading(false)
        return
      }

      const response = await fetch(`/api/applications/${applicationId}/actions`, {
        method: 'POST',
        headers: {
          ...(token && { 'Authorization': `Bearer ${token}` }),
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          type: formData.type,
          description: formData.description || undefined,
        }),
      })

      if (response.ok) {
        onSuccess()
        setFormData({ type: ApplicationActionType.NOTE, description: '' })
        onClose()
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to log action')
      }
    } catch (err) {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Log Action" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <Alert variant="error">{error}</Alert>}

        <Select
          label="Action Type"
          value={formData.type}
          onChange={(e) => setFormData({ ...formData, type: e.target.value as ApplicationActionType })}
          required
          options={Object.entries(ACTION_TYPE_LABELS).map(([value, label]) => ({
            value,
            label,
          }))}
        />

        <Textarea
          label="Description"
          rows={4}
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Enter action description..."
        />

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
            disabled={loading}
          >
            {loading ? 'Logging...' : 'Log Action'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

