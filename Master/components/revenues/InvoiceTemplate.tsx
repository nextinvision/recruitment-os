'use client'

import React from 'react'
import { formatINR } from '@/lib/currency'

interface InvoiceItem {
    description: string
    quantity: number
    rate: number
    amount: number
}

interface InvoiceTemplateProps {
    revenue: {
        invoiceNumber: string
        createdAt: string
        dueDate?: string
        client: {
            firstName: string
            lastName: string
            email?: string
            phone?: string
            address?: string
        }
        items: InvoiceItem[]
        subTotal: number
        taxAmount: number
        amount: number
        notes?: string
        terms?: string
    }
}

export const InvoiceTemplate: React.FC<InvoiceTemplateProps> = ({ revenue }) => {
    return (
        <div className="bg-white p-8 max-w-4xl mx-auto text-gray-800 font-sans print:p-0" id="invoice-template">
            {/* Header */}
            <div className="flex justify-between border-b-2 border-careerist-primary-yellow pb-6 mb-8">
                <div>
                    <h1 className="text-4xl font-bold text-careerist-primary-navy uppercase tracking-tighter">Invoice</h1>
                    <p className="text-sm mt-1 text-gray-500">Invoice No: <span className="font-semibold text-gray-900">#{revenue.invoiceNumber}</span></p>
                    <p className="text-sm text-gray-500">Invoice Date: <span className="font-semibold text-gray-900">{new Date(revenue.createdAt).toLocaleDateString()}</span></p>
                </div>
                <div className="text-right">
                    <h2 className="text-2xl font-bold text-careerist-primary-navy">Aspire Global Solutions</h2>
                    <p className="text-sm text-gray-500 max-w-xs ml-auto">
                        Golden Palace, Lokhandwala Township, Kandivali East,<br />
                        Mumbai, Maharashtra, 400101 India
                    </p>
                    <p className="text-sm text-gray-500">hello @careerist.pro | +91 72080 34201</p>
                </div>
            </div>

            {/* Bill To / By */}
            <div className="grid grid-cols-2 gap-8 mb-12">
                <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-sm font-bold text-gray-400 uppercase mb-2">Billed To:</h3>
                    <p className="text-lg font-bold text-careerist-primary-navy">
                        {revenue.client.firstName} {revenue.client.lastName}
                    </p>
                    {revenue.client.address && <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">{revenue.client.address}</p>}
                    <p className="text-sm text-gray-600 mt-1">{revenue.client.email}</p>
                    <p className="text-sm text-gray-600">{revenue.client.phone}</p>
                </div>
                <div className="p-4 border border-gray-100 rounded-lg">
                    <h3 className="text-sm font-bold text-gray-400 uppercase mb-2">Payment Details:</h3>
                    <div className="flex justify-between text-sm py-1 border-b border-gray-50">
                        <span className="text-gray-500">Due Date:</span>
                        <span className="font-semibold">{revenue.dueDate ? new Date(revenue.dueDate).toLocaleDateString() : 'N/A'}</span>
                    </div>
                    <div className="flex justify-between text-sm py-1">
                        <span className="text-gray-500">Total Due:</span>
                        <span className="font-bold text-careerist-primary-navy">{formatINR(revenue.amount)}</span>
                    </div>
                </div>
            </div>

            {/* Items Table */}
            <table className="w-full mb-8">
                <thead>
                    <tr className="bg-careerist-primary-navy text-white text-left">
                        <th className="py-3 px-4 rounded-l-lg">Item Description</th>
                        <th className="py-3 px-4 text-center">Qty</th>
                        <th className="py-3 px-4 text-right">Rate</th>
                        <th className="py-3 px-4 text-right rounded-r-lg">Amount</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {revenue.items.map((item, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                            <td className="py-4 px-4">
                                <p className="font-bold text-gray-900">{item.description}</p>
                            </td>
                            <td className="py-4 px-4 text-center">{item.quantity}</td>
                            <td className="py-4 px-4 text-right">{formatINR(item.rate)}</td>
                            <td className="py-4 px-4 text-right font-bold">{formatINR(item.amount)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Totals */}
            <div className="flex justify-end mb-12">
                <div className="w-64 space-y-2">
                    <div className="flex justify-between py-1 border-b border-gray-100">
                        <span className="text-gray-500">Subtotal:</span>
                        <span className="font-semibold">{formatINR(revenue.subTotal)}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-gray-100">
                        <span className="text-gray-500">Tax:</span>
                        <span className="font-semibold">{formatINR(revenue.taxAmount)}</span>
                    </div>
                    <div className="flex justify-between py-2 text-lg">
                        <span className="font-bold text-careerist-primary-navy">Total (INR):</span>
                        <span className="font-black text-careerist-primary-navy">{formatINR(revenue.amount)}</span>
                    </div>
                </div>
            </div>

            {/* Footer / Notes */}
            <div className="grid grid-cols-2 gap-8 pt-8 border-t border-gray-200 mt-12">
                <div>
                    {revenue.notes && (
                        <div className="mb-4">
                            <h4 className="text-xs font-bold text-gray-400 uppercase mb-1">Notes:</h4>
                            <p className="text-xs text-gray-600 italic">{revenue.notes}</p>
                        </div>
                    )}
                    {revenue.terms && (
                        <div>
                            <h4 className="text-xs font-bold text-gray-400 uppercase mb-1">Terms & Conditions:</h4>
                            <p className="text-[10px] text-gray-500 leading-tight">{revenue.terms}</p>
                        </div>
                    )}
                </div>
                <div className="flex flex-col justify-end items-center text-center">
                    <div className="h-20 w-40 border-b border-gray-300 mb-2"></div>
                    <span className="text-xs font-bold text-careerist-primary-navy uppercase">Authorised Signatory</span>
                </div>
            </div>
        </div>
    )
}
