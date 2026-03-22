'use client'

import { useEffect, useState } from 'react'
import { Input, Textarea, Select, Alert, FormActions } from '@/ui'

export interface Job {
    id: string
    title: string
    company: string
    location: string
    source: string
    status: string
    createdAt: string
    description?: string
    isDuplicate?: boolean
    companyId?: string
    applications?: Array<{ id: string }>
    recruiter?: {
        id: string
        firstName: string
        lastName: string
    }
}

interface JobFormProps {
    job: Job | null
    initialData?: Partial<{
        title: string
        company: string
        location: string
        description: string
        source: string
        status: string
        companyId: string
    }>
    onSuccess: (job: any) => void
    onCancel: () => void
}

export function JobForm({ job, initialData, onSuccess, onCancel }: JobFormProps) {
    const [formData, setFormData] = useState({
        title: job?.title || initialData?.title || '',
        company: job?.company || initialData?.company || '',
        location: job?.location || initialData?.location || '',
        description: job?.description || initialData?.description || '',
        source: job?.source || initialData?.source || 'LINKEDIN',
        status: job?.status || initialData?.status || 'ACTIVE',
        companyId: job?.companyId || initialData?.companyId || '',
        sourceUrl: '',
        experienceRequired: '',
        salaryRange: '',
        skills: '',
        notes: '',
    })
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    useEffect(() => {
        if (job) {
            setFormData(prev => ({
                ...prev,
                title: job.title || '',
                company: job.company || '',
                location: job.location || '',
                description: job.description || '',
                source: job.source || 'LINKEDIN',
                status: job.status || 'ACTIVE',
                companyId: job.companyId || '',
                sourceUrl: (job as any).sourceUrl || '',
                experienceRequired: (job as any).experienceRequired || '',
                salaryRange: (job as any).salaryRange || '',
                skills: ((job as any).skills || []).join(', '),
                notes: (job as any).notes || '',
            }))
        }
    }, [job])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        try {
            const token = localStorage.getItem('token')
            const userData = localStorage.getItem('user')
            const user = userData ? JSON.parse(userData) : null

            const url = job ? `/api/jobs/${job.id}` : '/api/jobs'
            const method = job ? 'PATCH' : 'POST'

            const payload: any = {
                ...formData,
                skills: formData.skills.split(',').map(s => s.trim()).filter(s => s.length > 0),
                ...(method === 'POST' && { recruiterId: user?.id }),
            }

            // Remove empty optional fields
            if (!payload.sourceUrl) delete payload.sourceUrl
            if (!payload.experienceRequired) delete payload.experienceRequired
            if (!payload.salaryRange) delete payload.salaryRange
            if (!payload.notes) delete payload.notes
            if (!payload.companyId) delete payload.companyId

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
                const result = await response.json()
                onSuccess(result)
            } else {
                const data = await response.json().catch(() => ({ error: 'Failed to save job' }))
                if (Array.isArray(data.error)) {
                    setError(data.error.join(', '))
                } else if (typeof data.error === 'string') {
                    setError(data.error)
                } else if (data.message) {
                    setError(data.message)
                } else {
                    setError('Failed to save job. Please check your input and try again.')
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
            {error && <Alert variant="error">{error}</Alert>}

            <Input
                label="Title"
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />

            <div className="grid grid-cols-2 gap-4">
                <Input
                    label="Company"
                    type="text"
                    required
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    disabled={!!formData.companyId} // Disable if linked to a companyId
                />
                <Input
                    label="Location"
                    type="text"
                    required
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                />
            </div>

            <Textarea
                label="Description"
                required
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />

            <div className="grid grid-cols-2 gap-4">
                <Select
                    label="Source"
                    value={formData.source}
                    onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                    options={[
                        { value: 'LINKEDIN', label: 'LinkedIn' },
                        { value: 'INDEED', label: 'Indeed' },
                        { value: 'NAUKRI', label: 'Naukri' },
                        { value: 'OTHER', label: 'Other' },
                    ]}
                />
                <Select
                    label="Status"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    options={[
                        { value: 'ACTIVE', label: 'Active' },
                        { value: 'CLOSED', label: 'Closed' },
                        { value: 'FILLED', label: 'Filled' },
                    ]}
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <Input
                    label="Source URL"
                    type="url"
                    value={formData.sourceUrl}
                    onChange={(e) => setFormData({ ...formData, sourceUrl: e.target.value })}
                />
                <Input
                    label="Experience Required"
                    type="text"
                    placeholder="e.g., 3-5 years"
                    value={formData.experienceRequired}
                    onChange={(e) => setFormData({ ...formData, experienceRequired: e.target.value })}
                />
            </div>

            <Input
                label="Salary Range"
                type="text"
                placeholder="e.g., ₹15,00,000 - ₹25,00,000"
                value={formData.salaryRange}
                onChange={(e) => setFormData({ ...formData, salaryRange: e.target.value })}
            />

            <Input
                label="Skills (comma-separated)"
                type="text"
                placeholder="React, Node.js, TypeScript"
                value={formData.skills}
                onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
            />

            <Textarea
                label="Notes"
                rows={3}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />

            <FormActions
                onCancel={onCancel}
                submitLabel={job ? 'Update' : 'Create'}
                isLoading={loading}
            />
        </form>
    )
}
