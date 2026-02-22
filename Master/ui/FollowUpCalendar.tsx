'use client'

import React, { useState } from 'react'
import Link from 'next/link'

interface FollowUp {
  id: string
  title: string
  description?: string
  scheduledDate: string
  completed: boolean
  lead?: {
    id: string
    firstName: string
    lastName: string
    currentCompany?: string
  }
  client?: {
    id: string
    firstName: string
    lastName: string
  }
  assignedUser: {
    firstName: string
    lastName: string
  }
}

interface FollowUpCalendarProps {
  followUps: FollowUp[]
  onDateClick?: (date: Date) => void
  onFollowUpClick?: (followUp: FollowUp) => void
}

export function FollowUpCalendar({ followUps, onDateClick, onFollowUpClick }: FollowUpCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const firstDayOfMonth = new Date(year, month, 1)
  const lastDayOfMonth = new Date(year, month + 1, 0)
  const firstDayOfWeek = firstDayOfMonth.getDay()
  const daysInMonth = lastDayOfMonth.getDate()

  const days: (Date | null)[] = []
  
  // Add empty cells for days before the first day of the month
  for (let i = 0; i < firstDayOfWeek; i++) {
    days.push(null)
  }
  
  // Add all days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    days.push(new Date(year, month, day))
  }

  const getFollowUpsForDate = (date: Date | null): FollowUp[] => {
    if (!date) return []
    
    const dateStr = date.toISOString().split('T')[0]
    return followUps.filter(fu => {
      const fuDate = new Date(fu.scheduledDate).toISOString().split('T')[0]
      return fuDate === dateStr && !fu.completed
    })
  }

  const isToday = (date: Date | null): boolean => {
    if (!date) return false
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }

  const isOverdue = (date: Date | null): boolean => {
    if (!date) return false
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return date < today
  }

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1))
  }

  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1))
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  return (
    <div className="bg-white shadow-md rounded-xl border border-[#E5E7EB] p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-[#0F172A]">
          {monthNames[month]} {year}
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={goToPreviousMonth}
            className="px-3 py-1 border border-[#E5E7EB] rounded hover:bg-[#F8FAFC] transition-colors"
          >
            ←
          </button>
          <button
            onClick={goToToday}
            className="px-3 py-1 border border-[#E5E7EB] rounded hover:bg-[#F8FAFC] transition-colors text-sm"
          >
            Today
          </button>
          <button
            onClick={goToNextMonth}
            className="px-3 py-1 border border-[#E5E7EB] rounded hover:bg-[#F8FAFC] transition-colors"
          >
            →
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {dayNames.map(day => (
          <div key={day} className="text-center text-sm font-semibold text-[#64748B] py-2">
            {day}
          </div>
        ))}
        
        {days.map((date, index) => {
          const dateFollowUps = getFollowUpsForDate(date)
          const today = isToday(date)
          const overdue = isOverdue(date)
          
          return (
            <div
              key={index}
              onClick={() => date && onDateClick?.(date)}
              className={`min-h-[100px] border border-[#E5E7EB] p-2 ${
                today ? 'bg-[#F0F9FF] border-[#1F3A5F]' : ''
              } ${overdue && dateFollowUps.length > 0 ? 'bg-red-50 border-red-200' : ''} ${
                date ? 'hover:bg-[#F8FAFC] cursor-pointer' : 'bg-gray-50'
              } transition-colors`}
            >
              {date && (
                <>
                  <div className={`text-sm font-medium mb-1 ${
                    today ? 'text-[#1F3A5F]' : overdue ? 'text-red-600' : 'text-[#0F172A]'
                  }`}>
                    {date.getDate()}
                  </div>
                  <div className="space-y-1">
                    {dateFollowUps.slice(0, 3).map(fu => (
                      <div
                        key={fu.id}
                        onClick={(e) => {
                          e.stopPropagation()
                          onFollowUpClick?.(fu)
                        }}
                        className={`text-xs p-1 rounded truncate cursor-pointer ${
                          overdue
                            ? 'bg-red-100 text-red-800 border border-red-200'
                            : 'bg-blue-100 text-blue-800 border border-blue-200'
                        } hover:opacity-80 transition-opacity`}
                        title={fu.title}
                      >
                        {fu.title}
                      </div>
                    ))}
                    {dateFollowUps.length > 3 && (
                      <div className="text-xs text-[#64748B] font-medium">
                        +{dateFollowUps.length - 3} more
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )
        })}
      </div>

      <div className="mt-4 flex items-center gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-100 border border-blue-200 rounded"></div>
          <span className="text-[#64748B]">Upcoming</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-100 border border-red-200 rounded"></div>
          <span className="text-[#64748B]">Overdue</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-[#F0F9FF] border border-[#1F3A5F] rounded"></div>
          <span className="text-[#64748B]">Today</span>
        </div>
      </div>
    </div>
  )
}

