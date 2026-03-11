'use client'

import React from 'react'
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
    PieChart,
    Pie,
    Legend,
    AreaChart,
    Area,
} from 'recharts'

const MODERN_COLORS = [
    '#1F3A5F', // Careerist Navy
    '#F4B400', // Careerist Yellow
    '#3B82F6', // Blue
    '#10B981', // green
    '#F59E0B', // orange
    '#8B5CF6', // purple
    '#EC4899', // pink
    '#EF4444', // red
]

// --- Funnel Chart ---
interface FunnelData {
    stage: string
    count: number
}

const STAGE_LABELS: Record<string, string> = {
    IDENTIFIED: 'Identified',
    RESUME_UPDATED: 'Resume',
    COLD_MESSAGE_SENT: 'Contact',
    CONNECTION_ACCEPTED: 'Linked',
    APPLIED: 'Applied',
    INTERVIEW_SCHEDULED: 'Interview',
    OFFER: 'Offer',
    REJECTED: 'Rejected',
    CLOSED: 'Closed',
}

export function AppFunnelChart({ data }: { data: FunnelData[] }) {
    const chartData = data
        .filter(d => !['REJECTED', 'CLOSED'].includes(d.stage))
        .map(d => ({
            name: STAGE_LABELS[d.stage] || d.stage,
            count: d.count,
        }))

    return (
        <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart
                    layout="vertical"
                    data={chartData}
                    margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E7EB" />
                    <XAxis type="number" hide />
                    <YAxis
                        dataKey="name"
                        type="category"
                        width={100}
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#4B5563', fontSize: 12, fontWeight: 500 }}
                    />
                    <Tooltip
                        cursor={{ fill: '#F9FAFB' }}
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    />
                    <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={32}>
                        {chartData.map((_entry, index) => (
                            <Cell key={`cell-${index}`} fill={MODERN_COLORS[index % MODERN_COLORS.length]} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    )
}

// --- Platform Pie Chart ---
interface PlatformData {
    source: string
    count: number
}

export function PlatformSourcePie({ data }: { data: PlatformData[] }) {
    const chartData = data.map(d => ({
        name: d.source.charAt(0) + d.source.slice(1).toLowerCase(),
        value: d.count,
    }))

    return (
        <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                    >
                        {chartData.map((_entry, index) => (
                            <Cell key={`cell-${index}`} fill={MODERN_COLORS[index % MODERN_COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    />
                    <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                </PieChart>
            </ResponsiveContainer>
        </div>
    )
}

// --- Time Per Stage Bar Chart ---
interface TimeData {
    stage: string
    averageDays: number
}

export function StageTimeBarChart({ data }: { data: TimeData[] }) {
    const chartData = data.filter(d => d.averageDays > 0).map(d => ({
        name: STAGE_LABELS[d.stage] || d.stage,
        days: d.averageDays,
    }))

    return (
        <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                    <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#4B5563', fontSize: 11 }}
                    />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#4B5563', fontSize: 11 }} label={{ value: 'Days', angle: -90, position: 'insideLeft', fill: '#4B5563', fontSize: 11 }} />
                    <Tooltip
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    />
                    <Bar dataKey="days" fill="#1F3A5F" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    )
}

// --- Comparison Chart ---
interface ComparisonData {
    recruiter: { name: string }
    metrics: {
        jobsScraped: number
        applicationsCreated: number
    }
}

export function PerformanceComparisonChart({ data }: { data: ComparisonData[] }) {
    const chartData = data.map(d => ({
        name: d.recruiter.name.split(' ')[0], // Use first name
        'Jobs Found': d.metrics.jobsScraped,
        'Apps Sent': d.metrics.applicationsCreated,
    }))

    return (
        <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#4B5563', fontSize: 12, fontWeight: 500 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#4B5563', fontSize: 11 }} />
                    <Tooltip
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    />
                    <Legend wrapperStyle={{ paddingTop: '10px' }} />
                    <Bar dataKey="Jobs Found" fill="#1F3A5F" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Apps Sent" fill="#F4B400" radius={[4, 4, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    )
}
