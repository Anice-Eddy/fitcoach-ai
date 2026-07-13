import { prisma } from '@/lib/prisma/client'

export interface AITool {
  name: string
  description: string
  parameters: {
    type: 'object'
    properties: Record<string, { type: string; description: string }>
    required?: string[]
  }
  handler: (args: Record<string, unknown>) => Promise<unknown>
}

/** Returns the 6 Gemini function-calling tools bound to the given member's userId. */
export function createAITools(memberId: string): AITool[] {
  return [
    {
      name: 'getUserProfile',
      description: "Retrieves the user's fitness profile: weight, height, goal, level, available equipment, injuries, and body focus.",
      parameters: { type: 'object', properties: {} },
      async handler() {
        const profile = await prisma.profile.findUnique({ where: { userId: memberId } })
        if (!profile) return { error: 'Profile not found' }
        return {
          weightKg:           profile.weightKg,
          heightCm:           profile.heightCm,
          age:                profile.age,
          gender:             profile.gender,
          goal:               profile.fitnessGoal,
          level:              profile.fitnessLevel,
          trainingDays:       profile.trainingDaysPerWeek,
          equipment:          profile.availableEquipment,
          targetWeightKg:     profile.targetWeightKg,
          recommendedCalories: profile.recommendedCalories,
          recommendedProteinG: profile.recommendedProteinG,
          bodyFocus:          profile.bodyFocus,
          injuries:           profile.injuries,
          dietaryRestrictions: profile.dietaryRestrictions,
        }
      },
    },

    {
      name: 'getWorkoutHistory',
      description: "Retrieves the 10 latest completed workout sessions with exercises and performance data (sets, reps, loads).",
      parameters: { type: 'object', properties: {} },
      async handler() {
        const sessions = await prisma.workoutSession.findMany({
          where:   { userId: memberId, status: 'COMPLETED' },
          orderBy: { completedAt: 'desc' },
          take:    10,
          include: {
            exerciseLogs: {
              include: { exercise: { select: { name: true, muscleGroups: true } } },
            },
          },
        })
        return sessions.map(s => ({
          date:      s.completedAt?.toISOString().slice(0, 10) ?? s.scheduledAt?.toISOString().slice(0, 10),
          exercises: s.exerciseLogs.map(l => ({
            name:    l.exercise?.name,
            muscles: l.exercise?.muscleGroups,
            sets:    l.sets,
            reps:    l.reps,
            weight:  l.weightKg,
          })),
        }))
      },
    },

    {
      name: 'getNutritionPlan',
      description: "Retrieves the active nutrition plan with macro targets (calories, protein, carbs, fat).",
      parameters: { type: 'object', properties: {} },
      async handler() {
        const plan = await prisma.nutritionPlan.findFirst({
          where:   { userId: memberId, isActive: true },
          include: { meals: { take: 20, include: { foodItems: { take: 8 } } } },
        })
        if (!plan) return { message: 'No active nutrition plan' }
        return {
          name:           plan.name,
          targetCalories: plan.targetCalories,
          targetProteinG: plan.targetProteinG,
          targetCarbsG:   plan.targetCarbsG,
          targetFatG:     plan.targetFatG,
          mealsCount:     plan.meals.length,
        }
      },
    },

    {
      name: 'getWeightHistory',
      description: "Retrieves weight and body-composition history from the last 30 days.",
      parameters: { type: 'object', properties: {} },
      async handler() {
        const metrics = await prisma.bodyMetric.findMany({
          where:   { userId: memberId, weightKg: { not: null } },
          orderBy: { date: 'desc' },
          take:    30,
          select:  { date: true, weightKg: true, bodyFatPct: true, energyLevel: true, stressLevel: true },
        })
        return metrics.map(m => ({
          date:       m.date.toISOString().slice(0, 10),
          weightKg:   m.weightKg,
          bodyFatPct: m.bodyFatPct,
          energy:     m.energyLevel,
          stress:     m.stressLevel,
        }))
      },
    },

    {
      name: 'getCurrentProgram',
      description: "Retrieves the active workout program with sessions planned by week and day.",
      parameters: { type: 'object', properties: {} },
      async handler() {
        const program = await prisma.workoutProgram.findFirst({
          where:   { userId: memberId, isActive: true },
          include: {
            sessions: {
              orderBy: [{ weekNumber: 'asc' }, { dayOfWeek: 'asc' }],
              take:    14,
            },
          },
        })
        if (!program) return { message: 'No active workout program' }
        return {
          name:          program.name,
          sessionsCount: program.sessions.length,
          sessions:      program.sessions.slice(0, 7).map(s => ({
            week: s.weekNumber,
            day:  s.dayOfWeek,
            name: s.name,
          })),
        }
      },
    },

    {
      name: 'getProgressAnalytics',
      description: "Calculates progress trends over the last 4 weeks: weight change, completed sessions, and consistency.",
      parameters: { type: 'object', properties: {} },
      async handler() {
        const since = new Date()
        since.setDate(since.getDate() - 28)

        const [metrics, sessionsCount] = await Promise.all([
          prisma.bodyMetric.findMany({
            where:   { userId: memberId, date: { gte: since } },
            orderBy: { date: 'asc' },
            select:  { date: true, weightKg: true },
          }),
          prisma.workoutSession.count({
            where: { userId: memberId, status: 'COMPLETED', completedAt: { gte: since } },
          }),
        ])

        const weights = metrics.filter(m => m.weightKg)
        const weightChange = weights.length >= 2
          ? ((weights.at(-1)!.weightKg ?? 0) - (weights[0].weightKg ?? 0)).toFixed(1)
          : null

        return {
          weeksAnalyzed:    4,
          completedSessions: sessionsCount,
          weeklyAverage:    (sessionsCount / 4).toFixed(1),
          weightChange:     weightChange ? `${weightChange} kg` : 'Insufficient data',
        }
      },
    },
  ]
}
