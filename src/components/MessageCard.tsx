'use client'
import { useState, useEffect } from 'react'
import { Message, Mailbox } from '@/types'
import ReplyModal from './ReplyModal'
import { useMessageContent } from '@/hooks/useMessageContent'

interface MessageCardProps {
  message: Message
  mailbox?: Mailbox
  viewMode?: 'grid' | 'list' | 'condensed'
}

// Add this CSS to your globals.css
const emailStyles = `
  .email-content {
    color: inherit;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
    line-height: 1.5;
    width: 100%;
  }
  
  /* Reset table styles */
  .email-content table {
    border-collapse: collapse;
    border: none;
    width: 100%;
    margin: 0;
    padding: 0;
  }
  
  .email-content td,
  .email-content th {
    border: none;
    padding: 0;
  }
  
  /* Remove default table borders */
  .email-content table[border="0"],
  .email-content table[border="0"] td,
  .email-content table[border="0"] th {
    border: none !important;
  }
  
  /* Handle GitHub specific styles */
  .email-content .container-sm,
  .email-content .container-md,
  .email-content .width-full {
    width: 100%;
    max-width: 100%;
  }
  
  .email-content .border {
    border: 1px solid #e1e4e8 !important;
    border-radius: 6px;
  }
  
  .email-content .text-center {
    text-align: center;
  }
  
  .email-content img {
    max-width: 100%;
    height: auto;
    display: inline-block;
  }
  
  .email-content a {
    color: #0366d6;
    text-decoration: none;
  }
  
  .email-content a:hover {
    text-decoration: underline;
  }
  
  .email-content .btn {
    display: inline-block;
    padding: 0.75em 1.5em;
    font-size: inherit;
    font-weight: 500;
    line-height: 1.5;
    text-align: center;
    white-space: nowrap;
    vertical-align: middle;
    cursor: pointer;
    border: 1px solid transparent;
    border-radius: 0.5em;
    text-decoration: none;
  }
  
  .email-content .btn-primary {
    color: #fff;
    background-color: #1f883d;
    border-color: #1f883d;
  }
  
  /* Dark mode adjustments */
  .dark .email-content {
    color: inherit;
  }
  
  .dark .email-content .border {
    border-color: #30363d !important;
  }
  
  .dark .email-content a {
    color: #58a6ff;
  }
  
  .dark .email-content .text-gray-light {
    color: #8b949e !important;
  }
`

