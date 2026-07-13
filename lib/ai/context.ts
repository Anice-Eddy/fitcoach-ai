import { prisma } from '@/lib/prisma/client'
import type { MemberAccess, MemberAIContext } from '@/lib/ai/types'

/**
 * Strips PII (email, phone, full names) from any text before sending to Gemini.
 * Respects GDPR: only fitness data is transmitted to the external AI provider.
 */
export function sanitizeContextForAI(text: string): string {
  return text
    // Email addresses
    .replace(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g, '[email]')
    // French mobile/landline (+33..., 06..., 07..., 01-05...)
    .replace(/(?:\+33\s?|0)[1-9](?:[\s.\-]?\d{2}){4}/g, '[phone]')
    // International phone patterns (general)
    .replace(/\+\d{1,3}[\s\-]?\(?\d{1,4}\)?[\s\-]?\d{3,4}[\s\-]?\d{3,4}/g, '[phone]')
    // Full name patterns (First name Last name format in context lines)
    .replace(/(name|nom|prénom):\s*["']?[A-ZÀÂÄÉÈÊËÎÏÔÙÛÜ][a-zàâäéèêëîïôùûü]{1,}\s+[A-ZÀÂÄÉÈÊËÎÏÔÙÛÜ][a-zàâäéèêëîïôùûü]{1,}["']?/gi, '$1: [anonymous]')
}

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
  injuries?: unknown
  bodyFocus?: string | null
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

// Formats the last 6 body-metric entries with lifestyle signals so the AI can link progress to recovery.
function buildProgressHistory(metrics: Array<{
  weightKg?: number | null
  date?: Date
  steps?: number | null
  sleepHours?: number | null
  waterLiters?: number | null
  energyLevel?: number | null
  stressLevel?: number | null
}>) {
  return metrics
    .slice(0, 6)
    .map(metric => {
      const date = metric.date instanceof Date ? metric.date.toISOString().slice(0, 10) : 'unknown date'
      if (!metric.weightKg) return null
      const signals = [
        metric.steps != null ? `${metric.steps} steps` : null,
        metric.sleepHours != null ? `${metric.sleepHours}h sleep` : null,
        metric.waterLiters != null ? `${metric.waterLiters}L water` : null,
        metric.energyLevel != null ? `energy ${metric.energyLevel}/5` : null,
        metric.stressLevel != null ? `stress ${metric.stressLevel}/5` : null,
      ].filter(Boolean)
      return signals.length > 0
        ? `${date}: ${metric.weightKg} kg (${signals.join(', ')})`
        : `${date}: ${metric.weightKg} kg`
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
      nutritionLogs: {
        orderBy: { loggedAt: 'desc' },
        take: 30,
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
    bodyFocus: profile?.bodyFocus ?? null,
    currentProgram,
    progressHistory: buildProgressHistory(member.bodyMetrics),
    injuryOrRestrictionSignals: (() => {
      const raw = profile?.injuries
      const structured = Array.isArray(raw)
        ? (raw as Array<{ bodyPart?: string; severity?: string; description?: string }>)
        : []
      if (structured.length > 0) {
        return structured.map(i => {
          const sev = i.severity === 'SEVERE' ? 'severe' : i.severity === 'MODERATE' ? 'moderate' : 'mild'
          return `${i.bodyPart} (${sev})${i.description ? ': ' + i.description : ''}`
        })
      }
      return extractSignals(noteTexts)
    })(),
  }
  const missingData = {
    workoutPlan: listMissing([
      ['current weight', userFacts.currentWeightKg],
      ['target weight', userFacts.targetWeightKg],
      ['primary goal', userFacts.primaryGoal],
      ['fitness level', userFacts.fitnessLevel],
      ['available sessions per week', userFacts.trainingDaysPerWeek],
      ['available equipment', userFacts.availableEquipment],
      ['possible injuries', userFacts.injuryOrRestrictionSignals.length ? userFacts.injuryOrRestrictionSignals : null],
    ]),
    nutritionPlan: listMissing([
      ['current weight', userFacts.currentWeightKg],
      ['height', userFacts.heightCm],
      ['age', userFacts.age],
      ['sex', userFacts.gender],
      ['primary goal', userFacts.primaryGoal],
      ['target weight', userFacts.targetWeightKg],
      ['food preferences', userFacts.foodPreferences],
      ['dietary restrictions', userFacts.dietaryRestrictions],
    ]),
    actionPlan: listMissing([
      ['current weight', userFacts.currentWeightKg],
      ['primary goal', userFacts.primaryGoal],
      ['fitness level', userFacts.fitnessLevel],
      ['training frequency', userFacts.trainingDaysPerWeek],
      ['progress history', userFacts.progressHistory],
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
    nutritionLogs: member.nutritionLogs,
    coachNotes,
    appointments,
    userNotes: member.userNotes,
    dataQuality: {
      hasProfile: !!member.profile,
      metricsCount: member.bodyMetrics.length,
      completedSessionsCount,
      nutritionPlansCount: member.nutritionPlans.length,
      nutritionLogsCount: member.nutritionLogs.length,
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
      || context.dataQuality.nutritionLogsCount > 0
      || context.dataQuality.coachNotesCount > 0)
}

/** Serializes a MemberAIContext to a pretty-printed JSON string, converting Date objects to ISO strings. */
export function serializeContext(context: MemberAIContext) {
  return JSON.stringify(context, (_key, value) => {
    if (value instanceof Date) return value.toISOString()
    return value
  }, 2)
}

/** Builds a compact, coach-readable text summary of the member context, replacing raw JSON for AI prompts. */
export function serializeContextCompact(context: MemberAIContext): string {
  const { userFacts, missingData, workoutSessions, nutritionPlans, nutritionLogs } = context
  const lines: string[] = []

  // --- Profile ---
  const profile: string[] = []
  if (userFacts.currentWeightKg) profile.push(`weight ${userFacts.currentWeightKg} kg`)
  if (userFacts.targetWeightKg)  profile.push(`target ${userFacts.targetWeightKg} kg`)
  if (userFacts.heightCm && userFacts.currentWeightKg) {
    const bmi = (userFacts.currentWeightKg / Math.pow(userFacts.heightCm / 100, 2)).toFixed(1)
    profile.push(`BMI ${bmi}`)
  }
  if (userFacts.age)    profile.push(`${userFacts.age} years old`)
  if (userFacts.gender) profile.push(userFacts.gender)
  if (userFacts.primaryGoal)        profile.push(`goal: ${userFacts.primaryGoal}`)
  if (userFacts.fitnessLevel)       profile.push(`level: ${userFacts.fitnessLevel}`)
  if (userFacts.trainingDaysPerWeek) profile.push(`${userFacts.trainingDaysPerWeek} sessions/week`)
  if (userFacts.currentProgram)     profile.push(`program: ${userFacts.currentProgram}`)
  if (userFacts.availableEquipment.length) profile.push(`equipment: ${userFacts.availableEquipment.join(', ')}`)
  if (userFacts.dietaryRestrictions.length) profile.push(`restrictions: ${userFacts.dietaryRestrictions.join(', ')}`)
  if (userFacts.bodyFocus) profile.push(`focus: ${userFacts.bodyFocus}`)
  if (profile.length) lines.push(`PROFILE: ${profile.join(' | ')}`)

  // --- Weight progress ---
  if (userFacts.progressHistory.length) {
    lines.push(`WEIGHT TREND: ${userFacts.progressHistory.join(' -> ')}`)
  }

  // --- Sessions ---
  const sessions = workoutSessions as Array<Record<string, unknown>>
  const completedSessions = sessions.filter(s => s['status'] === 'COMPLETED')
  lines.push(`SESSIONS: ${completedSessions.length} completed out of ${sessions.length} retrieved`)

  const recent = completedSessions.slice(0, 6)
  if (recent.length) {
    const summaries = recent.map(s => {
      const raw = (s['completedAt'] ?? s['scheduledAt']) as string | Date | undefined
      const date = raw ? new Date(raw).toLocaleDateString('en-US', { day: '2-digit', month: '2-digit' }) : '?'
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
    lines.push(`LATEST SESSIONS: ${summaries.join(' | ')}`)
  }

  // --- Nutrition ---
  if (nutritionPlans.length) {
    const plan = nutritionPlans[0] as Record<string, unknown>
    const meals = plan['meals'] as unknown[] | undefined
    lines.push(`NUTRITION: plan "${String(plan['name'] ?? 'active')}" - ${meals?.length ?? 0} meals configured`)
  } else {
    lines.push('NUTRITION: no active plan')
  }

  const logs = nutritionLogs as Array<Record<string, unknown>>
  if (logs.length) {
    // Summarize real consumed meals without sending every detail to the AI provider.
    const recentLogs = logs.slice(0, 8).map(log => {
      const date = String(log['date'] ?? '?')
      const calories = Math.round(Number(log['calories'] ?? 0))
      const protein = Math.round(Number(log['proteinG'] ?? 0))
      return `${date}:${String(log['name'] ?? 'meal')}(${calories}kcal,P${protein}g)`
    })
    lines.push(`REAL NUTRITION LOG: ${recentLogs.join(' | ')}`)
  }

  // --- Injuries/restrictions ---
  if (userFacts.injuryOrRestrictionSignals.length) {
    lines.push(`INJURY/RESTRICTION SIGNALS: ${userFacts.injuryOrRestrictionSignals.join('; ')}`)
  }

  // --- Missing data ---
  const allMissing = [...new Set([...missingData.workoutPlan, ...missingData.nutritionPlan])]
  if (allMissing.length) {
    lines.push(`MISSING DATA: ${allMissing.join(', ')}`)
  }

  return sanitizeContextForAI(lines.join('\n'))
}
