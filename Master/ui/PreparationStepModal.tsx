'use client'

import React, { useState, useEffect } from 'react'
import { Modal, Input, Select, Button, Alert, Textarea } from './index'

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
  const [strategyFiles, setStrategyFiles] = useState<File[]>([])

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
      case 'Job Search Strategy':
        setFormData({
          strategyDescription: currentValue?.description || '',
          strategyLink: currentValue?.link || '',
        })
        setStrategyFiles([])
        break
      case 'Resume + Cover Letter':
        setFormData({
          resumeDescription: currentValue?.description || '',
          resumeLink: currentValue?.link || '',
        })
        setStrategyFiles([])
        break
      default:
        setFormData({})
    }
  }

  const loadRecruiters = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const response = await fetch('/api/users?role=RECRUITER,SALES', {
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
        case 'Job Search Strategy': {
          if (!strategyFiles.length) {
            setError('Please upload at least one strategy file.')
            return
          }

          const descriptionParts: string[] = []
          if (formData.strategyDescription) {
            descriptionParts.push(formData.strategyDescription)
          }
          if (formData.strategyLink) {
            descriptionParts.push(`Link: ${formData.strategyLink}`)
          }
          const description = descriptionParts.join('\n\n') || undefined

          for (const file of strategyFiles) {
            const uploadForm = new FormData()
            uploadForm.append('file', file)
            uploadForm.append('fileType', 'DOCUMENT')

            const uploadResponse = await fetch('/api/files/upload', {
              method: 'POST',
              headers: { 'Authorization': `Bearer ${token}` },
              credentials: 'include',
              body: uploadForm,
            })

            if (!uploadResponse.ok) {
              const uploadError = await uploadResponse.json().catch(() => ({}))
              throw new Error(uploadError.error || 'Failed to upload strategy file')
            }

            const fileRecord = await uploadResponse.json()

            const documentResponse = await fetch(`/api/clients/${clientId}/documents`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
              credentials: 'include',
              body: JSON.stringify({
                type: 'JOB_SEARCH_STRATEGY',
                fileUrl: fileRecord.fileUrl,
                fileName: fileRecord.fileName,
                originalFileName: file.name || undefined,
                fileSize: fileRecord.fileSize,
                description,
              }),
            })

            if (!documentResponse.ok) {
              const docError = await documentResponse.json().catch(() => ({}))
              throw new Error(docError.error || 'Failed to save job search strategy document')
            }
          }

          onSuccess()
          onClose()
          return
        }
        case 'Resume + Cover Letter': {
          if (!strategyFiles.length) {
            setError('Please upload at least one file (resume or cover letter).')
            return
          }

          const descriptionParts: string[] = []
          if (formData.resumeDescription) {
            descriptionParts.push(formData.resumeDescription)
          }
          if (formData.resumeLink) {
            descriptionParts.push(`Link: ${formData.resumeLink}`)
          }
          const description = descriptionParts.join('\n\n') || undefined

          for (const file of strategyFiles) {
            const uploadForm = new FormData()
            uploadForm.append('file', file)
            uploadForm.append('fileType', 'DOCUMENT')

            const uploadResponse = await fetch('/api/files/upload', {
              method: 'POST',
              headers: { 'Authorization': `Bearer ${token}` },
              credentials: 'include',
              body: uploadForm,
            })

            if (!uploadResponse.ok) {
              const uploadError = await uploadResponse.json().catch(() => ({}))
              throw new Error(uploadError.error || 'Failed to upload file')
            }

            const fileRecord = await uploadResponse.json()

            const letterResponse = await fetch(`/api/clients/${clientId}/cover-letters`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
              credentials: 'include',
              body: JSON.stringify({
                fileUrl: fileRecord.fileUrl,
                fileName: fileRecord.fileName,
                originalFileName: file.name || undefined,
                fileSize: fileRecord.fileSize,
                description,
              }),
            })

            if (!letterResponse.ok) {
              const letterError = await letterResponse.json().catch(() => ({}))
              throw new Error(letterError.error || 'Failed to save resume/cover letter')
            }
          }

          onSuccess()
          onClose()
          return
        }
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
      case 'Job Search Strategy':
        return (
          <>
            <Textarea
              label="Job Search Strategy Notes"
              value={formData.strategyDescription || ''}
              onChange={(e) => setFormData({ ...formData, strategyDescription: e.target.value })}
              placeholder="Describe the job search strategy, key focus areas, target roles, locations, etc."
              rows={4}
            />
            <Input
              label="Strategy Link (optional)"
              type="url"
              value={formData.strategyLink || ''}
              onChange={(e) => setFormData({ ...formData, strategyLink: e.target.value })}
              placeholder="e.g., Notion doc, Google Drive link"
            />
            <div className="mt-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Strategy Files (PDF, Word, Excel, images, videos, etc.)
              </label>
              <input
                type="file"
                multiple
                onChange={(e) => {
                  const files = Array.from(e.target.files || [])
                  setStrategyFiles(files)
                }}
                className="block w-full text-sm text-gray-700 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border file:border-gray-300 file:text-sm file:font-medium file:bg-white file:text-gray-700 hover:file:bg-gray-50"
              />
              <p className="mt-1 text-xs text-gray-500">
                You can upload multiple files: PDFs, docs, spreadsheets, images, videos, etc.
              </p>
            </div>
          </>
        )
      case 'Resume + Cover Letter':
        return (
          <>
            <Textarea
              label="Notes (optional)"
              value={formData.resumeDescription || ''}
              onChange={(e) => setFormData({ ...formData, resumeDescription: e.target.value })}
              placeholder="e.g., which role this resume targets, cover letter summary"
              rows={4}
            />
            <Input
              label="Link (optional)"
              type="url"
              value={formData.resumeLink || ''}
              onChange={(e) => setFormData({ ...formData, resumeLink: e.target.value })}
              placeholder="e.g., Google Doc, Drive link"
            />
            <div className="mt-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Resume & Cover Letter Files (PDF, Word, etc.)
              </label>
              <input
                type="file"
                multiple
                onChange={(e) => {
                  const files = Array.from(e.target.files || [])
                  setStrategyFiles(files)
                }}
                className="block w-full text-sm text-gray-700 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border file:border-gray-300 file:text-sm file:font-medium file:bg-white file:text-gray-700 hover:file:bg-gray-50"
              />
              <p className="mt-1 text-xs text-gray-500">
                Upload one or more resumes or cover letters. At least one file is required.
              </p>
            </div>
          </>
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

