'use client'
import Link from 'next/link'
import { useSettings } from '@/hooks/useSettings'
import { useEffect } from 'react'
import { useDebugStore } from '@/stores/debugStore'
import { useTranslations } from '@/hooks/useTranslations'
import Clock from './Clock'

const Header = () => {
  const { settings, mutate } = useSettings();
  const debugStore = useDebugStore();
  const { t } = useTranslations();

  // Add debug logging to see what we're getting
  useEffect(() => {
    if (debugStore.isEnabled) {
      console.log('Header Settings:', {
        headerEnabled: settings?.headerEnabled,
        headerImage: settings?.headerImage,
      });
    }
  }, [settings?.headerEnabled, settings?.headerImage, debugStore.isEnabled]);

  // Get the header image URL - use default if header is disabled or no custom image
  const headerImageUrl = settings?.headerEnabled && settings?.headerImage
    ? settings.headerImage.startsWith('/uploads/')
      ? settings.headerImage  // Already has /uploads/ prefix
      : `/uploads/${settings.headerImage}` // Add prefix if needed
    : '/images/headerbg-default.jpg'

  // Also log the final URL for debugging
  useEffect(() => {
    if (debugStore.isEnabled) {
      console.log('Header Image URL:', headerImageUrl);
    }
  }, [headerImageUrl, debugStore.isEnabled]);

  // Update document class when theme changes
  useEffect(() => {
    if (settings?.isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings?.isDark]);

  const handleThemeChange = async () => {
    const newIsDark = !settings?.isDark
    debugStore.log('Theme changed', {
      type: 'THEME_CHANGE',
      data: {
        isDark: newIsDark,
        timestamp: new Date().toISOString()
      }
    })

    try {
      const response = await fetch('/api/settings', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ isDark: newIsDark })
      })

      if (!response.ok) {
        throw new Error('Failed to update theme')
      }

      // Get updated settings
      const data = await response.json()
      
      // Update settings state
      await mutate(data)

      // Update local storage
      localStorage.setItem('theme', newIsDark ? 'dark' : 'light')

      // Update document class
      if (newIsDark) {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }

      debugStore.log('Theme saved', {
        type: 'THEME_SAVED',
        data: {
          isDark: newIsDark,
          timestamp: new Date().toISOString()
        }
      })
    } catch (error) {
      console.error('Failed to update theme:', error)
      debugStore.log('Failed to update theme', {
        type: 'THEME_ERROR',
        error: String(error),
        timestamp: new Date().toISOString()
      })
    }
  }

  return (
    <header 
      className={`
        relative border-b border-gray-400 dark:border-gray-700 
        shadow-sm transition-all duration-300
        ${settings?.headerEnabled ? 'h-80' : 'h-20'}
      `}
    >
      <img
        src={headerImageUrl}
        alt="Header"
        className="absolute inset-0 w-full h-full object-cover"
      />
      
      {/* Add overlay for both custom and default backgrounds */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />

      {/* Clock container - positioned at top */}
      <div className="absolute top-0 right-0 px-4 py-1 mt-2 mr-3 bg-black/70 dark:bg-black/70 rounded-md border border-gray-800 border-gray-800">
        <Clock />
      </div>

      <div className={`
        absolute bottom-0 left-0 right-0
        container mx-auto px-6 h-11 
        flex items-baseline justify-between
        text-white
      `}>
        <div className="flex items-baseline gap-6">
          <Link 
            href="/"
            className="hover:opacity-80 transition-opacity"
          >
            <h1 className="text-xl font-bold">
              {settings?.title || 'Congeal'}
            </h1>
          </Link>
          {settings?.tagline && (
            <span className="text-sm text-gray-400 dark:text-gray-400">
              {settings.tagline}
            </span>
          )}
        </div>

        <div className="flex items-center gap-0 mt-auto pb-2">
          {/* Home Link */}
          <Link 
            href="/"
            className="text-gray-400 hover:text-white transition-all transform hover:-translate-y-1 p-2 rounded-lg pb-2"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </Link>

          {/* Quotes Link */}
          <Link 
            href="/quotes"
            className="text-gray-400 hover:text-white transition-all transform hover:-translate-y-1 p-2 rounded-lg pb-0"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10.5h8m-8 4h8M9 17h6M3 8.2V14a2 2 0 002 2h14a2 2 0 002-2V8.2c0-1.12 0-1.68-.218-2.108a2 2 0 00-.874-.874C19.48 5 18.92 5 17.8 5H6.2c-1.12 0-1.68 0-2.108.218a2 2 0 00-.874.874C3 6.52 3 7.08 3 8.2z" />
            </svg>
          </Link>


          {/* Email Link - only show if enabled */}
          {settings?.emailEnabled && (
            <Link 
              href="/email"
              className="text-gray-400 hover:text-white transition-all transform hover:-translate-y-1 p-2 rounded-lg pb-1"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </Link>
          )}

          {/* Theme Toggle */}
          <button 
            onClick={handleThemeChange}
            className="text-gray-400 hover:text-white transition-all transform hover:-translate-y-1 p-2 rounded-lg pb-2"
          >
            {settings?.isDark ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>

          {/* Settings Link */}
          <Link 
            href="/settings"
            className="text-gray-400 hover:text-white transition-all transform hover:-translate-y-1 p-2 rounded-lg pb-1"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </Link>


        </div>
      </div>
    </header>
  );
};

export default Header; 