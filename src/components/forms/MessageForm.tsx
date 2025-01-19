'use client'
import { useState } from 'react'
import { Message, Status } from '@/types'
import { useDebugStore } from '@/stores/debugStore'
import { useTranslations } from '@/hooks/useTranslations'
import { useMailboxes } from '@/hooks/useMailboxes'
import IconSelector from '@/components/IconSelector'

interface MessageFormProps {
  editMessage?: Message | null
  defaultMailboxId?: number | null
  onClose: () => void
  mutate: () => void
}

interface ValidationErrors {
  subject?: string
  body?: string
  mailboxId?: string
}

interface MessageFormData {
  subject: string
  body: string
  status: Status
  mailboxId: number | null
  iconName: IconName
}

export default function MessageForm({ 
  editMessage, 
  defaultMailboxId,
  onClose, 
  mutate 
}: MessageFormProps) {
  const { t } = useTranslations()
  const { mailboxes } = useMailboxes()
  const debugStore = useDebugStore()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<ValidationErrors>({})

  const [formData, setFormData] = useState<MessageFormData>({
    subject: editMessage?.subject || '',
    body: editMessage?.body || '',
    status: editMessage?.status || 'gray',
    mailboxId: editMessage?.mailboxId || defaultMailboxId || null,
    iconName: editMessage?.iconName || 'envelope'
  })

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {}

    if (!formData.subject.trim()) {
      newErrors.subject = t('subjectRequired')
    } else if (formData.subject.length > 200) {
      newErrors.subject = t('subjectTooLong')
    }

    if (!formData.body.trim()) {
      newErrors.body = t('bodyRequired')
    } else if (formData.body.length > 5000) {
      newErrors.body = t('bodyTooLong')
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    try {
      // Format the data with proper types
      const formattedData = {
        subject: formData.subject,
        body: formData.body,
        status: formData.status,
        mailboxId: formData.mailboxId ? Number(formData.mailboxId) : null,
        iconName: formData.iconName
      }

      const response = await fetch(
        editMessage ? `/api/messages/${editMessage.id}` : '/api/messages', 
        {
          method: editMessage ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formattedData)
        }
      )

      if (!response.ok) throw new Error('Failed to save message')
      
      const data = await response.json()
      debugStore.setResponseLog(data)
      
      onClose()
      mutate()
    } catch (error) {
      console.error('Error saving message:', error)
      debugStore.setResponseLog({ error: String(error) })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Subject field */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {t('subject')}
        </label>
        <input
          type="text"
          value={formData.subject}
          onChange={(e) => {
            const value = e.target.value.slice(0, 200)
            setFormData(prev => ({ ...prev, subject: value }))
          }}
          className={`mt-1 block w-full rounded-md 
            border ${errors.subject ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}
            bg-white dark:bg-gray-800 px-3 py-2 text-sm 
            focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500`}
          required
          maxLength={200}
        />
        {errors.subject && (
          <p className="mt-1 text-sm text-red-500">{errors.subject}</p>
        )}
      </div>

      {/* Body field */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {t('body')}
        </label>
        <textarea
          value={formData.body}
          onChange={(e) => {
            const value = e.target.value.slice(0, 5000)
            setFormData(prev => ({ ...prev, body: value }))
          }}
          rows={4}
          className={`mt-1 block w-full rounded-md 
            border ${errors.body ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}
            bg-white dark:bg-gray-800 px-3 py-2 text-sm 
            focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500`}
          maxLength={5000}
        />
        {errors.body && (
          <p className="mt-1 text-sm text-red-500">{errors.body}</p>
        )}
        <p className="mt-1 text-sm text-gray-500">
          {formData.body.length}/5000
        </p>
      </div>

      {/* Status selector */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {t('status')}
        </label>
        <select
          value={formData.status}
          onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as Status }))}
          className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 
            bg-white dark:bg-gray-800 px-3 py-2 text-sm 
            focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="gray">{t('statusGray')}</option>
          <option value="red">{t('statusRed')}</option>
          <option value="yellow">{t('statusYellow')}</option>
          <option value="green">{t('statusGreen')}</option>
          <option value="blue">{t('statusBlue')}</option>
          <option value="purple">{t('statusPurple')}</option>
        </select>
      </div>

      {/* Mailbox selector */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {t('mailbox')}
        </label>
        <select
          value={formData.mailboxId || ''}
          onChange={(e) => setFormData(prev => ({ 
            ...prev, 
            mailboxId: e.target.value ? Number(e.target.value) : null 
          }))}
          className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 
            bg-white dark:bg-gray-800 px-3 py-2 text-sm 
            focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="">{t('noMailbox')}</option>
          {mailboxes?.filter(m => !m.isDivider).map(mailbox => (
            <option key={mailbox.id} value={mailbox.id}>
              {mailbox.name}
            </option>
          ))}
        </select>
      </div>

      {/* Icon selector */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {t('icon')}
        </label>
        <IconSelector
          selectedIcon={formData.iconName}
          onSelect={(iconName) => setFormData(prev => ({ ...prev, iconName }))}
        />
      </div>

      {/* Form actions */}
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 
            bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 
            rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
        >
          {t('cancel')}
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-500 
            rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 
            focus:ring-offset-2 focus:ring-blue-500"
        >
          {isSubmitting ? t('saving') : editMessage ? t('save') : t('create')}
        </button>
      </div>
    </form>
  )
} 