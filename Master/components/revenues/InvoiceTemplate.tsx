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

const numberToWords = (num: number): string => {
    if (num === 0) return 'ZERO RUPEES ONLY';

    const a = ['', 'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE', 'TEN', 'ELEVEN', 'TWELVE', 'THIRTEEN', 'FOURTEEN', 'FIFTEEN', 'SIXTEEN', 'SEVENTEEN', 'EIGHTEEN', 'NINETEEN'];
    const b = ['', '', 'TWENTY', 'THIRTY', 'FORTY', 'FIFTY', 'SIXTY', 'SEVENTY', 'EIGHTY', 'NINETY'];

    const numInt = Math.floor(num);

    const convertLessThanOneThousand = (n: number): string => {
        if (n === 0) return '';
        let res = '';
        if (n >= 100) {
            res += a[Math.floor(n / 100)] + ' HUNDRED ';
            n %= 100;
        }
        if (n >= 20) {
            res += b[Math.floor(n / 10)] + ' ';
            if (n % 10 > 0) {
                res += a[n % 10] + ' ';
            }
        } else if (n > 0) {
            res += a[n] + ' ';
        }
        return res;
    }

    let result = '';
    let n = numInt;

    if (n >= 10000000) {
        result += convertLessThanOneThousand(Math.floor(n / 10000000)) + 'CRORE ';
        n %= 10000000;
    }

    if (n >= 100000) {
        result += convertLessThanOneThousand(Math.floor(n / 100000)) + 'LAKH ';
        n %= 100000;
    }

    if (n >= 1000) {
        result += convertLessThanOneThousand(Math.floor(n / 1000)) + 'THOUSAND ';
        n %= 1000;
    }

    result += convertLessThanOneThousand(n);

    return result.replace(/\s+/g, ' ').trim() + ' RUPEES ONLY';
}

