export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth'
import { prisma } from '@/lib/prisma/client'
import { Prisma } from '@prisma/client'
import type { BarPathPoint } from '@/types'

interface LogEntry {
  exerciseName:     string
  exerciseLocalId:  string
  order:            number
  sets:             number
  reps:             number
  weightKg?:        number | null
  restSeconds?:     number
  isCompleted:      boolean
  muscleGroups:     string[]
  equipment:        string[]
  isCompound:       boolean
  instructions:     string[]
  // Cardio
  durationMinutes?: number
  distanceKm?:      number
  speedKmH?:        number
  inclinePct?:      number
  velocityPeakMps?: number
  velocityAvgMps?:  number
  barPathDeviationCm?: number
  barPathPoints?:   BarPathPoint[]
}

// MuscleGroup values valid in Prisma
const VALID_MUSCLE_GROUPS = new Set([
  'CHEST','BACK','SHOULDERS','BICEPS','TRICEPS','FOREARMS',
  'CORE','QUADS','HAMSTRINGS','GLUTES','CALVES','FULL_BODY','CARDIO',
])
// Equipment values valid in Prisma
const VALID_EQUIPMENT = new Set([
  'BARBELL','DUMBBELL','KETTLEBELL','RESISTANCE_BAND','PULL_UP_BAR',
  'BENCH','CABLE_MACHINE','SMITH_MACHINE','BODYWEIGHT','CARDIO_MACHINE',
  'CHEST_PRESS_MACHINE','HIP_THRUST_MACHINE',
])

/**
 * POST /api/user/training/sessions/:sessionId/logs
 * Saves exercise logs for a completed session.
 * Upserts each exercise into the DB by name, then creates/updates ExerciseLog.
 */
export async function POST(req: NextRequest, { params }: { params: { sessionId: string } }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Verify session belongs to user
  const ws = await prisma.workoutSession.findFirst({
    where: { id: params.sessionId, userId: session.user.id },
  })
  if (!ws) return NextResponse.json({ error: 'Session not found' }, { status: 404 })

  let body: { logs: LogEntry[] }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { logs } = body
  if (!Array.isArray(logs) || logs.length === 0) {
    return NextResponse.json({ saved: 0 })
  }

  const saved: string[] = []

  for (const log of logs) {
    // Sanitize enums by filtering out values unknown to Prisma.
    const safeMusGroups = log.muscleGroups.filter(g => VALID_MUSCLE_GROUPS.has(g)) as never[]
    const safeEquipment = log.equipment.filter(e => VALID_EQUIPMENT.has(e)) as never[]

    // Find or create Exercise by name
    let dbExercise = await prisma.exercise.findFirst({ where: { name: log.exerciseName } })
    if (!dbExercise) {
      dbExercise = await prisma.exercise.create({
        data: {
          name:         log.exerciseName,
          instructions: log.instructions ?? [],
          muscleGroups: safeMusGroups.length > 0 ? safeMusGroups : ['FULL_BODY' as never],
          equipment:    safeEquipment.length > 0 ? safeEquipment : ['BODYWEIGHT' as never],
          isCompound:   log.isCompound ?? false,
        },
      })
    }

    // Fetch previous log for progressive overload reference
    const previous = await prisma.exerciseLog.findFirst({
      where:   { exercise: { name: log.exerciseName }, session: { userId: session.user.id } },
      orderBy: { createdAt: 'desc' },
    })

    // Build notes for cardio extra data
    const extraNotes: string[] = []
    if (log.durationMinutes) extraNotes.push(`Duration: ${log.durationMinutes} min`)
    if (log.distanceKm)      extraNotes.push(`Distance: ${log.distanceKm} km`)
    if (log.speedKmH)        extraNotes.push(`Speed: ${log.speedKmH} km/h`)
    if (log.inclinePct)      extraNotes.push(`Incline: ${log.inclinePct}%`)
    if (log.velocityPeakMps) extraNotes.push(`Peak velocity: ${log.velocityPeakMps} m/s`)
    if (log.velocityAvgMps)  extraNotes.push(`Average velocity: ${log.velocityAvgMps} m/s`)
    if (log.barPathDeviationCm) extraNotes.push(`Bar path drift: ${log.barPathDeviationCm} cm`)

    // Delete existing log for this session+exercise (idempotent)
    await prisma.exerciseLog.deleteMany({
      where: { sessionId: params.sessionId, exerciseId: dbExercise.id },
    })

    // Create the log
    const created = await prisma.exerciseLog.create({
      data: {
        sessionId:        params.sessionId,
        exerciseId:       dbExercise.id,
        order:            log.order,
        sets:             log.sets,
        reps:             log.reps,
        weightKg:         log.weightKg ?? null,
        restSeconds:      log.restSeconds ?? null,
        isCompleted:      log.isCompleted,
        notes:            extraNotes.length > 0 ? extraNotes.join(' · ') : null,
        velocityPeakMps:  typeof log.velocityPeakMps === 'number' ? log.velocityPeakMps : null,
        velocityAvgMps:   typeof log.velocityAvgMps === 'number' ? log.velocityAvgMps : null,
        barPathDeviationCm: typeof log.barPathDeviationCm === 'number' ? log.barPathDeviationCm : null,
        barPathPoints:    Array.isArray(log.barPathPoints) ? log.barPathPoints.slice(0, 80) as unknown as Prisma.InputJsonValue : undefined,
        previousWeightKg: previous?.weightKg ?? null,
        previousReps:     previous?.reps ?? null,
      },
    })
    saved.push(created.id)
  }

  return NextResponse.json({ saved: saved.length, ids: saved })
}
