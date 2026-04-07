import React from 'react'

interface FunnelData {
  stage: string
  count: number
}

export type FunnelChartWidgetVariant = 'card' | 'bare'

interface FunnelChartWidgetProps {
  data: FunnelData[]
  /**
   * `card` — standalone titled panel (default): use on dashboard & client reports when the widget is the only content.
   * `bare` — funnel rows only; parent supplies the card chrome and title (avoids double borders/titles and fixed-height overflow).
   */
  variant?: FunnelChartWidgetVariant
}

function getStageLabel(stage: string) {
  return stage
    .split('_')
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(' ')
}

function getStageColor(index: number) {
  const colors = [
    'bg-[#1F3A5F]',
    'bg-[#3B82F6]',
    'bg-[#8B5CF6]',
    'bg-[#EC4899]',
    'bg-[#F59E0B]',
    'bg-[#10B981]',
    'bg-[#F4B400]',
    'bg-[#EF4444]',
    'bg-[#64748B]',
  ]
  return colors[index % colors.length]
}

function FunnelRows({ data }: { data: FunnelData[] }) {
  const maxCount = Math.max(...data.map((d) => d.count), 1)

  return (
    <div className="space-y-2 min-w-0">
      {data.map((item, index) => {
        const width = maxCount > 0 ? (item.count / maxCount) * 100 : 0
        const previousCount = index > 0 ? data[index - 1].count : item.count
        const dropOff = previousCount > 0 ? ((previousCount - item.count) / previousCount) * 100 : 0

        return (
          <div key={item.stage} className="relative min-w-0">
            <div className="flex items-center justify-between mb-1 gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-sm font-medium text-[#0F172A] truncate">{getStageLabel(item.stage)}</span>
                {index > 0 && dropOff > 0 && (
                  <span className="text-xs text-[#EF4444] shrink-0">↓ {dropOff.toFixed(1)}%</span>
                )}
              </div>
              <div className="text-right shrink-0">
                <span className="text-sm font-semibold text-[#0F172A]">{item.count}</span>
                {index > 0 && previousCount > 0 && (
                  <span className="text-xs text-[#64748B] ml-2">
                    ({((item.count / previousCount) * 100).toFixed(1)}%)
                  </span>
                )}
              </div>
            </div>
            <div className="w-full bg-[#E5E7EB] rounded-lg h-8 overflow-hidden">
              <div
                className={`h-8 flex items-center justify-center text-white text-xs font-medium transition-all duration-300 ${getStageColor(index)}`}
                style={{ width: `${Math.max(width, 5)}%` }}
              >
                {item.count > 0 && item.count}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export function FunnelChartWidget({ data, variant = 'card' }: FunnelChartWidgetProps) {
  if (data.length === 0) {
    if (variant === 'bare') {
      return <p className="text-sm text-[#64748B]">No application pipeline data yet.</p>
    }
    return (
      <div className="bg-white shadow-md rounded-xl p-6 border border-[#E5E7EB]">
        <h3 className="text-lg font-semibold text-[#0F172A] mb-4">Application Funnel</h3>
        <p className="text-sm text-[#64748B]">No data available</p>
      </div>
    )
  }

  if (variant === 'bare') {
    return <FunnelRows data={data} />
  }

  return (
    <div className="bg-white shadow-md rounded-xl p-6 border border-[#E5E7EB]">
      <h3 className="text-lg font-semibold text-[#0F172A] mb-4">Application Funnel</h3>
      <FunnelRows data={data} />
    </div>
  )
}
