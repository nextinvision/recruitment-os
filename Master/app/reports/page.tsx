'use client'

import { useEffect, useState, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { DashboardLayout } from '@/components/DashboardLayout'
import { StatsCard, Button, Spinner, ToastContainer, useToast } from '@/ui'
import { PeriodSelector, type PeriodView } from '@/ui/PeriodSelector'
import { RecruiterComparisonTable } from '@/ui/RecruiterComparisonTable'
import { UserRole } from '@prisma/client'

interface SystemMetrics {
  platformUsage: Array<{ source: string; count: number }>
  funnelPerformance: Array<{ stage: string; count: number }>
  systemMetrics?: {
    totalJobs: number
    totalCandidates: number
    totalApplications: number
    activeApplications: number
    conversionRates: {
      identifiedToApplied: number
      appliedToInterview: number
      interviewToOffer: number
    }
  }
  averageTimePerStage?: Array<{ stage: string; averageDays: number; count: number }>
  period: { start: string; end: string }
}

interface RecruiterComparison {
  recruiter: {
    id: string
    name: string
    email: string
  }
  metrics: {
    recruiterId: string
    period: { start: Date | string; end: Date | string }
    jobsScraped: number
    candidatesManaged: number
    applicationsCreated: number
    conversionRates: {
      identifiedToApplied: number
      appliedToInterview: number
      interviewToOffer: number
    }
    averageTimePerStage: Array<{ stage: string; averageDays: number }>
  }
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

function ReportsPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics | null>(null)
  const [recruiterComparison, setRecruiterComparison] = useState<RecruiterComparison[]>([])
  const [userRole, setUserRole] = useState<UserRole | null>(null)
  const [periodView, setPeriodView] = useState<PeriodView>('custom')
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    end: new Date(),
  })
  const [selectedRecruiterId, setSelectedRecruiterId] = useState<string | null>(
    searchParams.get('recruiterId')
  )

  const { toasts, showToast, removeToast } = useToast()

  // Initialize user role on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('user')
    if (storedUser) {
      const user = JSON.parse(storedUser)
      setUserRole(user.role)
    }
  }, [])

  const calculatePeriodDates = useCallback((view: PeriodView, customDateRange?: { start: Date; end: Date }): { start: Date; end: Date } => {
    const end = new Date()
    end.setHours(23, 59, 59, 999)
    const start = new Date()

    switch (view) {
      case 'daily':
        start.setDate(start.getDate())
        start.setHours(0, 0, 0, 0)
        break
      case 'weekly':
        start.setDate(start.getDate() - 7)
        start.setHours(0, 0, 0, 0)
        break
      case 'monthly':
        start.setMonth(start.getMonth() - 1)
        start.setHours(0, 0, 0, 0)
        break
      case 'custom':
        return customDateRange || { start: dateRange.start, end: dateRange.end }
    }

    return { start, end }
  }, [dateRange])

  // Core data loading function that accepts dates as parameters
  const loadDataWithDates = useCallback(async (startDateParam: Date, endDateParam: Date) => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/login')
        return
      }

      // Get current user role from localStorage if not set in state yet
      let currentUserRole = userRole
      if (!currentUserRole) {
        const storedUser = localStorage.getItem('user')
        if (storedUser) {
          const user = JSON.parse(storedUser)
          currentUserRole = user.role
        }
      }

      // Ensure dates have proper time boundaries
      const startDate = new Date(startDateParam)
      startDate.setHours(0, 0, 0, 0)
      const endDate = new Date(endDateParam)
      endDate.setHours(23, 59, 59, 999)

      const startDateISO = startDate.toISOString()
      const endDateISO = endDate.toISOString()

      const [systemResponse, comparisonResponse] = await Promise.all([
        fetch(`/api/analytics/system-metrics?startDate=${startDateISO}&endDate=${endDateISO}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          credentials: 'include',
        }),
        (currentUserRole === UserRole.ADMIN || currentUserRole === UserRole.MANAGER)
          ? fetch(`/api/analytics/recruiter-comparison?startDate=${startDateISO}&endDate=${endDateISO}`, {
              headers: {
                'Authorization': `Bearer ${token}`,
              },
              credentials: 'include',
            })
          : Promise.resolve(null),
      ])

      if (systemResponse.ok) {
        const data = await systemResponse.json()
        setSystemMetrics(data)
      } else {
        const errorData = await systemResponse.json().catch(() => ({ error: 'Failed to load system metrics' }))
        showToast(errorData.error || 'Failed to load system metrics', 'error')
      }

      if (comparisonResponse?.ok) {
        const comparisonData = await comparisonResponse.json()
        setRecruiterComparison(comparisonData)
      } else if (comparisonResponse && !comparisonResponse.ok) {
        const errorData = await comparisonResponse.json().catch(() => ({ error: 'Failed to load recruiter comparison' }))
        showToast(errorData.error || 'Failed to load recruiter comparison', 'error')
      }
    } catch (err) {
      console.error('Failed to load metrics:', err)
      showToast('Failed to load reports data', 'error')
    } finally {
      setLoading(false)
    }
  }, [userRole, router, showToast])

  // Memoized loadAllData function that uses current dateRange state
  const loadAllData = useCallback(async () => {
    await loadDataWithDates(dateRange.start, dateRange.end)
  }, [dateRange, loadDataWithDates])

  // Load data when dateRange or selectedRecruiterId changes (for custom dates)
  useEffect(() => {
    // Only auto-load if periodView is 'custom' (manual date changes)
    // For period views (daily/weekly/monthly), data is loaded in the periodView effect
    if (periodView === 'custom') {
      loadAllData()
    }
  }, [dateRange, selectedRecruiterId, periodView, loadAllData])

  const handleQuickSelect = useCallback((startDate: Date, endDate: Date) => {
    // Ensure proper time boundaries
    const start = new Date(startDate)
    start.setHours(0, 0, 0, 0)
    const end = new Date(endDate)
    end.setHours(23, 59, 59, 999)
    setDateRange({ start, end })
    setPeriodView('custom')
    // Load data immediately with the selected dates
    loadDataWithDates(start, end)
  }, [loadDataWithDates])

  const handleExport = async (reportType: 'system' | 'recruiter-comparison' | 'funnel' | 'platform') => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      // Ensure proper time boundaries for export
      const startDate = new Date(dateRange.start)
      startDate.setHours(0, 0, 0, 0)
      const endDate = new Date(dateRange.end)
      endDate.setHours(23, 59, 59, 999)

      const startDateISO = startDate.toISOString()
      const endDateISO = endDate.toISOString()

      const response = await fetch(
        `/api/analytics/export?startDate=${startDateISO}&endDate=${endDateISO}&reportType=${reportType}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          credentials: 'include',
        }
      )

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `reports-${reportType}-${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        showToast('Report exported successfully', 'success')
      } else {
        showToast('Failed to export report', 'error')
      }
    } catch (err) {
      console.error('Failed to export:', err)
      showToast('Failed to export report', 'error')
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <Spinner fullScreen />
        <ToastContainer toasts={toasts} onRemove={removeToast} />
      </DashboardLayout>
    )
  }

  const totalJobs = systemMetrics?.systemMetrics?.totalJobs || systemMetrics?.platformUsage.reduce((sum, item) => sum + item.count, 0) || 0
  const totalApplications = systemMetrics?.systemMetrics?.totalApplications || systemMetrics?.funnelPerformance.reduce((sum, item) => sum + item.count, 0) || 0
  const activeApplications = systemMetrics?.systemMetrics?.activeApplications || systemMetrics?.funnelPerformance
    .filter(item => !['REJECTED', 'CLOSED'].includes(item.stage))
    .reduce((sum, item) => sum + item.count, 0) || 0
  const offers = systemMetrics?.funnelPerformance.find(item => item.stage === 'OFFER')?.count || 0

  return (
    <DashboardLayout>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
            <p className="mt-2 text-gray-700">Comprehensive insights into your recruitment pipeline</p>
          </div>
          {(userRole === UserRole.ADMIN || userRole === UserRole.MANAGER) && (
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => handleExport('system')}>
                Export System Report
              </Button>
              <Button variant="secondary" onClick={() => handleExport('recruiter-comparison')}>
                Export Comparison
              </Button>
            </div>
          )}
        </div>

        {/* Period Selector and Date Range */}
        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <PeriodSelector
            view={periodView}
            onChange={setPeriodView}
            onQuickSelect={handleQuickSelect}
          />
          {periodView === 'custom' && (
            <div className="mt-4 flex flex-col sm:flex-row gap-4 items-end">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-900 mb-2">Start Date</label>
                <input
                  type="date"
                  value={dateRange.start.toISOString().split('T')[0]}
                  onChange={(e) => {
                    const newDate = new Date(e.target.value)
                    newDate.setHours(0, 0, 0, 0)
                    setDateRange({ ...dateRange, start: newDate })
                  }}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#F4B400] focus:border-[#F4B400]"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-900 mb-2">End Date</label>
                <input
                  type="date"
                  value={dateRange.end.toISOString().split('T')[0]}
                  onChange={(e) => {
                    const newDate = new Date(e.target.value)
                    newDate.setHours(23, 59, 59, 999)
                    setDateRange({ ...dateRange, end: newDate })
                  }}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#F4B400] focus:border-[#F4B400]"
                />
              </div>
              <Button onClick={loadAllData}>
                Apply Filter
              </Button>
            </div>
          )}
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
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

        {/* Conversion Rates */}
        {systemMetrics?.systemMetrics?.conversionRates && (
          <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Conversion Rates</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-1">Identified → Applied</div>
                <div className="text-2xl font-bold text-blue-600">
                  {systemMetrics.systemMetrics.conversionRates.identifiedToApplied.toFixed(1)}%
                </div>
              </div>
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-1">Applied → Interview</div>
                <div className="text-2xl font-bold text-green-600">
                  {systemMetrics.systemMetrics.conversionRates.appliedToInterview.toFixed(1)}%
                </div>
              </div>
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-1">Interview → Offer</div>
                <div className="text-2xl font-bold text-orange-600">
                  {systemMetrics.systemMetrics.conversionRates.interviewToOffer.toFixed(1)}%
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Recruiter Performance Comparison (Admin/Manager only) */}
        {(userRole === UserRole.ADMIN || userRole === UserRole.MANAGER) && recruiterComparison.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Recruiter Performance Comparison</h2>
              <Button variant="secondary" size="sm" onClick={() => handleExport('recruiter-comparison')}>
                Export CSV
              </Button>
            </div>
            <RecruiterComparisonTable
              data={recruiterComparison}
              onRecruiterClick={(recruiterId) => {
                setSelectedRecruiterId(recruiterId)
                router.push(`/reports?recruiterId=${recruiterId}`)
              }}
            />
          </div>
        )}

        {/* Average Time Per Stage */}
        {systemMetrics?.averageTimePerStage && systemMetrics.averageTimePerStage.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Average Time Per Stage</h2>
            <div className="space-y-4">
              {systemMetrics.averageTimePerStage
                .filter(item => item.count > 0)
                .map((item) => (
                  <div key={item.stage}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-900">
                        {STAGE_LABELS[item.stage] || item.stage}
                      </span>
                      <span className="text-sm text-gray-700">
                        {item.averageDays} days (avg) • {item.count} applications
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className="bg-[#1F3A5F] h-3 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min((item.averageDays / 30) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Platform Usage */}
        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900">Platform Usage</h2>
            {(userRole === UserRole.ADMIN || userRole === UserRole.MANAGER) && (
              <Button variant="secondary" size="sm" onClick={() => handleExport('platform')}>
                Export CSV
              </Button>
            )}
          </div>
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
                      className="bg-[#1F3A5F] h-2 rounded-full transition-all duration-300"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Funnel Performance */}
        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900">Application Funnel</h2>
            {(userRole === UserRole.ADMIN || userRole === UserRole.MANAGER) && (
              <Button variant="secondary" size="sm" onClick={() => handleExport('funnel')}>
                Export CSV
              </Button>
            )}
          </div>
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
                        isActive ? 'bg-[#1F3A5F]' : 'bg-gray-400'
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Stage Distribution */}
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
                  <span className="text-lg font-bold text-[#1F3A5F]">{item.count}</span>
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

export default function ReportsPage() {
  return (
    <Suspense fallback={
      <DashboardLayout>
        <Spinner fullScreen />
      </DashboardLayout>
    }>
      <ReportsPageContent />
    </Suspense>
  )
}
