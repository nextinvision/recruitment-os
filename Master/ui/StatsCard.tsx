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
    blue: 'bg-blue-50 border-blue-200 text-blue-600',
    green: 'bg-blue-50 border-blue-200 text-blue-600',
    purple: 'bg-blue-50 border-blue-200 text-blue-600',
    orange: 'bg-blue-50 border-blue-200 text-blue-600',
    red: 'bg-blue-50 border-blue-200 text-blue-600',
  }

  return (
    <div className="bg-white overflow-hidden shadow rounded-lg border border-gray-200">
      <div className="p-5">
        <div className="flex items-center">
          {icon && (
            <div className={`shrink-0 p-2 rounded-lg ${colorClasses[color]}`}>
              {icon}
            </div>
          )}
          <div className={`ml-5 w-0 flex-1 ${icon ? '' : 'flex items-center'}`}>
            <dl>
              <dt className="text-sm font-medium text-gray-700 truncate">
                {title}
              </dt>
              <dd className="flex items-baseline">
                <div className="text-2xl font-semibold text-gray-900">
                  {value}
                </div>
                {trend && (
                  <div className={`ml-2 flex items-baseline text-sm font-semibold ${
                    trend.isPositive ? 'text-blue-600' : 'text-gray-600'
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

