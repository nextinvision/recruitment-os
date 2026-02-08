'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { DashboardLayout } from '@/components/DashboardLayout'
import { ActivityTimeline } from '@/ui/ActivityTimeline'
import Link from 'next/link'
import { formatINR } from '@/lib/currency'

interface Lead {
  id: string
  companyName: string
  contactName: string
  email?: string
  phone?: string
  status: 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'LOST'
  source?: string
  industry?: string
  estimatedValue?: string
  notes?: string
  assignedUser: {
    id: string
    firstName: string
    lastName: string
  }
  client?: {
    id: string
    companyName: string
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

export default function LeadProfilePage() {
  const router = useRouter()
  const params = useParams()
  const leadId = params.id as string

  const [lead, setLead] = useState<Lead | null>(null)
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (leadId) {
      loadLead()
      loadActivities()
    }
  }, [leadId])

  const loadLead = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/login')
        return
      }

      const response = await fetch(`/api/leads/${leadId}`, {
        headers: {
          ...(token && { 'Authorization': `Bearer ${token}` }),
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      })

      if (response.ok) {
        const data = await response.json()
        setLead(data)
      }
    } catch (err) {
      console.error('Failed to load lead:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadActivities = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const response = await fetch(`/api/activities/entity/lead/${leadId}`, {
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

  const handleConvertToClient = async () => {
    if (!confirm('Convert this lead to a client? This action cannot be undone.')) return

    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const response = await fetch(`/api/leads/${leadId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ status: 'QUALIFIED' }),
      })

      if (response.ok) {
        // Create client from lead
        // Convert lead contact to client (job seeker)
        // Split contactName into firstName and lastName
        const nameParts = lead?.contactName?.split(' ') || ['Client', 'Name']
        const firstName = nameParts[0] || 'Client'
        const lastName = nameParts.slice(1).join(' ') || 'Name'
        
        const clientResponse = await fetch('/api/clients', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            firstName: firstName,
            lastName: lastName,
            email: lead?.email,
            phone: lead?.phone,
            industry: lead?.industry,
            notes: lead?.notes && lead?.companyName 
              ? `Converted from lead: ${lead.companyName}\n${lead.notes}` 
              : lead?.companyName 
                ? `Converted from lead: ${lead.companyName}` 
                : 'Converted from lead',
            leadId: leadId,
            assignedUserId: lead?.assignedUser.id,
          }),
        })

        if (clientResponse.ok) {
          const client = await clientResponse.json()
          router.push(`/clients/${client.id}`)
        }
      }
    } catch (err) {
      console.error('Failed to convert lead:', err)
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

  if (!lead) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-careerist-text-secondary">Lead not found</p>
          <Link href="/leads" className="text-careerist-primary-yellow hover:underline mt-4 inline-block">
            Back to Leads
          </Link>
        </div>
      </DashboardLayout>
    )
  }

  const statusColors: Record<string, string> = {
    NEW: 'bg-blue-100 text-blue-800',
    CONTACTED: 'bg-yellow-100 text-yellow-800',
    QUALIFIED: 'bg-green-100 text-green-800',
    LOST: 'bg-red-100 text-red-800',
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <Link href="/leads" className="text-careerist-primary-yellow hover:underline text-sm mb-2 inline-block">
              ← Back to Leads
            </Link>
            <h1 className="text-2xl font-bold text-careerist-text-primary">{lead.companyName}</h1>
            <p className="text-careerist-text-secondary mt-1">{lead.contactName}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`px-3 py-1 rounded text-sm font-medium ${statusColors[lead.status]}`}>
              {lead.status}
            </span>
            {lead.status !== 'LOST' && !lead.client && (
              <button
                onClick={handleConvertToClient}
                className="px-4 py-2 bg-careerist-primary-yellow text-careerist-primary-navy rounded-lg hover:bg-careerist-yellow-hover transition-colors font-semibold"
              >
                Convert to Client
              </button>
            )}
            {lead.client && (
              <Link
                href={`/clients/${lead.client.id}`}
                className="px-4 py-2 bg-careerist-primary-yellow text-careerist-primary-navy rounded-lg hover:bg-careerist-yellow-hover transition-colors font-semibold"
              >
                View Client
              </Link>
            )}
          </div>
        </div>

        {/* Lead Details */}
        <div className="bg-careerist-card rounded-lg shadow border border-careerist-border p-6">
          <h2 className="text-lg font-semibold text-careerist-text-primary mb-4">Lead Information</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-careerist-text-secondary">Email</label>
              <p className="text-careerist-text-primary">{lead.email || '-'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-careerist-text-secondary">Phone</label>
              <p className="text-careerist-text-primary">{lead.phone || '-'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-careerist-text-secondary">Source</label>
              <p className="text-careerist-text-primary">{lead.source || '-'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-careerist-text-secondary">Industry</label>
              <p className="text-careerist-text-primary">{lead.industry || '-'}</p>
            </div>
            {lead.estimatedValue && (
              <div>
                <label className="text-sm font-medium text-careerist-text-secondary">Estimated Value</label>
                <p className="text-careerist-text-primary font-semibold">
                  {formatINR(lead.estimatedValue)}
                </p>
              </div>
            )}
            <div>
              <label className="text-sm font-medium text-careerist-text-secondary">Assigned To</label>
              <p className="text-careerist-text-primary">
                {lead.assignedUser.firstName} {lead.assignedUser.lastName}
              </p>
            </div>
            {lead.notes && (
              <div className="col-span-2">
                <label className="text-sm font-medium text-careerist-text-secondary">Notes</label>
                <p className="text-careerist-text-primary">{lead.notes}</p>
              </div>
            )}
          </div>
        </div>

        {/* Activity Timeline */}
        <div className="bg-careerist-card rounded-lg shadow border border-careerist-border p-6">
          <h2 className="text-lg font-semibold text-careerist-text-primary mb-4">Activity Timeline</h2>
          <ActivityTimeline activities={activities} entityName={lead.companyName} />
        </div>
      </div>
    </DashboardLayout>
  )
}

