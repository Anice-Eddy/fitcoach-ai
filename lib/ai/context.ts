import { prisma } from '@/lib/prisma/client'
import type { MemberAccess, MemberAIContext } from '@/lib/ai/types'

export async function resolveMemberAccess(requesterId: string, memberId?: string | null): Promise<MemberAccess | null> {
  if (!memberId || memberId === requesterId) {
    return { requesterId, memberId: requesterId, coachId: null, role: 'member' }
  }

  const coach = await prisma.coachProfile.findUnique({
    where:  { userId: requesterId },
    select: { id: true },
  })
  if (!coach) return null

  const membership = await prisma.coachMember.findUnique({
    where:  { coachId_memberId: { coachId: coach.id, memberId } },
    select: { id: true },
  })
  if (!membership) return null

  return { requesterId, memberId, coachId: coach.id, role: 'coach' }
}

export async function getMemberAIContext(memberId: string, coachId?: string | null): Promise<MemberAIContext | null> {
  const member = await prisma.user.findUnique({
    where: { id: memberId },
    select: {
      id: true,
      name: true,
      profile: true,
      bodyMetrics: {
        orderBy: { date: 'desc' },
        take: 12,
      },
      workoutPrograms: {
        where: { isActive: true },
        take: 2,
        include: {
          sessions: {
            orderBy: [{ weekNumber: 'asc' }, { dayOfWeek: 'asc' }],
            take: 20,
          },
        },
      },
      workoutSessions: {
        orderBy: [{ completedAt: 'desc' }, { scheduledAt: 'desc' }],
        take: 20,
        include: {
          exerciseLogs: {
            orderBy: { order: 'asc' },
            include: { exercise: { select: { name: true, muscleGroups: true, equipment: true } } },
          },
        },
      },
      nutritionPlans: {
        where: { isActive: true },
        take: 2,
        include: {
          meals: {
            orderBy: [{ dayOfWeek: 'asc' }, { type: 'asc' }],
            take: 20,
            include: { foodItems: { take: 8 } },
          },
        },
      },
      userNotes: {
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
    },
  })

  if (!member) return null

  const [coachNotes, appointments] = await Promise.all([
    coachId
      ? prisma.coachNote.findMany({
          where: { memberId, coachId },
          orderBy: { createdAt: 'desc' },
          take: 12,
          include: {
            replies: {
              orderBy: { createdAt: 'asc' },
              take: 8,
              select: { content: true, createdAt: true },
            },
          },
        })
      : prisma.coachNote.findMany({
          where: { memberId, isSharedWithMember: true },
          orderBy: { createdAt: 'desc' },
          take: 8,
          select: {
            title: true,
            content: true,
            category: true,
            status: true,
            priority: true,
            createdAt: true,
          },
        }),
    prisma.coachAppointment.findMany({
      where: { memberId, ...(coachId ? { coachId } : {}) },
      orderBy: { scheduledAt: 'desc' },
      take: 10,
      select: {
        title: true,
        description: true,
        scheduledAt: true,
        status: true,
        coachNote: true,
        memberNote: true,
      },
    }),
  ])

  const completedSessionsCount = member.workoutSessions.filter(s => s.status === 'COMPLETED').length

  return {
    member: { id: member.id, name: member.name },
    profile: member.profile,
    bodyMetrics: member.bodyMetrics,
    workoutPrograms: member.workoutPrograms,
    workoutSessions: member.workoutSessions,
    nutritionPlans: member.nutritionPlans,
    coachNotes,
    appointments,
    userNotes: member.userNotes,
    dataQuality: {
      hasProfile: !!member.profile,
      metricsCount: member.bodyMetrics.length,
      completedSessionsCount,
      nutritionPlansCount: member.nutritionPlans.length,
      coachNotesCount: coachNotes.length,
    },
  }
}

export function hasEnoughDataForAnalysis(context: MemberAIContext) {
  return context.dataQuality.hasProfile
    && (context.dataQuality.metricsCount > 0
      || context.dataQuality.completedSessionsCount > 0
      || context.dataQuality.nutritionPlansCount > 0
      || context.dataQuality.coachNotesCount > 0)
}

export function serializeContext(context: MemberAIContext) {
  return JSON.stringify(context, (_key, value) => {
    if (value instanceof Date) return value.toISOString()
    return value
  }, 2)
}
