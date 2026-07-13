'use client'

import Link from 'next/link'
import { Calendar, CheckCircle, TrendingUp, Users } from 'lucide-react'
import { CoachPageHeader } from '@/components/coach/CoachPageHeader'
import { useLocale } from '@/contexts/LocaleContext'

type DashboardAppointment = {
  id: string
  title: string
  status: string
  scheduledAt: string
  memberName: string | null
}

type DashboardMember = {
  id: string
  name: string | null
  email: string
  lastSession: {
    name: string
    completedAt: string | null
  } | null
}

type CoachDashboardClientProps = {
  coachName: string | null
  memberCount: number
  upcomingCount: number
  sessionCount: number
  notificationCount: number
  appointments: DashboardAppointment[]
  members: DashboardMember[]
}

const statIcons = {
  members: Users,
  appointments: Calendar,
  sessions: CheckCircle,
  notifications: TrendingUp,
}

const statusClasses: Record<string, string> = {
  CONFIRMED: 'bg-emerald-500/10 text-emerald-400',
  PENDING:   'bg-amber-500/10 text-amber-400',
}

function statusLabel(status: string, t: (key: string) => string) {
  if (status === 'CONFIRMED') return t('coachDashboard.status.confirmed')
  if (status === 'PENDING') return t('coachDashboard.status.pending')
  return status
}

/** Client presentation for the coach dashboard so labels react to the active locale. */
export function CoachDashboardClient({
  coachName,
  memberCount,
  upcomingCount,
  sessionCount,
  notificationCount,
  appointments,
  members,
}: CoachDashboardClientProps) {
  const { locale, t } = useLocale()
  const dateLocale = locale === 'fr' ? 'fr-FR' : 'en-US'
  const firstName = coachName?.split(' ')[0] ?? t('messagesPage.coach')

  const stats = [
    { key: 'members', value: String(memberCount), color: 'text-[#C8F135]' },
    { key: 'appointments', value: String(upcomingCount), color: 'text-blue-400' },
    { key: 'sessions', value: String(sessionCount), color: 'text-emerald-400' },
    { key: 'notifications', value: String(notificationCount), color: 'text-amber-400' },
  ] as const

  return (
    <div className="space-y-8">
      <CoachPageHeader
        title={t('coachDashboard.title')}
        description={<>{t('coachDashboard.hello')} {firstName} — {t('coachDashboard.description')}</>}
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = statIcons[stat.key]
          return (
            <div key={stat.key} className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
              <Icon className={`mb-3 size-5 ${stat.color}`} />
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="mt-1 text-xs text-zinc-400">{t(`coachDashboard.stats.${stat.key}`)}</div>
            </div>
          )
        })}
      </div>

      <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold">{t('coachDashboard.upcomingAppointments')}</h2>
          <Link href="/coach/appointments" className="text-xs text-zinc-400 transition-colors hover:text-white">
            {t('coachDashboard.viewAll')} →
          </Link>
        </div>
        {appointments.length === 0 ? (
          <p className="text-sm text-zinc-500">{t('coachDashboard.noAppointment')}</p>
        ) : (
          <div className="space-y-3">
            {appointments.map((appt) => (
              <div key={appt.id} className="flex items-center gap-3 border-b border-zinc-800 py-2 text-sm last:border-0">
                <div className="size-2 shrink-0 rounded-full bg-[#C8F135]" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-white">{appt.title}</p>
                  <p className="text-xs text-zinc-500">
                    {appt.memberName ?? t('messagesPage.member')} · {new Date(appt.scheduledAt).toLocaleDateString(dateLocale, { weekday: 'short', day: 'numeric', month: 'short' })} {t('common.at')} {new Date(appt.scheduledAt).toLocaleTimeString(dateLocale, { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${statusClasses[appt.status] ?? 'bg-zinc-800 text-zinc-400'}`}>
                  {statusLabel(appt.status, t)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold">{t('coachDashboard.memberActivity')}</h2>
          <Link href="/coach/members" className="text-xs text-zinc-400 transition-colors hover:text-white">
            {t('coachDashboard.viewAllPlural')} →
          </Link>
        </div>
        {members.length === 0 ? (
          <p className="text-sm text-zinc-500">{t('coachDashboard.noTrackedMember')}</p>
        ) : (
          <div className="space-y-3">
            {members.slice(0, 5).map((member) => (
              <Link
                key={member.id}
                href={`/coach/members/${member.id}`}
                className="flex items-center gap-3 border-b border-zinc-800 py-2 transition-opacity last:border-0 hover:opacity-80"
              >
                <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-zinc-700 text-xs font-bold text-white">
                  {(member.name ?? '?').charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-white">{member.name ?? member.email}</p>
                  <p className="truncate text-xs text-zinc-500">
                    {member.lastSession
                      ? `${t('coachDashboard.lastSession')}: ${member.lastSession.name} · ${member.lastSession.completedAt ? new Date(member.lastSession.completedAt).toLocaleDateString(dateLocale) : ''}`
                      : t('coachDashboard.noSession')}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
