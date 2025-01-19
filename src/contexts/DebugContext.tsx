'use client'
import React, { createContext, useContext, useState } from 'react'

interface DebugContextType {
  isExpanded: boolean
  setIsExpanded: (value: boolean) => void
  commandLog: any
  setCommandLog: (value: any) => void
  responseLog: any
  setResponseLog: (value: any) => void
  isLoading: boolean
  setLoading: (value: boolean) => void
}

const DebugContext = createContext<DebugContextType | undefined>(undefined)

export function DebugProvider({ children }: { children: React.ReactNode }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [commandLog, setCommandLog] = useState<any>(null)
  const [responseLog, setResponseLog] = useState<any>(null)
  const [isLoading, setLoading] = useState(false)

  return (
    <DebugContext.Provider value={{
      isExpanded,
      setIsExpanded,
      commandLog,
      setCommandLog,
      responseLog,
      setResponseLog,
      isLoading,
      setLoading
    }}>
      {children}
    </DebugContext.Provider>
  )
}

export function useDebug() {
  const context = useContext(DebugContext)
  if (context === undefined) {
    throw new Error('useDebug must be used within a DebugProvider')
  }
  return context
} 