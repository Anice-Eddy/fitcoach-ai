export const dynamic = 'force-dynamic'

import { auth } from '@/lib/auth/auth'
import { prisma } from '@/lib/prisma/client'
import { RATE_LIMITS, rateLimitByUserId } from '@/lib/security/rate-limit'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

/** Updates the member's own note on an appointment and notifies the coach when the note changes. */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }
  const limited = await rateLimitByUserId(session.user.id, 'member:appointments:update', RATE_LIMITS.coach)
  if (!limited.ok) return limited.response

  const appointment = await prisma.coachAppointment.findUnique({
    where: { id: params.id },
  })
  if (!appointment || appointment.memberId !== session.user.id) {
    return NextResponse.json({ error: 'Rendez-vous introuvable' }, { status: 404 })
  }

  const { memberNote } = await req.json()

  const updated = await prisma.coachAppointment.update({
    where: { id: params.id },
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
        title:           'Note d\'un membre',
        message:         `Un membre a ajouté une note à votre rendez-vous "${appointment.title}".`,
        relatedId:       params.id,
      },
    }).catch(() => {})
  }

  return NextResponse.json(updated)
}
