import { cookies, headers } from 'next/headers'
import { getMessages, resolveLocaleFromLanguages, translate, type Locale } from '@/lib/i18n'

function isLocale(value: string | undefined): value is Locale {
  return value === 'fr' || value === 'en'
}

/** Resolves the UI locale for Server Components from the BodyOps cookie, then Accept-Language, falling back to French. */
export async function getServerLocale(): Promise<Locale> {
  const cookieStore = await cookies()
  const cookieLocale = cookieStore.get('bodyops:locale')?.value
  if (isLocale(cookieLocale)) return cookieLocale

  const headerStore = await headers()
  return resolveLocaleFromLanguages(headerStore.get('accept-language'), 'fr')
}

/** Returns a server-side translation helper using the locale available during the request. */
export async function getServerTranslations() {
  const locale = await getServerLocale()
  const messages = getMessages(locale)
  return {
    locale,
    t: (key: string) => translate(messages, key),
  }
}
