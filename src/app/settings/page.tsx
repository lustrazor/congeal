'use client'
import { useState, useEffect, useRef } from 'react'
import { useDebugStore } from '@/stores/debugStore'
import { useSettings } from '@/hooks/useSettings'
import Header from '@/components/Header'
import Modal from '@/components/ui/Modal'
import { translations, Language } from '@/lib/translations'
import { useTranslations } from '@/hooks/useTranslations'
import { useGroups } from '@/hooks/useGroups'
import Toggle from '@/components/ui/Toggle'
import { Switch } from '@/components/ui/Switch'
import { toast } from 'react-hot-toast'
import FloatingDueItems from '@/components/FloatingDueItems'
import { Item } from '@/types'
import useSWR from 'swr'
import { mutate as globalMutate } from 'swr'
import { useRouter } from 'next/navigation'
import { Toaster } from 'react-hot-toast'

const fetcher = (url: string) => fetch(url).then(res => res.json())

export default function SettingsPage() {
  const { t } = useTranslations()
  const { settings, mutate, updateSettings } = useSettings()
  const { data: dueItems } = useSWR<Item[]>('/api/items', fetcher)
  const [title, setTitle] = useState('')
  const [tagline, setTagline] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isRestoring, setIsRestoring] = useState(false)
  const [restoreMessage, setRestoreMessage] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)
  const [language, setLanguage] = useState<Language>(
    (settings?.language as Language) || 'en'
  )
  const { groups, mutate: mutateGroups } = useGroups()
  const [selectedSound, setSelectedSound] = useState<File | null>(null)
  const debugStore = useDebugStore()
  const [isCreatingSnapshot, setIsCreatingSnapshot] = useState(false)
  const [snapshots, setSnapshots] = useState<{ id: string, createdAt: string }[]>([])
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [headerImage, setHeaderImage] = useState<File | null>(null)
  const [headerImagePreview, setHeaderImagePreview] = useState<string>('')
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [username, setUsername] = useState('')
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isVerifying, setIsVerifying] = useState(false)
  const router = useRouter()
  const [isFactoryResetModalOpen, setIsFactoryResetModalOpen] = useState(false)
  const [factoryResetPassword, setFactoryResetPassword] = useState('')
  const [factoryResetError, setFactoryResetError] = useState('')
  const [isResetting, setIsResetting] = useState(false)
  const [passwordSuccess, setPasswordSuccess] = useState(false)
  const [uploadError, setUploadError] = useState<string>('')
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Initialize form state when settings load
  useEffect(() => {
    if (settings) {
      setTitle(settings.title || '')
      setTagline(settings.tagline || '')
    }
  }, [settings])

  // Load snapshots on mount
  useEffect(() => {
    loadSnapshots()
  }, [])

  // Add useEffect to load username
  useEffect(() => {
    const loadUsername = async () => {
      try {
        const response = await fetch('/api/auth/user')
        const data = await response.json()
        if (response.ok) {
          setUsername(data.username)
        }
      } catch (error) {
        console.error('Failed to load username:', error)
      }
    }
    loadUsername()
  }, [])

  const saveSettings = async (newSettings: Partial<typeof settings>) => {
    try {
      const response = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings)
      })

      if (!response.ok) throw new Error('Failed to update settings')
      const data = await response.json()
      await mutate(data)
      return data
    } catch (error) {
      console.error('Failed to update settings:', error)
      throw error
    }
  }

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    try {
      debugStore.log('Updating settings', {
        type: 'UPDATE_SETTINGS',
        data: { 
          title, 
          tagline,
          debugMode: settings?.debugMode,
          showPrivateGroups: settings?.showPrivateGroups,
          headerEnabled: settings?.headerEnabled
        }
      })

      const response = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          title, 
          tagline,
          debugMode: settings?.debugMode,
          showPrivateGroups: settings?.showPrivateGroups,
          headerEnabled: settings?.headerEnabled
        })
      })

      if (!response.ok) throw new Error('Failed to update settings')
      const data = await response.json()
      
      debugStore.log('Settings updated successfully', data)
      await mutate(data)
    } catch (error) {
      console.error('Failed to update settings:', error)
      debugStore.log('Settings update failed', { error: String(error) })
    } finally {
      setIsSaving(false)
    }
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordError('')
    debugStore.log('Password change started', {
      type: 'PASSWORD_CHANGE_START',
      data: { username }
    })

    // Password validation
    if (newPassword.length < 12) {
      const error = 'Password must be at least 12 characters long'
      debugStore.log('Password validation failed', {
        type: 'PASSWORD_VALIDATION_ERROR',
        error
      })
      setPasswordError(error)
      return
    }
    
    const hasLowerCase = /[a-z]/.test(newPassword)
    const hasUpperCase = /[A-Z]/.test(newPassword)
    const hasNumber = /\d/.test(newPassword)
    const hasSpecialChar = /[!#$%&_-]/.test(newPassword)

    if (!hasLowerCase) {
      setPasswordError('Password must include at least one lowercase letter')
      return
    }
    if (!hasUpperCase) {
      setPasswordError('Password must include at least one uppercase letter')
      return
    }
    if (!hasNumber) {
      setPasswordError('Password must include at least one number')
      return
    }
    if (!hasSpecialChar) {
      setPasswordError('Password must include at least one special character (!#$%&_-)')
      return
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match')
      return
    }

    try {
      // First verify the current password
      debugStore.log('Verifying current password', {
        type: 'PASSWORD_VERIFY_START'
      })
      
      const verifyResponse = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: currentPassword })
      })

      const verifyData = await verifyResponse.json()
      debugStore.log('Verify response received', {
        type: 'PASSWORD_VERIFY_RESPONSE',
        status: verifyResponse.status,
        ok: verifyResponse.ok,
        data: verifyData
      })

      if (!verifyResponse.ok) {
        setPasswordError('Current password is incorrect')
        return
      }

      // Then change the password
      debugStore.log('Sending password change request', {
        type: 'PASSWORD_CHANGE_REQUEST'
      })

      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          username
        })
      })

      const changeData = await response.json()
      debugStore.log('Change password response', {
        type: 'PASSWORD_CHANGE_RESPONSE',
        status: response.status,
        ok: response.ok,
        data: changeData
      })

      if (!response.ok) {
        const error = changeData.error || 'Failed to change password'
        throw new Error(error)
      }
      
      // Clear form and show success message
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setPasswordError('')
      setPasswordSuccess(true)
      setTimeout(() => setPasswordSuccess(false), 4000)

      debugStore.log('Password change successful', {
        type: 'PASSWORD_CHANGE_SUCCESS'
      })

    } catch (error) {
      console.error('Password change failed:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to change password'
      setPasswordError(errorMessage)
      debugStore.log('Password change failed', {
        type: 'PASSWORD_CHANGE_ERROR',
        error: errorMessage
      })
    }
  }

  const loadSnapshots = async () => {
    try {
      const response = await fetch('/api/snapshots')
      const data = await response.json()
      if (!response.ok) throw new Error('Failed to load snapshots')
      setSnapshots(data)
    } catch (error) {
      console.error('Error loading snapshots:', error)
    }
  }

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST'
      })
      if (!response.ok) throw new Error('Logout failed')
      window.location.href = '/login'
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  const handleToggleSetting = async (setting: string, value: boolean) => {
    try {
      const response = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [setting]: value })
      })

      if (!response.ok) throw new Error('Failed to update setting')
      const data = await response.json()
      await mutate(data)
    } catch (error) {
      console.error('Failed to update setting:', error)
    }
  }

  const handleFactoryReset = async () => {
    setFactoryResetError('')
    setIsFactoryResetModalOpen(true)
  }

  const handleFactoryResetConfirm = async () => {
    setFactoryResetError('')

    // Password validation
    if (factoryResetPassword.length < 12) {
      setFactoryResetError('Password must be at least 12 characters long')
      return
    }
    
    const hasLowerCase = /[a-z]/.test(factoryResetPassword)
    const hasUpperCase = /[A-Z]/.test(factoryResetPassword)
    const hasNumber = /\d/.test(factoryResetPassword)
    const hasSpecialChar = /[!#$%&_-]/.test(factoryResetPassword)

    if (!hasLowerCase) {
      setFactoryResetError('Password must include at least one lowercase letter')
      return
    }
    if (!hasUpperCase) {
      setFactoryResetError('Password must include at least one uppercase letter')
      return
    }
    if (!hasNumber) {
      setFactoryResetError('Password must include at least one number')
      return
    }
    if (!hasSpecialChar) {
      setFactoryResetError('Password must include at least one special character (!#$%&_-)')
      return
    }

    setIsResetting(true)
    try {
      debugStore.log('Starting factory reset', {
        type: 'FACTORY_RESET_START',
        data: { timestamp: new Date().toISOString() }
      })

      // Send password directly to factory reset endpoint
      const response = await fetch('/api/auth/factory-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: factoryResetPassword })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to reset application')
      }

      debugStore.log('Factory reset completed', {
        type: 'FACTORY_RESET_SUCCESS',
        data: { timestamp: new Date().toISOString() }
      })

      // Close modal and redirect
      setIsFactoryResetModalOpen(false)
      router.push('/setup')
    } catch (error) {
      console.error('Factory reset failed:', error)
      setFactoryResetError(
        error instanceof Error ? error.message : 'Failed to reset application'
      )
      debugStore.log('Factory reset failed', {
        type: 'FACTORY_RESET_ERROR',
        error: error instanceof Error ? error.message : String(error),
        data: { timestamp: new Date().toISOString() }
      })
    } finally {
      setIsResetting(false)
      setFactoryResetPassword('')
    }
  }

  const handleHeaderImageUpload = async (file: File) => {
    setIsUploadingImage(true)
    try {
      const formData = new FormData()
      formData.append('image', file)
      
      const response = await fetch('/api/settings/header', {
        method: 'POST',
        body: formData
      })
      
      if (!response.ok) throw new Error('Failed to upload image')
      const data = await response.json()
      await mutate(data)
    } catch (error) {
      console.error('Failed to upload image:', error)
    } finally {
      setIsUploadingImage(false)
      setHeaderImage(null)
      setHeaderImagePreview('')
    }
  }

  const handlePrivateGroupsToggle = async () => {
    if (!settings?.showPrivateGroups) {
      // Opening private groups requires password
      setIsPasswordModalOpen(true)
    } else {
      // Turning off private groups doesn't need verification
      try {
        const response = await fetch('/api/settings', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ showPrivateGroups: false })
        })

        if (!response.ok) throw new Error('Failed to update settings')
        await mutate()
      } catch (error) {
        console.error('Failed to update settings:', error)
      }
    }
  }

  const handlePasswordConfirm = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsVerifying(true)

    try {
      // Verify password
      const response = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      })

      if (!response.ok) {
        throw new Error('Invalid password')
      }

      // Password verified, update settings
      await saveSettings({ showPrivateGroups: true })
      setIsPasswordModalOpen(false)
      setPassword('')
    } catch (error) {
      setError('Invalid password')
    } finally {
      setIsVerifying(false)
    }
  }

  const handleLanguageChange = async (newLanguage: Language) => {
    try {
      setIsSaving(true)
      const response = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          ...settings,
          language: newLanguage 
        })
      })

      if (!response.ok) {
        throw new Error('Failed to update language')
      }
      
      // Update local state and refresh settings
      setLanguage(newLanguage)
      await mutate()
    } catch (error) {
      console.error('Failed to update language:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
    }
  }

  const handleImageUpload = async (file: File) => {
    if (!file) return

    setIsUploadingImage(true)
    const formData = new FormData()
    formData.append('file', file)

    try {
      // Delete the existing image if it exists
      if (settings?.headerImage) {
        await fetch(`/api/uploads/${settings.headerImage}`, {
          method: 'DELETE'
        })
      }

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) throw new Error('Upload failed')

      const data = await response.json()

      // Update settings with new image and ensure header is enabled
      const updateResponse = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          headerImage: data.filename,
          headerEnabled: true // Enable header when uploading image
        })
      })

      if (!updateResponse.ok) throw new Error('Failed to update settings')

      // Reload settings data and refresh page
      await mutate()
      setSelectedFile(null)
      window.location.reload() // Add page refresh

    } catch (error) {
      console.error('Failed to upload image:', error)
    } finally {
      setIsUploadingImage(false)
    }
  }

  const handleCreateSnapshot = async () => {
    setIsCreatingSnapshot(true)
    debugStore.log('Creating new snapshot...')

    try {
      // Get all data to snapshot
      const [groupsRes, itemsRes, settingsRes, quotesRes, notesRes] = await Promise.all([
        fetch('/api/groups'),
        fetch('/api/items'),
        fetch('/api/settings'),
        fetch('/api/quotes'),
        fetch('/api/notes')
      ])

      // Check responses and handle missing endpoints
      const data: any = {}
      
      if (groupsRes.ok) {
        data.groups = await groupsRes.json()
      }
      if (itemsRes.ok) {
        data.items = await itemsRes.json()
      }
      if (settingsRes.ok) {
        data.settings = await settingsRes.json()
      }
      if (quotesRes.ok) {
        data.quotes = await quotesRes.json()
      }
      if (notesRes.ok) {
        data.notes = await notesRes.json()
      }

      // Optional email-related data
      try {
        const [mailboxesRes, messagesRes] = await Promise.all([
          fetch('/api/mailboxes'),
          fetch('/api/messages')
        ])

        if (mailboxesRes.ok) {
          data.mailboxes = await mailboxesRes.json()
        }
        if (messagesRes.ok) {
          data.messages = await messagesRes.json()
        }
      } catch (error) {
        debugStore.log('Email data not available')
      }

      // Create snapshot ID with timestamp - include .json here
      const timestamp = new Date().toISOString().replace(/:/g, '_')
      const snapshotId = `snapshot-${timestamp}.json`

      const snapshotData = {
        id: snapshotId,
        version: '1.1.0',
        data,
        createdAt: new Date().toISOString(),
        schema: {
          includesNotes: true,
          includesQuotes: true,
          includesEmail: data.mailboxes !== undefined
        }
      }

      debugStore.log('Snapshot data prepared', snapshotData)

      const response = await fetch('/api/snapshots', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(snapshotData)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create snapshot')
      }

      debugStore.log('Snapshot created successfully')
      await loadSnapshots() // Refresh list
      
      toast.success(t('snapshotCreated'), {
        duration: 2000,
        position: 'bottom-right'
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      debugStore.log(`Failed to create snapshot: ${errorMessage}`)
      toast.error(t('snapshotError'))
    } finally {
      setIsCreatingSnapshot(false)
    }
  }

  const handleDownloadSnapshot = async (id: string) => {
    try {
      const response = await fetch(`/api/snapshots/${id}`)
      const data = await response.json()
      
      // Create and download file using the original ID which already includes .json
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = id  // Use the original ID which already has .json
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Failed to download snapshot:', error)
    }
  }

  const handleDeleteSnapshot = async (id: string) => {
    if (!confirm(t('confirmDeleteSnapshot'))) return
    
    try {
      // Remove any extra .json extension before sending to API
      const cleanId = id.replace(/\.json$/, '')
      
      const response = await fetch(`/api/snapshots/${cleanId}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) {
        throw new Error('Failed to delete snapshot')
      }
      
      debugStore.log(`Snapshot ${cleanId} deleted successfully`)
      await loadSnapshots()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      debugStore.log(`Failed to delete snapshot: ${errorMessage}`)
      console.error('Failed to delete snapshot:', error)
    }
  }

  const handleRestoreSnapshot = async (snapshotId: string) => {
    if (!confirm(t('confirmRestore'))) return
    
    setIsRestoring(true)
    debugStore.log('Restoring snapshot', { snapshotId })

    try {
      const response = await fetch(`/api/snapshots/${snapshotId}/restore`, {
        method: 'POST'
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to restore snapshot')
      }

      // Refresh all data after restore
      await Promise.all([
        mutate(),                    // Settings
        mutateGroups(),             // Groups
        globalMutate('/api/items'),  // Items
        globalMutate('/api/quotes'), // Quotes
        globalMutate('/api/notes'),  // Notes
        globalMutate('/api/mailboxes'), // Optional email data
        globalMutate('/api/messages')   // Optional email data
      ])

      setRestoreMessage({
        type: 'success',
        text: t('snapshotRestored')
      })

      debugStore.log('Snapshot restored successfully')
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      debugStore.log(`Failed to restore snapshot: ${errorMessage}`)
      
      setRestoreMessage({
        type: 'error',
        text: t('snapshotRestoreError')
      })
    } finally {
      setIsRestoring(false)
    }
  }

  const handleDebugToggle = (enabled: boolean) => {
    if (enabled) {
      debugStore.enable()
    } else {
      debugStore.disable()
    }
    // Save to localStorage to persist the setting
    localStorage.setItem('debugMode', enabled ? 'true' : 'false')
  }

  const handleSettingChange = async (key: string, value: any) => {
    try {
      // Update local state immediately for better UX
      if (settings) {
        mutate({
          ...settings,
          [key]: value
        }, false)
      }

      // Send update to server
      const response = await fetch('/api/settings', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ [key]: value }),
      })

      if (!response.ok) {
        throw new Error('Failed to update setting')
      }

      // Revalidate the data
      mutate()
    } catch (error) {
      console.error('Error updating setting:', error)
      // Revert the optimistic update on error
      mutate()
    }
  }

  const removeHeaderImage = async () => {
    try {
      if (!settings?.headerImage) return

      // Extract filename with extension from the full path
      // This handles both '/uploads/header.jpg' and 'header.jpg' formats
      const fullPath = settings.headerImage
      const filename = fullPath.split('/').pop()

      if (!filename) {
        console.error('Invalid header image path')
        return
      }

      // Make the delete request with the clean filename
      const response = await fetch(
        `/api/uploads?file=${filename}`,
        { method: 'DELETE' }
      )

      if (!response.ok) {
        const error = await response.json()
        console.error('Failed to delete image:', error)
        throw new Error('Failed to delete image')
      }

      // Update settings to remove the header image
      await updateSettings({ headerImage: null })
    } catch (error) {
      console.error('Failed to remove header image:', error)
      toast.error(t('errorDeletingImage'))
    }
  }

  const handleUploadSnapshot = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    setUploadError('')

    try {
      // Read and parse file
      const content = await file.text()
      let snapshot
      
      try {
        snapshot = JSON.parse(content)
        debugStore.log('Parsed snapshot:', snapshot)
      } catch (error) {
        debugStore.log('JSON parse error:', error)
        throw new Error(t('snapshotUploadFormatError'))
      }

      // Send to API
      const response = await fetch('/api/snapshots/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(snapshot)
      })

      const data = await response.json()
      debugStore.log('Upload response:', data)

      if (!response.ok) {
        throw new Error(data.error || t('snapshotUploadError'))
      }

      // Success handling...
      await loadSnapshots()
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      toast.success(t('snapshotUploaded'))
    } catch (error) {
      debugStore.log('Upload error:', error)
      setUploadError(error instanceof Error ? error.message : String(error))
      toast.error(error instanceof Error ? error.message : t('snapshotUploadError'))
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <>
      <Toaster
        position="top-center"
        reverseOrder={false}
        gutter={8}
        toastOptions={{
          // Default options for all toasts
          duration: 4000, // 4 seconds
          style: {
            padding: '16px',
            borderRadius: '8px',
            fontSize: '1rem',
            maxWidth: '500px',
            wordBreak: 'break-word'
          },
          success: {
            duration: 4000,
            iconTheme: {
              primary: '#10B981',
              secondary: '#ffffff',
            },
          }
        }}
      />
      
      <div className="flex-1 flex flex-col">
        <Header />
        <FloatingDueItems 
          items={dueItems || []}
          settings={settings}
          onItemClick={(item) => {
            window.location.href = `/?item=${item.id}`
          }}
        />
        <div className="flex-1 overflow-y-auto">
          <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <div className="relative">
              <div className="absolute inset-0 bg-[url('/images/dropshadow2-light.png')] dark:bg-[url('/images/dropshadow2-dark.png')] 
                bg-top bg-repeat-x pointer-events-none" 
              />
              <div className="relative w-full max-w-4xl mx-auto p-6 space-y-4">
                {/* Site Settings Section */}
                <div className="space-y-6">
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
                    <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
                      {t('siteSettings')}
                    </h2>
                    <form onSubmit={handleSaveSettings} className="space-y-6">
                      {/* Site Title */}
                      <div>
                        <div>
                          <h3 className="text-base font-medium text-gray-900 dark:text-white">
                            {t('siteTitle')}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {t('siteTitleDescription')}
                          </p>
                        </div>
                        <div className="mt-2">
                          <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full px-3 py-2 
                              bg-white dark:bg-gray-900
                              border border-gray-300 dark:border-gray-600 
                              text-gray-900 dark:text-gray-100
                              rounded-md focus:ring-1 focus:ring-blue-500
                              focus:border-blue-500"
                          />
                        </div>
                      </div>

                      {/* Tagline */}
                      <div>
                        <div>
                          <h3 className="text-base font-medium text-gray-900 dark:text-white">
                            {t('tagline')}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {t('taglineDescription')}
                          </p>
                        </div>
                        <div className="mt-2">
                          <input
                            type="text"
                            value={tagline}
                            onChange={(e) => setTagline(e.target.value)}
                            className="w-full px-3 py-2 
                              bg-white dark:bg-gray-900
                              border border-gray-300 dark:border-gray-600 
                              text-gray-900 dark:text-gray-100
                              rounded-md focus:ring-1 focus:ring-blue-500
                              focus:border-blue-500"
                          />
                        </div>
                      </div>

                      {/* Save Button */}
                      <div className="flex justify-start">
                        <button
                          type="submit"
                          disabled={isSaving}
                          className="px-4 py-2 text-sm font-medium 
                            text-white bg-blue-500 dark:bg-blue-600
                            hover:bg-blue-600 dark:hover:bg-blue-700
                            disabled:opacity-50 
                            rounded-md transition-colors"
                        >
                          {isSaving ? t('saving') : t('saveSettings')}
                        </button>
                      </div>

                    {/* Header Image section */}
                    <div className="space-y-4 pt-6 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-base font-medium text-gray-900 dark:text-white">
                              {t('headerImage')}
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {t('showCustomHeader')}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleToggleSetting('headerEnabled', !settings?.headerEnabled)}
                            className={`
                              relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent 
                              transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                              ${settings?.headerEnabled ? 'bg-blue-600' : 'bg-gray-200'}
                            `}
                          >
                            <span className={`
                              pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 
                              transition duration-200 ease-in-out
                              ${settings?.headerEnabled ? 'translate-x-5' : 'translate-x-0'}
                            `} />
                          </button>
                        </div>
                      </div>
                      {settings?.headerEnabled && (
                        <div className="mt-4 space-y-4 pb-5">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              {t('imageUpload')}
                            </label>
                            <div className="flex items-center gap-2">
                              <input
                                type="file"
                                id="header-image"
                                onChange={handleFileSelect}
                                className="hidden"
                                accept="image/*"
                              />
                              <label
                                htmlFor="header-image"
                                className="px-3 py-2 text-sm font-medium 
                                  text-gray-700 dark:text-gray-300
                                  bg-white dark:bg-gray-800
                                  border border-gray-300 dark:border-gray-600
                                  hover:bg-gray-50 dark:hover:bg-gray-700
                                  rounded-md transition-colors"
                              >
                                {t('chooseFile')}
                              </label>
                              <span className="text-sm text-gray-500 dark:text-gray-400">
                                {selectedFile ? selectedFile.name : t('noFileChosen')}
                              </span>
                              {selectedFile && (
                                <button
                                  onClick={() => handleImageUpload(selectedFile)}
                                  className="px-4 py-2 text-sm font-medium 
                                    text-white bg-blue-500 dark:bg-blue-600
                                    hover:bg-blue-600 dark:hover:bg-blue-700
                                    rounded-md transition-colors"
                                >
                                  {isUploadingImage ? t('saving') : t('upload')}
                                </button>
                              )}
                            </div>
                            {isUploadingImage && (
                              <span className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                                {t('saving')}
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </form>

                    {/* Notification Sound section */}
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
                        <div className="space-y-6">
                          <div>
                            <h2 className="text-base font-medium leading-7 text-gray-900 dark:text-gray-100">
                              {t('notificationSound')}
                            </h2>
                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                              {t('notificationSoundDescription')}
                            </p>

                            <div className="mt-4 flex items-center gap-4">
                              <input
                                type="file"
                                accept=".mp3"
                                onChange={(e) => {
                                  const file = e.target.files?.[0]
                                  if (!file) return
                                  
                                  // MP3 files can have various MIME types
                                  const validMimeTypes = [
                                    'audio/mp3',
                                    'audio/mpeg',
                                    'audio/mpeg3',
                                    'audio/x-mpeg-3'
                                  ]
                                  
                                  if (!validMimeTypes.includes(file.type)) {
                                    toast.error(t('onlyMp3Allowed'))
                                    return
                                  }

                                  setSelectedSound(file)
                                }}
                                className="hidden"
                                id="notification-sound"
                              />
                              <button
                                type="button"
                                onClick={() => document.getElementById('notification-sound')?.click()}
                                className="px-3 py-2 text-sm font-medium 
                                  text-gray-700 dark:text-gray-300
                                  bg-white dark:bg-gray-800
                                  border border-gray-300 dark:border-gray-600
                                  hover:bg-gray-50 dark:hover:bg-gray-700
                                  rounded-md transition-colors"
                              >
                                {t('chooseSound')}
                              </button>

                              {selectedSound && (
                                <>
                                  <span className="text-sm text-gray-500 dark:text-gray-400">
                                    {selectedSound.name}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={async () => {
                                      const formData = new FormData()
                                      formData.append('file', selectedSound)
                                      formData.append('type', 'notification')

                                      debugStore.log('Uploading sound: ' + selectedSound.name)

                                      try {
                                        const response = await fetch('/api/upload/sound', {
                                          method: 'POST',
                                          body: formData
                                        })

                                        const data = await response.json()

                                        if (!response.ok) throw new Error('Upload failed')
                                        
                                        debugStore.log('Sound upload successful: ' + data.message)
                                        toast.success(t('notificationSoundUpdated'))
                                        setSelectedSound(null)
                                      } catch (error) {
                                        const errorMessage = error instanceof Error ? error.message : String(error)
                                        debugStore.log('Sound upload failed: ' + errorMessage)
                                        toast.error(t('uploadFailed'))
                                      }
                                    }}
                                    className="px-3 py-2 text-sm font-medium
                                      text-white bg-blue-500 dark:bg-blue-600
                                      hover:bg-blue-600 dark:hover:bg-blue-700
                                      rounded-md transition-colors"
                                  >
                                    {t('upload')}
                                  </button>
                                </>
                              )}

                              <button
                                type="button"
                                onClick={() => {
                                  // Add timestamp to URL to prevent caching
                                  const timestamp = new Date().getTime()
                                  const audio = new Audio(`/sounds/notification.mp3?t=${timestamp}`)
                                  audio.play().catch(console.error)
                                }}
                                className="px-3 py-2 text-sm font-medium
                                  text-gray-700 dark:text-gray-300
                                  bg-white dark:bg-gray-800
                                  border border-gray-300 dark:border-gray-600
                                  hover:bg-gray-50 dark:hover:bg-gray-700
                                  rounded-md transition-colors"
                              >
                                {t('testSound')}
                              </button>
                            </div>
                          </div>
                        </div>
                    </div>

                   {/* Public Access Toggle */}
                   <div className="border dark:border-gray-700 rounded-lg overflow-hidden mt-8">
                      <div className="bg-gray-50 dark:bg-gray-800/50 px-4 py-3">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                          {t('publicAccess')}
                        </h3>
                      </div>
                      <div className="p-4 space-y-4 bg-white dark:bg-gray-800">
                        <div className="flex items-center gap-3">
                          <Toggle
                            enabled={settings?.isPublic ?? false}
                            onChange={(enabled) => handleSettingChange('isPublic', enabled)}
                            label={t('isPublic')} 
                          />                        
                          <div>
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              {t('allowPublicViewing')}
                            </label>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {t('publicViewingDescription')}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>


                    <div className="border-t border-gray-200 dark:border-gray-700 pt-0 mt-4"></div>
                    <div className="mt-8 space-y-6">
                      {/* Email Integration Toggle - Temporarily disabled during development
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-base font-medium text-gray-900 dark:text-white">
                            {t('emailFeature')}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {t('emailFeatureDescription')}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleToggleSetting('emailEnabled', !settings?.emailEnabled)}
                          className={`
                            relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full 
                            border-2 border-transparent transition-colors duration-200 ease-in-out 
                            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                            ${settings?.emailEnabled ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'}
                          `} >
                          <span
                            className={`
                              pointer-events-none inline-block h-5 w-5 transform rounded-full 
                              bg-white shadow ring-0 transition duration-200 ease-in-out
                              ${settings?.emailEnabled ? 'translate-x-5' : 'translate-x-0'}
                            `}
                          />
                        </button>
                      </div>

                      {settings?.emailEnabled && (
                        <div className="mt-4 ml-6 space-y-4">
                          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                            {t('serverOfferings')}
                          </h3>
                          
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                  IMAP
                                </h4>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                  {t('imapDescription')}
                                </p>
                              </div>
                              <Switch
                                enabled={true}
                                onChange={() => {}}
                                label="IMAP"
                                disabled={true}
                                className="bg-gray-500 dark:bg-gray-600"
                              />
                            </div>

                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                  Google
                                </h4>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                  {t('googleDescription')}
                                </p>
                              </div>
                              <Switch
                                enabled={settings?.google_enabled || false}
                                onChange={(enabled) => handleSettingChange('google_enabled', enabled)}
                                label="Google"
                                className="dark:bg-gray-700"
                              />
                            </div>

                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                  Outlook
                                </h4>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                  {t('outlookDescription')}
                                </p>
                              </div>
                              <Switch
                                enabled={settings?.outlook_enabled || false}
                                onChange={(enabled) => handleSettingChange('outlook_enabled', enabled)}
                                label="Outlook"
                                className="dark:bg-gray-700"
                              />
                            </div>
                          </div>
                        </div>
                      )} */}

                      {/* Debug Mode Toggle */}
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-base font-medium text-gray-900 dark:text-white">
                            {t('debugMode')}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {t('debugModeHint')}
                          </p>
                        </div>
                        <Toggle
                          enabled={debugStore.isEnabled}
                          onChange={handleDebugToggle}
                          label={t('debugMode')} />
                      </div>

                      {/* Private Groups Toggle */}
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-base font-medium text-gray-900 dark:text-white">
                            {t('showPrivateGroups')}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {t('privateGroupsHint')}
                          </p>
                        </div>
                        <Toggle
                          enabled={settings?.showPrivateGroups || false}
                          onChange={handlePrivateGroupsToggle}
                          label={t('showPrivateGroups')}
                        />
                      </div>
                    </div>

                    {/* Language Selection Section */}
                    <div className="mt-8">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-base font-medium text-gray-900 dark:text-white">
                            {t('language')}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {t('selectLanguage')}
                          </p>
                        </div>
                        <select
                          value={language}
                          onChange={(e) => handleLanguageChange(e.target.value as Language)}
                          className="block w-40 px-3 py-2 text-sm 
                            bg-white dark:bg-gray-900
                            border border-gray-300 dark:border-gray-600 
                            text-gray-900 dark:text-gray-100
                            placeholder-gray-500 dark:placeholder-gray-400
                            rounded-md focus:ring-1 focus:ring-blue-500
                            focus:border-blue-500
                            transition-colors"
                        >
                          <option value="en">English</option>
                          <option value="ja">日本語</option>
                          {/* <option value="tl">Tagalog</option> */}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Snapshots Section */}
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                          {t('snapshots')}
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400">
                          {t('snapshotsHint')}
                        </p>
                      </div>
                      <div className="space-y-4">
                        <div className="flex gap-4">
                          <button
                            onClick={handleCreateSnapshot}
                            disabled={isCreatingSnapshot}
                            className="px-4 py-2 text-sm font-medium text-white bg-blue-500 
                              hover:bg-blue-600 rounded-lg disabled:opacity-50"
                          >
                            {isCreatingSnapshot ? t('creating') : t('createSnapshot')}
                          </button>

                          <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleUploadSnapshot}
                            accept=".json"
                            className="hidden"
                          />
                          <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isUploading}
                            className="px-4 py-2 text-sm font-medium text-blue-600 
                              bg-blue-50 hover:bg-blue-100 rounded-lg 
                              disabled:opacity-50 dark:bg-blue-900/20 
                              dark:hover:bg-blue-900/30 dark:text-blue-400"
                          >
                            {isUploading ? t('uploading') : t('uploadSnapshot')}
                          </button>
                        </div>

                        {uploadError && (
                          <div className="text-sm text-red-600 dark:text-red-400">
                            {uploadError}
                          </div>
                        )}

                        {snapshots.map((snapshot) => (
                          <div 
                            key={snapshot.id}
                            className="flex items-center justify-between p-3 
                              bg-gray-50 dark:bg-gray-900/50 
                              border border-gray-200 dark:border-gray-700 
                              rounded-lg"
                          >
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              {new Date(snapshot.createdAt).toLocaleString()}
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleRestoreSnapshot(snapshot.id)}
                                disabled={isRestoring}
                                className="px-3 py-1 text-sm font-medium 
                                  text-green-600 dark:text-green-400
                                  hover:text-green-700 dark:hover:text-green-300
                                  disabled:opacity-50
                                  transition-colors"
                              >
                                {isRestoring ? t('restoring') : t('restore')}
                              </button>
                              <button
                                onClick={() => handleDownloadSnapshot(snapshot.id)}
                                className="px-3 py-1 text-sm font-medium 
                                  text-blue-600 dark:text-blue-400
                                  hover:text-blue-700 dark:hover:text-blue-300
                                  transition-colors"
                              >
                                {t('download')}
                              </button>
                              <button
                                onClick={() => handleDeleteSnapshot(snapshot.id)}
                                className="px-3 py-1 text-sm font-medium 
                                  text-red-600 dark:text-red-400
                                  hover:text-red-700 dark:hover:text-red-300
                                  transition-colors"
                              >
                                {t('delete')}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Restore Message */}
                    {restoreMessage && (
                      <div className={`mt-4 p-3 rounded-lg ${
                        restoreMessage.type === 'success' 
                          ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-900/30 text-green-800 dark:text-green-200'
                          : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/30 text-red-800 dark:text-red-200'
                      }`}>
                        <p className="text-sm">
                          {restoreMessage.type === 'success' ? '✅' : '❌'} {restoreMessage.text}
                        </p>
                      </div>
                    )}

                    {/* Warning Notice */}
                    <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 
                      border border-yellow-200 dark:border-yellow-900/30 
                      rounded-lg"
                    >
                      <p className="text-sm text-yellow-800 dark:text-yellow-200">
                        ⚠️ {t('snapshotWarning')}
                      </p>
                    </div>
                  </div>

                  {/* Password Change Section */}
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
                    <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
                      {t('changePasswordFor')} {username}
                    </h2>
                    <form onSubmit={handlePasswordChange} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          {t('currentPassword')}
                        </label>
                        <input
                          type="password"
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          className="w-full px-3 py-2 
                            bg-white dark:bg-gray-900
                            border border-gray-300 dark:border-gray-600 
                            text-gray-900 dark:text-gray-100
                            placeholder-gray-500 dark:placeholder-gray-400
                            rounded-md focus:ring-1 focus:ring-blue-500
                            focus:border-blue-500
                            transition-colors"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          {t('newPassword')}
                        </label>
                        <input
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="w-full px-3 py-2 
                            bg-white dark:bg-gray-900
                            border border-gray-300 dark:border-gray-600 
                            text-gray-900 dark:text-gray-100
                            placeholder-gray-500 dark:placeholder-gray-400
                            rounded-md focus:ring-1 focus:ring-blue-500
                            focus:border-blue-500
                            transition-colors"
                          required
                          pattern="^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!#$%&_-])[A-Za-z\d!#$%&_-]{12,}$"
                          title="Password must meet the requirements"
                        />
                      </div>
                      <div className="mt-1 text-sm text-gray-500 dark:text-gray-400 space-y-1">
                        <p>Password must:</p>
                        <ul className="list-disc pl-5 space-y-1">
                          <li>Be at least 12 characters long</li>
                          <li>Include at least one lowercase letter</li>
                          <li>Include at least one uppercase letter</li>
                          <li>Include at least one number</li>
                          <li>Include at least one special character (!#$%&_-)</li>
                        </ul>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          {t('confirmNewPassword')}
                        </label>
                        <input
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="w-full px-3 py-2 
                            bg-white dark:bg-gray-900
                            border border-gray-300 dark:border-gray-600 
                            text-gray-900 dark:text-gray-100
                            placeholder-gray-500 dark:placeholder-gray-400
                            rounded-md focus:ring-1 focus:ring-blue-500
                            focus:border-blue-500
                            transition-colors"
                          required
                        />
                      </div>
                      {passwordError && (
                        <p className="text-red-500 text-sm">{passwordError}</p>
                      )}
                      {passwordSuccess && (
                        <div className="p-4 bg-green-50 dark:bg-green-900/20 
                          border border-green-200 dark:border-green-900/30 
                          rounded-md text-green-800 dark:text-green-200"
                        >
                          <p className="text-sm flex items-center gap-2">
                            <span className="text-lg">✓</span>
                            {t('passwordChanged')}
                          </p>
                        </div>
                      )}
                      <button
                        type="submit"
                        className="w-full px-4 py-2 text-sm font-medium text-white 
                          bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 
                          dark:hover:bg-blue-700 rounded-md transition-colors"
                      >
                        {t('changePassword')}
                      </button>
                    </form>
                  </div>

                  {/* Session Section */}
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                          {t('session')}
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400">
                          {t('loggedInAs')} {username}
                        </p>
                      </div>
                      <button
                        onClick={handleLogout}
                        className="px-4 py-2 text-sm font-medium 
                          text-white bg-gray-500 dark:bg-gray-600
                          hover:bg-gray-600 dark:hover:bg-gray-700
                          rounded-md transition-colors"
                      >
                        {t('logout')}
                      </button>
                    </div>
                  </div>

                  {/* Factory Reset Section */}
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                          {t('factoryReset')}
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400">
                          {t('factoryResetHint')}
                        </p>
                      </div>
                      <button
                        onClick={handleFactoryReset}
                        className="w-32 ml-5 px-4 py-2 text-sm font-medium 
                          text-white bg-red-500 dark:bg-red-600
                          hover:bg-red-600 dark:hover:bg-red-700
                          rounded-md transition-colors"
                      >
                        {t('factoryReset')}
                      </button>
                    </div>
                  </div>

                  {/* About Section */}
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
                    <div className="flex flex-col gap-2">
                      <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                        {t('about')}
                      </h2>
                      <p className="text-gray-600 dark:text-gray-400">
                        Congeal, {t('version')} 1.0.24
                      </p>
                      <p className="text-gray-600 dark:text-gray-400">
                        {t('developers')}: <a href="/demo" className="text-blue-500 hover:text-blue-600">{t('sampleUI')} →</a>
                      </p>
                      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <p className="text-gray-600 dark:text-gray-400">
                          {t('openSourceNotice')}
                        </p>
                        <p className="mt-2 text-sm text-gray-500 dark:text-gray-500">
                          {t('rightsReserved')}
                        </p>
                      </div>
                    </div>
                  </div>
                  <br /><br /><br />
                </div>

                {/* Password confirmation modal */}
                <Modal
                  isOpen={isPasswordModalOpen}
                  onClose={() => {
                    setIsPasswordModalOpen(false)
                    setPassword('')
                    setError('')
                  }}
                  title={t('confirmPassword')}
                >
                  <form onSubmit={handlePasswordConfirm} className="space-y-4">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {t('enterPasswordForPrivateGroups')}
                    </p>
                    
                    <div>
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-3 py-2 
                          bg-white dark:bg-gray-900
                          border border-gray-300 dark:border-gray-600 
                          text-gray-900 dark:text-gray-100
                          placeholder-gray-500 dark:placeholder-gray-400
                          rounded-md focus:ring-1 focus:ring-blue-500
                          focus:border-blue-500
                          transition-colors"
                        placeholder={t('enterPassword')}
                        required
                      />
                      {error && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
                      )}
                    </div>

                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setIsPasswordModalOpen(false)
                          setPassword('')
                          setError('')
                        }}
                        className="px-4 py-2 text-sm font-medium 
                          text-gray-700 dark:text-gray-300 
                          bg-white dark:bg-gray-800 
                          border border-gray-300 dark:border-gray-600 
                          hover:bg-gray-50 dark:hover:bg-gray-700
                          rounded-md transition-colors"
                      >
                        {t('cancel')}
                      </button>
                      <button
                        type="submit"
                        disabled={isVerifying}
                        className="px-4 py-2 text-sm font-medium 
                          text-white bg-blue-500 dark:bg-blue-600
                          hover:bg-blue-600 dark:hover:bg-blue-700
                          disabled:opacity-50 
                          rounded-md transition-colors"
                      >
                        {isVerifying ? t('verifying') : t('confirm')}
                      </button>
                    </div>
                  </form>
                </Modal>

                {/* Factory Reset Password Modal */}
                <Modal
                  isOpen={isFactoryResetModalOpen}
                  onClose={() => {
                    setIsFactoryResetModalOpen(false)
                    setFactoryResetPassword('')
                    setFactoryResetError('')
                  }}
                >
                  <div className="p-6">
                    <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                      {t('confirmFactoryReset')}
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                      {t('factoryResetWarning')}
                    </p>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {t('password')}
                      </label>
                      <input
                        type="password"
                        value={factoryResetPassword}
                        onChange={(e) => setFactoryResetPassword(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 
                          rounded-md dark:bg-gray-700"
                        placeholder={t('enterPassword')}
                        pattern="^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!#$%&_-])[A-Za-z\d!#$%&_-]{12,}$"
                        title="Password must meet all requirements"
                        required
                      />
                      {factoryResetError && (
                        <p className="mt-1 text-sm text-red-500">{factoryResetError}</p>
                      )}
                    </div>
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => {
                          setIsFactoryResetModalOpen(false)
                          setFactoryResetPassword('')
                          setFactoryResetError('')
                        }}
                        className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300
                          bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600
                          rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        {t('cancel')}
                      </button>
                      <button
                        onClick={handleFactoryResetConfirm}
                        disabled={isResetting}
                        className="px-4 py-2 text-sm font-medium text-white
                          bg-red-600 rounded-md hover:bg-red-700
                          disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isResetting ? t('resetting') : t('confirmReset')}
                      </button>
                    </div>
                  </div>
                </Modal>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
} 
