'use client'

import { useState, useEffect, useRef } from 'react'
import { Input, Select, Textarea, FormActions, Alert, Button } from '@/ui'
import { formatINR } from '@/lib/currency'

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
    const [clients, setClients] = useState<any[]>([])
    const [clientSearchQuery, setClientSearchQuery] = useState('')
    const [clientSearchOpen, setClientSearchOpen] = useState(false)
    const clientPickerRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        loadClients()
    }, [])

    const loadClients = async () => {
        try {
            const token = localStorage.getItem('token')
            const response = await fetch('/api/clients?pageSize=100', { 
                headers: { 'Authorization': `Bearer ${token}` } 
            })
            if (response.ok) {
                const data = await response.json()
                setClients(data.clients || data.data || data || [])
            }
        } catch (err) {
            console.error('Failed to load clients')
        }
    }

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (clientPickerRef.current && !clientPickerRef.current.contains(e.target as Node)) {
                setClientSearchOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const filteredClients = clients.filter(c => {
        const fullName = `${c.firstName} ${c.lastName}`.toLowerCase()
        const email = (c.email || '').toLowerCase()
        const query = clientSearchQuery.toLowerCase()
        return fullName.includes(query) || email.includes(query)
    })

    const selectedClient = clients.find(c => c.id === formData.clientId)

    const updateItem = (index: number, field: keyof InvoiceItem, value: any) => {
        const newItems = [...formData.items]
        newItems[index] = { ...newItems[index], [field]: value }

        if (field === 'quantity' || field === 'rate') {
            newItems[index].amount = (newItems[index].quantity || 0) * (newItems[index].rate || 0)
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
                if (Array.isArray(data)) {
                    // Handle Zod errors
                    const errorMsgs = data.map((err: any) => err.message).join(', ')
                    setError(errorMsgs)
                } else {
                    setError(data.error || 'Failed to save revenue')
                }
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
                <div className="relative" ref={clientPickerRef}>
                    <label className="block text-sm font-medium text-careerist-text-primary mb-1">
                        Related Client <span className="text-red-500">*</span>
                    </label>
                    <div 
                        className="w-full px-3 py-2 border border-careerist-border rounded-md cursor-pointer bg-white flex justify-between items-center"
                        onClick={() => setClientSearchOpen(!clientSearchOpen)}
                    >
                        <span className={selectedClient ? "text-gray-900" : "text-gray-400"}>
                            {selectedClient ? `${selectedClient.firstName} ${selectedClient.lastName}` : "Select Client"}
                        </span>
                        <span className="text-gray-400">▼</span>
                    </div>

                    {clientSearchOpen && (
                        <div className="absolute z-50 mt-1 w-full bg-white border border-careerist-border rounded-md shadow-lg max-h-60 overflow-hidden flex flex-col">
                            <div className="p-2 border-b">
                                <input
                                    autoFocus
                                    type="text"
                                    className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-careerist-yellow"
                                    placeholder="Search by name or email..."
                                    value={clientSearchQuery}
                                    onChange={(e) => setClientSearchQuery(e.target.value)}
                                    onClick={(e) => e.stopPropagation()}
                                />
                            </div>
                            <div className="overflow-y-auto">
                                {filteredClients.length > 0 ? (
                                    filteredClients.map(c => (
                                        <div
                                            key={c.id}
                                            className="px-3 py-2 text-sm hover:bg-careerist-yellow-light cursor-pointer"
                                            onClick={() => {
                                                setFormData({ ...formData, clientId: c.id })
                                                setClientSearchOpen(false)
                                                setClientSearchQuery('')
                                            }}
                                        >
                                            <div className="font-medium">{c.firstName} {c.lastName}</div>
                                            <div className="text-xs text-gray-500">{c.email}</div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="px-3 py-4 text-sm text-center text-gray-500">
                                        No clients found
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                    <input type="hidden" required value={formData.clientId} />
                </div>

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
                                required
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
                    <span className="font-semibold">{formatINR(formData.subTotal)}</span>
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
                    <span>{formatINR(formData.amount)}</span>
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
