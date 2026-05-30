export const dynamic = 'force-dynamic'

import { auth } from '@/lib/auth/auth'
import { prisma } from '@/lib/prisma/client'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

/** Returns the coach's member list with latest body metrics; auto-adds any members who have an appointment but are missing a CoachMember record. */
export async function GET() {
  try {
    const session = await auth()

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    // Récupérer le coach et ses membres
    const coach = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        coachProfile: {
          include: {
            coachMembers: {
              include: {
                member: {
                  include: {
                    profile: true,
                    bodyMetrics: {
                      orderBy: { date: 'desc' },
                      take: 1,
                    },
                  },
                },
              },
            },
          },
        },
      },
    })

    if (!coach?.coachProfile) {
      return NextResponse.json(
        { error: 'Vous n\'êtes pas un coach' },
        { status: 403 }
      )
    }

    // Sync: auto-add members who have an upcoming scheduled appointment but aren't in the list yet.
    // Deliberately excludes past/completed appointments so that removing a member doesn't get undone.
    const confirmedAppointments = await prisma.coachAppointment.findMany({
      where: {
        coachId: coach.coachProfile.id,
        status: { in: ['PENDING', 'PROPOSED', 'CONFIRMED'] },
        scheduledAt: { gte: new Date() },
      },
      select: { memberId: true },
      distinct: ['memberId'],
    })

    const existingMemberIds = new Set(coach.coachProfile.coachMembers.map(m => m.memberId))
    const toAdd = confirmedAppointments.filter(a => !existingMemberIds.has(a.memberId))

    if (toAdd.length > 0) {
      await prisma.coachMember.createMany({
        data:           toAdd.map(a => ({ coachId: coach.coachProfile!.id, memberId: a.memberId })),
        skipDuplicates: true,
      })

      // Re-fetch with newly added members
      const updated = await prisma.coachProfile.findUnique({
        where: { id: coach.coachProfile.id },
        include: {
          coachMembers: {
            include: {
              member: {
                include: {
                  profile: true,
                  bodyMetrics: { orderBy: { date: 'desc' }, take: 1 },
                },
              },
            },
          },
        },
      })
      return NextResponse.json(updated?.coachMembers ?? [])
    }

    return NextResponse.json(coach.coachProfile.coachMembers)
  } catch (error) {
    console.error('GET /api/coach/members:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

/** Adds a member to the coach's tracked list and creates a NEW_MEMBER coach notification; returns 201 with the CoachMember record. */
export async function POST(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    const { memberId } = await req.json()

    if (!memberId) {
      return NextResponse.json(
        { error: 'memberId manquant' },
        { status: 400 }
      )
    }

    // Vérifier que le coach existe
    const coach = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { coachProfile: true },
    })

    if (!coach?.coachProfile) {
      return NextResponse.json(
        { error: 'Vous n\'êtes pas un coach' },
        { status: 403 }
      )
    }

    // Ajouter le membre
    const coachMember = await prisma.coachMember.create({
      data: {
        coachId: coach.coachProfile.id,
        memberId,
      },
      include: {
        member: {
          include: { profile: true },
        },
      },
    })

    // Créer une notification
    await prisma.notification.create({
      data: {
        coachId:         coach.coachProfile.id,
        recipientUserId: null,
        type:            'NEW_MEMBER',
        title:           `Nouveau membre: ${coachMember.member.name}`,
        message:         `${coachMember.member.name} a été ajouté à vos membres suivis.`,
        relatedId:       memberId,
      },
    })

    return NextResponse.json(coachMember, { status: 201 })
  } catch (error) {
    console.error('POST /api/coach/members:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
