'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { DashboardLayout } from '@/components/DashboardLayout'
import { ActivityTimeline } from '@/ui/ActivityTimeline'
import Link from 'next/link'

interface Client {
  id: string
  firstName: string
  lastName: string
  email?: string
  phone?: string
  status: 'ACTIVE' | 'INACTIVE'
  industry?: string
  currentJobTitle?: string
  experience?: string
  skills?: string[]
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-careerist-primary-yellow"></div>
        </div>
      </DashboardLayout>
    )
  }

  if (!client) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-careerist-text-secondary">Client not found</p>
          <Link href="/clients" className="text-careerist-primary-yellow hover:underline mt-4 inline-block">
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
            <Link href="/clients" className="text-careerist-primary-yellow hover:underline text-sm mb-2 inline-block">
              ← Back to Clients
            </Link>
            <h1 className="text-3xl font-bold text-careerist-text-primary">
              {client.firstName} {client.lastName}
            </h1>
            {client.currentJobTitle && (
              <p className="text-careerist-text-secondary mt-1">{client.currentJobTitle}</p>
            )}
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
        <div className="bg-careerist-card rounded-lg shadow border border-careerist-border p-6">
          <h2 className="text-lg font-semibold text-careerist-text-primary mb-4">Client Information</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-careerist-text-secondary">Email</label>
              <p className="text-careerist-text-primary">{client.email || '-'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-careerist-text-secondary">Phone</label>
              <p className="text-careerist-text-primary">{client.phone || '-'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-careerist-text-secondary">Industry (Desired)</label>
              <p className="text-careerist-text-primary">{client.industry || '-'}</p>
            </div>
            {client.currentJobTitle && (
              <div>
                <label className="text-sm font-medium text-careerist-text-secondary">Current Job Title</label>
                <p className="text-careerist-text-primary">{client.currentJobTitle}</p>
              </div>
            )}
            {client.experience && (
              <div>
                <label className="text-sm font-medium text-careerist-text-secondary">Experience</label>
                <p className="text-careerist-text-primary">{client.experience}</p>
              </div>
            )}
            <div className="col-span-2">
              <label className="text-sm font-medium text-careerist-text-secondary">Address</label>
              <p className="text-careerist-text-primary">{client.address || '-'}</p>
            </div>
            {client.skills && client.skills.length > 0 && (
              <div className="col-span-2">
                <label className="text-sm font-medium text-careerist-text-secondary mb-2 block">Skills</label>
                <div className="flex flex-wrap gap-2">
                  {client.skills.map((skill, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-careerist-yellow-light text-careerist-primary-navy rounded-full text-sm font-medium border border-careerist-yellow"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
            <div>
              <label className="text-sm font-medium text-careerist-text-secondary">Assigned To</label>
              <p className="text-careerist-text-primary">
                {client.assignedUser.firstName} {client.assignedUser.lastName}
              </p>
            </div>
            {client.notes && (
              <div className="col-span-2">
                <label className="text-sm font-medium text-careerist-text-secondary">Notes</label>
                <p className="text-careerist-text-primary whitespace-pre-wrap">{client.notes}</p>
              </div>
            )}
          </div>
        </div>

        {/* Activity Timeline */}
        <div className="bg-careerist-card rounded-lg shadow border border-careerist-border p-6">
          <h2 className="text-lg font-semibold text-careerist-text-primary mb-4">Activity Timeline</h2>
          <ActivityTimeline activities={activities} entityName={`${client.firstName} ${client.lastName}`} />
        </div>
      </div>
    </DashboardLayout>
  )
}
