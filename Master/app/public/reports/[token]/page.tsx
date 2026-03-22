'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { StatsCard, FunnelChartWidget, Spinner, Alert, Badge } from '@/ui'
import { formatINR } from '@/lib/currency'

interface SnapshotData {
    funnelPerformance: Array<{ stage: string; count: number }>
    activityDistribution: Array<{ type: string; count: number }>
}

export default function PublicReportPage() {
    const { token } = useParams()
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [report, setReport] = useState<{
        data: SnapshotData
        client: { firstName: string; lastName: string }
        updatedAt: string
    } | null>(null)

    useEffect(() => {
        const fetchReport = async () => {
            try {
                const res = await fetch(`/api/public/reports/${token}`)
                if (!res.ok) {
                    throw new Error('Report not found or has been removed')
                }
                const data = await res.json()
                setReport(data)
            } catch (err: any) {
                setError(err.message)
            } finally {
                setLoading(false)
            }
        }

        if (token) fetchReport()
    }, [token])

    if (loading) return <Spinner fullScreen />

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
                <div className="max-w-md w-full">
                    <Alert variant="error" title="Error">
                        {error}
                    </Alert>
                </div>
            </div>
        )
    }

    if (!report) return null

    const { data, client, updatedAt } = report

    return (
        <div className="min-h-screen bg-careerist-bg">
            {/* Branded Header */}
            <nav className="bg-white border-b border-careerist-border shadow-sm sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-4">
                            <h1 className="text-xl font-bold text-careerist-primary-navy">Careerist</h1>
                            <div className="h-6 w-px bg-careerist-border hidden sm:block"></div>
                            <span className="text-sm font-medium text-careerist-text-secondary hidden sm:block">External Client Report</span>
                        </div>
                        <div className="text-xs text-careerist-text-secondary">
                            Ref: {token?.toString().slice(0, 8)}
                        </div>
                    </div>
                </div>
            </nav>

            <div className="py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-5xl mx-auto space-y-8">
                    <div className="text-center">
                        <Badge variant="success" className="mb-4">Live Report</Badge>
                        <h1 className="text-3xl font-bold text-careerist-text-primary sm:text-4xl">
                            Activity & Performance Report
                        </h1>
                        <p className="mt-3 text-xl text-careerist-text-secondary font-medium">
                            {client.firstName} {client.lastName}
                        </p>
                        <div className="mt-4 flex items-center justify-center gap-2 text-sm text-careerist-text-secondary">
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Last snapshot: {new Date(updatedAt).toLocaleString()}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="bg-careerist-card shadow-md rounded-xl p-6 border border-careerist-border">
                            <h3 className="text-lg font-semibold text-careerist-text-primary mb-6">Application Funnel</h3>
                            <div className="h-[350px]">
                                <FunnelChartWidget data={data.funnelPerformance} />
                            </div>
                        </div>

                        <div className="bg-careerist-card shadow-md rounded-xl p-6 border border-careerist-border">
                            <h3 className="text-lg font-semibold text-careerist-text-primary mb-6">Activity Distribution</h3>
                            <div className="space-y-6">
                                {data.activityDistribution.length > 0 ? (
                                    data.activityDistribution.map((item) => {
                                        const total = data.activityDistribution.reduce((sum, i) => sum + i.count, 0)
                                        const percentage = total > 0 ? (item.count / total) * 100 : 0
                                        return (
                                            <div key={item.type}>
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className="text-sm font-medium text-careerist-text-primary">{item.type}</span>
                                                    <span className="text-sm font-bold text-careerist-primary-navy bg-careerist-yellow-light px-2 py-0.5 rounded-md">
                                                        {item.count}
                                                    </span>
                                                </div>
                                                <div className="w-full bg-careerist-bg-secondary rounded-full h-2.5 overflow-hidden">
                                                    <div
                                                        className="bg-careerist-primary-navy h-2.5 rounded-full transition-all duration-500"
                                                        style={{ width: `${percentage}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        )
                                    })
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-12 opacity-50">
                                        <svg className="h-12 w-12 text-careerist-text-secondary mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                        <p className="text-careerist-text-secondary">No activities recorded yet</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="text-center pt-8 border-t border-careerist-border">
                        <div className="flex items-center justify-center gap-1.5 mb-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-careerist-primary-yellow"></span>
                            <span className="text-xs font-bold uppercase tracking-wider text-careerist-primary-navy">Careerist Recruitment OS</span>
                        </div>
                        <p className="text-sm text-careerist-text-secondary">
                            &copy; {new Date().getFullYear()} Careerist. All rights reserved.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
