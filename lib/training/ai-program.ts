import type { WorkoutProgram, WorkoutSession, SessionExercise } from '@/types'
import { AIProviderService } from '@/lib/ai/provider-service'
import { EXERCISE_DATABASE } from '@/lib/training/exercise-database'
import { generateProgram } from '@/lib/training/generate-program'

export interface TrainingProgramProfile {
  firstName?: string | null
  age?: number | null
  gender?: string | null
  weightKg?: number | null
  heightCm?: number | null
  activityLevel?: string | null
  fitnessGoal: string
  fitnessLevel: string
  bodyFocus?: string | null
  targetWeightKg?: number | null
  trainingDaysPerWeek: number
  availableEquipment: string[]
  injuries?: unknown
  language?: string | null
}

interface AIExerciseProposal {
  id: string
  sets?: number
  reps?: number
  restSeconds?: number
  tempo?: string
  rpe?: number
  notes?: string
}

interface AISessionProposal {
  name?: string
  dayOfWeek?: number
  durationMinutes?: number
  exercises?: AIExerciseProposal[]
}

interface AIProgramProposal {
  name?: string
  description?: string
  weeksTotal?: number
  sessions?: AISessionProposal[]
}

const aiProvider = new AIProviderService()

function clamp(value: unknown, min: number, max: number, fallback: number) {
  const n = typeof value === 'number' && Number.isFinite(value) ? value : fallback
  return Math.min(max, Math.max(min, Math.round(n)))
}

function exerciseMatchesEquipment(exerciseEquipment: string[], availableEquipment: string[]) {
  if (exerciseEquipment.includes('BODYWEIGHT')) return true
  return exerciseEquipment.some(eq => availableEquipment.includes(eq))
}

function buildExerciseCatalog(profile: TrainingProgramProfile) {
  return EXERCISE_DATABASE
    .filter(ex => exerciseMatchesEquipment(ex.equipment, profile.availableEquipment))
    .map(ex => ({
      id: ex.id,
      name: ex.name,
      muscles: ex.muscleGroups,
      equipment: ex.equipment,
      compound: ex.isCompound,
    }))
}

function buildPrompt(profile: TrainingProgramProfile) {
  const catalog = buildExerciseCatalog(profile)
  return [
    'You are the BodyOps training engine. Generate a workout program the application can use directly.',
    'Reply only with valid JSON, without Markdown.',
    'Use only the exercise.id values provided in the catalog.',
    'Strictly respect trainingDaysPerWeek for the number of sessions.',
    'Adapt volume, rest, intensity, and exercise selection to the goal, level, body focus, injuries, and equipment.',
    `Use ${profile.language === 'en' ? 'English' : 'French'} for user-facing program and session names.`,
    'Each session must include 4 to 7 exercises. For weight loss/endurance, include cardio or conditioning when available.',
    '',
    `User profile: ${JSON.stringify({
      firstName: profile.firstName,
      age: profile.age,
      gender: profile.gender,
      weightKg: profile.weightKg,
      heightCm: profile.heightCm,
      activityLevel: profile.activityLevel,
      fitnessGoal: profile.fitnessGoal,
      fitnessLevel: profile.fitnessLevel,
      bodyFocus: profile.bodyFocus,
      targetWeightKg: profile.targetWeightKg,
      trainingDaysPerWeek: profile.trainingDaysPerWeek,
      availableEquipment: profile.availableEquipment,
      injuries: profile.injuries,
      language: profile.language,
    })}`,
    `Allowed exercise catalog: ${JSON.stringify(catalog)}`,
    '',
    'Expected JSON schema:',
    JSON.stringify({
      name: 'BodyOps AI Program — Goal',
      description: 'Why this plan fits the profile.',
      weeksTotal: 8,
      sessions: [
        {
          name: 'Push A — Controlled hypertrophy',
          dayOfWeek: 0,
          durationMinutes: 60,
          exercises: [
            { id: 'ex-push-up', sets: 4, reps: 10, restSeconds: 90, tempo: '3-1-1-0', rpe: 7, notes: 'Controlled progression.' },
          ],
        },
      ],
    }),
  ].join('\n')
}

function extractJson(text: string) {
  const trimmed = text.trim()
  if (trimmed.startsWith('{')) return trimmed
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i)
  if (fenced?.[1]) return fenced[1].trim()
  const start = trimmed.indexOf('{')
  const end = trimmed.lastIndexOf('}')
  return start >= 0 && end > start ? trimmed.slice(start, end + 1) : trimmed
}

