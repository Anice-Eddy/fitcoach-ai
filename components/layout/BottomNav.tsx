'use client'
// Bottom navigation mobile — 5 onglets principaux

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Dumbbell, UtensilsCrossed, TrendingUp, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'

const TABS = [
  { href: '/dashboard', label: 'Accueil',    icon: LayoutDashboard },
  { href: '/training',  label: 'Training',   icon: Dumbbell },
  { href: '/nutrition', label: 'Nutrition',  icon: UtensilsCrossed },
  { href: '/progress',  label: 'Progress',   icon: TrendingUp },
  { href: '/settings',  label: 'Settings',   icon: Settings },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-20 flex items-center justify-around bg-zinc-950/95 border-t border-zinc-800 backdrop-blur-sm px-2 pb-safe lg:hidden"
      aria-label="Navigation principale"
    >
      {TABS.map(({ href, label, icon: Icon }) => {
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
            <span className="truncate">{label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
