import React from 'react'
import Link from 'next/link'

interface FollowUp {
  id: string
  title: string
  scheduledDate: string
  lead?: { id: string; firstName: string; lastName: string; currentCompany?: string } | null
  client?: { id: string; firstName: string; lastName: string } | null
}

interface PendingFollowUpsWidgetProps {
  followUps: FollowUp[]
}

export function PendingFollowUpsWidget({ followUps }: PendingFollowUpsWidgetProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const followUpDate = new Date(date)
    followUpDate.setHours(0, 0, 0, 0)
    
    const diffTime = followUpDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Tomorrow'
    if (diffDays === -1) return 'Yesterday'
    if (diffDays > 0) return `In ${diffDays} days`
    return `${Math.abs(diffDays)} days ago`
  }

  const getEntityLink = (followUp: FollowUp) => {
    if (followUp.lead) {
      return `/leads/${followUp.lead.id}`
    }
    if (followUp.client) {
      return `/clients/${followUp.client.id}`
    }
    return '/followups'
  }

  const getEntityName = (followUp: FollowUp) => {
    if (followUp.lead) {
      return `${followUp.lead.firstName} ${followUp.lead.lastName}` + (followUp.lead.currentCompany ? ` (${followUp.lead.currentCompany})` : '')
    }
    if (followUp.client) {
      return `${followUp.client.firstName} ${followUp.client.lastName}`
    }
    return 'Unknown'
  }

  return (
    <div className="bg-white shadow-md rounded-xl p-6 border border-[#E5E7EB]">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-[#0F172A]">Pending Follow-ups</h3>
        <Link href="/followups" className="text-sm font-medium text-[#1F3A5F] hover:text-[#F4B400] transition-colors">
          View all
        </Link>
      </div>
      <div className="space-y-3">
        {followUps.length > 0 ? (
          followUps.map((followUp) => (
            <Link
              key={followUp.id}
              href={getEntityLink(followUp)}
              className="block border-l-4 border-[#1F3A5F] pl-3 py-2 hover:bg-[rgba(31,58,95,0.05)] rounded-r transition-colors"
            >
              <div className="text-sm font-medium text-[#0F172A]">{followUp.title}</div>
              <div className="text-xs text-[#64748B] mt-1">
                {getEntityName(followUp)} • {formatDate(followUp.scheduledDate)}
              </div>
            </Link>
          ))
        ) : (
          <p className="text-sm text-[#64748B]">No pending follow-ups</p>
        )}
      </div>
    </div>
  )
}

