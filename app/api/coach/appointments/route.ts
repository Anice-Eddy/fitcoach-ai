export const dynamic = 'force-dynamic'

import { auth } from '@/lib/auth/auth'
import { prisma } from '@/lib/prisma/client'
import { NextRequest, NextResponse } from 'next/server'
import { coachAppointmentCreateSchema } from '@/lib/appointments/validation'

export const runtime = 'nodejs'

/** Returns all appointments for the authenticated coach, optionally filtered by memberId. */
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
    const memberId = searchParams.get('memberId')

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

    const query: { coachId: string; memberId?: string } = { coachId: coach.coachProfile.id }
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
      { error: 'Server error' },
      { status: 500 }
    )
  }
}

/** Creates an appointment for a member, upserts the CoachMember relation, and creates a member notification. */
export async function POST(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthenticated' },
        { status: 401 }
      )
    }

    const parsed = coachAppointmentCreateSchema.safeParse(await req.json().catch(() => null))
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
    }
    const { memberId, title, description, scheduledAt, duration, meetLink, coachNote } = parsed.data

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

    const membership = await prisma.coachMember.findUnique({
      where: { coachId_memberId: { coachId: coach.coachProfile.id, memberId } },
      select: { id: true },
    })
    if (!membership) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    }

    const appointment = await prisma.coachAppointment.create({
      data: {
        coachId: coach.coachProfile.id,
        memberId,
        title,
        description,
        scheduledAt,
        duration,
        meetLink,
        coachNote,
      },
      include: { member: { include: { profile: true } } },
    })

    await prisma.notification.create({
      data: {
        coachId:         coach.coachProfile.id,
        recipientUserId: memberId,
        type:            'APPOINTMENT',
        title:           `New appointment: ${title}`,
        message:         `Your coach scheduled an appointment on ${scheduledAt.toLocaleDateString('en-US')}`,
        relatedId:       appointment.id,
      },
    })

    return NextResponse.json(appointment, { status: 201 })
  } catch (error) {
    console.error('POST /api/coach/appointments:', error)
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    )
  }
}
