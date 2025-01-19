'use client'
import { memo, useState, useEffect, useRef } from 'react'
import { useTranslations } from '@/hooks/useTranslations'
import { Item } from '@/types'
import 'boxicons/css/boxicons.min.css'
import useSWR, { mutate as globalMutate } from 'swr'

interface FloatingDueItemsProps {
  items: Item[]
  settings: any
  onItemClick: (item: Item) => void
}

const FloatingDueItems = memo(function FloatingDueItems({ 
  items, 
  settings,
  onItemClick,
}: FloatingDueItemsProps) {
  const { t } = useTranslations()
  const [isExpanded, setIsExpanded] = useState(false)
  const [isHighlighted, setIsHighlighted] = useState(false)
  const previousItemsRef = useRef<Item[]>([])
  
  // Use SWR to keep due items in sync
  const { data: dueItems } = useSWR<Item[]>('/api/items/due', {
    refreshInterval: 60000, // Refresh every minute
    revalidateOnFocus: true,
    revalidateOnReconnect: true
  })

  // Use dueItems if available, otherwise fall back to filtered items prop
  const upcomingItems = dueItems || items
    .filter(item => item.dueAt)
    .sort((a, b) => {
      const dateA = new Date(a.dueAt!).getTime()
      const dateB = new Date(b.dueAt!).getTime()
      return dateA - dateB
    })
    .slice(0, 3)

  // Trigger highlight animation when items change
  useEffect(() => {
    if (!upcomingItems) return

    const currentIds = upcomingItems.map(item => item.id).join(',')
    const previousIds = previousItemsRef.current.map(item => item.id).join(',')

    if (previousIds && currentIds !== previousIds) {
      setIsHighlighted(true)
      setTimeout(() => setIsHighlighted(false), 1000) // Remove highlight after 1s
    }

    previousItemsRef.current = upcomingItems
  }, [upcomingItems])

  // Revalidate due items when component mounts and when tab becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        globalMutate('/api/items/due')
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  return (
    <div className={`
      absolute right-4 z-50 
      ${settings?.headerEnabled ? 'top-80' : 'top-20'}
      bg-white/90 dark:bg-gray-800/90 
      mt-0.5 pt-0.5 pb-1 pl-2 pr-4 min-w-[160px]
      rounded-sm shadow-md 
      border transition-all duration-200
      ${isHighlighted 
        ? 'border-red-500 shadow-gray-900/50 border-10 animate-wiggle' 
        : 'border-gray-500/50 dark:border-gray-500/50'
      }
      ${isHighlighted ? 'animate-highlight' : ''}
    `}>
      <div className="flex items-center gap-0 cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
        <i 
          className={`bx bxs-bell text-red-700 dark:text-red-800'`}
          style={{ fontSize: '14px' }}
        />
        <i
          className={`bx bx-${isExpanded ? 'chevron-down' : 'chevron-right'} text-gray-400`}
          style={{ fontSize: '14px' }}
        />
        <span className="text-sm text-gray-700 dark:text-gray-300 ml-1">
          {upcomingItems.length ? t('dueItems') : t('noDueItems')}
        </span>
      </div>

      {upcomingItems.length > 0 && (
        <div className={`
          overflow-hidden transition-all duration-200
          ${isExpanded ? 'min-h-50 mt-1' : 'max-h-0'}
        `}>
          <div className="space-y-2">
            {upcomingItems.map(item => (
              <div 
                key={item.id}
                onClick={() => onItemClick(item)}
                className="cursor-pointer px-2 pb-1 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded"
              >
                <div className="flex items-center gap-1">
                  <i className={`bx bxs-${item.iconName} text-${item.status}-500`}></i>
                  <span className="text-sm text-gray-700 dark:text-gray-300">{item.name}</span>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-0">
                  {new Date(item.dueAt!).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
})

export default FloatingDueItems
