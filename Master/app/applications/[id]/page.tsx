'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { DashboardLayout } from '@/components/DashboardLayout'
import { Spinner, PageHeader, ApplicationActionForm } from '@/ui'
import { ApplicationDetails, type Application } from '@/components/applications/ApplicationDetails'

export default function ApplicationDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  
  const [application, setApplication] = useState<Application | null>(null)
  const [loading, setLoading] = useState(true)
  const [showActionModal, setShowActionModal] = useState(false)

  const loadApplication = useCallback(async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/login')
        return
      }

      const response = await fetch(`/api/applications/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      })

      if (response.ok) {
        const data = await response.json()
        setApplication(data)
      } else {
        router.push('/applications')
      }
    } catch (err) {
      console.error('Failed to load application:', err)
      router.push('/applications')
    } finally {
      setLoading(false)
    }
  }, [id, router])

  useEffect(() => {
    if (id) {
      loadApplication()
    }
  }, [id, loadApplication])

  if (loading) {
    return (
      <DashboardLayout>
        <Spinner fullScreen />
      </DashboardLayout>
    )
  }

  if (!application) return null

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <PageHeader
          title="Application Details"
          description={`Track progress for ${application.client?.firstName} ${application.client?.lastName}`}
          breadcrumbs={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Applications', href: '/applications' },
            { label: 'Details' }
          ]}
        />

        <div className="bg-white shadow-md rounded-xl border border-[#E5E7EB] p-6">
          <ApplicationDetails
            application={application}
            onUpdate={loadApplication}
            onLogAction={() => setShowActionModal(true)}
          />
        </div>

        {application && (
          <ApplicationActionForm
            isOpen={showActionModal}
            onClose={() => setShowActionModal(false)}
            applicationId={application.id}
            onSuccess={() => {
              loadApplication()
              setShowActionModal(false)
            }}
          />
        )}
      </div>
    </DashboardLayout>
  )
}
