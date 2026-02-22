'use client'

import React, { useState, useEffect } from 'react'
import { Modal, Input, Select, Button, Alert } from './index'
import { ServiceType } from '@prisma/client'

interface PreparationStepModalProps {
  isOpen: boolean
  onClose: () => void
  stepName: string
  clientId: string
  currentValue?: any
  onSuccess: () => void
}

export function PreparationStepModal({
  isOpen,
  onClose,
  stepName,
  clientId,
  currentValue,
  onSuccess,
}: PreparationStepModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState<any>({})
  const [recruiters, setRecruiters] = useState<Array<{ id: string; firstName: string; lastName: string }>>([])

  useEffect(() => {
    if (isOpen) {
      loadRecruiters()
      initializeFormData()
    }
  }, [isOpen, stepName, currentValue])

  const initializeFormData = () => {
    switch (stepName) {
      case 'Service Type':
        setFormData({ serviceType: currentValue || '' })
        break
      case 'Reverse Recruiter':
        setFormData({ reverseRecruiterId: currentValue || '' })
        break
      case 'Gmail ID Creation':
        setFormData({ 
          gmailId: currentValue?.gmailId || '',
          gmailCreated: currentValue?.gmailCreated || false,
        })
        break
      case 'WhatsApp Group Created':
        setFormData({ 
          whatsappGroupCreated: currentValue?.whatsappGroupCreated || false,
          whatsappGroupId: currentValue?.whatsappGroupId || '',
        })
        break
      case 'LinkedIn Optimized':
        setFormData({ linkedInOptimized: currentValue || false })
        break
      default:
        setFormData({})
    }
  }

  const loadRecruiters = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const response = await fetch('/api/users?role=RECRUITER', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      })

      if (response.ok) {
        const data = await response.json()
        setRecruiters(data.map((u: any) => ({
          id: u.id,
          firstName: u.firstName,
          lastName: u.lastName,
        })))
      }
    } catch (err) {
      console.error('Failed to load recruiters:', err)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const token = localStorage.getItem('token')
      if (!token) {
        setError('Not authenticated')
        return
      }

      let endpoint = ''
      let payload: any = {}

      switch (stepName) {
        case 'Service Type':
          endpoint = `/api/clients/${clientId}/preparation/service-type`
          payload = { serviceType: formData.serviceType }
          break
        case 'Reverse Recruiter':
          endpoint = `/api/clients/${clientId}/preparation/reverse-recruiter`
          payload = { reverseRecruiterId: formData.reverseRecruiterId }
          break
        case 'Gmail ID Creation':
          endpoint = `/api/clients/${clientId}`
          payload = {
            gmailId: formData.gmailId || undefined,
            gmailCreated: formData.gmailCreated,
            gmailCreatedAt: formData.gmailCreated ? new Date().toISOString() : undefined,
          }
          break
        case 'WhatsApp Group Created':
          endpoint = `/api/clients/${clientId}`
          payload = {
            whatsappGroupCreated: formData.whatsappGroupCreated,
            whatsappGroupId: formData.whatsappGroupId || undefined,
            whatsappGroupCreatedAt: formData.whatsappGroupCreated ? new Date().toISOString() : undefined,
          }
          break
        case 'LinkedIn Optimized':
          endpoint = `/api/clients/${clientId}`
          payload = {
            linkedInOptimized: formData.linkedInOptimized,
            linkedInOptimizedAt: formData.linkedInOptimized ? new Date().toISOString() : undefined,
          }
          break
        default:
          setError('Step not editable')
          return
      }

      const method = endpoint.includes('/preparation/') ? 'PATCH' : 'PATCH'

      const response = await fetch(endpoint, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        onSuccess()
        onClose()
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to update step')
      }
    } catch (err) {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const renderFormFields = () => {
    switch (stepName) {
      case 'Service Type':
        return (
          <Select
            label="Service Type"
            value={formData.serviceType}
            onChange={(e) => setFormData({ ...formData, serviceType: e.target.value })}
            options={[
              { value: '', label: 'Select Service Type' },
              { value: 'STANDARD', label: 'Standard' },
              { value: 'PREMIUM', label: 'Premium' },
              { value: 'EXECUTIVE', label: 'Executive' },
              { value: 'CONTRACT', label: 'Contract' },
              { value: 'CUSTOM', label: 'Custom' },
            ]}
            required
          />
        )
      case 'Reverse Recruiter':
        return (
          <Select
            label="Reverse Recruiter"
            value={formData.reverseRecruiterId}
            onChange={(e) => setFormData({ ...formData, reverseRecruiterId: e.target.value })}
            options={[
              { value: '', label: 'Select Reverse Recruiter' },
              ...recruiters.map(r => ({ value: r.id, label: `${r.firstName} ${r.lastName}` })),
            ]}
            required
          />
        )
      case 'Gmail ID Creation':
        return (
          <>
            <Input
              label="Gmail ID"
              type="text"
              value={formData.gmailId}
              onChange={(e) => setFormData({ ...formData, gmailId: e.target.value })}
              placeholder="e.g., john.doe@gmail.com"
            />
            <div className="flex items-center">
              <input
                type="checkbox"
                id="gmailCreated"
                checked={formData.gmailCreated}
                onChange={(e) => setFormData({ ...formData, gmailCreated: e.target.checked })}
                className="mr-2"
              />
              <label htmlFor="gmailCreated" className="text-sm text-gray-700">Gmail Created</label>
            </div>
          </>
        )
      case 'WhatsApp Group Created':
        return (
          <>
            <Input
              label="WhatsApp Group ID/Link"
              type="text"
              value={formData.whatsappGroupId}
              onChange={(e) => setFormData({ ...formData, whatsappGroupId: e.target.value })}
              placeholder="Group ID or invite link"
            />
            <div className="flex items-center">
              <input
                type="checkbox"
                id="whatsappGroupCreated"
                checked={formData.whatsappGroupCreated}
                onChange={(e) => setFormData({ ...formData, whatsappGroupCreated: e.target.checked })}
                className="mr-2"
              />
              <label htmlFor="whatsappGroupCreated" className="text-sm text-gray-700">WhatsApp Group Created</label>
            </div>
          </>
        )
      case 'LinkedIn Optimized':
        return (
          <div className="flex items-center">
            <input
              type="checkbox"
              id="linkedInOptimized"
              checked={formData.linkedInOptimized}
              onChange={(e) => setFormData({ ...formData, linkedInOptimized: e.target.checked })}
              className="mr-2"
            />
            <label htmlFor="linkedInOptimized" className="text-sm text-gray-700">LinkedIn Optimized</label>
          </div>
        )
      default:
        return <p className="text-gray-500">This step cannot be edited directly.</p>
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Update ${stepName}`}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <Alert variant="error">{error}</Alert>}
        
        {renderFormFields()}

        <div className="flex justify-end gap-3 pt-4">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={loading}
          >
            {loading ? 'Updating...' : 'Update'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

