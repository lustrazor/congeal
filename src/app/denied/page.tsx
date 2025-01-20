'use client'
import { useState, useEffect } from 'react'
import Header from '@/components/HeaderPublic'
import { useTranslations } from '@/hooks/useTranslations'
import { useSettings } from '@/hooks/useSettings'
import { useRouter, usePathname } from 'next/navigation'
import 'boxicons/css/boxicons.min.css'

export default function AccessDenied() {
  const { t } = useTranslations()
  const { settings } = useSettings()
  const router = useRouter()
  const pathname = usePathname()
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    const checkAccess = async () => {
      try {
        const response = await fetch('/api/auth/check')
        const data = await response.json()
        
        // Only redirect to public if we're not already on the denied page
        if (data.isPublic && pathname !== '/denied') {
          router.push('/public')
        }
        
        setIsChecking(false)
      } catch (error) {
        console.error('Failed to check access:', error)
        setIsChecking(false)
      }
    }

    checkAccess()
  }, [router, pathname])

  if (isChecking) {
    return (
      <div className="flex-1 flex flex-col">
        <Header />
        <div className="flex-1 overflow-y-auto">
          <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <div className="relative w-full max-w-4xl mx-auto p-6 space-y-8">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
                <div className="text-gray-500 dark:text-gray-400">
                  {t('loading')}...
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col">
      <Header />
      <div className="flex-1 overflow-y-auto">
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
          <div className="relative">
            <div className="absolute inset-0 bg-[url('/images/dropshadow2-light.png')] dark:bg-[url('/images/dropshadow2-dark.png')] 
              bg-top bg-repeat-x pointer-events-none" />
            <div className="relative w-full max-w-4xl mx-auto p-6 space-y-8">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
                <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
                  {t('accessDenied')}
                </h2>
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  {t('noAccess')}
                </p>
                <div className="mt-6">
                  <button
                    onClick={() => router.push('/')}
                    className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300" >
                    ← {t('backToHome')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 
