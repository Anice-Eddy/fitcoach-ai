// Root layout — providers globaux : SessionProvider, Sonner

import type { Metadata, Viewport } from 'next'
import { Inter, JetBrains_Mono }   from 'next/font/google'
import { SessionProvider }          from 'next-auth/react'
import { Toaster }                  from 'sonner'
import { LocaleProvider }           from '@/contexts/LocaleContext'
import { StoreHydrator }            from '@/components/StoreHydrator'
import './globals.css'

const inter = Inter({
  variable: '--font-geist-sans',
  subsets:  ['latin'],
})

const jetbrainsMono = JetBrains_Mono({
  variable: '--font-geist-mono',
  subsets:  ['latin'],
})

export const metadata: Metadata = {
  title:       { default: 'BodyOps', template: '%s · BodyOps' },
  description: 'Votre coach fitness personnalisé alimenté par l\'IA — programmes, nutrition, progression.',
  keywords:    ['fitness', 'coach', 'IA', 'nutrition', 'musculation', 'entraînement'],
  manifest:    '/manifest.json',
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'BodyOps' },
  openGraph: {
    title:       'BodyOps',
    description: 'Votre coach fitness personnalisé alimenté par l\'IA',
    type:        'website',
    locale:      'fr_FR',
  },
}

export const viewport: Viewport = {
  themeColor:   '#C8F135',
  width:        'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className="dark">
      <body className={`${inter.variable} ${jetbrainsMono.variable} antialiased`}>
        <SessionProvider>
          <LocaleProvider>
            <StoreHydrator />
            {children}
            <Toaster
              theme="dark"
              position="top-right"
              toastOptions={{
                style: { background: '#18181b', border: '1px solid #27272a', color: '#fafafa' },
              }}
            />
          </LocaleProvider>
        </SessionProvider>
      </body>
    </html>
  )
}
