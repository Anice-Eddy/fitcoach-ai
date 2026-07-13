export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

import { auth } from '@/lib/auth/auth'
import { prisma } from '@/lib/prisma/client'
import { NextResponse } from 'next/server'

/** Returns aggregated dashboard statistics for the authenticated coach: member count, appointment totals, session metrics, completion rate, weight delta, top performers, and recent activity. */
export async function GET() {
  const session = await auth()
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { coachProfile: true },
  })
  if (!user?.coachProfile) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const coachId = user.coachProfile.id
  const now     = new Date()

  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const startOfWeek = new Date()
  startOfWeek.setDate(now.getDate() - now.getDay())
  startOfWeek.setHours(0, 0, 0, 0)

  // 1. Members
  const totalMembers = await prisma.coachMember.count({ where: { coachId } })

  const memberIds = (await prisma.coachMember.findMany({
    where:  { coachId },
    select: { memberId: true },
  })).map(m => m.memberId)

  // 2. Appointments
  const [appointmentsCompleted, appointmentsUpcoming] = await Promise.all([
    prisma.coachAppointment.count({
      where: { coachId, status: { in: ['COMPLETED', 'CONFIRMED'] }, scheduledAt: { lt: now } },
    }),
    prisma.coachAppointment.count({
      where: { coachId, status: { in: ['PENDING', 'PROPOSED', 'CONFIRMED'] }, scheduledAt: { gte: now } },
    }),
  ])

  // 3. Notes
  const [notesSent, repliesReceived] = await Promise.all([
    prisma.coachNote.count({ where: { coachId } }),
    prisma.coachNoteReply.count({
      where: { note: { coachId } },
    }),
  ])

  // 4. Workout sessions this month across all members
  const sessionsThisMonth = memberIds.length > 0
    ? await prisma.workoutSession.count({
        where: {
          userId:      { in: memberIds },
          status:      'COMPLETED',
          completedAt: { gte: startOfMonth },
        },
      })
    : 0

  // 5. Sessions this week
  const sessionsThisWeek = memberIds.length > 0
    ? await prisma.workoutSession.count({
        where: {
          userId:      { in: memberIds },
          status:      'COMPLETED',
          completedAt: { gte: startOfWeek },
        },
      })
    : 0

  // 6. Completion rate (completed / total non-skipped)
  const [completedSessions, totalSessionsLogged] = memberIds.length > 0
    ? await Promise.all([
        prisma.workoutSession.count({
          where: { userId: { in: memberIds }, status: 'COMPLETED' },
        }),
        prisma.workoutSession.count({
          where: { userId: { in: memberIds }, status: { in: ['COMPLETED', 'SKIPPED'] } },
        }),
      ])
    : [0, 0]

  const completionRate = totalSessionsLogged > 0
    ? Math.round((completedSessions / totalSessionsLogged) * 100)
    : null

  // 7. Average weight progression per member (latest vs oldest metric)
  let avgWeightDelta: number | null = null
  if (memberIds.length > 0) {
    const deltas: number[] = []
    for (const memberId of memberIds) {
      const metrics = await prisma.bodyMetric.findMany({
        where:   { userId: memberId },
        orderBy: { date: 'asc' },
        select:  { weightKg: true },
      })
      const weightMetrics = metrics.filter((metric): metric is { weightKg: number } => typeof metric.weightKg === 'number')
      if (weightMetrics.length >= 2) {
        deltas.push(weightMetrics[weightMetrics.length - 1].weightKg - weightMetrics[0].weightKg)
      }
    }
    if (deltas.length > 0) {
      avgWeightDelta = Math.round((deltas.reduce((a, b) => a + b, 0) / deltas.length) * 10) / 10
    }
  }

  // 8. Top performers this month (members with most completed sessions)
  const topPerformers: { memberId: string; name: string | null; email: string; count: number }[] = []
  if (memberIds.length > 0) {
    const sessionsByMember = await Promise.all(
      memberIds.map(async memberId => {
        const count = await prisma.workoutSession.count({
          where: { userId: memberId, status: 'COMPLETED', completedAt: { gte: startOfMonth } },
        })
        return { memberId, count }
      }),
    )

    const sorted = sessionsByMember.sort((a, b) => b.count - a.count).slice(0, 5).filter(x => x.count > 0)

    for (const s of sorted) {
      const member = await prisma.user.findUnique({
        where:  { id: s.memberId },
        select: { name: true, email: true },
      })
      if (member) {
        topPerformers.push({ memberId: s.memberId, name: member.name, email: member.email, count: s.count })
      }
    }
  }

  // 9. Members with last session date
  const recentActivity: { memberId: string; name: string | null; lastSessionAt: string | null }[] = []
  if (memberIds.length > 0) {
    for (const memberId of memberIds.slice(0, 10)) {
      const last = await prisma.workoutSession.findFirst({
        where:   { userId: memberId, status: 'COMPLETED' },
        orderBy: { completedAt: 'desc' },
        select:  { completedAt: true },
      })
      const member = await prisma.user.findUnique({
        where: { id: memberId }, select: { name: true },
      })
      recentActivity.push({
        memberId,
        name: member?.name ?? null,
        lastSessionAt: last?.completedAt?.toISOString() ?? null,
      })
    }
  }

  return NextResponse.json({
    totalMembers,
    appointmentsCompleted,
    appointmentsUpcoming,
    notesSent,
    repliesReceived,
    sessionsThisMonth,
    sessionsThisWeek,
    completionRate,
    avgWeightDelta,
    topPerformers,
    recentActivity,
  })
}
