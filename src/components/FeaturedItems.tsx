'use client'
import { useState } from 'react'
import { useItems } from '@/hooks/useItems'
import { Item, Status } from '@/types'

interface FeaturedItemsProps {
  className?: string
  onItemClick?: (item: Item) => void
}

export default function FeaturedItems({ className = '', onItemClick }: FeaturedItemsProps) {
  const { items } = useItems()
  const [selectedStatus, setSelectedStatus] = useState<Status>('red')

  // Status options with their display colors
  const statusOptions: { value: Status; bgColor: string; hoverColor: string }[] = [
    { value: 'red', bgColor: 'bg-red-500', hoverColor: 'hover:bg-red-500' },
    { value: 'yellow', bgColor: 'bg-yellow-500', hoverColor: 'hover:bg-yellow-500' },
    { value: 'green', bgColor: 'bg-green-500', hoverColor: 'hover:bg-green-500' },
    { value: 'blue', bgColor: 'bg-blue-500', hoverColor: 'hover:bg-blue-500' },
    { value: 'purple', bgColor: 'bg-purple-500', hoverColor: 'hover:bg-purple-500' },
    { value: 'gray', bgColor: 'bg-gray-500', hoverColor: 'hover:bg-gray-500' }
  ]

  // Get the 5 most recently updated items of selected status
  const filteredItems = items
    ?.filter(item => item.status === selectedStatus)
    .sort((a, b) => {
      const dateA = new Date(a.updatedAt).getTime()
      const dateB = new Date(b.updatedAt).getTime()
      return dateB - dateA // Most recent first
    })
    .slice(0, 5)

  if (!items?.length) return null

  return (
    <div className={`bg-black/70 rounded-md border border-slate-400/50 ${className}`}>
      {/* Status Filter Buttons */}
      <div className="px-3 py-2 flex gap-1 border-b border-slate-400/20">
        {statusOptions.map(status => (
          <button
            key={status.value}
            onClick={() => setSelectedStatus(status.value)}
            className={`
              w-5 h-2 rounded-sm transition-all
              ${status.bgColor} ${status.hoverColor}
              ${selectedStatus === status.value ? 'ring-2 ring-white' : 'opacity-70'}
            `}
            title={status.value.charAt(0).toUpperCase() + status.value.slice(1)}
          />
        ))}
      </div>

      {/* Items List */}
      <div className="p-2 space-y-1">
        {filteredItems?.length ? (
          filteredItems.map(item => (
            <div
              key={item.id}
              className="flex items-center gap-2 px-2 py-1 rounded-sm border border-1 border-slate-400/0 
                cursor-pointer hover:bg-slate-500/40 hover:border hover:border-slate-400/30"
              onClick={() => onItemClick?.(item)}
            >
              <i className={`bx bxs-${item.iconName || 'circle'} text-slate-400`} />
              <span className="text-sm text-slate-200 truncate">
                {item.name}
              </span>
            </div>
          ))
        ) : (
          <div className="text-sm text-slate-400 text-center py-2">
            No {selectedStatus} items
          </div>
        )}
      </div>
    </div>
  )
} 