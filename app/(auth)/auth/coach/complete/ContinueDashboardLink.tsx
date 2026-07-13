'use client'

import { useLocale } from '@/contexts/LocaleContext'

/** Client-only translated link because the app locale is stored in localStorage. */
export function ContinueDashboardLink() {
  const { t } = useLocale()
  return (
    <a href="/coach/dashboard" className="text-sm text-zinc-400 transition-colors hover:text-white">
      {t('coachCompletion.continueDashboard')}
    </a>
  )
}
