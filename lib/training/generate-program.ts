// Générateur de programme d'entraînement selon le profil utilisateur
// Génère un programme PPL (Push/Pull/Legs) ou Full Body selon les jours disponibles

import type { WorkoutProgram, WorkoutSession, SessionExercise } from '@/types'
import { EXERCISE_DATABASE } from './exercise-database'

interface ProgramParams {
  fitnessGoal:         string
  fitnessLevel:        string
  trainingDaysPerWeek: number
  availableEquipment:  string[]
}

function filterByEquipment(exercises: typeof EXERCISE_DATABASE, equipment: string[]) {
  if (equipment.length === 0) return exercises
  return exercises.filter((ex) => ex.equipment.some((eq) => equipment.includes(eq)))
}

/**
 * Builds a WorkoutSession.
 * @param offset — rotation offset so two sessions with the same muscle groups
 *                 pick different exercises (Push A vs Push B, etc.)
 */
function buildSession(
  name:         string,
  muscleGroups: string[],
  equipment:    string[],
  level:        string,
  offset  = 0,
  goal    = '',
): WorkoutSession {
  const available = filterByEquipment(EXERCISE_DATABASE, equipment)
    .filter(ex => ex.muscleGroups[0] !== 'CARDIO') // cardio handled separately

  const target = level === 'BEGINNER' ? 4 : level === 'INTERMEDIATE' ? 5 : 6
  const seen   = new Set<string>()
  const picked: typeof EXERCISE_DATABASE = []

  // Graine basée sur le nom de la session pour un ordre stable mais varié entre sessions
  const seed   = name.split('').reduce((acc, c) => acc + c.charCodeAt(0), offset * 97)
  const seededRand = (i: number) => Math.abs(Math.sin(seed + i)) // pseudo-random déterministe

  const shuffle = <T,>(arr: T[]): T[] => {
    const a = [...arr]
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(seededRand(i) * (i + 1));
      [a[i], a[j]] = [a[j], a[i]]
    }
    return a
  }

  // Pass 1 — primary muscle match, mélangé + offset pour varier entre sessions A/B
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

  // Pass 2 — fill remaining slots with secondary muscle matches
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

  // Paramètres selon le niveau et l'objectif
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
    id:              `local-${name.toLowerCase().replace(/[\s/—]+/g, '-').replace(/[^a-z0-9-]/g, '')}`,
    name,
    status:          'PLANNED',
    exercises,
    durationMinutes: exercises.length * 12 + 10,
  }
}

// IDs des exercices HIIT bodyweight (pas de machine)
const HIIT_EXERCISE_IDS = [
  'ex-burpee', 'ex-mountain-climber', 'ex-jump-rope',
  'ex-jump-squat', 'ex-box-jump', 'ex-hiit',
]

/** Builds a cardio session.
 *  - HIIT: exercices bodyweight avec durée courte (30–45s work / 15s rest)
 *  - Steady-state: tapis, vélo, rameur avec durée longue
 */
function buildCardioSession(
  name:      string,
  exerciseIds: string[],
  isHIIT = false,
): WorkoutSession {
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
    id:              `local-${name.toLowerCase().replace(/[\s/—]+/g, '-').replace(/[^a-z0-9-]/g, '')}`,
    name,
    status:          'PLANNED',
    exercises:       sessionExercises,
    durationMinutes: dur + 5,
  }
}

