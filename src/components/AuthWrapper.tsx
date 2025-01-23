'use client'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import FirstTimeSetup from './FirstTimeSetup'
import LandingPage from '@/app/landing/page'
import PublicPage from '@/app/public/page'
import LoginPage from '@/app/login/page'

// Add array of public paths
const PUBLIC_PATHS = [
  '/login',
  '/resetpw',
  '/denied'
]

export default function AuthWrapper({
  children
}: {
  children: React.ReactNode
}) {
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [needsSetup, setNeedsSetup] = useState(false)
  const [isPublic, setIsPublic] = useState(false)
  const pathname = usePathname()

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

        setIsAuthenticated(setupData.isAuthenticated)
        setIsPublic(setupData.isPublic)
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

  // If not authenticated...
  if (!isAuthenticated) {
    // Allow access to public paths without authentication
    if (PUBLIC_PATHS.includes(pathname)) {
      return children
    }

    // Show public version if public access is enabled and we're on the main page
    if (isPublic && pathname === '/') {
      return <PublicPage />
    }
    
    // Otherwise show landing page
    return <LandingPage />
  }

  // Authenticated users see the normal app
  return (
    <div className="min-h-screen flex flex-col">
      {children}
    </div>
  )
} 