export const dynamic = 'force-dynamic'

import { auth } from '@/lib/auth/auth'
import { prisma } from '@/lib/prisma/client'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

/** Returns all appointments for the authenticated member, ordered by scheduledAt ascending, including coach info. */
export async function GET(_req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const appointments = await prisma.coachAppointment.findMany({
    where: { memberId: session.user.id },
    include: {
      coachProfile: {
        include: {
          user: { select: { id: true, name: true, image: true } },
        },
      },
    },
    orderBy: { scheduledAt: 'asc' },
  })

  return NextResponse.json(appointments)
}

/** Creates an appointment request to a coach, upserts the CoachMember relation, and notifies the coach in-app. */
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { coachProfileId, title, description, scheduledAt, duration, meetLink, memberNote } = await req.json()

  if (!coachProfileId || !title || !scheduledAt) {
    return NextResponse.json({ error: 'coachProfileId, title et scheduledAt sont requis' }, { status: 400 })
  }

  const coachProfile = await prisma.coachProfile.findUnique({
    where: { id: coachProfileId },
    include: { user: { select: { name: true, email: true } } },
  })
  if (!coachProfile) return NextResponse.json({ error: 'Coach introuvable' }, { status: 404 })

  const appointment = await prisma.coachAppointment.create({
    data: {
      coachId:     coachProfileId,
      memberId:    session.user.id,
      title,
      description,
      scheduledAt: new Date(scheduledAt),
      duration:    duration ?? 60,
      meetLink,
      memberNote:  memberNote?.trim() ? memberNote.trim() : null,
      status:      'PENDING',
    },
    include: {
      coachProfile: {
        include: { user: { select: { name: true, email: true } } },
      },
    },
  })

  // Auto-add member to coach's member list when they book an appointment
  await prisma.coachMember.upsert({
    where:  { coachId_memberId: { coachId: coachProfileId, memberId: session.user.id } },
    update: {},
    create: { coachId: coachProfileId, memberId: session.user.id },
  }).catch(() => {})

  // Notification for the coach
  await prisma.notification.create({
    data: {
      coachId:         coachProfileId,
      recipientUserId: null,
      type:            'APPOINTMENT',
      title:           `Nouvelle demande: ${title}`,
      message:         `Un membre a demandé un rendez-vous le ${new Date(scheduledAt).toLocaleDateString('fr-FR')}`,
      relatedId:       appointment.id,
    },
  })

  return NextResponse.json(appointment, { status: 201 })
}
