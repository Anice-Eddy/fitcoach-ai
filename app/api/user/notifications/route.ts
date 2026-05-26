export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth'
import { prisma } from '@/lib/prisma/client'

// GET: user's notifications (via their coach)
export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  // Find which coach this user is assigned to
  const membership = await prisma.coachMember.findFirst({
    where: { memberId: session.user.id },
    include: { coachProfile: { include: { notifications: { where: { relatedId: session.user.id }, orderBy: { createdAt: 'desc' }, take: 30 } } } },
  })

  if (!membership) return NextResponse.json([])

  // Also return appointments as notifications
  const appointments = await prisma.coachAppointment.findMany({
    where: { memberId: session.user.id },
    orderBy: { createdAt: 'desc' },
    take: 10,
    include: { coachProfile: { include: { user: { select: { name: true } } } } },
  })

  const apptNotifs = appointments.map(a => ({
    id:        `appt-${a.id}`,
    title:     `Rendez-vous : ${a.title}`,
    message:   `Avec ${a.coachProfile.user.name ?? 'votre coach'} le ${new Date(a.scheduledAt).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })} à ${new Date(a.scheduledAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`,
    isRead:    a.status === 'COMPLETED' || a.status === 'CANCELLED',
    createdAt: a.createdAt.toISOString(),
    type:      'APPOINTMENT',
  }))

  const coachNotifs = (membership.coachProfile.notifications ?? []).map(n => ({
    id:        n.id,
    title:     n.title,
    message:   n.message,
    isRead:    n.isRead,
    createdAt: n.createdAt.toISOString(),
    type:      n.type,
  }))

  const all = [...apptNotifs, ...coachNotifs].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )

  return NextResponse.json(all)
}

// PATCH: mark all as read
export async function PATCH() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const membership = await prisma.coachMember.findFirst({
    where: { memberId: session.user.id },
    select: { coachId: true },
  })

  if (membership) {
    await prisma.notification.updateMany({
      where: { coachId: membership.coachId, relatedId: session.user.id, isRead: false },
      data:  { isRead: true },
    })
  }

  return NextResponse.json({ ok: true })
}
