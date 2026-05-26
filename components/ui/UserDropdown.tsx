'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { signOut, useSession } from 'next-auth/react'
import { ChevronDown, LogOut, User, Ruler, Sparkles, SlidersHorizontal, Users } from 'lucide-react'
import { useUserStore } from '@/stores/userStore'

const MEMBER_LINKS = [
  { href: '/settings/profile', label: 'Mon profil', icon: User },
  { href: '/settings/body', label: 'Mes informations physiques', icon: Ruler },
  { href: '/settings/plan', label: 'Mon accompagnement', icon: Sparkles },
  { href: '/settings/preferences', label: 'Préférences', icon: SlidersHorizontal },
]

export function UserDropdown() {
  const { data: session } = useSession()
  const { profile } = useUserStore()
  const isCoach = session?.user?.isCoach ?? false
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const name = session?.user?.name ?? profile?.firstName ?? 'Utilisateur BodyOps'
  const email = session?.user?.email ?? 'Email non renseigné'

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
        aria-label="Ouvrir le menu du compte"
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
          <span className="flex size-8 items-center justify-center rounded-full bg-zinc-700 text-xs font-semibold text-white">
            {name[0]?.toUpperCase() ?? '?'}
          </span>
        )}
        <ChevronDown className={`hidden size-3.5 transition-transform sm:block ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-11 z-50 w-72 overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950 shadow-2xl shadow-black/40">
          <div className="px-4 py-3">
            <p className="truncate text-sm font-medium text-white">{name}</p>
            <p className="truncate text-xs text-zinc-500">{email}</p>
          </div>
          <div className="h-px bg-zinc-800" />
          <div className="py-1">
            {isCoach && (
              <Link
                href="/coach/dashboard"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#C8F135] transition-colors hover:bg-zinc-900"
              >
                <Users className="size-4" />
                Espace coach
              </Link>
            )}
            {MEMBER_LINKS.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-300 transition-colors hover:bg-zinc-900 hover:text-white"
              >
                <Icon className="size-4 text-zinc-500" />
                {label}
              </Link>
            ))}
          </div>
          <div className="h-px bg-zinc-800" />
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: '/' })}
            className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-red-300 transition-colors hover:bg-red-500/10 hover:text-red-200 disabled:opacity-50"
            aria-label="Se déconnecter"
          >
            <LogOut className="size-4" />
            Déconnexion
          </button>
        </div>
      )}
    </div>
  )
}
