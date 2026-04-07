'use client'

import React, { useState, useEffect } from 'react'
import { Button, ConfirmDialog, useConfirmDialog, useToast } from '@/ui'
import { STAGES, STAGE_LABELS } from './constants'

export interface Application {
  id: string
  approvalToken?: string | null
  stage: string
  daysInCurrentStage?: number
  daysSinceCreation?: number
  job?: {
    id: string
    title: string
    company: string
  } | null
  applicationJobs?: Array<{
    status?: string
    job: {
      id: string
      title: string
      company: string
    } | null
  }>
  client?: {
    id: string
    firstName: string
    lastName: string
    email?: string
    phone?: string
  } | null
  recruiter?: {
    id: string
    firstName: string
    lastName: string
  } | null
  createdAt: string
  followUpDate?: string
  notes?: string
}

interface ApplicationDetailsProps {
  application: Application
  onUpdate: () => void
  onLogAction: () => void
}

export function ApplicationDetails({
  application,
  onUpdate,
  onLogAction,
}: ApplicationDetailsProps) {
  const { showConfirm, dialogState, closeDialog, handleConfirm } = useConfirmDialog()
  const { showToast } = useToast()
  const [stage, setStage] = useState(application.stage)
  const [notes, setNotes] = useState(application.notes || '')
  const [followUpDate, setFollowUpDate] = useState(
    application.followUpDate ? new Date(application.followUpDate).toISOString().split('T')[0] : ''
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [timeline, setTimeline] = useState<any[]>([])

  useEffect(() => {
    loadTimeline()
  }, [application.id])

  const loadTimeline = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/applications/${application.id}/actions`, {
        headers: {
          ...(token && { 'Authorization': `Bearer ${token}` }),
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      })

      if (response.ok) {
        const data = await response.json()
        setTimeline(data)
      }
    } catch (err) {
      console.error('Failed to load timeline:', err)
    }
  }

  const handleUpdate = async () => {
    setLoading(true)
    setError('')
    try {
      const token = localStorage.getItem('token')
      const payload: any = {
        stage,
        notes: notes || undefined,
      }
      if (followUpDate) {
        payload.followUpDate = new Date(followUpDate).toISOString()
      } else {
        payload.followUpDate = null
      }

      const response = await fetch(`/api/applications/${application.id}`, {
        method: 'PATCH',
        headers: {
          ...(token && { 'Authorization': `Bearer ${token}` }),
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        showToast('Application updated successfully', 'success')
        onUpdate()
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to update')
      }
    } catch (err) {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteClick = () => {
    showConfirm(
      'Delete Application',
      'Are you sure you want to delete this application? This action cannot be undone.',
      async () => {
        try {
          const token = localStorage.getItem('token')
          const response = await fetch(`/api/applications/${application.id}`, {
            method: 'DELETE',
            headers: {
              ...(token && { 'Authorization': `Bearer ${token}` }),
            },
            credentials: 'include',
          })

          if (response.ok) {
            showToast('Application deleted successfully', 'success')
            onUpdate()
          } else {
            const data = await response.json()
            showToast(data.error || 'Failed to delete application', 'error')
          }
        } catch (err) {
          console.error('Failed to delete:', err)
          showToast('Failed to delete application', 'error')
        }
      },
      {
        variant: 'danger',
        confirmText: 'Delete',
        cancelText: 'Cancel',
      }
    )
  }

  return (
    <>
      <ConfirmDialog
        isOpen={dialogState.isOpen}
        onClose={closeDialog}
        onConfirm={handleConfirm}
        title={dialogState.title}
        message={dialogState.message}
        variant={dialogState.variant || 'danger'}
        confirmText={dialogState.confirmText}
        cancelText={dialogState.cancelText}
      />
      <div className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">Client</label>
          <div className="text-sm text-gray-900">
            {application.client ? `${application.client.firstName} ${application.client.lastName}` : '—'}
          </div>
          <div className="text-xs text-gray-700">{application.client?.email || '-'}</div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">Job</label>
          {(() => {
            const jobs = (application.applicationJobs || [])
              .map((aj) => aj.job)
              .filter(Boolean) as { id: string; title: string; company: string }[]
            const primaryJob = jobs[0] || application.job || null
            const extraJobs = jobs.slice(1)
            return (
              <div className="space-y-2">
                <div>
                  <div className="text-sm text-gray-900">{primaryJob?.title ?? '—'}</div>
                  <div className="text-xs text-gray-700">{primaryJob?.company ?? '—'}</div>
                </div>
                {extraJobs.length > 0 && (
                  <div className="mt-2">
                    <div className="text-xs font-medium text-gray-500 mb-1">
                      Additional Assigned Jobs ({extraJobs.length})
                    </div>
                    <ul className="space-y-1 max-h-32 overflow-y-auto">
                      {extraJobs.map((job) => (
                        <li key={job.id} className="text-xs text-gray-700 flex flex-col">
                          <span className="font-medium">{job.title}</span>
                          <span className="text-[11px] text-gray-500">{job.company}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )
          })()}
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

        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">Follow-up Date</label>
          <input
            type="date"
            value={followUpDate}
            onChange={(e) => setFollowUpDate(e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="Internal notes..."
          />
        </div>

        {timeline.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Action Timeline</label>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {timeline.map((action) => (
                <div key={action.id} className="border border-gray-200 rounded p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{action.type}</div>
                      {action.description && (
                        <div className="text-xs text-gray-700 mt-1">{action.description}</div>
                      )}
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(action.performedAt).toLocaleString()}
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    by {action.performedBy ? `${action.performedBy.firstName} ${action.performedBy.lastName}` : '—'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-between items-center pt-4 border-t">
          <div className="flex gap-3">
            <Button onClick={onLogAction} variant="secondary" type="button">
              Log Action
            </Button>
            <Button variant="danger" onClick={handleDeleteClick} type="button">
              Delete
            </Button>
          </div>
          <Button onClick={handleUpdate} disabled={loading} type="button">
            {loading ? 'Updating...' : 'Update'}
          </Button>
        </div>
      </div>
    </>
  )
}
