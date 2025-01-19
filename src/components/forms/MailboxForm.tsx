'use client'
import { useState, useEffect } from 'react'
import { useDebugStore } from '@/stores/debugStore'
import { useTranslations } from '@/hooks/useTranslations'
import IconSelector from '@/components/IconSelector'
import type { IconName } from '@/types'
import { useGoogleAuth } from '@/hooks/useGoogleAuth'
import { useOutlookAuth } from '@/hooks/useOutlookAuth'
import { useToast } from '@/hooks/useToast'
import { useSettings } from '@/hooks/useSettings'
import Link from 'next/link'

interface MailboxFormProps {
  editMailbox?: {
    id: number
    name: string
    iconName?: string
    iconColor?: string
    email?: string
    imapHost?: string
    imapPort?: number
    username?: string
    password?: string
  } | null
  onClose: () => void
  onMailboxesChange?: () => void
}

// Add Google logo SVG component
const GoogleLogo = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 48 48">
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
    <path fill="none" d="M0 0h48v48H0z"/>
  </svg>
)

// Add Outlook logo SVG component
const OutlookLogo = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 48 48">
    <path fill="#0A2767" d="M45.4 15.5l-21.8-4.5v26.8l21.8 4.5z"/>
    <path fill="#28A8EA" d="M2.6 39.3l21 7V19.5l-21-7z"/>
    <path fill="#0364B8" d="M2.6 8.7l21 7 21.8-4.5L24.6 1.5z"/>
    <path fill="#14447D" d="M23.6 19.5L45.4 15v24.8l-21.8-4.5z"/>
    <path fill="#0078D4" d="M2.6 8.7v30.6l21-4.5V15.7z"/>
  </svg>
)

interface ValidationErrors {
  name?: string
  email?: string
  imapHost?: string
  imapPort?: string
  username?: string
  password?: string
}

interface MailboxFormData {
  name: string
  email: string
  iconName: IconName | undefined
  iconColor: 'gray' | 'red' | 'yellow' | 'green' | 'blue' | 'purple'
  imapHost: string
  imapPort: number
  username: string
  password: string
  useSSL: boolean
  useOAuth: boolean
}

