export const dynamic = 'force-dynamic'

import { auth } from '@/lib/auth/auth'
import { prisma } from '@/lib/prisma/client'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

/** Returns the coach's notifications (with unread count); optionally filtered to unread only via the `unreadOnly` query param. */
export async function GET(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthenticated' },
        { status: 401 }
      )
    }

    const searchParams = req.nextUrl.searchParams
    const unreadOnly = searchParams.get('unreadOnly') === 'true'

    const coach = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { coachProfile: true },
    })

    if (!coach?.coachProfile) {
      return NextResponse.json(
        { error: 'Coach access required' },
        { status: 403 }
      )
    }

    const query: { coachId: string; recipientUserId: null; isRead?: boolean } = {
      coachId: coach.coachProfile.id,
      recipientUserId: null,
    }
    if (unreadOnly) query.isRead = false

    const notifications = await prisma.notification.findMany({
      where: query,
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    const unreadCount = await prisma.notification.count({
      where: {
        coachId:         coach.coachProfile.id,
        recipientUserId: null,
        isRead:          false,
      },
    })

    return NextResponse.json({
      notifications,
      unreadCount,
    })
  } catch (error) {
    console.error('GET /api/coach/notifications:', error)
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    )
  }
}

/** Marks a specific notification (by notificationId) as read or unread for the coach. */
export async function PUT(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthenticated' },
        { status: 401 }
      )
    }

    const { notificationId, isRead } = await req.json()

    const coach = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { coachProfile: true },
    })

    if (!coach?.coachProfile) {
      return NextResponse.json(
        { error: 'Coach access required' },
        { status: 403 }
      )
    }

    if (!notificationId) {
      return NextResponse.json(
        { error: 'Missing notificationId' },
        { status: 400 }
      )
    }

    const notification = await prisma.notification.findFirst({
      where: {
        id:              notificationId,
        coachId:         coach.coachProfile.id,
        recipientUserId: null,
      },
    })

    if (!notification) {
      return NextResponse.json(
        { error: 'Notification not found' },
        { status: 404 }
      )
    }

    const updated = await prisma.notification.update({
      where: { id: notification.id },
      data: { isRead: Boolean(isRead) },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('PUT /api/coach/notifications:', error)
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    )
  }
}
