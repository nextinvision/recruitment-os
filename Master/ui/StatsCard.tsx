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
  const colorStyles = {
    blue: {
      bg: 'bg-blue-50',
      iconBg: 'bg-[#1F3A5F]',
      iconText: 'text-white',
      border: 'border-blue-100',
      valueText: 'text-[#1F3A5F]'
    },
    green: {
      bg: 'bg-emerald-50',
      iconBg: 'bg-[#10B981]',
      iconText: 'text-white',
      border: 'border-emerald-100',
      valueText: 'text-emerald-900'
    },
    purple: {
      bg: 'bg-purple-50',
      iconBg: 'bg-[#8B5CF6]',
      iconText: 'text-white',
      border: 'border-purple-100',
      valueText: 'text-purple-900'
    },
    orange: {
      bg: 'bg-amber-50',
      iconBg: 'bg-[#F4B400]',
      iconText: 'text-[#1F3A5F]',
      border: 'border-amber-100',
      valueText: 'text-amber-900'
    },
    red: {
      bg: 'bg-red-50',
      iconBg: 'bg-[#EF4444]',
      iconText: 'text-white',
      border: 'border-red-100',
      valueText: 'text-red-900'
    },
  }

  const style = colorStyles[color]

  return (
    <div className={`relative overflow-hidden ${style.bg} rounded-2xl border ${style.border} p-6 shadow-sm hover:shadow-md transition-all duration-300 group`}>
      <div className="flex items-start justify-between">
        <div className="space-y-3">
          <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">{title}</p>
          <div className="flex items-baseline gap-2">
            <h3 className={`text-3xl font-extrabold ${style.valueText}`}>
              {value}
            </h3>
            {trend && (
              <span className={`flex items-center text-xs font-bold px-1.5 py-0.5 rounded-full ${trend.isPositive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                }`}>
                {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
              </span>
            )}
          </div>
        </div>

        {icon && (
          <div className={`p-3 rounded-xl ${style.iconBg} ${style.iconText} shadow-lg transform group-hover:scale-110 transition-transform duration-300`}>
            {icon}
          </div>
        )}
      </div>

      {/* Subtle background decoration */}
      <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
    </div>
  )
}

