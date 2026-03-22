'use client'

import { useEffect, useState, use } from 'react'
import { Button, Badge, Spinner, Card, Alert, useToast } from '@/ui'
import { CheckCircle, XCircle, Clock, Briefcase, MapPin, Building2, Globe } from 'lucide-react'

interface ApplicationJob {
    job: {
        id?: string
        title: string
        company: string
        location?: string
        description: string
        sourceUrl?: string
        salaryRange?: string
    } | null
}

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
    applicationJobs?: ApplicationJob[]
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

    if (!application) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] p-4">
                <Card className="max-w-md w-full p-8 text-center border-t-4 border-yellow-500 shadow-xl">
                    <Clock className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">No Job Details Found</h1>
                    <p className="text-gray-600 mb-6">This approval link is valid, but no job details are currently attached.</p>
                </Card>
            </div>
        )
    }

    const jobs = application.applicationJobs && application.applicationJobs.length > 0
        ? application.applicationJobs.map(aj => aj.job).filter(Boolean)
        : (application.job ? [application.job] : [])

    return (
        <div className="min-h-screen bg-[#F8FAFC] py-12 px-4 sm:px-6">
            <div className="max-w-4xl mx-auto">
                {/* Header Section */}
                <div className="text-center mb-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 mb-4">
                        <Clock className="w-4 h-4 text-blue-600" />
                        <span className="text-xs font-semibold text-blue-700 uppercase tracking-wider">Review Required</span>
                    </div>
                    <h1 className="text-3xl font-extrabold text-[#1F3A5F] sm:text-4xl mb-3">
                        {jobs.length > 1 ? 'Review Your Job Opportunities' : 'Review Your Job Opportunity'}
                    </h1>
                    <p className="text-lg text-gray-600 italic">
                        Hi {application.client?.firstName}, we found {jobs.length > 1 ? `${jobs.length} roles` : 'a role'} that might be a great fit for you!
                    </p>
                </div>

                <div className="space-y-8">
                    {jobs.map((job: any, index: number) => (
                        <Card key={job.id || index} className="overflow-hidden border-none shadow-xl rounded-2xl bg-white">
                            <div className="bg-[#1F3A5F] p-6 text-white">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="px-2 py-0.5 rounded bg-blue-500/30 text-[10px] uppercase font-bold tracking-wider text-blue-100 border border-blue-400/30">
                                                Position #{index + 1}
                                            </span>
                                        </div>
                                        <h2 className="text-2xl font-bold mb-2">{job.title}</h2>
                                        <div className="flex flex-wrap items-center gap-4 text-blue-100 drop-shadow-sm">
                                            <div className="flex items-center gap-1.5 font-medium">
                                                <Building2 className="w-4 h-4" />
                                                {job.company ?? '—'}
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <MapPin className="w-4 h-4" />
                                                {job.location ?? '—'}
                                            </div>
                                            {job.salaryRange && (
                                                <div className="flex items-center gap-1.5 text-yellow-400 font-bold">
                                                    <span>₹</span>
                                                    {job.salaryRange}
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
                                <div className="prose prose-blue max-w-none text-gray-700 leading-relaxed space-y-4 mb-6">
                                    {(job.description || '').split('\n').map((line: string, i: number) => (
                                        <p key={i}>{line}</p>
                                    ))}
                                </div>

                                {job.sourceUrl && (
                                    <div className="mt-4 flex items-center gap-2 text-sm">
                                        <Globe className="w-4 h-4 text-gray-400" />
                                        <a
                                            href={job.sourceUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-600 hover:text-blue-800 underline font-medium transition-colors"
                                        >
                                            View original posting
                                        </a>
                                    </div>
                                )}
                            </div>
                        </Card>
                    ))}
                </div>

                {/* Global Action Bar */}
                <div className="sticky bottom-8 mt-12 z-10">
                    <Card className="bg-white/80 backdrop-blur-md border border-gray-100 p-6 shadow-2xl rounded-2xl">
                        <div className="flex flex-col items-center gap-6">
                            <div className="text-center">
                                <p className="text-sm font-medium text-gray-500 mb-1">Decide on all {jobs.length} opportunities</p>
                                <h4 className="text-lg font-bold text-[#1F3A5F]">Your Decision</h4>
                            </div>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
                                <Button
                                    size="lg"
                                    className="bg-green-600 hover:bg-green-700 text-white font-bold h-14 text-lg shadow-lg shadow-green-200 transition-all active:scale-95"
                                    onClick={() => handleAction('APPROVE')}
                                    disabled={actionLoading !== null}
                                >
                                    {actionLoading === 'APPROVE' ? <Spinner size="sm" className="mr-2" /> : <CheckCircle className="w-5 h-5 mr-2" />}
                                    {jobs.length > 1 ? 'Approve All' : 'Approve Job'}
                                </Button>
                                <Button
                                    size="lg"
                                    variant="ghost"
                                    className="bg-white border-2 border-gray-200 hover:bg-gray-50 text-gray-700 font-bold h-14 text-lg transition-all active:scale-95"
                                    onClick={() => handleAction('SAVE')}
                                    disabled={actionLoading !== null}
                                >
                                    {actionLoading === 'SAVE' ? <Spinner size="sm" className="mr-2" /> : <Clock className="w-5 h-5 mr-2" />}
                                    Save for Later
                                </Button>
                                <Button
                                    size="lg"
                                    variant="ghost"
                                    className="bg-white border-2 border-red-100 hover:bg-red-50 text-red-600 font-bold h-14 text-lg transition-all active:scale-95"
                                    onClick={() => handleAction('REJECT')}
                                    disabled={actionLoading !== null}
                                >
                                    {actionLoading === 'REJECT' ? <Spinner size="sm" className="mr-2" /> : <XCircle className="w-5 h-5 mr-2" />}
                                    {jobs.length > 1 ? 'Reject All' : 'Reject Job'}
                                </Button>
                            </div>
                            <p className="text-center text-xs text-gray-400 font-medium max-w-md">
                                By approving, you authorize our team to initiate the application process for the selected role(s).
                            </p>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    )
}
