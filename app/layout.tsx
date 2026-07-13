// Root layout: global providers for SessionProvider, Sonner, locale, and store hydration.

import type { Metadata, Viewport } from 'next'
import { Inter, JetBrains_Mono }   from 'next/font/google'
import { SessionProvider }          from 'next-auth/react'
import { Toaster }                  from 'sonner'
import { LocaleProvider }           from '@/contexts/LocaleContext'
import { StoreHydrator }            from '@/components/StoreHydrator'
import { getServerLocale, getServerTranslations } from '@/lib/i18n/server'
import './globals.css'

const inter = Inter({
  variable: '--font-geist-sans',
  subsets:  ['latin'],
})

const jetbrainsMono = JetBrains_Mono({
  variable: '--font-geist-mono',
  subsets:  ['latin'],
})

export function generateMetadata(): Metadata {
  const { locale, t } = getServerTranslations()

  return {
    title:       { default: 'BodyOps', template: '%s - BodyOps' },
    description: t('appMeta.description'),
    keywords:    t('appMeta.keywords').split(','),
    manifest:    '/manifest.json',
    appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'BodyOps' },
    openGraph: {
      title:       'BodyOps',
      description: t('appMeta.shortDescription'),
      type:        'website',
      locale:      locale === 'fr' ? 'fr_FR' : 'en_US',
    },
  }
}

export const viewport: Viewport = {
  themeColor:   '#C8F135',
  width:        'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = getServerLocale()

  return (
    <html lang={locale} className="dark">
      <body className={`${inter.variable} ${jetbrainsMono.variable} antialiased`}>
        <SessionProvider>
          <LocaleProvider initialLocale={locale}>
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
