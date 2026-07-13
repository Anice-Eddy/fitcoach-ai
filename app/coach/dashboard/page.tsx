import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth/auth'
import { prisma } from '@/lib/prisma/client'
import { CoachDashboardClient } from './CoachDashboardClient'

/** Coach dashboard server component: fetches report stats and renders KPI cards, top performers, and recent activity tables. */
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

  return (
    <CoachDashboardClient
      coachName={coach.name}
      memberCount={memberCount}
      upcomingCount={upcomingCount}
      sessionCount={sessionCount}
      notificationCount={profile.notifications.length}
      appointments={profile.appointments.map((appt) => ({
        id:          appt.id,
        title:       appt.title,
        status:      appt.status,
        scheduledAt: appt.scheduledAt.toISOString(),
        memberName:  appt.member.name,
      }))}
      members={profile.coachMembers.map(({ member }) => {
        const lastSession = member.workoutSessions[0]
        return {
          id:    member.id,
          name:  member.name,
          email: member.email,
          lastSession: lastSession ? {
            name:        lastSession.name,
            completedAt: lastSession.completedAt?.toISOString() ?? null,
          } : null,
        }
      })}
    />
  )
}
