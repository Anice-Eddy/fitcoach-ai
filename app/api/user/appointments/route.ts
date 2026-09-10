export const dynamic = 'force-dynamic'

import { auth } from '@/lib/auth/auth'
import { prisma } from '@/lib/prisma/client'
import { NextRequest, NextResponse } from 'next/server'
import { memberAppointmentCreateSchema } from '@/lib/appointments/validation'

export const runtime = 'nodejs'

/** Returns all appointments for the authenticated member, ordered by scheduledAt ascending, including coach info. */
export async function GET(_req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })

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
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })

  const parsed = memberAppointmentCreateSchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
  }
  const { coachProfileId, title, description, scheduledAt, duration, meetLink, memberNote } = parsed.data

  const coachProfile = await prisma.coachProfile.findUnique({
    where: { id: coachProfileId },
    include: { user: { select: { name: true, email: true } } },
  })
  if (!coachProfile) return NextResponse.json({ error: 'Coach not found' }, { status: 404 })

  const appointment = await prisma.coachAppointment.create({
    data: {
      coachId:     coachProfileId,
      memberId:    session.user.id,
      title,
      description,
      scheduledAt,
      duration,
      meetLink,
      memberNote,
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
      title:           `Appointment request: ${title}`,
      message:         `A member requested an appointment on ${scheduledAt.toLocaleDateString('en-US')}`,
      relatedId:       appointment.id,
    },
  })

  return NextResponse.json(appointment, { status: 201 })
}
