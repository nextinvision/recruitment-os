'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { NotificationDropdown } from '@/ui/NotificationDropdown'

interface NavbarProps {
  user: {
    id: string
    email: string
    firstName: string
    lastName: string
    role: string
  } | null
  onSidebarToggle: () => void
  isSidebarOpen: boolean
}

export function Navbar({ user, onSidebarToggle, isSidebarOpen }: NavbarProps) {
  const router = useRouter()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
    router.push('/login')
  }

  return (
    <nav className="bg-white border-b border-[#E5E7EB] shadow-sm sticky top-0 z-40">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left side - Sidebar toggle and logo */}
          <div className="flex items-center gap-4">
            <button
              onClick={onSidebarToggle}
              className="p-2 rounded-lg hover:bg-[#F8FAFC] transition-colors text-[#1F3A5F] hover:text-[#F4B400]"
              aria-label="Toggle sidebar"
            >
              {isSidebarOpen ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
            <div className="hidden sm:block">
              <h1 className="text-xl font-bold text-[#1F3A5F]">Careerist</h1>
            </div>
          </div>

          {/* Right side - User menu */}
          <div className="flex items-center gap-4">
            {/* Notifications dropdown */}
            <NotificationDropdown userId={user?.id || null} />

            {/* User dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-[#F8FAFC] transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-[#1F3A5F] flex items-center justify-center text-white font-semibold text-sm">
                  {user?.firstName?.[0]}{user?.lastName?.[0]}
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium text-[#0F172A]">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-xs text-[#64748B]">{user?.role}</p>
                </div>
                <svg className="hidden md:block w-4 h-4 text-[#64748B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Dropdown menu */}
              {isMobileMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setIsMobileMenuOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-[#E5E7EB] py-1 z-20">
                    <div className="px-4 py-3 border-b border-[#E5E7EB]">
                      <p className="text-sm font-medium text-[#0F172A]">
                        {user?.firstName} {user?.lastName}
                      </p>
                      <p className="text-xs text-[#64748B] truncate">{user?.email}</p>
                      <p className="text-xs text-[#64748B] mt-1">{user?.role}</p>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-[#0F172A] hover:bg-[#F8FAFC] transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Logout
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}

