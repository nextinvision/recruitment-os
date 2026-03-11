'use client'

import { useEffect, useState, use } from 'react'
import { Button, Badge, Spinner, Card, Alert, useToast } from '@/ui'
import { CheckCircle, XCircle, Clock, Briefcase, MapPin, Building2, Globe } from 'lucide-react'

interface Application {
    id: string
    stage: string
    job: {
        title: string
        company: string
        location: string
        description: string
        sourceUrl?: string
        salaryRange?: string
    } | null
    client: {
        firstName: string
        lastName: string
    } | null
}

export default function PublicApprovalPage({ params }: { params: Promise<{ token: string }> }) {
    const { token } = use(params)
    const [application, setApplication] = useState<Application | null>(null)
    const [loading, setLoading] = useState(true)
    const [actionLoading, setActionLoading] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)
    const { showToast } = useToast()

    useEffect(() => {
        loadApplication()
    }, [token])

    const loadApplication = async () => {
        try {
            setLoading(true)
            const res = await fetch(`/api/public/approvals/${token}`)
            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.error || 'Failed to load job details')
            }
            const data = await res.json()
            setApplication(data)
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const handleAction = async (action: 'APPROVE' | 'REJECT' | 'SAVE') => {
        try {
            setActionLoading(action)
            const res = await fetch(`/api/public/approvals/${token}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action }),
            })

            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.error || 'Failed to process request')
            }

            const data = await res.json()

            if (action === 'APPROVE') {
                setSuccess('Awesome! We have moved this job to your application pipeline. We will start the process immediately.')
                showToast('Job approved successfully', 'success')
            } else if (action === 'REJECT') {
                setSuccess('Got it. We have archived this job and won\'t proceed with it.')
                showToast('Job rejected', 'info')
            } else if (action === 'SAVE') {
                showToast('Saved for later review', 'info')
            }
        } catch (err: any) {
            showToast(err.message, 'error')
        } finally {
            setActionLoading(null)
        }
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

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] p-4">
                <Card className="max-w-md w-full p-8 text-center border-t-4 border-green-500 shadow-xl animate-in fade-in zoom-in duration-500">
                    <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Action Confirmed</h1>
                    <p className="text-gray-600 mb-8 leading-relaxed">{success}</p>
                    <div className="pt-4 border-t border-gray-100">
                        <p className="text-sm text-gray-500">You can close this window now.</p>
                    </div>
                </Card>
            </div>
        )
    }

    if (!application || !application.job) return null

    return (
        <div className="min-h-screen bg-[#F8FAFC] py-12 px-4 sm:px-6">
            <div className="max-w-3xl mx-auto">
                {/* Header Section */}
                <div className="text-center mb-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 mb-4">
                        <Clock className="w-4 h-4 text-blue-600" />
                        <span className="text-xs font-semibold text-blue-700 uppercase tracking-wider">Review Required</span>
                    </div>
                    <h1 className="text-3xl font-extrabold text-[#1F3A5F] sm:text-4xl mb-3">
                        New Job Opportunity
                    </h1>
                    <p className="text-lg text-gray-600 italic">
                        Hi {application.client?.firstName}, we found a role that might be a great fit for you!
                    </p>
                </div>

                {/* Job Details Card */}
                <Card className="overflow-hidden border-none shadow-2xl rounded-2xl bg-white mb-8">
                    <div className="bg-[#1F3A5F] p-8 text-white">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <h2 className="text-2xl font-bold mb-2">{application.job.title}</h2>
                                <div className="flex flex-wrap items-center gap-4 text-blue-100 drop-shadow-sm">
                                    <div className="flex items-center gap-1.5 font-medium">
                                        <Building2 className="w-4 h-4" />
                                        {application.job.company}
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <MapPin className="w-4 h-4" />
                                        {application.job.location}
                                    </div>
                                    {application.job.salaryRange && (
                                        <div className="flex items-center gap-1.5 text-yellow-400 font-bold">
                                            <span>₹</span>
                                            {application.job.salaryRange}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <Badge variant="warning" className="w-fit px-4 py-1.5 text-sm shadow-lg whitespace-nowrap bg-yellow-400 text-[#1F3A5F] border-none font-bold"> Sourced for You </Badge>
                        </div>
                    </div>

                    <div className="p-8">
                        <h3 className="text-lg font-bold text-[#1F3A5F] mb-4 flex items-center gap-2">
                            <Briefcase className="w-5 h-5" />
                            Job Description
                        </h3>
                        <div className="prose prose-blue max-w-none text-gray-700 leading-relaxed space-y-4 mb-8">
                            {application.job.description.split('\n').map((line, i) => (
                                <p key={i}>{line}</p>
                            ))}
                        </div>

                        {application.job.sourceUrl && (
                            <div className="mb-0 flex items-center gap-2 text-sm">
                                <Globe className="w-4 h-4 text-gray-400" />
                                <a
                                    href={application.job.sourceUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:text-blue-800 underline font-medium transition-colors"
                                >
                                    View original posting
                                </a>
                            </div>
                        )}
                    </div>

                    {/* Action Bar */}
                    <div className="bg-gray-50 border-t border-gray-100 p-8">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <Button
                                size="lg"
                                className="bg-green-600 hover:bg-green-700 text-white font-bold h-14 text-lg shadow-lg shadow-green-200 transition-all active:scale-95"
                                onClick={() => handleAction('APPROVE')}
                                disabled={actionLoading !== null}
                            >
                                {actionLoading === 'APPROVE' ? <Spinner size="sm" className="mr-2" /> : <CheckCircle className="w-5 h-5 mr-2" />}
                                Approve Job
                            </Button>
                            <Button
                                size="lg"
                                variant="ghost"
                                className="border-gray-300 hover:bg-gray-100 text-gray-700 font-bold h-14 text-lg transition-all active:scale-95"
                                onClick={() => handleAction('SAVE')}
                                disabled={actionLoading !== null}
                            >
                                {actionLoading === 'SAVE' ? <Spinner size="sm" className="mr-2" /> : <Clock className="w-5 h-5 mr-2" />}
                                Save for Later
                            </Button>
                            <Button
                                size="lg"
                                variant="ghost"
                                className="border-red-100 hover:bg-red-50 text-red-600 font-bold h-14 text-lg transition-all active:scale-95"
                                onClick={() => handleAction('REJECT')}
                                disabled={actionLoading !== null}
                            >
                                {actionLoading === 'REJECT' ? <Spinner size="sm" className="mr-2" /> : <XCircle className="w-5 h-5 mr-2" />}
                                Reject Job
                            </Button>
                        </div>
                        <p className="text-center text-xs text-gray-400 mt-6 font-medium">
                            By approving, you authorize our team to initiate the application process for this role.
                        </p>
                    </div>
                </Card>
            </div>
        </div>
    )
}
