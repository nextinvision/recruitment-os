'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { DashboardLayout } from '@/components/DashboardLayout'
import { ActivityTimeline } from '@/ui/ActivityTimeline'
import Link from 'next/link'

interface Client {
  id: string
  companyName: string
  contactName: string
  email?: string
  phone?: string
  status: 'ACTIVE' | 'INACTIVE'
  industry?: string
  website?: string
  address?: string
  notes?: string
  assignedUser: {
    id: string
    firstName: string
    lastName: string
  }
}

interface Activity {
  id: string
  type: 'CALL' | 'EMAIL' | 'MEETING' | 'NOTE' | 'TASK' | 'FOLLOW_UP'
  title: string
  description?: string
  occurredAt: string
  assignedUser: {
    id: string
    firstName: string
    lastName: string
  }
}

export default function ClientProfilePage() {
  const router = useRouter()
  const params = useParams()
  const clientId = params.id as string

  const [client, setClient] = useState<Client | null>(null)
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (clientId) {
      loadClient()
      loadActivities()
    }
  }, [clientId])

  const loadClient = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/login')
        return
      }

      const response = await fetch(`/api/clients/${clientId}`, {
        headers: {
          ...(token && { 'Authorization': `Bearer ${token}` }),
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      })

      if (response.ok) {
        const data = await response.json()
        setClient(data)
      }
    } catch (err) {
      console.error('Failed to load client:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadActivities = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const response = await fetch(`/api/activities/entity/client/${clientId}`, {
        headers: {
          ...(token && { 'Authorization': `Bearer ${token}` }),
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      })

      if (response.ok) {
        const data = await response.json()
        setActivities(data)
      }
    } catch (err) {
      console.error('Failed to load activities:', err)
    }
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

  if (!client) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-gray-600">Client not found</p>
          <Link href="/clients" className="text-blue-600 hover:text-blue-800 mt-4 inline-block">
            Back to Clients
          </Link>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <Link href="/clients" className="text-blue-600 hover:text-blue-800 text-sm mb-2 inline-block">
              ← Back to Clients
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">{client.companyName}</h1>
            <p className="text-gray-600 mt-1">{client.contactName}</p>
          </div>
          <span
            className={`px-3 py-1 rounded text-sm font-medium ${
              client.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
            }`}
          >
            {client.status}
          </span>
        </div>

        {/* Client Details */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Client Information</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Email</label>
              <p className="text-gray-900">{client.email || '-'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Phone</label>
              <p className="text-gray-900">{client.phone || '-'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Industry</label>
              <p className="text-gray-900">{client.industry || '-'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Website</label>
              <p className="text-gray-900">
                {client.website ? (
                  <a href={client.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">
                    {client.website}
                  </a>
                ) : (
                  '-'
                )}
              </p>
            </div>
            <div className="col-span-2">
              <label className="text-sm font-medium text-gray-500">Address</label>
              <p className="text-gray-900">{client.address || '-'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Assigned To</label>
              <p className="text-gray-900">
                {client.assignedUser.firstName} {client.assignedUser.lastName}
              </p>
            </div>
            {client.notes && (
              <div className="col-span-2">
                <label className="text-sm font-medium text-gray-500">Notes</label>
                <p className="text-gray-900">{client.notes}</p>
              </div>
            )}
          </div>
        </div>

        {/* Activity Timeline */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Activity Timeline</h2>
          <ActivityTimeline activities={activities} entityName={client.companyName} />
        </div>
      </div>
    </DashboardLayout>
  )
}

