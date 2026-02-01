'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/DashboardLayout'
import { StatsCard } from '@/ui/StatsCard'

interface SystemMetrics {
  platformUsage: Array<{ source: string; count: number }>
  funnelPerformance: Array<{ stage: string; count: number }>
  period: { start: string; end: string }
}


const STAGE_LABELS: Record<string, string> = {
  IDENTIFIED: 'Identified',
  RESUME_UPDATED: 'Resume Updated',
  COLD_MESSAGE_SENT: 'Cold Message Sent',
  CONNECTION_ACCEPTED: 'Connection Accepted',
  APPLIED: 'Applied',
  INTERVIEW_SCHEDULED: 'Interview Scheduled',
  OFFER: 'Offer',
  REJECTED: 'Rejected',
  CLOSED: 'Closed',
}

export default function ReportsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics | null>(null)
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    loadMetrics()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateRange])

  const loadMetrics = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/login')
        return
      }

      const startDate = new Date(dateRange.start).toISOString()
      const endDate = new Date(dateRange.end).toISOString()

      const response = await fetch(
        `/api/analytics/system-metrics?startDate=${startDate}&endDate=${endDate}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          credentials: 'include',
        }
      )

      if (response.ok) {
        const data = await response.json()
        setSystemMetrics(data)
      }
    } catch (err) {
      console.error('Failed to load metrics:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    )
  }

  const totalJobs = systemMetrics?.platformUsage.reduce((sum, item) => sum + item.count, 0) || 0
  const totalApplications = systemMetrics?.funnelPerformance.reduce((sum, item) => sum + item.count, 0) || 0
  const activeApplications = systemMetrics?.funnelPerformance
    .filter(item => !['REJECTED', 'CLOSED'].includes(item.stage))
    .reduce((sum, item) => sum + item.count, 0) || 0
  const offers = systemMetrics?.funnelPerformance.find(item => item.stage === 'OFFER')?.count || 0

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="mt-2 text-gray-700">Comprehensive insights into your recruitment pipeline</p>
        </div>

        {/* Date Range Filter */}
        <div className="bg-white rounded-lg shadow p-6 mb-6 border border-gray-200">
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-900 mb-2">Start Date</label>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-900 mb-2">End Date</label>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <button
              onClick={loadMetrics}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Apply Filter
            </button>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <StatsCard
            title="Total Jobs"
            value={totalJobs}
            color="blue"
            icon={
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            }
          />
          <StatsCard
            title="Total Applications"
            value={totalApplications}
            color="purple"
            icon={
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            }
          />
          <StatsCard
            title="Active Pipeline"
            value={activeApplications}
            color="green"
            icon={
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            }
          />
          <StatsCard
            title="Offers Made"
            value={offers}
            color="orange"
            icon={
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
        </div>

        {/* Platform Usage */}
        <div className="bg-white rounded-lg shadow p-6 mb-6 border border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Platform Usage</h2>
          <div className="space-y-4">
            {systemMetrics?.platformUsage.map((item) => {
              const percentage = totalJobs > 0 ? (item.count / totalJobs) * 100 : 0
              return (
                <div key={item.source}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-900">{item.source}</span>
                    <span className="text-sm text-gray-700">{item.count} jobs ({percentage.toFixed(1)}%)</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Funnel Performance */}
        <div className="bg-white rounded-lg shadow p-6 mb-6 border border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Application Funnel</h2>
          <div className="space-y-4">
            {systemMetrics?.funnelPerformance.map((item) => {
              const percentage = totalApplications > 0 ? (item.count / totalApplications) * 100 : 0
              const isActive = !['REJECTED', 'CLOSED'].includes(item.stage)
              return (
                <div key={item.stage}>
                  <div className="flex justify-between items-center mb-2">
                    <span className={`text-sm font-medium ${isActive ? 'text-gray-900' : 'text-gray-600'}`}>
                      {STAGE_LABELS[item.stage] || item.stage}
                    </span>
                    <span className={`text-sm ${isActive ? 'text-gray-700' : 'text-gray-600'}`}>
                      {item.count} applications ({percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${
                        isActive ? 'bg-blue-600' : 'bg-gray-400'
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Stage Distribution Chart */}
        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Stage Distribution</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {systemMetrics?.funnelPerformance.map((item) => (
              <div
                key={item.stage}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow bg-white"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-900">
                    {STAGE_LABELS[item.stage] || item.stage}
                  </span>
                  <span className="text-lg font-bold text-blue-600">{item.count}</span>
                </div>
                <div className="text-xs text-gray-700">
                  {totalApplications > 0 ? ((item.count / totalApplications) * 100).toFixed(1) : 0}% of total
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

