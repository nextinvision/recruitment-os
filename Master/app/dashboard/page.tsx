'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { StatsCard } from '@/ui/StatsCard'
import { DashboardLayout } from '@/components/DashboardLayout'
import { PendingFollowUpsWidget } from '@/ui/PendingFollowUpsWidget'
import { OverdueTasksWidget } from '@/ui/OverdueTasksWidget'
import { ToDoListWidget } from '@/ui/ToDoListWidget'
import { AIRecommendationsWidget } from '@/ui/AIRecommendationsWidget'
import { ActivityTimeline } from '@/ui/ActivityTimeline'
import { RecruiterComparisonWidget } from '@/ui/RecruiterComparisonWidget'
import { PlatformAnalyticsWidget } from '@/ui/PlatformAnalyticsWidget'
import { FunnelChartWidget } from '@/ui/FunnelChartWidget'

interface DashboardData {
  stats: {
    jobsScraped: number
    clientsManaged: number
    applicationsCreated: number
    activeApplications: number
  }
  conversionRates: {
    identifiedToApplied: number
    appliedToInterview: number
    interviewToOffer: number
  }
  pendingFollowUps: any[]
  overdueTasks: any[]
  todayToDoList: any[]
  recentActivities: any[]
  aiRecommendations: any[]
  recentJobs: any[]
  recentClients: any[]
  recentApplications: any[]
  admin?: {
    systemMetrics: any
    recruiterComparison: any[]
    platformAnalytics: any[]
    funnelMetrics: any[]
  }
}

