'use client'

import { useState, useEffect } from 'react'
import { DataTable, Badge, Button, Spinner, Modal } from '@/ui'
import { formatINR } from '@/lib/currency'
import { InvoiceTemplate } from './InvoiceTemplate'

interface Revenue {
    id: string
    amount: string
    status: 'PENDING' | 'PARTIAL' | 'PAID'
    invoiceNumber?: string
    dueDate?: string
    paidDate?: string
    description?: string
    items?: Array<{ description: string, quantity: number, rate: number, amount: number }>
    subTotal?: string
    taxAmount?: string
    notes?: string
    terms?: string
    createdAt: string
    client: any
}

export function InvoiceList({
    clientId,
    clientName,
    onBack,
    onEditRevenue
}: {
    clientId: string
    clientName: string
    onBack: () => void
    onEditRevenue: (revenue: any) => void
}) {
    const [revenues, setRevenues] = useState<Revenue[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [showPreview, setShowPreview] = useState(false)
    const [previewInvoice, setPreviewInvoice] = useState<any>(null)

    useEffect(() => {
        loadRevenues()
    }, [clientId])

    const loadRevenues = async () => {
        try {
            const token = localStorage.getItem('token')
            const response = await fetch(`/api/revenues?clientId=${clientId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            })

            if (response.ok) {
                const data = await response.json()
                setRevenues(data)
            } else {
                setError('Failed to load invoices')
            }
        } catch (err) {
            setError('Network error')
        } finally {
            setLoading(false)
        }
    }

    const handlePrint = (item: Revenue) => {
        setPreviewInvoice({
            ...item,
            amount: parseFloat(item.amount),
            subTotal: parseFloat(item.subTotal || '0'),
            taxAmount: parseFloat(item.taxAmount || '0'),
            items: item.items || []
        })
        setShowPreview(true)
    }

    const triggerPrint = () => {
        const printContent = document.getElementById('invoice-template');
        if (!printContent) return;

        const windowUrl = 'about:blank';
        const uniqueName = new Date();
        const windowName = 'Print' + uniqueName.getTime();
        const printWindow = window.open(windowUrl, windowName, 'left=50000,top=50000,width=0,height=0');

        if (printWindow) {
            printWindow.document.write('<html><head><title>Print Invoice</title>');
            printWindow.document.write('<script src="https://cdn.tailwindcss.com"></script>');
            printWindow.document.write('<style>@media print { body { -webkit-print-color-adjust: exact; } }</style>');
            printWindow.document.write('</head><body class="bg-white">');
            printWindow.document.write(printContent.innerHTML);
            printWindow.document.write('</body></html>');
            printWindow.document.close();
            printWindow.focus();
            setTimeout(() => {
                printWindow.print();
                printWindow.close();
            }, 750);
        }
    }

    const columns = [
        {
            key: 'invoiceNumber',
            header: 'Invoice #',
            render: (item: Revenue) => (
                <span className="font-medium text-careerist-text-primary">{item.invoiceNumber || '-'}</span>
            ),
        },
        {
            key: 'amount',
            header: 'Amount',
            render: (item: Revenue) => (
                <span className="font-semibold">{formatINR(item.amount)}</span>
            ),
        },
        {
            key: 'status',
            header: 'Status',
            render: (item: Revenue) => (
                <Badge
                    variant={
                        item.status === 'PAID' ? 'success' :
                            item.status === 'PARTIAL' ? 'warning' :
                                'error'
                    }
                >
                    {item.status}
                </Badge>
            ),
        },
        {
            key: 'dueDate',
            header: 'Due Date',
            render: (item: Revenue) => (
                <span className="text-sm">
                    {item.dueDate ? new Date(item.dueDate).toLocaleDateString() : '-'}
                </span>
            ),
        },
        {
            key: 'actions',
            header: '',
            render: (item: Revenue) => (
                <div className="flex gap-2">
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={(e) => {
                            e.stopPropagation()
                            handlePrint(item)
                        }}
                    >
                        Invoice
                    </Button>
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={(e) => {
                            e.stopPropagation()
                            onEditRevenue(item)
                        }}
                    >
                        Edit
                    </Button>
                </div>
            ),
        },
    ]

    if (loading) return <div className="flex justify-center p-8"><Spinner /></div>
    if (error) return <div className="text-red-500 p-4">{error}</div>

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="secondary" onClick={onBack}>
                        ← Back to Clients
                    </Button>
                    <h2 className="text-xl font-bold text-careerist-text-primary">
                        Invoices for {clientName}
                    </h2>
                </div>
                <Button onClick={() => onEditRevenue({ clientId })}>
                    + Add Installment
                </Button>
            </div>

            <DataTable
                data={revenues}
                columns={columns}
                onRowClick={(item) => onEditRevenue(item)}
            />

            {showPreview && previewInvoice && (
                <Modal
                    isOpen={showPreview}
                    onClose={() => setShowPreview(false)}
                    title="Invoice Preview"
                    size="xl"
                >
                    <div className="space-y-4">
                        <div className="flex justify-end print:hidden">
                            <Button onClick={triggerPrint}>
                                Print / Download PDF
                            </Button>
                        </div>
                        <div className="overflow-auto border border-gray-200 rounded shadow-inner bg-gray-50 p-4">
                            <InvoiceTemplate revenue={previewInvoice} />
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    )
}
