import React from 'react'
import './globals.css'
import { Barlow, Figtree, Inter } from 'next/font/google'
import Footer from '@/components/Footer'
import AuthWrapper from '@/components/AuthWrapper'
import { Toaster } from 'react-hot-toast'
import Providers from '@/components/Providers'

const barlow = Barlow({ 
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-barlow',
})

const figtree = Figtree({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-figtree',
})

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata = {
  title: 'Congeal',
  description: 'Create balanced groups with ease',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${barlow.className} ${barlow.variable}`}>
        <noscript>
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-90">
            <div className="max-w-md p-6 bg-white dark:bg-gray-800 rounded-lg shadow-xl text-center">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                JavaScript Required
              </h2>
              <p className="text-gray-600 dark:text-gray-300">
                Please enable JavaScript in your browser settings or disable JavaScript blocking extensions to view this page.
              </p>
            </div>
          </div>
        </noscript>
        <Providers>
          <AuthWrapper>
            {children}
            <Footer />
          </AuthWrapper>
          <Toaster />
        </Providers>
      </body>
    </html>
  )
} 