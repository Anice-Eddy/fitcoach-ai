'use client'

import { useUIStore } from '@/stores/uiStore'
import { Menu } from 'lucide-react'
import { UserDropdown } from '@/components/ui/UserDropdown'
import { NotificationPanel } from '@/components/ui/NotificationPanel'
import { LanguageToggle } from '@/components/i18n/LanguageToggle'
import { useLocale } from '@/contexts/LocaleContext'
import { formattedAppVersion } from '@/lib/app-version'

interface HeaderProps { title?: string; titleKey?: string }

/** Sticky app header with sidebar toggle (mobile), optional page title, notification panel, and user dropdown. */
export function Header({ title, titleKey }: HeaderProps) {
  const { toggleSidebar } = useUIStore()
  const { t } = useLocale()
  const resolvedTitle = titleKey ? t(titleKey) : title

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b border-zinc-800 bg-zinc-950/90 px-4 backdrop-blur-sm lg:px-6">
      <button
        onClick={toggleSidebar}
        className="text-zinc-400 hover:text-white lg:hidden"
        aria-label={t('common.openMenu')}
      >
        <Menu className="size-5" />
      </button>

      {resolvedTitle && (
        <h1 className="text-base font-semibold text-white truncate">{resolvedTitle}</h1>
      )}

      <div className="ml-auto flex items-center gap-3">
        <span className="hidden rounded-full border border-zinc-800 px-2 py-1 text-[11px] font-medium text-zinc-500 sm:inline-flex">
          {formattedAppVersion()}
        </span>
        <LanguageToggle compact />
        <NotificationPanel />
        <UserDropdown />
      </div>
    </header>
  )
}
