'use client'

import React from 'react'
import { cn } from '@/lib/utils'

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string
  subtitle?: string
  headerAction?: React.ReactNode
  footer?: React.ReactNode
  variant?: 'default' | 'outlined' | 'elevated'
}

export const Card: React.FC<CardProps> = ({
  title,
  subtitle,
  headerAction,
  footer,
  variant = 'default',
  className,
  children,
  ...props
}) => {
  const variantStyles = {
    default: 'bg-careerist-card border border-careerist-border',
    outlined: 'bg-white border-2 border-careerist-border',
    elevated: 'bg-careerist-card shadow-lg border border-careerist-border',
  }

  return (
    <div
      className={cn(
        'rounded-lg',
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {(title || subtitle || headerAction) && (
        <div className="px-6 py-4 border-b border-careerist-border">
          <div className="flex items-center justify-between">
            <div>
              {title && (
                <h3 className="text-lg font-semibold text-careerist-text-primary">{title}</h3>
              )}
              {subtitle && (
                <p className="mt-1 text-sm text-careerist-text-secondary">{subtitle}</p>
              )}
            </div>
            {headerAction && <div>{headerAction}</div>}
          </div>
        </div>
      )}
      <div className="px-6 py-4">{children}</div>
      {footer && (
        <div className="px-6 py-4 border-t border-careerist-border bg-careerist-bg">
          {footer}
        </div>
      )}
    </div>
  )
}


