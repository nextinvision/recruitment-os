'use client'

import React, { useState, useRef, useEffect } from 'react'

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
  /** When set, clicking an item opens it (e.g. detail modal); a drag handle is shown for stage change */
  onItemClick?: (item: T) => void
  condensed?: boolean
  columnHeight?: string
  /** When true, each stage column shows a search icon that expands to filter items in that stage */
  searchable?: boolean
  /** Returns strings to search in (e.g. name, email). Used only when searchable is true. */
  getSearchableFields?: (item: T) => string[]
  /** Placeholder for the stage search input */
  searchPlaceholder?: string
}

export function PipelineBoard<T extends PipelineItem>({
  items,
  stages,
  getStage,
  onStageChange,
  renderItem,
  stageLabels = {},
  onItemClick,
  condensed = false,
  columnHeight = 'calc(100vh - 280px)',
  searchable = false,
  getSearchableFields,
  searchPlaceholder = 'Search in this stage…',
}: PipelineBoardProps<T>) {
  const [draggedItem, setDraggedItem] = useState<string | null>(null)
  const [expandedSearchStage, setExpandedSearchStage] = useState<string | null>(null)
  const [stageSearchQueries, setStageSearchQueries] = useState<Record<string, string>>({})
  const searchInputRefs = useRef<Record<string, HTMLInputElement | null>>({})

  const safeItems = Array.isArray(items) ? items : []
  const getItemsByStage = (stage: string) => {
    return safeItems.filter((item) => getStage(item) === stage)
  }

  const filterBySearch = (stageItems: T[], stage: string): T[] => {
    if (!searchable || !getSearchableFields) return stageItems
    const q = (stageSearchQueries[stage] ?? '').trim().toLowerCase()
    if (!q) return stageItems
    return stageItems.filter((item) => {
      const fields = getSearchableFields(item).map((f) => String(f ?? '').toLowerCase())
      return fields.some((f) => f.includes(q))
    })
  }

  const setStageQuery = (stage: string, value: string) => {
    setStageSearchQueries((prev) => ({ ...prev, [stage]: value }))
  }

  const toggleSearch = (stage: string) => {
    setExpandedSearchStage((prev) => (prev === stage ? null : stage))
    setStageSearchQueries((prev) => ({ ...prev, [stage]: prev[stage] ?? '' }))
    setTimeout(() => searchInputRefs.current[stage]?.focus(), 0)
  }

  useEffect(() => {
    if (expandedSearchStage) searchInputRefs.current[expandedSearchStage]?.focus()
  }, [expandedSearchStage])

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
    <div className="flex gap-6 overflow-x-auto pb-6 custom-scrollbar min-h-full">
      {stages.map((stage) => {
        const stageItems = getItemsByStage(stage)
        const filteredItems = filterBySearch(stageItems, stage)
        const label = stageLabels[stage] || stage.replace(/_/g, ' ')
        const isSearchExpanded = searchable && expandedSearchStage === stage
        const hasActiveSearch = searchable && (stageSearchQueries[stage] ?? '').trim().length > 0

        return (
          <div
            key={stage}
            className={`bg-[#F8FAFC] rounded-xl flex flex-col min-w-[320px] w-[320px] flex-shrink-0 border border-gray-200 shadow-sm ${condensed ? 'gap-1' : 'gap-3'}`}
            style={{ height: columnHeight }}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, stage)}
          >
            <div className={`flex flex-col shrink-0 ${condensed ? 'p-3 pb-1' : 'p-4 pb-2'}`}>
              <div className="flex justify-between items-center gap-2">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider truncate min-w-0">{label}</h3>
                <div className="flex items-center gap-1.5 shrink-0">
                  {searchable && getSearchableFields && (
                    <button
                      type="button"
                      onClick={() => toggleSearch(stage)}
                      className={`p-1.5 rounded-md transition-colors ${isSearchExpanded ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
                      title={isSearchExpanded ? 'Close search' : 'Search in this stage'}
                      aria-label={isSearchExpanded ? 'Close search' : 'Search in this stage'}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </button>
                  )}
                  <span className="text-xs bg-white text-blue-600 px-2.5 py-1 rounded-full border border-blue-100 font-bold shadow-sm">
                    {hasActiveSearch ? `${filteredItems.length}/${stageItems.length}` : stageItems.length}
                  </span>
                </div>
              </div>
              {isSearchExpanded && (
                <div className="mt-2">
                  <input
                    ref={(el) => { searchInputRefs.current[stage] = el }}
                    type="text"
                    value={stageSearchQueries[stage] ?? ''}
                    onChange={(e) => setStageQuery(stage, e.target.value)}
                    placeholder={searchPlaceholder}
                    className="w-full text-sm px-3 py-2 rounded-lg border border-gray-200 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              )}
            </div>

            <div className={`flex-1 overflow-y-auto custom-scrollbar ${condensed ? 'px-2 pb-2 space-y-2' : 'px-3 pb-3 space-y-3'}`}>
              {(Array.isArray(filteredItems) ? filteredItems : []).map((item) => (
                <div
                  key={item.id}
                  className={`flex gap-2 bg-white rounded-lg border border-gray-200 hover:border-blue-500 hover:shadow-md transition-all duration-200 group ${condensed ? 'p-2' : 'p-3'} ${onItemClick ? '' : 'cursor-move'}`}
                >
                  {onItemClick ? (
                    <>
                      <div
                        draggable
                        onDragStart={() => handleDragStart(item.id)}
                        className="shrink-0 cursor-move self-center p-1.5 text-gray-400 hover:text-blue-600 transition-colors opacity-0 group-hover:opacity-100"
                        title="Drag to change stage"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="9" cy="5" r="1" /><circle cx="9" cy="12" r="1" /><circle cx="9" cy="19" r="1" />
                          <circle cx="15" cy="5" r="1" /><circle cx="15" cy="12" r="1" /><circle cx="15" cy="19" r="1" />
                        </svg>
                      </div>
                      <div
                        className="flex-1 min-w-0 cursor-pointer"
                        onClick={() => onItemClick(item)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => e.key === 'Enter' && onItemClick(item)}
                      >
                        {renderItem(item)}
                      </div>
                    </>
                  ) : (
                    <div
                      draggable
                      onDragStart={() => handleDragStart(item.id)}
                      className="flex-1 min-w-0"
                    >
                      {renderItem(item)}
                    </div>
                  )}
                </div>
              ))}
              {filteredItems.length === 0 && (
                <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                  {hasActiveSearch ? (
                    <>
                      <svg className="w-8 h-8 mb-2 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      <span className="text-xs font-medium">No matching leads</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-8 h-8 mb-2 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      <span className="text-xs font-medium">No leads here</span>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

