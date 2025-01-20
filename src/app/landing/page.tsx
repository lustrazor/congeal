'use client'
import { useState, useEffect } from 'react'
import { useTranslations } from '@/hooks/useTranslations'
import { useSettings } from '@/hooks/useSettings'
import { useRouter, usePathname } from 'next/navigation'
import { useDebugStore } from '@/stores/debugStore'
import 'boxicons/css/boxicons.min.css'

export default function AccessDenied() {
  const { t } = useTranslations()
  const { settings } = useSettings()
  const router = useRouter()
  const pathname = usePathname()
  const [isChecking, setIsChecking] = useState(true)
  const debugStore = useDebugStore()
  
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


  return (
    <div className="flex-1 flex flex-col">
      <div className="flex-1 overflow-y-auto">
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
          <div className="relative">
            <div className="absolute inset-0 bg-[url('/images/dropshadow2-light.png')] dark:bg-[url('/images/dropshadow2-dark.png')] 
              bg-top bg-repeat-x pointer-events-none" />
            <div className="h-screen flex items-center justify-center">
            <div className="relative w-full sm:max-w-md md:max-w-lg lg:max-w-2xl mx-auto space-y-8 mb-20">
              <div className="flex flex-col justify-center items-center bg-white dark:bg-gray-800 rounded-lg py-20 mb-20 shadow-sm">
                <h1 className="text-xl font-bold mb-2 ">
                {settings?.title || 'Congeal'}
                </h1>
                <p className="text-gray-500 dark:text-gray-400">
                  {t('noAccess')}
                </p>
              </div>
            </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

