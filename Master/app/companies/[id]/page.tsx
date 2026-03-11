'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { DashboardLayout } from '@/components/DashboardLayout'
import { Button, Input, Select, Modal, Textarea, useToast, ConfirmDialog, useConfirmDialog, Badge, Spinner, DataTable } from '@/ui'
import { JobForm } from '@/components/jobs/JobForm'
import Link from 'next/link'

// ─── Types ────────────────────────────────────────────────────────────────────

interface CompanyContact {
    id: string
    firstName: string
    lastName: string
    role: string
    email?: string
    phone?: string
    linkedinUrl?: string
    notes?: string
    status: 'PENDING' | 'INITIAL_CONTACT_SENT' | 'FOLLOWING_UP' | 'REPLIED' | 'NOT_INTERESTED'
    createdAt: string
}

interface CompanyNote {
    id: string
    content: string
    createdAt: string
    createdBy: { id: string; firstName: string; lastName: string }
}

interface LinkedJob {
    id: string
    title: string
    company: string
    location: string
    status: string
    jobType: string
    source: string
    createdAt: string
}

interface Company {
    id: string
    name: string
    industry?: string
    website?: string
    location?: string
    size?: string
    description?: string
    linkedinUrl?: string
    createdAt: string
    createdBy: { id: string; firstName: string; lastName: string }
    contacts: CompanyContact[]
    notes: CompanyNote[]
    jobs: LinkedJob[]
    _count: { contacts: number; notes: number; jobs: number }
}

const SIZE_LABELS: Record<string, string> = {
    STARTUP: 'Startup', SMALL: 'Small', MEDIUM: 'Medium', LARGE: 'Large', ENTERPRISE: 'Enterprise',
}

const CONTACT_ROLE_COLORS: Record<string, string> = {
    HR: 'bg-blue-100 text-blue-800',
    MANAGER: 'bg-purple-100 text-purple-800',
    DEVELOPER: 'bg-green-100 text-green-800',
    RECRUITER: 'bg-orange-100 text-orange-800',
    DIRECTOR: 'bg-red-100 text-red-800',
    CTO: 'bg-indigo-100 text-indigo-800',
    CEO: 'bg-yellow-100 text-yellow-800',
    OTHER: 'bg-gray-100 text-gray-700',
}

const CONTACT_STATUS_COLORS: Record<string, string> = {
    PENDING: 'bg-gray-100 text-gray-600',
    INITIAL_CONTACT_SENT: 'bg-blue-100 text-blue-700',
    FOLLOWING_UP: 'bg-indigo-100 text-indigo-700',
    REPLIED: 'bg-green-100 text-green-700',
    NOT_INTERESTED: 'bg-red-100 text-red-700',
}

const JOB_STATUS_COLORS: Record<string, string> = {
    ACTIVE: 'success', CLOSED: 'neutral', FILLED: 'warning',
}

// ─── Contact Modal ─────────────────────────────────────────────────────────────

