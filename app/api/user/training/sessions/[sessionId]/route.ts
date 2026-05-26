export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth'
import { prisma } from '@/lib/prisma/client'

export async function GET(_req: NextRequest, { params }: { params: { sessionId: string } }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const ws = await prisma.workoutSession.findFirst({
    where: { id: params.sessionId, userId: session.user.id },
  })
  if (!ws) return NextResponse.json({ error: 'Séance introuvable' }, { status: 404 })
  return NextResponse.json(ws)
}

export async function PATCH(req: NextRequest, { params }: { params: { sessionId: string } }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const body = await req.json() as { status?: string; durationMinutes?: number; caloriesBurned?: number }

  const ws = await prisma.workoutSession.findFirst({
    where: { id: params.sessionId, userId: session.user.id },
  })
  if (!ws) return NextResponse.json({ error: 'Séance introuvable' }, { status: 404 })

  const updated = await prisma.workoutSession.update({
    where: { id: params.sessionId },
    data: {
      ...(body.status ? { status: body.status as never } : {}),
      ...(body.status === 'IN_PROGRESS' && !ws.startedAt ? { startedAt: new Date() } : {}),
      ...(body.status === 'COMPLETED' ? {
        completedAt:     new Date(),
        durationMinutes: body.durationMinutes ?? ws.durationMinutes,
        caloriesBurned:  body.caloriesBurned  ?? ws.caloriesBurned,
      } : {}),
    },
  })

  return NextResponse.json(updated)
}
