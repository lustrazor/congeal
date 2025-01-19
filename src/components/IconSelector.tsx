'use client'
import { useState, useEffect } from 'react'
import { IconName } from '@/types'

interface IconSelectorProps {
  selectedIcon?: IconName
  onSelect: (iconName: IconName) => void
  onCustomSelect: () => void
  isCustom?: boolean
}

const commonIcons: IconName[] = [
  'home',
  'check-square',
  'archive',
  'send',
  'star',
  'folder',
  'leaf',
  'flag',
  'bell',
  'bookmark',
  'heart',
  'message',
  'calendar',
  'error',
  'user-pin',
  'sushi',
  'ghost'
]

export default function IconSelector({ 
  selectedIcon, 
  onSelect, 
  onCustomSelect,
  isCustom = false 
}: IconSelectorProps) {
  const [mounted, setMounted] = useState(false)

  if (typeof onSelect !== 'function') {
    console.error('IconSelector: onSelect is not a function:', onSelect)
  }

  console.log('IconSelector: Rendering with props:', { selectedIcon, hasOnSelect: !!onSelect })

  useEffect(() => {
    console.log('IconSelector: Mounting')
    import('boxicons')
      .catch(err => {
        console.warn('Failed to load boxicons:', err)
      })
      .finally(() => {
        setMounted(true)
        console.log('IconSelector: Mounted and ready')
      })
  }, [])

  const handleIconClick = (iconName: IconName) => {
    console.log('IconSelector: handleIconClick:', {
      clicked: iconName,
      current: selectedIcon,
      hasCallback: !!onSelect
    })
    
    try {
      onSelect(iconName)
    } catch (error) {
      console.error('IconSelector: Error calling onSelect:', error)
    }
  }

  if (!mounted) {
    console.log('IconSelector: not yet mounted')
    return (
      <div className="grid grid-cols-6 gap-2">
        {commonIcons.map((_, i) => (
          <div key={i} className="h-12 rounded-lg bg-gray-100 dark:bg-gray-800 animate-pulse" />
        ))}
      </div>
    )
  }

  if (isCustom) {
    return null
  }

  return (
    <div className="grid grid-cols-6 gap-2">
      <button
        type="button"
        onClick={() => onSelect(undefined)}
        className={`
          relative p-2 rounded-lg border-2 transition-all
          ${!selectedIcon 
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
            : 'border-transparent hover:border-gray-200 dark:hover:border-gray-700'
          }
        `}
        title="No icon"
      >
        <div className={`
          h-8 w-full rounded flex items-center justify-center
          ${!selectedIcon 
            ? 'text-blue-500' 
            : 'text-gray-500 dark:text-gray-400'
          }
        `}>
          <i className="bx bx-minus text-xl" />
        </div>
      </button>

      <button
        type="button"
        onClick={onCustomSelect}
        className={`
          relative p-2 rounded-lg border-2 transition-all
          border-transparent hover:border-gray-200 dark:hover:border-gray-700
        `}
        title="Custom icon"
      >
        <div className="h-8 w-full rounded flex items-center justify-center
          text-gray-500 dark:text-gray-400">
          <i className="bx bx-code-alt text-xl" />
        </div>
      </button>

      {commonIcons.map(iconName => (
        <button
          key={iconName}
          type="button"
          onClick={() => {
            console.log('IconSelector: Raw button click on:', iconName)
            handleIconClick(iconName)
          }}
          className={`
            relative p-2 rounded-lg border-2 transition-all
            ${selectedIcon === iconName 
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
              : 'border-transparent hover:border-gray-200 dark:hover:border-gray-700'
            }
          `}
          title={iconName}
        >
          <div className={`
            h-8 w-full rounded flex items-center justify-center
            ${selectedIcon === iconName 
              ? 'text-blue-500' 
              : 'text-gray-500 dark:text-gray-400'
            }
          `}>
            <i className={`bx bxs-${iconName} text-xl`} />
          </div>
        </button>
      ))}
    </div>
  )
}