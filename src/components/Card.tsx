'use client'
import { useState, useEffect } from 'react'
import { Item, Status } from '@/types'
import { useDebugStore } from '@/stores/debugStore'
import { useItems } from '@/hooks/useItems'
import { useTranslations } from '@/hooks/useTranslations'
import DeleteConfirmation from '@/components/ui/DeleteConfirmation'
import { toast } from 'react-hot-toast'
import { mutate as globalMutate } from 'swr'

interface CardProps {
  item: Item
  onDelete: () => void
  onEdit: () => void
  isDragging: boolean
  isDeleting: boolean
  isPlaceholder?: boolean
  viewMode?: 'grid' | 'list' | 'expanded' | 'print'
  showFooter?: boolean
}

export default function Card({ 
  item, 
  onDelete, 
  onEdit, 
  isDragging, 
  isDeleting, 
  isPlaceholder,
  viewMode = 'grid',
  showFooter = false
}: CardProps) {
  const [mounted, setMounted] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const { mutate } = useItems(item.groupId)
  const debugStore = useDebugStore()
  const { t } = useTranslations()
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteButtonPosition, setDeleteButtonPosition] = useState({ x: 0, y: 0 })

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

  const handleStatusClick = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (isUpdating) return
    
    const statuses: Status[] = ['gray', 'blue', 'green', 'yellow', 'red', 'purple']
    const currentIndex = statuses.indexOf(item.status as Status)
    const nextStatus = statuses[(currentIndex + 1) % statuses.length]
    
    setIsUpdating(true)

    try {
      const response = await fetch(`/api/items/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus })
      })

      if (!response.ok) {
        throw new Error('Failed to update status')
      }

      // Mutate both the group-specific items and all items
      await Promise.all([
        mutate(),
        mutate('/api/items') // Mutate the global items cache
      ])
    } catch (error) {
      console.error('Failed to update status:', error)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleClearDueDate = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (isUpdating) return
    
    setIsUpdating(true)

    try {
      const response = await fetch(`/api/items/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dueAt: null })
      })

      if (!response.ok) {
        throw new Error('Failed to clear due date')
      }

      // Mutate all relevant caches
      await Promise.all([
        mutate(),                    // Group-specific items
        globalMutate('/api/items'),  // Global items list
        globalMutate('/api/items/due') // Due items specifically
      ])

      toast.success(t('dueDateCleared'), {
        duration: 2000,
        position: 'bottom-right',
        className: 'bg-white dark:bg-gray-800 dark:text-gray-200'
      })

    } catch (error) {
      console.error('Failed to clear due date:', error)
      toast.error(t('errorClearingDueDate'), {
        duration: 3000,
        position: 'bottom-right',
        className: 'bg-white dark:bg-gray-800 dark:text-gray-200'
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDelete = async () => {
    try {
      // First call the parent's onDelete handler which performs the actual deletion
      await onDelete()
      
      // Then mutate all relevant caches after the delete is successful
      await Promise.all([
        mutate(),                    // Group-specific items
        globalMutate('/api/items'),  // Global items list
        globalMutate('/api/items/due') // Due items specifically
      ])
    } catch (error) {
      console.error('Failed to handle delete:', error)
    }
  }

  // If this is a private item and we're not showing private content,
  // show a placeholder instead
  if (item.isPrivate && !item.showPrivateContent) {
    // Show placeholder for private group items
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
                ${item.useStatusColor ? 'text-white' : 'text-gray-500'}
              `} style={{ fontSize: '0.875rem' }} />
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
    rounded-lg p-4 shadow-sm
    border border-gray-200 dark:border-gray-700
    transition-all duration-200 ease-in-out
    ${isDragging ? 'shadow-lg' : ''}
    ${isPlaceholder ? 'opacity-50 pointer-events-none' : ''}
    ${isDeleting ? 'scale-90 opacity-0' : 'scale-100 opacity-100'}
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

      {/* Hover overlay */}
      <div className={`
        absolute inset-0 rounded-lg transition-colors
        ${isDragging ? 'bg-black/0' : 'bg-black/0 group-hover:bg-black/5 dark:group-hover:bg-black/40'}
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
                ${viewMode === 'expanded' || viewMode === 'list' ? '' : 'line-clamp-2'}
              `}
            >
              {item.description}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="flex gap-1 bg-white dark:bg-gray-700 rounded-md shadow-sm px-3 py-1">


            {/* Icon color toggle button */}
            {item.iconName && (
              <button
                onClick={async (e) => {
                  e.preventDefault()
                  e.stopPropagation()

                  // Create optimistic data
                  const updatedItem = {
                    ...item,
                    useStatusColor: !item.useStatusColor
                  }

                  // Get the current cache key
                  const cacheKey = `/api/items${item.groupId ? `?groupId=${item.groupId}` : ''}`

                  // Optimistically update the cache
                  mutate(
                    (currentItems) => 
                      currentItems?.map(i => i.id === item.id ? updatedItem : i),
                    {
                      revalidate: false,
                      populateCache: true
                    }
                  )

                  try {
                    const response = await fetch(`/api/items/${item.id}`, {
                      method: 'PATCH',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        name: item.name,
                        description: item.description,
                        status: item.status,
                        groupId: item.groupId,
                        iconName: item.iconName,
                        useStatusColor: !item.useStatusColor
                      })
                    })
                    if (!response.ok) throw new Error('Failed to update item')
                  } catch (error) {
                    console.error('Failed to toggle color mode:', error)
                    // Revert on error by revalidating
                    mutate()
                  }
                }}
                className="p-1 text-gray-400 hover:text-gray-500 dark:text-gray-400 dark:hover:text-gray-300 
                rounded flex items-center justify-center"
                title={item.useStatusColor ? "Disable colored icon" : "Enable colored icon"} >
                <i className="bx bxs-paint text-base" />
              </button>
            )}

            {/* Color cycle button */}
            <button
              onClick={handleStatusClick}
              disabled={isUpdating}
              className="p-1 text-gray-400 hover:text-gray-500 dark:text-gray-400 dark:hover:text-gray-300 
              rounded flex items-center justify-center"
              title="Cycle status color" >
              <i className="bx bx-palette text-base" />
            </button>

            {/* Mark as Done */}
            <button
              onClick={handleClearDueDate}
              disabled={isUpdating || !item.dueAt}
              className={`p-1 ${
                item.dueAt 
                  ? 'text-gray-400 hover:text-gray-500 dark:text-gray-400 dark:hover:text-gray-300' 
                  : 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
              } rounded flex items-center justify-center`}
              title={item.dueAt ? t('removeDueDate') : t('noDueDate')}
            >
              <i className="bx bx-check-square text-base" />
            </button>

            {/* Edit button */}
            {onEdit && (
              <button
                onClick={onEdit}
                className="p-1 text-gray-400 hover:text-gray-500 dark:text-gray-400 
                dark:hover:text-gray-300 rounded flex items-center justify-center" >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" 
                  />
                </svg>
              </button>
            )}

            {/* Delete button */}
            <button
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                const rect = e.currentTarget.getBoundingClientRect()
                setDeleteButtonPosition({ 
                  x: rect.left,
                  y: rect.top
                })
                setShowDeleteConfirm(true)
              }}
              className="p-1 text-gray-400 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400 rounded flex items-center justify-center"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" 
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <DeleteConfirmation
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={() => {
          handleDelete()
          setShowDeleteConfirm(false)
        }}
        message={t('confirmDeleteItem')}
        buttonPosition={deleteButtonPosition}
      />

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