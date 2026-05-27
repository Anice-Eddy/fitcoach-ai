'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { detectLocale, getMessages, translate, type Locale, type Messages } from '@/lib/i18n'

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

/** Provides locale state and the t() translation function to the component tree; syncs with localStorage after hydration. */
export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale,   setLocaleState] = useState<Locale>('fr')
  const [messages, setMessages]    = useState<Messages>(getMessages('fr'))
  const [mounted,  setMounted]     = useState(false)

  useEffect(() => {
    const detected = detectLocale()
    setLocaleState(detected)
    setMessages(getMessages(detected))
    setMounted(true)
  }, [])

  if (!mounted) return <>{children}</> // Render children while hydrating

  const setLocale = (l: Locale) => {
    localStorage.setItem('bodyops:locale', l)
    setLocaleState(l)
    setMessages(getMessages(l))
  }

  const t = (key: string) => translate(messages, key)

  // Only render children after hydration to avoid mismatch
  if (!mounted) {
    return (
      <LocaleContext.Provider value={{ locale: 'fr', setLocale, t: (key) => key }}>
        {children}
      </LocaleContext.Provider>
    )
  }

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
