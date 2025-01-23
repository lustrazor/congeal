'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import FirstTimeSetup from '@/components/FirstTimeSetup'

/**
 * Setup page component that handles initial admin user creation.
 * 
 * Validation Requirements:
 * - Username must be a valid email address
 * - Password must be strong, including:
 *   - Minimum 12 characters
 *   - At least one lowercase letter
 *   - At least one uppercase letter
 *   - At least one number
 *   - At least one special character (!@#$%^&*(),.?":{}|<>)
 */
export default function SetupPage() {
  const [isChecking, setIsChecking] = useState(true)
  const [needsSetup, setNeedsSetup] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const checkSetup = async () => {
      try {
        const response = await fetch('/api/auth/check')
        const data = await response.json()

        if (data.isSetup && data.hasUser) {
          router.replace('/login')
          return
        }

        setNeedsSetup(true)
      } catch (error) {
        console.error('Setup check failed:', error)
        setNeedsSetup(true)
      } finally {
        setIsChecking(false)
      }
    }

    checkSetup()
  }, [router])

  if (isChecking) {
    return null
  }

  if (!needsSetup) {
    return null
  }

  return <FirstTimeSetup />
} 