function ContactModal({
    companyId,
    contact,
    onClose,
    onSaved,
}: {
    companyId: string
    contact?: CompanyContact
    onClose: () => void
    onSaved: (contact: CompanyContact) => void
}) {
    const { showToast } = useToast()
    const [saving, setSaving] = useState(false)
    const [form, setForm] = useState({
        firstName: contact?.firstName || '',
        lastName: contact?.lastName || '',
        role: contact?.role || 'OTHER',
        email: contact?.email || '',
        phone: contact?.phone || '',
        linkedinUrl: contact?.linkedinUrl || '',
        notes: contact?.notes || '',
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)
        try {
            const token = localStorage.getItem('token')
            const url = contact
                ? `/api/companies/${companyId}/contacts/${contact.id}`
                : `/api/companies/${companyId}/contacts`
            const method = contact ? 'PATCH' : 'POST'
            const res = await fetch(url, {
                method,
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(form),
            })
            if (res.ok) {
                const data = await res.json()
                showToast(contact ? 'Contact updated' : 'Contact added', 'success')
                onSaved(data)
                onClose()
            } else {
                const data = await res.json()
                showToast(data.error || 'Failed to save contact', 'error')
            }
        } catch {
            showToast('Network error', 'error')
        } finally {
            setSaving(false)
        }
    }

    return (
        <Modal isOpen onClose={onClose} title={contact ? 'Edit Contact' : 'Add Contact'}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <Input
                        label="First Name *"
                        value={form.firstName}
                        onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                        required
                    />
                    <Input
                        label="Last Name *"
                        value={form.lastName}
                        onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
                        required
                    />
                </div>
                <Select
                    label="Role"
                    value={form.role}
                    onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                    options={[
                        { value: 'HR', label: 'HR' },
                        { value: 'MANAGER', label: 'Manager' },
                        { value: 'DEVELOPER', label: 'Developer' },
                        { value: 'RECRUITER', label: 'Recruiter' },
                        { value: 'DIRECTOR', label: 'Director' },
                        { value: 'CTO', label: 'CTO' },
                        { value: 'CEO', label: 'CEO' },
                        { value: 'OTHER', label: 'Other' },
                    ]}
                />
                <div className="grid grid-cols-2 gap-4">
                    <Input
                        label="Email"
                        type="email"
                        value={form.email}
                        onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    />
                    <Input
                        label="Phone"
                        value={form.phone}
                        onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                    />
                </div>
                <Input
                    label="LinkedIn URL"
                    value={form.linkedinUrl}
                    onChange={(e) => setForm((f) => ({ ...f, linkedinUrl: e.target.value }))}
                    placeholder="https://linkedin.com/in/..."
                />
                <div>
                    <label className="block text-sm font-medium text-careerist-text-secondary mb-1">Notes</label>
                    <textarea
                        className="w-full border border-careerist-border rounded-lg px-3 py-2 text-sm text-careerist-text-primary bg-careerist-card focus:outline-none focus:ring-2 focus:ring-careerist-primary-yellow"
                        rows={2}
                        value={form.notes}
                        onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                        placeholder="Any notes about this contact..."
                    />
                </div>
                <div className="flex gap-3 justify-end pt-2">
                    <Button variant="secondary" onClick={onClose} type="button">Cancel</Button>
                    <Button type="submit" disabled={saving}>
                        {saving ? 'Saving...' : contact ? 'Update Contact' : 'Add Contact'}
                    </Button>
                </div>
            </form>
        </Modal>
    )
}

// ─── Edit Company Modal ───────────────────────────────────────────────────────

function EditCompanyModal({
    company,
    onClose,
    onSaved,
}: {
    company: Company
    onClose: () => void
    onSaved: (c: Partial<Company>) => void
}) {
    const { showToast } = useToast()
    const [saving, setSaving] = useState(false)
    const [form, setForm] = useState({
        name: company.name,
        industry: company.industry || '',
        website: company.website || '',
        location: company.location || '',
        size: company.size || '',
        description: company.description || '',
        linkedinUrl: company.linkedinUrl || '',
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)
        try {
            const token = localStorage.getItem('token')
            const res = await fetch(`/api/companies/${company.id}`, {
                method: 'PATCH',
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(form),
            })
            if (res.ok) {
                const data = await res.json()
                showToast('Company updated', 'success')
                onSaved(data)
                onClose()
            } else {
                const data = await res.json()
                showToast(data.error || 'Failed to update', 'error')
            }
        } catch {
            showToast('Network error', 'error')
        } finally {
            setSaving(false)
        }
    }

    return (
        <Modal isOpen onClose={onClose} title="Edit Company">
            <form onSubmit={handleSubmit} className="space-y-4">
                <Input label="Company Name *" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
                <div className="grid grid-cols-2 gap-4">
                    <Input label="Industry" value={form.industry} onChange={(e) => setForm((f) => ({ ...f, industry: e.target.value }))} />
                    <Input label="Location" value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <Input label="Website" value={form.website} onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))} />
                    <Select
                        label="Company Size"
                        value={form.size}
                        onChange={(e) => setForm((f) => ({ ...f, size: e.target.value }))}
                        options={[
                            { value: '', label: 'Select size' },
                            { value: 'STARTUP', label: 'Startup' },
                            { value: 'SMALL', label: 'Small (1–50)' },
                            { value: 'MEDIUM', label: 'Medium (51–500)' },
                            { value: 'LARGE', label: 'Large (501–5000)' },
                            { value: 'ENTERPRISE', label: 'Enterprise (5000+)' },
                        ]}
                    />
                </div>
                <Input label="LinkedIn URL" value={form.linkedinUrl} onChange={(e) => setForm((f) => ({ ...f, linkedinUrl: e.target.value }))} />
                <div>
                    <label className="block text-sm font-medium text-careerist-text-secondary mb-1">Description</label>
                    <textarea
                        className="w-full border border-careerist-border rounded-lg px-3 py-2 text-sm text-careerist-text-primary bg-careerist-card focus:outline-none focus:ring-2 focus:ring-careerist-primary-yellow"
                        rows={3}
                        value={form.description}
                        onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    />
                </div>
                <div className="flex gap-3 justify-end pt-2">
                    <Button variant="secondary" onClick={onClose} type="button">Cancel</Button>
                    <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</Button>
                </div>
            </form>
        </Modal>
    )
}

