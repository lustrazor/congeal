'use client'
import React from 'react'
import { urlRegex } from '@/lib/utils'

interface FormattedDescriptionProps {
  text: string
  className?: string
}

export default function FormattedDescription({ text, className = '' }: FormattedDescriptionProps) {
  const parts = text.split(urlRegex)
  
  return (
    <span className={className}>
      {parts.map((part, i) => {
        if (part.match(urlRegex)) {
          return (
            <a 
              key={i}
              href={part}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 underline"
            >
              {part}
            </a>
          )
        }
        return part
      })}
    </span>
  )
} 