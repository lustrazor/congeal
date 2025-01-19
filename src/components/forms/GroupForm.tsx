'use client'
import { useState, useEffect } from 'react'
import { useGroups } from '@/hooks/useGroups'
import { useDebugStore } from '@/stores/debugStore'
import IconSelector, { IconName } from '@/components/IconSelector'
import { clientLogger } from '@/lib/clientLogger'
import { useTranslations } from '@/hooks/useTranslations'
import { Switch } from '@/components/ui/Switch'

interface GroupFormProps {
  onClose: (groupId?: number) => void
  editGroup?: {
    id: number
    name: string
    iconName?: string
    iconColor?: string
    isPrivate?: boolean
  } | null
  onItemsChange?: (groupId: number) => void
}

const colorOptions = ['gray', 'red', 'yellow', 'green', 'blue', 'purple'] as const
type ColorOption = typeof colorOptions[number]

// Add validation types
interface ValidationErrors {
  name?: string
  iconName?: string
  iconColor?: string
  seedItemName?: string
  seedItemCount?: string
}

// Update form data type
interface GroupFormData {
  name: string
  iconName: IconName | undefined
  iconColor: 'gray' | 'red' | 'yellow' | 'green' | 'blue' | 'purple'
  isPrivate: boolean
  seedItemName: string
  seedItemCount: number
}

