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

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale,   setLocaleState] = useState<Locale>('fr')
  const [messages, setMessages]    = useState<Messages>(getMessages('fr'))

  useEffect(() => {
    const detected = detectLocale()
    setLocaleState(detected)
    setMessages(getMessages(detected))
  }, [])

  const setLocale = (l: Locale) => {
    localStorage.setItem('bodyops:locale', l)
    setLocaleState(l)
    setMessages(getMessages(l))
  }

  const t = (key: string) => translate(messages, key)

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LocaleContext.Provider>
  )
}

export function useLocale() {
  return useContext(LocaleContext)
}
