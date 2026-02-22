import React from 'react'
import Link from 'next/link'

interface FollowUp {
  id: string
  title: string
  scheduledDate: string
  lead?: { id: string; firstName: string; lastName: string; currentCompany?: string } | null
  client?: { id: string; firstName: string; lastName: string } | null
}

interface OverdueTasksWidgetProps {
  tasks: FollowUp[]
}

export function OverdueTasksWidget({ tasks }: OverdueTasksWidgetProps) {
  const getDaysOverdue = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const taskDate = new Date(date)
    taskDate.setHours(0, 0, 0, 0)
    
    const diffTime = today.getTime() - taskDate.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    return diffDays
  }

  const getEntityLink = (task: FollowUp) => {
    if (task.lead) {
      return `/leads/${task.lead.id}`
    }
    if (task.client) {
      return `/clients/${task.client.id}`
    }
    return '/followups'
  }

  const getEntityName = (task: FollowUp) => {
    if (task.lead) {
      return `${task.lead.firstName} ${task.lead.lastName}` + (task.lead.currentCompany ? ` (${task.lead.currentCompany})` : '')
    }
    if (task.client) {
      return `${task.client.firstName} ${task.client.lastName}`
    }
    return 'Unknown'
  }

  return (
    <div className="bg-white shadow-md rounded-xl p-6 border border-[#EF4444] border-2">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-[#EF4444]">⚠️ Overdue Tasks</h3>
        <Link href="/followups" className="text-sm font-medium text-[#1F3A5F] hover:text-[#F4B400] transition-colors">
          View all
        </Link>
      </div>
      <div className="space-y-3">
        {tasks.length > 0 ? (
          tasks.map((task) => {
            const daysOverdue = getDaysOverdue(task.scheduledDate)
            return (
              <Link
                key={task.id}
                href={getEntityLink(task)}
                className="block border-l-4 border-[#EF4444] pl-3 py-2 hover:bg-[rgba(239,68,68,0.05)] rounded-r transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="text-sm font-medium text-[#0F172A]">{task.title}</div>
                    <div className="text-xs text-[#64748B] mt-1">
                      {getEntityName(task)}
                    </div>
                  </div>
                  <div className="ml-2 text-xs font-semibold text-[#EF4444]">
                    {daysOverdue}d overdue
                  </div>
                </div>
              </Link>
            )
          })
        ) : (
          <p className="text-sm text-[#64748B]">No overdue tasks</p>
        )}
      </div>
    </div>
  )
}

