'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { getMessages, translate, type Locale, type Messages } from '@/lib/i18n'
import { useUIStore } from '@/stores/uiStore'

interface LocaleContextValue {
  locale:    Locale
  setLocale: (locale: Locale) => void
  t:         (key: string) => string
}

const LocaleContext = createContext<LocaleContextValue>({
  locale:    'fr',
  setLocale: () => {},
  t:         (key) => key,
})

function persistLocale(locale: Locale) {
  try {
    localStorage.setItem('bodyops:locale', locale)
  } catch {
    // Cookies keep language persistence working when localStorage is unavailable.
  }
  document.cookie = `bodyops:locale=${locale}; path=/; max-age=31536000; SameSite=Lax`
}

/** Provides locale state and the t() translation function; the server supplies browser/cookie locale, explicit user changes persist it. */
export function LocaleProvider({ children, initialLocale = 'fr' }: { children: ReactNode; initialLocale?: Locale }) {
  const [locale,   setLocaleState] = useState<Locale>(initialLocale)
  const [messages, setMessages]    = useState<Messages>(getMessages(initialLocale))
  const setUILanguage = useUIStore(state => state.setLanguage)

  useEffect(() => {
    setLocaleState(initialLocale)
    setMessages(getMessages(initialLocale))
    setUILanguage(initialLocale)
    document.documentElement.lang = initialLocale
  }, [initialLocale, setUILanguage])

  useEffect(() => {
    document.documentElement.lang = locale
  }, [locale])

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key !== 'bodyops:locale') return
      const nextLocale = event.newValue
      if (nextLocale !== 'fr' && nextLocale !== 'en') return
      setLocaleState(nextLocale)
      setMessages(getMessages(nextLocale))
      setUILanguage(nextLocale)
      document.documentElement.lang = nextLocale
      persistLocale(nextLocale)
    }

    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [setUILanguage])

  const setLocale = (l: Locale) => {
    persistLocale(l)
    setLocaleState(l)
    setMessages(getMessages(l))
    setUILanguage(l)
    document.documentElement.lang = l
  }

  const t = (key: string) => translate(messages, key)

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LocaleContext.Provider>
  )
}

/** Returns the current locale, locale setter, and t() translation helper from the nearest LocaleProvider. */
export function useLocale() {
  return useContext(LocaleContext)
}
