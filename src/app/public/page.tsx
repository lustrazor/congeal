'use client'
import { useState, useEffect, useCallback, useMemo } from 'react'
import Card from '@/components/CardPublic'
import Sidebar from '@/components/SidebarPublic'
import Header from '@/components/HeaderPublic'
import FloatingDueItems from '@/components/FloatingDueItemsPublic'
import 'boxicons/css/boxicons.min.css'
import { useItems } from '@/hooks/useItems'
import { useGroups } from '@/hooks/useGroups'
import { useSettings } from '@/hooks/useSettings'
import { Status } from '@/types'
import { useTranslations } from '@/hooks/useTranslations'
import { useRouter } from 'next/navigation'

export default function PublicPage() {
  const { t } = useTranslations()
  const { groups } = useGroups()
  const { items } = useItems()
  const { settings, mutate } = useSettings()
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedGroupId, setSelectedGroupId] = useState<number | null | undefined>(undefined)
  
  // Initialize view mode from localStorage with group-specific keys
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'expanded' | 'print'>(() => {
    if (typeof window === 'undefined') return settings?.allViewMode || 'grid'
    const key = `publicViewMode_${selectedGroupId ?? 'all'}`
    return localStorage.getItem(key) as 'grid' | 'list' | 'expanded' || 
           settings?.allViewMode || 
           'grid'
  })

  // Initialize sort settings from localStorage with group-specific keys
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>(() => {
    if (typeof window === 'undefined') return settings?.allSortDirection || 'asc'
    const key = `publicSortDirection_${selectedGroupId ?? 'all'}`
    return localStorage.getItem(key) as 'asc' | 'desc' || 
           settings?.allSortDirection || 
           'asc'
  })

  const [sortField, setSortField] = useState<'order' | 'createdAt' | 'updatedAt' | 'dueAt'>(() => {
    if (typeof window === 'undefined') return settings?.allSortField || 'order'
    const key = `publicSortField_${selectedGroupId ?? 'all'}`
    return localStorage.getItem(key) as 'order' | 'createdAt' | 'updatedAt' | 'dueAt' || 
           settings?.allSortField || 
           'order'
  })

  // Initialize showFooter from localStorage
  const [showFooter, setShowFooter] = useState(() => {
    if (typeof window === 'undefined') return false
    return localStorage.getItem('publicShowFooter') === 'true'
  })

  // Initialize selectedStatuses from localStorage
  const [selectedStatuses, setSelectedStatuses] = useState<Set<Status>>(() => {
    if (typeof window === 'undefined') return new Set()
    const saved = localStorage.getItem('publicSelectedStatuses')
    return saved ? new Set(JSON.parse(saved)) : new Set()
  })

  const [featuredQuote, setFeaturedQuote] = useState<{ quote: string; thinker: string } | null>(null)
  const [currentQuoteId, setCurrentQuoteId] = useState<number | null>(null)

  // Redirect if public access is disabled
  useEffect(() => {
    if (settings && !settings.isPublic) {
      router.push('/denied')
    }
  }, [settings?.isPublic, router])

  // Subscribe to settings changes
  useEffect(() => {
    const subscription = async () => {
      try {
        const response = await fetch('/api/settings')
        if (response.ok) {
          const data = await response.json()
          mutate(data)
        }
      } catch (error) {
        console.error('Failed to check settings:', error)
      }
    }

    // Set up event source for real-time updates
    const eventSource = new EventSource('/api/settings/subscribe')
    eventSource.onmessage = () => {
      subscription()
    }

    return () => {
      eventSource.close()
    }
  }, [mutate])

  // Update view mode and sort settings when group selection changes
  useEffect(() => {
    if (selectedGroupId === undefined) {
      setViewMode(settings?.allViewMode || 'grid')
      setSortDirection(settings?.allSortDirection || 'asc')
      setSortField(settings?.allSortField || 'order')
    } else if (selectedGroupId === null) {
      setViewMode(settings?.ungroupedViewMode || 'grid')
      setSortDirection(settings?.ungroupedSortDirection || 'asc')
      setSortField(settings?.ungroupedSortField || 'order')
    } else {
      const group = groups?.find(g => g.id === selectedGroupId)
      setViewMode(group?.viewMode || 'grid')
      setSortDirection(group?.sortDirection || 'asc')
      setSortField(group?.sortField || 'order')
    }
  }, [selectedGroupId, settings, groups])

  // Quote fetching effect
  useEffect(() => {
    const fetchQuote = async (isInitial: boolean = false) => {
      try {
        const timestamp = new Date().getTime()
        const endpoint = isInitial 
          ? `/api/quotes/random?t=${timestamp}` 
          : `/api/quotes/next/${currentQuoteId}?t=${timestamp}`
        
        const response = await fetch(endpoint, {
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache'
          }
        })
        
        if (response.ok) {
          const data = await response.json()
          setFeaturedQuote(data)
          setCurrentQuoteId(data.id)
        }
      } catch (error) {
        console.error('Failed to fetch quote:', error)
      }
    }

    if (!currentQuoteId) {
      fetchQuote(true)
    }

    const intervalId = setInterval(() => {
      if (currentQuoteId) {
        fetchQuote(false)
      }
    }, 1 * 60 * 500)

    return () => clearInterval(intervalId)
  }, [currentQuoteId])

  // Update handlers to use group-specific keys
  const handleViewModeChange = (mode: 'grid' | 'list' | 'expanded') => {
    setViewMode(mode)
    const key = `publicViewMode_${selectedGroupId ?? 'all'}`
    localStorage.setItem(key, mode)
  }

  const handleSortDirectionChange = (direction: 'asc' | 'desc') => {
    setSortDirection(direction)
    const key = `publicSortDirection_${selectedGroupId ?? 'all'}`
    localStorage.setItem(key, direction)
  }

  const handleSortFieldChange = (field: 'order' | 'createdAt' | 'updatedAt' | 'dueAt') => {
    setSortField(field)
    const key = `publicSortField_${selectedGroupId ?? 'all'}`
    localStorage.setItem(key, field)
  }

  const handleShowFooterChange = (show: boolean) => {
    setShowFooter(show)
    localStorage.setItem('publicShowFooter', String(show))
  }

  const getNextSortField = (current: string) => {
    const fields = ['order', 'createdAt', 'updatedAt', 'dueAt']
    const currentIndex = fields.indexOf(current)
    return fields[(currentIndex + 1) % fields.length] as 'order' | 'createdAt' | 'updatedAt' | 'dueAt'
  }

  const toggleStatus = (status: Status) => {
    setSelectedStatuses(prev => {
      const next = new Set(prev)
      if (next.has(status)) {
        next.delete(status)
      } else {
        next.add(status)
      }
      // Save to localStorage
      localStorage.setItem('publicSelectedStatuses', JSON.stringify([...next]))
      return next
    })
  }

  // Update the filteredAndSortedItems to include group filtering
  const filteredAndSortedItems = useMemo(() => {
    if (!items) return []

    let filtered = items.filter(item => {
      // Filter by group first
      if (selectedGroupId === undefined) {
        // Show all items except those in private groups
        if (!item.groupId) return true // Show ungrouped items
        const group = groups?.find(g => g.id === item.groupId)
        return !group?.isPrivate // Show if group is not private
      } else if (selectedGroupId === null) {
        // Show only ungrouped items
        return !item.groupId
      } else {
        // Show items from selected group
        return item.groupId === selectedGroupId
      }
    }).filter(item => {
      // Filter by search
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase()
        if (!item.name.toLowerCase().includes(searchLower) &&
            !item.description?.toLowerCase().includes(searchLower)) {
          return false
        }
      }

      // Filter by status
      if (selectedStatuses.size > 0 && !selectedStatuses.has(item.status)) {
        return false
      }

      return true
    })

    // Sort items
    return filtered.sort((a, b) => {
      const aValue = a[sortField]
      const bValue = b[sortField]
      
      if (aValue === null) return 1
      if (bValue === null) return -1
      if (aValue === bValue) return 0
      
      const comparison = aValue < bValue ? -1 : 1
      return sortDirection === 'asc' ? comparison : -comparison
    })
  }, [items, selectedGroupId, groups, searchQuery, selectedStatuses, sortField, sortDirection])

  const currentGroup = useMemo(() => {
    if (selectedGroupId === undefined || selectedGroupId === null) return null
    return groups?.find(g => g.id === selectedGroupId)
  }, [selectedGroupId, groups])

  // Update effect to load group-specific preferences with better fallbacks
  useEffect(() => {
    const viewModeKey = `publicViewMode_${selectedGroupId ?? 'all'}`
    const sortDirectionKey = `publicSortDirection_${selectedGroupId ?? 'all'}`
    const sortFieldKey = `publicSortField_${selectedGroupId ?? 'all'}`

    const savedViewMode = localStorage.getItem(viewModeKey)
    const savedSortDirection = localStorage.getItem(sortDirectionKey)
    const savedSortField = localStorage.getItem(sortFieldKey)

    if (selectedGroupId === undefined) {
      // All items view - fall back to settings.allViewMode
      setViewMode(savedViewMode as 'grid' | 'list' | 'expanded' || settings?.allViewMode || 'grid')
      setSortDirection(savedSortDirection as 'asc' | 'desc' || settings?.allSortDirection || 'asc')
      setSortField(savedSortField as 'order' | 'createdAt' | 'updatedAt' | 'dueAt' || settings?.allSortField || 'order')
    } else if (selectedGroupId === null) {
      // Ungrouped view - fall back to settings.ungroupedViewMode
      setViewMode(savedViewMode as 'grid' | 'list' | 'expanded' || settings?.ungroupedViewMode || 'grid')
      setSortDirection(savedSortDirection as 'asc' | 'desc' || settings?.ungroupedSortDirection || 'asc')
      setSortField(savedSortField as 'order' | 'createdAt' | 'updatedAt' | 'dueAt' || settings?.ungroupedSortField || 'order')
    } else {
      // Group view - fall back to group settings
      const group = groups?.find(g => g.id === selectedGroupId)
      setViewMode(savedViewMode as 'grid' | 'list' | 'expanded' || group?.viewMode || 'grid')
      setSortDirection(savedSortDirection as 'asc' | 'desc' || group?.sortDirection || 'asc')
      setSortField(savedSortField as 'order' | 'createdAt' | 'updatedAt' | 'dueAt' || group?.sortField || 'order')
    }
  }, [selectedGroupId, settings, groups])

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="no-print">
        <Header />
      </div>

      
      <div className="flex flex-1 overflow-hidden">
      <div className="no-print">
        <Sidebar
          selectedGroupId={selectedGroupId}
          onGroupSelect={setSelectedGroupId}
          searchQuery={searchQuery}
          onSearch={setSearchQuery}
        />
        </div>

        <main className="flex-1 overflow-auto bg-white dark:bg-gray-800">
          <div className="relative">
            <div className="absolute inset-0 bg-[url('/images/dropshadow-light.png')] dark:bg-[url('/images/dropshadow-dark.png')] 
              bg-top bg-repeat-x pointer-events-none" />
            <div className="relative p-5">
              <div className="container mx-auto">


                {/* Featured Quote */}
                {featuredQuote && (
                  <div className="mb-8 no-print">
                    <div className="relative flex flex-col gap-1 text-gray-500 dark:text-gray-400">
                      <div className="flex items-center gap-3">
                        <span className="font-figtree font-medium text-base
                        line-clamp-2 overflow-hidden text-ellipsis" >
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
                <div className="mb-4 p-1.5 flex items-center justify-between gap-4 bg-gray-200/30 
                dark:bg-gray-900/50 border border-gray-200/50 dark:border-gray-600/50 rounded-lg
                max-h-[52px] overflow-y-none no-print ">

                  {/* Left side - View Mode Controls */}
                  <div className="flex items-center gap-1">
                    {/* View Mode Buttons */}
                    <div className="bg-gray-200 flex items-center gap-0 py-0.5 px-1 rounded-md 
                    bg-gray-200 dark:bg-gray-600 border border-gray-400/35 dark:border-gray-500
                     max-h-[42px] overflow-y-none py-1">
                      {/* Grid View - Compact 3/4 column layout */}
                      <button
                        onClick={() => handleViewModeChange('grid')}
                        className={`
                          flex items-center justify-center w-8 rounded-md
                          ml-0.5 p-1
                          ${viewMode === 'grid' 
                            ? 'bg-white dark:bg-gray-400 text-blue-600 dark:text-blue-200' 
                            : 'text-gray-500 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-500'
                          }
                        `}
                        title={t('gridView')} >
                        <box-icon type="solid" name="grid-alt" size="1.1rem"></box-icon>
                      </button>

                      {/* List View - Single column with more details */}
                      <button
                        onClick={() => handleViewModeChange('list')}
                        className={`
                          flex items-center justify-center w-8 rounded-md
                          m-0 p-2 py-1
                          ${viewMode === 'list' 
                            ? 'bg-white dark:bg-gray-400 text-blue-600 dark:text-blue-200' 
                            : 'text-gray-500 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-500'
                          }
                        `}
                        title={t('listView')} >
                        <box-icon name="list-ul" size="1.1rem"></box-icon>
                      </button>

                      {/* Expanded View - Two-column layout with larger cards */}
                      <button
                        onClick={() => handleViewModeChange('expanded')}
                        className={`
                          flex items-center justify-center w-8 rounded-md
                          p-2 pb-1 pt-1
                          ${viewMode === 'expanded' 
                            ? 'bg-white dark:bg-gray-400 text-blue-600 dark:text-blue-200' 
                            : 'text-gray-500 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-500'
                          }
                        `}
                        title={t('expandedView')} >
                        <box-icon name="expand-alt" size="1.1rem"></box-icon>
                      </button>

                        {/* Print View */}
                        <button
                          onClick={() => handleViewModeChange('print')}
                          className={`
                            flex items-center justify-center w-8 rounded-md
                            mr-0.5 p-1
                            ${viewMode === 'print' 
                              ? 'bg-white dark:bg-gray-400 text-blue-600 dark:text-blue-200' 
                              : 'text-gray-500 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-500'
                            }
                          `}
                          title={t('printView')}
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
                          className="flex items-center gap-0 text-sm text-gray-600 dark:text-gray-300 
                            hover:text-blue-600 dark:hover:text-blue-200 transition-colors pl-1 leading-none"
                          title={t('toggleSortField')} >
                          {(sortField === 'order' ? t('userSort') :
                           sortField === 'createdAt' ? t('dateCreated') : 
                           sortField === 'updatedAt' ? t('dateUpdated') : 
                           t('dueDate')) + ':'}
                        </button>

                        <div className="flex items-center gap-0.5 max-h-[31px]">
                          {/* Sort Ascending Button */}
                          <button 
                            onClick={() => handleSortDirectionChange('asc')}
                            className={`p-1 rounded transition-colors ${
                              sortDirection === 'asc'
                                ? 'bg-white dark:bg-gray-400 text-blue-600 dark:text-blue-200 pb-0 h-7'
                                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-300 pb-0 h-7'
                            }`}
                            title={sortField === 'dueAt' ? "Show Earlier Items First" : "Sort Ascending"} >
                            <box-icon name="sort-up" size="1.1rem"></box-icon>
                          </button>
                          
                          {/* Sort Descending Button */}
                          <button 
                            onClick={() => handleSortDirectionChange('desc')}
                            className={`p-1 rounded transition-colors ${
                              sortDirection === 'desc'
                                ? 'bg-white dark:bg-gray-400 text-blue-600 dark:text-blue-200 pb-0 h-7'
                                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-500 pb-0 h-7'
                            }`}
                            title={sortField === 'dueAt' ? "Show Later Items First" : "Sort Descending"} >
                            <box-icon name="sort-down" size="1.1rem"></box-icon>
                          </button>
                        </div>
                      </div>

                    {/* Show/Hide Details Button */}
                    <button
                      onClick={() => handleShowFooterChange(!showFooter)}
                      className={`
                        w-7 h-7 ml-1 rounded-md
                        flex items-center justify-center
                        ${showFooter 
                          ? 'bg-white dark:bg-gray-400 text-blue-600 dark:text-blue-200' 
                          : 'text-gray-500 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-500'
                        }
                        transition-colors
                      `}
                      title={showFooter ? "Hide Details" : "Show Details"} >
                      <box-icon name="info-circle" size="20px" />
                    </button>
                    </div>

                  {/* Center - Status Filters */}
                  <div className="flex items-center gap-1 ml-6">
                  {(['gray', 'red', 'yellow', 'green', 'blue', 'purple'] as Status[]).map(status => (
                      <button
                        key={status}
                        onClick={() => toggleStatus(status)}
                        className={`w-6 h-5 rounded-md transition-all duration-200
                          ${selectedStatuses.has(status) 
                            ? 'ring-2 ring-offset-2 ring-blue-500 scale-110' 
                            : 'opacity-50 hover:opacity-100 hover:scale-105'
                          }
                          bg-${status}-500`}
                        aria-label={t(`filter${status.charAt(0).toUpperCase() + status.slice(1)}`)}
                        title={t(`filter${status.charAt(0).toUpperCase() + status.slice(1)}`)}
                   />
                    ))}
                  </div>
                  </div>
                </div>


                {/* Items Grid */}
                <div className={`
                  ${viewMode === 'list' 
                    ? 'space-y-2'
                    : viewMode === 'expanded'
                      ? 'grid grid-cols-1 sm:grid-cols-2 gap-2'
                      : viewMode === 'print'
                          ? 'max-w-4xl space-y-2 p-2 text-gray-400 dark:text-gray-500'
                          : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2'
                  }
                `}>
                  {filteredAndSortedItems.map((item) => (
                    <Card
                      key={item.id}
                      item={item}
                      viewMode={viewMode}
                      showFooter={showFooter}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
      <div className="flex no-print">
      <FloatingDueItems 
        items={items || []}
        settings={settings}
      />
      </div>
    </div>
  )
}
