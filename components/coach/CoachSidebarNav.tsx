'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BarChart2, Bot, Calendar, LayoutDashboard, MessageSquare, Users } from 'lucide-react'
import { NavNotificationBadge } from '@/components/navigation/NavNotificationBadge'
import { unreadCountForRoute } from '@/lib/notifications/unread-communication'
import { useUnreadCoachCommunicationCounts } from '@/lib/notifications/use-unread-message-count'

const NAV = [
  { href: '/coach/dashboard',    label: 'Tableau de bord', icon: LayoutDashboard },
  { href: '/coach/members',      label: 'Membres',         icon: Users },
  { href: '/coach/appointments', label: 'Agenda',          icon: Calendar },
  { href: '/coach/notes',        label: 'Notes',           icon: MessageSquare },
  { href: '/coach/messages',     label: 'Messages',        icon: MessageSquare },
  { href: '/coach/ai',           label: 'Assistant IA',    icon: Bot },
  { href: '/coach/reports',      label: 'Rapports',        icon: BarChart2 },
]

/** Coach sidebar navigation with live unread badges for Notes and Messages. */
export function CoachSidebarNav() {
  const pathname = usePathname() ?? ''
  const unreadCounts = useUnreadCoachCommunicationCounts()

  return (
    <>
      {NAV.map(({ href, label, icon: Icon }) => {
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
            <span className="min-w-0 flex-1 truncate">{label}</span>
            <NavNotificationBadge count={badgeCount} />
          </Link>
        )
      })}
    </>
  )
}
