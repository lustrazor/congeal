'use client'
import React, { useState, useEffect, useMemo } from 'react'
import useSWR from 'swr'
import { useDebugStore } from '@/stores/debugStore'
import Header from '@/components/Header'
import { useTranslations } from '@/hooks/useTranslations'
import FloatingDueItems from '@/components/FloatingDueItems'
import { useSettings } from '@/hooks/useSettings'
import { Item } from '@/types'

interface Quote {
  id: number
  quote: string
  thinker: string
  createdAt: string
}

interface Note {
  id: number
  title: string
  content: string
  tags: string
  createdAt: string
  updatedAt: string
}

type PageSize = 10 | 20 | 50 | 100
type ViewMode = 'notes' | 'quotes'

const fetcher = (url: string) => fetch(url).then(res => res.json())

const parseTags = (tags: string | string[]): string[] => {
  if (Array.isArray(tags)) return tags
  return tags ? tags.split(',').map(tag => tag.trim()).filter(Boolean) : []
}

const generatePageNumbers = (currentPage: number, totalPages: number) => {
  const delta = 2
  const range = []
  const rangeWithDots = []
  let l: number

  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= currentPage - delta && i <= currentPage + delta)) {
      range.push(i)
    }
  }

  for (let i of range) {
    if (l) {
      if (i - l === 2) {
        rangeWithDots.push(l + 1)
      } else if (i - l !== 1) {
        rangeWithDots.push('...')
      }
    }
    rangeWithDots.push(i)
    l = i
  }

  return rangeWithDots
}

const getDisplayRange = (currentPage: number, pageSize: number, totalItems: number) => {
  const start = ((currentPage - 1) * pageSize) + 1
  const end = Math.min(currentPage * pageSize, totalItems)
  return { start, end }
}

