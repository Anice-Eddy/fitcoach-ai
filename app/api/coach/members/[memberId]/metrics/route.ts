export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

import { auth } from '@/lib/auth/auth'
import { prisma } from '@/lib/prisma/client'
import { RATE_LIMITS, rateLimitByUserId } from '@/lib/security/rate-limit'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const metricSchema = z.object({
  date:         z.string().datetime().optional(),
  weightKg:     z.number().min(20).max(500),
  bodyFatPct:   z.number().min(1).max(70).optional().nullable(),
  muscleMassKg: z.number().min(10).max(200).optional().nullable(),
  waistCm:      z.number().min(40).max(300).optional().nullable(),
  hipsCm:       z.number().min(40).max(300).optional().nullable(),
  // Les mêmes signaux quotidiens que côté membre, pour garder coach et IA synchronisés.
  steps:            z.number().int().min(0).max(100000).optional().nullable(),
  sleepHours:       z.number().min(0).max(24).optional().nullable(),
  waterLiters:      z.number().min(0).max(15).optional().nullable(),
  energyLevel:      z.number().int().min(1).max(5).optional().nullable(),
  stressLevel:      z.number().int().min(1).max(5).optional().nullable(),
  progressPhotoUrl: z.string().url().max(1000).optional().nullable(),
  notes:        z.string().max(500).optional().nullable(),
})

// Authenticates the session as a coach and verifies the member belongs to this coach; returns coachProfileId or an error response.
async function authorizeCoach(memberId: string) {
  const session = await auth()
  if (!session?.user?.email) return { error: NextResponse.json({ error: 'Non authentifié' }, { status: 401 }) }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { coachProfile: true },
  })
  if (!user?.coachProfile) return { error: NextResponse.json({ error: 'Non autorisé' }, { status: 403 }) }

  const membership = await prisma.coachMember.findUnique({
    where: { coachId_memberId: { coachId: user.coachProfile.id, memberId } },
  })
  if (!membership) return { error: NextResponse.json({ error: 'Membre introuvable' }, { status: 404 }) }

  return { coachProfileId: user.coachProfile.id, userId: user.id }
}

/** Returns up to `limit` (max 365) body metric records for the member, ordered by date descending. */
export async function GET(
  req: NextRequest,
  { params }: { params: { memberId: string } },
) {
  const { error } = await authorizeCoach(params.memberId)
  if (error) return error

  const limit = Number(req.nextUrl.searchParams.get('limit') ?? '30')

  const metrics = await prisma.bodyMetric.findMany({
    where:   { userId: params.memberId },
    orderBy: { date: 'desc' },
    take:    Math.min(limit, 365),
  })

  return NextResponse.json(metrics)
}

/** Adds a body metric entry for the member and updates the profile weight if this is the latest record. */
export async function POST(
  req: NextRequest,
  { params }: { params: { memberId: string } },
) {
  const { userId, error } = await authorizeCoach(params.memberId)
  if (error) return error
  const limited = await rateLimitByUserId(userId!, 'coach:metrics:create', RATE_LIMITS.coach)
  if (!limited.ok) return limited.response

  const parsed = metricSchema.safeParse(await req.json())
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })

  const { date, ...rest } = parsed.data
  const metric = await prisma.bodyMetric.create({
    data: {
      userId: params.memberId,
      date:   date ? new Date(date) : new Date(),
      ...rest,
    },
  })

  // Le profil ne change de poids que si la nouvelle mesure contient réellement un poids.
  const latest = await prisma.bodyMetric.findFirst({
    where:   { userId: params.memberId },
    orderBy: { date: 'desc' },
  })
  if (latest?.id === metric.id && typeof metric.weightKg === 'number') {
    await prisma.profile.updateMany({
      where: { userId: params.memberId },
      data:  { weightKg: metric.weightKg },
    })
  }

  return NextResponse.json(metric, { status: 201 })
}

/** Deletes a specific body metric entry (by metricId in body) that belongs to the given member. */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { memberId: string } },
) {
  const { userId, error } = await authorizeCoach(params.memberId)
  if (error) return error
  const limited = await rateLimitByUserId(userId!, 'coach:metrics:delete', RATE_LIMITS.coach)
  if (!limited.ok) return limited.response

  const { metricId } = await req.json()
  if (!metricId) return NextResponse.json({ error: 'metricId manquant' }, { status: 400 })

  const metric = await prisma.bodyMetric.findFirst({
    where: { id: metricId, userId: params.memberId },
  })
  if (!metric) return NextResponse.json({ error: 'Métrique introuvable' }, { status: 404 })

  await prisma.bodyMetric.delete({ where: { id: metricId } })
  return NextResponse.json({ ok: true })
}
