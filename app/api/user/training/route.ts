export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth'
import { prisma } from '@/lib/prisma/client'
import { generateProgram } from '@/lib/training/generate-program'
import { generateAIEnhancedProgram, type TrainingProgramProfile } from '@/lib/training/ai-program'
import type { Equipment, FitnessGoal, FitnessLevel, MuscleGroup } from '@prisma/client'

type GeneratedProgram = ReturnType<typeof generateProgram>

function profileToTrainingInput(profile: NonNullable<Awaited<ReturnType<typeof prisma.profile.findUnique>>>): TrainingProgramProfile {
  return {
    firstName:           profile.firstName,
    age:                 profile.age,
    gender:              profile.gender,
    weightKg:            profile.weightKg,
    heightCm:            profile.heightCm,
    activityLevel:       profile.activityLevel,
    fitnessGoal:         profile.fitnessGoal,
    fitnessLevel:        profile.fitnessLevel,
    bodyFocus:           profile.bodyFocus,
    targetWeightKg:      profile.targetWeightKg,
    trainingDaysPerWeek: profile.trainingDaysPerWeek,
    availableEquipment:  profile.availableEquipment as string[],
    injuries:            profile.injuries,
  }
}

async function persistProgram(userId: string, generated: Awaited<GeneratedProgram>, profile: NonNullable<Awaited<ReturnType<typeof prisma.profile.findUnique>>>) {
  return prisma.workoutProgram.create({
    data: {
      userId,
      name:         generated.name,
      description:  generated.description,
      fitnessGoal:  profile.fitnessGoal as FitnessGoal,
      fitnessLevel: profile.fitnessLevel as FitnessLevel,
      weeksTotal:   generated.weeksTotal,
      currentWeek:  1,
      isActive:     true,
      sessions: {
        create: generated.sessions.map((s, i) => ({
          userId,
          name:      s.name,
          dayOfWeek: s.dayOfWeek ?? i,
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
              rpe:         exercise.rpe,
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
}

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

  const result = await generateAIEnhancedProgram(profileToTrainingInput(profile))
  const program = await persistProgram(userId, result.program, profile)
  return NextResponse.json({
    ...program,
    ai: {
      generated: result.aiGenerated,
      provider:  result.provider,
    },
  })
}

/** Regenerates a fresh active workout program, using AI when configured and falling back to BodyOps local logic. */
export async function POST() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const userId = session.user.id
  const profile = await prisma.profile.findUnique({ where: { userId } })
  if (!profile) return NextResponse.json({ error: 'Profil manquant' }, { status: 404 })

  const result = await generateAIEnhancedProgram(profileToTrainingInput(profile))

  await prisma.workoutProgram.updateMany({
    where: { userId, isActive: true },
    data:  { isActive: false },
  })

  const program = await persistProgram(userId, result.program, profile)
  return NextResponse.json({
    ...program,
    ai: {
      generated: result.aiGenerated,
      provider:  result.provider,
    },
  })
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
