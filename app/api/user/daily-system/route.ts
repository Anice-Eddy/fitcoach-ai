export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth/auth'
import { prisma } from '@/lib/prisma/client'

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/)

function localDateKey(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function dateRange(dateKey: string) {
  const start = new Date(`${dateKey}T00:00:00.000`)
  const end = new Date(start)
  end.setDate(end.getDate() + 1)
  return { start, end }
}

function pct(actual: number, target: number) {
  if (target <= 0) return 0
  return Math.max(0, Math.min(100, Math.round((actual / target) * 100)))
}

type DailySystemLocale = 'fr' | 'en'

function missionCopy(locale: DailySystemLocale, targets: { steps: number; protein: number; water: number; sleep: number }) {
  if (locale === 'en') {
    return {
      steps:    { title: `${targets.steps} steps`, unit: 'steps' },
      protein:  { title: `${targets.protein} g protein`, unit: 'g' },
      water:    { title: `${targets.water} L water`, unit: 'L' },
      sleep:    { title: `${targets.sleep} h sleep`, unit: 'h' },
      training: { title: 'Daily session', unit: 'session' },
    }
  }

  return {
    steps:    { title: `${targets.steps} pas`, unit: 'pas' },
    protein:  { title: `${targets.protein} g protéines`, unit: 'g' },
    water:    { title: `${targets.water} L d'eau`, unit: 'L' },
    sleep:    { title: `${targets.sleep} h de sommeil`, unit: 'h' },
    training: { title: 'Séance du jour', unit: 'séance' },
  }
}

/** Returns daily missions, habits and BodyOps Score computed from persisted user data. */
export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const url = new URL(req.url)
  const parsedDate = dateSchema.safeParse(url.searchParams.get('date') ?? localDateKey())
  if (!parsedDate.success) return NextResponse.json({ error: parsedDate.error.flatten() }, { status: 422 })

  const userId = session.user.id
  const date = parsedDate.data
  const { start, end } = dateRange(date)

  const [profile, metric, nutritionLogs, completedSessions, savedHabits] = await Promise.all([
    prisma.profile.findUnique({ where: { userId } }),
    prisma.bodyMetric.findFirst({
      where: { userId, date: { gte: start, lt: end } },
      orderBy: { date: 'desc' },
    }),
    prisma.nutritionLog.findMany({ where: { userId, date } }),
    prisma.workoutSession.count({
      where: {
        userId,
        status: 'COMPLETED',
        completedAt: { gte: start, lt: end },
      },
    }),
    prisma.dailyHabitLog.findMany({ where: { userId, date } }),
  ])

  const proteinTarget = Math.round(profile?.recommendedProteinG ?? 150)
  const proteinActual = Math.round(nutritionLogs.reduce((sum, log) => sum + log.proteinG, 0))
  const waterTarget = 3
  const waterActual = metric?.waterLiters ?? 0
  const sleepTarget = 7
  const sleepActual = metric?.sleepHours ?? 0
  const stepsTarget = 8000
  const stepsActual = metric?.steps ?? 0
  const locale = profile?.language === 'en' ? 'en' : 'fr'
  const copy = missionCopy(locale, { steps: stepsTarget, protein: proteinTarget, water: waterTarget, sleep: sleepTarget })

  const missions = [
    { key: 'steps', title: copy.steps.title, type: 'HABIT' as const, targetValue: stepsTarget, actualValue: stepsActual, unit: copy.steps.unit, isCompleted: stepsActual >= stepsTarget },
    { key: 'protein', title: copy.protein.title, type: 'NUTRITION' as const, targetValue: proteinTarget, actualValue: proteinActual, unit: copy.protein.unit, isCompleted: proteinActual >= proteinTarget },
    { key: 'water', title: copy.water.title, type: 'HABIT' as const, targetValue: waterTarget, actualValue: waterActual, unit: copy.water.unit, isCompleted: waterActual >= waterTarget },
    { key: 'sleep', title: copy.sleep.title, type: 'RECOVERY' as const, targetValue: sleepTarget, actualValue: sleepActual, unit: copy.sleep.unit, isCompleted: sleepActual >= sleepTarget },
    { key: 'training', title: copy.training.title, type: 'TRAINING' as const, targetValue: 1, actualValue: completedSessions, unit: copy.training.unit, isCompleted: completedSessions > 0 },
  ]

  const nutritionScore = pct(proteinActual, proteinTarget)
  const activityScore = pct(stepsActual, stepsTarget)
  const recoveryScore = Math.round((pct(sleepActual, sleepTarget) + pct(waterActual, waterTarget)) / 2)
  const trainingScore = completedSessions > 0 ? 100 : 0
  const habitScore = Math.round(missions.filter(m => m.isCompleted).length / missions.length * 100)
  const progressionScore = metric?.weightKg || metric?.bodyFatPct || metric?.muscleMassKg ? 100 : 0
  const score = Math.round(
    nutritionScore * 0.25 +
    trainingScore * 0.2 +
    recoveryScore * 0.2 +
    habitScore * 0.15 +
    activityScore * 0.1 +
    progressionScore * 0.1,
  )

  // Persist the computed score and missions so coach and AI read the same daily state.
  const [savedScore] = await Promise.all([
    prisma.bodyOpsScore.upsert({
      where: { userId_date: { userId, date } },
      create: { userId, date, score, nutritionScore, trainingScore, recoveryScore, habitScore, progressionScore, activityScore },
      update: { score, nutritionScore, trainingScore, recoveryScore, habitScore, progressionScore, activityScore },
    }),
    ...missions.map(mission => prisma.dailyMission.upsert({
      where: { userId_date_key: { userId, date, key: mission.key } },
      create: { userId, date, ...mission },
      update: { ...mission, completedAt: mission.isCompleted ? new Date() : null },
    })),
  ])

  return NextResponse.json({
    date,
    score: savedScore,
    missions,
    habits: savedHabits,
  })
}
