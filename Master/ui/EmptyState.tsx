'use client'

import React from 'react'
import { Button } from './Button'

export interface EmptyStateProps {
  title: string
  description?: string
  icon?: React.ReactNode
  action?: {
    label: string
    onClick: () => void
  }
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon,
  action,
}) => {
  return (
    <div className="text-center py-12 px-4">
      {icon && (
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-careerist-yellow-light mb-4">
          {icon}
        </div>
      )}
      <h3 className="mt-2 text-sm font-medium text-careerist-text-primary">{title}</h3>
      {description && (
        <p className="mt-1 text-sm text-careerist-text-secondary">{description}</p>
      )}
      {action && (
        <div className="mt-6">
          <Button onClick={action.onClick}>{action.label}</Button>
        </div>
      )}
    </div>
  )
}


