'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BarChart2, Bot, Calendar, LayoutDashboard, MessageSquare, Users } from 'lucide-react'
import { NavNotificationBadge } from '@/components/navigation/NavNotificationBadge'
import { unreadCountForRoute } from '@/lib/notifications/unread-communication'
import { useUnreadCoachCommunicationCounts } from '@/lib/notifications/use-unread-message-count'
import { useLocale } from '@/contexts/LocaleContext'

const NAV = [
  { href: '/coach/dashboard',    labelKey: 'coachNavigation.dashboard', icon: LayoutDashboard },
  { href: '/coach/members',      labelKey: 'coachNavigation.members', icon: Users },
  { href: '/coach/appointments', labelKey: 'coachNavigation.appointments', icon: Calendar },
  { href: '/coach/notes',        labelKey: 'coachNavigation.notes', icon: MessageSquare },
  { href: '/coach/messages',     labelKey: 'coachNavigation.messages', icon: MessageSquare },
  { href: '/coach/ai',           labelKey: 'coachNavigation.ai', icon: Bot },
  { href: '/coach/reports',      labelKey: 'coachNavigation.reports', icon: BarChart2 },
]

/** Coach sidebar navigation with live unread badges for Notes and Messages. */
export function CoachSidebarNav() {
  const pathname = usePathname() ?? ''
  const unreadCounts = useUnreadCoachCommunicationCounts()
  const { t } = useLocale()

  return (
    <>
      {NAV.map(({ href, labelKey, icon: Icon }) => {
        const active = pathname.startsWith(href)
        const badgeCount = unreadCountForRoute(href, unreadCounts)

        return (
          <Link
            key={href}
            href={href}
            className={[
              'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors',
              active
                ? 'bg-[#C8F135]/10 text-[#C8F135]'
                : badgeCount > 0
                  ? 'bg-[#C8F135]/10 text-[#C8F135] hover:bg-[#C8F135]/15'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800',
            ].join(' ')}
          >
            <Icon className="size-4" />
            <span className="min-w-0 flex-1 truncate">{t(labelKey)}</span>
            <NavNotificationBadge count={badgeCount} />
          </Link>
        )
      })}
    </>
  )
}
