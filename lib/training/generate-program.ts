// Workout program generator based on the user profile.
// Generates PPL (Push/Pull/Legs) or Full Body programs depending on available days.

import type { WorkoutProgram, WorkoutSession, SessionExercise } from '@/types'
import { EXERCISE_DATABASE } from './exercise-database'

interface ProgramParams {
  fitnessGoal:         string
  fitnessLevel:        string
  trainingDaysPerWeek: number
  availableEquipment:  string[]
  locale?:             'fr' | 'en'
}

function filterByEquipment(exercises: typeof EXERCISE_DATABASE, equipment: string[]) {
  if (equipment.length === 0) return exercises
  return exercises.filter((ex) => ex.equipment.some((eq) => equipment.includes(eq)))
}

/**
 * Builds a WorkoutSession.
 * @param offset - rotation offset so two sessions with the same muscle groups
 *                 pick different exercises (Push A vs Push B, etc.)
 */
function buildSession(
  name:         string | { fr: string; en: string },
  muscleGroups: string[],
  equipment:    string[],
  level:        string,
  offset  = 0,
  goal    = '',
  locale: 'fr' | 'en' = 'fr',
): WorkoutSession {
  const sessionName = typeof name === 'string' ? name : name[locale]
  const available = filterByEquipment(EXERCISE_DATABASE, equipment)
    .filter(ex => ex.muscleGroups[0] !== 'CARDIO') // cardio handled separately

  const target = level === 'BEGINNER' ? 4 : level === 'INTERMEDIATE' ? 5 : 6
  const seen   = new Set<string>()
  const picked: typeof EXERCISE_DATABASE = []

  // Seed based on session name for stable ordering while varying A/B sessions.
  const seed   = sessionName.split('').reduce((acc, c) => acc + c.charCodeAt(0), offset * 97)
  const seededRand = (i: number) => Math.abs(Math.sin(seed + i)) // deterministic pseudo-random

  const shuffle = <T,>(arr: T[]): T[] => {
    const a = [...arr]
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(seededRand(i) * (i + 1));
      [a[i], a[j]] = [a[j], a[i]]
    }
    return a
  }

  // Pass 1: primary muscle match, shuffled with an offset to vary A/B sessions.
  for (const muscle of muscleGroups) {
    const perGroup = Math.max(1, Math.round(target / muscleGroups.length))
    const matches  = shuffle(
      available.filter((ex) => ex.muscleGroups[0] === muscle && !seen.has(ex.id)),
    )
    // Apply offset rotation: skip the first `offset` matches and wrap around
    const rotated = offset > 0
      ? [...matches.slice(offset), ...matches.slice(0, offset)]
      : matches
    for (const ex of rotated.slice(0, perGroup)) {
      seen.add(ex.id)
      picked.push(ex)
    }
  }

  // Pass 2: fill remaining slots with secondary muscle matches.
  if (picked.length < target) {
    for (const muscle of muscleGroups) {
      const matches = available.filter(
        (ex) => ex.muscleGroups.includes(muscle as never) && !seen.has(ex.id),
      )
      for (const ex of matches) {
        if (picked.length >= target) break
        seen.add(ex.id)
        picked.push(ex)
      }
      if (picked.length >= target) break
    }
  }

  // Parameters based on level and goal.
  const sets       = level === 'BEGINNER' ? 3 : 4
  const reps       = goal === 'MUSCLE_GAIN' ? 8 : goal === 'WEIGHT_LOSS' ? 15 : 12
  const restSecs   = goal === 'MUSCLE_GAIN' ? 120 : goal === 'WEIGHT_LOSS' ? 45 : 90

  const exercises: SessionExercise[] = picked.slice(0, target).map((ex, i) => ({
    ...ex,
    order:       i,
    sets,
    reps,
    weightKg:    null,
    restSeconds: restSecs,
    isCompleted: false,
  }))

  return {
    id:              `local-${sessionName.toLowerCase().replace(/[\s/—]+/g, '-').replace(/[^a-z0-9-]/g, '')}`,
    name:            sessionName,
    status:          'PLANNED',
    exercises,
    durationMinutes: exercises.length * 12 + 10,
  }
}

