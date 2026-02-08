'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/DashboardLayout'
import { DataTable, Modal, StatsCard, Input, Textarea, Select, Alert, FormActions, PageHeader, Button, Badge, Spinner } from '@/ui'
import Link from 'next/link'
import { formatINR } from '@/lib/currency'

interface Revenue {
  id: string
  amount: string
  status: 'PENDING' | 'PARTIAL' | 'PAID'
  invoiceNumber?: string
  dueDate?: string
  paidDate?: string
  description?: string
  assignedUser: {
    id: string
    firstName: string
    lastName: string
  }
  lead?: {
    id: string
    companyName: string
  }
  client?: {
    id: string
    firstName: string
    lastName: string
  }
  payments?: Array<{ amount: string }>
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pending',
  PARTIAL: 'Partial',
  PAID: 'Paid',
}

export default function RevenuesPage() {
  const router = useRouter()
  const [revenues, setRevenues] = useState<Revenue[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedRevenue, setSelectedRevenue] = useState<Revenue | null>(null)
  const [filters, setFilters] = useState({
    status: '',
    clientId: '',
    startDate: '',
    endDate: '',
  })

  useEffect(() => {
    loadRevenues()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters])

  const loadRevenues = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/login')
        return
      }

      const params = new URLSearchParams()
      if (filters.status) params.append('status', filters.status)
      if (filters.clientId) params.append('clientId', filters.clientId)
      if (filters.startDate) params.append('startDate', new Date(filters.startDate).toISOString())
      if (filters.endDate) params.append('endDate', new Date(filters.endDate).toISOString())

      const response = await fetch(`/api/revenues?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      })

      if (response.ok) {
        const data = await response.json()
        setRevenues(data)
      }
    } catch (err) {
      console.error('Failed to load revenues:', err)
    } finally {
      setLoading(false)
    }
  }

  const totalRevenue = revenues.reduce((sum, r) => sum + parseFloat(r.amount), 0)
  const pendingRevenue = revenues.filter(r => r.status === 'PENDING').reduce((sum, r) => sum + parseFloat(r.amount), 0)
  const paidRevenue = revenues.filter(r => r.status === 'PAID').reduce((sum, r) => sum + parseFloat(r.amount), 0)
  const partialRevenue = revenues.filter(r => r.status === 'PARTIAL').reduce((sum, r) => sum + parseFloat(r.amount), 0)

  const columns = [
    {
      key: 'invoiceNumber',
      header: 'Invoice #',
      render: (revenue: Revenue) => (
        <span className="font-medium text-careerist-text-primary">
          {revenue.invoiceNumber || '-'}
        </span>
      ),
    },
    {
      key: 'amount',
      header: 'Amount (INR)',
      render: (revenue: Revenue) => (
        <span className="font-semibold text-careerist-text-primary">
          {formatINR(revenue.amount)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (revenue: Revenue) => (
        <span className={`px-2 py-1 rounded text-xs font-medium ${
          revenue.status === 'PAID' ? 'bg-green-100 text-green-800' :
          revenue.status === 'PARTIAL' ? 'bg-yellow-100 text-yellow-800' :
          'bg-red-100 text-red-800'
        }`}>
          {STATUS_LABELS[revenue.status]}
        </span>
      ),
    },
    {
      key: 'entity',
      header: 'Related To',
      render: (revenue: Revenue) => (
        <div className="text-sm">
          {revenue.lead && (
            <Link href={`/leads/${revenue.lead.id}`} className="text-careerist-primary-yellow hover:underline">
              Lead: {revenue.lead.companyName}
            </Link>
          )}
          {revenue.client && (
            <Link href={`/clients/${revenue.client.id}`} className="text-careerist-primary-yellow hover:underline">
              Client: {revenue.client.firstName} {revenue.client.lastName}
            </Link>
          )}
          {!revenue.lead && !revenue.client && (
            <span className="text-careerist-text-secondary">-</span>
          )}
        </div>
      ),
    },
    {
      key: 'dueDate',
      header: 'Due Date',
      render: (revenue: Revenue) => (
        <span className="text-sm text-careerist-text-primary">
          {revenue.dueDate ? new Date(revenue.dueDate).toLocaleDateString() : '-'}
        </span>
      ),
    },
    {
      key: 'paidDate',
      header: 'Paid Date',
      render: (revenue: Revenue) => (
        <span className="text-sm text-careerist-text-primary">
          {revenue.paidDate ? new Date(revenue.paidDate).toLocaleDateString() : '-'}
        </span>
      ),
    },
  ]

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-careerist-primary-yellow"></div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-careerist-text-primary">Revenues</h1>
            <p className="mt-2 text-careerist-text-secondary">Track revenue and invoices</p>
          </div>
          <button
            onClick={() => {
              setSelectedRevenue(null)
              setShowCreateModal(true)
            }}
            className="px-4 py-2 bg-careerist-primary-yellow text-careerist-primary-navy rounded-lg hover:bg-careerist-yellow-hover transition-colors font-semibold"
          >
            + Add Revenue
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Total Revenue"
            value={formatINR(totalRevenue)}
            color="blue"
            icon={
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
          <StatsCard
            title="Pending"
            value={formatINR(pendingRevenue)}
            color="orange"
            icon={
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
          <StatsCard
            title="Paid"
            value={formatINR(paidRevenue)}
            color="green"
            icon={
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
          <StatsCard
            title="Partial"
            value={formatINR(partialRevenue)}
            color="orange"
            icon={
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            }
          />
        </div>

        {/* Filters */}
        <div className="bg-careerist-card rounded-lg shadow border border-careerist-border p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-careerist-text-primary mb-2">Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="block w-full px-3 py-2 border border-careerist-border rounded-md focus:outline-none focus:ring-2 focus:ring-careerist-primary-yellow"
              >
                <option value="">All Statuses</option>
                <option value="PENDING">Pending</option>
                <option value="PARTIAL">Partial</option>
                <option value="PAID">Paid</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-careerist-text-primary mb-2">Start Date</label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                className="block w-full px-3 py-2 border border-careerist-border rounded-md focus:outline-none focus:ring-2 focus:ring-careerist-primary-yellow"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-careerist-text-primary mb-2">End Date</label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                className="block w-full px-3 py-2 border border-careerist-border rounded-md focus:outline-none focus:ring-2 focus:ring-careerist-primary-yellow"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={() => setFilters({ status: '', clientId: '', startDate: '', endDate: '' })}
                className="w-full px-4 py-2 border border-careerist-border rounded-md text-careerist-text-primary hover:bg-careerist-yellow-light transition-colors"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        <DataTable
          data={revenues}
          columns={columns}
          searchable
          onRowClick={(revenue) => {
            setSelectedRevenue(revenue)
            setShowCreateModal(true)
          }}
        />

        {showCreateModal && (
          <Modal
            isOpen={showCreateModal}
            onClose={() => {
              setShowCreateModal(false)
              setSelectedRevenue(null)
            }}
            title={selectedRevenue ? 'Edit Revenue' : 'Create Revenue'}
            size="lg"
          >
            <RevenueForm
              revenue={selectedRevenue}
              onSuccess={() => {
                setShowCreateModal(false)
                setSelectedRevenue(null)
                loadRevenues()
              }}
              onCancel={() => {
                setShowCreateModal(false)
                setSelectedRevenue(null)
              }}
            />
          </Modal>
        )}
      </div>
    </DashboardLayout>
  )
}

function RevenueForm({
  revenue,
  onSuccess,
  onCancel,
}: {
  revenue: Revenue | null
  onSuccess: () => void
  onCancel: () => void
}) {
  const [formData, setFormData] = useState({
    amount: revenue?.amount || '',
    status: revenue?.status || 'PENDING',
    invoiceNumber: revenue?.invoiceNumber || '',
    dueDate: revenue?.dueDate ? new Date(revenue.dueDate).toISOString().split('T')[0] : '',
    description: revenue?.description || '',
    leadId: revenue?.lead?.id || '',
    clientId: revenue?.client?.id || '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [leads, setLeads] = useState<Array<{ id: string; companyName: string }>>([])
  const [clients, setClients] = useState<Array<{ id: string; firstName: string; lastName: string }>>([])

  useEffect(() => {
    loadOptions()
  }, [])

  const loadOptions = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const [leadsRes, clientsRes] = await Promise.all([
        fetch('/api/leads', {
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
          credentials: 'include',
        }),
        fetch('/api/clients', {
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
          credentials: 'include',
        }),
      ])

      if (leadsRes.ok) {
        const leadsData = await leadsRes.json()
        setLeads(leadsData)
      }
      if (clientsRes.ok) {
        const clientsData = await clientsRes.json()
        setClients(clientsData)
      }
    } catch (err) {
      console.error('Failed to load options:', err)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const token = localStorage.getItem('token')
      const userData = localStorage.getItem('user')
      const user = userData ? JSON.parse(userData) : null

      const url = revenue ? `/api/revenues/${revenue.id}` : '/api/revenues'
      const method = revenue ? 'PATCH' : 'POST'

      const payload: any = {
        amount: parseFloat(formData.amount),
        status: formData.status,
        invoiceNumber: formData.invoiceNumber || undefined,
        dueDate: formData.dueDate ? new Date(formData.dueDate).toISOString() : undefined,
        description: formData.description || undefined,
        leadId: formData.leadId || undefined,
        clientId: formData.clientId || undefined,
      }

      if (method === 'POST') {
        payload.assignedUserId = user?.id
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        onSuccess()
      } else {
        const data = await response.json()
        const errorMessage = typeof data.error === 'string' 
          ? data.error 
          : Array.isArray(data.error) 
            ? data.error.map((e: { message?: string } | string) => typeof e === 'string' ? e : e.message || 'Error').join(', ')
            : (data.error as { message?: string })?.message || 'Failed to save revenue'
        setError(errorMessage)
      }
    } catch (err) {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <Alert variant="error">{error}</Alert>}

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Amount (INR)"
          type="number"
          step="0.01"
          required
          value={formData.amount}
          onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
          placeholder="Enter amount in INR"
        />
        <Select
          label="Status"
          required
          value={formData.status}
          onChange={(e) => setFormData({ ...formData, status: e.target.value as 'PENDING' | 'PARTIAL' | 'PAID' })}
          options={[
            { value: 'PENDING', label: 'Pending' },
            { value: 'PARTIAL', label: 'Partial' },
            { value: 'PAID', label: 'Paid' },
          ]}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Invoice Number"
          type="text"
          value={formData.invoiceNumber}
          onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
        />
        <Input
          label="Due Date"
          type="date"
          value={formData.dueDate}
          onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Select
          label="Related Lead"
          value={formData.leadId}
          onChange={(e) => setFormData({ ...formData, leadId: e.target.value, clientId: e.target.value ? '' : formData.clientId })}
          options={[
            { value: '', label: 'None' },
            ...leads.map((lead) => ({
              value: lead.id,
              label: lead.companyName,
            })),
          ]}
        />
        <Select
          label="Related Client"
          value={formData.clientId}
          onChange={(e) => setFormData({ ...formData, clientId: e.target.value, leadId: e.target.value ? '' : formData.leadId })}
          options={[
            { value: '', label: 'None' },
            ...clients.map((client) => ({
              value: client.id,
              label: `${client.firstName} ${client.lastName}`,
            })),
          ]}
        />
      </div>

      <Textarea
        label="Description"
        value={formData.description}
        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        rows={3}
      />

      <FormActions
        onCancel={onCancel}
        submitLabel={revenue ? 'Update' : 'Create'}
        isLoading={loading}
      />
    </form>
  )
}

