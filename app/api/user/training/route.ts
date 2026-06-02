export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth'
import { prisma } from '@/lib/prisma/client'
import { generateProgram } from '@/lib/training/generate-program'
import type { Equipment, FitnessGoal, FitnessLevel, MuscleGroup } from '@prisma/client'

/** Returns the user's active workout program; generates and persists a new program from the user's profile if none is active. */
export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const userId = session.user.id

  const existing = await prisma.workoutProgram.findFirst({
    where: { userId, isActive: true },
    include: {
      sessions: {
        orderBy: { dayOfWeek: 'asc' },
        include: {
          exerciseLogs: {
            orderBy: { order: 'asc' },
            include: { exercise: true },
          },
        },
      },
    },
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
          weekNumber: 1,
          durationMinutes: s.durationMinutes,
          status:    'PLANNED' as const,
          exerciseLogs: {
            create: s.exercises.map((exercise, order) => ({
              order,
              sets:        exercise.sets,
              reps:        exercise.reps,
              weightKg:    exercise.weightKg,
              restSeconds: exercise.restSeconds,
              tempo:       exercise.tempo,
              isCompleted: false,
              exercise: {
                connectOrCreate: {
                  where: { id: exercise.id },
                  create: {
                    id:           exercise.id,
                    name:         exercise.name,
                    description:  exercise.description,
                    instructions: exercise.instructions,
                    muscleGroups: exercise.muscleGroups as MuscleGroup[],
                    equipment:    exercise.equipment as Equipment[],
                    imageUrl:     exercise.imageUrl,
                    videoUrl:     exercise.videoUrl,
                    isCompound:   exercise.isCompound,
                  },
                },
              },
            })),
          },
        })),
      },
    },
    include: {
      sessions: {
        orderBy: { dayOfWeek: 'asc' },
        include: {
          exerciseLogs: {
            orderBy: { order: 'asc' },
            include: { exercise: true },
          },
        },
      },
    },
  })

  return NextResponse.json(program)
}

/** Deactivates all active workout programs for the user, allowing a fresh program to be generated on next GET. */
export async function DELETE() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  await prisma.workoutProgram.updateMany({
    where: { userId: session.user.id, isActive: true },
    data:  { isActive: false },
  })

  return NextResponse.json({ ok: true })
}
