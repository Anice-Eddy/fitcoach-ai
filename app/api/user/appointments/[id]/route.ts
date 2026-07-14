export const dynamic = 'force-dynamic'

import { auth } from '@/lib/auth/auth'
import { prisma } from '@/lib/prisma/client'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

/** Updates the member's own note on an appointment and notifies the coach when the note changes. */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })
  }

  const appointment = await prisma.coachAppointment.findUnique({
    where: { id: (await params).id },
  })
  if (!appointment || appointment.memberId !== session.user.id) {
    return NextResponse.json({ error: 'Appointment not found' }, { status: 404 })
  }

  const { memberNote } = await req.json()

  const updated = await prisma.coachAppointment.update({
    where: { id: (await params).id },
    data:  { memberNote },
    include: {
      coachProfile: {
        include: { user: { select: { id: true, name: true } } },
      },
    },
  })

  // Notify the coach that member added a note
  if (memberNote !== undefined && memberNote !== appointment.memberNote) {
    await prisma.notification.create({
      data: {
        coachId:         appointment.coachId,
        recipientUserId: null,
        type:            'MESSAGE',
        title:           'Appointment note from member',
        message:         `A member added a note to your appointment "${appointment.title}".`,
        relatedId:       (await params).id,
      },
    }).catch(() => {})
  }

  return NextResponse.json(updated)
}
