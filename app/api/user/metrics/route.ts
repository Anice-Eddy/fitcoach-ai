export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth'
import { prisma } from '@/lib/prisma/client'
import { bodyMetricSchema } from '@/utils/validators'

/** Returns up to `limit` (max 365, default 90) body metric records for the authenticated user, ordered by date descending. */
export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '90'), 365)

  const metrics = await prisma.bodyMetric.findMany({
    where:   { userId: session.user.id },
    orderBy: { date: 'desc' },
    take:    limit,
  })

  return NextResponse.json(metrics)
}

/** Creates a new body metric entry for the authenticated user; validates via bodyMetricSchema. */
export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body   = await req.json()
  const parsed = bodyMetricSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })

  const metric = await prisma.bodyMetric.create({
    data: { userId: session.user.id, ...parsed.data },
  })

  return NextResponse.json(metric, { status: 201 })
}

/** Deletes a body metric entry by id query param, verifying the record belongs to the authenticated user. */
export async function DELETE(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const metricId = searchParams.get('id')
  if (!metricId) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const existing = await prisma.bodyMetric.findFirst({
    where: { id: metricId, userId: session.user.id },
  })
  if (!existing) return NextResponse.json({ error: 'Measurement not found' }, { status: 404 })

  await prisma.bodyMetric.delete({ where: { id: metricId } })
  return NextResponse.json({ ok: true })
}
