import React from 'react'

interface StatsCardProps {
  title: string
  value: string | number
  icon?: React.ReactNode
  trend?: {
    value: number
    isPositive: boolean
  }
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'red'
}

export function StatsCard({ title, value, icon, trend, color = 'blue' }: StatsCardProps) {
  const colorClasses = {
    blue: 'bg-[#1F3A5F] text-white',
    green: 'bg-[#22C55E] text-white',
    purple: 'bg-[#1F3A5F] text-white',
    orange: 'bg-[#F4B400] text-[#1F3A5F]',
    red: 'bg-[#EF4444] text-white',
  }

  return (
    <div className="bg-white overflow-hidden shadow-md rounded-xl border border-[#E5E7EB] hover:shadow-lg transition-shadow">
      <div className="p-5">
        <div className="flex items-center">
          {icon && (
            <div className={`shrink-0 p-3 rounded-lg ${colorClasses[color]}`}>
              {icon}
            </div>
          )}
          <div className={`ml-5 w-0 flex-1 ${icon ? '' : 'flex items-center'}`}>
            <dl>
              <dt className="text-sm font-medium text-[#64748B] truncate">
                {title}
              </dt>
              <dd className="flex items-baseline">
                <div className="text-2xl font-bold text-[#0F172A]">
                  {value}
                </div>
                {trend && (
                  <div className={`ml-2 flex items-baseline text-sm font-semibold ${
                    trend.isPositive ? 'text-[#22C55E]' : 'text-[#EF4444]'
                  }`}>
                    <span>{trend.isPositive ? '↑' : '↓'}</span>
                    <span>{Math.abs(trend.value)}%</span>
                  </div>
                )}
              </dd>
            </dl>
          </div>
        </div>
      </div>
    </div>
  )
}

