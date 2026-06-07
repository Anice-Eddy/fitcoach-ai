export const dynamic = 'force-dynamic'

import { auth } from '@/lib/auth/auth'
import { prisma } from '@/lib/prisma/client'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

/** Returns all coaches linked to the member via CoachMember, performing a self-healing sync (creates missing records from appointments) before fetching; enriches each coach entry with the next upcoming appointment and total appointment count. */
export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  const userId = session.user.id

  // ── Self-healing sync ──────────────────────────────────────────────────────
  // Any appointment this member has triggers a CoachMember record if missing.
  const memberAppointments = await prisma.coachAppointment.findMany({
    where:    { memberId: userId },
    select:   { coachId: true },
    distinct: ['coachId'],
  })

  if (memberAppointments.length > 0) {
    await prisma.coachMember.createMany({
      data:           memberAppointments.map(a => ({ coachId: a.coachId, memberId: userId })),
      skipDuplicates: true,
    }).catch((err) => console.error('[my-coach sync]', err))
  }

  // ── Fetch all coach-member relations for this user ─────────────────────────
  const relations = await prisma.coachMember.findMany({
    where: { memberId: userId },
    include: {
      coachProfile: {
        include: {
          user: {
            select: {
              id:    true,
              name:  true,
              email: true,
              image: true,
            },
          },
        },
      },
    },
    orderBy: { assignedAt: 'asc' },
  })

  if (relations.length === 0) {
    return NextResponse.json({ coaches: [] })
  }

  // ── Enrich with upcoming appointment & counts ──────────────────────────────
  const now = new Date()
  const chatRows = await prisma.coachChat.findMany({
    where: { memberId: userId, coachId: { in: relations.map(rel => rel.coachId) } },
    select: {
      id: true,
      coachId: true,
      lastMessageAt: true,
      messages: {
        where: { senderUserId: { not: userId }, readAt: null },
        select: { id: true },
      },
    },
  })
  const chatByCoachId = new Map(chatRows.map(chat => [chat.coachId, chat]))

  const coaches = await Promise.all(
    relations.map(async (rel) => {
      const [nextAppointment, totalAppointments] = await Promise.all([
        prisma.coachAppointment.findFirst({
          where: {
            coachId:     rel.coachId,
            memberId:    userId,
            scheduledAt: { gte: now },
            status:      { in: ['PENDING', 'PROPOSED', 'CONFIRMED'] },
          },
          orderBy: { scheduledAt: 'asc' },
          select: {
            id:          true,
            title:       true,
            scheduledAt: true,
            duration:    true,
            status:      true,
            meetLink:    true,
          },
        }),
        prisma.coachAppointment.count({
          where: { coachId: rel.coachId, memberId: userId },
        }),
      ])

      const cp = rel.coachProfile

      return {
        relationId:       rel.id,
        assignedAt:       rel.assignedAt,
        coachProfileId:   rel.coachId,
        coach: {
          id:        cp.user.id,
          name:      cp.user.name,
          email:     cp.user.email,
          image:     cp.user.image,
          firstName: cp.firstName,
          lastName:  cp.lastName,
          bio:       cp.bio,
          avatarUrl: (cp as { avatarUrl?: string | null }).avatarUrl ?? null,
          specialties:     cp.specialties,
          certifications:  cp.certifications,
          // Respect the coach's public visibility choices even for assigned members.
          yearsExperience: cp.showYearsExperience ? cp.yearsExperience : null,
          city:            cp.city,
          memberLimit:     cp.memberLimit,
          publicRating:    cp.showPublicRating ? cp.publicRating : null,
          publicRatingCount: cp.showPublicRating ? cp.publicRatingCount : 0,
        },
        chat: chatByCoachId.get(rel.coachId)
          ? {
              id: chatByCoachId.get(rel.coachId)!.id,
              unreadCount: chatByCoachId.get(rel.coachId)!.messages.length,
              lastMessageAt: chatByCoachId.get(rel.coachId)!.lastMessageAt,
            }
          : null,
        nextAppointment,
        totalAppointments,
      }
    }),
  )

  return NextResponse.json({ coaches })
}
