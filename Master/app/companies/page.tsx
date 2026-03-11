'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/DashboardLayout'
import { Button, Input, Select, Modal, useToast, ConfirmDialog, useConfirmDialog, Badge } from '@/ui'

// ─── Types ────────────────────────────────────────────────────────────────────

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
    _count: {
        contacts: number
        notes: number
        jobs: number
    }
}

interface Stats {
    total: number
    totalContacts: number
    withJobs: number
}

const SIZE_LABELS: Record<string, string> = {
    STARTUP: 'Startup',
    SMALL: 'Small',
    MEDIUM: 'Medium',
    LARGE: 'Large',
    ENTERPRISE: 'Enterprise',
}

const SIZE_COLORS: Record<string, string> = {
    STARTUP: 'bg-purple-100 text-purple-800 border-purple-200',
    SMALL: 'bg-blue-100 text-blue-800 border-blue-200',
    MEDIUM: 'bg-teal-100 text-teal-800 border-teal-200',
    LARGE: 'bg-orange-100 text-orange-800 border-orange-200',
    ENTERPRISE: 'bg-red-100 text-red-800 border-red-200',
}

// ─── Create Company Form ───────────────────────────────────────────────────────

function CreateCompanyModal({
    onClose,
    onCreated,
}: {
    onClose: () => void
    onCreated: (c: Company) => void
}) {
    const { showToast } = useToast()
    const [saving, setSaving] = useState(false)
    const [form, setForm] = useState({
        name: '',
        industry: '',
        website: '',
        location: '',
        size: '',
        description: '',
        linkedinUrl: '',
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)
        try {
            const token = localStorage.getItem('token')
            const res = await fetch('/api/companies', {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(form),
            })
            if (res.ok) {
                const data = await res.json()
                showToast('Company created successfully', 'success')
                onCreated(data)
                onClose()
            } else {
                const data = await res.json()
                showToast(data.error || 'Failed to create company', 'error')
            }
        } catch {
            showToast('Network error', 'error')
        } finally {
            setSaving(false)
        }
    }

    return (
        <Modal isOpen onClose={onClose} title="Add Company">
            <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                    label="Company Name *"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    required
                    placeholder="e.g. Acme Corp"
                />
                <div className="grid grid-cols-2 gap-4">
                    <Input
                        label="Industry"
                        value={form.industry}
                        onChange={(e) => setForm((f) => ({ ...f, industry: e.target.value }))}
                        placeholder="e.g. Technology"
                    />
                    <Input
                        label="Location"
                        value={form.location}
                        onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                        placeholder="e.g. Bangalore, India"
                    />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <Input
                        label="Website"
                        value={form.website}
                        onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))}
                        placeholder="https://acme.com"
                    />
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
                <Input
                    label="LinkedIn URL"
                    value={form.linkedinUrl}
                    onChange={(e) => setForm((f) => ({ ...f, linkedinUrl: e.target.value }))}
                    placeholder="https://linkedin.com/company/acme"
                />
                <div>
                    <label className="block text-sm font-medium text-careerist-text-secondary mb-1">Description</label>
                    <textarea
                        className="w-full border border-careerist-border rounded-lg px-3 py-2 text-sm text-careerist-text-primary bg-careerist-card focus:outline-none focus:ring-2 focus:ring-careerist-primary-yellow"
                        rows={3}
                        value={form.description}
                        onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                        placeholder="Brief description of the company..."
                    />
                </div>
                <div className="flex gap-3 justify-end pt-2">
                    <Button variant="secondary" onClick={onClose} type="button">
                        Cancel
                    </Button>
                    <Button type="submit" disabled={saving}>
                        {saving ? 'Creating...' : 'Create Company'}
                    </Button>
                </div>
            </form>
        </Modal>
    )
}

// ─── Company Row (List View) ─────────────────────────────────────────────────

