'use client'

import React, { useEffect } from 'react'

export interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

export function Modal({ isOpen, onClose, title, children, size = 'md' }: ModalProps) {
  
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isOpen) return null

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div
          className="fixed inset-0 z-40 transition-opacity bg-[#1F3A5F] opacity-[0.5] bg-opacity-50 backdrop-blur-sm"
          onClick={onClose}
          aria-hidden
        />

        <div
          className={`relative z-50 inline-block align-bottom bg-white text-left overflow-visible shadow-2xl transform transition-all sm:my-8 sm:align-middle ${sizeClasses[size]} w-full border border-[#E5E7EB]`}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 text-gray-900">
            <div className="flex items-center justify-between mb-4">
              <h3 id="modal-title" className="text-lg font-semibold text-gray-900">{title}</h3>
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-900 focus:outline-none transition-colors"
              >
                <span className="sr-only">Close</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="text-gray-900">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

