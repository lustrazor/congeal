'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from '@/hooks/useTranslations'

type ResetStep = 'email' | 'code' | 'password'

export default function ResetPasswordPage() {
  const [username, setUsername] = useState('')
  const [code, setCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentStep, setCurrentStep] = useState<ResetStep>('email')
  const router = useRouter()
  const { t } = useTranslations()

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/auth/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to request password reset')
      }

      // Move to code verification step
      setCurrentStep('code')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to request password reset')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/auth/verify-reset-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, code })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Invalid reset code')
      }

      // Move to password reset step
      setCurrentStep('password')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to verify reset code')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (newPassword.length < 12) {
      setError('Password must be at least 12 characters long')
      return
    }
    
    const hasLowerCase = /[a-z]/.test(newPassword)
    const hasUpperCase = /[A-Z]/.test(newPassword)
    const hasNumber = /\d/.test(newPassword)
    const hasSpecialChar = /[!#$%&_-]/.test(newPassword)

    if (!hasLowerCase) {
      setError('Password must include at least one lowercase letter')
      return
    }
    if (!hasUpperCase) {
      setError('Password must include at least one uppercase letter')
      return
    }
    if (!hasNumber) {
      setError('Password must include at least one number')
      return
    }
    if (!hasSpecialChar) {
      setError('Password must include at least one special character (!#$%&_-)')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          username,
          code,
          newPassword 
        })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to reset password')
      }

      // Redirect to login
      router.push('/login')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset password')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {currentStep === 'email' && (
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
              {t('resetPasswordTitle')}
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
              {t('resetPasswordSubtitle')}
            </p>
          </div>
        )}

        {currentStep === 'code' && (
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
              {t('verifyCodeTitle')}
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
              {t('verifyCodeSubtitle')}
            </p>
          </div>
        )}

        {currentStep === 'password' && (
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
              {t('resetPasswordTitle')}
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
              {t('enterNewPasswordSubtitle')}
            </p>
          </div>
        )}

        {currentStep === 'email' && (
          <form onSubmit={handleRequestReset} className="mt-8 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('email')}
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

            {error && (
              <p className="text-sm text-red-500">{error}</p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className={`
                w-full px-4 py-2 rounded-md text-white
                ${isSubmitting 
                  ? 'bg-blue-400 cursor-not-allowed' 
                  : 'bg-blue-500 hover:bg-blue-600'
                }
                transition-colors duration-200
              `}
            >
              {isSubmitting ? t('resetPasswordProcessing') : t('resetPasswordButton')}
            </button>
          </form>
        )}

        {currentStep === 'code' && (
          <form onSubmit={handleVerifyCode} className="mt-8 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('resetCode')}
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
                disabled={isSubmitting}
                placeholder="Enter reset code"
              />
            </div>

            {error && (
              <p className="text-sm text-red-500">{error}</p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className={`
                w-full px-4 py-2 rounded-md text-white
                ${isSubmitting 
                  ? 'bg-blue-400 cursor-not-allowed' 
                  : 'bg-blue-500 hover:bg-blue-600'
                }
                transition-colors duration-200
              `}
            >
              {isSubmitting ? t('verifying') : t('verifyCode')}
            </button>
          </form>
        )}

        {currentStep === 'password' && (
          <form onSubmit={handlePasswordReset} className="mt-8 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('newPassword')}
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
                disabled={isSubmitting}
                pattern="^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!#$%&_-])[A-Za-z\d!#$%&_-]{12,}$"
                title="Password must meet all requirements"
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
                {t('confirmNewPassword')}
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

            {error && (
              <p className="text-sm text-red-500">{error}</p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className={`
                w-full px-4 py-2 rounded-md text-white
                ${isSubmitting 
                  ? 'bg-blue-400 cursor-not-allowed' 
                  : 'bg-blue-500 hover:bg-blue-600'
                }
                transition-colors duration-200
              `}
            >
              {isSubmitting ? t('resetting') : t('resetPasswordTitle')}
            </button>
          </form>
        )}
      </div>
    </div>
  )
} 