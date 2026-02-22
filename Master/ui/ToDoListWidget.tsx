import React, { useState } from 'react'
import Link from 'next/link'

interface FollowUp {
  id: string
  title: string
  description?: string | null
  scheduledDate: string
  completed: boolean
  lead?: { id: string; firstName: string; lastName: string; currentCompany?: string } | null
  client?: { id: string; firstName: string; lastName: string } | null
}

interface ToDoListWidgetProps {
  todos: FollowUp[]
  onComplete?: (id: string) => void
}

export function ToDoListWidget({ todos, onComplete }: ToDoListWidgetProps) {
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set())

  const handleToggle = async (id: string) => {
    if (completedIds.has(id)) return
    
    setCompletedIds(new Set([...completedIds, id]))
    
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/followups/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: 'include',
        body: JSON.stringify({ completed: true }),
      })

      if (response.ok && onComplete) {
        onComplete(id)
      } else if (!response.ok) {
        setCompletedIds(new Set([...completedIds].filter(x => x !== id)))
      }
    } catch (error) {
      console.error('Failed to mark as complete:', error)
      setCompletedIds(new Set([...completedIds].filter(x => x !== id)))
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  }

  const getEntityLink = (todo: FollowUp) => {
    if (todo.lead) {
      return `/leads/${todo.lead.id}`
    }
    if (todo.client) {
      return `/clients/${todo.client.id}`
    }
    return '/followups'
  }

  const getEntityName = (todo: FollowUp) => {
    if (todo.lead) {
      return `${todo.lead.firstName} ${todo.lead.lastName}` + (todo.lead.currentCompany ? ` (${todo.lead.currentCompany})` : '')
    }
    if (todo.client) {
      return `${todo.client.firstName} ${todo.client.lastName}`
    }
    return 'Unknown'
  }

  const visibleTodos = todos.filter(t => !completedIds.has(t.id) && !t.completed)

  return (
    <div className="bg-white shadow-md rounded-xl p-6 border border-[#E5E7EB]">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-[#0F172A]">📋 Today's To-Do List</h3>
        <Link href="/followups" className="text-sm font-medium text-[#1F3A5F] hover:text-[#F4B400] transition-colors">
          View all
        </Link>
      </div>
      <div className="space-y-2">
        {visibleTodos.length > 0 ? (
          visibleTodos.map((todo) => (
            <div
              key={todo.id}
              className="flex items-start p-3 border border-[#E5E7EB] rounded-lg hover:bg-[rgba(244,180,0,0.05)] transition-colors"
            >
              <input
                type="checkbox"
                checked={completedIds.has(todo.id) || todo.completed}
                onChange={() => handleToggle(todo.id)}
                className="mt-1 h-4 w-4 text-[#1F3A5F] border-[#E5E7EB] rounded focus:ring-[#F4B400]"
              />
              <div className="ml-3 flex-1">
                <Link href={getEntityLink(todo)} className="block">
                  <div className="text-sm font-medium text-[#0F172A]">{todo.title}</div>
                  {todo.description && (
                    <div className="text-xs text-[#64748B] mt-1">{todo.description}</div>
                  )}
                  <div className="text-xs text-[#64748B] mt-1">
                    {getEntityName(todo)} • {formatTime(todo.scheduledDate)}
                  </div>
                </Link>
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-[#64748B]">No tasks for today</p>
        )}
      </div>
    </div>
  )
}

