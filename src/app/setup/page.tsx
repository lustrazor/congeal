'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import FirstTimeSetup from '@/components/FirstTimeSetup'

export default function SetupPage() {
  const router = useRouter()
  const [needsSetup, setNeedsSetup] = useState<boolean | null>(null)

  useEffect(() => {
    // Check if app needs setup
    const checkSetup = async () => {
      try {
        const response = await fetch('/api/auth/check')
        const data = await response.json()
        
        if (data.isSetup && data.hasUser) {
          // App is already set up and has an admin user, redirect to login
          router.push('/login')
        } else {
          // App needs setup
          setNeedsSetup(true)
        }
      } catch (error) {
        console.error('Setup check failed:', error)
        // On error, assume setup is needed
        setNeedsSetup(true)
      }
    }

    checkSetup()
  }, [router])

  // Show nothing while checking setup status
  if (needsSetup === null) {
    return null
  }

  return <FirstTimeSetup />
} 
