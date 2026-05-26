export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

import { auth } from '@/lib/auth/auth'
import { prisma } from '@/lib/prisma/client'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const metricSchema = z.object({
  date:         z.string().datetime().optional(),
  weightKg:     z.number().min(20).max(500),
  bodyFatPct:   z.number().min(1).max(70).optional().nullable(),
  muscleMassKg: z.number().min(10).max(200).optional().nullable(),
  waistCm:      z.number().min(40).max(300).optional().nullable(),
  hipsCm:       z.number().min(40).max(300).optional().nullable(),
  notes:        z.string().max(500).optional().nullable(),
})

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

  return { coachProfileId: user.coachProfile.id }
}

// GET: coach fetches member's body metrics
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

// POST: coach adds a body metric for member
export async function POST(
  req: NextRequest,
  { params }: { params: { memberId: string } },
) {
  const { error } = await authorizeCoach(params.memberId)
  if (error) return error

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

  // Update profile weight if this is the latest metric
  const latest = await prisma.bodyMetric.findFirst({
    where:   { userId: params.memberId },
    orderBy: { date: 'desc' },
  })
  if (latest?.id === metric.id) {
    await prisma.profile.updateMany({
      where: { userId: params.memberId },
      data:  { weightKg: metric.weightKg },
    })
  }

  return NextResponse.json(metric, { status: 201 })
}

// DELETE: coach removes a body metric
export async function DELETE(
  req: NextRequest,
  { params }: { params: { memberId: string } },
) {
  const { error } = await authorizeCoach(params.memberId)
  if (error) return error

  const { metricId } = await req.json()
  if (!metricId) return NextResponse.json({ error: 'metricId manquant' }, { status: 400 })

  const metric = await prisma.bodyMetric.findFirst({
    where: { id: metricId, userId: params.memberId },
  })
  if (!metric) return NextResponse.json({ error: 'Métrique introuvable' }, { status: 404 })

  await prisma.bodyMetric.delete({ where: { id: metricId } })
  return NextResponse.json({ ok: true })
}
