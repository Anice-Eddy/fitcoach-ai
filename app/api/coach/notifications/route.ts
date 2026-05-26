export const dynamic = 'force-dynamic'

import { auth } from '@/lib/auth/auth'
import { prisma } from '@/lib/prisma/client'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

// GET: Récupérer les notifications du coach
export async function GET(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Non authentifié' },
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
        { error: 'Vous n\'êtes pas un coach' },
        { status: 403 }
      )
    }

    const query: any = { coachId: coach.coachProfile.id }
    if (unreadOnly) query.isRead = false

    const notifications = await prisma.notification.findMany({
      where: query,
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    const unreadCount = await prisma.notification.count({
      where: {
        coachId: coach.coachProfile.id,
        isRead: false,
      },
    })

    return NextResponse.json({
      notifications,
      unreadCount,
    })
  } catch (error) {
    console.error('GET /api/coach/notifications:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

// PUT: Marquer une notification comme lue
export async function PUT(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Non authentifié' },
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
        { error: 'Vous n\'êtes pas un coach' },
        { status: 403 }
      )
    }

    const notification = await prisma.notification.update({
      where: { id: notificationId },
      data: { isRead },
    })

    return NextResponse.json(notification)
  } catch (error) {
    console.error('PUT /api/coach/notifications:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