export default function MessageCard({ message, mailbox, viewMode }: MessageCardProps) {
  const [isReplyModalOpen, setIsReplyModalOpen] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [isUnread, setIsUnread] = useState(message.isUnread)
  const [showHeaders, setShowHeaders] = useState(false)
  const [showSource, setShowSource] = useState(false)

  // Replace existing content fetching with React Query
  const { 
    data: messageData,
    isLoading,
    error 
  } = useMessageContent(message.id, message.mailboxId, isExpanded)

  // Update content rendering
  useEffect(() => {
    if (messageData) {
      message.hasHtml = messageData.isHtml
    }
  }, [messageData, message])

  const messageBody = isLoading ? (
    <div className="animate-pulse space-y-4">
      {/* Loading header placeholder */}
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
      
      {/* Loading content placeholder - multiple lines */}
      <div className="space-y-3">
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full" />
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-5/6" />
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-4/6" />
      </div>

      {/* Loading spinner */}
      <div className="flex items-center gap-2 text-gray-400">
        <i className="bx bx-loader-alt animate-spin" />
        <span>Loading message...</span>
      </div>
    </div>
  ) : messageData?.content ? (
    <div>
      {/* Headers toggle button */}
      {isExpanded && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            setShowHeaders(!showHeaders)
          }}
          className="mb-8 text-xs text-gray-500 hover:text-gray-700 
            dark:text-gray-400 dark:hover:text-gray-300 flex items-center gap-1"
        >
          <i className={`bx ${showHeaders ? 'bx-chevron-down' : 'bx-chevron-right'}`} />
          {showHeaders ? 'Hide Headers' : 'Show Headers'}
        </button>
      )}

      {/* Show headers if requested */}
      {showHeaders && messageData?.fullContent && (
        <pre className="text-xs text-gray-600 dark:text-gray-400 bg-gray-50 
          dark:bg-gray-800/50 p-2 rounded mb-4 overflow-x-auto">
          {messageData.fullContent.split('\n\n')[0]}
        </pre>
      )}

      {/* Message content */}
      <div className={messageData.isHtml ? 
        'prose prose-sm dark:prose-invert max-w-none overflow-hidden' : 
        'whitespace-pre-line'
      }>
        {messageData.isHtml ? (
          showSource ? (
            <pre className="text-xs text-gray-600 dark:text-gray-400 bg-gray-50 
              dark:bg-gray-800/50 p-2 rounded overflow-x-auto whitespace-pre-wrap">
              {messageData.content}
            </pre>
          ) : (
            <div className="relative">
              <style dangerouslySetInnerHTML={{ __html: emailStyles }} />
              <div 
                dangerouslySetInnerHTML={{ __html: messageData.content }}
                className="email-content"
              />
            </div>
          )
        ) : (
          messageData.content
        )}
      </div>
    </div>
  ) : (
    <div className="text-gray-400">No message content</div>
  )

  // Mark as seen when expanded
  useEffect(() => {
    if (isExpanded && isUnread) {
      fetch(`/api/messages/${message.id}/seen`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          mailboxId: message.mailboxId
        })
      }).then(() => {
        setIsUnread(false)
      }).catch(error => {
        console.error('Error marking message as seen:', error)
      })
    }
  }, [isExpanded, isUnread, message.id, message.mailboxId])

  const formattedDate = new Date(message.date).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  })

  return (
    <>
      <div 
        onClick={() => !isExpanded && setIsExpanded(true)}
        className={`
          bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700
          ${!isExpanded ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-750' : ''}
          transition-all
          ${isExpanded ? 'p-6' : 'p-4'}
          ${isUnread ? 'border-l-4 border-l-blue-500' : ''}
        `}
      >
        {/* Header area (only clickable when expanded) */}
        <div 
          onClick={(e) => {
            if (isExpanded) {
              e.stopPropagation()
              setIsExpanded(false)
            }
          }}
          className={isExpanded ? 'cursor-pointer' : ''}
        >
          {viewMode === 'condensed' && !isExpanded ? (
            // Condensed view - single line with key info
            <div className="flex items-center gap-4 text-sm">
              <div className="flex-1 flex items-center gap-3">
                <span className={`font-medium truncate
                  ${isUnread 
                    ? 'text-gray-900 dark:text-white font-semibold' 
                    : 'text-gray-700 dark:text-gray-300'}`}
                >
                  {message.subject}
                </span>
                <span className="text-gray-500 dark:text-gray-400 truncate">
                  {message.from}
                </span>
              </div>
              <span className="text-gray-400 dark:text-gray-500 whitespace-nowrap">
                {formattedDate}
              </span>
            </div>
          ) : (
            // Header section of expanded/list view
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h3 className={`truncate
                  ${isUnread 
                    ? 'text-gray-900 dark:text-white font-semibold' 
                    : 'text-gray-700 dark:text-gray-300 font-medium'}`}
                >
                  {message.subject}
                </h3>
                <div className="mt-1 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                  <span className="truncate">{message.from}</span>
                  <span>•</span>
                  <span className="whitespace-nowrap">{formattedDate}</span>
                  {isExpanded && (
                    <>
                      <span>•</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setShowHeaders(!showHeaders)
                        }}
                        className="text-gray-500 hover:text-gray-700 
                          dark:text-gray-400 dark:hover:text-gray-300 
                          flex items-center gap-1"
                      >
                        <i className={`bx ${showHeaders ? 'bx-chevron-down' : 'bx-chevron-right'}`} />
                        {showHeaders ? 'Hide Headers' : 'Show Headers'}
                      </button>
                      <span>•</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setShowSource(!showSource)
                        }}
                        className="text-gray-500 hover:text-gray-700 
                          dark:text-gray-400 dark:hover:text-gray-300 
                          flex items-center gap-1"
                      >
                        <i className={`bx ${showSource ? 'bx-code-block' : 'bx-code'}`} />
                        {showSource ? 'Hide Source' : 'Show Source'}
                      </button>
                    </>
                  )}
                </div>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setIsReplyModalOpen(true)
                }}
                className="flex-shrink-0 p-1 text-sm text-gray-500 hover:text-gray-700
                  dark:text-gray-400 dark:hover:text-gray-300 hover:bg-gray-100 
                  dark:hover:bg-gray-700 rounded"
              >
                <i className="bx bx-reply text-lg" />
              </button>
            </div>
          )}
        </div>

        {/* Content area (not clickable for expand/collapse) */}
        {isExpanded && (
          <div className="mt-4">
            {/* Headers and content section - no click handler */}
            <div className="mb-4">
              {/* Show headers if requested */}
              {showHeaders && messageData?.fullContent && (
                <pre className="text-xs text-gray-600 dark:text-gray-400 bg-gray-50 
                  dark:bg-gray-800/50 p-2 rounded mb-4 overflow-x-auto">
                  {messageData.fullContent.split('\n\n')[0]}
                </pre>
              )}

              {/* Message content with loading state */}
              {isLoading ? (
                <div className="animate-pulse space-y-4">
                  {/* Loading header placeholder */}
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
                  
                  {/* Loading content placeholder - multiple lines */}
                  <div className="space-y-3">
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full" />
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-5/6" />
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-4/6" />
                  </div>

                  {/* Loading spinner */}
                  <div className="flex items-center gap-2 text-gray-400">
                    <i className="bx bx-loader-alt animate-spin" />
                    <span>Loading message...</span>
                  </div>
                </div>
              ) : (
                <div className={messageData.isHtml ? 
                  'prose prose-sm dark:prose-invert max-w-none overflow-hidden' : 
                  'whitespace-pre-line'
                }>
                  {messageData.isHtml ? (
                    showSource ? (
                      <pre className="text-xs text-gray-600 dark:text-gray-400 bg-gray-50 
                        dark:bg-gray-800/50 p-2 rounded overflow-x-auto whitespace-pre-wrap">
                        {messageData.content}
                      </pre>
                    ) : (
                      <div className="relative">
                        <style dangerouslySetInnerHTML={{ __html: emailStyles }} />
                        <div 
                          dangerouslySetInnerHTML={{ __html: messageData.content }}
                          className="email-content"
                        />
                      </div>
                    )
                  ) : (
                    messageData.content || <div className="text-gray-400">No message content</div>
                  )}
                </div>
              )}
            </div>

            {/* Collapsible bottom area */}
            <div 
              onClick={() => setIsExpanded(false)}
              className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 
                cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-750 -mx-6 -mb-8 px-6 pb-6
                flex items-center justify-center text-sm text-blue-500 hover:text-blue-600 
                dark:text-blue-400 dark:hover:text-blue-300"
            >
              <span>Show less</span>
            </div>
          </div>
        )}
      </div>

      <ReplyModal
        isOpen={isReplyModalOpen}
        onClose={() => setIsReplyModalOpen(false)}
        originalMessage={message}
        mailbox={mailbox}
      />
    </>
  )
} 