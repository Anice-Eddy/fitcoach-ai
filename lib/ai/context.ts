import { prisma } from '@/lib/prisma/client'
import type { MemberAccess, MemberAIContext } from '@/lib/ai/types'

type ProfileLike = {
  weightKg?: number | null
  heightCm?: number | null
  age?: number | null
  gender?: string | null
  fitnessGoal?: string | null
  targetWeightKg?: number | null
  fitnessLevel?: string | null
  trainingDaysPerWeek?: number | null
  availableEquipment?: string[] | null
  dietaryRestrictions?: string[] | null
  foodPreferences?: string[] | null
}

// Returns labels for items whose value is null, undefined, empty string, or empty array.
function listMissing(items: Array<[string, unknown]>) {
  return items
    .filter(([, value]) => {
      if (Array.isArray(value)) return value.length === 0
      return value === null || value === undefined || value === ''
    })
    .map(([label]) => label)
}

// Scans text strings for injury/restriction keywords and returns up to 6 matching snippets.
function extractSignals(texts: string[]) {
  const keywords = ['douleur', 'blessure', 'gene', 'gêne', 'tendinite', 'restriction', 'limite', 'mal au', 'inconfort']
  return texts
    .map(text => text.trim())
    .filter(text => keywords.some(keyword => text.toLowerCase().includes(keyword)))
    .slice(0, 6)
}

// Formats the last 6 body-metric entries as "YYYY-MM-DD: X kg" strings, filtering out entries without weight.
function buildProgressHistory(metrics: Array<{ weightKg?: number | null; date?: Date }>) {
  return metrics
    .slice(0, 6)
    .map(metric => {
      const date = metric.date instanceof Date ? metric.date.toISOString().slice(0, 10) : 'date inconnue'
      return metric.weightKg ? `${date}: ${metric.weightKg} kg` : null
    })
    .filter((value): value is string => Boolean(value))
}

/** Resolves the access level for requesterId over memberId; returns null if the requester is not a coach of that member. */
export async function resolveMemberAccess(requesterId: string, memberId?: string | null): Promise<MemberAccess | null> {
  if (!memberId || memberId === requesterId) {
    return { requesterId, memberId: requesterId, coachId: null, role: 'member' }
  }

  const coach = await prisma.coachProfile.findUnique({
    where:  { userId: requesterId },
    select: { id: true },
  })
  if (!coach) return null

  const membership = await prisma.coachMember.findUnique({
    where:  { coachId_memberId: { coachId: coach.id, memberId } },
    select: { id: true },
  })
  if (!membership) return null

  return { requesterId, memberId, coachId: coach.id, role: 'coach' }
}