// Bodyweight HIIT exercise IDs, no machine required.
const HIIT_EXERCISE_IDS = [
  'ex-burpee', 'ex-mountain-climber', 'ex-jump-rope',
  'ex-jump-squat', 'ex-box-jump', 'ex-hiit',
]

/** Builds a cardio session.
 *  - HIIT: bodyweight exercises with short work intervals (30-45s work / 15s rest)
 *  - Steady-state: treadmill, bike, or rower with longer duration
 */
function buildCardioSession(
  name:      string | { fr: string; en: string },
  exerciseIds: string[],
  isHIIT = false,
  locale: 'fr' | 'en' = 'fr',
): WorkoutSession {
  const sessionName = typeof name === 'string' ? name : name[locale]
  const cardioExs = EXERCISE_DATABASE.filter(ex => exerciseIds.includes(ex.id))
  const dur = isHIIT ? 20 : 30
  const sessionExercises: SessionExercise[] = cardioExs.map((ex, i) => ({
    ...ex,
    order:           i,
    sets:            isHIIT ? 4 : 1,   // HIIT: 4 rounds, steady: 1 session
    reps:            isHIIT ? 12 : 1,
    weightKg:        null,
    restSeconds:     isHIIT ? 30 : 60,
    isCompleted:     false,
    durationMinutes: dur,
  }))
  return {
    id:              `local-${sessionName.toLowerCase().replace(/[\s/—]+/g, '-').replace(/[^a-z0-9-]/g, '')}`,
    name:            sessionName,
    status:          'PLANNED',
    exercises:       sessionExercises,
    durationMinutes: dur + 5,
  }
}