function CompanyRow({ company, onDelete }: { company: Company; onDelete: (id: string) => void }) {
    const router = useRouter()
    const { showConfirm, dialogState, closeDialog, handleConfirm } = useConfirmDialog()

    return (
        <>
            <ConfirmDialog
                isOpen={dialogState.isOpen}
                onClose={closeDialog}
                onConfirm={handleConfirm}
                title={dialogState.title}
                message={dialogState.message}
                variant="danger"
                confirmText="Delete"
                cancelText="Cancel"
            />
            <tr
                className="border-b border-careerist-border hover:bg-careerist-bg-secondary cursor-pointer group transition-colors"
                onClick={() => router.push(`/companies/${company.id}`)}
            >
                {/* Company Name + Location */}
                <td className="px-4 py-3">
                    <div className="font-semibold text-careerist-text-primary group-hover:text-careerist-primary-yellow transition-colors text-sm">
                        {company.name}
                    </div>
                    {company.location && (
                        <div className="text-xs text-careerist-text-secondary flex items-center gap-1 mt-0.5">
                            <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            {company.location}
                        </div>
                    )}
                </td>

                {/* Industry */}
                <td className="px-4 py-3 text-sm text-careerist-text-secondary">
                    {company.industry || <span className="text-careerist-border">—</span>}
                </td>

                {/* Size */}
                <td className="px-4 py-3">
                    {company.size ? (
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${SIZE_COLORS[company.size] || 'bg-gray-100 text-gray-700 border-gray-200'}`}>
                            {SIZE_LABELS[company.size]}
                        </span>
                    ) : <span className="text-careerist-text-secondary text-sm">—</span>}
                </td>

                {/* Contacts */}
                <td className="px-4 py-3 text-center">
                    <span className="text-sm font-semibold text-careerist-text-primary">{company._count.contacts}</span>
                </td>

                {/* Jobs */}
                <td className="px-4 py-3 text-center">
                    <span className="text-sm font-semibold text-careerist-text-primary">{company._count.jobs}</span>
                </td>

                {/* Added Date */}
                <td className="px-4 py-3 text-xs text-careerist-text-secondary whitespace-nowrap">
                    {new Date(company.createdAt).toLocaleDateString()}
                </td>

                {/* Actions */}
                <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity justify-end">
                        {company.website && (
                            <a
                                href={company.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-careerist-primary-yellow hover:underline"
                            >
                                Website ↗
                            </a>
                        )}
                        <button
                            className="text-xs text-red-500 hover:underline"
                            onClick={() =>
                                showConfirm(
                                    'Delete Company',
                                    `Delete "${company.name}"? All contacts and notes will be lost.`,
                                    () => onDelete(company.id)
                                )
                            }
                        >
                            Delete
                        </button>
                    </div>
                </td>
            </tr>
        </>
    )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CompaniesPage() {
    const { showToast } = useToast()
    const [companies, setCompanies] = useState<Company[]>([])
    const [stats, setStats] = useState<Stats | null>(null)
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [industryFilter, setIndustryFilter] = useState('')
    const [sizeFilter, setSizeFilter] = useState('')
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [total, setTotal] = useState(0)
    const [showCreateModal, setShowCreateModal] = useState(false)

    const loadCompanies = useCallback(async () => {
        setLoading(true)
        try {
            const token = localStorage.getItem('token')
            const params = new URLSearchParams()
            if (search) params.set('search', search)
            if (industryFilter) params.set('industry', industryFilter)
            if (sizeFilter) params.set('size', sizeFilter)
            params.set('page', String(page))
            params.set('pageSize', '24')

            const res = await fetch(`/api/companies?${params.toString()}`, {
                headers: { Authorization: `Bearer ${token}` },
                credentials: 'include',
            })
            if (res.ok) {
                const data = await res.json()
                setCompanies(data.companies || [])
                setTotal(data.total || 0)
                setTotalPages(data.totalPages || 1)
            }
        } catch {
            showToast('Failed to load companies', 'error')
        } finally {
            setLoading(false)
        }
    }, [search, industryFilter, sizeFilter, page, showToast])

    const loadStats = useCallback(async () => {
        try {
            const token = localStorage.getItem('token')
            const res = await fetch('/api/companies?stats=true', {
                headers: { Authorization: `Bearer ${token}` },
                credentials: 'include',
            })
            if (res.ok) setStats(await res.json())
        } catch { }
    }, [])

    useEffect(() => {
        loadCompanies()
    }, [loadCompanies])

    useEffect(() => {
        loadStats()
    }, [loadStats])

    const handleDelete = async (id: string) => {
        try {
            const token = localStorage.getItem('token')
            const res = await fetch(`/api/companies/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
                credentials: 'include',
            })
            if (res.ok) {
                showToast('Company deleted', 'success')
                setCompanies((prev) => prev.filter((c) => c.id !== id))
                loadStats()
            } else {
                showToast('Failed to delete company', 'error')
            }
        } catch {
            showToast('Network error', 'error')
        }
    }

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        setPage(1)
        loadCompanies()
    }

    return (
        <DashboardLayout>
            {showCreateModal && (
                <CreateCompanyModal
                    onClose={() => setShowCreateModal(false)}
                    onCreated={(c) => {
                        setCompanies((prev) => [c, ...prev])
                        setTotal((t) => t + 1)
                        loadStats()
                    }}
                />
            )}

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-careerist-text-primary">Company Database</h1>
                        <p className="text-careerist-text-secondary mt-1">
                            Track companies and their contacts for outreach campaigns
                        </p>
                    </div>
                    <Button onClick={() => setShowCreateModal(true)}>
                        <span className="flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Add Company
                        </span>
                    </Button>
                </div>

                {/* Stats */}
                {stats && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="bg-careerist-card border border-careerist-border rounded-xl p-4">
                            <div className="text-xs font-medium text-careerist-text-secondary uppercase tracking-wide mb-1">Total Companies</div>
                            <div className="text-3xl font-bold text-careerist-text-primary">{stats.total}</div>
                        </div>
                        <div className="bg-careerist-card border border-careerist-border rounded-xl p-4">
                            <div className="text-xs font-medium text-careerist-text-secondary uppercase tracking-wide mb-1">Total Contacts</div>
                            <div className="text-3xl font-bold text-careerist-primary-yellow">{stats.totalContacts}</div>
                        </div>
                        <div className="bg-careerist-card border border-careerist-border rounded-xl p-4">
                            <div className="text-xs font-medium text-careerist-text-secondary uppercase tracking-wide mb-1">Companies with Jobs</div>
                            <div className="text-3xl font-bold text-emerald-500">{stats.withJobs}</div>
                        </div>
                    </div>
                )}

                {/* Filters */}
                <div className="bg-careerist-card border border-careerist-border rounded-xl p-4">
                    <form onSubmit={handleSearch} className="flex flex-wrap gap-3 items-end">
                        <div className="flex-1 min-w-[200px]">
                            <Input
                                label="Search"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search by name, industry, location..."
                            />
                        </div>
                        <div className="w-40">
                            <Input
                                label="Industry"
                                value={industryFilter}
                                onChange={(e) => setIndustryFilter(e.target.value)}
                                placeholder="e.g. Technology"
                            />
                        </div>
                        <div className="w-40">
                            <Select
                                label="Size"
                                value={sizeFilter}
                                onChange={(e) => setSizeFilter(e.target.value)}
                                options={[
                                    { value: '', label: 'All Sizes' },
                                    { value: 'STARTUP', label: 'Startup' },
                                    { value: 'SMALL', label: 'Small' },
                                    { value: 'MEDIUM', label: 'Medium' },
                                    { value: 'LARGE', label: 'Large' },
                                    { value: 'ENTERPRISE', label: 'Enterprise' },
                                ]}
                            />
                        </div>
                        <Button type="submit" variant="secondary">Search</Button>
                        {(search || industryFilter || sizeFilter) && (
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={() => {
                                    setSearch('')
                                    setIndustryFilter('')
                                    setSizeFilter('')
                                    setPage(1)
                                }}
                            >
                                Clear
                            </Button>
                        )}
                    </form>
                </div>

                {/* Results */}
                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-careerist-primary-yellow border-t-[#1F3A5F]" />
                    </div>
                ) : companies.length === 0 ? (
                    <div className="text-center py-20 border-2 border-dashed border-careerist-border rounded-xl">
                        <svg className="w-12 h-12 mx-auto text-careerist-text-secondary mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        <p className="text-careerist-text-secondary font-medium">No companies found</p>
                        <p className="text-sm text-careerist-text-secondary mt-1">Add your first company to start tracking outreach.</p>
                        <Button className="mt-4" onClick={() => setShowCreateModal(true)}>Add Company</Button>
                    </div>
                ) : (
                    <>
                        <div className="flex items-center justify-between text-sm text-careerist-text-secondary mb-2">
                            <span>Showing {companies.length} of {total} companies</span>
                        </div>

                        {/* List Table */}
                        <div className="bg-careerist-card border border-careerist-border rounded-xl overflow-hidden">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-careerist-border bg-careerist-bg-secondary">
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-careerist-text-secondary uppercase tracking-wide">Company</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-careerist-text-secondary uppercase tracking-wide">Industry</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-careerist-text-secondary uppercase tracking-wide">Size</th>
                                        <th className="px-4 py-3 text-center text-xs font-semibold text-careerist-text-secondary uppercase tracking-wide">Contacts</th>
                                        <th className="px-4 py-3 text-center text-xs font-semibold text-careerist-text-secondary uppercase tracking-wide">Jobs</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-careerist-text-secondary uppercase tracking-wide">Added</th>
                                        <th className="px-4 py-3"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {companies.map((company) => (
                                        <CompanyRow key={company.id} company={company} onDelete={handleDelete} />
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-center gap-2 pt-2">
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    disabled={page === 1}
                                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                                >
                                    Previous
                                </Button>
                                <span className="text-sm text-careerist-text-secondary">
                                    Page {page} of {totalPages}
                                </span>
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    disabled={page === totalPages}
                                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                >
                                    Next
                                </Button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </DashboardLayout>
    )
}
