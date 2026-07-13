export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth'
import { prisma } from '@/lib/prisma/client'

/** Full user data export for portability. Excludes auth secrets, provider tokens and payment ids. */
export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = session.user.id

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      image: true,
      provider: true,
      authProvider: true,
      firebaseEmailVerified: true,
      subscriptionPlan: true,
      subscriptionStatus: true,
      createdAt: true,
      updatedAt: true,
      profile: true,
      subscription: {
        select: {
          plan: true,
          status: true,
          cancelAtPeriodEnd: true,
          stripeCurrentPeriodEnd: true,
          createdAt: true,
          updatedAt: true,
        },
      },
      coachProfile: {
        include: {
          availability: true,
          coachMembers: {
            select: {
              id: true,
              memberId: true,
              assignedAt: true,
              lastUpdated: true,
              member: { select: { id: true, email: true, name: true, image: true } },
            },
          },
        },
      },
    },
  })

  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const coachId = user.coachProfile?.id

  const [
    metrics,
    workoutPrograms,
    workoutSessions,
    nutritionPlans,
    nutritionLogs,
    shoppingLists,
    dailyHabitLogs,
    dailyMissions,
    bodyOpsScores,
    userNotes,
    appointmentsAsMember,
    coachNotesAsMember,
    coachChatsAsMember,
    aiConversations,
    aiMemories,
    aiReports,
    aiUsageDaily,
    notifications,
    integrationAccounts,
    exportHistory,
    coachAppointments,
    coachNotes,
    coachChats,
  ] = await Promise.all([
    prisma.bodyMetric.findMany({ where: { userId }, orderBy: { date: 'desc' } }),
    prisma.workoutProgram.findMany({
      where: { userId },
      include: { sessions: { include: { exerciseLogs: { include: { exercise: true }, orderBy: { order: 'asc' } } } } },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.workoutSession.findMany({
      where: { userId },
      include: { exerciseLogs: { include: { exercise: true }, orderBy: { order: 'asc' } } },
      orderBy: [{ scheduledAt: 'desc' }, { createdAt: 'desc' }],
    }),
    prisma.nutritionPlan.findMany({
      where: { userId },
      include: { meals: { include: { foodItems: true }, orderBy: [{ dayOfWeek: 'asc' }, { createdAt: 'asc' }] } },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.nutritionLog.findMany({ where: { userId }, orderBy: [{ date: 'desc' }, { loggedAt: 'desc' }] }),
    prisma.shoppingList.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } }),
    prisma.dailyHabitLog.findMany({ where: { userId }, orderBy: [{ date: 'desc' }, { type: 'asc' }] }),
    prisma.dailyMission.findMany({ where: { userId }, orderBy: [{ date: 'desc' }, { createdAt: 'asc' }] }),
    prisma.bodyOpsScore.findMany({ where: { userId }, orderBy: { date: 'desc' } }),
    prisma.userNote.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } }),
    prisma.coachAppointment.findMany({
      where: { memberId: userId },
      include: { coachProfile: { select: { id: true, firstName: true, lastName: true, city: true, country: true } } },
      orderBy: { scheduledAt: 'desc' },
    }),
    prisma.coachNote.findMany({
      where: { memberId: userId },
      include: {
        coachProfile: { select: { id: true, firstName: true, lastName: true } },
        replies: { orderBy: { createdAt: 'asc' } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.coachChat.findMany({
      where: { memberId: userId },
      include: {
        coachProfile: { select: { id: true, firstName: true, lastName: true } },
        messages: { orderBy: { createdAt: 'asc' } },
      },
      orderBy: { updatedAt: 'desc' },
    }),
    prisma.aIConversation.findMany({
      where: { userId },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.aIMemory.findMany({ where: { userId }, orderBy: { updatedAt: 'desc' } }),
    prisma.aIReport.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } }),
    prisma.aIUsageDaily.findMany({ where: { userId }, orderBy: { date: 'desc' } }),
    prisma.notification.findMany({
      where: { recipientUserId: userId },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.integrationAccount.findMany({
      where: { userId },
      select: { id: true, service: true, isConnected: true, lastSyncedAt: true, metadata: true, createdAt: true, updatedAt: true },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.exportHistory.findMany({
      where: { userId },
      select: { id: true, type: true, fileName: true, sizeBytes: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    }),
    coachId
      ? prisma.coachAppointment.findMany({
          where: { coachId },
          include: { member: { select: { id: true, email: true, name: true, image: true } } },
          orderBy: { scheduledAt: 'desc' },
        })
      : Promise.resolve([]),
    coachId
      ? prisma.coachNote.findMany({
          where: { coachId },
          include: {
            member: { select: { id: true, email: true, name: true, image: true } },
            replies: { orderBy: { createdAt: 'asc' } },
          },
          orderBy: { createdAt: 'desc' },
        })
      : Promise.resolve([]),
    coachId
      ? prisma.coachChat.findMany({
          where: { coachId },
          include: {
            member: { select: { id: true, email: true, name: true, image: true } },
            messages: { orderBy: { createdAt: 'asc' } },
          },
          orderBy: { updatedAt: 'desc' },
        })
      : Promise.resolve([]),
  ])

  const exportData = {
    version: '2.0',
    exportedAt: new Date().toISOString(),
    account: {
      id: user.id,
      email: user.email,
      name: user.name,
      image: user.image,
      provider: user.provider,
      authProvider: user.authProvider,
      emailVerified: user.firebaseEmailVerified,
      subscriptionPlan: user.subscriptionPlan,
      subscriptionStatus: user.subscriptionStatus,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    },
    profile: user.profile,
    subscription: user.subscription,
    progression: { metrics, bodyOpsScores },
    training: { programs: workoutPrograms, sessions: workoutSessions },
    nutrition: { plans: nutritionPlans, logs: nutritionLogs, shoppingLists },
    dailySystem: { habits: dailyHabitLogs, missions: dailyMissions },
    notes: { personal: userNotes, coachNotesAsMember },
    appointments: { asMember: appointmentsAsMember },
    messages: { coachChatsAsMember },
    ai: { conversations: aiConversations, memories: aiMemories, reports: aiReports, usageByDay: aiUsageDaily },
    notifications,
    integrations: integrationAccounts,
    exports: exportHistory,
    coachSpace: user.coachProfile
      ? {
          profile: user.coachProfile,
          appointments: coachAppointments,
          notes: coachNotes,
          chats: coachChats,
        }
      : null,
  }

  return new Response(JSON.stringify(exportData, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="bodyops-export-${new Date().toISOString().slice(0, 10)}.json"`,
    },
  })
}
