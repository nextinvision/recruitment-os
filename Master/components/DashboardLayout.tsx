'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Sidebar } from '@/ui/Sidebar'
import { Navbar } from '@/ui/Navbar'

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter()
  const [user, setUser] = useState<{
    id: string
    email: string
    firstName: string
    lastName: string
    role: string
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    const userData = localStorage.getItem('user')

    const fetchUserFromToken = async () => {
      try {
        const response = await fetch('/api/auth/me', {
          credentials: 'include',
        })

        if (response.ok) {
          const fetchedUserData = await response.json()
          localStorage.setItem('user', JSON.stringify(fetchedUserData))
          setUser(fetchedUserData)
        } else {
          router.push('/login')
        }
      } catch {
        router.push('/login')
      } finally {
        setLoading(false)
      }
    }

    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData)
        setUser(parsedUser)
        setLoading(false)
      } catch {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        router.push('/login')
      }
    } else {
      fetchUserFromToken()
    }
  }, [router])

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024
      if (mobile) {
        setIsSidebarOpen(false)
      } else {
        const saved = localStorage.getItem('sidebarOpen')
        if (saved !== null) {
          setIsSidebarOpen(saved === 'true')
        } else {
          setIsSidebarOpen(true)
        }
      }
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const toggleSidebar = () => {
    const newState = !isSidebarOpen
    setIsSidebarOpen(newState)
    if (window.innerWidth >= 1024) {
      localStorage.setItem('sidebarOpen', String(newState))
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-900">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar user={user} onSidebarToggle={toggleSidebar} isSidebarOpen={isSidebarOpen} />
      <Sidebar user={user} isOpen={isSidebarOpen} onToggle={toggleSidebar} />
      <main className={`transition-all duration-300 min-h-screen ${isSidebarOpen ? 'lg:ml-64' : 'lg:ml-20'}`}>
        <div className="p-4 sm:p-6">
          {children}
        </div>
      </main>
    </div>
  )
}

