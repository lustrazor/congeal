'use client'
import { useState, useEffect, useCallback } from 'react'
import Card from '@/components/Card'
import Sidebar from '@/components/Sidebar'
import 'boxicons/css/boxicons.min.css';
import { useItems } from '@/hooks/useItems'
import Modal from '@/components/ui/Modal'
import ItemForm from '@/components/forms/ItemForm'
import { Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import DragDropContextWrapper from '@/components/DragDropContextWrapper'
import { useDebugStore } from '@/stores/debugStore'
import { useGroups } from '@/hooks/useGroups'
import { useSettings } from '@/hooks/useSettings'
import Header from '@/components/Header'
import { Status, Item } from '@/types'
import { updateItem, deleteItem } from '@/lib/api'
import { useTranslations } from '@/hooks/useTranslations'
import { mutate as globalMutate } from 'swr'
import FloatingDueItems from '@/components/FloatingDueItems'


export default function Home() {
  const { t } = useTranslations()
  const { groups } = useGroups()
  const debugStore = useDebugStore()
  const [featuredQuote, setFeaturedQuote] = useState<{ quote: string; thinker: string } | null>(null)
  const [currentQuoteId, setCurrentQuoteId] = useState<number | null>(null)


    // Lazy load boxicons
  const [mounted, setMounted] = useState(false); // Add state for mounted
  useEffect(() => {
    import('boxicons')
      .catch(err => {
        console.warn('Failed to load boxicons:', err)
      })
      .finally(() => {
        setMounted(true)
      })
  }, [])



  // Track which group is selected, persisted in localStorage
  const [selectedGroupId, setSelectedGroupId] = useState<number | null | undefined>(() => {
    if (typeof window === 'undefined') return undefined
    const stored = localStorage.getItem('selectedGroupId')
    if (!stored) return undefined
    if (stored === 'all') return undefined
    if (stored === 'ungrouped') return null
    return parseInt(stored, 10)
  })

  // Modal state for creating/editing items
  const [isItemModalOpen, setIsItemModalOpen] = useState(false)
  const { items, isLoading, mutate } = useItems(selectedGroupId)
  const [searchQuery, setSearchQuery] = useState('')
  const { mutate: mutateGroups } = useGroups()
  const currentGroup = groups?.find(g => g.id === selectedGroupId)
  const { settings, updateSettings } = useSettings()
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'expanded'>(
    selectedGroupId === undefined ? settings?.allViewMode || 'grid' :
    selectedGroupId === null ? settings?.ungroupedViewMode || 'grid' :
    currentGroup?.viewMode || 'grid'
  )
  const [editingItem, setEditingItem] = useState<Item | null>(null)
  const [isAnyDragging, setIsAnyDragging] = useState(false)
  const [deletingItems, setDeletingItems] = useState<Set<number>>(new Set())
  const [initialLoadComplete, setInitialLoadComplete] = useState(false)
  const [selectedStatuses, setSelectedStatuses] = useState<Set<Status>>(new Set())
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>(
    selectedGroupId === undefined ? settings?.allSortDirection || 'asc' :
    selectedGroupId === null ? settings?.ungroupedSortDirection || 'asc' :
    currentGroup?.sortDirection || 'asc'
  )
  const [sortField, setSortField] = useState<'order' | 'createdAt' | 'updatedAt' | 'dueAt'>(
    selectedGroupId === undefined ? settings?.allSortField || 'order' :
    selectedGroupId === null ? settings?.ungroupedSortField || 'order' :
    currentGroup?.sortField || 'order'
  )
  const [showFooter, setShowFooter] = useState(false)
  const { items: allItems, mutate: mutateAllItems } = useItems()
  const [isUpcomingExpanded, setIsUpcomingExpanded] = useState(false)
  const [hasPlayedSound, setHasPlayedSound] = useState(false)

  // Move shouldShowItem inside component
  const shouldShowItem = (item: Item, settings: any, groups: any[]) => {
    // Get the group this item belongs to
    const itemGroup = groups?.find(g => g.id === item.groupId)
    
    // Hide items in private groups unless showPrivateGroups is enabled
    if (itemGroup?.isPrivate && !settings?.showPrivateGroups) {
      return false
    }
    
    return true
  }

  // Move the helper inside the component to access sortField
  const getEffectiveSortDirection = (clickedDirection: 'asc' | 'desc' | null) => {
    // For due dates, reverse the sort direction
    if (sortField === 'dueAt') {
      if (clickedDirection === 'asc') return 'desc'
      if (clickedDirection === 'desc') return 'asc'
      return null
    }
    // For other dates, use normal direction
    return clickedDirection
  }

  // Memoized callbacks
  const handleGroupSelect = useCallback(async (groupId: number | null | undefined) => {
    debugStore.log('Group selected', {
      type: 'SELECT_GROUP',
      data: {
        groupId,
        previousId: selectedGroupId,
        timestamp: new Date().toISOString()
      }
    })

    // Save selection to localStorage
    if (groupId === undefined) {
      localStorage.setItem('selectedGroupId', 'all')
    } else if (groupId === null) {
      localStorage.setItem('selectedGroupId', 'ungrouped')
    } else {
      localStorage.setItem('selectedGroupId', groupId.toString())
    }

    setSelectedGroupId(groupId)
  }, [selectedGroupId, debugStore])

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query)
  }, [])

  const handleDragStateChange = useCallback((isDragging: boolean) => {
    setIsAnyDragging(isDragging)
  }, [])

  // Update the effect to handle all cases
  useEffect(() => {
    if (selectedGroupId === undefined) {
      setViewMode(settings?.allViewMode || 'grid')
    } else if (selectedGroupId === null) {
      setViewMode(settings?.ungroupedViewMode || 'grid')
    } else if (currentGroup?.viewMode) {
      setViewMode(currentGroup.viewMode as 'list' | 'grid')
    }
  }, [selectedGroupId, currentGroup, settings])

  // Update the view mode toggle to handle all cases
  const handleViewModeChange = async (newMode: 'grid' | 'list' | 'expanded' | 'print') => {
    setViewMode(newMode)
    debugStore.log('View mode changed', {
      type: 'VIEW_MODE_CHANGE',
      data: {
        mode: newMode,
        groupId: selectedGroupId,
        timestamp: new Date().toISOString()
      }
    })

    try {
      if (selectedGroupId === undefined) {
        // Update "Show All" preference
        await updateSettings({ allViewMode: newMode })
      } else if (selectedGroupId === null) {
        // Update "Ungrouped" preference
        await updateSettings({ ungroupedViewMode: newMode })
      } else {
        // Update group preference
        const response = await fetch(`/api/groups/${selectedGroupId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ viewMode: newMode })
        })

        if (!response.ok) {
          throw new Error('Failed to update group view mode')
        }

        await mutateGroups()
      }

      debugStore.log('View preference saved', {
        type: 'VIEW_MODE_SAVED',
        data: {
          mode: newMode,
          groupId: selectedGroupId,
          timestamp: new Date().toISOString()
        }
      })
    } catch (error) {
      console.error('Failed to save view preference:', error)
      debugStore.log('Failed to save view preference', {
        type: 'VIEW_MODE_ERROR',
        error: String(error),
        timestamp: new Date().toISOString()
      })
    }
  }

  // Filter items
  const filteredItems = Array.isArray(items) 
    ? items.filter(item => {
        // First check if we should show this item based on privacy settings
        if (!shouldShowItem(item, settings, groups)) {
          return false
        }

        // For ungrouped view, only show items without a groupId
        if (selectedGroupId === null && item.groupId !== null) {
          return false
        }

        // Then check if item matches selected status filters
        if (selectedStatuses.size > 0 && !selectedStatuses.has(item.status)) {
          return false
        }

        // Finally apply search filter if there's a search query
        if (searchQuery) {
          const searchLower = searchQuery.toLowerCase()
          return (
            item.name.toLowerCase().includes(searchLower) ||
            item.description?.toLowerCase().includes(searchLower)
          )
        }

        return true
      })
    : []

  // Update the placeholder items creation
  const placeholderItems = selectedGroupId === undefined 
    ? (Array.isArray(groups) ? groups : [])
        .filter(g => g.isPrivate && !settings?.showPrivateGroups)
        .map(group => ({
          id: `placeholder-${group.id}`,
          name: t('hiddenContent'),
          description: t('privateGroupDescription'),
          status: 'gray' as Status,
          groupId: group.id,
          iconName: 'lock' as IconName,
          isPlaceholder: true // Explicitly mark as placeholder
        }))
    : []

  // Combine real and placeholder items
  const displayItems = [...(filteredItems || []), ...(placeholderItems || [])]

  const handleDragStart = () => {
    setIsAnyDragging(true)
  }

  const handleDragEnd = async (result: DropResult) => {
    setIsAnyDragging(false)

    if (!result.destination || !items) return

    debugStore.log('Item drag ended', {
      type: 'REORDER_ITEMS',
      data: {
        itemId: parseInt(result.draggableId),
        sourceIndex: result.source.index,
        destinationIndex: result.destination.index,
        groupId: selectedGroupId,
        timestamp: new Date().toISOString()
      }
    })

    try {
      // Get the moved item
      const movedItem = items[result.source.index]
      
      // Create new array with reordered items
      const newItems = Array.from(items)
      const [removed] = newItems.splice(result.source.index, 1)
      newItems.splice(result.destination.index, 0, removed)

      // Update order values
      const updatedItems = newItems.map((item, index) => ({
        ...item,
        order: index
      }))

      // Optimistic update
      mutate(updatedItems, false)

      const response = await fetch('/api/items/reorder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ items: updatedItems })
      })

      if (!response.ok) {
        throw new Error('Failed to reorder items')
      }

      debugStore.log('Items reordered', {
        type: 'ITEMS_REORDERED',
        data: {
          items: updatedItems,
          timestamp: new Date().toISOString()
        }
      })

      // Confirm update
      mutate()
    } catch (error) {
      console.error('Failed to reorder items:', error)
      debugStore.log('Failed to reorder items', {
        type: 'REORDER_ERROR',
        error: String(error),
        timestamp: new Date().toISOString()
      })
      // Revert on error
      mutate()
    }
  }

  // Add these handlers
  const handleStatusChange = async (itemId: number) => {
    try {
      const item = items?.find(i => i.id === itemId)
      if (!item) return

      // Get the next status in the cycle
      const statuses: Status[] = ['gray', 'blue', 'green', 'yellow', 'red', 'purple']
      const currentIndex = statuses.indexOf(item.status as Status)
      const nextStatus = statuses[(currentIndex + 1) % statuses.length]

      // Log for debugging
      console.log('Updating status:', { itemId, currentStatus: item.status, nextStatus })

      // Update the item
      await updateItem(itemId, { status: nextStatus })
      
      // Refresh the items list
      await mutate()
    } catch (error) {
      console.error('Failed to update item status:', error)
    }
  }

  const handleEditItem = (item: Item) => {
    setEditingItem(item)
    setIsItemModalOpen(true)
  }

  const handleDeleteItem = async (itemId: number) => {
    try {
      const response = await fetch(`/api/items/${itemId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to delete item')
      }

      // Refresh the items data
      await mutate()
    } catch (error) {
      console.error('Failed to delete item:', error)
    }
  }

    // Update the quote fetching effect
    useEffect(() => {
      const fetchQuote = async (isInitial: boolean = false) => {
        try {
          // Add timestamp to prevent caching in production
          const timestamp = new Date().getTime()
          
          // For initial fetch, get random quote with cache-busting
          const endpoint = isInitial 
            ? `/api/quotes/random?t=${timestamp}` 
            : `/api/quotes/next/${currentQuoteId}?t=${timestamp}`
          
          const response = await fetch(endpoint, {
            // Add cache control headers
            headers: {
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache'
            }
          })
          
          if (response.ok) {
            const data = await response.json()
            setFeaturedQuote(data)
            setCurrentQuoteId(data.id)

            // Log quote change
            debugStore.log('Quote changed', {
              type: 'QUOTE_CHANGED',
              data: {
                quoteId: data.id,
                isInitial,
                previousQuoteId: currentQuoteId,
                timestamp: new Date().toISOString()
              }
            })
          }
        } catch (error) {
          console.error('Failed to fetch quote:', error)
          debugStore.log('Quote fetch failed', {
            type: 'QUOTE_FETCH_ERROR',
            error: error instanceof Error ? error.message : String(error)
          })
        }
      }
  
      // Initial random fetch only on mount
      if (!currentQuoteId) {
        fetchQuote(true)
      }
  
      // Set up interval for sequential fetches
      const intervalId = setInterval(() => {
        if (currentQuoteId) {
          fetchQuote(false)
        }
      }, 1 * 60 * 500)
  
      // Cleanup interval on unmount
      return () => clearInterval(intervalId)
    }, [debugStore, currentQuoteId]) // Add required dependencies
  
  // Get current group name using translations
  const currentGroupName = selectedGroupId === undefined 
    ? t('allItems')
    : selectedGroupId === null
      ? t('ungrouped')
      : currentGroup?.name || ''

  // Add debug info for component mount
  useEffect(() => {
    if (debugStore.isEnabled) {
      debugStore.log('Main page mounted')
      debugStore.log(`Debug mode: ${debugStore.isEnabled ? 'enabled' : 'disabled'}`)
    }
  }, [debugStore.isEnabled])

  const handleAddItem = () => {
    setEditingItem(null) // Reset any editing state
    setIsItemModalOpen(true)
  }

  // Add this effect to handle initial group selection
  useEffect(() => {
    if (groups && selectedGroupId === undefined && !localStorage.getItem('selectedGroupId')) {
      // Find first non-divider group
      const firstGroup = groups.find(g => !g.isDivider)
      if (firstGroup) {
        handleGroupSelect(firstGroup.id)
      } else {
        // If no groups exist, default to Show All
        handleGroupSelect(undefined)
      }
    }
  }, [groups, selectedGroupId])

  // Add this helper function
  const toggleStatus = (status: Status) => {
    setSelectedStatuses(prev => {
      const newSet = new Set(prev)
      if (newSet.has(status)) {
        newSet.delete(status)
      } else {
        newSet.add(status)
      }
      return newSet
    })
  }

  // Update the sort function
  const sortItems = (items: Item[]) => {
    if (!items) return items

    return [...items].sort((a, b) => {
      if (sortField === 'order') {
        return sortDirection === 'asc' ? a.order - b.order : b.order - a.order
      }
      
      if (sortField === 'dueAt') {
        if (!a.dueAt && !b.dueAt) return 0
        if (!a.dueAt) return 1
        if (!b.dueAt) return -1
      }
      
      const dateA = new Date(a[sortField] || 0).getTime()
      const dateB = new Date(b[sortField] || 0).getTime()
      
      const effectiveDirection = getEffectiveSortDirection(sortDirection)
      return effectiveDirection === 'asc' ? dateA - dateB : dateB - dateA
    })
  }

  // Update the filtered and sorted items
  const filteredAndSortedItems = sortItems(filteredItems)

  // Add effect to keep groups in sync with localStorage
  useEffect(() => {
    if (groups) {
      localStorage.setItem('groups', JSON.stringify(groups))
      
      // Validate selected group still exists
      if (selectedGroupId !== undefined && selectedGroupId !== null) {
        const groupExists = groups.some(g => g.id === selectedGroupId)
        if (!groupExists) {
          // Find first available group
          const firstGroup = groups.find(g => !g.isDivider)
          if (firstGroup) {
            handleGroupSelect(firstGroup.id)
          } else {
            // No groups exist, show all
            handleGroupSelect(undefined)
          }
        }
      }
    }
  }, [groups])

 // Update the helper function to find next due item
 const getNextDueItem = (items: Item[] | undefined) => {
  if (!items?.length) return null
  
  const itemsWithDueDate = items
    .filter(item => item.dueAt)
    .sort((a, b) => {
      const dateA = new Date(a.dueAt!).getTime()
      const dateB = new Date(b.dueAt!).getTime()
      return dateA - dateB
    })

  return itemsWithDueDate[0] || null
}

// Update the helper function to get top 3 due items
const getUpcomingDueItems = (items: Item[] | undefined, limit = 3) => {
  if (!items?.length) return []
  
  return items
    .filter(item => item.dueAt)
    .sort((a, b) => {
      const dateA = new Date(a.dueAt!).getTime()
      const dateB = new Date(b.dueAt!).getTime()
      return dateA - dateB
    })
    .slice(0, limit)
}

// In the JSX, update the floating container
const upcomingItems = getUpcomingDueItems(allItems)

// Add helper to check if a date matches any of our thresholds
const isAtNotificationThreshold = (dueDate: Date) => {
  const now = new Date()
  const diffMs = dueDate.getTime() - now.getTime()
  const diffHours = diffMs / (1000 * 60 * 60)
  const diffDays = diffHours / 24
  const diffWeeks = diffDays / 7
  const diffMonths = diffDays / 30

  return (
    Math.abs(diffHours - 1) < 0.1 ||   // 1 hour
    Math.abs(diffHours - 2) < 0.1 ||   // 2 hours
    Math.abs(diffDays - 1) < 0.1 ||    // 1 day
    Math.abs(diffDays - 2) < 0.1 ||    // 2 days
    Math.abs(diffWeeks - 1) < 0.1 ||   // 1 week
    Math.abs(diffMonths - 1) < 0.1     // 1 month
  )
}

// Add sound notification helper (near other helper functions)
const playNotificationSound = () => {
  const audio = new Audio('/sounds/notification.mp3')
  audio.play().catch(error => {
    // Silently handle autoplay restrictions
    console.debug('Could not play notification sound:', error)
  })
}

// Update the effect to include sound
useEffect(() => {
  const checkDueDates = () => {
    if (!upcomingItems.length) return

    const shouldNotify = upcomingItems.some(item => 
      item.dueAt && isAtNotificationThreshold(new Date(item.dueAt))
    )

    if (shouldNotify) {
      setIsUpcomingExpanded(true)
      // Only play sound if we haven't played it yet this session
      if (!hasPlayedSound) {
        playNotificationSound()
        setHasPlayedSound(true)
      }
    }
  }

  // Check immediately
  checkDueDates()

  // Check every 1 minutes
  const interval = setInterval(checkDueDates, 1 * 60 * 1000)

  return () => clearInterval(interval)
}, [upcomingItems, hasPlayedSound]) // Add hasPlayedSound to dependencies

// Add helper to get time status and message
const getTimeStatus = (dueDate: Date) => {
  const now = new Date()
  const diffMs = dueDate.getTime() - now.getTime()
  const diffHours = diffMs / (1000 * 60 * 60)
  const diffDays = diffHours / 24
  const diffWeeks = diffDays / 7
  const diffMonths = diffDays / 30

  switch (true) {
    case Math.abs(diffHours - 1) < 0.1:
      return { color: 'red-500', message: t('dueInOneHour') }
    case Math.abs(diffHours - 2) < 0.1:
      return { color: 'red-400', message: t('dueInTwoHours') }
    case Math.abs(diffDays - 1) < 0.1:
      return { color: 'orange-500', message: t('dueInOneDay') }
    case Math.abs(diffDays - 2) < 0.1:
      return { color: 'orange-400', message: t('dueInTwoDays') }
    case Math.abs(diffWeeks - 1) < 0.1:
      return { color: 'yellow-500', message: t('dueInOneWeek') }
    case Math.abs(diffMonths - 1) < 0.1:
      return { color: 'yellow-400', message: t('dueInOneMonth') }
    default:
      return null
  }
}

  // Add these handler functions near the other handlers
  const handleSortFieldChange = async (field: 'order' | 'createdAt' | 'updatedAt' | 'dueAt') => {
    setSortField(field)

    try {
      if (selectedGroupId === undefined) {
        // Save to settings for "All Items" view
        await updateSettings({ allSortField: field })
      } else if (selectedGroupId === null) {
        // Save to settings for "Ungrouped" view
        await updateSettings({ ungroupedSortField: field })
      } else {
        // Save to group settings
        await fetch(`/api/groups/${selectedGroupId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sortField: field })
        })
        mutateGroups() // Refresh groups data
      }
    } catch (error) {
      console.error('Failed to save sort field:', error)
    }
  }

  const handleSortDirectionChange = async (direction: 'asc' | 'desc') => {
    setSortDirection(direction)

    try {
      if (selectedGroupId === undefined) {
        // Save to settings for "All Items" view
        await updateSettings({ allSortDirection: direction })
      } else if (selectedGroupId === null) {
        // Save to settings for "Ungrouped" view
        await updateSettings({ ungroupedSortDirection: direction })
      } else {
        // Save to group settings
        await fetch(`/api/groups/${selectedGroupId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sortDirection: direction })
        })
        mutateGroups() // Refresh groups data
      }
    } catch (error) {
      console.error('Failed to save sort direction:', error)
    }
  }

  // Update useEffect to sync sort settings when group changes
  useEffect(() => {
    if (selectedGroupId === undefined) {
      setSortDirection(settings?.allSortDirection || 'asc')
      setSortField(settings?.allSortField || 'order')
    } else if (selectedGroupId === null) {
      setSortDirection(settings?.ungroupedSortDirection || 'asc')
      setSortField(settings?.ungroupedSortField || 'order')
    } else if (currentGroup) {
      setSortDirection(currentGroup.sortDirection || 'asc')
      setSortField(currentGroup.sortField || 'order')
    }
  }, [selectedGroupId, currentGroup, settings])

  // Add this helper function near the other helpers
  const getNextSortField = (current: typeof sortField) => {
    const fields: typeof sortField[] = ['order', 'createdAt', 'updatedAt', 'dueAt']
    const currentIndex = fields.indexOf(current)
    return fields[(currentIndex + 1) % fields.length]
  }

  // Add a check for private group with hidden content
  const isPrivateGroupHidden = currentGroup?.isPrivate && !settings?.showPrivateGroups

  return (
    <div className="flex-1 flex flex-col">
      <div className="no-print">
        <Header />
      </div>

      {/* Floating Due Items Container */}
      <div className="no-print">
      <FloatingDueItems 
      items={allItems || []}
      settings={settings}
      onItemClick={(item) => {
        setEditingItem(item)
        setIsItemModalOpen(true)
      }}
      mutateItems={mutateAllItems} // Pass SWR's mutate function
      />
      </div>

      <div className="flex-1 flex overflow-hidden">
      <div className="flex no-print">
        <Sidebar
          selectedGroupId={selectedGroupId}
          onGroupSelect={handleGroupSelect}
          searchQuery={searchQuery}
          onSearch={handleSearch}
          isAnyDragging={isAnyDragging}
          onDragStateChange={handleDragStateChange}
        />
        </div>

        <main className="flex-1 overflow-auto bg-white dark:bg-gray-800">
          <div className="relative">
            <div className="absolute inset-0 bg-top bg-repeat-x pointer-events-none
            bg-[url('/images/dropshadow-light.png')] dark:bg-[url('/images/dropshadow-dark.png')] " />
            <div className="relative p-5">
              <div className="container mx-auto">


                {/* Featured Quote */}
                {featuredQuote && (
                  <div className="mb-8 no-print">
                    <div className="relative flex flex-col gap-1 text-gray-500 dark:text-gray-400">
                      <div className="flex items-center gap-3">
                        <span className="font-figtree font-medium text-base
                        line-clamp-2 overflow-hidden text-ellipsis"
                        >
                          {featuredQuote.quote}
                        </span>
                      </div>
                      <div className="ml-6 text-gray-400 dark:text-gray-500 italic font-figtree text-sm">
                        — {featuredQuote.thinker}
                      </div>
                    </div>
                  </div>
                )}

                {/* Timestamp Bar with Group Name */}
                <div className="mb-1 px-2 py-0 text-xs flex items-center justify-between gap-2">
                  {/* Left side - Group Name */}
                  <div className="text-gray-700 dark:text-gray-300 font-medium">
                    {selectedGroupId !== undefined && selectedGroupId !== null ? (
                      currentGroup?.name
                    ) : (
                      selectedGroupId === null ? t('ungrouped') : t('allItems')
                    )}
                  </div>

                  {/* Right side - Timestamp */}
                  <div className="text-gray-500 dark:text-gray-400 flex items-center gap-2">
                    {selectedGroupId !== undefined && selectedGroupId !== null ? (
                      <>
                        <span className="font-medium">{t('updatedOn')}</span>
                        <span>
                          {currentGroup?.updatedAt 
                            ? new Date(currentGroup.updatedAt).toLocaleString()
                            : t('never')
                          }
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="font-medium invisible">{t('updatedOn')}</span>
                        <span className="invisible">{t('notAvailable')}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Controls Bar */}
                <div className="no-print mb-4 p-1.5 flex items-center justify-between gap-4 bg-gray-200/30 
                dark:bg-gray-900/50 border border-gray-200/50 dark:border-gray-600/50 rounded-lg
                max-h-[52px] overflow-y-none no-print">
                  
                  {/* Left side - View Mode Controls */}
                  <div className="flex items-center gap-1">
                    {/* View Mode Buttons */}
                    <div className="bg-gray-200 flex items-center gap-0 rounded-md p-0.5 bg-gray-200 
                    dark:bg-gray-600 border border-gray-400/35 dark:border-gray-500
                    max-h-[42px] overflow-y-none py-1">
                      {/* Grid View */}
                      <button
                        onClick={() => handleViewModeChange('grid')}
                        disabled={isPrivateGroupHidden}
                        className={`
                          flex items-center justify-center w-8 rounded-md
                          ml-0.5 p-1
                          ${viewMode === 'grid' 
                            ? 'bg-white dark:bg-gray-400 text-blue-600 dark:text-blue-200' 
                            : isPrivateGroupHidden
                              ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                              : 'text-gray-500 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-500'
                          }
                        `}
                        title={isPrivateGroupHidden ? t('privateGroupHidden') : t('gridView')}
                      >
                        <box-icon type="solid" name="grid-alt" size="1.1rem"></box-icon>
                      </button>

                      {/* List View */}
                      <button
                        onClick={() => handleViewModeChange('list')}
                        disabled={isPrivateGroupHidden}
                        className={`
                          flex items-center justify-center w-8 rounded-md
                          m-0 p-2 pb-1 pt-1
                          ${viewMode === 'list' 
                            ? 'bg-white dark:bg-gray-400 text-blue-600 dark:text-blue-200' 
                            : isPrivateGroupHidden
                              ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                              : 'text-gray-500 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-500'
                          }
                        `}
                        title={isPrivateGroupHidden ? t('privateGroupHidden') : t('listView')}
                      >
                        <box-icon name="list-ul" size="1.1rem"></box-icon>
                      </button>

                      {/* Expanded View */}
                      <button
                        onClick={() => handleViewModeChange('expanded')}
                        disabled={isPrivateGroupHidden}
                        className={`
                          flex items-center justify-center w-8 rounded-md
                          p-2 py-1
                          ${viewMode === 'expanded' 
                            ? 'bg-white dark:bg-gray-400 text-blue-600 dark:text-blue-200' 
                            : isPrivateGroupHidden
                              ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                              : 'text-gray-500 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-500'
                          }
                        `}
                        title={isPrivateGroupHidden ? t('privateGroupHidden') : t('expandedView')}
                      >
                        <box-icon name="expand-alt" size="1.1rem"></box-icon>
                      </button>

                      {/* Print View */}
                      <button
                        onClick={() => handleViewModeChange('print')}
                        disabled={isPrivateGroupHidden}
                        className={`
                          flex items-center justify-center w-8 rounded-md
                          mr-0.5 p-1
                          ${viewMode === 'print' 
                            ? 'bg-white dark:bg-gray-400 text-blue-600 dark:text-blue-200' 
                            : isPrivateGroupHidden
                              ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                              : 'text-gray-500 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-500'
                          }
                        `}
                        title={isPrivateGroupHidden ? t('privateGroupHidden') : t('printView')}
                      >
                        <box-icon name="printer" type="solid" size="1.1rem"></box-icon>
                      </button>

                    </div>

                    {/* Sort by User/Date Created/Date Updated/Due Date */}
                    <div className="bg-gray-200 flex items-center gap-0 py-0.5 px-1 rounded-md 
                    bg-gray-200 dark:bg-gray-600 border border-gray-400/35 dark:border-gray-500
                     max-h-[42px] overflow-y-none py-0">
                      <div className="flex items-center gap-1 max-h-[42px] leading-snug pb-0.5">
                        <button
                          onClick={() => handleSortFieldChange(getNextSortField(sortField))}
                          disabled={isPrivateGroupHidden}
                          className={`flex items-center gap-0 text-sm
                            ${isPrivateGroupHidden 
                              ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                              : 'text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-200'
                            } transition-colors pl-1 leading-none`}
                          title={isPrivateGroupHidden ? t('privateGroupHidden') : t('toggleSortField')}
                        >
                          {(sortField === 'order' ? t('userSort') :
                           sortField === 'createdAt' ? t('dateCreated') : 
                           sortField === 'updatedAt' ? t('dateUpdated') : 
                           t('dueDate')) + ':'}
                        </button>

                        <div className="flex items-center gap-0.5 max-h-[31px]">
                          {/* Sort Ascending Button */}
                          <button 
                            onClick={() => handleSortDirectionChange('asc')}
                            disabled={isPrivateGroupHidden}
                            className={`p-1 rounded transition-colors ${
                              sortDirection === 'asc'
                                ? 'bg-white dark:bg-gray-400 text-blue-600 dark:text-blue-200 pb-0 h-7'
                                : isPrivateGroupHidden
                                  ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed pb-0 h-7'
                                  : 'text-gray-500 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-300 pb-0 h-7'
                            }`}
                            title={isPrivateGroupHidden ? t('privateGroupHidden') : 
                              sortField === 'dueAt' ? "Show Earlier Items First" : "Sort Ascending"}
                          >
                            <box-icon name="sort-up" size="1.1rem"></box-icon>
                          </button>

                          {/* Sort Descending Button */}
                          <button 
                            onClick={() => handleSortDirectionChange('desc')}
                            disabled={isPrivateGroupHidden}
                            className={`p-1 rounded transition-colors ${
                              sortDirection === 'desc'
                                ? 'bg-white dark:bg-gray-400 text-blue-600 dark:text-blue-200 pb-0 h-7'
                                : isPrivateGroupHidden
                                  ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed pb-0 h-7'
                                  : 'text-gray-500 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-500 pb-0 h-7'
                            }`}
                            title={isPrivateGroupHidden ? t('privateGroupHidden') :
                              sortField === 'dueAt' ? "Show Later Items First" : "Sort Descending"}
                          >
                            <box-icon name="sort-down" size="1.1rem"></box-icon>
                          </button>
                        </div>
                      </div>

                      {/* Show/Hide Details Button */}
                      <button
                        onClick={() => setShowFooter(prev => !prev)}
                        disabled={isPrivateGroupHidden}
                        className={`
                          w-7 h-7 ml-1 rounded-md
                          flex items-center justify-center
                          ${showFooter 
                            ? 'bg-white dark:bg-gray-400 text-blue-600 dark:text-blue-200' 
                            : isPrivateGroupHidden
                              ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                              : 'text-gray-500 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-500'
                          }
                          transition-colors
                        `}
                        title={isPrivateGroupHidden ? t('privateGroupHidden') : (showFooter ? t('hideDetails') : t('showDetails'))}
                      >
                        <box-icon name="info-circle" size="1.1rem" />
                      </button>

                    </div>
                  </div>

                  {/* Center - Status Filters */}
                  <div className="flex items-center gap-1">
                    {(['gray', 'red', 'yellow', 'green', 'blue', 'purple'] as Status[]).map(status => (
                      <button
                        key={status}
                        onClick={() => toggleStatus(status)}
                        disabled={isPrivateGroupHidden}
                        className={`w-6 h-5 rounded-md transition-all duration-200
                          ${selectedStatuses.has(status) 
                            ? 'ring-2 ring-offset-2 ring-blue-500 scale-110' 
                            : isPrivateGroupHidden
                              ? 'opacity-25 cursor-not-allowed'
                              : 'opacity-50 hover:opacity-100 hover:scale-105'
                          }
                          bg-${status}-500`}
                        aria-label={isPrivateGroupHidden ? t('privateGroupHidden') : 
                          t(`filter${status.charAt(0).toUpperCase() + status.slice(1)}`)}
                        title={isPrivateGroupHidden ? t('privateGroupHidden') : 
                          t(`filter${status.charAt(0).toUpperCase() + status.slice(1)}`)}
                      />
                    ))}
                  </div>

                  {/* Right - Add Item Button */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleAddItem}
                      className="ml-auto max-h-[36px] min-h-[36px] overflow-y-none pl-3 pr-4 bg-blue-500 
                      text-white rounded-md hover:bg-blue-600 transition-colors pt-0.5 pb-1 leading-none"
                    >
                      + {t('item')}
                    </button>
                  </div>
                </div>

                {currentGroup?.isPrivate && !settings?.showPrivateGroups ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
                    {[...Array(3)].map((_, i) => (
                      <div 
                        key={i} 
                        className="bg-gray-200 dark:bg-gray-600 rounded-lg p-4 opacity-50"
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-8 h-8 bg-gray-400 dark:bg-gray-700 rounded-lg" />
                          <div className="flex-1">
                            <div className="h-4 bg-gray-400 dark:bg-gray-700 rounded w-3/4" />
                            <div className="h-3 bg-gray-400 dark:bg-gray-700 rounded w-1/2 mt-2" />
                          </div>
                        </div>
                        <div className="h-12 bg-gray-400 dark:bg-gray-700 rounded mt-3" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <DragDropContextWrapper
                    onDragEnd={handleDragEnd}
                    onDragStart={() => setIsAnyDragging(true)}
                  >
                    <div className={viewMode === 'list' ? 'space-y-0' : ''}>
                      <Droppable droppableId="items">
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            className={`
                              ${viewMode === 'list' 
                                ? 'space-y-0'
                                : viewMode === 'expanded'
                                  ? 'grid grid-cols-1 sm:grid-cols-2 gap-2'
                                  : viewMode === 'print'
                                    ? 'max-w-4xl space-y-2 p-2 text-gray-400 dark:text-gray-500'
                                    : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2'
                                }
                            `}
                          >
                            {filteredAndSortedItems?.map((item, index) => (
                              <Draggable
                                key={item.id}
                                draggableId={`item-${item.id}`}
                                index={index}
                                isDragDisabled={isAnyDragging}
                              >
                                {(provided, snapshot) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    className={`transition-opacity duration-200 ${
                                      deletingItems.has(item.id as number) ? 'opacity-0' : 'opacity-100'
                                    }`}
                                  >
                                    <Card
                                      item={item}
                                      onDelete={() => handleDeleteItem(item.id as number)}
                                      onEdit={() => {
                                        setEditingItem(item as Item)
                                        setIsItemModalOpen(true)
                                      }}
                                      isDragging={snapshot.isDragging}
                                      isDeleting={deletingItems.has(item.id as number)}
                                      isPlaceholder={Boolean(item.isPlaceholder)}
                                      viewMode={viewMode}
                                      showFooter={showFooter}
                                    />
                                  </div>
                                )}
                              </Draggable>
                            ))}
                            {provided.placeholder}
                          </div>
                        )}
                      </Droppable>
                    </div>
                  </DragDropContextWrapper>
                )}

                {/* Item Creation/Edit Modal */}
                {isItemModalOpen && (
                  <Modal 
                    isOpen={isItemModalOpen}
                    title={editingItem ? t('editItem') : t('createNewItem')}
                    onClose={() => {
                      debugStore.log('Closing item modal', {
                        type: 'MODAL_CLOSE',
                        data: { timestamp: new Date().toISOString() }
                      })
                      setIsItemModalOpen(false)
                      setEditingItem(null)
                    }}
                  >
                    <ItemForm
                      editItem={editingItem}
                      defaultGroupId={selectedGroupId || undefined}
                      onClose={() => {
                        setIsItemModalOpen(false)
                        setEditingItem(null)
                        mutate() // Refresh items list after form closes
                      }}
                      mutate={mutate}
                    />
                  </Modal>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
} 