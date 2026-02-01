'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { StatsCard } from '@/ui/StatsCard'
import { DashboardLayout } from '@/components/DashboardLayout'

interface Stats {
  jobsScraped: number
  candidatesManaged: number
  applicationsCreated: number
  activeApplications: number
  conversionRates: {
    identifiedToApplied: number
    appliedToInterview: number
    interviewToOffer: number
  }
}

export default function DashboardPage() {
  const router = useRouter()
  const [stats, setStats] = useState<Stats | null>(null)
  const [recentJobs, setRecentJobs] = useState<Array<{ id: string; title: string; company: string; location: string }>>([])
  const [recentCandidates, setRecentCandidates] = useState<Array<{ id: string; firstName: string; lastName: string; email: string }>>([])
  const [recentApplications, setRecentApplications] = useState<Array<{ id: string; stage: string; candidate: { firstName: string; lastName: string }; job: { title: string; company: string } }>>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<{ id: string; email: string; firstName: string; lastName: string; role: string } | null>(null)

  const loadDashboardData = useCallback(async () => {
    try {
      // Get token from localStorage (preferred) or rely on cookie
      const token = localStorage.getItem('token')
      
      // Build headers - use token if available, otherwise rely on cookie
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      }
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }
      // If no token in localStorage, cookie will be sent automatically via credentials
      
      // Load stats
      const statsResponse = await fetch('/api/analytics/recruiter-metrics?startDate=' + 
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        {
          headers,
          credentials: 'include', // Include cookies
        }
      )

      if (statsResponse.ok) {
        const data = await statsResponse.json()
        setStats({
          jobsScraped: data.jobsScraped || 0,
          candidatesManaged: data.candidatesManaged || 0,
          applicationsCreated: data.applicationsCreated || 0,
          activeApplications: 0,
          conversionRates: data.conversionRates || {
            identifiedToApplied: 0,
            appliedToInterview: 0,
            interviewToOffer: 0,
          },
        })
      }

      // Load recent data
      const [jobsRes, candidatesRes, applicationsRes] = await Promise.all([
        fetch('/api/jobs', {
          headers,
          credentials: 'include',
        }),
        fetch('/api/candidates', {
          headers,
          credentials: 'include',
        }),
        fetch('/api/applications', {
          headers,
          credentials: 'include',
        }),
      ])

      if (jobsRes.ok) {
        const jobs = await jobsRes.json()
        setRecentJobs(jobs.slice(0, 5))
      }

      if (candidatesRes.ok) {
        const candidates = await candidatesRes.json()
        setRecentCandidates(candidates.slice(0, 5))
      }

      if (applicationsRes.ok) {
        const applications = await applicationsRes.json()
        setRecentApplications(applications.slice(0, 5))
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // Middleware has already validated authentication via cookie
    // We just need to get user data from localStorage for display
    // If localStorage doesn't have it, try to get from cookie or redirect
    const token = localStorage.getItem('token')
    const userData = localStorage.getItem('user')

    const fetchUserFromToken = async () => {
      try {
        // Try to get user info using the cookie (middleware will handle auth)
        const response = await fetch('/api/auth/me', {
          credentials: 'include', // Include cookies
        })

        if (response.ok) {
          const fetchedUserData = await response.json()
          // Store in localStorage for future use
          localStorage.setItem('user', JSON.stringify(fetchedUserData))
          // Set user state and load data
          setUser(fetchedUserData)
          loadDashboardData()
        } else {
          // If we can't get user data, redirect to login
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
        console.error('Failed to parse user data:', err)
        // If parsing fails, clear and redirect
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        router.push('/login')
      }
    } else {
      // If no localStorage data, but middleware allowed us here,
      // the cookie is valid. Try to get user info from API
      // Otherwise, redirect to login
      console.warn('No token in localStorage, but middleware allowed access. Fetching user data...')
      fetchUserFromToken()
    }
  }, [router, loadDashboardData])

  return (
    <DashboardLayout>
      {loading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      ) : (
        <div className="max-w-7xl mx-auto">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
            <StatsCard
              title="Jobs Scraped"
              value={stats?.jobsScraped || 0}
              color="blue"
              icon={
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              }
            />
            <StatsCard
              title="Candidates"
              value={stats?.candidatesManaged || 0}
              color="green"
              icon={
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              }
            />
            <StatsCard
              title="Applications"
              value={stats?.applicationsCreated || 0}
              color="purple"
              icon={
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              }
            />
            <StatsCard
              title="Active Pipeline"
              value={stats?.activeApplications || 0}
              color="orange"
              icon={
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              }
            />
          </div>

          {/* Conversion Rates */}
          {stats && stats.conversionRates && (
            <div className="bg-white shadow rounded-lg p-6 mb-8">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Conversion Rates (Last 30 Days)</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {stats.conversionRates.identifiedToApplied.toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-500 mt-1">Identified → Applied</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {stats.conversionRates.appliedToInterview.toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-500 mt-1">Applied → Interview</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {stats.conversionRates.interviewToOffer.toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-500 mt-1">Interview → Offer</div>
                </div>
              </div>
            </div>
          )}

          {/* Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Jobs */}
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Recent Jobs</h3>
                <Link href="/jobs" className="text-sm text-blue-600 hover:text-blue-800">
                  View all
                </Link>
              </div>
              <div className="space-y-3">
                {recentJobs.length > 0 ? (
                  recentJobs.map((job) => (
                    <div key={job.id} className="border-l-4 border-blue-500 pl-3 py-2">
                      <div className="text-sm font-medium text-gray-900">{job.title}</div>
                      <div className="text-xs text-gray-500">{job.company} • {job.location}</div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">No recent jobs</p>
                )}
              </div>
            </div>

            {/* Recent Candidates */}
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Recent Candidates</h3>
                <Link href="/candidates" className="text-sm text-blue-600 hover:text-blue-800">
                  View all
                </Link>
              </div>
              <div className="space-y-3">
                {recentCandidates.length > 0 ? (
                  recentCandidates.map((candidate) => (
                    <div key={candidate.id} className="border-l-4 border-green-500 pl-3 py-2">
                      <div className="text-sm font-medium text-gray-900">
                        {candidate.firstName} {candidate.lastName}
                      </div>
                      <div className="text-xs text-gray-500">{candidate.email}</div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">No recent candidates</p>
                )}
              </div>
            </div>

            {/* Recent Applications */}
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Recent Applications</h3>
                <Link href="/applications" className="text-sm text-blue-600 hover:text-blue-800">
                  View all
                </Link>
              </div>
              <div className="space-y-3">
                {recentApplications.length > 0 ? (
                  recentApplications.map((app) => (
                    <div key={app.id} className="border-l-4 border-purple-500 pl-3 py-2">
                      <div className="text-sm font-medium text-gray-900">
                        {app.candidate?.firstName} {app.candidate?.lastName}
                      </div>
                      <div className="text-xs text-gray-500">
                        {app.job?.title} {app.job?.company ? `@ ${app.job.company}` : ''} • {app.stage.replace(/_/g, ' ')}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">No recent applications</p>
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-8 bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link
                href="/jobs"
                className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
              >
                <svg className="h-6 w-6 text-blue-600 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span className="text-sm font-medium text-gray-900">Add Job</span>
              </Link>
              <Link
                href="/candidates"
                className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-green-300 hover:bg-green-50 transition-colors"
              >
                <svg className="h-6 w-6 text-green-600 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
                <span className="text-sm font-medium text-gray-900">Add Candidate</span>
              </Link>
              <Link
                href="/applications"
                className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-colors"
              >
                <svg className="h-6 w-6 text-purple-600 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <span className="text-sm font-medium text-gray-900">View Pipeline</span>
              </Link>
              {user?.role === 'ADMIN' || user?.role === 'MANAGER' ? (
                <Link
                  href="/reports"
                  className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-orange-300 hover:bg-orange-50 transition-colors"
                >
                  <svg className="h-6 w-6 text-orange-600 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <span className="text-sm font-medium text-gray-900">View Reports</span>
                </Link>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
