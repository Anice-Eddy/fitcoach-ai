'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { ChevronDown, LayoutDashboard, LogOut, UserCircle } from 'lucide-react'
import { signOutAndClear } from '@/lib/auth/client-session'
import { useLocale } from '@/contexts/LocaleContext'

function initials(name: string, email: string) {
  const source = name.trim() || email
  return source
    .split(/[\s@._-]+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || '?'
}

/** Coach account dropdown showing name, email, avatar, profile link, and sign-out button; closes on outside pointer events. */
export function CoachDropdown() {
  const { t } = useLocale()
  const { data: session } = useSession()
  const [open, setOpen]   = useState(false)
  const ref               = useRef<HTMLDivElement>(null)

  const name  = session?.user?.name  ?? t('common.coach')
  const email = session?.user?.email ?? ''
  const image = session?.user?.image ?? null

  useEffect(() => {
    function handler(e: PointerEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', handler)
    return () => document.removeEventListener('pointerdown', handler)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-2 rounded-lg p-1 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white"
        aria-label={t('coachNavigation.accountMenu')}
        aria-expanded={open}
      >
        {image ? (
          <Image
            src={image}
            alt={name}
            width={32}
            height={32}
            className="rounded-full ring-2 ring-zinc-700 hover:ring-[#C8F135] transition-all"
          />
        ) : (
          <span className="flex size-8 items-center justify-center rounded-full bg-[#C8F135]/15 text-xs font-semibold text-[#C8F135] ring-2 ring-zinc-700 hover:ring-[#C8F135] transition-all">
            {initials(name, email)}
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

          <div className="py-1">
            <Link
              href="/coach/settings/profile"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-300 transition-colors hover:bg-zinc-900 hover:text-white"
            >
              <UserCircle className="size-4 text-zinc-500" />
              {t('coachNavigation.myCoachProfile')}
            </Link>

          </div>

          <div className="h-px bg-zinc-800" />
          {session?.user?.hasMemberProfile && (
            <>
              <div className="py-1">
                <Link
                  href="/dashboard"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-[#C8F135] transition-colors hover:bg-[#C8F135]/10"
                >
                  <LayoutDashboard className="size-4" />
                  {t('coachNavigation.switchToMember')}
                </Link>
              </div>
              <div className="h-px bg-zinc-800" />
            </>
          )}

          <button
            type="button"
            onClick={() => signOutAndClear('/')}
            className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-red-300 transition-colors hover:bg-red-500/10 hover:text-red-200"
          >
            <LogOut className="size-4" />
            {t('auth.signOut')}
          </button>
        </div>
      )}
    </div>
  )
}
