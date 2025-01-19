'use client'
import { useDebugStore } from '@/stores/debugStore'
import { useState } from 'react'

export default function Footer() {
  const debugStore = useDebugStore()
  const [isExpanded, setIsExpanded] = useState(false)

  // Early return if debug mode disabled
  if (!debugStore.isEnabled) {
    return null
  }

  // Expanded view
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-900 text-white z-50 max-h-[50vh] overflow-hidden">
      {/* Header bar */}
      <div 
        className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="text-sm text-gray-400">
          Debug Info {debugStore.isLoading ? '(Loading...)' : ''}
        </div>
        <div className="text-sm text-gray-400">
          {isExpanded ? '▼' : '▲'}
        </div>
      </div>

      {/* Scrollable content */}
      {isExpanded && (
        <div className="overflow-y-auto" style={{ maxHeight: 'calc(50vh - 40px)' }}>
          <div className="grid grid-cols-2 gap-4 p-4">
            {/* Command Log panel */}
            <div>
              <h3 className="text-sm font-semibold mb-2 text-gray-300">Command</h3>
              <pre className="text-xs text-blue-400 bg-gray-800/50 p-2 rounded overflow-auto max-h-[200px] whitespace-pre-wrap">
                {debugStore.logs.join('\n')}
              </pre>
            </div>

            {/* Response Log panel */}
            <div>
              <h3 className="text-sm font-semibold mb-2 text-gray-300">Response</h3>
              <pre className="text-xs text-purple-400 bg-gray-800/50 p-2 rounded overflow-auto max-h-[200px] whitespace-pre-wrap">
                {debugStore.responseLog || 'No response'}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 