'use client'
import { useState, useEffect } from 'react'
import { useQuotes } from '@/hooks/useQuotes'

export default function QuoteDisplay() {
  const { quotes } = useQuotes()
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0)

  useEffect(() => {
    if (!quotes?.length) return

    // Rotate quotes every 10 seconds
    const interval = setInterval(() => {
      setCurrentQuoteIndex(prev => (prev + 1) % quotes.length)
    }, 10000)

    return () => clearInterval(interval)
  }, [quotes?.length])

  if (!quotes?.length) return null

  const quote = quotes[currentQuoteIndex]

  return (
    <div>
      <span>{quote.quote}</span>
      {quote.thinker && (
        <>
          <span className="mx-2">—</span>
          <span>{quote.thinker}</span>
        </>
      )}
    </div>
  )
} 