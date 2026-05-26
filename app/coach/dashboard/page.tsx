import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth/auth'
import { prisma } from '@/lib/prisma/client'
import { Users, Calendar, TrendingUp, CheckCircle } from 'lucide-react'
import Link from 'next/link'

export default async function CoachDashboard() {
  const session = await auth()
  if (!session?.user?.id) redirect('/auth/signin')

  const coach = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      coachProfile: {
        include: {
          coachMembers: {
            include: {
              member: {
                select: {
                  id: true, name: true, email: true,
                  workoutSessions: {
                    where: { status: 'COMPLETED' },
                    orderBy: { completedAt: 'desc' },
                    take: 1,
                    select: { completedAt: true, name: true },
                  },
                },
              },
            },
          },
          appointments: {
            where: { scheduledAt: { gte: new Date() } },
            orderBy: { scheduledAt: 'asc' },
            take: 5,
            include: { member: { select: { name: true } } },
          },
          notifications: {
            where: { isRead: false },
            orderBy: { createdAt: 'desc' },
            take: 5,
          },
        },
      },
    },
  })

  if (!coach?.coachProfile) redirect('/dashboard')

  const profile = coach.coachProfile
  const memberCount = profile.coachMembers.length
  const upcomingCount = profile.appointments.length

  // Count sessions completed this month across all members
  const startOfMonth = new Date(); startOfMonth.setDate(1); startOfMonth.setHours(0, 0, 0, 0)
  let sessionCount = 0
  for (const cm of profile.coachMembers) {
    const sessions = await prisma.workoutSession.count({
      where: {
        userId:      cm.memberId,
        status:      'COMPLETED',
        completedAt: { gte: startOfMonth },
      },
    })
    sessionCount += sessions
  }

  const stats = [
    { label: 'Membres actifs',    value: String(memberCount),   icon: Users,        color: 'text-[#C8F135]' },
    { label: 'RDV à venir',       value: String(upcomingCount), icon: Calendar,     color: 'text-blue-400'  },
    { label: 'Séances ce mois',   value: String(sessionCount),  icon: CheckCircle,  color: 'text-emerald-400' },
    { label: 'Notifications',     value: String(profile.notifications.length), icon: TrendingUp, color: 'text-amber-400' },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Tableau de bord coach</h1>
        <p className="text-zinc-400 text-sm mt-1">
          Bonjour {coach.name?.split(' ')[0] ?? 'Coach'} — vue d&apos;ensemble de vos membres et programmes.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl bg-zinc-900 border border-zinc-800 p-5">
            <s.icon className={`size-5 mb-3 ${s.color}`} />
            <div className="text-2xl font-bold">{s.value}</div>
            <div className="text-xs text-zinc-400 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Upcoming appointments */}
      <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold">Prochains rendez-vous</h2>
          <Link href="/coach/appointments" className="text-xs text-zinc-400 hover:text-white transition-colors">
            Voir tout →
          </Link>
        </div>
        {profile.appointments.length === 0 ? (
          <p className="text-sm text-zinc-500">Aucun rendez-vous prévu.</p>
        ) : (
          <div className="space-y-3">
            {profile.appointments.map((appt) => (
              <div key={appt.id} className="flex items-center gap-3 text-sm py-2 border-b border-zinc-800 last:border-0">
                <div className="size-2 rounded-full bg-[#C8F135] shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium truncate">{appt.title}</p>
                  <p className="text-xs text-zinc-500">
                    {appt.member.name} · {new Date(appt.scheduledAt).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })} à {new Date(appt.scheduledAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                  appt.status === 'CONFIRMED' ? 'bg-emerald-500/10 text-emerald-400' :
                  appt.status === 'PENDING'   ? 'bg-amber-500/10 text-amber-400' :
                  'bg-zinc-800 text-zinc-400'
                }`}>
                  {appt.status === 'CONFIRMED' ? 'Confirmé' : appt.status === 'PENDING' ? 'En attente' : appt.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Members activity */}
      <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold">Activité des membres</h2>
          <Link href="/coach/members" className="text-xs text-zinc-400 hover:text-white transition-colors">
            Voir tous →
          </Link>
        </div>
        {profile.coachMembers.length === 0 ? (
          <p className="text-sm text-zinc-500">Aucun membre suivi pour l&apos;instant.</p>
        ) : (
          <div className="space-y-3">
            {profile.coachMembers.slice(0, 5).map(({ member }) => {
              const lastSession = member.workoutSessions[0]
              return (
                <Link
                  key={member.id}
                  href={`/coach/members/${member.id}`}
                  className="flex items-center gap-3 py-2 border-b border-zinc-800 last:border-0 hover:opacity-80 transition-opacity"
                >
                  <div className="size-8 rounded-full bg-zinc-700 flex items-center justify-center text-xs font-bold text-white shrink-0">
                    {(member.name ?? '?').charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white font-medium truncate">{member.name ?? member.email}</p>
                    <p className="text-xs text-zinc-500 truncate">
                      {lastSession
                        ? `Dernière séance: ${lastSession.name} · ${new Date(lastSession.completedAt!).toLocaleDateString('fr-FR')}`
                        : 'Aucune séance enregistrée'}
                    </p>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
