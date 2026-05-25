// API : GET /api/user/metrics — historique métriques corporelles
// API : POST /api/user/metrics — ajoute une mesure

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth'
import { prisma } from '@/lib/prisma/client'
import { bodyMetricSchema } from '@/utils/validators'

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '90'), 365)

  const metrics = await prisma.bodyMetric.findMany({
    where:   { userId: session.user.id },
    orderBy: { date: 'desc' },
    take:    limit,
  })

  return NextResponse.json(metrics)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const body   = await req.json()
  const parsed = bodyMetricSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })

  const metric = await prisma.bodyMetric.create({
    data: { userId: session.user.id, ...parsed.data },
  })

  return NextResponse.json(metric, { status: 201 })
}