export function parseAIWorkoutProgram(text: string): AIProgramProposal | null {
  try {
    const parsed = JSON.parse(extractJson(text))
    if (!parsed || typeof parsed !== 'object') return null
    return parsed as AIProgramProposal
  } catch {
    return null
  }
}

function sanitizeAIProgram(proposal: AIProgramProposal | null, profile: TrainingProgramProfile): WorkoutProgram | null {
  if (!proposal?.sessions?.length) return null
  const allowed = new Map(
    EXERCISE_DATABASE
      .filter(ex => exerciseMatchesEquipment(ex.equipment, profile.availableEquipment))
      .map(ex => [ex.id, ex]),
  )

  const sessions: WorkoutSession[] = proposal.sessions
    .slice(0, clamp(profile.trainingDaysPerWeek, 1, 7, 3))
    .map((session, sessionIndex) => {
      const exercises: SessionExercise[] = (session.exercises ?? [])
        .map((item, order) => {
          const exercise = allowed.get(item.id)
          if (!exercise) return null
          return {
            ...exercise,
            order,
            sets: clamp(item.sets, 1, 6, profile.fitnessLevel === 'BEGINNER' ? 3 : 4),
            reps: clamp(item.reps, 1, 30, profile.fitnessGoal === 'MUSCLE_GAIN' ? 8 : 12),
            weightKg: null,
            restSeconds: clamp(item.restSeconds, 30, 240, profile.fitnessGoal === 'MUSCLE_GAIN' ? 120 : 75),
            tempo: typeof item.tempo === 'string' ? item.tempo.slice(0, 24) : undefined,
            rpe: clamp(item.rpe, 5, 10, profile.fitnessLevel === 'BEGINNER' ? 6 : 7),
            isCompleted: false,
          }
        })
        .filter(Boolean) as SessionExercise[]

      return {
        id: `ai-session-${sessionIndex}`,
        name: typeof session.name === 'string' && session.name.trim() ? session.name.trim().slice(0, 90) : `Session ${sessionIndex + 1}`,
        dayOfWeek: clamp(session.dayOfWeek, 0, 6, sessionIndex),
        durationMinutes: clamp(session.durationMinutes, 25, 120, exercises.length * 12 + 10),
        status: 'PLANNED' as const,
        exercises: exercises.slice(0, 7),
      }
    })
    .filter(session => session.exercises.length >= 3)

  if (sessions.length === 0) return null

  return {
    id: 'ai-program',
    name: typeof proposal.name === 'string' && proposal.name.trim()
      ? proposal.name.trim().slice(0, 90)
      : `BodyOps AI Program — ${profile.fitnessGoal}`,
    description: typeof proposal.description === 'string' ? proposal.description.trim().slice(0, 1200) : undefined,
    fitnessGoal: profile.fitnessGoal as never,
    fitnessLevel: profile.fitnessLevel as never,
    weeksTotal: clamp(proposal.weeksTotal, 4, 16, 8),
    currentWeek: 1,
    isActive: true,
    sessions,
  }
}

/** Generates a structured AI workout program, falling back to the deterministic engine when AI is unavailable or invalid. */
export async function generateAIEnhancedProgram(profile: TrainingProgramProfile) {
  const fallback = generateProgram({
    fitnessGoal: profile.fitnessGoal,
    fitnessLevel: profile.fitnessLevel,
    trainingDaysPerWeek: profile.trainingDaysPerWeek,
    availableEquipment: profile.availableEquipment,
    locale: profile.language === 'en' ? 'en' : 'fr',
  })

  if (!process.env.GEMINI_API_KEY && !process.env.GROQ_API_KEY) {
    return { program: fallback, provider: 'LOCAL' as const, aiGenerated: false }
  }

  try {
    const result = await aiProvider.generate([
      {
        role: 'system',
        content: 'You generate structured, safe, personalized fitness programs. Reply only with valid JSON.',
      },
      { role: 'user', content: buildPrompt(profile) },
    ])
    const program = sanitizeAIProgram(parseAIWorkoutProgram(result.text), profile)
    if (!program) return { program: fallback, provider: result.provider, aiGenerated: false }
    return { program, provider: result.provider, aiGenerated: true }
  } catch (error) {
    console.error('[training] AI workout generation failed:', error instanceof Error ? error.message : error)
    return { program: fallback, provider: 'LOCAL' as const, aiGenerated: false }
  }
}