export const InvoiceTemplate: React.FC<InvoiceTemplateProps> = ({ revenue }) => {
    return (
        <div className="bg-white p-12 max-w-4xl mx-auto text-gray-800 font-sans print:p-0" id="invoice-template">
            {/* Header */}
            <div className="flex justify-between items-start mb-10">
                <div>
                    <h1 className="text-4xl font-medium mb-6" style={{ color: '#7B52C3' }}>Invoice</h1>
                    <div className="grid grid-cols-[110px_1fr] gap-x-4 gap-y-2 text-sm">
                        <span className="text-gray-500">Invoice No #</span>
                        <span className="font-semibold text-gray-900">{revenue.invoiceNumber}</span>
                        <span className="text-gray-500">Invoice Date</span>
                        <span className="font-semibold text-gray-900">
                            {new Date(revenue.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                    </div>
                </div>
                <div className="text-white p-6 rounded flex items-center justify-center w-[220px] h-[80px]" style={{ backgroundColor: '#1f3a5f' }}>
                    <div className="flex items-center space-x-2">
                        <img src="/logo.png" alt="Logo" className="h-20 w-auto object-contain" />
                    </div>
                </div>
            </div>

            {/* Bill To / By */}
            <div className="flex gap-4 mb-10">
                <div className="flex-1 p-6 rounded" style={{ backgroundColor: '#EDE7F6' }}>
                    <h2 className="text-[24px] font-normal mb-3 tracking-tight" style={{ color: '#7B52C3' }}>Billed By</h2>
                    <div className="text-[14px] text-gray-800 space-y-1">
                        <p className="font-bold text-gray-900 text-[15px] mb-1">Aspire Global Solutions</p>
                        <p>Golden Palace, Lokhandwala Township, Kandivali East,</p>
                        <p>Mumbai, Maharashtra, 400101 India</p>
                        <p className="pt-1"><span className="font-bold text-gray-900">Email:</span> hello@careerist.pro</p>
                        <p><span className="font-bold text-gray-900">Phone:</span> +91 72080 34201</p>
                    </div>
                </div>
                <div className="flex-1 p-6 rounded" style={{ backgroundColor: '#EDE7F6' }}>
                    <h2 className="text-[24px] font-normal mb-3 tracking-tight" style={{ color: '#7B52C3' }}>Billed To</h2>
                    <div className="text-[14px] text-gray-800 space-y-1">
                        <p className="font-bold text-gray-900 text-[15px] mb-1">
                            {revenue.client.firstName} {revenue.client.lastName}
                        </p>
                        {revenue.client.address && (
                            <p className="whitespace-pre-wrap">{revenue.client.address}</p>
                        )}
                        <p className="pt-1"><span className="font-bold text-gray-900">Email:</span> {revenue.client.email || 'N/A'}</p>
                        <p><span className="font-bold text-gray-900">Phone:</span> {revenue.client.phone || 'N/A'}</p>
                    </div>
                </div>
            </div>

            {/* Items Table */}
            <div className="mb-8 rounded-md overflow-hidden" style={{ backgroundColor: '#F4F1F8' }}>
                <table className="w-full text-sm border-collapse">
                    <thead className="text-white" style={{ backgroundColor: '#7B52C3' }}>
                        <tr>
                            <th className="py-4 px-6 text-left font-medium w-[55%] border-r" style={{ borderColor: '#6939b8' }}>Item</th>
                            <th className="py-4 px-6 text-center font-medium w-[15%]">Quantity</th>
                            <th className="py-4 px-6 text-center font-medium w-[15%] border-x" style={{ borderColor: '#6939b8' }}>Rate</th>
                            <th className="py-4 px-6 text-center font-medium w-[15%]">Amount</th>
                        </tr>
                    </thead>
                    <tbody className="text-gray-800">
                        {revenue.items.map((item, index) => (
                            <tr key={index} className="align-top border-b last:border-0 relative" style={{ borderColor: '#e6e2f1' }}>
                                <td className="py-6 px-6 relative z-10 w-[55%]">
                                    <div className="font-medium text-[14px] leading-loose whitespace-pre-wrap" style={{ color: '#2a2d40' }}>
                                        <div className="flex">
                                            <span className="mr-3">{index + 1}.</span>
                                            <div>{item.description}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="py-6 px-6 text-center border-l" style={{ borderColor: '#e6e2f1' }}>{item.quantity}</td>
                                <td className="py-6 px-6 text-center border-x" style={{ borderColor: '#e6e2f1' }}>{formatINR(item.rate)}</td>
                                <td className="py-6 px-6 text-center font-medium">{formatINR(item.amount)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Totals */}
            <div className="flex justify-between items-start mt-6 mb-16 px-1">
                <div className="text-[14px] font-bold text-gray-800 max-w-sm pt-2">
                    Total (in words) : {numberToWords(revenue.amount)}
                </div>
                <div className="w-[340px]">
                    <div className="border-t-[2px] border-b-[2px] border-black py-2 px-1 flex justify-between items-center">
                        <span className="font-bold text-[18px] text-gray-900">Total (INR)</span>
                        <span className="font-bold text-[18px] text-gray-900">{formatINR(revenue.amount)}</span>
                    </div>
                </div>
            </div>

            {/* Signature */}
            <div className="flex justify-end pr-10 mt-12 pb-8">
                <div className="text-center flex flex-col items-center min-w-[200px]">
                    <div className="mb-2 w-full flex justify-center flex-col items-center">
                        <span
                            className="text-xl text-gray-800 block mb-2"
                            style={{ fontFamily: "'Brush Script MT', 'Caveat', 'Great Vibes', cursive", fontStyle: 'italic' }}>
                            Karishma Sethi
                        </span>
                    </div>
                    <span className="text-[14px] text-gray-800">Authorised Signatory</span>
                </div>
            </div>

            {/* Notes / Terms */}
            {(revenue.notes || revenue.terms) && (
                <div className="mt-8 pt-4 border-t border-gray-200 text-xs text-gray-500 pl-2">
                    {revenue.notes && <p className="mb-2"><strong className="text-gray-700">Notes:</strong> {revenue.notes}</p>}
                    {revenue.terms && <p><strong className="text-gray-700">Terms:</strong> {revenue.terms}</p>}
                </div>
            )}
        </div>
    )
}
