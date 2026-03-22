'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { ApplicationStage } from '@prisma/client'
import { Button, Input } from '@/ui'
import { STAGES, STAGE_LABELS, JOB_SEARCH_DEBOUNCE_MS } from './constants'

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
    const [selectedJobs, setSelectedJobs] = useState<Array<{ id: string; title: string; company: string }>>([])
    const [jobSearchQuery, setJobSearchQuery] = useState('')
    const [jobSearchResults, setJobSearchResults] = useState<Array<{ id: string; title: string; company: string }>>([])
    const [jobSearchOpen, setJobSearchOpen] = useState(false)
    const [jobSearchLoading, setJobSearchLoading] = useState(false)
    const [clients, setClients] = useState<Array<{ id: string; firstName: string; lastName: string; email?: string }>>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const jobSearchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const jobPickerRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const token = localStorage.getItem('token')
        if (!token) return
        fetch('/api/clients?pageSize=100', {
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
            credentials: 'include',
        })
            .then((res) => res.ok ? res.json() : null)
            .then((data) => {
                if (data) setClients(data.clients || data)
            })
            .catch(() => { })
    }, [])

    const fetchJobs = useCallback(async (search: string) => {
        const token = localStorage.getItem('token')
        if (!token) return
        setJobSearchLoading(true)
        try {
            const params = new URLSearchParams({ pageSize: '25' })
            if (search.trim()) params.set('search', search.trim())
            const res = await fetch(`/api/jobs?${params.toString()}`, {
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                credentials: 'include',
            })
            if (res.ok) {
                const data = await res.json()
                setJobSearchResults(data.jobs || data)
            } else {
                setJobSearchResults([])
            }
        } catch {
            setJobSearchResults([])
        } finally {
            setJobSearchLoading(false)
        }
    }, [])

    useEffect(() => {
        if (jobSearchDebounceRef.current) clearTimeout(jobSearchDebounceRef.current)
        if (!jobSearchOpen) return
        jobSearchDebounceRef.current = setTimeout(() => {
            fetchJobs(jobSearchQuery)
        }, JOB_SEARCH_DEBOUNCE_MS)
        return () => {
            if (jobSearchDebounceRef.current) clearTimeout(jobSearchDebounceRef.current)
        }
    }, [jobSearchQuery, jobSearchOpen, fetchJobs])

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (jobPickerRef.current && !jobPickerRef.current.contains(e.target as Node)) {
                setJobSearchOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const handleSelectJob = (job: { id: string; title: string; company: string }) => {
        setSelectedJobs((prev) => {
            if (prev.find((j) => j.id === job.id)) return prev
            const next = [...prev, job]
            setFormData((prevForm) => ({
                ...prevForm,
                jobId: next[0]?.id || '',
                jobIds: next.map((j) => j.id),
            }))
            return next
        })
        setJobSearchQuery('')
        setJobSearchOpen(false)
    }

    const handleRemoveJob = (jobId: string) => {
        setSelectedJobs((prev) => {
            const next = prev.filter((j) => j.id !== jobId)
            setFormData((prevForm) => ({
                ...prevForm,
                jobId: next[0]?.id || '',
                jobIds: next.map((j) => j.id),
            }))
            return next
        })
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

            <div ref={jobPickerRef}>
                <label className="block text-sm font-medium text-gray-900 mb-2">Jobs (select one or more)</label>
                {selectedJobs.length > 0 && (
                    <div className="mb-2 flex flex-wrap gap-2">
                        {selectedJobs.map((job) => (
                            <span
                                key={job.id}
                                className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100 border border-gray-300 text-xs text-gray-800"
                            >
                                <span>{job.title} @ {job.company}</span>
                                <button
                                    type="button"
                                    onClick={() => handleRemoveJob(job.id)}
                                    className="text-gray-500 hover:text-red-600 focus:outline-none"
                                >
                                    ×
                                </button>
                            </span>
                        ))}
                    </div>
                )}
                <>
                    <Input
                        label=""
                        type="text"
                        value={jobSearchQuery}
                        onChange={(e) => {
                            setJobSearchQuery(e.target.value)
                            setJobSearchOpen(true)
                        }}
                        onFocus={() => setJobSearchOpen(true)}
                        placeholder="Search jobs by title, company, or location..."
                        className="mb-0"
                    />
                    {jobSearchOpen && (
                        <div className="mt-1 border border-gray-200 rounded-md shadow-lg bg-white max-h-60 overflow-y-auto z-10">
                            {jobSearchLoading ? (
                                <div className="px-4 py-6 text-center text-sm text-gray-500">Searching...</div>
                            ) : jobSearchResults.length === 0 ? (
                                <div className="px-4 py-6 text-center text-sm text-gray-500">
                                    {jobSearchQuery.trim() ? 'No jobs found. Try a different search.' : 'Type to search jobs in the database.'}
                                </div>
                            ) : (
                                <ul className="py-1">
                                    {jobSearchResults.map((job) => (
                                        <li key={job.id}>
                                            <button
                                                type="button"
                                                onClick={() => handleSelectJob(job)}
                                                className="w-full px-4 py-2 text-left text-sm text-gray-900 hover:bg-careerist-yellow-light focus:bg-careerist-yellow-light focus:outline-none"
                                            >
                                                {job.title} @ {job.company}
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    )}
                </>
            </div>

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
