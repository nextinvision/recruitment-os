'use client'

import React from 'react'

export type PeriodView = 'daily' | 'weekly' | 'monthly' | 'custom'

interface PeriodSelectorProps {
  view: PeriodView
  onChange: (view: PeriodView) => void
  onQuickSelect?: (startDate: Date, endDate: Date) => void
}

export function PeriodSelector({ view, onChange, onQuickSelect }: PeriodSelectorProps) {
  const quickPresets = [
    { label: 'Today', days: 0 },
    { label: 'Last 7 Days', days: 7 },
    { label: 'Last 30 Days', days: 30 },
    { label: 'Last 90 Days', days: 90 },
  ]

  const handleQuickSelect = (days: number) => {
    if (!onQuickSelect) return
    
    const endDate = new Date()
    endDate.setHours(23, 59, 59, 999)
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    startDate.setHours(0, 0, 0, 0)
    
    onQuickSelect(startDate, endDate)
  }

  return (
    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
      <div className="flex items-center gap-2 border border-[#E5E7EB] rounded-lg overflow-hidden">
        <button
          onClick={() => onChange('daily')}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            view === 'daily'
              ? 'bg-[#1F3A5F] text-white'
              : 'bg-white text-gray-700 hover:bg-gray-50'
          }`}
        >
          Daily
        </button>
        <button
          onClick={() => onChange('weekly')}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            view === 'weekly'
              ? 'bg-[#1F3A5F] text-white'
              : 'bg-white text-gray-700 hover:bg-gray-50'
          }`}
        >
          Weekly
        </button>
        <button
          onClick={() => onChange('monthly')}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            view === 'monthly'
              ? 'bg-[#1F3A5F] text-white'
              : 'bg-white text-gray-700 hover:bg-gray-50'
          }`}
        >
          Monthly
        </button>
        <button
          onClick={() => onChange('custom')}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            view === 'custom'
              ? 'bg-[#1F3A5F] text-white'
              : 'bg-white text-gray-700 hover:bg-gray-50'
          }`}
        >
          Custom
        </button>
      </div>

      {onQuickSelect && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Quick Select:</span>
          {quickPresets.map((preset) => (
            <button
              key={preset.label}
              onClick={() => handleQuickSelect(preset.days)}
              className="px-3 py-1 text-xs border border-[#E5E7EB] rounded hover:bg-gray-50 transition-colors"
            >
              {preset.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

