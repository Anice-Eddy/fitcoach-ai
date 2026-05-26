import { auth } from '@/lib/auth/auth'
import { prisma } from '@/lib/prisma/client'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

// GET: Récupérer les rendez-vous du coach
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
    const memberId = searchParams.get('memberId')

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
    if (memberId) query.memberId = memberId

    const appointments = await prisma.coachAppointment.findMany({
      where: query,
      include: { member: { include: { profile: true } } },
      orderBy: { scheduledAt: 'asc' },
    })

    return NextResponse.json(appointments)
  } catch (error) {
    console.error('GET /api/coach/appointments:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

// POST: Créer un rendez-vous
export async function POST(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    const { memberId, title, description, scheduledAt, duration, meetLink } =
      await req.json()

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

    const appointment = await prisma.coachAppointment.create({
      data: {
        coachId: coach.coachProfile.id,
        memberId,
        title,
        description,
        scheduledAt: new Date(scheduledAt),
        duration: duration || 60,
        meetLink,
      },
      include: { member: { include: { profile: true } } },
    })

    // Créer une notification
    await prisma.notification.create({
      data: {
        coachId: coach.coachProfile.id,
        type: 'APPOINTMENT',
        title: `Rendez-vous: ${title}`,
        message: `Rendez-vous avec ${appointment.member.name} le ${new Date(scheduledAt).toLocaleDateString('fr-FR')}`,
        relatedId: appointment.id,
      },
    })

    return NextResponse.json(appointment, { status: 201 })
  } catch (error) {
    console.error('POST /api/coach/appointments:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
