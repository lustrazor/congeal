import { useState, useCallback } from 'react'

export function useOutlookAuth() {
  const [isSignedIn, setIsSignedIn] = useState(false)
  const [email, setEmail] = useState<string | null>(null)

  const signIn = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/outlook', {
        method: 'POST'
      })
      const data = await response.json()
      
      // Open Microsoft OAuth popup
      window.open(data.authUrl, 'Microsoft Sign In', 'width=500,height=600')

      // Listen for message from popup
      window.addEventListener('message', (event) => {
        if (event.data.type === 'OUTLOOK_AUTH_SUCCESS') {
          setIsSignedIn(true)
          setEmail(event.data.email)
        }
      }, { once: true })
    } catch (error) {
      console.error('Microsoft sign in failed:', error)
    }
  }, [])

  return {
    signIn,
    isSignedIn,
    email
  }
} 