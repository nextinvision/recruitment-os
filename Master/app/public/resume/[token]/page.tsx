'use client'

import { useEffect, useState, useRef, use } from 'react'
import { Button, Card, Spinner, useToast } from '@/ui'
import { ResumePreview } from '@/components/resume-builder/ResumePreview'
import { RESUME_PREVIEW_PADDING_CSS } from '@/modules/resume-builder/constants'
import { CheckCircle, XCircle, Download, FileText } from 'lucide-react'

interface PublicResumeData {
  id: string
  token: string
  response: 'PENDING' | 'ACCEPTED' | 'REJECTED'
  respondedAt: string | null
  sentAt: string
  resume: {
    id: string
    content: any
    template: string
    updatedAt: string
  } | null
  clientName: string | null
}

export default function PublicResumePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params)
  const [data, setData] = useState<PublicResumeData | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<'ACCEPT' | 'REJECT' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const previewRef = useRef<HTMLDivElement>(null)
  const { showToast } = useToast()

  useEffect(() => {
    loadResume()
  }, [token])

  const loadResume = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch(`/api/public/resume/${token}`)
      if (!res.ok) {
        const body = await res.json()
        throw new Error(body.error || 'Failed to load resume')
      }
      const payload = await res.json()
      setData(payload)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleAction = async (action: 'ACCEPT' | 'REJECT') => {
    try {
      setActionLoading(action)
      const res = await fetch(`/api/public/resume/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      const body = await res.json()
      if (!res.ok) throw new Error(body.error || 'Failed to submit')
      setSuccessMessage(
        action === 'ACCEPT'
          ? 'Thank you! You have accepted this resume. Your recruiter has been notified.'
          : 'Noted. You have declined this resume. Your recruiter has been notified.'
      )
      showToast(action === 'ACCEPT' ? 'Resume accepted' : 'Resume declined', 'success')
      setData((prev) =>
        prev
          ? {
              ...prev,
              response: action === 'ACCEPT' ? 'ACCEPTED' : 'REJECTED',
              respondedAt: new Date().toISOString(),
            }
          : null
      )
    } catch (err: any) {
      showToast(err.message || 'Something went wrong', 'error')
    } finally {
      setActionLoading(null)
    }
  }

  const handleDownloadPDF = () => {
    if (!data?.resume?.content || !previewRef.current) {
      showToast('Preview not ready. Please try again in a moment.', 'error')
      return
    }
    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      showToast('Pop-up blocked. Please allow pop-ups to download PDF.', 'error')
      return
    }
    const title = `Resume - ${(data.resume.content?.contact as any)?.name || 'Resume'}`
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${title}</title>
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap" rel="stylesheet">
          <style>
            @page { size: A4; margin: 0; }
            body { margin: 0; padding: 0; font-family: Arial, sans-serif; }
            @media print {
              .resume-preview { width: 100% !important; margin: 0 !important; padding: ${RESUME_PREVIEW_PADDING_CSS} !important; box-shadow: none !important; }
            }
          </style>
        </head>
        <body>
          <div id="preview-root"></div>
        </body>
      </html>
    `)
    printWindow.document.getElementById('preview-root')!.innerHTML = previewRef.current.outerHTML
    printWindow.document.close()
    printWindow.focus()
    setTimeout(() => {
      printWindow.print()
      printWindow.close()
    }, 500)
  }

  const handleDownloadWord = () => {
    if (!data?.resume?.content || !previewRef.current) {
      showToast('Preview not ready. Please try again in a moment.', 'error')
      return
    }
    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      showToast('Pop-up blocked. Please allow pop-ups to download Word.', 'error')
      return
    }
    const title = `Resume - ${(data.resume.content?.contact as any)?.name || 'Resume'}`
    printWindow.document.write(`
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head><meta charset='utf-8'><title>${title}</title>
      <style>body { font-family: Arial, sans-serif; } .resume-preview { width: 100%; margin: 0; padding: 20px; }</style>
      </head>
      <body><div id="preview-root"></div></body>
      </html>
    `)
    printWindow.document.getElementById('preview-root')!.innerHTML = previewRef.current.outerHTML
    printWindow.document.close()
    const html = printWindow.document.documentElement.outerHTML
    const blob = new Blob(['\ufeff', html], { type: 'application/msword' })
    const url = URL.createObjectURL(blob)
    const link = window.document.createElement('a')
    link.href = url
    link.download = `${title}.doc`
    window.document.body.appendChild(link)
    link.click()
    window.document.body.removeChild(link)
    URL.revokeObjectURL(url)
    printWindow.close()
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <Spinner size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] p-4">
        <Card className="max-w-md w-full p-8 text-center border-t-4 border-red-500 shadow-xl">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Link Invalid or Expired</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <p className="text-sm text-gray-500 italic">Please contact your recruiter if you believe this is an error.</p>
        </Card>
      </div>
    )
  }

  if (successMessage) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] p-4">
        <Card className="max-w-md w-full p-8 text-center border-t-4 border-green-500 shadow-xl">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Response Recorded</h1>
          <p className="text-gray-600 mb-8 leading-relaxed">{successMessage}</p>
          <p className="text-sm text-gray-500">You can close this window now.</p>
        </Card>
      </div>
    )
  }

  if (!data?.resume) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] p-4">
        <Card className="max-w-md w-full p-8 text-center border-t-4 border-yellow-500 shadow-xl">
          <FileText className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Resume Not Available</h1>
          <p className="text-gray-600 mb-6">This link is valid, but the resume content could not be loaded.</p>
        </Card>
      </div>
    )
  }

  const alreadyResponded = data.response !== 'PENDING'

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-8 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-2xl sm:text-3xl font-bold text-[#1F3A5F] mb-1">Your Resume</h1>
          {data.clientName && (
            <p className="text-gray-600">Hi {data.clientName}, here is the resume we prepared for you.</p>
          )}
        </div>

        <Card className="overflow-hidden border border-gray-200 shadow-lg rounded-xl bg-white">
          <div className="p-4 border-b border-gray-100 bg-gray-50 flex flex-wrap items-center justify-between gap-3">
            <span className="text-sm font-medium text-gray-700">
              Preview · Last updated {new Date(data.resume.updatedAt).toLocaleDateString()}
            </span>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="secondary" onClick={handleDownloadPDF} className="gap-1">
                <Download className="w-4 h-4" />
                Download PDF
              </Button>
              <Button size="sm" variant="secondary" onClick={handleDownloadWord} className="gap-1">
                <Download className="w-4 h-4" />
                Download Word
              </Button>
            </div>
          </div>
          <div className="bg-gray-50 p-6 overflow-x-auto">
            <div className="bg-white shadow mx-auto max-w-[210mm]">
              <ResumePreview ref={previewRef} document={data.resume.content} />
            </div>
          </div>
        </Card>

        {alreadyResponded ? (
          <Card className="p-6 text-center border-2 border-gray-200 bg-gray-50">
            <p className="text-gray-600">
              You previously{' '}
              <span className={data.response === 'ACCEPTED' ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                {data.response === 'ACCEPTED' ? 'accepted' : 'declined'}
              </span>{' '}
              this resume
              {data.respondedAt && (
                <> on {new Date(data.respondedAt).toLocaleDateString()}</>
              )}.
            </p>
          </Card>
        ) : (
          <Card className="bg-white/90 backdrop-blur border border-gray-200 p-6 shadow-xl rounded-xl">
            <div className="flex flex-col items-center gap-4">
              <h4 className="text-lg font-bold text-[#1F3A5F]">Does this resume work for you?</h4>
              <div className="flex flex-wrap justify-center gap-4">
                <Button
                  size="lg"
                  className="bg-green-600 hover:bg-green-700 text-white font-bold gap-2"
                  onClick={() => handleAction('ACCEPT')}
                  disabled={actionLoading !== null}
                >
                  {actionLoading === 'ACCEPT' ? <Spinner size="sm" /> : <CheckCircle className="w-5 h-5" />}
                  Accept
                </Button>
                <Button
                  size="lg"
                  variant="ghost"
                  className="border-2 border-red-100 hover:bg-red-50 text-red-600 font-bold gap-2"
                  onClick={() => handleAction('REJECT')}
                  disabled={actionLoading !== null}
                >
                  {actionLoading === 'REJECT' ? <Spinner size="sm" /> : <XCircle className="w-5 h-5" />}
                  Reject
                </Button>
              </div>
              <p className="text-xs text-gray-500 max-w-md text-center">
                Your response will be shared with your recruiter so they can proceed or make updates.
              </p>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
