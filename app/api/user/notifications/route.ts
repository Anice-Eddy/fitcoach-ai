export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth'
import { prisma } from '@/lib/prisma/client'

/** Returns the 30 most recent notifications for the authenticated member, mapped to a minimal shape. */
export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const notifications = await prisma.notification.findMany({
    where:   { recipientUserId: session.user.id },
    orderBy: { createdAt: 'desc' },
    take:    30,
  })

  return NextResponse.json(
    notifications.map((n) => ({
      id:        n.id,
      title:     n.title,
      message:   n.message,
      isRead:    n.isRead,
      createdAt: n.createdAt.toISOString(),
      type:      n.type,
      relatedId: n.relatedId,
    })),
  )
}

/** Marks all unread notifications for the authenticated member as read. */
export async function PATCH() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await prisma.notification.updateMany({
    where: { recipientUserId: session.user.id, isRead: false },
    data:  { isRead: true },
  })

  return NextResponse.json({ ok: true })
}

/** Marks a single notification (by notificationId in body) as read, after verifying it belongs to the authenticated member. */
export async function PUT(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { notificationId } = await req.json()
  if (!notificationId) return NextResponse.json({ error: 'Missing notificationId' }, { status: 400 })

  // Verify ownership before updating
  const notif = await prisma.notification.findFirst({
    where: { id: notificationId, recipientUserId: session.user.id },
  })
  if (!notif) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await prisma.notification.update({
    where: { id: notificationId },
    data:  { isRead: true },
  })

  return NextResponse.json({ ok: true })
}
