import { cookies, headers } from 'next/headers'
import { getMessages, resolveLocaleFromLanguages, translate, type Locale } from '@/lib/i18n'

function isLocale(value: string | undefined): value is Locale {
  return value === 'fr' || value === 'en'
}

/** Resolves the UI locale for Server Components from the BodyOps cookie, then Accept-Language, falling back to French. */
export function getServerLocale(): Locale {
  const cookieLocale = cookies().get('bodyops:locale')?.value
  if (isLocale(cookieLocale)) return cookieLocale

  return resolveLocaleFromLanguages(headers().get('accept-language'), 'fr')
}

/** Returns a server-side translation helper using the locale available during the request. */
export function getServerTranslations() {
  const locale = getServerLocale()
  const messages = getMessages(locale)
  return {
    locale,
    t: (key: string) => translate(messages, key),
  }
}
