'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { BriefcaseBusiness, ChevronDown, LogOut, User, Ruler, Sparkles, SlidersHorizontal, Settings } from 'lucide-react'
import { useUserStore } from '@/stores/userStore'
import { signOutAndClear } from '@/lib/auth/client-session'
import { useLocale } from '@/contexts/LocaleContext'

const MEMBER_LINKS = [
  { href: '/settings', labelKey: 'userDropdown.links.allSettings', icon: Settings },
  { href: '/settings/profile', labelKey: 'userDropdown.links.profile', icon: User },
  { href: '/settings/body', labelKey: 'userDropdown.links.body', icon: Ruler },
  { href: '/settings/plan', labelKey: 'userDropdown.links.plan', icon: Sparkles },
  { href: '/settings/preferences', labelKey: 'userDropdown.links.preferences', icon: SlidersHorizontal },
]

function initials(name: string, email: string, defaultName: string) {
  const source = name !== defaultName ? name : email
  return source
    .split(/[\s@._-]+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || '?'
}

/** Member account dropdown with avatar, name, email, settings links, and a sign-out button; closes on outside pointer events. */
export function UserDropdown() {
  const { t } = useLocale()
  const { data: session } = useSession()
  const { profile } = useUserStore()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const defaultName = t('userDropdown.defaultName')
  const name = session?.user?.name ?? profile?.firstName ?? defaultName
  const email = session?.user?.email ?? t('userDropdown.emailMissing')

  useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex items-center gap-2 rounded-lg p-1 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white disabled:opacity-50"
        aria-label={t('userDropdown.openMenu')}
        aria-expanded={open}
      >
        {session?.user?.image ? (
          <Image
            src={session.user.image}
            alt={name}
            width={32}
            height={32}
            className="rounded-full ring-2 ring-zinc-700 transition-all hover:ring-[#C8F135]"
          />
        ) : (
          <span className="flex size-8 items-center justify-center rounded-full bg-[#C8F135]/15 text-xs font-semibold text-[#C8F135] ring-2 ring-zinc-700">
            {initials(name, email, defaultName)}
          </span>
        )}
        <ChevronDown className={`hidden size-3.5 transition-transform sm:block ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="fixed left-4 right-4 top-16 z-50 overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950 shadow-2xl shadow-black/40 sm:absolute sm:left-auto sm:right-0 sm:top-11 sm:w-72">
          <div className="px-4 py-3">
            <p className="truncate text-sm font-medium text-white">{name}</p>
            <p className="truncate text-xs text-zinc-500">{email}</p>
          </div>
          <div className="h-px bg-zinc-800" />
          <p className="px-4 pt-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-600">
            {t('userDropdown.settingsShortcuts')}
          </p>
          <div className="py-1">
            {MEMBER_LINKS.map(({ href, labelKey, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-300 transition-colors hover:bg-zinc-900 hover:text-white"
              >
                <Icon className="size-4 text-zinc-500" />
                {t(labelKey)}
              </Link>
            ))}
          </div>
          <div className="h-px bg-zinc-800" />
          {session?.user?.isCoach && (
            <>
              <div className="py-1">
                <Link
                  href="/coach/dashboard"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-[#C8F135] transition-colors hover:bg-[#C8F135]/10"
                >
                  <BriefcaseBusiness className="size-4" />
                  {t('userDropdown.switchCoach')}
                </Link>
              </div>
              <div className="h-px bg-zinc-800" />
            </>
          )}
          <button
            type="button"
            onClick={() => signOutAndClear('/')}
            className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-red-300 transition-colors hover:bg-red-500/10 hover:text-red-200 disabled:opacity-50"
            aria-label={t('userDropdown.signOut')}
          >
            <LogOut className="size-4" />
            {t('userDropdown.signOut')}
          </button>
        </div>
      )}
    </div>
  )
}
