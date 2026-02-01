'use client'

import React, { useState } from 'react'

interface PipelineItem {
  id: string
  [key: string]: any
}

interface PipelineBoardProps<T extends PipelineItem> {
  items: T[]
  stages: string[]
  getStage: (item: T) => string
  onStageChange: (itemId: string, newStage: string) => void
  renderItem: (item: T) => React.ReactNode
  stageLabels?: Record<string, string>
}

export function PipelineBoard<T extends PipelineItem>({
  items,
  stages,
  getStage,
  onStageChange,
  renderItem,
  stageLabels = {},
}: PipelineBoardProps<T>) {
  const [draggedItem, setDraggedItem] = useState<string | null>(null)

  const getItemsByStage = (stage: string) => {
    return items.filter((item) => getStage(item) === stage)
  }

  const handleDragStart = (itemId: string) => {
    setDraggedItem(itemId)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent, targetStage: string) => {
    e.preventDefault()
    if (draggedItem) {
      onStageChange(draggedItem, targetStage)
      setDraggedItem(null)
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 overflow-x-auto">
      {stages.map((stage) => {
        const stageItems = getItemsByStage(stage)
        const label = stageLabels[stage] || stage.replace(/_/g, ' ')

        return (
          <div
            key={stage}
            className="bg-white rounded-lg shadow p-4 min-w-[250px] border border-gray-200"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, stage)}
          >
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-semibold text-gray-900">{label}</h3>
              <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full border border-gray-200 font-medium">
                {stageItems.length}
              </span>
            </div>
            <div className="space-y-2 min-h-[200px]">
              {stageItems.map((item) => (
                <div
                  key={item.id}
                  draggable
                  onDragStart={() => handleDragStart(item.id)}
                  className="p-3 bg-gray-50 rounded border border-gray-200 hover:border-blue-600 cursor-move transition-colors"
                >
                  {renderItem(item)}
                </div>
              ))}
              {stageItems.length === 0 && (
                <div className="text-center py-8 text-gray-600 text-sm">
                  Drop items here
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

