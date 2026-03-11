'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/DashboardLayout'

interface Notification {
    id: string
    type: string
    title: string
    message: string
    read: boolean
    createdAt: string
}

type FilterType = 'ALL' | 'UNREAD' | 'READ'

const getNotificationIcon = (type: string) => {
    switch (type) {
        case 'FOLLOW_UP_REMINDER':
            return (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            )
        case 'INTERVIEW_ALERT':
            return (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
            )
        case 'OVERDUE_TASK':
            return (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
            )
        case 'AI_INSIGHT':
            return (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
            )
        case 'JOB_SCRAPE_CONFIRMATION':
            return (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
            )
        default:
            return (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
            )
    }
}

const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    }).format(date)
}

export default function NotificationsPage() {
    const router = useRouter()
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState<FilterType>('ALL')

    const fetchNotifications = async () => {
        try {
            setLoading(true)
            const token = localStorage.getItem('token')
            const response = await fetch('/api/notifications', {
                headers: {
                    ...(token && { 'Authorization': `Bearer ${token}` }),
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
            })

            if (response.ok) {
                const data = await response.json()
                setNotifications(data)
            } else if (response.status === 401) {
                router.push('/login')
            }
        } catch (error) {
            console.error('Failed to load notifications:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchNotifications()
    }, [])

    const markAsRead = async (id: string, e?: React.MouseEvent) => {
        if (e) e.stopPropagation()
        try {
            const token = localStorage.getItem('token')
            const response = await fetch(`/api/notifications/${id}`, {
                method: 'PATCH',
                headers: {
                    ...(token && { 'Authorization': `Bearer ${token}` }),
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({ read: true }),
            })

            if (response.ok) {
                setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
            }
        } catch (error) {
            console.error('Failed to mark as read:', error)
        }
    }

    const markAllAsRead = async () => {
        try {
            const token = localStorage.getItem('token')
            const response = await fetch('/api/notifications/mark-all-read', {
                method: 'POST',
                headers: {
                    ...(token && { 'Authorization': `Bearer ${token}` }),
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
            })

            if (response.ok) {
                setNotifications(prev => prev.map(n => ({ ...n, read: true })))
            }
        } catch (error) {
            console.error('Failed to mark all as read:', error)
        }
    }

    const filteredNotifications = notifications.filter(n => {
        if (filter === 'UNREAD') return !n.read
        if (filter === 'READ') return n.read
        return true
    })

    // Optional: We can group these or just render the filtered list cleanly
    const unreadCount = notifications.filter(n => !n.read).length

    return (
        <DashboardLayout>
            <div className="max-w-5xl mx-auto py-6 px-4 sm:px-6 lg:px-8">

                {/* Header Section */}
                <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-[#0F172A]">Notifications</h1>
                        <p className="mt-2 text-sm text-[#64748B]">
                            You have {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}.
                        </p>
                    </div>
                    {unreadCount > 0 && (
                        <button
                            onClick={markAllAsRead}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-[#1F3A5F] hover:bg-[#0F172A] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1F3A5F] transition-colors"
                        >
                            <svg className="-ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Mark all as read
                        </button>
                    )}
                </div>

                {/* Filters */}
                <div className="bg-white rounded-t-xl border-b border-[#E5E7EB] p-4 flex gap-4">
                    <button
                        onClick={() => setFilter('ALL')}
                        className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${filter === 'ALL' ? 'bg-[#F4B400] text-white' : 'text-[#64748B] hover:bg-[#F8FAFC]'
                            }`}
                    >
                        All
                    </button>
                    <button
                        onClick={() => setFilter('UNREAD')}
                        className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 ${filter === 'UNREAD' ? 'bg-[#F4B400] text-white' : 'text-[#64748B] hover:bg-[#F8FAFC]'
                            }`}
                    >
                        Unread
                        {unreadCount > 0 && (
                            <span className={`px-2 py-0.5 rounded-full text-xs ${filter === 'UNREAD' ? 'bg-white text-[#F4B400]' : 'bg-[#EF4444] text-white'}`}>
                                {unreadCount}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => setFilter('READ')}
                        className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${filter === 'READ' ? 'bg-[#F4B400] text-white' : 'text-[#64748B] hover:bg-[#F8FAFC]'
                            }`}
                    >
                        Read
                    </button>
                </div>

                {/* List Section */}
                <div className="bg-white rounded-b-xl shadow-sm border border-t-0 border-[#E5E7EB] overflow-hidden">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F4B400] border-t-[#1F3A5F]"></div>
                            <p className="mt-4 text-[#64748B] font-medium">Loading notifications...</p>
                        </div>
                    ) : filteredNotifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
                            <div className="h-16 w-16 bg-[#F8FAFC] rounded-full flex items-center justify-center mb-4">
                                <svg className="h-8 w-8 text-[#94A3B8]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-medium text-[#0F172A]">We're all caught up!</h3>
                            <p className="mt-2 text-sm text-[#64748B]">You have no {filter.toLowerCase()} notifications at this time.</p>
                        </div>
                    ) : (
                        <ul className="divide-y divide-[#E5E7EB]">
                            {filteredNotifications.map((notification) => (
                                <li
                                    key={notification.id}
                                    className={`group relative flex items-start gap-4 p-5 hover:bg-[#F8FAFC] transition-colors cursor-default ${!notification.read ? 'bg-[rgba(244,180,0,0.05)]' : ''
                                        }`}
                                    onClick={() => !notification.read && markAsRead(notification.id)}
                                >
                                    {/* Icon */}
                                    <div className={`mt-1 shrink-0 ${!notification.read ? 'text-[#F4B400]' : 'text-[#94A3B8]'}`}>
                                        {getNotificationIcon(notification.type)}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-2 mb-1">
                                            <h4 className={`text-base font-semibold ${!notification.read ? 'text-[#0F172A]' : 'text-[#334155]'}`}>
                                                {notification.title}
                                            </h4>
                                            <time className="shrink-0 text-sm text-[#64748B] whitespace-nowrap">
                                                {formatDateTime(notification.createdAt)}
                                            </time>
                                        </div>

                                        <p className={`text-sm md:text-base leading-relaxed ${!notification.read ? 'text-[#334155]' : 'text-[#64748B]'}`}>
                                            {notification.message}
                                        </p>
                                    </div>

                                    {/* Actions / Indicators */}
                                    <div className="shrink-0 flex items-center justify-end w-12 pt-2">
                                        {!notification.read && (
                                            <span className="h-3 w-3 bg-[#F4B400] rounded-full shadow-[0_0_8px_rgba(244,180,0,0.5)]" title="Unread"></span>
                                        )}
                                        {notification.read && (
                                            <button
                                                className="opacity-0 group-hover:opacity-100 transition-opacity p-2 text-[#94A3B8] hover:text-[#1F3A5F] rounded-full hover:bg-white border border-transparent hover:border-[#E5E7EB]"
                                                title="Already Read"
                                                disabled
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                </svg>
                                            </button>
                                        )}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </DashboardLayout>
    )
}
