export const dynamic = 'force-dynamic'

import { auth } from '@/lib/auth/auth'
import { prisma } from '@/lib/prisma/client'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

/** Updates an appointment's status, date, meetLink, description, or coachNote; auto-adds member to coach's list on CONFIRMED and notifies the member. */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await auth()
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })
  }

  const coach = await prisma.user.findUnique({
    where:   { email: session.user.email },
    include: { coachProfile: true },
  })
  if (!coach?.coachProfile) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 })
  }

  const appointment = await prisma.coachAppointment.findUnique({
    where: { id: params.id },
  })
  if (!appointment || appointment.coachId !== coach.coachProfile.id) {
    return NextResponse.json({ error: 'Appointment not found' }, { status: 404 })
  }

  const body = await req.json()
  const { status, scheduledAt, duration, meetLink, description, coachNote } = body

  const updated = await prisma.coachAppointment.update({
    where: { id: params.id },
    data: {
      ...(status      !== undefined && { status }),
      ...(scheduledAt !== undefined && { scheduledAt: new Date(scheduledAt) }),
      ...(duration    !== undefined && { duration }),
      ...(meetLink    !== undefined && { meetLink }),
      ...(description !== undefined && { description }),
      ...(coachNote   !== undefined && { coachNote }),
    },
    include: {
      member: { select: { id: true, name: true, email: true } },
    },
  })

  // Auto-add member to coach's list when appointment is confirmed
  if (status === 'CONFIRMED' && updated.member?.id) {
    await prisma.coachMember.upsert({
      where:  { coachId_memberId: { coachId: coach.coachProfile.id, memberId: updated.member.id } },
      update: {},
      create: { coachId: coach.coachProfile.id, memberId: updated.member.id },
    }).catch((err) => console.error('[coachMember upsert]', err))
  }

  // Notify member if status changed to CONFIRMED/PROPOSED or a note was added
  const notifyMember = status === 'CONFIRMED' || status === 'PROPOSED'
    || (coachNote !== undefined && coachNote !== appointment.coachNote)
  if (notifyMember && updated.member?.id) {
    const title = status === 'CONFIRMED'
      ? 'Appointment confirmed'
      : status === 'PROPOSED'
        ? 'Appointment proposal'
        : 'Appointment note from coach'
    const msg = status === 'CONFIRMED'
      ? `Your appointment "${updated.title}" was confirmed by your coach.`
      : status === 'PROPOSED'
        ? `Your coach proposed a new date for "${updated.title}".`
        : `Your coach added a note to your appointment "${updated.title}".`

    await prisma.notification.create({
      data: {
        coachId:         coach.coachProfile.id,
        recipientUserId: updated.member.id,
        type:            'APPOINTMENT',
        title,
        message:         msg,
        relatedId:       params.id,
      },
    }).catch(() => {})
  }

  return NextResponse.json(updated)
}