export default function DashboardPage() {
  const router = useRouter()
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [user, setUser] = useState<{ id: string; email: string; firstName: string; lastName: string; role: string } | null>(null)

  const loadDashboardData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }

      const token = localStorage.getItem('token')
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      }
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      // Use the comprehensive dashboard API
      const response = await fetch('/api/dashboard', {
        headers,
        credentials: 'include',
      })

      if (response.ok) {
        const data = await response.json()
        setDashboardData(data)
      } else if (response.status === 401) {
        router.push('/login')
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [router])

  const handleRefresh = useCallback(() => {
    loadDashboardData(true)
  }, [loadDashboardData])

  const handleToDoComplete = useCallback(() => {
    // Reload dashboard data after completing a todo
    loadDashboardData(true)
  }, [loadDashboardData])

  useEffect(() => {
    const token = localStorage.getItem('token')
    const userData = localStorage.getItem('user')

    const fetchUserFromToken = async () => {
      try {
        const response = await fetch('/api/auth/me', {
          credentials: 'include',
        })

        if (response.ok) {
          const fetchedUserData = await response.json()
          localStorage.setItem('user', JSON.stringify(fetchedUserData))
          setUser(fetchedUserData)
          loadDashboardData()
        } else {
          router.push('/login')
        }
      } catch (err) {
        console.error('Failed to fetch user data:', err)
        router.push('/login')
      }
    }

    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData)
        setUser(parsedUser)
        loadDashboardData()
      } catch (err) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        router.push('/login')
      }
    } else {
      fetchUserFromToken()
    }
  }, [router, loadDashboardData])

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F4B400] border-t-[#1F3A5F] mx-auto"></div>
            <p className="mt-4 text-[#0F172A] font-medium">Loading dashboard...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (!dashboardData) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <p className="text-[#64748B]">Failed to load dashboard data</p>
        </div>
      </DashboardLayout>
    )
  }

  const isAdmin = user?.role === 'ADMIN'
  const isManager = user?.role === 'MANAGER'

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header with Refresh Button */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-[#0F172A]">Dashboard</h1>
            <p className="text-sm text-[#64748B] mt-1">
              Welcome back, {user?.firstName} {user?.lastName}
            </p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-[#1F3A5F] text-white rounded-lg hover:bg-[#0F172A] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg
              className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <StatsCard
            title="Jobs Scraped"
            value={dashboardData.stats.jobsScraped}
            color="blue"
            icon={
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            }
          />
          <StatsCard
            title="Clients"
            value={dashboardData.stats.clientsManaged}
            color="green"
            icon={
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            }
          />
          <StatsCard
            title="Applications"
            value={dashboardData.stats.applicationsCreated}
            color="purple"
            icon={
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            }
          />
          <StatsCard
            title="Active Pipeline"
            value={dashboardData.stats.activeApplications}
            color="orange"
            icon={
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            }
          />
        </div>

        {/* Conversion Rates */}
        {dashboardData.conversionRates && (
          <div className="bg-white shadow-md rounded-xl p-6 mb-8 border border-[#E5E7EB]">
            <h3 className="text-lg font-semibold text-[#0F172A] mb-4">Conversion Rates (Last 30 Days)</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-[#1F3A5F]">
                  {dashboardData.conversionRates.identifiedToApplied.toFixed(1)}%
                </div>
                <div className="text-sm text-[#64748B] mt-1">Identified → Applied</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-[#1F3A5F]">
                  {dashboardData.conversionRates.appliedToInterview.toFixed(1)}%
                </div>
                <div className="text-sm text-[#64748B] mt-1">Applied → Interview</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-[#1F3A5F]">
                  {dashboardData.conversionRates.interviewToOffer.toFixed(1)}%
                </div>
                <div className="text-sm text-[#64748B] mt-1">Interview → Offer</div>
              </div>
            </div>
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Left Column - Workflow Widgets */}
          <div className="lg:col-span-2 space-y-6">
            {/* Overdue Tasks - High Priority */}
            {dashboardData.overdueTasks.length > 0 && (
              <OverdueTasksWidget tasks={dashboardData.overdueTasks} />
            )}

            {/* Today's To-Do List */}
            <ToDoListWidget todos={dashboardData.todayToDoList} onComplete={handleToDoComplete} />

            {/* Pending Follow-ups */}
            <PendingFollowUpsWidget followUps={dashboardData.pendingFollowUps} />

            {/* AI Recommendations */}
            {dashboardData.aiRecommendations.length > 0 && (
              <AIRecommendationsWidget recommendations={dashboardData.aiRecommendations} />
            )}

            {/* Recent Activity Timeline */}
            <div className="bg-white shadow-md rounded-xl p-6 border border-[#E5E7EB]">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-[#0F172A]">Recent Activity Timeline</h3>
                <Link href="/activities" className="text-sm font-medium text-[#1F3A5F] hover:text-[#F4B400] transition-colors">
                  View all
                </Link>
              </div>
              <ActivityTimeline activities={dashboardData.recentActivities} />
            </div>
          </div>

          {/* Right Column - Recent Items */}
          <div className="space-y-6">
            {/* Recent Jobs */}
            <div className="bg-white shadow-md rounded-xl p-6 border border-[#E5E7EB]">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-[#0F172A]">Recent Jobs</h3>
                <Link href="/jobs" className="text-sm font-medium text-[#1F3A5F] hover:text-[#F4B400] transition-colors">
                  View all
                </Link>
              </div>
              <div className="space-y-3">
                {dashboardData.recentJobs.length > 0 ? (
                  dashboardData.recentJobs.map((job) => (
                    <Link
                      key={job.id}
                      href={`/jobs/${job.id}`}
                      className="block border-l-4 border-[#F4B400] pl-3 py-2 hover:bg-[rgba(244,180,0,0.05)] rounded-r transition-colors"
                    >
                      <div className="text-sm font-medium text-[#0F172A]">{job.title}</div>
                      <div className="text-xs text-[#64748B]">{job.company} • {job.location}</div>
                    </Link>
                  ))
                ) : (
                  <p className="text-sm text-[#64748B]">No recent jobs</p>
                )}
              </div>
            </div>

            {/* Recent Clients */}
            <div className="bg-white shadow-md rounded-xl p-6 border border-[#E5E7EB]">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-[#0F172A]">Recent Clients</h3>
                <Link href="/clients" className="text-sm font-medium text-[#1F3A5F] hover:text-[#F4B400] transition-colors">
                  View all
                </Link>
              </div>
              <div className="space-y-3">
                {dashboardData.recentClients.length > 0 ? (
                  dashboardData.recentClients.map((client) => (
                    <Link
                      key={client.id}
                      href={`/clients/${client.id}`}
                      className="block border-l-4 border-[#F4B400] pl-3 py-2 hover:bg-[rgba(244,180,0,0.05)] rounded-r transition-colors"
                    >
                      <div className="text-sm font-medium text-[#0F172A]">
                        {client.firstName} {client.lastName}
                      </div>
                      <div className="text-xs text-[#64748B]">{client.email || 'No email'}</div>
                    </Link>
                  ))
                ) : (
                  <p className="text-sm text-[#64748B]">No recent clients</p>
                )}
              </div>
            </div>

            {/* Recent Applications */}
            <div className="bg-white shadow-md rounded-xl p-6 border border-[#E5E7EB]">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-[#0F172A]">Recent Applications</h3>
                <Link href="/applications" className="text-sm font-medium text-[#1F3A5F] hover:text-[#F4B400] transition-colors">
                  View all
                </Link>
              </div>
              <div className="space-y-3">
                {dashboardData.recentApplications.length > 0 ? (
                  dashboardData.recentApplications.map((app) => (
                    <Link
                      key={app.id}
                      href={`/applications/${app.id}`}
                      className="block border-l-4 border-[#F4B400] pl-3 py-2 hover:bg-[rgba(244,180,0,0.05)] rounded-r transition-colors"
                    >
                      <div className="text-sm font-medium text-[#0F172A]">
                        {app.client?.firstName} {app.client?.lastName}
                      </div>
                      <div className="text-xs text-[#64748B]">
                        {app.job?.title} {app.job?.company ? `@ ${app.job.company}` : ''} • {app.stage.replace(/_/g, ' ')}
                      </div>
                    </Link>
                  ))
                ) : (
                  <p className="text-sm text-[#64748B]">No recent applications</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Admin/Manager Specific Widgets */}
        {(isAdmin || isManager) && dashboardData.admin && (
          <div className="space-y-6 mb-8">
            <div className="border-t border-[#E5E7EB] pt-6">
              <h2 className="text-xl font-bold text-[#0F172A] mb-6">Admin Analytics</h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Platform Analytics */}
              <PlatformAnalyticsWidget data={dashboardData.admin.platformAnalytics} />

              {/* Funnel Chart */}
              <FunnelChartWidget data={dashboardData.admin.funnelMetrics} />
            </div>

            {/* Recruiter Comparison */}
            {isAdmin && (
              <RecruiterComparisonWidget comparison={dashboardData.admin.recruiterComparison} />
            )}
          </div>
        )}

        {/* Quick Actions */}
        <div className="bg-white shadow-md rounded-xl p-6 border border-[#E5E7EB]">
          <h3 className="text-lg font-semibold text-[#0F172A] mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              href="/jobs"
              className="flex items-center p-4 border border-[#E5E7EB] rounded-lg hover:border-[#F4B400] hover:bg-[rgba(244,180,0,0.1)] transition-colors"
            >
              <svg className="h-6 w-6 text-[#F4B400] mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span className="text-sm font-medium text-[#0F172A]">Add Job</span>
            </Link>
            <Link
              href="/clients"
              className="flex items-center p-4 border border-[#E5E7EB] rounded-lg hover:border-[#F4B400] hover:bg-[rgba(244,180,0,0.1)] transition-colors"
            >
              <svg className="h-6 w-6 text-[#F4B400] mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <span className="text-sm font-medium text-[#0F172A]">Add Client</span>
            </Link>
            <Link
              href="/applications"
              className="flex items-center p-4 border border-[#E5E7EB] rounded-lg hover:border-[#F4B400] hover:bg-[rgba(244,180,0,0.1)] transition-colors"
            >
              <svg className="h-6 w-6 text-[#F4B400] mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <span className="text-sm font-medium text-[#0F172A]">View Pipeline</span>
            </Link>
            {(isAdmin || isManager) && (
              <Link
                href="/reports"
                className="flex items-center p-4 border border-[#E5E7EB] rounded-lg hover:border-[#F4B400] hover:bg-[rgba(244,180,0,0.1)] transition-colors"
              >
                <svg className="h-6 w-6 text-[#F4B400] mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <span className="text-sm font-medium text-[#0F172A]">View Reports</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
