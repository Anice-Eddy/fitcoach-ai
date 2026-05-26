'use client'
// Header application — hamburger mobile, titre page, badge offline, actions utilisateur

import { useUIStore } from '@/stores/uiStore'
import { useUserStore } from '@/stores/userStore'
import { Menu, Wifi, WifiOff, Bell } from 'lucide-react'
import { UserDropdown } from '@/components/ui/UserDropdown'

interface HeaderProps {
  title?: string
}

export function Header({ title }: HeaderProps) {
  const { toggleSidebar }     = useUIStore()
  const { storageMode }       = useUserStore()
  const isOffline = storageMode === 'local'

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b border-zinc-800 bg-zinc-950/90 px-4 backdrop-blur-sm lg:px-6">
      {/* Hamburger mobile */}
      <button
        onClick={toggleSidebar}
        className="text-zinc-400 hover:text-white lg:hidden"
        aria-label="Ouvrir le menu"
      >
        <Menu className="size-5" />
      </button>

      {/* Titre */}
      {title && (
        <h1 className="text-base font-semibold text-white truncate">{title}</h1>
      )}

      <div className="ml-auto flex items-center gap-3">
        {/* Badge stockage */}
        <span
          className={`hidden sm:flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium ${
            isOffline
              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
              : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
          }`}
        >
          {isOffline ? <WifiOff className="size-3" /> : <Wifi className="size-3" />}
          {isOffline ? 'Local' : 'Cloud'}
        </span>

        {/* Notifications (mockées) */}
        <button
          type="button"
          className="relative rounded-lg p-2 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white disabled:opacity-50"
          aria-label="Notifications"
        >
          <Bell className="size-5" />
          <span className="absolute -top-0.5 -right-0.5 size-2 rounded-full bg-[#C8F135]" />
        </button>

        <UserDropdown />
      </div>
    </header>
  )
}