/** Generates a full-week WorkoutProgram (Full Body, PPL, or Upper/Lower) based on fitness goal, level, and available training days. */
export function generateProgram(params: ProgramParams): WorkoutProgram {
  const { fitnessGoal, fitnessLevel, trainingDaysPerWeek, availableEquipment } = params
  const g = fitnessGoal

  let sessions: WorkoutSession[] = []

  if (trainingDaysPerWeek <= 3) {
    // ── Full Body 3j ────────────────────────────────────────────
    sessions = [
      buildSession('Full Body A', ['CHEST', 'BACK', 'QUADS'],              availableEquipment, fitnessLevel, 0, g),
      buildSession('Full Body B', ['SHOULDERS', 'HAMSTRINGS', 'BICEPS', 'TRICEPS'], availableEquipment, fitnessLevel, 1, g),
      buildSession('Full Body C', ['CHEST', 'BACK', 'GLUTES', 'CORE'],     availableEquipment, fitnessLevel, 2, g),
    ].slice(0, trainingDaysPerWeek)

  } else if (trainingDaysPerWeek <= 5) {
    // ── PPL — Push / Pull / Legs ────────────────────────────────
    if (g === 'WEIGHT_LOSS') {
      // Perte de poids : PPL allégé + cardio intégré
      sessions = [
        buildSession('Push — Pectoraux / Épaules / Triceps', ['CHEST', 'SHOULDERS', 'TRICEPS'], availableEquipment, fitnessLevel, 0, g),
        buildCardioSession('HIIT — Circuit Cardio', HIIT_EXERCISE_IDS, true),
        buildSession('Pull — Dos / Biceps', ['BACK', 'BICEPS'], availableEquipment, fitnessLevel, 0, g),
        buildCardioSession('Cardio — Marche inclinée / Tapis', ['ex-incline-walk', 'ex-treadmill-12-3-30', 'ex-cycling'], false),
        buildSession('Legs — Jambes / Fessiers', ['QUADS', 'HAMSTRINGS', 'GLUTES'], availableEquipment, fitnessLevel, 0, g),
      ].slice(0, trainingDaysPerWeek)
    } else {
      sessions = [
        // offset 0 → barbell/compound en premier
        buildSession('Push A — Pectoraux / Épaules / Triceps', ['CHEST', 'SHOULDERS', 'TRICEPS'], availableEquipment, fitnessLevel, 0, g),
        buildSession('Pull A — Dos / Biceps',                  ['BACK', 'BICEPS'],                availableEquipment, fitnessLevel, 0, g),
        buildSession('Legs A — Jambes / Fessiers',             ['QUADS', 'HAMSTRINGS', 'GLUTES'], availableEquipment, fitnessLevel, 0, g),
        // offset 1 → haltères/variantes
        buildSession('Push B — Épaules / Triceps / Chest', ['CHEST', 'SHOULDERS', 'TRICEPS'], availableEquipment, fitnessLevel, 1, g),
        buildSession('Pull B — Biceps / Dos / Core',       ['BACK', 'BICEPS', 'CORE'],        availableEquipment, fitnessLevel, 1, g),
      ].slice(0, trainingDaysPerWeek)
    }

  } else {
    // ── Upper / Lower 6-7j ──────────────────────────────────────
    sessions = [
      buildSession('Upper A — Force',        ['CHEST', 'BACK', 'SHOULDERS'],           availableEquipment, fitnessLevel, 0, g),
      buildSession('Lower A — Quadriceps',   ['QUADS', 'HAMSTRINGS', 'GLUTES'],         availableEquipment, fitnessLevel, 0, g),
      buildSession('Upper B — Hypertrophie', ['CHEST', 'BACK', 'BICEPS', 'TRICEPS'],   availableEquipment, fitnessLevel, 1, g),
      buildSession('Lower B — Fessiers',     ['QUADS', 'GLUTES', 'CALVES', 'CORE'],     availableEquipment, fitnessLevel, 1, g),
      buildSession('Full Body — Puissance',  ['CHEST', 'BACK', 'QUADS', 'SHOULDERS'],   availableEquipment, fitnessLevel, 2, g),
      buildSession('Accessoires',            ['BICEPS', 'TRICEPS', 'CORE', 'CALVES'],   availableEquipment, fitnessLevel, 0, g),
    ].slice(0, trainingDaysPerWeek)
  }

  const goalLabel = g === 'MUSCLE_GAIN'     ? 'Prise de masse'
                  : g === 'WEIGHT_LOSS'     ? 'Perte de poids'
                  : g === 'ENDURANCE'       ? 'Endurance'
                  : g === 'FLEXIBILITY'     ? 'Souplesse'
                  : g === 'MAINTENANCE'     ? 'Maintien'
                  : 'Fitness général'

  return {
    id:           'local-program',
    name:         `Programme ${fitnessLevel} — ${goalLabel}`,
    fitnessGoal:  fitnessGoal as never,
    fitnessLevel: fitnessLevel as never,
    weeksTotal:   8,
    currentWeek:  1,
    isActive:     true,
    sessions,
  }
}
