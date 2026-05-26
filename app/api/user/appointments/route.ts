export const dynamic = 'force-dynamic'

import { auth } from '@/lib/auth/auth'
import { prisma } from '@/lib/prisma/client'
import { NextRequest, NextResponse } from 'next/server'
import { sendAppointmentEmail } from '@/lib/email/send'

export const runtime = 'nodejs'

// GET: user's upcoming and past appointments
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

// POST: member requests an appointment with a coach
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { coachProfileId, title, description, scheduledAt, duration, meetLink } = await req.json()

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
      status:      'PENDING',
    },
    include: {
      coachProfile: {
        include: { user: { select: { name: true, email: true } } },
      },
    },
  })

  // Notification for the coach
  await prisma.notification.create({
    data: {
      coachId:   coachProfileId,
      type:      'APPOINTMENT',
      title:     `Nouvelle demande: ${title}`,
      message:   `Un membre a demandé un rendez-vous le ${new Date(scheduledAt).toLocaleDateString('fr-FR')}`,
      relatedId: appointment.id,
    },
  })

  // Email confirmation to the member
  const member = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { email: true },
  })
  if (member?.email) {
    sendAppointmentEmail(
      member.email,
      coachProfile.user.name ?? 'Votre coach',
      title,
      new Date(scheduledAt),
      meetLink ?? null,
    ).catch(() => {})
  }

  return NextResponse.json(appointment, { status: 201 })
}