// ─── Job Management Modal ────────────────────────────────────────────────────────
function JobManagementModal({
    company,
    onClose,
    onSaved,
}: {
    company: Company
    onClose: () => void
    onSaved: () => void
}) {
    const { showToast } = useToast()
    const [mode, setMode] = useState<'options' | 'add' | 'link'>('options')
    const [searching, setSearching] = useState(false)
    const [searchResults, setSearchResults] = useState<LinkedJob[]>([])
    const [searchQuery, setSearchQuery] = useState('')
    const [linking, setLinking] = useState<string | null>(null)

    const searchJobs = async (query: string) => {
        setSearchQuery(query)
        if (query.length < 2) {
            setSearchResults([])
            return
        }
        setSearching(true)
        try {
            const token = localStorage.getItem('token')
            const res = await fetch(`/api/jobs?search=${encodeURIComponent(query)}&pageSize=10`, {
                headers: { Authorization: `Bearer ${token}` },
                credentials: 'include',
            })
            if (res.ok) {
                const data = await res.json()
                // Filter out jobs already linked to this company
                setSearchResults(data.jobs.filter((j: any) => j.companyId !== company.id))
            }
        } catch (err) {
            console.error('Search failed:', err)
        } finally {
            setSearching(false)
        }
    }

    const handleLinkJob = async (jobId: string) => {
        setLinking(jobId)
        try {
            const token = localStorage.getItem('token')
            const res = await fetch(`/api/jobs/${jobId}`, {
                method: 'PATCH',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({
                    companyId: company.id,
                    company: company.name // Ensure the company name matches too
                }),
            })
            if (res.ok) {
                showToast('Job linked successfully', 'success')
                onSaved()
                onClose()
            } else {
                const data = await res.json()
                showToast(data.error || 'Failed to link job', 'error')
            }
        } catch {
            showToast('Network error', 'error')
        } finally {
            setLinking(null)
        }
    }

    return (
        <Modal
            isOpen
            onClose={onClose}
            title={mode === 'add' ? 'Add New Job' : mode === 'link' ? 'Link Existing Job' : 'Manage Jobs'}
            size={mode === 'options' ? 'sm' : 'lg'}
        >
            {mode === 'options' && (
                <div className="space-y-4 py-4">
                    <p className="text-sm text-careerist-text-secondary text-center">How would you like to add a job to {company.name}?</p>
                    <div className="grid grid-cols-1 gap-3">
                        <Button onClick={() => setMode('add')} className="w-full">
                            + Create New Job
                        </Button>
                        <Button variant="secondary" onClick={() => setMode('link')} className="w-full">
                            🔗 Link Existing Job
                        </Button>
                    </div>
                </div>
            )}

            {mode === 'add' && (
                <div className="py-2">
                    <JobForm
                        job={null}
                        initialData={{
                            company: company.name,
                            companyId: company.id,
                            location: company.location || ''
                        }}
                        onSuccess={() => {
                            showToast('Job created and linked', 'success')
                            onSaved()
                            onClose()
                        }}
                        onCancel={() => setMode('options')}
                    />
                </div>
            )}

            {mode === 'link' && (
                <div className="space-y-4 py-2">
                    <div className="flex gap-2">
                        <Input
                            placeholder="Search jobs by title or skills..."
                            value={searchQuery}
                            onChange={(e) => searchJobs(e.target.value)}
                            className="flex-1"
                        />
                        <Button variant="secondary" onClick={() => setMode('options')}>Back</Button>
                    </div>

                    <div className="max-h-[400px] overflow-y-auto space-y-2 pr-2">
                        {searching ? (
                            <div className="flex justify-center py-8">
                                <Spinner size="md" />
                            </div>
                        ) : searchResults.length > 0 ? (
                            searchResults.map((job) => (
                                <div key={job.id} className="flex items-center justify-between p-3 bg-careerist-bg-secondary border border-careerist-border rounded-lg">
                                    <div className="flex-1 min-w-0 mr-4">
                                        <div className="font-semibold text-careerist-text-primary text-sm truncate">{job.title}</div>
                                        <div className="text-xs text-careerist-text-secondary truncate">
                                            {job.company} · {job.location} · {job.jobType}
                                        </div>
                                    </div>
                                    <Button
                                        size="sm"
                                        onClick={() => handleLinkJob(job.id)}
                                        isLoading={linking === job.id}
                                    >
                                        Link
                                    </Button>
                                </div>
                            ))
                        ) : searchQuery.length >= 2 ? (
                            <div className="text-center py-8 text-careerist-text-secondary text-sm">
                                No unlinked jobs found matching "{searchQuery}"
                            </div>
                        ) : (
                            <div className="text-center py-8 text-careerist-text-secondary text-sm">
                                Type at least 2 characters to search for jobs...
                            </div>
                        )}
                    </div>
                </div>
            )}
        </Modal>
    )
}

