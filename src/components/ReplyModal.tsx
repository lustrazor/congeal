'use client'
import { useState } from 'react'
import { Message, Mailbox } from '@/types'
import Modal from './ui/Modal'
import { useDebugStore } from '@/stores/debugStore'

interface ReplyModalProps {
  isOpen: boolean
  onClose: () => void
  originalMessage: Message
  mailbox?: Mailbox
}

export default function ReplyModal({ 
  isOpen, 
  onClose, 
  originalMessage, 
  mailbox 
}: ReplyModalProps) {
  const [replyText, setReplyText] = useState('')
  const [isSending, setIsSending] = useState(false)
  const debugStore = useDebugStore()

  const handleSend = async () => {
    if (!replyText.trim()) return

    try {
      setIsSending(true)
      const startTime = Date.now()

      const response = await fetch('/api/messages/reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originalMessageId: originalMessage.id,
          mailboxId: mailbox?.id,
          body: replyText,
          subject: `Re: ${originalMessage.subject}`,
          to: originalMessage.from
        })
      })

      if (!response.ok) throw new Error('Failed to send reply')

      const { debug } = await response.json()
      const duration = Date.now() - startTime

      debugStore.setCommandLog({
        command: 'POST /api/messages/reply',
        response: {
          status: 'success',
          duration: debug.duration,
          query: debug.query,
          clientDuration: `${duration}ms`
        }
      })

      onClose()
    } catch (error) {
      console.error('Error sending reply:', error)
      debugStore.setCommandLog({
        command: 'POST /api/messages/reply',
        response: {
          status: 'error',
          error: error instanceof Error ? error.message : 'Failed to send reply'
        }
      })
    } finally {
      setIsSending(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Reply">
      <div className="space-y-4">
        {/* Original message info */}
        <div className="text-sm text-gray-500 dark:text-gray-400">
          <div>From: {originalMessage.from}</div>
          <div>Subject: {originalMessage.subject}</div>
          <div>Date: {new Date(originalMessage.date).toLocaleString()}</div>
        </div>

        {/* Reply text area */}
        <textarea
          value={replyText}
          onChange={(e) => setReplyText(e.target.value)}
          placeholder="Type your reply..."
          rows={6}
          className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-800 
            border border-gray-300 dark:border-gray-600 rounded-md
            focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-700 dark:text-gray-200
              hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={isSending || !replyText.trim()}
            className="px-4 py-2 text-sm text-white bg-blue-600 
              hover:bg-blue-700 rounded-md disabled:opacity-50
              disabled:cursor-not-allowed"
          >
            {isSending ? 'Sending...' : 'Send Reply'}
          </button>
        </div>
      </div>
    </Modal>
  )
} 