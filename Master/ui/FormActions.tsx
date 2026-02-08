'use client'

import React from 'react'
import { Button } from './Button'
import { cn } from '@/lib/utils'

export interface FormActionsProps {
  onCancel: () => void
  submitLabel?: string
  cancelLabel?: string
  isLoading?: boolean
  submitVariant?: 'primary' | 'secondary' | 'ghost'
  className?: string
}

export const FormActions: React.FC<FormActionsProps> = ({
  onCancel,
  submitLabel = 'Save',
  cancelLabel = 'Cancel',
  isLoading = false,
  submitVariant = 'primary',
  className,
}) => {
  return (
    <div className={cn('flex justify-end gap-3 pt-4', className)}>
      <Button
        type="button"
        variant="ghost"
        onClick={onCancel}
        disabled={isLoading}
      >
        {cancelLabel}
      </Button>
      <Button
        type="submit"
        variant={submitVariant}
        disabled={isLoading}
        isLoading={isLoading}
      >
        {submitLabel}
      </Button>
    </div>
  )
}


