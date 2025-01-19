import React, { useState, useCallback } from 'react'
import { useDebugStore } from '@/stores/debugStore'
import { Item } from '@/types'
import { useGroups } from '@/hooks/useGroups'
import { useTranslations } from '@/hooks/useTranslations'
import IconSelector from '@/components/IconSelector'
import type { IconName } from '@/types'
import { Switch } from '@/components/ui/Switch'
import { mutate as globalMutate } from 'swr'

interface ItemFormData {
  name: string
  description: string
  groupId: number | undefined
  status: string
  iconName?: IconName
  useStatusColor: boolean
  dueAt?: string | null
}

interface ItemFormProps {
  editItem?: Item | null
  defaultGroupId?: number
  onClose: () => void
  mutate: () => Promise<void>
}

const ItemForm: React.FC<ItemFormProps> = ({
  editItem,
  defaultGroupId,
  onClose,
  mutate: mutateItems
}) => {
  const { t } = useTranslations()
  const { groups } = useGroups()
  const debugStore = useDebugStore()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isCustomIcon, setIsCustomIcon] = useState(false)
  const [customIconName, setCustomIconName] = useState('')

  // Initialize form data with properly formatted dueAt
  const [formData, setFormData] = useState<ItemFormData>(() => {
    // Format the date for datetime-local input if it exists
    let formattedDueAt = null
    if (editItem?.dueAt) {
      const date = new Date(editItem.dueAt)
      // Adjust for local timezone
      const tzOffset = date.getTimezoneOffset() * 60000 // offset in milliseconds
      const localDate = new Date(date.getTime() - tzOffset)
      formattedDueAt = localDate.toISOString().slice(0, 16) // Format: "YYYY-MM-DDThh:mm"
    }

    return {
      name: editItem?.name || '',
      description: editItem?.description || '',
      groupId: editItem?.groupId ?? defaultGroupId ?? groups?.[0]?.id,
      status: editItem?.status || 'gray',
      iconName: editItem?.iconName,
      useStatusColor: editItem?.useStatusColor ?? true,
      dueAt: formattedDueAt
    }
  })

  const handleIconSelect = useCallback((iconName: IconName) => {
    setIsCustomIcon(false)
    setFormData(prev => ({ ...prev, iconName }))
  }, [])

  const handleCustomIconSelect = useCallback(() => {
    setIsCustomIcon(true)
    setFormData(prev => ({ ...prev, iconName: undefined }))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    console.log('ItemForm: Submitting with data:', formData)

    try {
      const response = await fetch(
        editItem ? `/api/items/${editItem.id}` : '/api/items',
        {
          method: editItem ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formData.name,
            description: formData.description || '',
            groupId: Number(formData.groupId),
            status: formData.status,
            iconName: formData.iconName || null,
            useStatusColor: formData.useStatusColor,
            dueAt: formData.dueAt || null
          }),
        }
      )

      if (!response.ok) throw new Error('Failed to save item')
      
      // Mutate all relevant caches
      await Promise.all([
        mutateItems(),               // Group-specific items
        globalMutate('/api/items'),  // Global items list
        globalMutate('/api/items/due') // Due items specifically
      ])
      
      onClose()
    } catch (error) {
      console.error('ItemForm: Save failed:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {t('itemName')} <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          required
          minLength={1}
          className="mt-1 w-full px-3 py-2 
            bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100
            rounded-md focus:ring-1 focus:ring-blue-500 border border-gray-300 
            shadow-sm focus:border-blue-500 focus:ring-blue-500 
            dark:bg-gray-800 dark:border-gray-600
            focus:border-blue-500
            transition-colors
            invalid:border-red-500 invalid:dark:border-red-500"
          placeholder={t('enterItemName')}
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {t('description')}
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          className="mt-1 w-full px-3 py-2 
            bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100
            rounded-md focus:ring-1 focus:ring-blue-500 border border-gray-300 
            shadow-sm focus:border-blue-500 focus:ring-blue-500 
            dark:bg-gray-800 dark:border-gray-600
            focus:border-blue-500
            transition-colors"
          placeholder={t('optionalDescription')}
        />
        <div className="mt-1 text-sm text-gray-500">
          {formData.description?.length || 0}/500
        </div>
      </div>

      {/* Icon Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {t('icon')}
        </label>
        
        {isCustomIcon ? (
          <div className="space-y-2">
            <div className="flex gap-2">
              <input
                type="text"
                value={customIconName}
                onChange={(e) => {
                  setCustomIconName(e.target.value)
                  setFormData(prev => ({ 
                    ...prev, 
                    iconName: e.target.value as IconName 
                  }))
                }}
                placeholder="Enter boxicon name (e.g. 'heart' or 'star')"
                className="flex-1 px-3 py-2 
                  bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100
                  rounded-md focus:ring-1 focus:ring-blue-500 border border-gray-300 
                  shadow-sm focus:border-blue-500 focus:ring-blue-500 
                  dark:bg-gray-800 dark:border-gray-600"
              />
              <button
                type="button"
                onClick={() => setIsCustomIcon(false)}
                className="px-3 py-2 text-gray-600 hover:text-gray-800 
                  dark:text-gray-400 dark:hover:text-gray-200"
              >
                <i className="bx bx-x text-xl" />
              </button>
            </div>
            <div className="text-sm text-gray-500">
              Browse available icons at{' '}
              <a 
                href="https://boxicons.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline"
              >
                boxicons.com
              </a>
            </div>
          </div>
        ) : (
          <IconSelector
            selectedIcon={formData.iconName}
            onSelect={handleIconSelect}
            onCustomSelect={handleCustomIconSelect}
            isCustom={isCustomIcon}
          />
        )}
      </div>

      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {t('useStatusColorForIcon')}
        </label>
        <Switch
          enabled={formData.useStatusColor}
          onChange={(enabled) => setFormData(prev => ({ ...prev, useStatusColor: enabled }))}
        />
      </div>

      {/* Status */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {t('status')}
        </label>
        <div className="mt-2 flex gap-2">
          {['gray', 'red', 'yellow', 'green', 'blue', 'purple'].map(color => (
            <button
              key={color}
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, status: color }))}
              className={`h-8 w-8 rounded-full ${
                formData.status === color 
                  ? 'ring-2 ring-offset-2 ring-blue-500' 
                  : ''
              } bg-${color}-500`}
            />
          ))}
        </div>
      </div>

      {/* Group Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {t('selectGroup')}
        </label>
        <select
          value={formData.groupId}
          onChange={(e) => setFormData(prev => ({ ...prev, groupId: Number(e.target.value) }))}
          className="mt-1 w-full px-3 py-2 
            bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100
            rounded-md focus:ring-1 focus:ring-blue-500 border border-gray-300 
            shadow-sm focus:border-blue-500 focus:ring-blue-500 
            dark:bg-gray-800 dark:border-gray-600
            focus:border-blue-500
            transition-colors"
        >
          {groups.map(group => (
            <option key={group.id} value={group.id}>
              {group.name}
            </option>
          ))}
        </select>
      </div>

      {/* Due Date */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {t('dueDate')}
        </label>
        <input
          type="datetime-local"
          value={formData.dueAt || ''}
          onChange={(e) => setFormData(prev => ({ 
            ...prev, 
            dueAt: e.target.value || null 
          }))}
          className="mt-1 w-full px-3 py-2 
            bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100
            rounded-md focus:ring-1 focus:ring-blue-500 border border-gray-300 
            shadow-sm focus:border-blue-500 focus:ring-blue-500 
            dark:bg-gray-800 dark:border-gray-600
            focus:border-blue-500
            transition-colors"
        />
  <button
    type="button"
    onClick={() => setFormData(prev => ({ ...prev, dueAt: null }))}
    className="mt-2 text-sm text-blue-500 hover:underline focus:outline-none">
          {t('removeDueDate')}
        </button>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white 
                     border border-gray-300 rounded-md hover:bg-gray-50
                     dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 
                     dark:hover:bg-gray-700"
        >
          {t('cancel')}
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-500 
                     rounded-md hover:bg-blue-600 disabled:opacity-50"
        >
          {isSubmitting ? t('saving') : editItem ? t('editItem') : t('createItem')}
        </button>
      </div>
    </form>
  )
}

export default ItemForm 