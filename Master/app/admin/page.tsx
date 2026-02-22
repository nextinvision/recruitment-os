'use client'

import { Suspense, useEffect, useState, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { DashboardLayout } from '@/components/DashboardLayout'
import { ToastContainer, useToast, ConfirmDialog, useConfirmDialog } from '@/ui'
import { UserManagementTab } from './components/UserManagementTab'
import { SystemSettingsTab } from './components/SystemSettingsTab'
import { SystemHealthTab } from './components/SystemHealthTab'
import { AuditLogsTab } from './components/AuditLogsTab'
import { CommunicationsTab } from './components/CommunicationsTab'
import { RulesTab } from './components/RulesTab'

export type AdminTab = 'users' | 'settings' | 'health' | 'audit' | 'communications' | 'rules'

const ALL_TABS: { id: AdminTab; label: string }[] = [
  { id: 'users', label: 'User Management' },
  { id: 'settings', label: 'System Configuration' },
  { id: 'health', label: 'System Health' },
  { id: 'audit', label: 'Audit Logs' },
  { id: 'communications', label: 'Communications' },
  { id: 'rules', label: 'Automation Rules' },
]

const ADMIN_TABS: AdminTab[] = ['users', 'settings', 'health', 'audit', 'communications', 'rules']
const MANAGER_TABS: AdminTab[] = ['audit', 'communications', 'rules']

function getAllowedTabs(role: string | null): AdminTab[] {
  if (role === 'ADMIN') return ADMIN_TABS
  if (role === 'MANAGER') return MANAGER_TABS
  return []
}

function AdminPageFallback() {
  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto py-12 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#1F3A5F]" />
      </div>
    </DashboardLayout>
  )
}

function AdminPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState<AdminTab>('users')
  const [userRole, setUserRole] = useState<string | null>(null)
  const { toasts, showToast, removeToast } = useToast()
  const { dialogState, showConfirm, closeDialog, handleConfirm } = useConfirmDialog()

  const allowedTabs = useMemo(() => getAllowedTabs(userRole), [userRole])
  const visibleTabs = useMemo(
    () => ALL_TABS.filter((t) => allowedTabs.includes(t.id)),
    [allowedTabs]
  )

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }
    const userData = localStorage.getItem('user')
    if (userData) {
      try {
        const parsed = JSON.parse(userData)
        setUserRole(parsed.role ?? null)
      } catch {
        setUserRole(null)
      }
    }
  }, [router])

  useEffect(() => {
    if (userRole === null || allowedTabs.length === 0) return
    const tabFromUrl = searchParams.get('tab') as AdminTab | null
    const validTab =
      tabFromUrl && allowedTabs.includes(tabFromUrl)
        ? tabFromUrl
        : allowedTabs[0]
    setActiveTab(validTab)
    if (tabFromUrl !== validTab) {
      const url = new URL(window.location.href)
      url.searchParams.set('tab', validTab)
      router.replace(url.pathname + url.search, { scroll: false })
    }
  }, [userRole, searchParams, allowedTabs, router])

  const handleTabChange = (tab: AdminTab) => {
    setActiveTab(tab)
    const url = new URL(window.location.href)
    url.searchParams.set('tab', tab)
    router.replace(url.pathname + url.search, { scroll: false })
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'users':
        return <UserManagementTab showToast={showToast} />
      case 'settings':
        return <SystemSettingsTab showToast={showToast} />
      case 'health':
        return <SystemHealthTab showToast={showToast} />
      case 'audit':
        return <AuditLogsTab showToast={showToast} />
      case 'communications':
        return <CommunicationsTab showToast={showToast} />
      case 'rules':
        return <RulesTab showToast={showToast} />
      default:
        return <UserManagementTab showToast={showToast} />
    }
  }

  if (userRole === null) {
    return (
      <DashboardLayout>
        <div className="max-w-7xl mx-auto py-12 flex items-center justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#1F3A5F]" />
        </div>
      </DashboardLayout>
    )
  }

  if (allowedTabs.length === 0) {
    return (
      <DashboardLayout>
        <div className="max-w-7xl mx-auto py-8 text-center text-gray-600">
          You do not have access to any admin sections.
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <ConfirmDialog
        isOpen={dialogState.isOpen}
        onClose={closeDialog}
        onConfirm={handleConfirm}
        title={dialogState.title}
        message={dialogState.message}
        variant={dialogState.variant || 'danger'}
        confirmText={dialogState.confirmText}
        cancelText={dialogState.cancelText}
      />
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <div className="mb-4">
            <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
            <p className="mt-2 text-gray-700">
              Manage users, system configuration, audit logs, communications, and automation rules
            </p>
          </div>

          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {visibleTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-[#1F3A5F] text-[#1F3A5F]'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        <div className="mt-6">
          {renderTabContent()}
        </div>
      </div>
    </DashboardLayout>
  )
}

export default function AdminPage() {
  return (
    <Suspense fallback={<AdminPageFallback />}>
      <AdminPageContent />
    </Suspense>
  )
}
