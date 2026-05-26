'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Dumbbell, UtensilsCrossed, TrendingUp, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useLocale } from '@/contexts/LocaleContext'

const TABS = [
  { href: '/dashboard', key: 'nav.dashboard', icon: LayoutDashboard },
  { href: '/training',  key: 'nav.training',  icon: Dumbbell },
  { href: '/nutrition', key: 'nav.nutrition', icon: UtensilsCrossed },
  { href: '/progress',  key: 'nav.progress',  icon: TrendingUp },
  { href: '/settings',  key: 'nav.settings',  icon: Settings },
]

export function BottomNav() {
  const pathname = usePathname() ?? ''
  const { t }    = useLocale()

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-20 flex items-center justify-around bg-zinc-950/95 border-t border-zinc-800 backdrop-blur-sm px-2 pb-safe lg:hidden"
      aria-label="Navigation principale"
    >
      {TABS.map(({ href, key, icon: Icon }) => {
        const active = pathname.startsWith(href)
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex flex-col items-center gap-1 py-3 px-4 text-xs font-medium transition-colors min-w-0',
              active ? 'text-[#C8F135]' : 'text-zinc-500 hover:text-zinc-300',
            )}
            aria-current={active ? 'page' : undefined}
          >
            <Icon className="size-5 shrink-0" />
            <span className="truncate">{t(key)}</span>
          </Link>
        )
      })}
    </nav>
  )
}
