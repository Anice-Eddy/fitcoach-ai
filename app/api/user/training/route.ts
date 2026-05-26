export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth'
import { prisma } from '@/lib/prisma/client'
import { generateProgram } from '@/lib/training/generate-program'
import type { FitnessGoal, FitnessLevel } from '@prisma/client'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const userId = session.user.id

  const existing = await prisma.workoutProgram.findFirst({
    where: { userId, isActive: true },
    include: { sessions: { orderBy: { dayOfWeek: 'asc' } } },
  })

  if (existing) return NextResponse.json(existing)

  // No active program → generate from user profile
  const profile = await prisma.profile.findUnique({ where: { userId } })
  if (!profile) return NextResponse.json({ error: 'Profil manquant' }, { status: 404 })

  const generated = generateProgram({
    fitnessGoal:         profile.fitnessGoal,
    fitnessLevel:        profile.fitnessLevel,
    trainingDaysPerWeek: profile.trainingDaysPerWeek,
    availableEquipment:  profile.availableEquipment as string[],
  })

  const program = await prisma.workoutProgram.create({
    data: {
      userId,
      name:         generated.name,
      fitnessGoal:  profile.fitnessGoal as FitnessGoal,
      fitnessLevel: profile.fitnessLevel as FitnessLevel,
      weeksTotal:   generated.weeksTotal,
      currentWeek:  1,
      isActive:     true,
      sessions: {
        create: generated.sessions.map((s, i) => ({
          userId,
          name:      s.name,
          dayOfWeek: i,
          status:    'PLANNED' as const,
        })),
      },
    },
    include: { sessions: { orderBy: { dayOfWeek: 'asc' } } },
  })

  return NextResponse.json(program)
}

// Reset: deactivate current program and create a new one
export async function DELETE() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  await prisma.workoutProgram.updateMany({
    where: { userId: session.user.id, isActive: true },
    data:  { isActive: false },
  })

  return NextResponse.json({ ok: true })
}
