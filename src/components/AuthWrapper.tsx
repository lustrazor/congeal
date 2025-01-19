'use client'
import { useEffect, useState } from 'react'
import FirstTimeSetup from './FirstTimeSetup'
import LoginPage from '@/app/login/page'

export default function AuthWrapper({
  children
}: {
  children: React.ReactNode
}) {
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [needsSetup, setNeedsSetup] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // First check if app needs setup
        const setupResponse = await fetch('/api/auth/check')
        const setupData = await setupResponse.json()
        
        if (!setupData.isSetup) {
          setNeedsSetup(true)
          setIsLoading(false)
          return
        }

        // Then check if user is authenticated
        const authResponse = await fetch('/api/auth/session')
        const authData = await authResponse.json()
        
        setIsAuthenticated(authData.isAuthenticated)
      } catch (error) {
        console.error('Auth check failed:', error)
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [])

  if (isLoading) return null

  if (needsSetup) {
    return <FirstTimeSetup />
  }

  if (!isAuthenticated) {
    return <LoginPage />
  }

  return (
    <div className="min-h-screen flex flex-col">
      {children}
    </div>
  )
} 