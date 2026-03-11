'use client'

import { useEffect, useState, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { DashboardLayout } from '@/components/DashboardLayout'
import {
  StatsCard,
  Button,
  Spinner,
  useToast,
  RecruiterComparisonTable,
  PeriodSelector,
  type PeriodView,
  AppFunnelChart,
  PlatformSourcePie,
  StageTimeBarChart,
  PerformanceComparisonChart,
} from '@/ui'
import { UserRole } from '@prisma/client'
import {
  BarChart3,
  PieChart as PieChartIcon,
  TrendingUp,
  Users,
  Briefcase,
  FileCheck,
  CheckCircle2,
  Clock,
  LayoutDashboard,
  Download,
  ExternalLink,
  Calendar
} from 'lucide-react'
import { formatINR } from '@/lib/currency'

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
    salesMetrics?: {
      totalRevenue: number
      totalCollected: number
      pendingBalance: number
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
  const [isExporting, setIsExporting] = useState<string | null>(null)

  const { showToast } = useToast()

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

  const handleGoogleSheetsExport = async (reportType: 'system' | 'recruiter-comparison' | 'funnel' | 'platform') => {
    setIsExporting(reportType)
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const startDate = new Date(dateRange.start)
      startDate.setHours(0, 0, 0, 0)
      const endDate = new Date(dateRange.end)
      endDate.setHours(23, 59, 59, 999)

      const startDateISO = startDate.toISOString()
      const endDateISO = endDate.toISOString()

      const response = await fetch(
        `/api/analytics/export-to-gsheets?startDate=${startDateISO}&endDate=${endDateISO}&reportType=${reportType}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          credentials: 'include',
        }
      )

      const data = await response.json()

      if (response.ok && data.url) {
        window.open(data.url, '_blank')
        showToast('Report exported to Google Sheets successfully', 'success')
      } else {
        showToast(data.error || 'Failed to export to Google Sheets', 'error')
      }
    } catch (err) {
      console.error('Failed to export to Google Sheets:', err)
      showToast('Failed to export to Google Sheets', 'error')
    } finally {
      setIsExporting(null)
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <Spinner fullScreen />
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
      <div className="max-w-7xl mx-auto space-y-8 pb-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="p-2 bg-amber-100 text-amber-600 rounded-lg">
                <LayoutDashboard size={24} />
              </div>
              <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Analytics Dashboard</h1>
            </div>
            <p className="text-gray-500 font-medium">Real-time performance metrics and pipeline insights</p>
          </div>

          {(userRole === UserRole.ADMIN || userRole === UserRole.MANAGER) && (
            <div className="flex gap-3">
              <Button
                variant="secondary"
                onClick={() => handleExport('system')}
                className="flex items-center gap-2 px-6 rounded-xl hover:bg-gray-100 transition-colors"
                disabled={isExporting !== null}
              >
                <Download size={18} /> Export CSV
              </Button>
              <Button
                variant="primary"
                onClick={() => handleGoogleSheetsExport('system')}
                isLoading={isExporting === 'system'}
                className="flex items-center gap-2 px-6 rounded-xl shadow-lg shadow-amber-200"
                disabled={isExporting !== null && isExporting !== 'system'}
              >
                <ExternalLink size={18} /> Google Sheets
              </Button>
            </div>
          )}
        </div>

        {/* Filters Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-2 mb-6">
              <Calendar className="text-amber-500" size={20} />
              <h3 className="font-bold text-gray-900 uppercase text-xs tracking-widest">Select Reporting Period</h3>
            </div>
            <PeriodSelector
              view={periodView}
              onChange={setPeriodView}
              onQuickSelect={handleQuickSelect}
            />
          </div>

          <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm flex flex-col justify-center">
            {periodView === 'custom' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Start</label>
                    <input
                      type="date"
                      value={dateRange.start.toISOString().split('T')[0]}
                      onChange={(e) => setDateRange({ ...dateRange, start: new Date(e.target.value) })}
                      className="w-full text-sm font-semibold p-2 border border-gray-100 rounded-lg bg-gray-50 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">End</label>
                    <input
                      type="date"
                      value={dateRange.end.toISOString().split('T')[0]}
                      onChange={(e) => setDateRange({ ...dateRange, end: new Date(e.target.value) })}
                      className="w-full text-sm font-semibold p-2 border border-gray-100 rounded-lg bg-gray-50 focus:ring-amber-500"
                    />
                  </div>
                </div>
                <Button onClick={loadAllData} className="w-full rounded-xl py-3 shadow-md shadow-amber-50">
                  Update Live Data
                </Button>
              </div>
            )}
            {periodView !== 'custom' && (
              <div className="text-center">
                <p className="text-sm font-medium text-gray-400">Current View</p>
                <h4 className="text-2xl font-black text-amber-500 uppercase">{periodView}</h4>
              </div>
            )}
          </div>
        </div>

        {/* Sales Overview (ADMIN/MANAGER ONLY) */}
        {(userRole === UserRole.ADMIN || userRole === UserRole.MANAGER) && systemMetrics?.systemMetrics?.salesMetrics && (
          <div className="mb-8">
            <h2 className="text-xl font-extrabold text-gray-900 tracking-tight mb-4 flex items-center gap-2">
              <span className="p-1.5 bg-green-100 text-green-600 rounded-md">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </span>
              Sales & Financial Overview
            </h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
              <StatsCard
                title="Total Revenue"
                value={formatINR(systemMetrics.systemMetrics.salesMetrics.totalRevenue || 0)}
                color="blue"
                icon={<TrendingUp size={20} />}
              />
              <StatsCard
                title="Cash Collected"
                value={formatINR(systemMetrics.systemMetrics.salesMetrics.totalCollected || 0)}
                color="green"
                icon={<CheckCircle2 size={20} />}
              />
              <StatsCard
                title="Pending Balance"
                value={formatINR(systemMetrics.systemMetrics.salesMetrics.pendingBalance || 0)}
                color="orange"
                icon={<Clock size={20} />}
              />
            </div>
          </div>
        )}

        {/* High-Level Stats Cards */}
        <div className="mb-6 flex items-center gap-2">
          <h2 className="text-xl font-extrabold text-gray-900 tracking-tight">Active Pipeline Stats</h2>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <StatsCard
            title="Jobs Found"
            value={totalJobs}
            color="blue"
            icon={<Briefcase size={20} />}
          />
          <StatsCard
            title="Applications"
            value={totalApplications}
            color="purple"
            icon={<FileCheck size={20} />}
          />
          <StatsCard
            title="Active Pipeline"
            value={activeApplications}
            color="green"
            icon={<TrendingUp size={20} />}
          />
          <StatsCard
            title="Offers Secured"
            value={offers}
            color="orange"
            icon={<CheckCircle2 size={20} />}
          />
        </div>

        {/* Visual Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Main Funnel Chart */}
          <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-2">
                <BarChart3 className="text-blue-600" size={20} />
                <h2 className="text-xl font-extrabold text-gray-900 tracking-tight">Application Funnel</h2>
              </div>
              <Users className="text-gray-300" size={24} />
            </div>
            <AppFunnelChart data={systemMetrics?.funnelPerformance || []} />
          </div>

          {/* Platform Distribution */}
          <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-2">
                <PieChartIcon className="text-amber-500" size={20} />
                <h2 className="text-xl font-extrabold text-gray-900 tracking-tight">Source Distribution</h2>
              </div>
              <Briefcase className="text-gray-300" size={24} />
            </div>
            <PlatformSourcePie data={systemMetrics?.platformUsage || []} />
          </div>

          {/* Time Efficiency */}
          <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-2">
                <Clock className="text-emerald-500" size={20} />
                <h2 className="text-xl font-extrabold text-gray-900 tracking-tight">Time Efficiency (Days)</h2>
              </div>
            </div>
            <StageTimeBarChart data={systemMetrics?.averageTimePerStage || []} />
          </div>

          {/* Recruiter Comparison (Visual) */}
          {(userRole === UserRole.ADMIN || userRole === UserRole.MANAGER) && recruiterComparison.length > 0 && (
            <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-2">
                  <Users className="text-purple-500" size={20} />
                  <h2 className="text-xl font-extrabold text-gray-900 tracking-tight">Recruiter Performance</h2>
                </div>
              </div>
              <PerformanceComparisonChart data={recruiterComparison} />
            </div>
          )}
        </div>

        {/* Raw Data Table (ADMIN/MANAGER ONLY) */}
        {(userRole === UserRole.ADMIN || userRole === UserRole.MANAGER) && (
          <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-black text-gray-900 tracking-tight">Agent Performance Metrics</h2>
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" onClick={() => handleExport('recruiter-comparison')} className="rounded-lg">
                  CSV
                </Button>
                <Button variant="primary" size="sm" onClick={() => handleGoogleSheetsExport('recruiter-comparison')} className="rounded-lg">
                  Sheets
                </Button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <RecruiterComparisonTable
                data={recruiterComparison}
                onRecruiterClick={(recruiterId) => {
                  setSelectedRecruiterId(recruiterId)
                  router.push(`/reports?recruiterId=${recruiterId}`)
                }}
              />
            </div>
          </div>
        )}
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
