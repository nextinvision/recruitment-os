'use client'

import React from 'react'
import { Badge } from './Badge'
import { Button } from './Button'

interface PreparationStep {
  id: string
  name: string
  completed: boolean
  completedAt?: string
  onClick?: () => void
  canEdit?: boolean
}

interface PreparationPipelineBoardProps {
  steps: PreparationStep[]
  completedSteps: number
  totalSteps: number
  progressPercentage: number
  isReady: boolean
  onStepClick?: (stepId: string) => void
  onInitiateJobSearch?: () => void
}

const STEP_LABELS: Record<string, string> = {
  'Client Name': 'Client Name',
  'Service Type': 'Service Type',
  'Onboarded Date': 'Onboarded Date',
  'Reverse Recruiter': 'Reverse Recruiter',
  'WhatsApp Group Created': 'WhatsApp Group',
  'Job Search Strategy': 'Job Search Strategy',
  'Gmail ID Creation': 'Gmail ID',
  'Resume + Cover Letter': 'Resume + Cover Letter',
  'LinkedIn Optimized': 'LinkedIn Optimized',
  'Job Search Initiated': 'Job Search Initiated',
}

export function PreparationPipelineBoard({
  steps,
  completedSteps,
  totalSteps,
  progressPercentage,
  isReady,
  onStepClick,
  onInitiateJobSearch,
}: PreparationPipelineBoardProps) {
  return (
    <div className="space-y-6">
      {/* Progress Header */}
      <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Preparation Pipeline</h3>
            <p className="text-sm text-gray-600 mt-1">
              {completedSteps} of {totalSteps} steps completed
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-blue-600">{progressPercentage}%</div>
            <div className="text-xs text-gray-500">Complete</div>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
          <div
            className={`h-3 rounded-full transition-all duration-300 ${
              progressPercentage === 100 ? 'bg-green-500' : 'bg-blue-600'
            }`}
            style={{ width: `${progressPercentage}%` }}
          />
        </div>

        {/* Status Badge */}
        <div className="flex items-center gap-2">
          {isReady ? (
            <Badge variant="success">Ready for Job Applications</Badge>
          ) : (
            <Badge variant="warning">In Preparation</Badge>
          )}
          {!isReady && completedSteps >= 3 && (
            <Button
              size="sm"
              onClick={onInitiateJobSearch}
              disabled={completedSteps < 3}
            >
              Initiate Job Search
            </Button>
          )}
        </div>
      </div>

      {/* Steps Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {steps.map((step, index) => (
          <div
            key={step.id}
            onClick={() => onStepClick && onStepClick(step.id)}
            className={`bg-white rounded-lg shadow p-4 border-2 transition-all cursor-pointer ${
              step.completed
                ? 'border-green-500 bg-green-50'
                : 'border-gray-200 hover:border-blue-300'
            } ${step.canEdit ? 'hover:shadow-md' : ''}`}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium text-gray-500">Step {index + 1}</span>
                  {step.completed && (
                    <svg
                      className="w-4 h-4 text-green-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                </div>
                <h4 className="text-sm font-semibold text-gray-900">
                  {STEP_LABELS[step.name] || step.name}
                </h4>
              </div>
            </div>
            
            {step.completed && step.completedAt && (
              <div className="text-xs text-gray-500 mt-2">
                Completed: {new Date(step.completedAt).toLocaleDateString()}
              </div>
            )}
            
            {!step.completed && (
              <div className="text-xs text-gray-400 mt-2">Pending</div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

