'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { ApplicationStage } from '@prisma/client'
import { Button } from '@/ui'
import { STAGES, STAGE_LABELS } from './constants'

interface ApplicationFormProps {
    onSuccess: () => void
    onCancel: () => void
}

export function ApplicationForm({ onSuccess, onCancel }: ApplicationFormProps) {
    const [formData, setFormData] = useState<{
        jobId: string
        jobIds: string[]
        clientId: string
        stage: ApplicationStage
    }>({
        jobId: '',
        jobIds: [],
        clientId: '',
        stage: ApplicationStage.IDENTIFIED,
    })
    const [assignedJobs, setAssignedJobs] = useState<Array<{ id: string; title: string; company: string; location?: string }>>([])
    const [loadingAssignedJobs, setLoadingAssignedJobs] = useState(false)
    const [clients, setClients] = useState<Array<{ id: string; firstName: string; lastName: string; email?: string }>>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const loadAssignedJobsForClient = useCallback(async (clientId: string) => {
        const token = localStorage.getItem('token')
        if (!token || !clientId) {
            setAssignedJobs([])
            return
        }
        setLoadingAssignedJobs(true)
        try {
            const response = await fetch(`/api/clients/${clientId}/assigned-jobs`, {
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                credentials: 'include',
            })
            if (!response.ok) {
                setAssignedJobs([])
                return
            }
            const data = await response.json()
            setAssignedJobs(data.jobs || [])
        } catch {
            setAssignedJobs([])
        } finally {
            setLoadingAssignedJobs(false)
        }
    }, [])

    useEffect(() => {
        const token = localStorage.getItem('token')
        if (!token) return
        fetch('/api/clients?pageSize=100', {
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
            credentials: 'include',
        })
            .then((res) => (res.ok ? res.json() : null))
            .then((data) => {
                if (data) setClients(data.clients || data)
            })
            .catch(() => { })
    }, [])

    useEffect(() => {
        const selectedClientId = formData.clientId
        setFormData((prev) => ({ ...prev, jobId: '', jobIds: [] }))
        if (!selectedClientId) {
            setAssignedJobs([])
            return
        }
        loadAssignedJobsForClient(selectedClientId)
    }, [formData.clientId, loadAssignedJobsForClient])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        try {
            if (!formData.clientId) {
                setError('Please select a client.')
                setLoading(false)
                return
            }
            if (formData.jobIds.length === 0) {
                setError('Please select at least one assigned job for this client.')
                setLoading(false)
                return
            }
            const token = localStorage.getItem('token')
            const userData = localStorage.getItem('user')
            const user = userData ? JSON.parse(userData) : null

            const payload = {
                ...formData,
                jobId: formData.jobId || undefined,
                jobIds: formData.jobIds && formData.jobIds.length > 0 ? formData.jobIds : undefined,
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
                <label className="block text-sm font-medium text-gray-900 mb-2">Client</label>
                <select
                    required
                    value={formData.clientId}
                    onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                    <option value="">Select a client</option>
                    {clients.map((client) => (
                        <option key={client.id} value={client.id}>
                            {client.firstName} {client.lastName} {client.email ? `(${client.email})` : ''}
                        </option>
                    ))}
                </select>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                    Assigned Jobs (select one or more)
                </label>
                {loadingAssignedJobs ? (
                    <div className="text-sm text-gray-500 border border-gray-200 rounded-md p-3">
                        Loading assigned jobs...
                    </div>
                ) : !formData.clientId ? (
                    <div className="text-sm text-gray-500 border border-gray-200 rounded-md p-3">
                        Select a client first to view assigned jobs.
                    </div>
                ) : assignedJobs.length === 0 ? (
                    <div className="text-sm text-amber-700 border border-amber-200 bg-amber-50 rounded-md p-3">
                        No jobs are assigned to this client yet. Assign jobs from the Jobs page first.
                    </div>
                ) : (
                    <select
                        multiple
                        value={formData.jobIds}
                        onChange={(e) => {
                            const selectedIds = Array.from(e.target.selectedOptions).map((opt) => opt.value)
                            setFormData((prev) => ({
                                ...prev,
                                jobIds: selectedIds,
                                jobId: selectedIds[0] || '',
                            }))
                        }}
                        className="block w-full min-h-[180px] px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                        {assignedJobs.map((job) => (
                            <option key={job.id} value={job.id}>
                                {job.title} @ {job.company}{job.location ? ` (${job.location})` : ''}
                            </option>
                        ))}
                    </select>
                )}
                <p className="mt-1 text-xs text-gray-500">
                    Hold Ctrl/Cmd to select multiple jobs.
                </p>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Initial Stage</label>
                <select
                    value={formData.stage}
                    onChange={(e) => setFormData({ ...formData, stage: e.target.value as ApplicationStage })}
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
                <Button type="button" variant="ghost" onClick={onCancel}>
                    Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                    {loading ? 'Creating...' : 'Create'}
                </Button>
            </div>
        </form>
    )
}
