// Root layout — providers globaux : SessionProvider, Sonner, QueryClient

import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono }       from 'next/font/google'
import { SessionProvider }          from 'next-auth/react'
import { Toaster }                  from 'sonner'
import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets:  ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets:  ['latin'],
})

export const metadata: Metadata = {
  title:       { default: 'FitCoachAI', template: '%s · FitCoachAI' },
  description: 'Votre coach fitness personnalisé alimenté par l\'IA — programmes, nutrition, progression.',
  keywords:    ['fitness', 'coach', 'IA', 'nutrition', 'musculation', 'entraînement'],
  manifest:    '/manifest.json',
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'FitCoachAI' },
  openGraph: {
    title:       'FitCoachAI',
    description: 'Votre coach fitness personnalisé alimenté par l\'IA',
    type:        'website',
    locale:      'fr_FR',
  },
}

export const viewport: Viewport = {
  themeColor:       '#C8F135',
  width:            'device-width',
  initialScale:     1,
  maximumScale:     1,
  userScalable:     false,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className="dark">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <SessionProvider>
          {children}
          <Toaster
            theme="dark"
            position="top-right"
            toastOptions={{
              style: { background: '#18181b', border: '1px solid #27272a', color: '#fafafa' },
            }}
          />
        </SessionProvider>
      </body>
    </html>
  )
}