export default function QuotesPage() {
  const { t } = useTranslations()
  const { settings } = useSettings()
  const [newQuote, setNewQuote] = useState('')
  const [thinker, setThinker] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<SortOption>('newest')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState<PageSize>(10)
  const { data: quotes, mutate } = useSWR<Quote[]>('/api/quotes', fetcher)
  const debugStore = useDebugStore()
  const [editingQuote, setEditingQuote] = useState<Quote | null>(null)
  const [isFormExpanded, setIsFormExpanded] = useState(false)
  const { data: allQuotes } = useSWR<Quote[]>('/api/quotes', fetcher)
  const { data: dueItems } = useSWR<Item[]>('/api/items', fetcher)
  const [viewMode, setViewMode] = useState<ViewMode>('notes')
  const { data: notes, mutate: mutateNotes } = useSWR<Note[]>('/api/notes', fetcher)
  const [newNote, setNewNote] = useState('')
  const [editingNote, setEditingNote] = useState<Note | null>(null)
  const [newNoteTitle, setNewNoteTitle] = useState('')
  const [newNoteTags, setNewNoteTags] = useState('')
  const [noteSearchQuery, setNoteSearchQuery] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [deletingNoteId, setDeletingNoteId] = useState<number | null>(null)
  const [deletingQuoteId, setDeletingQuoteId] = useState<number | null>(null)
  const [expandedNoteIds, setExpandedNoteIds] = useState<number[]>([])
  const [expandedQuoteIds, setExpandedQuoteIds] = useState<number[]>([])
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest' | 'az'>(() => {
    if (typeof window === 'undefined') return 'newest'
    return (localStorage.getItem('quotesPageSortOrder') as 'newest' | 'oldest' | 'az') || 'newest'
  })
  const [quotesPage, setQuotesPage] = useState(1)
  const [notesPage, setNotesPage] = useState(1)

  useEffect(() => {
    localStorage.setItem('quotesPageSortOrder', sortOrder)
  }, [sortOrder])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (deletingQuoteId !== null) {
        const popover = document.getElementById(`delete-popover-${deletingQuoteId}`)
        if (popover && !popover.contains(event.target as Node)) {
          setDeletingQuoteId(null)
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [deletingQuoteId])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // ESC key handling
      if (e.key === 'Escape') {
        // Close any open popovers first
        if (deletingQuoteId !== null) {
          setDeletingQuoteId(null)
          return
        }
        if (deletingNoteId !== null) {
          setDeletingNoteId(null)
          return
        }

        // Then close any open forms
        if (editingQuote !== null) {
          setEditingQuote(null)
          return
        }
        if (editingNote !== null) {
          setEditingNote(null)
          return
        }
        
        // Finally close the add new form if open
        if (isFormExpanded) {
          setIsFormExpanded(false)
          setNewQuote('')
          setThinker('')
          setNewNoteTitle('')
          setNewNote('')
          setNewNoteTags('')
          return
        }
      }

      // CTRL/CMD + N to add new quote/note
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault() // Prevent browser's new window shortcut
        if (!isFormExpanded) {
          setIsFormExpanded(true)
        }
      }
    }

    // Add event listener
    document.addEventListener('keydown', handleKeyDown)

    // Cleanup
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [
    isFormExpanded, 
    deletingQuoteId, 
    deletingNoteId, 
    editingQuote, 
    editingNote
  ])

  // Add this effect to handle keyboard shortcuts for delete confirmations
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Handle delete confirmation shortcuts
      if (deletingQuoteId !== null) {
        if (e.key === 'Enter') {
          handleQuoteDelete(deletingQuoteId)
          setDeletingQuoteId(null)
        } else if (e.key === 'Escape') {
          setDeletingQuoteId(null)
        }
      }
      
      if (deletingNoteId !== null) {
        if (e.key === 'Enter') {
          handleNoteDelete(deletingNoteId)
          setDeletingNoteId(null)
        } else if (e.key === 'Escape') {
          setDeletingNoteId(null)
        }
      }
    }

    if (deletingQuoteId !== null || deletingNoteId !== null) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [deletingQuoteId, deletingNoteId])

  const getAllTags = (notes: Note[] | undefined): string[] => {
    if (!notes) return []
    const tagSet = new Set<string>()
    notes.forEach(note => {
      const noteTags = parseTags(note.tags)
      noteTags.forEach(tag => tagSet.add(tag))
    })
    return Array.from(tagSet).sort()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    debugStore.log('Quote form submitted', {
      type: 'CREATE_QUOTE',
      data: { 
        quote: newQuote, 
        thinker,
        timestamp: new Date().toISOString()
      }
    })

    try {
      const response = await fetch('/api/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quote: newQuote, thinker })
      })

      if (!response.ok) {
        throw new Error('Failed to create quote')
      }
      
      const data = await response.json()
      
      debugStore.log('Quote created', {
        type: 'QUOTE_CREATED',
        data: {
          quote: data,
          timestamp: new Date().toISOString()
        }
      })

      await mutate()
      setNewQuote('')
      setThinker('')
      setIsFormExpanded(false)
    } catch (error) {
      console.error('Failed to create quote:', error)
      debugStore.log('Failed to create quote', {
        type: 'QUOTE_ERROR',
        error: String(error),
        timestamp: new Date().toISOString()
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = async (quote: Quote) => {
    debugStore.log('Quote edit submitted', {
      type: 'UPDATE_QUOTE',
      data: {
        quote,
        timestamp: new Date().toISOString()
      }
    })

    try {
      const response = await fetch(`/api/quotes/${quote.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(quote)
      })

      if (!response.ok) {
        throw new Error('Failed to update quote')
      }
      
      const data = await response.json()
      
      debugStore.log('Quote updated', {
        type: 'QUOTE_UPDATED',
        data: {
          quote: data,
          timestamp: new Date().toISOString()
        }
      })

      await mutate()
      setEditingQuote(null)
    } catch (error) {
      console.error('Failed to update quote:', error)
      debugStore.log('Failed to update quote', {
        type: 'QUOTE_ERROR',
        error: String(error),
        timestamp: new Date().toISOString()
      })
    }
  }

  const handleDelete = async (id: number) => {
    debugStore.log('Quote delete requested', {
      type: 'DELETE_QUOTE',
      data: {
        id,
        timestamp: new Date().toISOString()
      }
    })

    try {
      const response = await fetch(`/api/quotes/${id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to delete quote')
      }
      
      debugStore.log('Quote deleted', {
        type: 'QUOTE_DELETED',
        data: {
          id,
          timestamp: new Date().toISOString()
        }
      })

      await mutate()
    } catch (error) {
      console.error('Failed to delete quote:', error)
      debugStore.log('Failed to delete quote', {
        type: 'QUOTE_ERROR',
        error: String(error),
        timestamp: new Date().toISOString()
      })
    }
  }

  const handleNoteEdit = async (note: Note) => {
    debugStore.log('Note edit submitted', {
      type: 'UPDATE_NOTE',
      data: {
        note,
        timestamp: new Date().toISOString()
      }
    })

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/notes/${note.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: note.title,
          content: note.content,
          tags: note.tags
        })
      })

      if (!response.ok) throw new Error('Failed to update note')
      
      const data = await response.json()
      
      debugStore.log('Note updated', {
        type: 'NOTE_UPDATED',
        data: {
          note: data,
          timestamp: new Date().toISOString()
        }
      })

      await mutateNotes()
      setEditingNote(null)
    } catch (error) {
      console.error('Failed to update note:', error)
      debugStore.log('Failed to update note', {
        type: 'NOTE_ERROR',
        error: String(error),
        timestamp: new Date().toISOString()
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleNoteDelete = async (id: number) => {
    try {
      const response = await fetch(`/api/notes/${id}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Failed to delete note')
      
      debugStore.log('Note deleted', {
        type: 'NOTE_DELETED',
        data: {
          id,
          timestamp: new Date().toISOString()
        }
      })

      await mutateNotes()
    } catch (error) {
      console.error('Failed to delete note:', error)
      debugStore.log('Failed to delete note', {
        type: 'NOTE_ERROR',
        error: String(error),
        timestamp: new Date().toISOString()
      })
    }
  }

  const handleQuoteDelete = async (id: number) => {
    try {
      const response = await fetch(`/api/quotes/${id}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Failed to delete quote')
      
      debugStore.log('Quote deleted', {
        type: 'QUOTE_DELETED',
        data: {
          id,
          timestamp: new Date().toISOString()
        }
      })

      await mutate()
    } catch (error) {
      console.error('Failed to delete quote:', error)
      debugStore.log('Failed to delete quote', {
        type: 'QUOTE_ERROR',
        error: error instanceof Error ? error.message : 'Unknown error',
        data: { id }
      })
    }
  }

  // Filter and sort quotes
  const filteredQuotes = quotes?.filter(quote => {
    const search = searchQuery.toLowerCase()
    return quote.quote.toLowerCase().includes(search) ||
           quote.thinker.toLowerCase().includes(search)
  })

  // Then sort the filtered quotes
  const sortedQuotes = filteredQuotes?.sort((a, b) => {
    switch (sortOrder) {
      case 'oldest':
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      case 'az':
        return a.quote.localeCompare(b.quote)
      case 'newest':
      default:
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    }
  })

  // Add pagination calculation
  const quotesTotalItems = filteredQuotes?.length || 0
  const quotesTotalPages = Math.ceil(quotesTotalItems / pageSize)
  const quotesStartIndex = (quotesPage - 1) * pageSize
  const quotesEndIndex = quotesStartIndex + pageSize
  const paginatedQuotes = filteredQuotes?.slice(quotesStartIndex, quotesEndIndex)

  const handleNoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    debugStore.log('Note form submitted', {
      type: 'CREATE_NOTE',
      data: { 
        title: newNoteTitle,
        content: newNote,
        tags: newNoteTags,
        timestamp: new Date().toISOString()
      }
    })

    try {
      const response = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          title: newNoteTitle,
          content: newNote,
          tags: newNoteTags
        })
      })

      if (!response.ok) {
        throw new Error('Failed to create note')
      }
      
      const data = await response.json()
      
      debugStore.log('Note created', {
        type: 'NOTE_CREATED',
        data: {
          note: data,
          timestamp: new Date().toISOString()
        }
      })

      await mutateNotes()
      setNewNoteTitle('')
      setNewNote('')
      setNewNoteTags('')
      setIsFormExpanded(false)
    } catch (error) {
      console.error('Failed to create note:', error)
      debugStore.log('Failed to create note', {
        type: 'NOTE_ERROR',
        error: String(error),
        timestamp: new Date().toISOString()
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const filteredNotes = notes?.filter(note => {
    const search = noteSearchQuery.toLowerCase()
    const matchesSearch = note.title.toLowerCase().includes(search) ||
                         note.content.toLowerCase().includes(search)
    
    // Show notes that belong to any selected tag
    const matchesTags = selectedTags.length === 0 || 
                     selectedTags.some(tag => parseTags(note.tags).includes(tag))
    
    return matchesSearch && matchesTags
  })

  const toggleNoteExpansion = (noteId: number) => {
    setExpandedNoteIds(prev => 
      prev.includes(noteId) 
        ? prev.filter(id => id !== noteId)
        : [...prev, noteId]
    )
  }

  const toggleQuoteExpansion = (quoteId: number) => {
    setExpandedQuoteIds(prev => 
      prev.includes(quoteId) 
        ? prev.filter(id => id !== quoteId)
        : [...prev, quoteId]
    )
  }

  const sortedNotes = filteredNotes?.sort((a, b) => {
    switch (sortOrder) {
      case 'oldest':
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      case 'az':
        return a.title.localeCompare(b.title)
      case 'newest':
      default:
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    }
  })

  // Update the notes pagination section similarly
  const notesTotalItems = filteredNotes?.length || 0
  const notesTotalPages = Math.ceil(notesTotalItems / pageSize)
  const notesStartIndex = (notesPage - 1) * pageSize
  const notesEndIndex = notesStartIndex + pageSize
  const paginatedNotes = filteredNotes?.slice(notesStartIndex, notesEndIndex)

  // Reset page numbers when filters change
  useEffect(() => {
    setQuotesPage(1)
  }, [searchQuery, sortOrder])

  useEffect(() => {
    setNotesPage(1)
  }, [noteSearchQuery, selectedTags, sortOrder])

  return (
    <div className="flex-1 flex flex-col">
      <Header />
      <FloatingDueItems 
        items={dueItems || []}
        settings={settings}
        onItemClick={(item) => {
          window.location.href = `/?item=${item.id}`
        }}
      /> 
      <div className="flex-1 overflow-y-auto ">
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 inset-0 bg-[url('/images/dropshadow2-light.png')] dark:bg-[url('/images/dropshadow2-dark.png')] 
              bg-top bg-repeat-x">
          <div className="relative w-full max-w-4xl mx-auto p-6">
            {/* Tabs */}
            <div className="flex gap-1 mb-1 bg-white dark:bg-gray-800 p-1 rounded-lg border border-gray-200 dark:border-gray-700">
            <button
                onClick={() => setViewMode('notes')}
                className={`flex-1 py-2 px-4 rounded-md transition-colors ${
                  viewMode === 'notes'
                    ? 'font-semibold bg-gray-200 dark:bg-gray-900/30 text-gray-600 dark:text-gray-300'
                    : 'font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                {t('notes')}
              </button>
              <button
                onClick={() => setViewMode('quotes')}
                className={`flex-1 py-2 px-4 rounded-md transition-colors ${
                  viewMode === 'quotes'
                    ? 'font-semibold bg-gray-200 dark:bg-gray-900/30 text-gray-600 dark:text-gray-300'
                    : 'font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                {t('quotes')}
              </button>
            </div>

            {/* Content Container */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden mb-6">
              {viewMode === 'quotes' ? (
                // Quotes View
                <>
                  <div className="p-3">
                    <button
                      onClick={() => setIsFormExpanded(!isFormExpanded)}
                      className="w-full font-medium text-left text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                    >
                      {t('addNewQuote')}
                    </button>
                  </div>
                  {isFormExpanded && (
                    <form onSubmit={handleSubmit} className="border-t border-gray-200 dark:border-gray-700 p-4 space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          {t('quote')}
                        </label>
                        <textarea
                          value={newQuote}
                          onChange={(e) => setNewQuote(e.target.value)}
                          className="w-full px-3 py-2 
                            bg-white dark:bg-gray-900
                            border border-gray-300 dark:border-gray-700
                            text-gray-900 dark:text-gray-100
                            placeholder-gray-500 dark:placeholder-gray-400
                            rounded-md focus:ring-1 focus:ring-blue-500
                            focus:border-blue-500"
                          required
                          placeholder={t('quote')}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          {t('thinker')}
                        </label>
                        <input
                          type="text"
                          value={thinker}
                          onChange={(e) => setThinker(e.target.value)}
                          className="w-full px-3 py-2 
                            bg-white dark:bg-gray-900
                            border border-gray-300 dark:border-gray-700
                            text-gray-900 dark:text-gray-100
                            placeholder-gray-500 dark:placeholder-gray-400
                            rounded-md focus:ring-1 focus:ring-blue-500
                            focus:border-blue-500"
                          required
                          placeholder={t('thinker')}
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="px-4 py-2 bg-blue-500 text-white rounded-md 
                          hover:bg-blue-600
                          disabled:opacity-50 disabled:cursor-not-allowed
                          transition-colors"
                      >
                        {isSubmitting ? 'Adding...' : t('addQuote')}
                      </button>
                    </form>
                  )}
                  {/* Quotes List */}
                  <div className="bg-gray-200 dark:bg-gray-700 rounded-lg p-4 pb-6">
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                        {t('quotes')}
                        <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                          ({filteredQuotes?.length || 0} total)
                        </span>
                      </h2>
                    </div>
                    
                    {/* Search Bar */}
                    <div className="mb-1 flex gap-2">
                      {/* Search Input */}
                      <div className="relative flex-1">
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder={t('searchQuotes')}
                          className="w-full px-4 py-2 pl-10
                            bg-white dark:bg-gray-800
                            border border-gray-300 dark:border-gray-600
                            text-gray-900 dark:text-gray-100
                            placeholder-gray-500 dark:placeholder-gray-400
                            rounded-md focus:ring-1 focus:ring-blue-500
                            focus:border-blue-500"
                        />
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <svg 
                            className="h-5 w-5 text-gray-400" 
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                          >
                            <path 
                              strokeLinecap="round" 
                              strokeLinejoin="round" 
                              strokeWidth={2} 
                              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
                            />
                          </svg>
                        </div>
                      </div>

                      {/* Sort Buttons */}
                      <div className="flex rounded-md shadow-sm">
                        <button
                          onClick={() => setSortOrder('newest')}
                          className={`px-3 py-2 text-sm font-medium rounded-l-md border
                            ${sortOrder === 'newest'
                              ? 'bg-blue-50 border-blue-200 text-blue-600 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-400'
                              : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700'
                            }`}
                        >
                          <i className='bx bx-sort-down text-base'></i>
                        </button>
                        <button
                          onClick={() => setSortOrder('oldest')}
                          className={`px-3 py-2 text-sm font-medium border-t border-b
                            ${sortOrder === 'oldest'
                              ? 'bg-blue-50 border-blue-200 text-blue-600 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-400'
                              : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700'
                            }`}
                        >
                          <i className='bx bx-sort-up text-base'></i>
                        </button>
                        <button
                          onClick={() => setSortOrder('az')}
                          className={`px-3 py-2 text-sm font-medium rounded-r-md border
                            ${sortOrder === 'az'
                              ? 'bg-blue-50 border-blue-200 text-blue-600 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-400'
                              : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700'
                            }`}
                        >
                          <i className='bx bx-sort-a-z text-base'></i>
                        </button>
                      </div>

                      {/* Page Size Dropdown */}
                      <select
                        value={pageSize}
                        onChange={(e) => setPageSize(Number(e.target.value) as PageSize)}
                        className="px-3 py-2 text-sm font-medium border rounded-md
                          bg-white dark:bg-gray-800 
                          border-gray-300 dark:border-gray-600
                          text-gray-700 dark:text-gray-300
                          hover:bg-gray-50 dark:hover:bg-gray-700
                          focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="10">10 {t('perPage')}</option>
                        <option value="20">20 {t('perPage')}</option>
                        <option value="50">50 {t('perPage')}</option>
                        <option value="100">100 {t('perPage')}</option>
                      </select>
                    </div>

                    {/* Top Quotes Pagination */}
                    {quotesTotalPages > 1 && (
                      <div className="mb-4 flex items-center justify-between px-4 
                      bg-gray-50/50 dark:bg-gray-800/50 rounded-lg py-2">
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-gray-600 dark:text-gray-400">
                            {getDisplayRange(quotesPage, pageSize, quotesTotalItems).start}-
                            {getDisplayRange(quotesPage, pageSize, quotesTotalItems).end} {t('of')} {quotesTotalItems}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setQuotesPage(prev => Math.max(1, prev - 1))}
                            disabled={quotesPage === 1}
                            className={`px-2 py-1 text-sm rounded-md border bg-gray-50 dark:bg-gray-800
                              ${quotesPage === 1
                                ? 'text-gray-400 dark:text-gray-600 border-gray-200 dark:border-gray-700 cursor-not-allowed'
                                : 'text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-700'
                              }`}
                          >
                            <i className='bx bx-chevron-left'></i>
                          </button>

                          {generatePageNumbers(quotesPage, quotesTotalPages).map((pageNum, idx) => (
                            <button
                              key={idx}
                              onClick={() => typeof pageNum === 'number' && setQuotesPage(pageNum)}
                              disabled={pageNum === '...'}
                              className={`px-3 py-1 text-sm rounded-md border bg-gray-50 dark:bg-gray-800
                                ${pageNum === quotesPage
                                  ? 'bg-blue-100 border-blue-500 text-blue-600 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-400'
                                  : pageNum === '...'
                                    ? 'text-gray-400 dark:text-gray-600 border-gray-200 dark:border-gray-700 cursor-default'
                                    : 'text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-700'
                                }`}
                            >
                              {pageNum}
                            </button>
                          ))}

                          <button
                            onClick={() => setQuotesPage(prev => Math.min(quotesTotalPages, prev + 1))}
                            disabled={quotesPage === quotesTotalPages}
                            className={`px-2 py-1 text-sm rounded-md border bg-gray-50 dark:bg-gray-800
                              ${quotesPage === quotesTotalPages
                                ? 'text-gray-400 dark:text-gray-600 border-gray-200 dark:border-gray-700 cursor-not-allowed'
                                : 'text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-700'
                              }`}
                          >
                            <i className='bx bx-chevron-right'></i>
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      {paginatedQuotes?.map(quote => (
                        <div 
                          key={quote.id}
                          className="group relative bg-white dark:bg-gray-800 rounded-md overflow-hidden mb-1"
                        >
                          <div className="p-4">
                            {editingQuote?.id === quote.id ? (
                              <form 
                                onSubmit={(e) => {
                                  e.preventDefault()
                                  handleEdit(editingQuote)
                                }}
                                className="space-y-4"
                              >
                                <textarea
                                  value={editingQuote.quote}
                                  onChange={(e) => setEditingQuote({ ...editingQuote, quote: e.target.value })}
                                  className="w-full px-3 py-2 
                                        bg-white dark:bg-gray-900
                                        border border-gray-300 dark:border-gray-700
                                        text-gray-900 dark:text-gray-100
                                        rounded-md focus:ring-1 focus:ring-blue-50"
                                  required
                                />
                                <input
                                  type="text"
                                  value={editingQuote.thinker}
                                  onChange={(e) => setEditingQuote({ ...editingQuote, thinker: e.target.value })}
                                  className="w-full px-3 py-2 
                                        bg-white dark:bg-gray-900
                                        border border-gray-300 dark:border-gray-700
                                        text-gray-900 dark:text-gray-100
                                        rounded-md focus:ring-1 focus:ring-blue-50"
                                  required
                                />
                                <div className="flex gap-2">
                                  <button
                                    type="submit"
                                    className="px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                                  >
                                    {isSubmitting ? t('saving') : t('save')}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setEditingQuote(null)}
                                    className="px-3 py-1 bg-gray-500 text-white rounded-md hover:bg-gray-600"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </form>
                            ) : (
                              <div className="flex justify-between items-start gap-4">
                                <div className="flex-1">
                                  <div 
                                    onClick={(e) => {
                                      // Don't collapse if text is being selected
                                      const selection = window.getSelection()
                                      if (selection && selection.toString()) {
                                        return
                                      }
                                      toggleQuoteExpansion(quote.id)
                                    }}
                                    className="cursor-pointer"
                                  >
                                    <div className="text-gray-900 dark:text-gray-100 mb-2">
                                      {expandedQuoteIds.includes(quote.id) ? (
                                        quote.quote
                                      ) : (
                                        <>
                                          {quote.quote.slice(0, 200)}
                                          {quote.quote.length > 200 && (
                                            <span className="text-blue-500 dark:text-blue-400 ml-1">
                                              {t('readMore')}
                                            </span>
                                          )}
                                        </>
                                      )}
                                    </div>
                                    <div className="text-sm text-gray-600 dark:text-gray-400">
                                      — {quote.thinker}
                                    </div>
                                  </div>
                                </div>

                                {/* Hover Actions */}
                                <div className="flex gap-1 px-1 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-200 dark:bg-gray-700 rounded-md">
                                  <button
                                    onClick={() => setEditingQuote(quote)}
                                    className="p-1.5 text-gray-500 hover:text-gray-200 
                                      hover:bg-gray-500 dark:hover:bg-gray-500 rounded"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                  </button>
                                  <div className="relative">
                                    <button
                                      onClick={() => setDeletingQuoteId(quote.id)}
                                      className="p-1.5 text-gray-500 hover:text-red-600 
                                        hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                                    >
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                      </svg>
                                    </button>
                                    
                                    {/* Delete Confirmation Popover */}
                                    {deletingQuoteId === quote.id && (
                                      <div 
                                        id={`delete-popover-${quote.id}`}
                                        aria-label={t('deleteConfirmation')}
                                        role="dialog"
                                        className="fixed transform translate-x-[-45%] translate-y-2
                                          w-48 bg-white dark:bg-gray-800 
                                          rounded-md shadow-lg border border-gray-200 dark:border-gray-700 
                                          p-2 text-sm z-[100]"
                                      >
                                        <p className="text-gray-700 dark:text-gray-300 mb-2">
                                          {t('deleteConfirmation')}
                                        </p>
                                        <div className="flex justify-end gap-2">
                                          <button
                                            aria-label={t('cancel')}
                                            onClick={() => setDeletingQuoteId(null)}
                                            className="px-2 py-1 text-gray-600 dark:text-gray-400 
                                              hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                                          >
                                            {t('cancel')}
                                          </button>
                                          <button
                                            aria-label={t('delete')}
                                            onClick={() => {
                                              handleDelete(quote.id)
                                              setDeletingQuoteId(null)
                                            }}
                                            className="px-2 py-1 bg-red-500 text-white 
                                              hover:bg-red-600 rounded"
                                          >
                                            {t('delete')}
                                          </button>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}

                  {/* Bottom Quotes Pagination */}
                  {quotesTotalPages > 1 && (
                    <div className="mb-4 flex items-center justify-between px-4 
                      bg-gray-50/50 dark:bg-gray-800/50 rounded-lg py-2">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-gray-600 dark:text-gray-400">
                          {getDisplayRange(quotesPage, pageSize, quotesTotalItems).start}-
                          {getDisplayRange(quotesPage, pageSize, quotesTotalItems).end} {t('of')} {quotesTotalItems}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setQuotesPage(prev => Math.max(1, prev - 1))}
                          disabled={quotesPage === 1}
                          className={`px-2 py-1 text-sm rounded-md border bg-gray-50 dark:bg-gray-800
                            ${quotesPage === 1
                              ? 'text-gray-400 dark:text-gray-600 border-gray-200 dark:border-gray-700 cursor-not-allowed'
                              : 'text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-700'
                            }`}
                        >
                          <i className='bx bx-chevron-left'></i>
                        </button>

                        {generatePageNumbers(quotesPage, quotesTotalPages).map((pageNum, idx) => (
                          <button
                            key={idx}
                            onClick={() => typeof pageNum === 'number' && setQuotesPage(pageNum)}
                            disabled={pageNum === '...'}
                            className={`px-3 py-1 text-sm rounded-md border bg-gray-50 dark:bg-gray-800
                              ${pageNum === quotesPage
                                ? 'bg-blue-100 border-blue-500 text-blue-600 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-400'
                                : pageNum === '...'
                                  ? 'text-gray-400 dark:text-gray-600 border-gray-200 dark:border-gray-700 cursor-default'
                                  : 'text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-700'
                              }`}
                          >
                            {pageNum}
                          </button>
                        ))}

                        <button
                          onClick={() => setQuotesPage(prev => Math.min(quotesTotalPages, prev + 1))}
                          disabled={quotesPage === quotesTotalPages}
                          className={`px-2 py-1 text-sm rounded-md border bg-gray-50 dark:bg-gray-800
                            ${quotesPage === quotesTotalPages
                              ? 'text-gray-400 dark:text-gray-600 border-gray-200 dark:border-gray-700 cursor-not-allowed'
                              : 'text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-700'
                            }`}
                        >
                          <i className='bx bx-chevron-right'></i>
                        </button>
                      </div>
                    </div>
                  )}
                    </div>
                  </div>

                </>
              ) : (
                // Notes View
                <>
                  <div className="p-4">
                    <button
                      onClick={() => setIsFormExpanded(!isFormExpanded)}
                      className="w-full font-medium text-left text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                    >
                      {t('addNewNote')}
                    </button>
                  </div>
                  {isFormExpanded && (
                    <form onSubmit={handleNoteSubmit} className="border-t border-gray-200 dark:border-gray-700 p-4 space-y-4">
                      {/* Title Field */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          {t('title')}
                        </label>
                        <input
                          type="text"
                          value={newNoteTitle}
                          onChange={(e) => setNewNoteTitle(e.target.value)}
                          className="w-full px-3 py-2 
                            bg-white dark:bg-gray-900
                            border border-gray-300 dark:border-gray-700
                            text-gray-900 dark:text-gray-100
                            placeholder-gray-500 dark:placeholder-gray-400
                            rounded-md focus:ring-1 focus:ring-blue-500
                            focus:border-blue-500"
                          placeholder={t('noteTitle')}
                          required
                        />
                      </div>

                      {/* Content Field */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          {t('content')}
                        </label>
                        <textarea
                          value={newNote}
                          onChange={(e) => setNewNote(e.target.value)}
                          className="w-full px-3 py-2 
                            bg-white dark:bg-gray-900
                            border border-gray-300 dark:border-gray-700
                            text-gray-900 dark:text-gray-100
                            placeholder-gray-500 dark:placeholder-gray-400
                            rounded-md focus:ring-1 focus:ring-blue-500
                            focus:border-blue-500"
                          rows={4}
                          placeholder={t('writeYourNote')}
                          required
                        />
                      </div>

                      {/* Tags Field */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          {t('tags')}
                        </label>
                        <input
                          type="text"
                          value={newNoteTags}
                          onChange={(e) => setNewNoteTags(e.target.value)}
                          className="w-full px-3 py-2 
                            bg-white dark:bg-gray-900
                            border border-gray-300 dark:border-gray-700
                            text-gray-900 dark:text-gray-100
                            placeholder-gray-500 dark:placeholder-gray-400
                            rounded-md focus:ring-1 focus:ring-blue-500
                            focus:border-blue-500"
                          placeholder={t('tagsHint')}
                        />
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          {t('tagsSeparator')}
                        </p>
                      </div>

                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setNewNoteTitle('')
                            setNewNote('')
                            setNewNoteTags('')
                            setIsFormExpanded(false)
                          }}
                          className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 
                            hover:bg-gray-100 dark:hover:bg-gray-700 
                            rounded-md transition-colors"
                        >
                          {t('cancel')}
                        </button>
                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="px-4 py-2 text-sm text-white 
                            bg-blue-500 hover:bg-blue-600
                            disabled:opacity-50 disabled:cursor-not-allowed
                            rounded-md transition-colors"
                        >
                          {isSubmitting ? t('saving') : t('save')}
                        </button>
                      </div>
                    </form>
                  )}
                  {/* Notes List */}
                  <div className="bg-gray-200 dark:bg-gray-700 rounded-lg p-4 pb-6">
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                        {t('notes')}
                        <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                          ({filteredNotes?.length || 0} total)
                        </span>
                      </h2>
                    </div>

                    {/* Search Bar */}
                    <div className="mb-1 flex gap-2">
                      {/* Search Input */}
                      <div className="relative flex-1">
                        <input
                          type="text"
                          value={noteSearchQuery}
                          onChange={(e) => setNoteSearchQuery(e.target.value)}
                          placeholder={t('searchNotes')}
                          className="w-full px-4 py-2 pl-10
                            bg-white dark:bg-gray-800
                            border border-gray-300 dark:border-gray-600
                            text-gray-900 dark:text-gray-100
                            placeholder-gray-500 dark:placeholder-gray-400
                            rounded-md focus:ring-1 focus:ring-blue-500
                            focus:border-blue-500"
                        />
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <svg 
                            className="h-5 w-5 text-gray-400" 
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                          >
                            <path 
                              strokeLinecap="round" 
                              strokeLinejoin="round" 
                              strokeWidth={2} 
                              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
                            />
                          </svg>
                        </div>
                      </div>

                      {/* Sort Buttons */}
                      <div className="flex rounded-md shadow-sm">
                        <button
                          onClick={() => setSortOrder('newest')}
                          className={`px-3 py-2 text-sm font-medium rounded-l-md border
                            ${sortOrder === 'newest'
                              ? 'bg-blue-50 border-blue-200 text-blue-600 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-400'
                              : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700'
                            }`}
                        >
                          <i className='bx bx-sort-down text-base'></i>
                        </button>
                        <button
                          onClick={() => setSortOrder('oldest')}
                          className={`px-3 py-2 text-sm font-medium border-t border-b
                            ${sortOrder === 'oldest'
                              ? 'bg-blue-50 border-blue-200 text-blue-600 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-400'
                              : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700'
                            }`}
                        >
                          <i className='bx bx-sort-up text-base'></i>
                        </button>
                        <button
                          onClick={() => setSortOrder('az')}
                          className={`px-3 py-2 text-sm font-medium rounded-r-md border
                            ${sortOrder === 'az'
                              ? 'bg-blue-50 border-blue-200 text-blue-600 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-400'
                              : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700'
                            }`}
                        >
                          <i className='bx bx-sort-a-z text-base'></i>
                        </button>
                      </div>

                      {/* Page Size Dropdown */}
                      <select
                        value={pageSize}
                        onChange={(e) => setPageSize(Number(e.target.value) as PageSize)}
                        className="px-3 py-2 text-sm font-medium border rounded-md
                          bg-white dark:bg-gray-800 
                          border-gray-300 dark:border-gray-600
                          text-gray-700 dark:text-gray-300
                          hover:bg-gray-50 dark:hover:bg-gray-700
                          focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="10">10 {t('perPage')}</option>
                        <option value="20">20 {t('perPage')}</option>
                        <option value="50">50 {t('perPage')}</option>
                        <option value="100">100 {t('perPage')}</option>
                      </select>
                    </div>


                    {/* Top Notes Pagination */}
                    {notesTotalPages > 1 && (
                      <div className="mb-1 flex items-center justify-between px-4 
                      bg-gray-50/50 dark:bg-gray-800/50 rounded-lg py-2">
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-gray-600 dark:text-gray-400">
                            {getDisplayRange(notesPage, pageSize, notesTotalItems).start}-
                            {getDisplayRange(notesPage, pageSize, notesTotalItems).end} {t('of')} {notesTotalItems}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setNotesPage(prev => Math.max(1, prev - 1))}
                            disabled={notesPage === 1}
                            className={`px-2 py-1 text-sm rounded-md border bg-gray-50 dark:bg-gray-800
                              ${notesPage === 1
                                ? 'text-gray-400 dark:text-gray-600 border-gray-200 dark:border-gray-700 cursor-not-allowed'
                                : 'text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-700'
                              }`}
                          >
                            <i className='bx bx-chevron-left'></i>
                          </button>

                          {generatePageNumbers(notesPage, notesTotalPages).map((pageNum, idx) => (
                            <button
                              key={idx}
                              onClick={() => typeof pageNum === 'number' && setNotesPage(pageNum)}
                              disabled={pageNum === '...'}
                              className={`px-3 py-1 text-sm rounded-md border bg-gray-50 dark:bg-gray-800
                                ${pageNum === notesPage
                                  ? 'bg-blue-100 border-blue-500 text-blue-600 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-400'
                                  : pageNum === '...'
                                    ? 'text-gray-400 dark:text-gray-600 border-gray-200 dark:border-gray-700 cursor-default'
                                    : 'text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-700'
                                }`}
                            >
                              {pageNum}
                            </button>
                          ))}

                          <button
                            onClick={() => setNotesPage(prev => Math.min(notesTotalPages, prev + 1))}
                            disabled={notesPage === notesTotalPages}
                            className={`px-2 py-1 text-sm rounded-md border bg-gray-50 dark:bg-gray-800
                              ${notesPage === notesTotalPages
                                ? 'text-gray-400 dark:text-gray-600 border-gray-200 dark:border-gray-700 cursor-not-allowed'
                                : 'text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-700'
                              }`}
                          >
                            <i className='bx bx-chevron-right'></i>
                          </button>
                        </div>
                      </div>
                    )}


                    {/* Tag Cloud */}
                    <div className="mb-2">
                      <div className="flex flex-wrap gap-1">
                        {getAllTags(notes)?.map(tag => (
                          <button
                            key={tag}
                            onClick={() => {
                              setSelectedTags(prev => 
                                prev.includes(tag)
                                  ? prev.filter(t => t !== tag)
                                  : [...prev, tag]
                              )
                            }}
                            className={`px-2 pt-0.5 pb-1 text-sm rounded-md transition-colors
                              ${selectedTags.includes(tag)
                                ? 'bg-blue-500 text-white hover:bg-blue-600'
                                : 'bg-blue-50 dark:bg-blue-500/30 text-blue-600 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/40'
                              }`}
                          >
                            {tag}
                            {selectedTags.includes(tag) && (
                              <span className="ml-2 font-medium">×</span>
                            )}
                          </button>
                        ))}
                      </div>
                      {selectedTags.length > 0 && (
                        <button
                          onClick={() => setSelectedTags([])}
                          className="mt-2 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                        >
                          {t('clearTags')}
                        </button>
                      )}
                    </div>

                    <div className="space-y-2">
                      {paginatedNotes?.map(note => (
                        <div
                          key={note.id}
                          className="group relative bg-white dark:bg-gray-800 rounded-md overflow-hidden" >
                          <div className="p-4">
                            {editingNote?.id === note.id ? (
                              // Edit Note Form
                              <form onSubmit={(e) => {
                                e.preventDefault()
                                handleNoteEdit(editingNote)
                              }} className="space-y-4">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    {t('title')}
                                  </label>
                                  <input
                                    type="text"
                                    value={editingNote.title}
                                    onChange={(e) => setEditingNote({ ...editingNote, title: e.target.value })}
                                    className="w-full px-3 py-2 
                                      bg-white dark:bg-gray-900
                                      border border-gray-300 dark:border-gray-700
                                      text-gray-900 dark:text-gray-100
                                      rounded-md focus:ring-1 focus:ring-blue-500"
                                    required
                                  />
                                </div>
                                
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    {t('content')}
                                  </label>
                                  <textarea
                                    value={editingNote.content}
                                    onChange={(e) => setEditingNote({ ...editingNote, content: e.target.value })}
                                    className="w-full px-3 py-2 
                                      bg-white dark:bg-gray-900
                                      border border-gray-300 dark:border-gray-700
                                      text-gray-900 dark:text-gray-100
                                      rounded-md focus:ring-1 focus:ring-blue-500"
                                    rows={4}
                                    required
                                  />
                                </div>

                                <div>
                                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    {t('tags')}
                                  </label>
                                  <input
                                    type="text"
                                    value={editingNote.tags}
                                    onChange={(e) => setEditingNote({
                                      ...editingNote,
                                      tags: e.target.value
                                    })}
                                    className="w-full px-3 py-2 
                                      bg-white dark:bg-gray-900
                                      border border-gray-300 dark:border-gray-700
                                      text-gray-900 dark:text-gray-100
                                      rounded-md focus:ring-1 focus:ring-blue-500"
                                  />
                                </div>

                                <div className="flex justify-end gap-2">
                                  <button
                                    type="button"
                                    onClick={() => setEditingNote(null)}
                                    className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 
                                      hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                                  >
                                    {t('cancel')}
                                  </button>
                                  <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="px-4 py-2 text-sm text-white 
                                      bg-blue-500 hover:bg-blue-600 
                                      disabled:opacity-50 rounded-md"
                                  >
                                    {isSubmitting ? t('saving') : t('save')}
                                  </button>
                                </div>
                              </form>
                              
                            ) : (
                              // Note Content Display
                              <div className="flex justify-between items-start gap-4">
                                <div className="flex-1">
                                  <div className="flex justify-between items-start mb-1">
                                    <h3 className="font-medium text-gray-900 dark:text-gray-100">
                                      {note.title}
                                    </h3>
                                    <div className="absolute top-0 right-0 pt-3 pr-4 text-xs text-gray-500 dark:text-gray-400">
                                      {new Date(note.updatedAt).toLocaleString(undefined, {
                                        month: 'short',
                                        day: 'numeric',
                                        hour: 'numeric',
                                        minute: '2-digit'
                                      })}
                                    </div>
                                  </div>
                                  <div className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                                    <div 
                                      onClick={(e) => {
                                        // Don't collapse if text is being selected
                                        const selection = window.getSelection()
                                        if (selection && selection.toString()) {
                                          return
                                        }
                                        toggleNoteExpansion(note.id)
                                      }}
                                      className="cursor-pointer"
                                    >
                                      {expandedNoteIds.includes(note.id) ? (
                                        note.content
                                      ) : (
                                        <>
                                          {note.content.slice(0, 200)}
                                          {note.content.length > 200 && (
                                            <span className="text-blue-500 dark:text-blue-400 ml-1">
                                              {t('readMore')}
                                            </span>
                                          )}
                                        </>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {/* Hover Actions */}
                                <div className="flex mt-5 gap-1 px-1 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-200 dark:bg-gray-700 rounded-md">
                                  <button
                                    onClick={() => setEditingNote(note)}
                                    className="p-1.5 text-gray-500 hover:text-gray-200 
                                      hover:bg-gray-500 dark:hover:bg-gray-500 rounded"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                  </button>
                                  <div className="relative">
                                    <button
                                      onClick={() => setDeletingNoteId(note.id)}
                                      className="p-1.5 text-gray-500 hover:text-red-600 
                                        hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                                    >
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                      </svg>
                                    </button>
                                    
                                    {/* Delete Confirmation Popover */}
                                    {deletingNoteId === note.id && (
                                      <div 
                                        id={`delete-popover-${note.id}`}
                                        aria-label={t('deleteConfirmation')}
                                        role="dialog"
                                        className="fixed transform translate-x-[-45%] translate-y-2
                                          w-48 bg-white dark:bg-gray-800 
                                          rounded-md shadow-lg border border-gray-200 dark:border-gray-700 
                                          p-2 text-sm z-[100]"
                                      >
                                        <p className="text-gray-700 dark:text-gray-300 mb-2">
                                          {t('deleteConfirmation')}
                                        </p>
                                        <div className="flex justify-end gap-2">
                                          <button
                                            aria-label={t('cancel')}
                                            onClick={() => setDeletingNoteId(null)}
                                            className="px-2 py-1 text-gray-600 dark:text-gray-400 
                                              hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                                          >
                                            {t('cancel')}
                                          </button>
                                          <button
                                            aria-label={t('delete')}
                                            onClick={() => {
                                              handleNoteDelete(note.id)
                                              setDeletingNoteId(null)
                                            }}
                                            className="px-2 py-1 bg-red-500 text-white 
                                              hover:bg-red-600 rounded"
                                          >
                                            {t('delete')}
                                          </button>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}

                  {/* Bottom Notes Pagination */}
                  {notesTotalPages > 1 && (
                    <div className="mt-4 flex items-center justify-between px-4 
                      bg-gray-50/50 dark:bg-gray-800/50 rounded-lg py-2">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-gray-600 dark:text-gray-400">
                          {getDisplayRange(notesPage, pageSize, notesTotalItems).start}-
                          {getDisplayRange(notesPage, pageSize, notesTotalItems).end} {t('of')} {notesTotalItems}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setNotesPage(prev => Math.max(1, prev - 1))}
                          disabled={notesPage === 1}
                          className={`px-2 py-1 text-sm rounded-md border bg-gray-100 dark:bg-gray-800
                            ${notesPage === 1
                              ? 'text-gray-400 dark:text-gray-600 border-gray-200 dark:border-gray-700 cursor-not-allowed'
                              : 'text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-300 dark:hover:bg-gray-700'
                            }`}
                        >
                          <i className='bx bx-chevron-left'></i>
                        </button>

                        {generatePageNumbers(notesPage, notesTotalPages).map((pageNum, idx) => (
                          <button
                            key={idx}
                            onClick={() => typeof pageNum === 'number' && setNotesPage(pageNum)}
                            disabled={pageNum === '...'}
                            className={`px-3 py-1 text-sm rounded-md border bg-gray-100 dark:bg-gray-800
                              ${pageNum === notesPage
                                ? 'bg-blue-100 border-blue-500 text-blue-600 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-400'
                                : pageNum === '...'
                                  ? 'text-gray-400 dark:text-gray-600 border-gray-200 dark:border-gray-700 cursor-default'
                                  : 'text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-700'
                              }`}
                          >
                            {pageNum}
                          </button>
                        ))}

                        <button
                          onClick={() => setNotesPage(prev => Math.min(notesTotalPages, prev + 1))}
                          disabled={notesPage === notesTotalPages}
                          className={`px-2 py-1 text-sm rounded-md border bg-gray-100 dark:bg-gray-800
                            ${notesPage === notesTotalPages
                              ? 'text-gray-400 dark:text-gray-600 border-gray-200 dark:border-gray-700 cursor-not-allowed'
                              : 'text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                            }`}
                        >
                          <i className='bx bx-chevron-right'></i>
                        </button>
                      </div>
                    </div>
                  )}
                    </div>
                  </div>



                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 