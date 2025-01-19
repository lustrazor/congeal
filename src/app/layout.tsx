import React from 'react'
import './globals.css'
import { Barlow, Figtree } from 'next/font/google'
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
      <body className={`${barlow.className} ${figtree.variable}`}>
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