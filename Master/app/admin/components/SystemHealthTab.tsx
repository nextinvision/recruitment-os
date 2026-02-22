'use client'

import { useEffect, useState } from 'react'
import { StatsCard, Spinner } from '@/ui'

interface SystemHealthMetrics {
  activeUsers: number
  apiRequestRate: number
  databaseConnections: number
  queueJobCount: number
  errorRate: number
  systemUptime: number
  storageUsage: {
    total: number
    used: number
    available: number
    percentage: number
  }
  timestamp: Date
}

interface CriticalIssue {
  type: string
  message: string
  severity: 'critical' | 'warning'
}

interface SystemHealthTabProps {
  showToast: (message: string, type: 'success' | 'error' | 'info') => void
}

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60

  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m`
  } else if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`
  } else {
    return `${secs}s`
  }
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

export function SystemHealthTab({ showToast }: SystemHealthTabProps) {
  const [metrics, setMetrics] = useState<SystemHealthMetrics | null>(null)
  const [issues, setIssues] = useState<CriticalIssue[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadHealthData()
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      loadHealthData()
    }, 30000)

    return () => clearInterval(interval)
  }, [])

  const loadHealthData = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const response = await fetch('/api/system-health', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
      })

      if (response.ok) {
        const data = await response.json()
        setMetrics(data.metrics)
        setIssues(data.issues)
      } else {
        showToast('Failed to load system health data', 'error')
      }
    } catch (err) {
      console.error('Failed to load health data:', err)
      showToast('Failed to load system health data', 'error')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <Spinner fullScreen />
  }

  if (!metrics) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">No health data available</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">System Health Dashboard</h2>
          <p className="mt-2 text-gray-700">Monitor system performance and health metrics</p>
        </div>
        <div className="text-sm text-gray-500">
          Last updated: {new Date(metrics.timestamp).toLocaleString()}
        </div>
      </div>

      {/* Critical Issues Alert */}
      {issues.length > 0 && (
        <div className="space-y-2">
          {issues.map((issue, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg border ${
                issue.severity === 'critical'
                  ? 'bg-red-50 border-red-200 text-red-800'
                  : 'bg-yellow-50 border-yellow-200 text-yellow-800'
              }`}
            >
              <div className="flex items-center">
                <svg
                  className={`h-5 w-5 mr-2 ${
                    issue.severity === 'critical' ? 'text-red-600' : 'text-yellow-600'
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                <div>
                  <div className="font-semibold">{issue.type.toUpperCase()}</div>
                  <div className="text-sm">{issue.message}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Health Metrics */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Active Users"
          value={metrics.activeUsers}
          color="blue"
          icon={
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          }
        />
        <StatsCard
          title="API Request Rate"
          value={`${metrics.apiRequestRate}/min`}
          color="purple"
          icon={
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          }
        />
        <StatsCard
          title="Queue Jobs"
          value={metrics.queueJobCount}
          color="orange"
          icon={
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          }
        />
        <StatsCard
          title="Error Rate"
          value={`${metrics.errorRate}/hr`}
          color={metrics.errorRate > 10 ? 'red' : 'green'}
          icon={
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          }
        />
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-gray-900">System Uptime</h3>
            <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="text-3xl font-bold text-gray-900">{formatUptime(metrics.systemUptime)}</div>
          <div className="text-sm text-gray-500 mt-1">System running since startup</div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-gray-900">Database Connections</h3>
            <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
            </svg>
          </div>
          <div className="text-3xl font-bold text-gray-900">{metrics.databaseConnections}</div>
          <div className="text-sm text-gray-500 mt-1">Active database connections</div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-gray-900">Storage Usage</h3>
            <svg className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
            </svg>
          </div>
          <div className="text-3xl font-bold text-gray-900">{metrics.storageUsage.percentage.toFixed(1)}%</div>
          <div className="text-sm text-gray-500 mt-1">
            {formatBytes(metrics.storageUsage.used)} / {formatBytes(metrics.storageUsage.total)}
          </div>
          <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${
                metrics.storageUsage.percentage > 90
                  ? 'bg-red-600'
                  : metrics.storageUsage.percentage > 80
                  ? 'bg-yellow-600'
                  : 'bg-green-600'
              }`}
              style={{ width: `${Math.min(metrics.storageUsage.percentage, 100)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

