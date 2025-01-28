'use client'
import { useState, useEffect } from 'react'
import { Item, Status } from '@/types'
import { useTranslations } from '@/hooks/useTranslations'


interface CardPublicProps {
  item: Item
  viewMode?: 'grid' | 'list' | 'expanded' | 'print'
  showFooter?: boolean
}

export default function CardPublic({ 
  item,
  viewMode = 'grid',
  showFooter = false
}: CardPublicProps) {
  const [mounted, setMounted] = useState(false)
  const { t } = useTranslations()

  useEffect(() => {
    // Lazy load boxicons
    import('boxicons')
      .catch(err => {
        console.warn('Failed to load boxicons:', err)
      })
      .finally(() => {
        setMounted(true)
      })
  }, [])

  // Add print view mode handling
  if (viewMode === 'print') {
    return (
      <div className="print:break-inside-avoid mb-2 mx-auto">
        {/* Header with status and icon */}
        <div className="flex items-center gap-2 mb-2">
          {item.iconName && (
            <div className={`
              w-5 h-5 rounded flex items-center justify-center print:border
              ${item.useStatusColor ? `bg-${item.status}-500` : 'bg-gray-100'}
            `}>
              <i className={`
                bx bxs-${item.iconName} 
                ${item.useStatusColor 
                  ? 'text-white' 
                  : 'text-gray-500 dark:text-gray-400'
                }
                group-hover:animate-bump
              `} 
              style={{ fontSize: '0.875rem' }} 
              />
            </div>
          )}
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-300 print:text-black my-0 py-0 leading-none">
            {item.name}
          </h3>
          <div className={`
            no-print ml-auto px-2 py-0 rounded-full text-xs
            bg-${item.status}-100 text-${item.status}-800
            print:border print:border-${item.status}-200
          `}>
            {t(item.status + 'Status')}
          </div>
        </div>

        {/* Main content */}
        <div className="px-0 pt-1 print:text-black">
          {item.description && (
            <div className="prose prose-sm max-w-none whitespace-pre-wrap pb-2 text-gray-500 dark:text-gray-400">
              {item.description}
            </div>
          )}
          
          {/* Metadata footer - now inline */}
          <div className="text-xs text-gray-500 border-t border-gray-200 dark:border-gray-500 pt-0.5 pb-3 flex flex-wrap gap-x-4">
            {item.createdAt && (
              <div>Created: {new Date(item.createdAt).toLocaleDateString()}</div>
            )}
            {item.updatedAt && item.updatedAt !== item.createdAt && (
              <div>Updated: {new Date(item.updatedAt).toLocaleDateString()}</div>
            )}
            {item.dueAt && (
              <div>Due: {new Date(item.dueAt).toLocaleDateString()}</div>
            )}
          </div>
        </div>
      </div>
    )
  }


  if (!mounted) return null

  const cardClasses = `
    relative group bg-white dark:bg-gray-800 
    rounded-lg p-4 shadow-sm hover:shadow-md
    border border-gray-200 dark:border-gray-700
    hover:border-gray-300 hover:dark:border-gray-600 hover:border-b-1
    transition-all duration-200 ease-in-out
  `

  // Add a helper function for date formatting
  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return ''
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }).format(new Date(date))
  }

  return (
    <div className={cardClasses}>
      {/* Status stripe */}
      <div className={`
        absolute top-0 left-0 right-0 h-1 
        rounded-t-lg transition-colors
        bg-black/0 group-hover:bg-black/20 dark:group-hover:bg-white/30
        bg-${item.status}-500
      `} />

      {/* Hover overlay */}
      <div className={`
        absolute inset-0 rounded-lg transition-colors
        'bg-black/0' : 'bg-black/0 group-hover:bg-gray-500/5 dark:group-hover:bg-black/40'}
      `} />

      <div className="relative flex gap-3">
        {/* Icon */}
        {item.iconName ? (
          <div className={`
            w-8 h-8 rounded-lg flex items-center justify-center
            ${item.useStatusColor 
              ? `bg-${item.status}-500` 
              : 'bg-gray-100 dark:bg-gray-800'
            }
          `}>
            <i 
              className={`
                bx bxs-${item.iconName} 
                ${item.useStatusColor 
                  ? 'text-white' 
                  : 'text-gray-500 dark:text-gray-400'
                }
                group-hover:animate-bump
              `}
              style={{ fontSize: '1.25rem' }}
            />
          </div>
        ) : null}

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className={`
            font-medium text-gray-900 dark:text-gray-100
            ${viewMode === 'grid' ? 'text-lg' : 'text-base'}
            ${viewMode === 'expanded' ? '' : 'truncate'}
          `}>
            {item.name}
          </h3>
          {item.description && (
            <div 
              className={`
                mt-1 text-sm text-gray-500 dark:text-gray-400
                whitespace-pre-wrap break-words
                ${viewMode === 'expanded' ? '' : 'line-clamp-2'}
              `}
            >
              {item.description}
            </div>
          )}
        </div>
      </div>

      {/* Conditionally render footer based on showFooter prop */}
      {showFooter && (
        <div className="mt-1 pt-1 border-t border-gray-200/30 dark:border-gray-700/30">
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-gray-500 dark:text-gray-400">
            {item.createdAt && (
              <div className="flex items-center gap-1">
                <span>Created {formatDate(item.createdAt)}</span>
              </div>
            )}
            
            {item.updatedAt && item.updatedAt !== item.createdAt && (
              <div className="flex items-center gap-1">
                <span>Updated {formatDate(item.updatedAt)}</span>
              </div>
            )}
            
            {item.dueAt && (
              <div className="flex items-center gap-1">
                <span>Due {formatDate(item.dueAt)}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}