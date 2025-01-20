'use client'
import { useState, useEffect } from 'react'
import { Item, Status } from '@/types'
import { useDebugStore } from '@/stores/debugStore'
import { useItems } from '@/hooks/useItems'
import { getStatusColor } from '@/lib/utils'
import FormattedDescription from './FormattedDescription'
import Modal from './ui/Modal'
import ItemForm from './forms/ItemForm'
import { useTranslations } from '@/hooks/useTranslations'
import DeleteConfirmation from '@/components/ui/DeleteConfirmation'
import { toast } from 'react-hot-toast'
import { mutate as globalMutate } from 'swr'

interface CardPublicProps {
  item: Item
  viewMode?: 'grid' | 'list' | 'expanded'
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

  // If this is a private item, show a placeholder instead
  if (item.isPrivate && !item.showPrivateContent) {
    return (
      <div 
        className={`
          relative bg-white dark:bg-gray-500/10
          rounded-lg
          border border-gray-100 dark:border-gray-700/50
          p-4
          opacity-75
          transition-all duration-200
          hover:opacity-90
        `}
      >
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-700/30
            flex items-center justify-center"
          >
            <i className="bx bx-lock-alt text-gray-300 dark:text-gray-600" />
          </div>
          <div className="flex-1">
            <div className="h-4 bg-gray-100 dark:bg-gray-700/30 rounded w-2/3 mb-2" />
            <div className="h-3 bg-gray-100 dark:bg-gray-700/30 rounded w-1/2" />
          </div>
        </div>
      </div>
    )
  }

  if (!mounted) return null

  const cardClasses = `
    relative bg-white dark:bg-gray-800 
    rounded-lg p-4 shadow-sm
    border border-gray-200 dark:border-gray-700
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
        bg-${item.status}-500
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