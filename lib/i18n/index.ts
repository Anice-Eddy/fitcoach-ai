import fr from '@/messages/fr.json'
import en from '@/messages/en.json'

export type Locale = 'fr' | 'en'
export type Messages = typeof fr

const messages: Record<Locale, Messages> = { fr, en }

export function detectLocale(): Locale {
  if (typeof window === 'undefined') return 'fr'
  const stored = localStorage.getItem('bodyops:locale') as Locale | null
  if (stored === 'fr' || stored === 'en') return stored
  const lang = navigator.language.toLowerCase()
  return lang.startsWith('fr') ? 'fr' : 'en'
}

export function getMessages(locale: Locale): Messages {
  return messages[locale]
}

// Dot-notation path accessor, e.g. t('nav.dashboard')
type PathsOf<T, P extends string = ''> = T extends object
  ? { [K in keyof T]: PathsOf<T[K], P extends '' ? string & K : `${P}.${string & K}`> }[keyof T]
  : P

export type TranslationKey = PathsOf<Messages>

export function translate(messages: Messages, key: string): string {
  const parts = key.split('.')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let result: any = messages
  for (const part of parts) {
    result = result?.[part]
    if (result === undefined) return key
  }
  return typeof result === 'string' ? result : key
}
