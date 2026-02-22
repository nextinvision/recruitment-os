import React, { useState } from 'react'
import Link from 'next/link'

interface Recommendation {
  id: string
  type: string
  title: string
  description: string
  priority: 'high' | 'medium' | 'low'
  actionUrl: string
}

interface AIRecommendationsWidgetProps {
  recommendations: Recommendation[]
}

export function AIRecommendationsWidget({ recommendations }: AIRecommendationsWidgetProps) {
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set())

  const handleDismiss = (id: string) => {
    setDismissedIds(new Set([...dismissedIds, id]))
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-[#EF4444] text-white'
      case 'medium':
        return 'bg-[#F4B400] text-[#1F3A5F]'
      case 'low':
        return 'bg-[#64748B] text-white'
      default:
        return 'bg-[#1F3A5F] text-white'
    }
  }

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'High Priority'
      case 'medium':
        return 'Medium Priority'
      case 'low':
        return 'Low Priority'
      default:
        return 'Priority'
    }
  }

  const visibleRecommendations = recommendations.filter(r => !dismissedIds.has(r.id))

  if (visibleRecommendations.length === 0) {
    return null
  }

  return (
    <div className="bg-gradient-to-br from-[#1F3A5F] to-[#0F172A] shadow-md rounded-xl p-6 border border-[#1F3A5F] text-white">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-white flex items-center">
          <span className="mr-2">🤖</span>
          AI Recommendations
        </h3>
      </div>
      <div className="space-y-3">
        {visibleRecommendations.map((rec) => (
          <div
            key={rec.id}
            className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-xs px-2 py-1 rounded ${getPriorityColor(rec.priority)}`}>
                    {getPriorityLabel(rec.priority)}
                  </span>
                </div>
                <h4 className="text-sm font-semibold text-white mb-1">{rec.title}</h4>
                <p className="text-xs text-white/80 mb-3">{rec.description}</p>
                <Link
                  href={rec.actionUrl}
                  className="inline-block text-xs font-medium text-[#F4B400] hover:text-[#FFD700] transition-colors"
                >
                  View Details →
                </Link>
              </div>
              <button
                onClick={() => handleDismiss(rec.id)}
                className="ml-2 text-white/60 hover:text-white transition-colors"
                aria-label="Dismiss recommendation"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

