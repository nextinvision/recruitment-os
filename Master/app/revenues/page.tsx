'use client'

import { useState } from 'react'
import { DashboardLayout } from '@/components/DashboardLayout'
import { Modal, PageHeader } from '@/ui'
import { InvoicesClientList } from '@/components/revenues/InvoicesClientList'
import { InvoiceList } from '@/components/revenues/InvoiceList'
import { RevenueForm } from '@/components/revenues/RevenueForm'

export default function RevenuesPage() {
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null)
  const [selectedClientName, setSelectedClientName] = useState<string>('')
  const [showFormModal, setShowFormModal] = useState(false)
  const [selectedRevenue, setSelectedRevenue] = useState<any | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  const handleSelectClient = (clientId: string) => {
    setSelectedClientId(clientId)
    // We'll get the client name from the summary list in InvoiceList or find it in the summary data
  }

  const handleEditRevenue = (revenue: any) => {
    setSelectedRevenue(revenue)
    setShowFormModal(true)
  }

  const handleFormSuccess = () => {
    setShowFormModal(false)
    setSelectedRevenue(null)
    setRefreshKey(prev => prev + 1)
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          title="Revenue & Invoices"
          description="Manage client subscriptions and installments"
        />

        {!selectedClientId ? (
          <InvoicesClientList
            key={`clients-${refreshKey}`}
            onSelectClient={(id) => setSelectedClientId(id)}
          />
        ) : (
          <InvoiceList
            key={`invoices-${selectedClientId}-${refreshKey}`}
            clientId={selectedClientId}
            clientName={selectedClientName || 'Client'} // Optimization: pass client name
            onBack={() => setSelectedClientId(null)}
            onEditRevenue={handleEditRevenue}
          />
        )}

        {showFormModal && (
          <Modal
            isOpen={showFormModal}
            onClose={() => {
              setShowFormModal(false)
              setSelectedRevenue(null)
            }}
            title={selectedRevenue?.id ? 'Edit Invoice' : 'Create Invoice'}
            size="lg"
          >
            <RevenueForm
              revenue={selectedRevenue?.id ? selectedRevenue : null}
              initialClientId={selectedRevenue?.clientId}
              onSuccess={handleFormSuccess}
              onCancel={() => {
                setShowFormModal(false)
                setSelectedRevenue(null)
              }}
            />
          </Modal>
        )}
      </div>
    </DashboardLayout>
  )
}

