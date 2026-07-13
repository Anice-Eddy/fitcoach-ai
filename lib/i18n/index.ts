import fr from '@/messages/fr.json'
import en from '@/messages/en.json'

export type Locale = 'fr' | 'en'
export type Messages = typeof fr

const messages: Record<Locale, Messages> = { fr, en }

function isLocale(value: string | undefined): value is Locale {
  return value === 'fr' || value === 'en'
}

/** Resolves the first supported locale from a browser language header/list, honoring q-values. */
export function resolveLocaleFromLanguages(value: string | readonly string[] | null | undefined, fallback: Locale = 'fr'): Locale {
  const raw = typeof value === 'string' ? value : value?.join(',')
  if (!raw) return fallback

  const candidates = raw
    .split(',')
    .map((part, index) => {
      const [tag = '', ...params] = part.trim().toLowerCase().split(';')
      const qParam = params.find(param => param.trim().startsWith('q='))
      const q = qParam ? Number(qParam.split('=')[1]) : 1
      return { tag, q: Number.isFinite(q) ? q : 0, index }
    })
    .sort((a, b) => b.q - a.q || a.index - b.index)

  for (const candidate of candidates) {
    const base = candidate.tag.split('-')[0]
    if (isLocale(base)) return base
  }

  return fallback
}

/** Detects the preferred locale from localStorage, falling back to the browser language, then the provided fallback. */
export function detectLocale(fallback: Locale = 'fr'): Locale {
  if (typeof window === 'undefined') return fallback
  let stored: string | null = null
  try {
    stored = localStorage.getItem('bodyops:locale')
  } catch {
    stored = null
  }
  if (stored === 'fr' || stored === 'en') return stored
  const languages = navigator.languages?.length ? navigator.languages : [navigator.language]
  return resolveLocaleFromLanguages(languages, fallback)
}

/** Returns the full messages object for the given locale. */
export function getMessages(locale: Locale): Messages {
  return messages[locale]
}

// Dot-notation path accessor, e.g. t('nav.dashboard')
type PathsOf<T, P extends string = ''> = T extends object
  ? { [K in keyof T]: PathsOf<T[K], P extends '' ? string & K : `${P}.${string & K}`> }[keyof T]
  : P

export type TranslationKey = PathsOf<Messages>

/** Resolves a dot-notation translation key against the messages object; returns the key itself if the path is not found. */
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
