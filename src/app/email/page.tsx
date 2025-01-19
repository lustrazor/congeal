'use client'
import { useState, useEffect } from 'react'
import { Message, Mailbox } from '@/types'
import { useDebugStore } from '@/stores/debugStore'
import { useTranslations } from '@/hooks/useTranslations'
import SidebarEmail from '@/components/SidebarEmail'
import MessageCard from '@/components/MessageCard'
import AuthWrapper from '@/components/AuthWrapper'
import Header from '@/components/Header'
import 'boxicons/css/boxicons.min.css'

export default function EmailPage() {
  const { t } = useTranslations()
  const debugStore = useDebugStore()
  const [messages, setMessages] = useState<Message[]>([])
  const [mailboxes, setMailboxes] = useState<Mailbox[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [selectedMailboxId, setSelectedMailboxId] = useState<number | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'condensed'>('list')
  const [connectionStatus, setConnectionStatus] = useState<{
    status: 'idle' | 'connecting' | 'fetching' | 'complete' | 'error' | 'ready'
    message: string
    startTime?: number
    endTime?: number
    details?: string
  }>({
    status: 'idle',
    message: t('selectMailbox'),
    details: t('noMailboxSelected')
  })
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  // Load mailboxes on mount
  useEffect(() => {
    loadMailboxes()
  }, [])

  const loadMailboxes = async () => {
    try {
      const response = await fetch('/api/mailboxes')
      if (!response.ok) throw new Error('Failed to fetch mailboxes')
      const { data } = await response.json()
      setMailboxes(data)
    } catch (error) {
      console.error('Error loading mailboxes:', error)
    }
  }

  const handleMailboxSelect = async (id: number | null) => {
    try {
      setSelectedMailboxId(id)
      setIsLoading(true)
      let cachedCount = 0

      setConnectionStatus({
        status: 'idle',
        message: t('idle'),
        startTime: Date.now()
      })

      // Try cache first
      if (id) {
        setConnectionStatus({
          status: 'fetching',
          message: t('checkingCache'),
          startTime: Date.now()
        })

        const cacheResponse = await fetch(`/api/messages/cache?mailboxId=${id}`)
        if (cacheResponse.ok) {
          const { data: cachedMessages, debug } = await cacheResponse.json()
          if (cachedMessages?.length > 0) {
            setMessages(cachedMessages)
            cachedCount = cachedMessages.length
            setIsLoading(false)
          }
        }
      }

      // Then fetch fresh data
      setConnectionStatus({
        status: 'connecting',
        message: t('connecting'),
        details: id ? t('toMailbox', { name: mailboxes.find(m => m.id === id)?.name }) : undefined
      })

      const url = id ? `/api/messages?mailboxId=${id}` : '/api/messages'
      
      // Set fetching status before making the request
      setConnectionStatus({
        status: 'fetching',
        message: t('fetchingMessages'),
        startTime: Date.now()
      })

      const response = await fetch(url, { cache: 'no-store' })
      
      if (!response.ok) {
        throw new Error('Failed to fetch messages')
      }

      const { data: messagesData, debug } = await response.json()
      const newMessageCount = (messagesData?.length || 0) - cachedCount

      // Always update messages with fresh data
      setMessages(messagesData || [])
      setConnectionStatus({
        status: 'complete',
        message: t('complete'),
        details: newMessageCount > 0 
          ? t('newMessages', { count: newMessageCount })
          : t('noNewMessages')
      })

      debugStore.setCommandLog({
        command: 'FETCH_MESSAGES',
        response: {
          status: 'success',
          selectedMailboxId: id,
          totalMessages: messagesData?.length || 0,
          duration: debug.duration,
          query: debug.query,
          rowCount: debug.rowCount,
          cacheHits: debug.cacheHits,
          cacheMisses: debug.cacheMisses
        }
      })
    } catch (error) {
      console.error('Error loading messages:', error)
      setConnectionStatus({
        status: 'error',
        message: t('connectionError'),
        details: error instanceof Error ? error.message : t('unknownError')
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Filter messages based on search
  const filteredMessages = messages
    .filter(message => 
      (!selectedMailboxId || message.mailboxId === selectedMailboxId) &&
      (message.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
       message.body?.toLowerCase().includes(searchQuery.toLowerCase()))
    )
    .sort((a, b) => {
      const dateA = new Date(a.date).getTime()
      const dateB = new Date(b.date).getTime()
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB
    })

  return (
    <AuthWrapper>
      <div className="h-screen flex flex-col">
        <Header>
          <div className="flex items-center justify-between w-full">
            {/* Left side */}
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                {t('email')}
              </h1>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {mailboxes.length} {t('mailboxes')}
              </div>
            </div>

            {/* Right side */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsLoading(true)}
                className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-300 
                  dark:hover:text-white rounded-lg hover:bg-gray-100 
                  dark:hover:bg-gray-800 transition-colors"
                title={t('refresh')}
              >
                <i className="bx bx-refresh text-xl" />
              </button>
              <button
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 
                  hover:bg-blue-700 rounded-lg transition-colors"
              >
                {t('compose')}
              </button>
            </div>
          </div>
        </Header>

        <div className="flex-1 flex overflow-hidden">
          <SidebarEmail 
            mailboxes={mailboxes}
            onMailboxesChange={setMailboxes}
            selectedMailboxId={selectedMailboxId}
            onMailboxSelect={handleMailboxSelect}
            searchQuery={searchQuery}
            onSearch={setSearchQuery}
          />

          <main className="flex-1 flex flex-col bg-white dark:bg-gray-800">
            {/* Fixed top section */}
            <div className="flex-none relative">
              {/* Mail Server Status with dropshadow */}
              <div className="px-8 py-4 bg-white dark:bg-gray-800 relative before:content-[''] before:absolute before:inset-x-0 
                before:top-0 before:h-24 before:bg-[url('/images/dropshadow-light.png')] 
                dark:before:bg-[url('/images/dropshadow-dark.png')] before:bg-repeat-x before:bg-top">
                <div className="relative z-10 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 pt-10">
                  Status: 
                  <div className={`
                    w-2 h-2 rounded-full ${
                      connectionStatus.status === 'idle' ? 'bg-gray-300' :
                      connectionStatus.status === 'ready' ? 'bg-gray-400' :
                      connectionStatus.status === 'connecting' ? 'bg-blue-400 animate-pulse' :
                      connectionStatus.status === 'fetching' ? 'bg-yellow-400 animate-pulse' :
                      connectionStatus.status === 'complete' ? 'bg-green-400' :
                      'bg-red-400'
                    }
                  `} />
                  <span>
                    {connectionStatus.message}
                  </span>
                  {connectionStatus.details && (
                    <span className="text-gray-400 dark:text-gray-500 ml-2">
                      • {connectionStatus.details}
                    </span>
                  )}
                </div>
              </div>

              {/* Controls Bar */}
              <div className="px-8 pb-4 relative z-20 bg-transparent">
                <div className="bg-gray-200/30 dark:bg-gray-900/50 rounded-lg p-2 border border-gray-200/50 dark:border-gray-600/50">
                  <div className="flex justify-between items-center gap-4">
                    {/* Left side: Mailbox name and view toggles */}
                    <div className="flex items-center gap-4">
                      {selectedMailboxId ? (
                        // Show selected mailbox name
                        <h1 className="pl-3 text-lg font-medium text-gray-600 dark:text-gray-400">
                          {mailboxes.find(m => m.id === selectedMailboxId)?.name}
                        </h1>
                      ) : (
                        // Show welcome message when no mailbox selected
                        <div className="pl-3">
                          <h1 className="text-lg font-medium text-gray-600 dark:text-gray-400">
                            Inbox
                          </h1>
                        </div>
                      )}

                      {/* View mode toggles */}
                      <div className="flex gap-1 p-1 rounded-lg">
                        <button
                          onClick={() => setViewMode('list')}
                          className={`p-1.5 pl-4 pr-6 rounded-lg flex items-center gap-1 text-sm ${
                            viewMode === 'list' 
                              ? 'bg-white dark:bg-blue-900 text-gray-600 dark:text-blue-200' 
                              : 'text-gray-500 dark:text-gray-400 hover:bg-gray-400 dark:hover:bg-gray-700 hover:text-white dark:hover:text-white'
                          }`}
                        >
                          <box-icon name="list-ul" size="1rem"></box-icon>
                          <span>List</span>
                        </button>

                        <button
                          onClick={() => setViewMode('condensed')}
                          className={`p-1.5 pl-2 pr-3 rounded-lg flex items-center gap-1 text-sm ${
                            viewMode === 'condensed'
                              ? 'bg-white dark:bg-blue-900 text-gray-600 dark:text-blue-200' 
                              : 'text-gray-500 dark:text-gray-400 hover:bg-gray-400 dark:hover:bg-gray-700 hover:text-white dark:hover:text-white'
                          }`}
                        >
                          <box-icon name="menu" size="1rem"></box-icon>
                          <span>Condensed</span>
                        </button>
                      </div>
                    </div>

                    {/* Center: Sort toggle */}
                    <button
                      onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
                      className="p-1.5 rounded-lg flex items-center gap-1 text-sm
                        text-gray-500 dark:text-gray-400 hover:bg-gray-400 dark:hover:bg-gray-700 
                        hover:text-white dark:hover:text-white"
                      title={sortOrder === 'desc' ? t('oldestFirst') : t('newestFirst')}
                    >
                      <i className={`bx bx-sort-${sortOrder === 'desc' ? 'down' : 'up'} text-lg`} />
                      <span>{sortOrder === 'desc' ? t('newest') : t('oldest')}</span>
                    </button>

                    {/* Right side: Search bar */}
                    <div className="relative w-64">
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={t('search')}
                        className="w-full px-4 py-1.5 pr-10 text-sm rounded-lg border border-gray-300/50 
                          dark:border-gray-600/50 bg-white/50 dark:bg-gray-800/50
                          placeholder-gray-500 dark:placeholder-gray-400
                          focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                      <i className="bx bx-search absolute right-3 top-1/2 -translate-y-1/2 
                        text-gray-400 dark:text-gray-500" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Scrollable message list */}
            <div className="flex-1 overflow-auto">
              <div className="relative max-w-4xl mx-auto px-8 py-4 space-y-4">
                {!selectedMailboxId ? (
                  <div className="text-center py-12">
                    <p className="text-gray-500 dark:text-gray-400 text-lg">
                      Please select a mailbox from the sidebar to view messages
                    </p>
                  </div>
                ) : isLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin text-blue-500 mb-2">
                      <i className="bx bx-loader-alt text-2xl" />
                    </div>
                    <div className="text-gray-500">{t('loadingMessages')}</div>
                  </div>
                ) : filteredMessages.length > 0 ? (
                  <div className={`
                    ${viewMode === 'grid' ? 'grid grid-cols-2 gap-2' : ''}
                    ${viewMode === 'list' ? 'grid grid-cols-1 gap-2' : ''}
                    ${viewMode === 'condensed' ? 'space-y-0.5' : ''}
                  `}>
                    {filteredMessages.map(message => (
                      <MessageCard 
                        key={message.id}
                        message={message}
                        mailbox={mailboxes.find(m => m.id === message.mailboxId)}
                        viewMode={viewMode}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                    {searchQuery ? t('noSearchResults') : t('noMessages')}
                  </div>
                )}
              </div>
            </div>
          </main>
        </div>
      </div>
    </AuthWrapper>
  )
} 