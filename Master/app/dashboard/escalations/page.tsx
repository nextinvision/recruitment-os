'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/DashboardLayout'
import Link from 'next/link'

interface EscalatedFollowUp {
  id: string
  title: string
  scheduledDate: string
  assignedUser: {
    id: string
    firstName: string
    lastName: string
    role: string
    manager?: {
      id: string
      firstName: string
      lastName: string
    }
  }
  lead?: {
    id: string
    companyName: string
  }
  client?: {
    id: string
    companyName: string
  }
  hoursOverdue: number
  escalationLevel: 'manager' | 'admin'
}

export default function EscalationsPage() {
  const router = useRouter()
  const [escalations, setEscalations] = useState<EscalatedFollowUp[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadEscalations()
  }, [])

  const loadEscalations = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/login')
        return
      }

      // Get all overdue follow-ups
      const response = await fetch('/api/followups?completed=false', {
        headers: {
          ...(token && { 'Authorization': `Bearer ${token}` }),
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      })

      if (response.ok) {
        const followUps = await response.json()
        const now = new Date()

        // Filter and calculate escalations
        const escalated = followUps
          .filter((fu: any) => {
            if (fu.completed) return false
            const scheduled = new Date(fu.scheduledDate)
            return scheduled < now
          })
          .map((fu: any) => {
            const scheduled = new Date(fu.scheduledDate)
            const hoursOverdue = Math.floor((now.getTime() - scheduled.getTime()) / (1000 * 60 * 60))
            let escalationLevel: 'manager' | 'admin' = 'manager'
            if (hoursOverdue >= 96) {
              escalationLevel = 'admin'
            } else if (hoursOverdue >= 48) {
              escalationLevel = 'manager'
            }

            return {
              ...fu,
              hoursOverdue,
              escalationLevel,
            }
          })
          .filter((fu: EscalatedFollowUp) => fu.hoursOverdue >= 48) // Only show escalated ones
          .sort((a: EscalatedFollowUp, b: EscalatedFollowUp) => b.hoursOverdue - a.hoursOverdue)

        setEscalations(escalated)
      }
    } catch (err) {
      console.error('Failed to load escalations:', err)
    } finally {
      setLoading(false)
    }
  }

  const getManagerEscalations = () => {
    return escalations.filter((e) => e.escalationLevel === 'manager')
  }

  const getAdminEscalations = () => {
    return escalations.filter((e) => e.escalationLevel === 'admin')
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    )
  }

  const managerEscalations = getManagerEscalations()
  const adminEscalations = getAdminEscalations()

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Escalation Dashboard</h1>
        </div>

        {/* Admin Escalations */}
        {adminEscalations.length > 0 && (
          <div className="bg-red-50 border-2 border-red-300 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-red-900">
                Admin Escalations - SLA Breach ({adminEscalations.length})
              </h2>
              <span className="px-3 py-1 bg-red-600 text-white text-sm font-medium rounded">
                CRITICAL
              </span>
            </div>
            <p className="text-sm text-red-700 mb-4">
              These follow-ups are 96+ hours overdue and require immediate attention.
            </p>
            <div className="space-y-3">
              {adminEscalations.map((escalation) => (
                <div
                  key={escalation.id}
                  className="bg-white border-2 border-red-400 rounded-lg p-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-gray-900">{escalation.title}</h3>
                        <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded">
                          {escalation.hoursOverdue}h overdue
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Assigned To:</span>{' '}
                          <span className="font-medium text-gray-900">
                            {escalation.assignedUser.firstName} {escalation.assignedUser.lastName}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">Due Date:</span>{' '}
                          <span className="font-medium text-gray-900">
                            {new Date(escalation.scheduledDate).toLocaleString()}
                          </span>
                        </div>
                        {escalation.lead && (
                          <div>
                            <span className="text-gray-500">Lead:</span>{' '}
                            <Link
                              href={`/leads/${escalation.lead.id}`}
                              className="text-blue-600 hover:text-blue-800 font-medium"
                            >
                              {escalation.lead.companyName}
                            </Link>
                          </div>
                        )}
                        {escalation.client && (
                          <div>
                            <span className="text-gray-500">Client:</span>{' '}
                            <Link
                              href={`/clients/${escalation.client.id}`}
                              className="text-blue-600 hover:text-blue-800 font-medium"
                            >
                              {escalation.client.companyName}
                            </Link>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Manager Escalations */}
        {managerEscalations.length > 0 && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-orange-900">
                Manager Escalations ({managerEscalations.length})
              </h2>
            </div>
            <p className="text-sm text-orange-700 mb-4">
              These follow-ups are 48-96 hours overdue and have been escalated to managers.
            </p>
            <div className="space-y-3">
              {managerEscalations.map((escalation) => (
                <div
                  key={escalation.id}
                  className="bg-white border border-orange-300 rounded-lg p-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-gray-900">{escalation.title}</h3>
                        <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs font-medium rounded">
                          {escalation.hoursOverdue}h overdue
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Assigned To:</span>{' '}
                          <span className="font-medium text-gray-900">
                            {escalation.assignedUser.firstName} {escalation.assignedUser.lastName}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">Due Date:</span>{' '}
                          <span className="font-medium text-gray-900">
                            {new Date(escalation.scheduledDate).toLocaleString()}
                          </span>
                        </div>
                        {escalation.lead && (
                          <div>
                            <span className="text-gray-500">Lead:</span>{' '}
                            <Link
                              href={`/leads/${escalation.lead.id}`}
                              className="text-blue-600 hover:text-blue-800 font-medium"
                            >
                              {escalation.lead.companyName}
                            </Link>
                          </div>
                        )}
                        {escalation.client && (
                          <div>
                            <span className="text-gray-500">Client:</span>{' '}
                            <Link
                              href={`/clients/${escalation.client.id}`}
                              className="text-blue-600 hover:text-blue-800 font-medium"
                            >
                              {escalation.client.companyName}
                            </Link>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {escalations.length === 0 && (
          <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-gray-600">No escalations at this time</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

