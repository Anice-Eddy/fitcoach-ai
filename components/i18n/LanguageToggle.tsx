'use client'

import { Languages } from 'lucide-react'
import { toast } from 'sonner'
import { useLocale } from '@/contexts/LocaleContext'
import { useUIStore } from '@/stores/uiStore'
import { useUserStore } from '@/stores/userStore'
import type { Locale } from '@/lib/i18n'

const OPTIONS: Array<{ value: Locale; label: string; short: string }> = [
  { value: 'fr', label: 'Français', short: 'FR' },
  { value: 'en', label: 'English', short: 'EN' },
]

interface Props {
  compact?: boolean
}

export function LanguageToggle({ compact = false }: Props) {
  const { locale, setLocale, t } = useLocale()
  const setUILanguage = useUIStore(state => state.setLanguage)
  const updateProfile = useUserStore(state => state.updateProfile)

  const changeLocale = async (nextLocale: Locale) => {
    if (nextLocale === locale) return

    setLocale(nextLocale)
    setUILanguage(nextLocale)
    updateProfile({ language: nextLocale })

    fetch('/api/user/profile', {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ language: nextLocale }),
    }).catch(() => {
      toast.error(t('languageToggle.syncWarning'))
    })
  }

  return (
    <div
      className="inline-flex items-center gap-1 rounded-xl border border-zinc-800 bg-zinc-900 p-1"
      aria-label={t('settings.language')}
    >
      {!compact && <Languages className="ml-2 size-4 text-zinc-500" aria-hidden="true" />}
      {OPTIONS.map(option => {
        const active = locale === option.value
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => changeLocale(option.value)}
            aria-pressed={active}
            title={t(`languageToggle.options.${option.value}`)}
            className={`rounded-lg px-2.5 py-1.5 text-xs font-bold transition-colors ${
              active
                ? 'bg-[#C8F135] text-zinc-950'
                : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
            }`}
          >
            {compact ? option.short : t(`languageToggle.options.${option.value}`)}
          </button>
        )
      })}
    </div>
  )
}
