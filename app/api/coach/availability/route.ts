export const dynamic = 'force-dynamic'

import { auth } from '@/lib/auth/auth'
import { prisma } from '@/lib/prisma/client'
import { RATE_LIMITS, rateLimitByUserId } from '@/lib/security/rate-limit'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

async function getCoach(email: string) {
  const user = await prisma.user.findUnique({
    where: { email },
    include: { coachProfile: true },
  })
  return user?.coachProfile ?? null
}

/** Returns all recurring availability rules for the authenticated coach. */
export async function GET(_req: NextRequest) {
  const session = await auth()
  if (!session?.user?.email) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const coach = await getCoach(session.user.email)
  if (!coach) return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })

  const rules = await prisma.coachAvailability.findMany({
    where:   { coachId: coach.id },
    orderBy: [{ dayOfWeek: 'asc' }, { startHour: 'asc' }, { startMinute: 'asc' }],
  })

  return NextResponse.json(rules)
}

/** Creates a new recurring availability rule for the authenticated coach. */
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.email) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  const limited = await rateLimitByUserId(session.user.id!, 'coach:availability:create', RATE_LIMITS.coach)
  if (!limited.ok) return limited.response

  const coach = await getCoach(session.user.email)
  if (!coach) return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })

  const body = await req.json()
  const { dayOfWeek, startHour, startMinute = 0, endHour, endMinute = 0, slotDuration = 60 } = body

  if (dayOfWeek == null || startHour == null || endHour == null) {
    return NextResponse.json({ error: 'dayOfWeek, startHour et endHour sont requis' }, { status: 400 })
  }
  if (startHour * 60 + startMinute >= endHour * 60 + endMinute) {
    return NextResponse.json({ error: 'L\'heure de fin doit être après l\'heure de début' }, { status: 400 })
  }

  const rule = await prisma.coachAvailability.upsert({
    where:  { coachId_dayOfWeek_startHour_startMinute: { coachId: coach.id, dayOfWeek, startHour, startMinute } },
    update: { endHour, endMinute, slotDuration },
    create: { coachId: coach.id, dayOfWeek, startHour, startMinute, endHour, endMinute, slotDuration },
  })

  return NextResponse.json(rule, { status: 201 })
}
