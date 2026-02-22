import React from 'react'

interface PlatformData {
  source: string
  count: number
}

interface PlatformAnalyticsWidgetProps {
  data: PlatformData[]
}

export function PlatformAnalyticsWidget({ data }: PlatformAnalyticsWidgetProps) {
  const total = data.reduce((sum, item) => sum + item.count, 0)

  const getSourceColor = (source: string) => {
    switch (source) {
      case 'LINKEDIN':
        return 'bg-[#0077B5]'
      case 'INDEED':
        return 'bg-[#2164F3]'
      case 'NAUKRI':
        return 'bg-[#4CAF50]'
      default:
        return 'bg-[#64748B]'
    }
  }

  const getSourceLabel = (source: string) => {
    switch (source) {
      case 'LINKEDIN':
        return 'LinkedIn'
      case 'INDEED':
        return 'Indeed'
      case 'NAUKRI':
        return 'Naukri'
      default:
        return source
    }
  }

  if (data.length === 0) {
    return (
      <div className="bg-white shadow-md rounded-xl p-6 border border-[#E5E7EB]">
        <h3 className="text-lg font-semibold text-[#0F172A] mb-4">Platform Source Analytics</h3>
        <p className="text-sm text-[#64748B]">No data available</p>
      </div>
    )
  }

  return (
    <div className="bg-white shadow-md rounded-xl p-6 border border-[#E5E7EB]">
      <h3 className="text-lg font-semibold text-[#0F172A] mb-4">Platform Source Analytics</h3>
      <div className="space-y-4">
        {data.map((item) => {
          const percentage = total > 0 ? (item.count / total) * 100 : 0
          return (
            <div key={item.source}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full mr-2 ${getSourceColor(item.source)}`}></div>
                  <span className="text-sm font-medium text-[#0F172A]">
                    {getSourceLabel(item.source)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-semibold text-[#0F172A]">{item.count}</span>
                  <span className="text-xs text-[#64748B] ml-2">({percentage.toFixed(1)}%)</span>
                </div>
              </div>
              <div className="w-full bg-[#E5E7EB] rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${getSourceColor(item.source)} transition-all duration-300`}
                  style={{ width: `${percentage}%` }}
                ></div>
              </div>
            </div>
          )
        })}
      </div>
      <div className="mt-4 pt-4 border-t border-[#E5E7EB]">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-[#64748B]">Total Jobs</span>
          <span className="text-lg font-bold text-[#0F172A]">{total}</span>
        </div>
      </div>
    </div>
  )
}