export default function MailboxForm({ editMailbox, onClose, onMailboxesChange }: MailboxFormProps) {
  const { t } = useTranslations()
  const debugStore = useDebugStore()
  const toast = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [testingConnection, setTestingConnection] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'none' | 'success' | 'error'>('none')
  const [isImapExpanded, setIsImapExpanded] = useState(false)
  const [isIconExpanded, setIsIconExpanded] = useState(false)
  const [provider, setProvider] = useState<'imap' | 'gmail' | 'outlook'>(
    editMailbox?.imapHost?.includes('gmail.com') ? 'gmail' :
    editMailbox?.imapHost?.includes('outlook.com') ? 'outlook' : 
    'imap'
  )
  const { signIn: signInGoogle, isSignedIn: isGoogleSignedIn, email: googleEmail } = useGoogleAuth()
  const { signIn: signInOutlook, isSignedIn: isOutlookSignedIn, email: outlookEmail } = useOutlookAuth()
  const { settings } = useSettings()
  const [errors, setErrors] = useState<ValidationErrors>({})

  const [formData, setFormData] = useState<MailboxFormData>({
    name: editMailbox?.name || '',
    email: editMailbox?.email || '',
    iconName: editMailbox?.iconName as IconName | undefined,
    iconColor: (editMailbox?.iconColor || 'gray') as MailboxFormData['iconColor'],
    imapHost: editMailbox?.imapHost || '',
    imapPort: editMailbox?.imapPort || 993,
    username: editMailbox?.username || '',
    password: editMailbox?.password || '',
    useSSL: true,
    useOAuth: provider === 'gmail'
  })

  useEffect(() => {
    if (provider === 'gmail') {
      setFormData(prev => ({
        ...prev,
        imapHost: 'imap.gmail.com',
        imapPort: 993,
        useSSL: true,
        useOAuth: true,
        email: googleEmail || prev.email,
        username: googleEmail || prev.username
      }))
    } else if (provider === 'outlook') {
      setFormData(prev => ({
        ...prev,
        imapHost: 'outlook.office365.com',
        imapPort: 993,
        useSSL: true,
        useOAuth: true,
        email: outlookEmail || prev.email,
        username: outlookEmail || prev.username
      }))
    }
  }, [provider, googleEmail, outlookEmail])

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {}

    // Validate name
    if (!formData.name.trim()) {
      newErrors.name = t('nameRequired')
    } else if (formData.name.length > 50) {
      newErrors.name = t('nameTooLong')
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!formData.email.trim()) {
      newErrors.email = t('emailRequired')
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = t('invalidEmail')
    }

    // Validate IMAP settings if not using OAuth
    if (!formData.useOAuth) {
      if (!formData.imapHost.trim()) {
        newErrors.imapHost = t('imapHostRequired')
      }

      if (!formData.imapPort || formData.imapPort < 1 || formData.imapPort > 65535) {
        newErrors.imapPort = t('invalidPort')
      }

      if (!formData.username.trim()) {
        newErrors.username = t('usernameRequired')
      }

      if (!formData.password.trim()) {
        newErrors.password = t('passwordRequired')
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleTestConnection = async () => {
    setTestingConnection(true)
    setConnectionStatus('none')

    try {
      const response = await fetch('/api/mailbox/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          imapHost: formData.imapHost,
          imapPort: formData.imapPort,
          username: formData.username,
          password: formData.password
        })
      })

      const data = await response.json()

      if (data.success) {
        setConnectionStatus('success')
        toast.success(t('connectionSuccess'))
      } else {
        setConnectionStatus('error')
        toast.error(t('connectionError'))
      }
    } catch (error) {
      setConnectionStatus('error')
      toast.error(t('connectionError'))
    } finally {
      setTestingConnection(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/mailboxes' + (editMailbox ? `/${editMailbox.id}` : ''), {
        method: editMailbox ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          iconName: formData.iconName || 'bx-envelope',
          iconColor: formData.iconColor || 'gray',
        })
      })

      if (!response.ok) {
        throw new Error('Failed to save mailbox')
      }

      const savedMailbox = await response.json()
      toast.success(editMailbox ? t('mailboxUpdated') : t('mailboxCreated'))
      
      // Call onMailboxesChange with the saved mailbox data
      onMailboxesChange?.(savedMailbox)
      onClose()
    } catch (error) {
      console.error('Failed to save mailbox:', error)
      toast.error(t('errorSavingMailbox'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Info Section */}
      <div className="space-y-4">
        <h3 className="font-medium text-gray-900 dark:text-gray-100">
          {t('basicInfo')}
        </h3>

        {/* Display name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {t('displayName')}
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => {
              const value = e.target.value.slice(0, 50)
              setFormData(prev => ({ ...prev, name: value }))
            }}
            className={`mt-1 block w-full rounded-md 
              border ${errors.name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}
              bg-white dark:bg-gray-800 px-3 py-2 text-sm 
              focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500`}
            required
            maxLength={50}
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-500">{errors.name}</p>
          )}
        </div>

        {/* Email address */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {t('emailAddress')}
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            className={`mt-1 block w-full rounded-md 
              border ${errors.email ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}
              bg-white dark:bg-gray-800 px-3 py-2 text-sm 
              focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500`}
            required
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-500">{errors.email}</p>
          )}
        </div>
      </div>

      {/* Server Settings Section */}
      <div className="border dark:border-gray-700 rounded-lg overflow-hidden">
        {/* Header */}
        <button
          type="button"
          onClick={() => setIsImapExpanded(!isImapExpanded)}
          className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 dark:bg-gray-800/50 
            hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <div className="flex items-center gap-2">
            <h3 className="font-medium text-gray-900 dark:text-gray-100">
              {t('serverSettings')}
            </h3>
            {connectionStatus === 'success' && (
              <span className="text-sm text-green-500">
                <i className="bx bx-check-circle" />
              </span>
            )}
          </div>
          <i className={`bx bx-chevron-${isImapExpanded ? 'up' : 'down'} text-gray-400`} />
        </button>

        <div className={`transition-all duration-200 ease-in-out
          ${isImapExpanded ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}
          overflow-hidden`}
        >
          <div className="p-4 space-y-4 bg-white dark:bg-gray-900">
            {/* Provider Selection */}
            <div>
              <h3 className="text-base font-medium text-gray-900 dark:text-white">
                {t('emailProvider')}
              </h3>
              
              {/* Provider Buttons */}
              <div className="flex flex-wrap gap-2">
                {/* IMAP is always enabled */}
                <button
                  type="button"
                  onClick={() => setProvider('imap')}
                  className={`
                    px-4 py-2 rounded-md text-sm font-medium
                    ${provider === 'imap' 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-gray-100'
                    }
                  `}
                >
                  IMAP
                </button>

                {/* Google button - disabled if not enabled in settings */}
                <button
                  type="button"
                  onClick={() => setProvider('gmail')}
                  disabled={!settings?.google_enabled}
                  className={`
                    px-4 py-2 rounded-md text-sm font-medium
                    ${provider === 'gmail' 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-gray-100'
                    }
                    ${!settings?.google_enabled && 'opacity-50 cursor-not-allowed'}
                  `}
                >
                  Google
                </button>

                {/* Outlook button - disabled if not enabled in settings */}
                <button
                  type="button"
                  onClick={() => setProvider('outlook')}
                  disabled={!settings?.outlook_enabled}
                  className={`
                    px-4 py-2 rounded-md text-sm font-medium
                    ${provider === 'outlook' 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-gray-100'
                    }
                    ${!settings?.outlook_enabled && 'opacity-50 cursor-not-allowed'}
                  `}
                >
                  Outlook
                </button>
              </div>

              {/* Info message about enabling providers */}
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                {t('providerSettingsHintPrefix')}{' '}
                <Link 
                  href="/settings" 
                  className="text-blue-500 dark:text-blue-400 hover:underline"
                >
                  {t('settings')}
                </Link>
              </p>

              {/* Provider-specific content */}
              {provider === 'gmail' && !settings?.google_enabled && (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t('googleNotEnabled')}
                </p>
              )}

              {provider === 'outlook' && !settings?.outlook_enabled && (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t('outlookNotEnabled')}
                </p>
              )}
            </div>

            {/* OAuth or IMAP Fields */}
            {provider === 'gmail' ? (
              <div className="space-y-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t('gmailOAuthDescription')}
                </p>
                <button
                  type="button"
                  onClick={signInGoogle}
                  className="w-full flex items-center justify-center gap-3 px-4 py-2.5
                    bg-white hover:bg-gray-50 dark:bg-white dark:hover:bg-gray-50
                    text-gray-600 font-medium text-sm
                    border border-gray-300 rounded-md
                    transition-colors duration-200 ease-in-out
                    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                  >
                    <GoogleLogo />
                    {isGoogleSignedIn 
                      ? t('connectedToGoogle', { email: googleEmail })
                      : t('signInWithGoogle')
                    }
                  </button>
              </div>
            ) : provider === 'outlook' ? (
              <div className="space-y-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t('outlookOAuthDescription')}
                </p>
                <button
                  type="button"
                  onClick={signInOutlook}
                  className="w-full flex items-center justify-center gap-3 px-4 py-2.5
                    bg-white hover:bg-gray-50 dark:bg-white dark:hover:bg-gray-50
                    text-gray-600 font-medium text-sm
                    border border-gray-300 rounded-md
                    transition-colors duration-200 ease-in-out
                    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                  >
                    <OutlookLogo />
                    {isOutlookSignedIn 
                      ? t('connectedToOutlook', { email: outlookEmail })
                      : t('signInWithOutlook')
                    }
                  </button>
              </div>
            ) : (
              <>
                {/* IMAP fields */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('imapHost')}
                  </label>
                  <input
                    type="text"
                    value={formData.imapHost}
                    onChange={(e) => setFormData(prev => ({ ...prev, imapHost: e.target.value }))}
                    className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 
                      bg-white dark:bg-gray-800 px-3 py-2 text-sm 
                      focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="imap.example.com"
                    required={isImapExpanded}
                  />
                  <p className="mt-1 text-sm text-gray-500">{t('imapHostHint')}</p>
                </div>

                {/* IMAP Port */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('imapPort')}
                  </label>
                  <input
                    type="number"
                    value={formData.imapPort}
                    onChange={(e) => setFormData(prev => ({ ...prev, imapPort: parseInt(e.target.value) }))}
                    className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 
                      bg-white dark:bg-gray-800 px-3 py-2 text-sm 
                      focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="993"
                    required={isImapExpanded}
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    {t('imapPortHint')}
                  </p>
                </div>

                {/* Username */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('username')}
                  </label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                    className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 
                      bg-white dark:bg-gray-800 px-3 py-2 text-sm 
                      focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder={t('usernamePlaceholder')}
                    required={isImapExpanded}
                  />
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('password')}
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 
                      bg-white dark:bg-gray-800 px-3 py-2 text-sm 
                      focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="••••••••"
                    required={isImapExpanded}
                  />
                </div>
              </>
            )}

            {/* Test Connection Button */}
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={testingConnection || 
                (provider === 'gmail' && !isGoogleSignedIn) || 
                (provider === 'outlook' && !isOutlookSignedIn)}
              className="w-full px-4 py-2 text-sm font-medium text-white bg-green-500 
                rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 
                focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
            >
              {testingConnection ? t('testingConnection') : t('testConnection')}
            </button>

            {/* Connection Status */}
            {connectionStatus !== 'none' && (
              <div className={`text-sm ${
                connectionStatus === 'success' ? 'text-green-500' : 'text-red-500'
              }`}>
                {connectionStatus === 'success' 
                  ? t('connectionSuccess')
                  : t('connectionError')
                }
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Icon and Color Section */}
      <div className="border dark:border-gray-700 rounded-lg overflow-hidden">
        {/* Icon Header */}
        <button
          type="button"
          onClick={() => setIsIconExpanded(!isIconExpanded)}
          className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 dark:bg-gray-800/50 
            hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <div className="flex items-center gap-3">
            <h3 className="font-medium text-gray-900 dark:text-gray-100">
              {t('appearance')}
            </h3>
            {/* Preview of selected icon */}
            {formData.iconName && (
              <div className={`
                w-6 h-6 rounded flex items-center justify-center
                bg-${formData.iconColor}-500
              `}>
                <i className={`bx bxs-${formData.iconName} text-white`} />
              </div>
            )}
          </div>
          <i className={`bx bx-chevron-${isIconExpanded ? 'up' : 'down'} text-gray-400`} />
        </button>

        {/* Icon Content */}
        <div className={`
          transition-all duration-200 ease-in-out
          ${isIconExpanded 
            ? 'max-h-[1000px] opacity-100' 
            : 'max-h-0 opacity-0'
          } overflow-hidden
        `}>
          <div className="p-4 space-y-4 bg-white dark:bg-gray-900">
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

            {/* Color selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('iconColor')}
              </label>
              <div className="grid grid-cols-6 gap-2">
                {[
                  { value: 'gray', label: t('colorGray') },
                  { value: 'red', label: t('colorRed') },
                  { value: 'yellow', label: t('colorYellow') },
                  { value: 'green', label: t('colorGreen') },
                  { value: 'blue', label: t('colorBlue') },
                  { value: 'purple', label: t('colorPurple') }
                ].map(color => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, iconColor: color.value }))}
                    className={`
                      relative p-2 rounded-lg border-2 transition-all
                      ${formData.iconColor === color.value 
                        ? `border-${color.value}-500 bg-${color.value}-50 dark:bg-${color.value}-900/20` 
                        : 'border-transparent hover:border-gray-200 dark:hover:border-gray-700'
                      }
                    `}
                    title={color.label}
                  >
                    <div className={`
                      h-6 w-full rounded
                      bg-${color.value}-500
                      ${formData.iconColor === color.value 
                        ? 'ring-2 ring-offset-2 ring-offset-white dark:ring-offset-gray-800' 
                        : ''
                      }
                    `} />
                    {formData.iconColor === color.value && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <i className="bx bx-check text-white text-xl" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
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
          {isSubmitting ? t('saving') : editMailbox ? t('save') : t('create')}
        </button>
      </div>
    </form>
  )
} 