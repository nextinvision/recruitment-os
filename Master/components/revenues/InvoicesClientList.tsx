'use client'

import { useState, useEffect } from 'react'
import { DataTable, Badge, Button, Spinner, StatsCard } from '@/ui'
import { formatINR } from '@/lib/currency'
import { useRouter } from 'next/navigation'

interface ClientSummary {
    id: string
    firstName: string
    lastName: string
    email: string | null
    totalInvoices: number
    totalAmount: number
    invoiceStatuses: string[]
    latestInvoice: {
        id: string
        amount: string
        status: string
        dueDate: string | null
    } | null
}

export function InvoicesClientList({ onSelectClient }: { onSelectClient: (clientId: string) => void }) {
    const [summaries, setSummaries] = useState<ClientSummary[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {
        loadSummaries()
    }, [])

    const loadSummaries = async () => {
        try {
            const token = localStorage.getItem('token')
            const response = await fetch('/api/revenues?summary=true', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            })

            if (response.ok) {
                const data = await response.json()
                setSummaries(data)
            } else {
                setError('Failed to load client summaries')
            }
        } catch (err) {
            setError('Network error')
        } finally {
            setLoading(false)
        }
    }

    const columns = [
        {
            key: 'name',
            header: 'Client',
            render: (item: ClientSummary) => (
                <div className="flex flex-col">
                    <span className="font-semibold text-careerist-text-primary">
                        {item.firstName} {item.lastName}
                    </span>
                    <span className="text-xs text-careerist-text-secondary">{item.email || 'No email'}</span>
                </div>
            ),
        },
        {
            key: 'totalInvoices',
            header: 'Invoices',
            render: (item: ClientSummary) => (
                <span className="text-sm">{item.totalInvoices}</span>
            ),
        },
        {
            key: 'totalAmount',
            header: 'Total Amount',
            render: (item: ClientSummary) => (
                <span className="font-semibold text-careerist-text-primary">
                    {formatINR(item.totalAmount)}
                </span>
            ),
        },
        {
            key: 'status',
            header: 'Status',
            render: (item: ClientSummary) => {
                const statuses = item.invoiceStatuses
                const hasPending = statuses.includes('PENDING') || statuses.includes('PARTIAL')
                const allPaid = statuses.every(s => s === 'PAID')

                if (allPaid) return <Badge variant="success">All Paid</Badge>
                if (hasPending) return <Badge variant="warning">Payments Pending</Badge>
                return <Badge variant="neutral">No Status</Badge>
            },
        },
        {
            key: 'actions',
            header: '',
            render: (item: ClientSummary) => (
                <Button
                    variant="secondary"
                    size="sm"
                    onClick={(e) => {
                        e.stopPropagation()
                        onSelectClient(item.id)
                    }}
                >
                    View Invoices
                </Button>
            ),
        },
    ]

    if (loading) return <div className="flex justify-center p-8"><Spinner /></div>
    if (error) return <div className="text-red-500 p-4">{error}</div>

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatsCard
                    title="Clients with Invoices"
                    value={summaries.length.toString()}
                    color="blue"
                />
                <StatsCard
                    title="Total Receivable"
                    value={formatINR(summaries.reduce((sum, s) => sum + s.totalAmount, 0))}
                    color="green"
                />
                <StatsCard
                    title="Active Invoices"
                    value={summaries.reduce((sum, s) => sum + s.totalInvoices, 0).toString()}
                    color="orange"
                />
            </div>

            <DataTable
                data={summaries}
                columns={columns}
                onRowClick={(item) => onSelectClient(item.id)}
                searchable
            />
        </div>
    )
}
