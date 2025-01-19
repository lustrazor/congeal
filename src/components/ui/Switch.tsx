'use client'
import { Switch as HeadlessSwitch } from '@headlessui/react'

interface SwitchProps {
  enabled: boolean
  onChange: (enabled: boolean) => void
  label?: string
  disabled?: boolean
}

export function Switch({ enabled, onChange, label, disabled }: SwitchProps) {
  return (
    <HeadlessSwitch
      checked={enabled}
      onChange={onChange}
      disabled={disabled}
      className={`
        relative inline-flex h-6 w-11 items-center rounded-full
        ${disabled && enabled 
          ? 'bg-gray-500/80 dark:bg-gray-500 cursor-not-allowed' 
          : enabled 
            ? 'bg-blue-500 dark:bg-blue-600' 
            : 'bg-gray-200 dark:bg-gray-700'
        }
      `}
    >
      <span className="sr-only">{label}</span>
      <span
        className={`
          ${enabled ? 'translate-x-6' : 'translate-x-1'}
          inline-block h-4 w-4 transform rounded-full 
          bg-white dark:bg-gray-100 transition-transform duration-200
          ${disabled ? 'opacity-60 dark:opacity-50' : ''}
        `}
      />
    </HeadlessSwitch>
  )
} 