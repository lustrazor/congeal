'use client'
import { Message, Mailbox } from '@/types'
import { useTranslations } from '@/hooks/useTranslations'

interface MessageModalProps {
  isOpen: boolean
  onClose: () => void
  message: Message
  mailbox?: Mailbox
}

export default function MessageModal({ isOpen, onClose, message, mailbox }: MessageModalProps) {
  const { t } = useTranslations()
  
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />
        
        <div className="relative transform overflow-hidden rounded-lg bg-white dark:bg-gray-800 
          text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-4xl">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                {message.subject}
              </h3>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
                <i className="bx bx-x text-2xl" />
              </button>
            </div>
            <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {message.from} • {new Date(message.date).toLocaleString()}
            </div>
          </div>

          {/* Body */}
          <div className="px-6 py-4">
            <div className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-line">
              {message.body || t('noMessageContent')}
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex justify-end gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white dark:bg-gray-800 
                  dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg 
                  hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                {t('close')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 