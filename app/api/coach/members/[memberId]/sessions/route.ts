export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

import { auth } from '@/lib/auth/auth'
import { prisma } from '@/lib/prisma/client'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const patchSchema = z.object({
  sessionId:       z.string().min(1),
  status:          z.enum(['PLANNED', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED']).optional(),
  notes:           z.string().max(1000).optional().nullable(),
  durationMinutes: z.number().min(1).max(600).optional().nullable(),
  caloriesBurned:  z.number().min(0).max(5000).optional().nullable(),
})

const deleteSchema = z.object({
  sessionId:     z.string().min(1),
  exerciseLogId: z.string().min(1).optional(),
})

// Authenticates the session as a coach and verifies the member is in their roster; returns coachProfileId or an error response.
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

/** Returns the 30 most recent workout sessions for the member with full exercise logs. */
export async function GET(
  _req: NextRequest,
  { params }: { params: { memberId: string } },
) {
  const { error } = await authorizeCoach(params.memberId)
  if (error) return error

  const sessions = await prisma.workoutSession.findMany({
    where:   { userId: params.memberId },
    include: { exerciseLogs: { include: { exercise: true }, orderBy: { order: 'asc' } } },
    orderBy: { createdAt: 'desc' },
    take:    30,
  })

  return NextResponse.json(sessions)
}

/** Updates a workout session's status, notes, duration, or calories; auto-sets startedAt/completedAt timestamps. */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { memberId: string } },
) {
  const { error } = await authorizeCoach(params.memberId)
  if (error) return error

  const parsed = patchSchema.safeParse(await req.json())
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })

  const { sessionId, status, ...rest } = parsed.data

  const session = await prisma.workoutSession.findFirst({
    where: { id: sessionId, userId: params.memberId },
  })
  if (!session) return NextResponse.json({ error: 'Séance introuvable' }, { status: 404 })

  const updateData: Record<string, unknown> = { ...rest }
  if (status) {
    updateData.status = status
    if (status === 'IN_PROGRESS' && !session.startedAt)   updateData.startedAt   = new Date()
    if (status === 'COMPLETED'   && !session.completedAt) updateData.completedAt = new Date()
  }

  const updated = await prisma.workoutSession.update({
    where: { id: sessionId },
    data:  updateData,
  })

  return NextResponse.json(updated)
}

/** Removes a full session, or one exercise inside it, after verifying coach ownership of the member. */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { memberId: string } },
) {
  const { error } = await authorizeCoach(params.memberId)
  if (error) return error

  const parsed = deleteSchema.safeParse(await req.json())
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })

  const { sessionId, exerciseLogId } = parsed.data

  if (!exerciseLogId) {
    const session = await prisma.workoutSession.findFirst({
      where:  { id: sessionId, userId: params.memberId },
      select: { id: true },
    })
    if (!session) return NextResponse.json({ error: 'Séance introuvable' }, { status: 404 })

    // Les ExerciseLog liés sont supprimés automatiquement par la relation onDelete: Cascade.
    await prisma.workoutSession.delete({ where: { id: sessionId } })
    return NextResponse.json({ ok: true, deletedSessionId: sessionId })
  }

  const exerciseLog = await prisma.exerciseLog.findFirst({
    where: { id: exerciseLogId, session: { id: sessionId, userId: params.memberId } },
    select: { id: true },
  })
  if (!exerciseLog) return NextResponse.json({ error: 'Exercice introuvable' }, { status: 404 })

  await prisma.exerciseLog.delete({ where: { id: exerciseLogId } })

  // Retourne la séance rafraîchie pour que l'interface garde les exercices synchronisés.
  const updatedSession = await prisma.workoutSession.findFirst({
    where:   { id: sessionId, userId: params.memberId },
    include: { exerciseLogs: { include: { exercise: true }, orderBy: { order: 'asc' } } },
  })

  return NextResponse.json(updatedSession)
}
