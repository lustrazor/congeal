'use client'
import React from 'react'
import Header from '@/components/Header'
import { useTranslations } from '@/hooks/useTranslations'

export default function TOSPage() {
  const { t } = useTranslations()

  return (
    <div className="flex-1 flex flex-col">
      <Header />
      <div className="flex-1 overflow-y-auto">
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
          <div className="relative">
            <div className="absolute inset-0 bg-[url('/images/dropshadow2-light.png')] dark:bg-[url('/images/dropshadow2-dark.png')] 
              bg-top bg-repeat-x pointer-events-none" 
            />
            <div className="relative w-full max-w-4xl mx-auto p-6 space-y-8">
              
              {/* License Content */}
              <div className="bg-white dark:bg-gray-800 rounded-lg px-10 py-14 shadow-sm prose dark:prose-invert max-w-none">
                <h1 className="text-2xl font-semibold mb-6">{t('termsOfService')}</h1>
                
                <div className="space-y-6">
                  <section>
                    <h2 className="text-xl font-medium pb-2">{t('serviceDescription')}</h2>
                    <p>{t('serviceDescriptionText')}</p>
                  </section>

                  <section>
                    <h2 className="text-xl font-medium pb-2">{t('dataPrivacySecurity')}</h2>
                    <ul className="list-disc pl-6 space-y-2">
                      <li>{t('dataEncrypted')}</li>
                      <li>{t('httpsEncryption')}</li>
                      <li>{t('noDataAccess')}</li>
                      <li>{t('passwordResetNote')}</li>
                      <li>{t('snapshotWarning')}</li>
                      <li>{t('emailConfig')}</li>
                    </ul>
                  </section>

                  <section>
                    <h2 className="text-xl font-medium pb-2">{t('dataCollection')}</h2>
                    <ul className="list-disc pl-6 space-y-2">
                      <li>{t('anonymousStats')}</li>
                      <li>{t('noDataMining')}</li>
                      <li>{t('statsLimited')}</li>
                      <li>{t('statsOptOut')}</li>
                    </ul>
                  </section>

                  <section>
                    <h2 className="text-xl font-medium pb-2">{t('subscription')}</h2>
                    <ul className="list-disc pl-6 space-y-2">
                      <li>{t('subscriptionRequired')}</li>
                      <li>{t('subscriptionCosts')}</li>
                      <li>{t('serviceTermination')}</li>
                    </ul>
                  </section>

                  <section>
                    <h2 className="text-xl font-medium pb-2">{t('yourRights')}</h2>
                    <ul className="list-disc pl-6 space-y-2">
                      <li>{t('dataRights')}</li>
                      <li>{t('dataExport')}</li>
                      <li>{t('dataDeletion')}</li>
                      <li>{t('optOut')}</li>
                    </ul>
                  </section>

                  <section>
                    <h2 className="text-xl font-medium pb-2">{t('warrantyLiability')}</h2>
                    <p>{t('warrantyText')}</p>
                  </section>

                  <section>
                    <h2 className="text-xl font-medium pb-2">{t('acceptableUse')}</h2>
                    <p>{t('acceptableUseText')}</p>
                  </section>

                  <section className="border-t pt-6 mt-6">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {t('termsFooter')}
                    </p>
                  </section>
                </div>
              </div>
              <br /><br /><br />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 