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
      description: "Récupère le profil fitness de l'utilisateur : poids, taille, objectif, niveau, équipement disponible, blessures et focus corporel.",
      parameters: { type: 'object', properties: {} },
      async handler() {
        const profile = await prisma.profile.findUnique({ where: { userId: memberId } })
        if (!profile) return { error: 'Profil introuvable' }
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
      description: "Récupère les 10 dernières séances d'entraînement complétées avec les exercices et les performances (séries, répétitions, charges).",
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
      description: "Récupère le plan nutritionnel actif avec les objectifs en macronutriments (calories, protéines, glucides, lipides).",
      parameters: { type: 'object', properties: {} },
      async handler() {
        const plan = await prisma.nutritionPlan.findFirst({
          where:   { userId: memberId, isActive: true },
          include: { meals: { take: 20, include: { foodItems: { take: 8 } } } },
        })
        if (!plan) return { message: 'Aucun plan nutritionnel actif' }
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
      description: "Récupère l'historique de poids et de composition corporelle des 30 derniers jours.",
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
      description: "Récupère le programme d'entraînement actif avec les séances planifiées par semaine et par jour.",
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
        if (!program) return { message: 'Aucun programme actif' }
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
      description: "Calcule les tendances de progression sur les 4 dernières semaines : évolution du poids, nombre de séances complétées, régularité.",
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
          weightChange:     weightChange ? `${weightChange} kg` : 'Données insuffisantes',
        }
      },
    },
  ]
}
