'use client'
import { useState, useEffect, useRef, KeyboardEvent } from 'react'

interface ComboBoxProps {
  value: string
  onChange: (value: string) => void
  options: string[]
  placeholder?: string
  className?: string
  error?: string
  autoFocus?: boolean
}

export default function ComboBox({
  value,
  onChange,
  options,
  placeholder,
  className = '',
  error,
  autoFocus
}: ComboBoxProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [filteredOptions, setFilteredOptions] = useState<string[]>([])
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-focus when component mounts if autoFocus is true
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus()
    }
  }, [autoFocus])

  // Filter options based on input
  useEffect(() => {
    if (value.trim()) {
      const filtered = options.filter(option => 
        option.toLowerCase().includes(value.toLowerCase())
      ).slice(0, 10)
      setFilteredOptions(filtered)
      setSelectedIndex(-1) // Reset selection when input changes
    } else {
      setFilteredOptions([])
      setSelectedIndex(-1)
    }
  }, [value, options])

  // Handle keyboard navigation
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!filteredOptions.length) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault() // Prevent cursor movement
        setSelectedIndex(prev => 
          prev < filteredOptions.length - 1 ? prev + 1 : prev
        )
        setIsOpen(true)
        break

      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1)
        break

      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0) {
          onChange(filteredOptions[selectedIndex])
          setIsOpen(false)
          inputRef.current?.blur()
        }
        break

      case 'Escape':
        setIsOpen(false)
        inputRef.current?.blur()
        break

      case 'Tab':
        if (selectedIndex >= 0) {
          e.preventDefault()
          onChange(filteredOptions[selectedIndex])
          setIsOpen(false)
        }
        break
    }
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSelectedIndex(-1)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div ref={wrapperRef} className="relative">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => {
          onChange(e.target.value)
          setIsOpen(true)
        }}
        onKeyDown={handleKeyDown}
        onFocus={() => {
          if (value.trim()) {
            setIsOpen(true)
          }
        }}
        placeholder={placeholder}
        className={`w-full px-3 py-2 
          bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100
          rounded-md focus:ring-1 focus:ring-blue-500 
          border ${error ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}
          shadow-sm focus:border-blue-500 focus:ring-blue-500 
          dark:bg-gray-800 ${className}`}
      />
      
      {isOpen && filteredOptions.length > 0 && value.trim() && (
        <ul className="absolute z-10 w-full mt-1 max-h-60 overflow-auto
          bg-white dark:bg-gray-800 
          border border-gray-300 dark:border-gray-600
          rounded-md shadow-lg">
          {filteredOptions.map((option, index) => (
            <li
              key={option}
              onClick={() => {
                onChange(option)
                setIsOpen(false)
              }}
              onMouseEnter={() => setSelectedIndex(index)}
              className={`px-3 py-2 cursor-pointer
                ${index === 0 ? 'rounded-t-md' : ''}
                ${index === filteredOptions.length - 1 ? 'rounded-b-md' : ''}
                hover:bg-gray-100 dark:hover:bg-gray-700
                ${index === selectedIndex ? 'bg-blue-50 dark:bg-blue-900/20' : ''}
                ${value === option ? 'text-blue-600 dark:text-blue-400' : ''}`}
            >
              <div className="flex items-center gap-2">
                <i className={`bx bx-${option} text-lg`} />
                <span>{option}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
} 