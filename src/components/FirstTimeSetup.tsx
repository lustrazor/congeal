'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from '@/hooks/useTranslations'

// Add email validation function
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Add password validation function
const isValidPassword = (password: string): { isValid: boolean; error: string } => {
  if (password.length < 12) {
    return { isValid: false, error: 'Password must be at least 12 characters long' }
  }
  
  const hasLowerCase = /[a-z]/.test(password)
  const hasUpperCase = /[A-Z]/.test(password)
  const hasNumber = /\d/.test(password)
  const hasSpecialChar = /[!#$%&_-]/.test(password)

  if (!hasLowerCase) {
    return { isValid: false, error: 'Password must include at least one lowercase letter' }
  }
  if (!hasUpperCase) {
    return { isValid: false, error: 'Password must include at least one uppercase letter' }
  }
  if (!hasNumber) {
    return { isValid: false, error: 'Password must include at least one number' }
  }
  if (!hasSpecialChar) {
    return { isValid: false, error: 'Password must include at least one special character (!#$%&_-)' }
  }

  return { isValid: true, error: '' }
}

export default function FirstTimeSetup() {
  const { t } = useTranslations()
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [includeSeedData, setIncludeSeedData] = useState(true)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validate email
    if (!isValidEmail(username)) {
      setError(t('invalidEmail'))
      return
    }

    // Validate password
    if (password.length < 12) {
      setError(t('passwordTooShort'))
      return
    }

    const hasLowerCase = /[a-z]/.test(password)
    const hasUpperCase = /[A-Z]/.test(password)
    const hasNumber = /\d/.test(password)
    const hasSpecialChar = /[!#$%&_-]/.test(password)

    if (!hasLowerCase || !hasUpperCase || !hasNumber || !hasSpecialChar) {
      setError(t('passwordRequirements'))
      return
    }

    if (password !== confirmPassword) {
      setError(t('passwordsDoNotMatch'))
      return
    }

    setIsSubmitting(true)

    try {
      // First initialize the database
      const initDbResponse = await fetch('/api/auth/init-db', {
        method: 'POST'
      })

      if (!initDbResponse.ok) {
        throw new Error('Failed to initialize database')
      }

      // Then create admin account
      const response = await fetch('/api/auth/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          password,
          includeSeedData
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create admin account')
      }

      // After successful initialization, log the user in
      const loginResponse = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          password
        })
      })

      if (!loginResponse.ok) {
        // If login fails, redirect to login page
        router.replace('/login')
        return
      }

      // If login succeeds, redirect to home
      window.location.href = '/'

    } catch (error) {
      console.error('Setup failed:', error)
      setError(error instanceof Error ? error.message : 'Failed to complete setup')
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            {t('createAdminAccount')}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            {t('setupInstructions')}
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('setupUsername')}
            </label>
            <input
              type="email"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              required
              disabled={isSubmitting}
              placeholder="admin@example.com"
              pattern="[^\s@]+@[^\s@]+\.[^\s@]+"
              title="Please enter a valid email address"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('setupPassword')}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              required
              disabled={isSubmitting}
              pattern="^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!#$%&_-])[A-Za-z\d!#$%&_-]{12,}$"
              title="Password must meet all requirements listed below"
            />
            <div className="mt-1 text-sm text-gray-500 dark:text-gray-400 space-y-1">
              <p>Password must:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Be at least 12 characters long</li>
                <li>Include at least one lowercase letter</li>
                <li>Include at least one uppercase letter</li>
                <li>Include at least one number</li>
                <li>Include at least one special character (!#$%&_-)</li>
              </ul>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('setupConfirmPassword')}
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="seedData"
              checked={includeSeedData}
              onChange={(e) => setIncludeSeedData(e.target.checked)}
              className="h-8 w-8 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              disabled={isSubmitting}
            />
            <label htmlFor="seedData" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">
              {t('setupSeedData')}
            </label>
          </div>

          {error && (
            <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4">
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className={`group relative w-full flex justify-center py-2 px-4 border border-transparent 
              text-sm font-medium rounded-md text-white 
              ${isSubmitting 
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-500 hover:bg-blue-600'
              }
              transition-colors duration-200
            `}
          >
            {isSubmitting ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {t('setupProcessing')}
              </span>
            ) : (
              t('setupButton')
            )}
          </button>
        </form>
      </div>
    </div>
  )
} 