// ─── Main Detail Page ─────────────────────────────────────────────────────────

type Tab = 'overview' | 'contacts' | 'jobs' | 'notes'

export default function CompanyDetailPage() {
    const router = useRouter()
    const params = useParams()
    const companyId = params?.id as string

    const { showToast } = useToast()
    const { showConfirm, dialogState, closeDialog, handleConfirm } = useConfirmDialog()

    const [company, setCompany] = useState<Company | null>(null)
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState<Tab>('overview')
    const [showEditModal, setShowEditModal] = useState(false)
    const [showContactModal, setShowContactModal] = useState(false)
    const [showJobModal, setShowJobModal] = useState(false)
    const [editingContact, setEditingContact] = useState<CompanyContact | undefined>(undefined)
    const [newNote, setNewNote] = useState('')
    const [addingNote, setAddingNote] = useState(false)
    const [startingOutreach, setStartingOutreach] = useState<string | null>(null)

    const handleStartOutreach = async (contactId: string) => {
        setStartingOutreach(contactId)
        try {
            const token = localStorage.getItem('token')
            const res = await fetch(`/api/companies/${companyId}/contacts/${contactId}/outreach`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
                credentials: 'include',
            })
            if (res.ok) {
                const updatedContact = await res.json()
                showToast('Initial contact marked and sequence started', 'success')
                setCompany((c) => c ? {
                    ...c,
                    contacts: c.contacts.map((x) => x.id === contactId ? { ...x, ...updatedContact } : x)
                } : c)
                load() // Reload to show new follow-ups in jobs/notes if any (actually they appear in follow-ups tab if there was one, but here they might show up in notes if we added logic there)
            } else {
                const data = await res.json()
                showToast(data.error || 'Failed to start outreach', 'error')
            }
        } catch {
            showToast('Network error', 'error')
        } finally {
            setStartingOutreach(null)
        }
    }

    const handleUpdateOutreachStatus = async (contactId: string, status: 'REPLIED' | 'NOT_INTERESTED') => {
        setStartingOutreach(contactId)
        try {
            const token = localStorage.getItem('token')
            const res = await fetch(`/api/companies/${companyId}/contacts/${contactId}/outreach`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ status }),
                credentials: 'include',
            })
            if (res.ok) {
                showToast(`Contact marked as ${status.replace(/_/g, ' ')}`, 'success')
                setCompany((c) => c ? {
                    ...c,
                    contacts: c.contacts.map((x) => x.id === contactId ? { ...x, status } : x)
                } : c)
                load()
            } else {
                const data = await res.json()
                showToast(data.error || 'Failed to update outreach status', 'error')
            }
        } catch {
            showToast('Network error', 'error')
        } finally {
            setStartingOutreach(null)
        }
    }

    const load = useCallback(async () => {
        if (!companyId) return
        setLoading(true)
        try {
            const token = localStorage.getItem('token')
            const res = await fetch(`/api/companies/${companyId}`, {
                headers: { Authorization: `Bearer ${token}` },
                credentials: 'include',
            })
            if (res.ok) {
                setCompany(await res.json())
            } else if (res.status === 404) {
                router.push('/companies')
            }
        } catch {
            showToast('Failed to load company', 'error')
        } finally {
            setLoading(false)
        }
    }, [companyId, router, showToast])

    useEffect(() => { load() }, [load])

    const handleDeleteCompany = () => {
        showConfirm(
            'Delete Company',
            `Delete "${company?.name}"? All contacts, notes, and job links will be removed.`,
            async () => {
                const token = localStorage.getItem('token')
                const res = await fetch(`/api/companies/${companyId}`, {
                    method: 'DELETE',
                    headers: { Authorization: `Bearer ${token}` },
                    credentials: 'include',
                })
                if (res.ok) {
                    showToast('Company deleted', 'success')
                    router.push('/companies')
                } else {
                    showToast('Failed to delete company', 'error')
                }
            },
            { variant: 'danger', confirmText: 'Delete', cancelText: 'Cancel' }
        )
    }

    const handleDeleteContact = (contactId: string, name: string) => {
        showConfirm(
            'Remove Contact',
            `Remove ${name} from this company?`,
            async () => {
                const token = localStorage.getItem('token')
                const res = await fetch(`/api/companies/${companyId}/contacts/${contactId}`, {
                    method: 'DELETE',
                    headers: { Authorization: `Bearer ${token}` },
                    credentials: 'include',
                })
                if (res.ok) {
                    showToast('Contact removed', 'success')
                    setCompany((c) => c ? { ...c, contacts: c.contacts.filter((x) => x.id !== contactId), _count: { ...c._count, contacts: c._count.contacts - 1 } } : c)
                } else {
                    showToast('Failed to remove contact', 'error')
                }
            },
            { variant: 'danger', confirmText: 'Remove', cancelText: 'Cancel' }
        )
    }

    const handleDeleteNote = (noteId: string) => {
        showConfirm('Delete Note', 'Delete this note?', async () => {
            const token = localStorage.getItem('token')
            const res = await fetch(`/api/companies/${companyId}/notes/${noteId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
                credentials: 'include',
            })
            if (res.ok) {
                showToast('Note deleted', 'success')
                setCompany((c) => c ? { ...c, notes: c.notes.filter((n) => n.id !== noteId), _count: { ...c._count, notes: c._count.notes - 1 } } : c)
            } else {
                showToast('Failed to delete note', 'error')
            }
        }, { variant: 'danger', confirmText: 'Delete', cancelText: 'Cancel' })
    }

    const handleAddNote = async () => {
        if (!newNote.trim()) return
        setAddingNote(true)
        try {
            const token = localStorage.getItem('token')
            const res = await fetch(`/api/companies/${companyId}/notes`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ content: newNote }),
            })
            if (res.ok) {
                const note = await res.json()
                showToast('Note added', 'success')
                setCompany((c) => c ? {
                    ...c,
                    notes: [note, ...c.notes],
                    _count: { ...c._count, notes: c._count.notes + 1 },
                } : c)
                setNewNote('')
            } else {
                showToast('Failed to add note', 'error')
            }
        } catch {
            showToast('Network error', 'error')
        } finally {
            setAddingNote(false)
        }
    }

    const handleContactSaved = (contact: CompanyContact) => {
        setCompany((c) => {
            if (!c) return c
            const existing = c.contacts.find((x) => x.id === contact.id)
            if (existing) {
                return { ...c, contacts: c.contacts.map((x) => x.id === contact.id ? contact : x) }
            }
            return { ...c, contacts: [...c.contacts, contact], _count: { ...c._count, contacts: c._count.contacts + 1 } }
        })
    }

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-careerist-primary-yellow border-t-[#1F3A5F]" />
                </div>
            </DashboardLayout>
        )
    }

    if (!company) {
        return (
            <DashboardLayout>
                <div className="text-center py-12">
                    <p className="text-careerist-text-secondary">Company not found</p>
                    <Link href="/companies" className="text-careerist-primary-yellow hover:underline mt-4 inline-block">
                        ← Back to Companies
                    </Link>
                </div>
            </DashboardLayout>
        )
    }

    const tabs: { id: Tab; label: string; count?: number }[] = [
        { id: 'overview', label: 'Overview' },
        { id: 'contacts', label: 'Contacts', count: company._count.contacts },
        { id: 'jobs', label: 'Jobs', count: company._count.jobs },
        { id: 'notes', label: 'Notes', count: company._count.notes },
    ]

    return (
        <DashboardLayout>
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

            {showEditModal && (
                <EditCompanyModal
                    company={company}
                    onClose={() => setShowEditModal(false)}
                    onSaved={(data) => setCompany((c) => c ? { ...c, ...data } : c)}
                />
            )}

            {(showContactModal || editingContact) && (
                <ContactModal
                    companyId={companyId}
                    contact={editingContact}
                    onClose={() => { setShowContactModal(false); setEditingContact(undefined) }}
                    onSaved={handleContactSaved}
                />
            )}

            {showJobModal && (
                <JobManagementModal
                    company={company}
                    onClose={() => setShowJobModal(false)}
                    onSaved={load}
                />
            )}

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-start justify-between">
                    <div>
                        <Link href="/companies" className="text-careerist-primary-yellow hover:underline text-sm mb-2 inline-block">
                            ← Back to Companies
                        </Link>
                        <h1 className="text-3xl font-bold text-careerist-text-primary">{company.name}</h1>
                        <div className="flex flex-wrap items-center gap-3 mt-2">
                            {company.industry && (
                                <span className="text-sm text-careerist-text-secondary">{company.industry}</span>
                            )}
                            {company.location && (
                                <span className="text-sm text-careerist-text-secondary flex items-center gap-1">
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                    {company.location}
                                </span>
                            )}
                            {company.size && (
                                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-careerist-yellow-light text-careerist-primary-navy border border-careerist-yellow">
                                    {SIZE_LABELS[company.size] || company.size}
                                </span>
                            )}
                            {company.website && (
                                <a href={company.website} target="_blank" rel="noopener noreferrer"
                                    className="text-sm text-careerist-primary-yellow hover:underline flex items-center gap-1">
                                    Website ↗
                                </a>
                            )}
                            {company.linkedinUrl && (
                                <a href={company.linkedinUrl} target="_blank" rel="noopener noreferrer"
                                    className="text-sm text-careerist-primary-yellow hover:underline flex items-center gap-1">
                                    LinkedIn ↗
                                </a>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                        <Button variant="secondary" onClick={() => setShowEditModal(true)}>Edit</Button>
                        <Button variant="danger" onClick={handleDeleteCompany}>Delete</Button>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4">
                    <div className="bg-careerist-card border border-careerist-border rounded-xl p-4 text-center">
                        <div className="text-2xl font-bold text-careerist-primary-yellow">{company._count.contacts}</div>
                        <div className="text-xs text-careerist-text-secondary mt-1">Contacts</div>
                    </div>
                    <div className="bg-careerist-card border border-careerist-border rounded-xl p-4 text-center">
                        <div className="text-2xl font-bold text-careerist-text-primary">{company._count.jobs}</div>
                        <div className="text-xs text-careerist-text-secondary mt-1">Linked Jobs</div>
                    </div>
                    <div className="bg-careerist-card border border-careerist-border rounded-xl p-4 text-center">
                        <div className="text-2xl font-bold text-careerist-text-primary">{company._count.notes}</div>
                        <div className="text-xs text-careerist-text-secondary mt-1">Notes</div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="bg-careerist-card border border-careerist-border rounded-xl">
                    <div className="border-b border-careerist-border">
                        <nav className="flex -mb-px overflow-x-auto">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === tab.id
                                        ? 'border-careerist-primary-yellow text-careerist-primary-yellow'
                                        : 'border-transparent text-careerist-text-secondary hover:text-careerist-text-primary hover:border-gray-300'
                                        }`}
                                >
                                    {tab.label}
                                    {tab.count !== undefined && (
                                        <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeTab === tab.id ? 'bg-careerist-primary-yellow text-careerist-primary-navy' : 'bg-gray-200 text-gray-600'}`}>
                                            {tab.count}
                                        </span>
                                    )}
                                </button>
                            ))}
                        </nav>
                    </div>

                    <div className="p-6">
                        {/* Overview Tab */}
                        {activeTab === 'overview' && (
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-medium text-careerist-text-secondary uppercase tracking-wide">Industry</label>
                                        <p className="text-careerist-text-primary mt-1">{company.industry || '—'}</p>
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-careerist-text-secondary uppercase tracking-wide">Location</label>
                                        <p className="text-careerist-text-primary mt-1">{company.location || '—'}</p>
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-careerist-text-secondary uppercase tracking-wide">Company Size</label>
                                        <p className="text-careerist-text-primary mt-1">{company.size ? SIZE_LABELS[company.size] : '—'}</p>
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-careerist-text-secondary uppercase tracking-wide">Website</label>
                                        <p className="mt-1">
                                            {company.website ? (
                                                <a href={company.website} target="_blank" rel="noopener noreferrer" className="text-careerist-primary-yellow hover:underline text-sm">
                                                    {company.website}
                                                </a>
                                            ) : '—'}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-careerist-text-secondary uppercase tracking-wide">LinkedIn</label>
                                        <p className="mt-1">
                                            {company.linkedinUrl ? (
                                                <a href={company.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-careerist-primary-yellow hover:underline text-sm">
                                                    View Profile ↗
                                                </a>
                                            ) : '—'}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-careerist-text-secondary uppercase tracking-wide">Added By</label>
                                        <p className="text-careerist-text-primary mt-1">
                                            {company.createdBy.firstName} {company.createdBy.lastName}
                                        </p>
                                    </div>
                                </div>
                                {company.description && (
                                    <div>
                                        <label className="text-xs font-medium text-careerist-text-secondary uppercase tracking-wide">Description</label>
                                        <p className="text-careerist-text-primary mt-1 whitespace-pre-wrap leading-relaxed">{company.description}</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Contacts Tab */}
                        {activeTab === 'contacts' && (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-semibold text-careerist-text-primary">Contact Persons</h3>
                                    <Button size="sm" onClick={() => { setEditingContact(undefined); setShowContactModal(true) }}>
                                        + Add Contact
                                    </Button>
                                </div>
                                {company.contacts.length === 0 ? (
                                    <div className="text-center py-12 border-2 border-dashed border-careerist-border rounded-xl">
                                        <svg className="w-10 h-10 mx-auto text-careerist-text-secondary mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                        <p className="text-careerist-text-secondary text-sm">No contacts added yet. Add HR, Manager, or Recruiter contacts.</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {company.contacts.map((contact) => (
                                            <div key={contact.id} className="bg-careerist-bg-secondary border border-careerist-border rounded-xl p-4 group hover:border-careerist-primary-yellow transition-colors">
                                                <div className="flex items-start justify-between mb-2">
                                                    <div>
                                                        <div className="font-semibold text-careerist-text-primary">
                                                            {contact.firstName} {contact.lastName}
                                                        </div>
                                                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full mt-1 inline-block ${CONTACT_ROLE_COLORS[contact.role] || 'bg-gray-100 text-gray-700'}`}>
                                                            {contact.role}
                                                        </span>
                                                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full mt-1 ml-2 inline-block ${CONTACT_STATUS_COLORS[contact.status] || 'bg-gray-100 text-gray-600'}`}>
                                                            {contact.status.replace(/_/g, ' ')}
                                                        </span>
                                                    </div>
                                                    <div className="flex flex-col items-end gap-2 shrink-0">
                                                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button
                                                                onClick={() => { setEditingContact(contact); setShowContactModal(true) }}
                                                                className="text-xs text-careerist-primary-yellow hover:underline"
                                                            >
                                                                Edit
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteContact(contact.id, `${contact.firstName} ${contact.lastName}`)}
                                                                className="text-xs text-red-500 hover:underline"
                                                            >
                                                                Remove
                                                            </button>
                                                        </div>
                                                        {contact.status === 'PENDING' && (
                                                            <Button
                                                                size="sm"
                                                                variant="primary"
                                                                onClick={() => handleStartOutreach(contact.id)}
                                                                isLoading={startingOutreach === contact.id}
                                                                className="text-[10px] py-1 h-auto"
                                                            >
                                                                Mark Initial Contact Sent
                                                            </Button>
                                                        )}
                                                        {['INITIAL_CONTACT_SENT', 'FOLLOWING_UP'].includes(contact.status) && (
                                                            <div className="flex gap-2 mt-1">
                                                                <Button
                                                                    size="sm"
                                                                    variant="ghost"
                                                                    onClick={() => handleUpdateOutreachStatus(contact.id, 'REPLIED')}
                                                                    className="text-[10px] py-1 h-auto text-green-600 border-green-200 hover:bg-green-50"
                                                                >
                                                                    Mark Replied
                                                                </Button>
                                                                <Button
                                                                    size="sm"
                                                                    variant="ghost"
                                                                    onClick={() => handleUpdateOutreachStatus(contact.id, 'NOT_INTERESTED')}
                                                                    className="text-[10px] py-1 h-auto text-red-600 border-red-200 hover:bg-red-50"
                                                                >
                                                                    Not Interested
                                                                </Button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="space-y-1.5 mt-3 text-sm">
                                                    {contact.email && (
                                                        <div className="flex items-center gap-2">
                                                            <svg className="w-3.5 h-3.5 text-careerist-text-secondary shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                                            </svg>
                                                            <a href={`mailto:${contact.email}`} className="text-careerist-primary-yellow hover:underline truncate">{contact.email}</a>
                                                        </div>
                                                    )}
                                                    {contact.phone && (
                                                        <div className="flex items-center gap-2">
                                                            <svg className="w-3.5 h-3.5 text-careerist-text-secondary shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                                            </svg>
                                                            <span className="text-careerist-text-primary">{contact.phone}</span>
                                                        </div>
                                                    )}
                                                    {contact.linkedinUrl && (
                                                        <div className="flex items-center gap-2">
                                                            <svg className="w-3.5 h-3.5 text-careerist-text-secondary shrink-0" fill="currentColor" viewBox="0 0 24 24">
                                                                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                                                            </svg>
                                                            <a href={contact.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-careerist-primary-yellow hover:underline text-xs">LinkedIn ↗</a>
                                                        </div>
                                                    )}
                                                    {contact.notes && (
                                                        <p className="text-careerist-text-secondary text-xs mt-2 italic border-t border-careerist-border pt-2">{contact.notes}</p>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Jobs Tab */}
                        {activeTab === 'jobs' && (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-semibold text-careerist-text-primary">Linked Jobs</h3>
                                    <Button size="sm" onClick={() => setShowJobModal(true)}>
                                        + Add/Link Job
                                    </Button>
                                </div>
                                {company.jobs.length === 0 ? (
                                    <div className="text-center py-12 border-2 border-dashed border-careerist-border rounded-xl">
                                        <p className="text-careerist-text-secondary text-sm">No jobs linked to this company yet.</p>
                                        <p className="text-xs text-careerist-text-secondary mt-1">Add a new job or link an existing one to this company.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {company.jobs.map((job) => (
                                            <Link
                                                key={job.id}
                                                href={`/jobs`}
                                                className="flex items-center justify-between p-4 bg-careerist-bg-secondary border border-careerist-border rounded-lg hover:border-careerist-primary-yellow transition-colors"
                                            >
                                                <div>
                                                    <div className="font-semibold text-careerist-text-primary text-sm">{job.title}</div>
                                                    <div className="flex items-center gap-2 text-xs text-careerist-text-secondary mt-1">
                                                        <span>{job.location}</span>
                                                        <span>·</span>
                                                        <span>{job.jobType}</span>
                                                        <span>·</span>
                                                        <span>{new Date(job.createdAt).toLocaleDateString()}</span>
                                                    </div>
                                                </div>
                                                <Badge variant={JOB_STATUS_COLORS[job.status] as any}>{job.status}</Badge>
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Notes Tab */}
                        {activeTab === 'notes' && (
                            <div className="space-y-4">
                                <h3 className="font-semibold text-careerist-text-primary">Internal Notes</h3>
                                {/* Add note input */}
                                <div className="flex gap-3">
                                    <textarea
                                        className="flex-1 border border-careerist-border rounded-lg px-3 py-2 text-sm text-careerist-text-primary bg-careerist-card focus:outline-none focus:ring-2 focus:ring-careerist-primary-yellow resize-none"
                                        rows={2}
                                        value={newNote}
                                        onChange={(e) => setNewNote(e.target.value)}
                                        placeholder="Add a note about this company..."
                                        onKeyDown={(e) => { if (e.key === 'Enter' && e.ctrlKey) handleAddNote() }}
                                    />
                                    <Button onClick={handleAddNote} disabled={addingNote || !newNote.trim()}>
                                        {addingNote ? '...' : 'Add'}
                                    </Button>
                                </div>
                                {/* Notes timeline */}
                                {company.notes.length === 0 ? (
                                    <div className="text-center py-10 text-careerist-text-secondary text-sm">
                                        No notes yet. Add the first note above.
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {company.notes.map((note) => (
                                            <div key={note.id} className="flex gap-3 group">
                                                <div className="w-8 h-8 rounded-full bg-careerist-primary-yellow flex items-center justify-center text-careerist-primary-navy font-bold text-xs shrink-0">
                                                    {note.createdBy.firstName[0]}{note.createdBy.lastName[0]}
                                                </div>
                                                <div className="flex-1 bg-careerist-bg-secondary border border-careerist-border rounded-lg p-3">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <span className="text-xs font-medium text-careerist-text-primary">
                                                            {note.createdBy.firstName} {note.createdBy.lastName}
                                                        </span>
                                                        <div className="flex items-center gap-3">
                                                            <span className="text-xs text-careerist-text-secondary">
                                                                {new Date(note.createdAt).toLocaleString()}
                                                            </span>
                                                            <button
                                                                onClick={() => handleDeleteNote(note.id)}
                                                                className="text-xs text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                                            >
                                                                Delete
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <p className="text-sm text-careerist-text-primary whitespace-pre-wrap">{note.content}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    )
}
