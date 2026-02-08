'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/DashboardLayout'
import { DataTable, Modal, StatsCard, Input, Textarea, Select, Alert, FormActions } from '@/ui'
import Link from 'next/link'
import { formatINR } from '@/lib/currency'

interface Payment {
  id: string
  amount: string
  paymentDate: string
  paymentMethod?: string
  reference?: string
  notes?: string
  revenue: {
    id: string
    amount: string
    invoiceNumber?: string
  }
  client: {
    id: string
    firstName: string
    lastName: string
  }
  assignedUser: {
    id: string
    firstName: string
    lastName: string
  }
}

export default function PaymentsPage() {
  const router = useRouter()
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null)
  const [filters, setFilters] = useState({
    clientId: '',
    revenueId: '',
    startDate: '',
    endDate: '',
  })

  useEffect(() => {
    loadPayments()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters])

  const loadPayments = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/login')
        return
      }

      const params = new URLSearchParams()
      if (filters.clientId) params.append('clientId', filters.clientId)
      if (filters.revenueId) params.append('revenueId', filters.revenueId)
      if (filters.startDate) params.append('startDate', new Date(filters.startDate).toISOString())
      if (filters.endDate) params.append('endDate', new Date(filters.endDate).toISOString())

      const response = await fetch(`/api/payments?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      })

      if (response.ok) {
        const data = await response.json()
        setPayments(data)
      }
    } catch (err) {
      console.error('Failed to load payments:', err)
    } finally {
      setLoading(false)
    }
  }

  const totalPayments = payments.reduce((sum, p) => sum + parseFloat(p.amount), 0)
  const thisMonthPayments = payments.filter(p => {
    const paymentDate = new Date(p.paymentDate)
    const now = new Date()
    return paymentDate.getMonth() === now.getMonth() && paymentDate.getFullYear() === now.getFullYear()
  }).reduce((sum, p) => sum + parseFloat(p.amount), 0)

  const columns = [
    {
      key: 'amount',
      header: 'Amount (INR)',
      render: (payment: Payment) => (
        <span className="font-semibold text-careerist-text-primary">
          {formatINR(payment.amount)}
        </span>
      ),
    },
    {
      key: 'revenue',
      header: 'Revenue',
      render: (payment: Payment) => (
        <div className="text-sm">
          <Link href={`/revenues`} className="text-careerist-primary-yellow hover:underline">
            {payment.revenue.invoiceNumber || `Revenue #${payment.revenue.id.slice(0, 8)}`}
          </Link>
          <div className="text-careerist-text-secondary text-xs">
            {formatINR(payment.revenue.amount)}
          </div>
        </div>
      ),
    },
    {
      key: 'client',
      header: 'Client',
      render: (payment: Payment) => (
        <Link href={`/clients/${payment.client.id}`} className="text-careerist-primary-yellow hover:underline text-sm">
          {payment.client.firstName} {payment.client.lastName}
        </Link>
      ),
    },
    {
      key: 'paymentDate',
      header: 'Payment Date',
      render: (payment: Payment) => (
        <span className="text-sm text-careerist-text-primary">
          {new Date(payment.paymentDate).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: 'paymentMethod',
      header: 'Method',
      render: (payment: Payment) => (
        <span className="text-sm text-careerist-text-primary">
          {payment.paymentMethod || '-'}
        </span>
      ),
    },
    {
      key: 'reference',
      header: 'Reference',
      render: (payment: Payment) => (
        <span className="text-sm text-careerist-text-primary">
          {payment.reference || '-'}
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
            <h1 className="text-3xl font-bold text-careerist-text-primary">Payments</h1>
            <p className="mt-2 text-careerist-text-secondary">Track payment receipts and transactions</p>
          </div>
          <button
            onClick={() => {
              setSelectedPayment(null)
              setShowCreateModal(true)
            }}
            className="px-4 py-2 bg-careerist-primary-yellow text-careerist-primary-navy rounded-lg hover:bg-careerist-yellow-hover transition-colors font-semibold"
          >
            + Record Payment
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <StatsCard
            title="Total Payments"
            value={formatINR(totalPayments)}
            color="blue"
            icon={
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            }
          />
          <StatsCard
            title="This Month"
            value={formatINR(thisMonthPayments)}
            color="green"
            icon={
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            }
          />
        </div>

        {/* Filters */}
        <div className="bg-careerist-card rounded-lg shadow border border-careerist-border p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                onClick={() => setFilters({ clientId: '', revenueId: '', startDate: '', endDate: '' })}
                className="w-full px-4 py-2 border border-careerist-border rounded-md text-careerist-text-primary hover:bg-careerist-yellow-light transition-colors"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        <DataTable
          data={payments}
          columns={columns}
          searchable
          onRowClick={(payment) => {
            setSelectedPayment(payment)
            setShowCreateModal(true)
          }}
        />

        {showCreateModal && (
          <Modal
            isOpen={showCreateModal}
            onClose={() => {
              setShowCreateModal(false)
              setSelectedPayment(null)
            }}
            title={selectedPayment ? 'Edit Payment' : 'Record Payment'}
            size="lg"
          >
            <PaymentForm
              payment={selectedPayment}
              onSuccess={() => {
                setShowCreateModal(false)
                setSelectedPayment(null)
                loadPayments()
              }}
              onCancel={() => {
                setShowCreateModal(false)
                setSelectedPayment(null)
              }}
            />
          </Modal>
        )}
      </div>
    </DashboardLayout>
  )
}

function PaymentForm({
  payment,
  onSuccess,
  onCancel,
}: {
  payment: Payment | null
  onSuccess: () => void
  onCancel: () => void
}) {
  const [formData, setFormData] = useState({
    amount: payment?.amount || '',
    paymentDate: payment?.paymentDate ? new Date(payment.paymentDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    paymentMethod: payment?.paymentMethod || '',
    reference: payment?.reference || '',
    notes: payment?.notes || '',
    revenueId: payment?.revenue.id || '',
    clientId: payment?.client.id || '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [revenues, setRevenues] = useState<Array<{ id: string; amount: string; invoiceNumber?: string }>>([])
  const [clients, setClients] = useState<Array<{ id: string; firstName: string; lastName: string }>>([])

  useEffect(() => {
    loadOptions()
  }, [])

  const loadOptions = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const [revenuesRes, clientsRes] = await Promise.all([
        fetch('/api/revenues', {
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
          credentials: 'include',
        }),
        fetch('/api/clients', {
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
          credentials: 'include',
        }),
      ])

      if (revenuesRes.ok) {
        const revenuesData = await revenuesRes.json()
        setRevenues(revenuesData)
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

      const url = payment ? `/api/payments/${payment.id}` : '/api/payments'
      const method = payment ? 'PATCH' : 'POST'

      const payload: Record<string, unknown> = {
        amount: parseFloat(formData.amount),
        paymentDate: new Date(formData.paymentDate).toISOString(),
        paymentMethod: formData.paymentMethod || undefined,
        reference: formData.reference || undefined,
        notes: formData.notes || undefined,
        revenueId: formData.revenueId,
        clientId: formData.clientId,
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
            : (data.error as { message?: string })?.message || 'Failed to save payment'
        setError(errorMessage)
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
        <Input
          label="Payment Date"
          type="date"
          required
          value={formData.paymentDate}
          onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Select
          label="Revenue"
          required
          value={formData.revenueId}
          onChange={(e) => setFormData({ ...formData, revenueId: e.target.value })}
          options={[
            { value: '', label: 'Select Revenue' },
            ...revenues.map((revenue) => ({
              value: revenue.id,
              label: `${revenue.invoiceNumber || `Revenue #${revenue.id.slice(0, 8)}`} - ${formatINR(revenue.amount)}`,
            })),
          ]}
        />
        <Select
          label="Client"
          required
          value={formData.clientId}
          onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
          options={[
            { value: '', label: 'Select Client' },
            ...clients.map((client) => ({
              value: client.id,
              label: `${client.firstName} ${client.lastName}`,
            })),
          ]}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Select
          label="Payment Method"
          value={formData.paymentMethod}
          onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
          options={[
            { value: '', label: 'Select Method' },
            { value: 'Bank Transfer', label: 'Bank Transfer' },
            { value: 'Credit Card', label: 'Credit Card' },
            { value: 'Cash', label: 'Cash' },
            { value: 'Check', label: 'Check' },
            { value: 'Other', label: 'Other' },
          ]}
        />
        <Input
          label="Reference Number"
          type="text"
          value={formData.reference}
          onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
        />
      </div>

      <Textarea
        label="Notes"
        value={formData.notes}
        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
        rows={3}
      />

      <FormActions
        onCancel={onCancel}
        submitLabel={payment ? 'Update' : 'Record'}
        isLoading={loading}
      />
    </form>
  )
}

