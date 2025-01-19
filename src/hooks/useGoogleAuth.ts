import { useState, useCallback, useEffect } from 'react'

// These should come from environment variables
const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!
const SCOPES = [
  'https://mail.google.com/',
  'https://www.googleapis.com/auth/gmail.modify',
  'https://www.googleapis.com/auth/gmail.readonly',
  'email',
  'profile'
].join(' ')

export function useGoogleAuth() {
  const [isSignedIn, setIsSignedIn] = useState(false)
  const [email, setEmail] = useState<string | null>(null)
  const [accessToken, setAccessToken] = useState<string | null>(null)

  // Initialize Google client
  useEffect(() => {
    const script = document.createElement('script')
    script.src = 'https://apis.google.com/js/api.js'
    script.onload = () => {
      window.gapi.load('client:auth2', initClient)
    }
    document.body.appendChild(script)

    return () => {
      document.body.removeChild(script)
    }
  }, [])

  const initClient = () => {
    window.gapi.client.init({
      clientId: GOOGLE_CLIENT_ID,
      scope: SCOPES,
      discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/gmail/v1/rest']
    }).then(() => {
      // Listen for sign-in state changes
      const auth2 = window.gapi.auth2.getAuthInstance()
      
      // Handle initial sign-in state
      updateSigninStatus(auth2.isSignedIn.get())

      // Listen for future auth changes
      auth2.isSignedIn.listen(updateSigninStatus)
    })
  }

  const updateSigninStatus = (isSignedIn: boolean) => {
    if (isSignedIn) {
      const auth2 = window.gapi.auth2.getAuthInstance()
      const user = auth2.currentUser.get()
      const profile = user.getBasicProfile()
      const accessToken = user.getAuthResponse().access_token
      
      setIsSignedIn(true)
      setEmail(profile.getEmail())
      setAccessToken(accessToken)
    } else {
      setIsSignedIn(false)
      setEmail(null)
      setAccessToken(null)
    }
  }

  const signIn = useCallback(async () => {
    try {
      const auth2 = window.gapi.auth2.getAuthInstance()
      await auth2.signIn()
    } catch (error) {
      console.error('Google sign in failed:', error)
    }
  }, [])

  const signOut = useCallback(async () => {
    try {
      const auth2 = window.gapi.auth2.getAuthInstance()
      await auth2.signOut()
    } catch (error) {
      console.error('Google sign out failed:', error)
    }
  }, [])

  return {
    signIn,
    signOut,
    isSignedIn,
    email,
    accessToken
  }
}

// Add TypeScript support for the Google API client
declare global {
  interface Window {
    gapi: any
  }
} 