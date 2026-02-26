'use client'

import { useState, useEffect } from 'react'
import { Input, Select, Textarea, FormActions, Alert, Button } from '@/ui'

interface InvoiceItem {
    description: string
    quantity: number
    rate: number
    amount: number
}

interface RevenueFormProps {
    revenue: any | null
    initialClientId?: string
    onSuccess: () => void
    onCancel: () => void
}

export function RevenueForm({
    revenue,
    initialClientId,
    onSuccess,
    onCancel,
}: RevenueFormProps) {
    const [formData, setFormData] = useState({
        amount: revenue?.amount || 0,
        status: revenue?.status || 'PENDING',
        invoiceNumber: revenue?.invoiceNumber || '',
        dueDate: revenue?.dueDate ? new Date(revenue.dueDate).toISOString().split('T')[0] : '',
        description: revenue?.description || '',
        leadId: revenue?.lead?.id || '',
        clientId: initialClientId || revenue?.client?.id || '',
        items: (revenue?.items as InvoiceItem[]) || [{ description: '', quantity: 1, rate: 0, amount: 0 }],
        subTotal: revenue?.subTotal || 0,
        taxAmount: revenue?.taxAmount || 0,
        notes: revenue?.notes || '',
        terms: revenue?.terms || '',
    })
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [leads, setLeads] = useState<any[]>([])
    const [clients, setClients] = useState<any[]>([])

    useEffect(() => {
        loadOptions()
    }, [])

    const loadOptions = async () => {
        try {
            const token = localStorage.getItem('token')
            const [leadsRes, clientsRes] = await Promise.all([
                fetch('/api/leads', { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch('/api/clients', { headers: { 'Authorization': `Bearer ${token}` } }),
            ])

            if (leadsRes.ok) {
                const data = await leadsRes.json()
                setLeads(Array.isArray(data) ? data : (data.leads || data.data || []))
            }
            if (clientsRes.ok) {
                const data = await clientsRes.json()
                setClients(Array.isArray(data) ? data : (data.clients || data.data || []))
            }
        } catch (err) {
            console.error('Failed to load options')
        }
    }

    const updateItem = (index: number, field: keyof InvoiceItem, value: any) => {
        const newItems = [...formData.items]
        newItems[index] = { ...newItems[index], [field]: value }

        if (field === 'quantity' || field === 'rate') {
            newItems[index].amount = newItems[index].quantity * newItems[index].rate
        }

        const subTotal = newItems.reduce((sum, item) => sum + item.amount, 0)
        const totalAmount = subTotal + (parseFloat(formData.taxAmount.toString()) || 0)

        setFormData({ ...formData, items: newItems, subTotal, amount: totalAmount })
    }

    const addItem = () => {
        setFormData({
            ...formData,
            items: [...formData.items, { description: '', quantity: 1, rate: 0, amount: 0 }]
        })
    }

    const removeItem = (index: number) => {
        const newItems = formData.items.filter((_, i) => i !== index)
        const subTotal = newItems.reduce((sum, item) => sum + item.amount, 0)
        const totalAmount = subTotal + (parseFloat(formData.taxAmount.toString()) || 0)
        setFormData({ ...formData, items: newItems, subTotal, amount: totalAmount })
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        try {
            const token = localStorage.getItem('token')
            const userData = localStorage.getItem('user')
            const user = userData ? JSON.parse(userData) : null

            const url = revenue?.id ? `/api/revenues/${revenue.id}` : '/api/revenues'
            const method = revenue?.id ? 'PATCH' : 'POST'

            const payload = {
                ...formData,
                amount: parseFloat(formData.amount.toString()),
                subTotal: parseFloat(formData.subTotal.toString()),
                taxAmount: parseFloat(formData.taxAmount.toString()),
                dueDate: formData.dueDate ? new Date(formData.dueDate).toISOString() : undefined,
                assignedUserId: user?.id,
            }

            const response = await fetch(url, {
                method,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            })

            if (response.ok) {
                onSuccess()
            } else {
                const data = await response.json()
                setError(data.error || 'Failed to save revenue')
            }
        } catch (err) {
            setError('Network error')
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {error && <Alert variant="error">{error}</Alert>}

            <div className="grid grid-cols-2 gap-4">
                <Input
                    label="Invoice Number"
                    value={formData.invoiceNumber}
                    onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
                    placeholder="INV-202X-001"
                />
                <Input
                    label="Due Date"
                    type="date"
                    required
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <Select
                    label="Related Client"
                    value={formData.clientId}
                    onChange={(e) => setFormData({ ...formData, clientId: e.target.value, leadId: '' })}
                    options={[
                        { value: '', label: 'Select Client' },
                        ...clients.map(c => ({ value: c.id, label: `${c.firstName} ${c.lastName}` }))
                    ]}
                />
                <Select
                    label="Status"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    options={[
                        { value: 'PENDING', label: 'Pending' },
                        { value: 'PARTIAL', label: 'Partial' },
                        { value: 'PAID', label: 'Paid' },
                    ]}
                />
            </div>

            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-careerist-text-secondary">
                        Line Items
                    </h3>
                    <Button type="button" variant="secondary" size="sm" onClick={addItem}>
                        + Add Item
                    </Button>
                </div>

                {formData.items.map((item, index) => (
                    <div key={index} className="grid grid-cols-12 gap-2 items-end border-b pb-4 border-careerist-border">
                        <div className="col-span-5">
                            <Input
                                label={index === 0 ? "Description" : ""}
                                value={item.description}
                                onChange={(e) => updateItem(index, 'description', e.target.value)}
                                placeholder="Service name"
                            />
                        </div>
                        <div className="col-span-2">
                            <Input
                                label={index === 0 ? "Qty" : ""}
                                type="number"
                                value={item.quantity}
                                onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value))}
                            />
                        </div>
                        <div className="col-span-2">
                            <Input
                                label={index === 0 ? "Rate" : ""}
                                type="number"
                                value={item.rate}
                                onChange={(e) => updateItem(index, 'rate', parseFloat(e.target.value))}
                            />
                        </div>
                        <div className="col-span-2">
                            <Input
                                label={index === 0 ? "Amount" : ""}
                                type="number"
                                disabled
                                value={item.amount}
                            />
                        </div>
                        <div className="col-span-1">
                            {formData.items.length > 1 && (
                                <button
                                    type="button"
                                    onClick={() => removeItem(index)}
                                    className="text-red-500 hover:text-red-700 p-2"
                                >
                                    ✕
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            <div className="flex flex-col items-end space-y-2 border-t pt-4 border-careerist-border">
                <div className="flex justify-between w-full max-w-xs text-sm">
                    <span>Subtotal:</span>
                    <span className="font-semibold">₹{formData.subTotal.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between w-full max-w-xs text-sm items-center">
                    <span>Tax Amount:</span>
                    <input
                        type="number"
                        className="w-24 px-2 py-1 border border-careerist-border rounded text-right"
                        value={formData.taxAmount}
                        onChange={(e) => {
                            const tax = parseFloat(e.target.value) || 0
                            setFormData({ ...formData, taxAmount: tax, amount: formData.subTotal + tax })
                        }}
                    />
                </div>
                <div className="flex justify-between w-full max-w-xs text-lg font-bold">
                    <span>Total:</span>
                    <span>₹{formData.amount.toLocaleString('en-IN')}</span>
                </div>
            </div>

            <Textarea
                label="Notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional information..."
            />

            <FormActions
                onCancel={onCancel}
                isLoading={loading}
                submitLabel={revenue?.id ? 'Update' : 'Create'}
            />
        </form>
    )
}
