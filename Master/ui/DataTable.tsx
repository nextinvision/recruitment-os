'use client'

import React, { useState } from 'react'

export interface Column<T> {
  key: keyof T | string
  header: string
  render?: (item: T) => React.ReactNode
}

export interface DataTableProps<T> {
  data: T[]
  columns: Column<T>[]
  onRowClick?: (item: T) => void
  searchable?: boolean
  filterable?: boolean
  searchPlaceholder?: string
}

export function DataTable<T extends { id: string }>({
  data,
  columns,
  onRowClick,
  searchable = false,
  filterable = false,
  searchPlaceholder = 'Search...',
}: DataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState('')
  const [sortKey, setSortKey] = useState<keyof T | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

  const filteredData = searchable && searchTerm
    ? data.filter((item) =>
        columns.some((col) => {
          const value = typeof col.key === 'string' 
            ? (item as any)[col.key]
            : item[col.key as keyof T]
          return String(value).toLowerCase().includes(searchTerm.toLowerCase())
        })
      )
    : data

  const sortedData = sortKey
    ? [...filteredData].sort((a, b) => {
        const aVal = a[sortKey as keyof T]
        const bVal = b[sortKey as keyof T]
        if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1
        if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1
        return 0
      })
    : filteredData

  const handleSort = (key: keyof T) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDirection('asc')
    }
  }

  return (
    <div className="bg-white shadow-md overflow-hidden rounded-xl border border-[#E5E7EB]">
      {searchable && (
        <div className="p-4 border-b border-[#E5E7EB] bg-[#F8FAFC]">
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#F4B400] focus:border-[#F4B400] text-[#0F172A] placeholder-[#64748B] bg-white"
          />
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-[#E5E7EB]">
          <thead className="bg-[#1F3A5F]">
            <tr>
              {columns.map((column) => (
                <th
                  key={String(column.key)}
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider cursor-pointer hover:bg-[#152A4A] transition-colors"
                  onClick={() => handleSort(column.key as keyof T)}
                >
                  <div className="flex items-center space-x-1">
                    <span>{column.header}</span>
                    {sortKey === column.key && (
                      <span className="text-[#F4B400]">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-[#E5E7EB]">
            {sortedData.map((item) => (
              <tr
                key={item.id}
                onClick={(e) => {
                  // Only trigger row click if not clicking on a link or button
                  const target = e.target as HTMLElement
                  if (target.tagName !== 'A' && target.tagName !== 'BUTTON' && !target.closest('a') && !target.closest('button')) {
                    onRowClick?.(item)
                  }
                }}
                className={onRowClick ? 'hover:bg-[rgba(244,180,0,0.05)] cursor-pointer transition-colors' : ''}
              >
                {columns.map((column) => (
                  <td key={String(column.key)} className="px-6 py-4 whitespace-nowrap text-sm text-[#0F172A]">
                    {column.render
                      ? column.render(item)
                      : String(item[column.key as keyof T])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {sortedData.length === 0 && (
        <div className="text-center py-12">
          <p className="text-[#64748B]">No data found</p>
        </div>
      )}
    </div>
  )
}