const GroupForm: React.FC<GroupFormProps> = ({ onClose, editGroup, onItemsChange }) => {
  const { t } = useTranslations()
  const [errors, setErrors] = useState<ValidationErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { mutate: mutateGroups } = useGroups()
  const debugStore = useDebugStore()
  const [isSeedExpanded, setIsSeedExpanded] = useState(false)

  // Keep existing form data state
  const [formData, setFormData] = useState<GroupFormData>({
    name: editGroup?.name || '',
    iconName: editGroup?.iconName as IconName | undefined,
    iconColor: (editGroup?.iconColor || 'gray') as GroupFormData['iconColor'],
    isPrivate: editGroup?.isPrivate || false,
    seedItemName: '',
    seedItemCount: 10
  })

  // Add validation function
  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {}

    // Validate name
    if (!formData.name.trim()) {
      newErrors.name = t('nameRequired')
    } else if (formData.name.length > 50) {
      newErrors.name = t('nameTooLong')
    }

    // Validate seed items if expanded
    if (isSeedExpanded && formData.seedItemName) {
      if (formData.seedItemName.length > 50) {
        newErrors.seedItemName = t('nameTooLong')
      }
      if (formData.seedItemCount < 1 || formData.seedItemCount > 100) {
        newErrors.seedItemCount = t('invalidItemCount')
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const seedItemsForGroup = async (groupId: number) => {
    // Create multiple items based on base name and count
    for (let i = 1; i <= formData.seedItemCount; i++) {
      const itemName = `${formData.seedItemName} ${i}`
      await fetch('/api/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: itemName,
          groupId,
          status: 'gray',
          iconName: formData.iconName || 'undefined',
          description: '',
          useStatusColor: true
        }),
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      debugStore.log('Group form submitted', {
        type: 'GROUP_FORM_SUBMIT',
        data: {
          ...formData,
          editGroupId: editGroup?.id,
          timestamp: new Date().toISOString()
        }
      })

      // Create or update the group
      const response = await fetch(
        editGroup ? `/api/groups/${editGroup.id}` : '/api/groups',
        {
          method: editGroup ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        }
      )

      if (!response.ok) throw new Error('Failed to save group')
      const group = await response.json()

      debugStore.log('Group saved', {
        type: 'GROUP_SAVED',
        data: {
          group,
          timestamp: new Date().toISOString()
        }
      })

      // If creating new group and seed name exists, create items
      if (!editGroup && formData.seedItemName) {
        await seedItemsForGroup(group.id)
      }

      // Update items list if needed
      if (onItemsChange) {
        onItemsChange(group.id)
      }
      
      // Pass the new group ID back to the parent
      onClose(group.id)  // Update the onClose prop type to accept an optional group ID
    } catch (error) {
      console.error('GroupForm: Save failed:', error)
      debugStore.log('Group form error', {
        type: 'GROUP_FORM_ERROR',
        error: String(error),
        timestamp: new Date().toISOString()
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {t('groupName')}
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => {
            const value = e.target.value.slice(0, 50) // Limit length
            setFormData(prev => ({ ...prev, name: value }))
          }}
          className={`mt-1 w-full px-3 py-2 
            bg-white dark:bg-gray-900
            border ${errors.name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}
            text-gray-900 dark:text-gray-100
            rounded-md focus:ring-1 focus:ring-blue-500
            focus:border-blue-500
            transition-colors`}
          required
          maxLength={50}
        />
        {errors.name && (
          <p className="mt-1 text-sm text-red-500">{errors.name}</p>
        )}
      </div>

      {/* Seed Items section - only show for new groups */}
      {!editGroup && (
        <div className="border dark:border-gray-700 rounded-lg overflow-hidden">
          <button
            type="button"
            onClick={() => setIsSeedExpanded(!isSeedExpanded)}
            className="w-full px-4 py-3 flex items-center justify-between 
              bg-gray-50 dark:bg-gray-800/50 
              hover:bg-gray-100 dark:hover:bg-gray-800 
              transition-colors">
            <div>
              <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {t('seedItems')}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t('seedItemsHint')}
              </p>
            </div>
            <i className={`bx bx-chevron-${isSeedExpanded ? 'up' : 'down'} text-gray-400`} />
          </button>

          <div className={`
            transition-all duration-200 ease-in-out
            ${isSeedExpanded 
              ? 'max-h-[1000px] opacity-100' 
              : 'max-h-0 opacity-0'
            } overflow-hidden
          `}>
            <div className="p-4 space-y-4 bg-white dark:bg-gray-900">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('seedItemName')}
                </label>
                <input
                  type="text"
                  value={formData.seedItemName}
                  onChange={(e) => setFormData(prev => ({ ...prev, seedItemName: e.target.value }))}
                  className="mt-1 w-full px-3 py-2 
                    bg-white dark:bg-gray-900
                    border border-gray-300 dark:border-gray-600 
                    text-gray-900 dark:text-gray-100
                    placeholder-gray-500 dark:placeholder-gray-400
                    rounded-md focus:ring-1 focus:ring-blue-500
                    focus:border-blue-500
                    transition-colors"
                  placeholder={t('seedItemNameHint')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('numberOfItems')}
                </label>
                <select
                  value={formData.seedItemCount}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    seedItemCount: parseInt(e.target.value) 
                  }))}
                  className="mt-1 block w-full pl-3 pr-10 py-2
                    bg-white dark:bg-gray-900
                    border border-gray-300 dark:border-gray-600
                    text-gray-900 dark:text-gray-100
                    rounded-md focus:ring-1 focus:ring-blue-500
                    focus:border-blue-500"
                >
                  <option value={10}>10 items</option>
                  <option value={25}>25 items</option>
                  <option value={50}>50 items</option>
                  <option value={100}>100 items</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mb-4">
        <IconSelector
          selectedIcon={formData.iconName}
          onSelect={(iconName) => setFormData({ ...formData, iconName })}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {t('iconColor')}
        </label>
        <div className="mt-2 flex gap-2">
          {['gray', 'red', 'yellow', 'green', 'blue', 'purple'].map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, iconColor: color }))}
              className={`w-8 h-8 rounded-full 
                ${formData.iconColor === color ? 'ring-2 ring-offset-2 ring-blue-500 dark:ring-offset-gray-900' : ''}
                ${color === 'gray' ? 'bg-gray-500' : 
                  color === 'red' ? 'bg-red-500' : 
                  color === 'yellow' ? 'bg-yellow-500' : 
                  color === 'green' ? 'bg-green-500' : 
                  color === 'blue' ? 'bg-blue-500' : 
                  'bg-purple-500'}`}
              aria-label={color}
            />
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setFormData(prev => ({ ...prev, isPrivate: !prev.isPrivate }))}
          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full 
            border-2 border-transparent transition-colors duration-200 ease-in-out
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
            ${formData.isPrivate ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'}`}
        >
          <span className="sr-only">{t('privateGroup')}</span>
          <span
            className={`${formData.isPrivate ? 'translate-x-5' : 'translate-x-0'}
              pointer-events-none inline-block h-5 w-5 transform rounded-full 
              bg-white shadow ring-0 transition duration-200 ease-in-out`}
          />
        </button>
        <div>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {t('privateGroup')}
          </label>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t('privateGroupHint')}
          </p>
        </div>
      </div>


      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
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
          disabled={isSubmitting}
          className="px-4 py-2 text-sm font-medium 
            text-white bg-blue-500 dark:bg-blue-600
            hover:bg-blue-600 dark:hover:bg-blue-700
            disabled:opacity-50 
            rounded-md transition-colors"
        >
          {isSubmitting ? t('saving') : editGroup ? t('updateGroup') : t('createGroup')}
        </button>
      </div>
    </form>
  )
}

export default GroupForm