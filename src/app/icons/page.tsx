'use client'
import React, { useState } from 'react'
import Header from '@/components/Header'
import { validBoxIcons } from '@/lib/iconValidator'
import { useTranslations } from '@/hooks/useTranslations'
import { useToast } from '@/hooks/useToast'

export default function IconsPage() {
  const { t } = useTranslations()
  const toast = useToast()
  const [searchTerm, setSearchTerm] = useState('')
  
  const filteredIcons = validBoxIcons.filter(icon => 
    icon.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="flex-1 flex flex-col">
      <Header />
      <div className="flex-1 overflow-y-auto">
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
          <div className="relative">
            <div className="absolute inset-0 bg-[url('/images/dropshadow2-light.png')] dark:bg-[url('/images/dropshadow2-dark.png')] 
              bg-top bg-repeat-x pointer-events-none" 
            />
            <div className="relative w-full max-w-7xl mx-auto p-6 space-y-8">
              
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
                {/* Usage Instructions */}
                <div className="mx-auto mb-4 bg-blue-50 dark:bg-gray-900 p-4 text-gray-600 dark:text-gray-400 rounded-md font-normal">
                  <p>{t('iconInstructions')}</p>
                </div>

                {/* Search Bar */}
                <div className="max-w-xl mx-auto">
                  <input
                    type="text"
                    placeholder={t('searchIcons')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600
                      bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                      focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Icon Count */}
                <div className="text-center mb-4 mt-2 text-sm text-gray-600 dark:text-gray-400">
                  {t('iconsFound').replace('{count}', filteredIcons.length.toString())}
                </div>

                {/* Icon Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
                  {filteredIcons.map((iconName) => (
                    <div
                      key={iconName}
                      className="flex flex-col items-center gap-2 p-4 rounded-lg
                        border border-gray-200 dark:border-gray-700
                        hover:bg-gray-50 dark:hover:bg-gray-700
                        transition-colors cursor-pointer
                        group"
                      onClick={() => {
                        navigator.clipboard.writeText(iconName)
                        toast.success(t('iconCopied'))
                      }}
                    >
                      <div className="text-2xl text-gray-600 dark:text-gray-300
                        group-hover:text-blue-500 dark:group-hover:text-blue-400">
                        <i className={`bx bxs-${iconName}`}></i>
                      </div>
                      <div className="text-xs text-center text-gray-600 dark:text-gray-400
                        group-hover:text-blue-500 dark:group-hover:text-blue-400">
                        {iconName}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 