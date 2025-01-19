import { createPortal } from 'react-dom'
import { useTranslations } from '@/hooks/useTranslations'
import { useEffect, useRef } from 'react'

interface DeleteConfirmationProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  message: string
  buttonPosition: { x: number; y: number }
  showDeleteItemsCheckbox?: boolean
  deleteItems?: boolean
  onDeleteItemsChange?: (checked: boolean) => void
  deleteItemsHint?: string
}

export default function DeleteConfirmation({
  isOpen,
  onClose,
  onConfirm,
  message,
  buttonPosition,
  showDeleteItemsCheckbox,
  deleteItems,
  onDeleteItemsChange,
  deleteItemsHint
}: DeleteConfirmationProps) {
  const { t } = useTranslations()
  const deleteButtonRef = useRef<HTMLButtonElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)

  // Calculate position to prevent overflow
  const getAdjustedPosition = () => {
    if (!popoverRef.current) return buttonPosition

    const popoverWidth = popoverRef.current.offsetWidth
    const windowWidth = window.innerWidth
    const padding = 16 // Add some padding from window edge

    let x = buttonPosition.x
    // If popover would overflow right edge
    if (x + popoverWidth + padding > windowWidth) {
      // Position it so right edge aligns with delete button
      x = x - popoverWidth + 24 // 24px is roughly the width of the delete button
    }

    return {
      x,
      y: buttonPosition.y
    }
  }

  // Handle keyboard interactions
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          onClose()
          break
        case 'Enter':
          if (document.activeElement === deleteButtonRef.current) {
            onConfirm()
          }
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    // Focus the delete button when popover opens
    deleteButtonRef.current?.focus()

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose, onConfirm])

  if (!isOpen) return null

  const adjustedPosition = getAdjustedPosition()

  return createPortal(
    <div 
      className="fixed inset-0 z-[9999] bg-black/30 dark:bg-black/50 
        backdrop-blur-[0px] transition-all duration-200"
      onClick={(e) => {
        e.stopPropagation()
        onClose()
      }}
    >
      <div 
        ref={popoverRef}
        className="absolute w-56 
          bg-white dark:bg-gray-800 
          rounded-lg shadow-lg 
          border border-gray-200 dark:border-gray-700
          p-3 space-y-3
          transition-all duration-200 ease-out
          animate-in fade-in slide-in-from-top-2"
        style={{
          top: `${adjustedPosition.y + 32}px`,
          left: `${adjustedPosition.x - 180}px`
        }}
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-confirmation-title"
      >
        <p 
          id="delete-confirmation-title"
          className="text-sm text-gray-600 dark:text-gray-300"
        >
          {message}
        </p>

        {showDeleteItemsCheckbox && (
          <div className="flex items-start gap-2">
            <input
              type="checkbox"
              id="deleteItems"
              checked={deleteItems}
              onChange={(e) => onDeleteItemsChange?.(e.target.checked)}
              className="mt-2 rounded border-gray-300 
                text-blue-500 focus:ring-blue-500
                dark:border-gray-600 dark:bg-gray-700"
            />
            <div>
              <label 
                htmlFor="deleteItems"
                className="text-sm font-medium text-gray-700 dark:text-gray-200"
              >
                {t('deleteGroupItems')}
              </label>
              {deleteItemsHint && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {deleteItemsHint}
                </p>
              )}
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-2 py-1 text-sm text-gray-600 dark:text-gray-300
              hover:bg-gray-100 dark:hover:bg-gray-700 
              rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {t('cancel')}
          </button>
          <button
            ref={deleteButtonRef}
            onClick={onConfirm}
            className="px-2 py-1 text-sm text-white 
              bg-red-500 hover:bg-red-600
              rounded focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            {t('delete')}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
} 