/** Generates a full-week WorkoutProgram (Full Body, PPL, or Upper/Lower) based on fitness goal, level, and available training days. */
export function generateProgram(params: ProgramParams): WorkoutProgram {
  const { fitnessGoal, fitnessLevel, trainingDaysPerWeek, availableEquipment, locale = 'fr' } = params
  const g = fitnessGoal

  let sessions: WorkoutSession[] = []

  if (trainingDaysPerWeek <= 3) {
    // Full Body, up to 3 days.
    sessions = [
      buildSession({ fr: 'Corps complet A', en: 'Full Body A' }, ['CHEST', 'BACK', 'QUADS'],              availableEquipment, fitnessLevel, 0, g, locale),
      buildSession({ fr: 'Corps complet B', en: 'Full Body B' }, ['SHOULDERS', 'HAMSTRINGS', 'BICEPS', 'TRICEPS'], availableEquipment, fitnessLevel, 1, g, locale),
      buildSession({ fr: 'Corps complet C', en: 'Full Body C' }, ['CHEST', 'BACK', 'GLUTES', 'CORE'],     availableEquipment, fitnessLevel, 2, g, locale),
    ].slice(0, trainingDaysPerWeek)

  } else if (trainingDaysPerWeek <= 5) {
    // PPL split: Push / Pull / Legs.
    if (g === 'WEIGHT_LOSS') {
      // Weight loss: lighter PPL plus integrated cardio.
      sessions = [
        buildSession({ fr: 'Poussée - Pectoraux / Épaules / Triceps', en: 'Push - Chest / Shoulders / Triceps' }, ['CHEST', 'SHOULDERS', 'TRICEPS'], availableEquipment, fitnessLevel, 0, g, locale),
        buildCardioSession({ fr: 'HIIT - Circuit cardio', en: 'HIIT - Cardio circuit' }, HIIT_EXERCISE_IDS, true, locale),
        buildSession({ fr: 'Pull - Dos / Biceps', en: 'Pull - Back / Biceps' }, ['BACK', 'BICEPS'], availableEquipment, fitnessLevel, 0, g, locale),
        buildCardioSession({ fr: 'Cardio - Marche inclinée / Tapis', en: 'Cardio - Incline walk / Treadmill' }, ['ex-incline-walk', 'ex-treadmill-12-3-30', 'ex-cycling'], false, locale),
        buildSession({ fr: 'Legs - Jambes / Fessiers', en: 'Legs - Quads / Glutes' }, ['QUADS', 'HAMSTRINGS', 'GLUTES'], availableEquipment, fitnessLevel, 0, g, locale),
      ].slice(0, trainingDaysPerWeek)
    } else {
      sessions = [
        // Offset 0 favors barbells and compound lifts first.
        buildSession({ fr: 'Poussée A - Pectoraux / Épaules / Triceps', en: 'Push A - Chest / Shoulders / Triceps' }, ['CHEST', 'SHOULDERS', 'TRICEPS'], availableEquipment, fitnessLevel, 0, g, locale),
        buildSession({ fr: 'Pull A - Dos / Biceps', en: 'Pull A - Back / Biceps' }, ['BACK', 'BICEPS'], availableEquipment, fitnessLevel, 0, g, locale),
        buildSession({ fr: 'Legs A - Jambes / Fessiers', en: 'Legs A - Quads / Glutes' }, ['QUADS', 'HAMSTRINGS', 'GLUTES'], availableEquipment, fitnessLevel, 0, g, locale),
        // Offset 1 favors dumbbells and exercise variations.
        buildSession({ fr: 'Poussée B - Épaules / Triceps / Pectoraux', en: 'Push B - Shoulders / Triceps / Chest' }, ['CHEST', 'SHOULDERS', 'TRICEPS'], availableEquipment, fitnessLevel, 1, g, locale),
        buildSession({ fr: 'Pull B - Biceps / Dos / Core', en: 'Pull B - Biceps / Back / Core' }, ['BACK', 'BICEPS', 'CORE'], availableEquipment, fitnessLevel, 1, g, locale),
      ].slice(0, trainingDaysPerWeek)
    }

  } else {
    // Upper/lower split for 6-7 days.
    sessions = [
      buildSession({ fr: 'Upper A - Force', en: 'Upper A - Strength' }, ['CHEST', 'BACK', 'SHOULDERS'], availableEquipment, fitnessLevel, 0, g, locale),
      buildSession('Lower A - Quadriceps', ['QUADS', 'HAMSTRINGS', 'GLUTES'], availableEquipment, fitnessLevel, 0, g, locale),
      buildSession({ fr: 'Upper B - Hypertrophie', en: 'Upper B - Hypertrophy' }, ['CHEST', 'BACK', 'BICEPS', 'TRICEPS'], availableEquipment, fitnessLevel, 1, g, locale),
      buildSession({ fr: 'Lower B - Fessiers', en: 'Lower B - Glutes' }, ['QUADS', 'GLUTES', 'CALVES', 'CORE'], availableEquipment, fitnessLevel, 1, g, locale),
      buildSession({ fr: 'Corps complet - Puissance', en: 'Full Body - Power' }, ['CHEST', 'BACK', 'QUADS', 'SHOULDERS'], availableEquipment, fitnessLevel, 2, g, locale),
      buildSession({ fr: 'Accessoires', en: 'Accessories' }, ['BICEPS', 'TRICEPS', 'CORE', 'CALVES'], availableEquipment, fitnessLevel, 0, g, locale),
    ].slice(0, trainingDaysPerWeek)
  }

  const goalLabels = {
    fr: {
      MUSCLE_GAIN: 'Prise de masse',
      WEIGHT_LOSS: 'Perte de poids',
      ENDURANCE: 'Endurance',
      FLEXIBILITY: 'Souplesse',
      MAINTENANCE: 'Maintien',
      GENERAL_FITNESS: 'Forme generale',
    },
    en: {
      MUSCLE_GAIN: 'Muscle gain',
      WEIGHT_LOSS: 'Weight loss',
      ENDURANCE: 'Endurance',
      FLEXIBILITY: 'Flexibility',
      MAINTENANCE: 'Maintenance',
      GENERAL_FITNESS: 'General fitness',
    },
  } as const
  const goalLabel = goalLabels[locale][g as keyof typeof goalLabels.fr] ?? goalLabels[locale].GENERAL_FITNESS

  return {
    id:           'local-program',
    name:         `${locale === 'fr' ? 'Programme' : 'Program'} ${fitnessLevel} - ${goalLabel}`,
    fitnessGoal:  fitnessGoal as never,
    fitnessLevel: fitnessLevel as never,
    weeksTotal:   8,
    currentWeek:  1,
    isActive:     true,
    sessions,
  }
}
