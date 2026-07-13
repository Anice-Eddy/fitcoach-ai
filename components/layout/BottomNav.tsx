'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Dumbbell, UtensilsCrossed, TrendingUp, Bot, MessageSquare } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useLocale } from '@/contexts/LocaleContext'
import { NavNotificationBadge } from '@/components/navigation/NavNotificationBadge'
import { unreadCountForRoute } from '@/lib/notifications/unread-communication'
import { useUnreadCommunicationCounts } from '@/lib/notifications/use-unread-message-count'

const TABS = [
  { href: '/dashboard', key: 'nav.dashboard', icon: LayoutDashboard },
  { href: '/training',  key: 'nav.training',  icon: Dumbbell },
  { href: '/nutrition', key: 'nav.nutrition', icon: UtensilsCrossed },
  { href: '/progress',  key: 'nav.progress',  icon: TrendingUp },
  { href: '/messages',  key: 'nav.messages',  icon: MessageSquare },
  { href: '/ai',        key: 'nav.ai',        icon: Bot },
]

/** Mobile-only fixed bottom navigation bar with five translated tab links; highlights the active route. */
export function BottomNav() {
  const pathname = usePathname() ?? ''
  const { t }    = useLocale()
  const unreadCounts = useUnreadCommunicationCounts()

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-20 flex items-center justify-around bg-zinc-950/95 border-t border-zinc-800 backdrop-blur-sm px-2 pb-safe lg:hidden"
      aria-label={t('common.mainNavigation')}
    >
      {TABS.map(({ href, key, icon: Icon }) => {
        const active = pathname.startsWith(href)
        const badgeCount = unreadCountForRoute(href, unreadCounts)
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              'relative flex flex-col items-center gap-1 py-3 px-2 text-[11px] font-medium transition-colors min-w-0',
              active || badgeCount > 0 ? 'text-[#C8F135]' : 'text-zinc-500 hover:text-zinc-300',
            )}
            aria-current={active ? 'page' : undefined}
          >
            <NavNotificationBadge count={badgeCount} variant="floating" />
            <Icon className="size-5 shrink-0" />
            <span className="truncate">{t(key)}</span>
          </Link>
        )
      })}
    </nav>
  )
}