/** Fetches all data needed for AI analysis (profile, metrics, workouts, nutrition, notes, appointments) and returns a structured MemberAIContext. */
export async function getMemberAIContext(memberId: string, coachId?: string | null): Promise<MemberAIContext | null> {
  const member = await prisma.user.findUnique({
    where: { id: memberId },
    select: {
      id: true,
      name: true,
      profile: true,
      bodyMetrics: {
        orderBy: { date: 'desc' },
        take: 12,
      },
      workoutPrograms: {
        where: { isActive: true },
        take: 2,
        include: {
          sessions: {
            orderBy: [{ weekNumber: 'asc' }, { dayOfWeek: 'asc' }],
            take: 20,
          },
        },
      },
      workoutSessions: {
        orderBy: [{ completedAt: 'desc' }, { scheduledAt: 'desc' }],
        take: 20,
        include: {
          exerciseLogs: {
            orderBy: { order: 'asc' },
            include: { exercise: { select: { name: true, muscleGroups: true, equipment: true } } },
          },
        },
      },
      nutritionPlans: {
        where: { isActive: true },
        take: 2,
        include: {
          meals: {
            orderBy: [{ dayOfWeek: 'asc' }, { type: 'asc' }],
            take: 20,
            include: { foodItems: { take: 8 } },
          },
        },
      },
      userNotes: {
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
    },
  })

  if (!member) return null

  const [coachNotes, appointments] = await Promise.all([
    coachId
      ? prisma.coachNote.findMany({
          where: { memberId, coachId },
          orderBy: { createdAt: 'desc' },
          take: 12,
          include: {
            replies: {
              orderBy: { createdAt: 'asc' },
              take: 8,
              select: { content: true, createdAt: true },
            },
          },
        })
      : prisma.coachNote.findMany({
          where: { memberId, isSharedWithMember: true },
          orderBy: { createdAt: 'desc' },
          take: 8,
          select: {
            title: true,
            content: true,
            category: true,
            status: true,
            priority: true,
            createdAt: true,
          },
        }),
    prisma.coachAppointment.findMany({
      where: { memberId, ...(coachId ? { coachId } : {}) },
      orderBy: { scheduledAt: 'desc' },
      take: 10,
      select: {
        title: true,
        description: true,
        scheduledAt: true,
        status: true,
        coachNote: true,
        memberNote: true,
      },
    }),
  ])

  const completedSessionsCount = member.workoutSessions.filter(s => s.status === 'COMPLETED').length
  const profile = member.profile as ProfileLike | null
  const latestMetric = member.bodyMetrics[0]
  const currentWeightKg = latestMetric?.weightKg ?? profile?.weightKg ?? null
  const currentProgram = member.workoutPrograms[0]?.name ?? null
  const noteTexts = [
    ...member.userNotes.map(note => `${note.title} ${note.content}`),
    ...coachNotes.map(note => {
      if ('content' in note) return `${note.title ?? ''} ${note.content ?? ''}`
      return ''
    }),
  ]
  const userFacts = {
    currentWeightKg,
    heightCm: profile?.heightCm ?? null,
    age: profile?.age ?? null,
    gender: profile?.gender ?? null,
    primaryGoal: profile?.fitnessGoal ?? null,
    targetWeightKg: profile?.targetWeightKg ?? null,
    fitnessLevel: profile?.fitnessLevel ?? null,
    trainingDaysPerWeek: profile?.trainingDaysPerWeek ?? null,
    availableEquipment: profile?.availableEquipment ?? [],
    dietaryRestrictions: profile?.dietaryRestrictions ?? [],
    foodPreferences: profile?.foodPreferences ?? [],
    currentProgram,
    progressHistory: buildProgressHistory(member.bodyMetrics),
    injuryOrRestrictionSignals: extractSignals(noteTexts),
  }
  const missingData = {
    workoutPlan: listMissing([
      ['poids actuel', userFacts.currentWeightKg],
      ['objectif de poids', userFacts.targetWeightKg],
      ['objectif principal', userFacts.primaryGoal],
      ['niveau sportif', userFacts.fitnessLevel],
      ['nombre de séances possibles par semaine', userFacts.trainingDaysPerWeek],
      ['matériel disponible', userFacts.availableEquipment],
      ['blessures éventuelles', userFacts.injuryOrRestrictionSignals.length ? userFacts.injuryOrRestrictionSignals : null],
    ]),
    nutritionPlan: listMissing([
      ['poids actuel', userFacts.currentWeightKg],
      ['taille', userFacts.heightCm],
      ['âge', userFacts.age],
      ['sexe', userFacts.gender],
      ['objectif principal', userFacts.primaryGoal],
      ['objectif de poids', userFacts.targetWeightKg],
      ['préférences alimentaires', userFacts.foodPreferences],
      ['restrictions alimentaires', userFacts.dietaryRestrictions],
    ]),
    actionPlan: listMissing([
      ['poids actuel', userFacts.currentWeightKg],
      ['objectif principal', userFacts.primaryGoal],
      ['niveau sportif', userFacts.fitnessLevel],
      ['fréquence d’entraînement', userFacts.trainingDaysPerWeek],
      ['historique de progression', userFacts.progressHistory],
    ]),
  }

  return {
    member: { id: member.id, name: member.name },
    userFacts,
    missingData,
    profile: member.profile,
    bodyMetrics: member.bodyMetrics,
    workoutPrograms: member.workoutPrograms,
    workoutSessions: member.workoutSessions,
    nutritionPlans: member.nutritionPlans,
    coachNotes,
    appointments,
    userNotes: member.userNotes,
    dataQuality: {
      hasProfile: !!member.profile,
      metricsCount: member.bodyMetrics.length,
      completedSessionsCount,
      nutritionPlansCount: member.nutritionPlans.length,
      coachNotesCount: coachNotes.length,
    },
  }
}

/** Returns true if the context has a profile plus at least one of: metrics, completed sessions, nutrition plans, or coach notes. */
export function hasEnoughDataForAnalysis(context: MemberAIContext) {
  return context.dataQuality.hasProfile
    && (context.dataQuality.metricsCount > 0
      || context.dataQuality.completedSessionsCount > 0
      || context.dataQuality.nutritionPlansCount > 0
      || context.dataQuality.coachNotesCount > 0)
}

/** Serializes a MemberAIContext to a pretty-printed JSON string, converting Date objects to ISO strings. */
export function serializeContext(context: MemberAIContext) {
  return JSON.stringify(context, (_key, value) => {
    if (value instanceof Date) return value.toISOString()
    return value
  }, 2)
}

/** Builds a compact, coach-readable text summary of the member context — replaces raw JSON for AI prompts. */
export function serializeContextCompact(context: MemberAIContext): string {
  const { userFacts, missingData, workoutSessions, nutritionPlans } = context
  const lines: string[] = []

  // --- Profil ---
  const profile: string[] = []
  if (userFacts.currentWeightKg) profile.push(`poids ${userFacts.currentWeightKg} kg`)
  if (userFacts.targetWeightKg)  profile.push(`objectif ${userFacts.targetWeightKg} kg`)
  if (userFacts.heightCm && userFacts.currentWeightKg) {
    const bmi = (userFacts.currentWeightKg / Math.pow(userFacts.heightCm / 100, 2)).toFixed(1)
    profile.push(`IMC ${bmi}`)
  }
  if (userFacts.age)    profile.push(`${userFacts.age} ans`)
  if (userFacts.gender) profile.push(userFacts.gender)
  if (userFacts.primaryGoal)        profile.push(`objectif: ${userFacts.primaryGoal}`)
  if (userFacts.fitnessLevel)       profile.push(`niveau: ${userFacts.fitnessLevel}`)
  if (userFacts.trainingDaysPerWeek) profile.push(`${userFacts.trainingDaysPerWeek} séances/semaine`)
  if (userFacts.currentProgram)     profile.push(`programme: ${userFacts.currentProgram}`)
  if (userFacts.availableEquipment.length) profile.push(`équipement: ${userFacts.availableEquipment.join(', ')}`)
  if (userFacts.dietaryRestrictions.length) profile.push(`restrictions: ${userFacts.dietaryRestrictions.join(', ')}`)
  if (profile.length) lines.push(`PROFIL: ${profile.join(' | ')}`)

  // --- Progression poids ---
  if (userFacts.progressHistory.length) {
    lines.push(`ÉVOLUTION POIDS: ${userFacts.progressHistory.join(' → ')}`)
  }

  // --- Séances ---
  const sessions = workoutSessions as Array<Record<string, unknown>>
  const completedSessions = sessions.filter(s => s['status'] === 'COMPLETED')
  lines.push(`SÉANCES: ${completedSessions.length} complétées sur ${sessions.length} récupérées`)

  const recent = completedSessions.slice(0, 6)
  if (recent.length) {
    const summaries = recent.map(s => {
      const raw = (s['completedAt'] ?? s['scheduledAt']) as string | Date | undefined
      const date = raw ? new Date(raw).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }) : '?'
      const logs = s['exerciseLogs'] as Array<Record<string, unknown>> | undefined
      const muscles = Array.from(new Set(
        (logs ?? []).flatMap(l => {
          const ex = l['exercise'] as Record<string, unknown> | undefined
          return (ex?.['muscleGroups'] as string[] | undefined) ?? []
        })
      )).slice(0, 3).join('+')
      const exCount = logs?.length ?? 0
      return `${date}(${exCount}ex${muscles ? ' '+muscles : ''})`
    })
    lines.push(`DERNIÈRES SÉANCES: ${summaries.join(' | ')}`)
  }

  // --- Nutrition ---
  if (nutritionPlans.length) {
    const plan = nutritionPlans[0] as Record<string, unknown>
    const meals = plan['meals'] as unknown[] | undefined
    lines.push(`NUTRITION: plan "${String(plan['name'] ?? 'actif')}" — ${meals?.length ?? 0} repas configurés`)
  } else {
    lines.push('NUTRITION: aucun plan actif')
  }

  // --- Blessures/restrictions ---
  if (userFacts.injuryOrRestrictionSignals.length) {
    lines.push(`SIGNAUX BLESSURE/RESTRICTION: ${userFacts.injuryOrRestrictionSignals.join('; ')}`)
  }

  // --- Données manquantes ---
  const allMissing = [...new Set([...missingData.workoutPlan, ...missingData.nutritionPlan])]
  if (allMissing.length) {
    lines.push(`DONNÉES MANQUANTES: ${allMissing.join(', ')}`)
  }

  return lines.join('\n')
}
