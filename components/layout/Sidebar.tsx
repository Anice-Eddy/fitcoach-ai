'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  LayoutDashboard, Dumbbell, UtensilsCrossed, TrendingUp,
  Download, Settings, ShoppingBag, Plug, X, CalendarDays, NotebookPen, Bot,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useUIStore } from '@/stores/uiStore'
import { Logo } from '@/components/ui/Logo'
import { useLocale } from '@/contexts/LocaleContext'

const NAV_KEYS = [
  { href: '/dashboard',    key: 'nav.dashboard',    icon: LayoutDashboard },
  { href: '/training',     key: 'nav.training',     icon: Dumbbell },
  { href: '/nutrition',    key: 'nav.nutrition',    icon: UtensilsCrossed },
  { href: '/progress',     key: 'nav.progress',     icon: TrendingUp },
  { href: '/appointments', key: 'nav.appointments', icon: CalendarDays },
  { href: '/notes',        key: 'nav.notes',        icon: NotebookPen },
  { href: '/ai',           key: 'nav.ai',           icon: Bot },
  { href: '/exports',      key: 'nav.exports',      icon: Download },
  { href: '/shop',         key: 'nav.shop',         icon: ShoppingBag },
  { href: '/integrations', key: 'nav.integrations', icon: Plug },
  { href: '/settings',     key: 'nav.settings',     icon: Settings },
]

export function Sidebar() {
  const pathname       = usePathname() ?? ''
  const { sidebarOpen, toggleSidebar } = useUIStore()
  const { t } = useLocale()

  return (
    <>
      {/* Overlay mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/60 lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      <motion.aside
        initial={false}
        animate={{ x: sidebarOpen ? 0 : '-100%' }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="fixed left-0 top-0 z-30 flex h-full w-64 flex-col bg-zinc-950 border-r border-zinc-800 lg:translate-x-0 lg:static lg:z-auto"
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between px-6 border-b border-zinc-800">
          <Logo href="/dashboard" size="md" />
          <button onClick={toggleSidebar} className="text-zinc-400 hover:text-white lg:hidden">
            <X className="size-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {NAV_KEYS.map(({ href, key, icon: Icon }) => {
            const active = pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  active
                    ? 'bg-[#C8F135]/10 text-[#C8F135]'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800',
                )}
              >
                <Icon className="size-4 shrink-0" />
                {t(key)}
              </Link>
            )
          })}
        </nav>

        <div className="px-4 py-4 border-t border-zinc-800">
          <p className="text-xs text-zinc-600 text-center">BodyOps · v1.0</p>
        </div>
      </motion.aside>
    </>
  )
}
