// Générateur de programme d'entraînement selon le profil utilisateur
// Génère un programme PPL (Push/Pull/Legs) ou Full Body selon les jours disponibles

import type { WorkoutProgram, WorkoutSession, SessionExercise } from '@/types'
import { EXERCISE_DATABASE } from './exercise-database'

interface ProgramParams {
  fitnessGoal:        string
  fitnessLevel:       string
  trainingDaysPerWeek: number
  availableEquipment: string[]
}

// Filters exercises to those requiring at least one piece of equipment the user has available.
function filterByEquipment(exercises: typeof EXERCISE_DATABASE, equipment: string[]) {
  return exercises.filter((ex) => ex.equipment.some((eq) => equipment.includes(eq)))
}

// Selects exercises targeting the given muscle groups (primary first, then secondary) and builds a WorkoutSession.
function buildSession(
  name: string,
  muscleGroups: string[],
  equipment: string[],
  level: string,
): WorkoutSession {
  const available = filterByEquipment(EXERCISE_DATABASE, equipment)
  const target = level === 'BEGINNER' ? 4 : level === 'INTERMEDIATE' ? 5 : 6
  const seen = new Set<string>()
  const picked: typeof EXERCISE_DATABASE = []

  // Pass 1: primary muscle match only (first element of muscleGroups array)
  for (const muscle of muscleGroups) {
    const perGroup = Math.max(1, Math.round(target / muscleGroups.length))
    const matches = available.filter(
      (ex) => ex.muscleGroups[0] === muscle && !seen.has(ex.id),
    )
    for (const ex of matches.slice(0, perGroup)) {
      seen.add(ex.id)
      picked.push(ex)
    }
  }

  // Pass 2: fill remaining slots with secondary muscle matches
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

  const exercises: SessionExercise[] = picked.slice(0, target).map((ex, i) => ({
      ...ex,
      order:       i,
      sets:        level === 'BEGINNER' ? 3 : 4,
      reps:        12,
      weightKg:    null,
      restSeconds: 90,
      isCompleted: false,
    }))

  return {
    id:              `local-${name.toLowerCase().replace(/[\s/—]+/g, '-').replace(/[^a-z0-9-]/g, '')}`,
    name,
    status:          'PLANNED',
    exercises,
    durationMinutes: exercises.length * 10 + 10,
  }
}

/** Generates a full-week WorkoutProgram (Full Body, PPL, or Upper/Lower) based on fitness goal, level, and available training days. */
export function generateProgram(params: ProgramParams): WorkoutProgram {
  const { fitnessGoal, fitnessLevel, trainingDaysPerWeek, availableEquipment } = params

  let sessions: WorkoutSession[] = []

  if (trainingDaysPerWeek <= 3) {
    // Programme Full Body 3j
    sessions = [
      buildSession('Full Body A', ['CHEST', 'BACK', 'QUADS'], availableEquipment, fitnessLevel),
      buildSession('Full Body B', ['SHOULDERS', 'HAMSTRINGS', 'BICEPS', 'TRICEPS'], availableEquipment, fitnessLevel),
      buildSession('Full Body C', ['CHEST', 'BACK', 'GLUTES', 'CORE'], availableEquipment, fitnessLevel),
    ].slice(0, trainingDaysPerWeek)
  } else if (trainingDaysPerWeek <= 5) {
    // Programme PPL (Push / Pull / Legs)
    sessions = [
      buildSession('Push — Pectoraux / Épaules / Triceps', ['CHEST', 'SHOULDERS', 'TRICEPS'], availableEquipment, fitnessLevel),
      buildSession('Pull — Dos / Biceps',                  ['BACK', 'BICEPS'],                availableEquipment, fitnessLevel),
      buildSession('Legs — Jambes / Fessiers',             ['QUADS', 'HAMSTRINGS', 'GLUTES'], availableEquipment, fitnessLevel),
      buildSession('Push B — Force',                       ['CHEST', 'SHOULDERS', 'TRICEPS'], availableEquipment, fitnessLevel),
      buildSession('Pull B — Hypertrophie',                ['BACK', 'BICEPS', 'CORE'],        availableEquipment, fitnessLevel),
    ].slice(0, trainingDaysPerWeek)
  } else {
    // Upper / Lower 6-7j
    sessions = [
      buildSession('Upper A', ['CHEST', 'BACK', 'SHOULDERS'],    availableEquipment, fitnessLevel),
      buildSession('Lower A', ['QUADS', 'HAMSTRINGS', 'GLUTES'], availableEquipment, fitnessLevel),
      buildSession('Upper B', ['CHEST', 'BACK', 'BICEPS', 'TRICEPS'], availableEquipment, fitnessLevel),
      buildSession('Lower B', ['QUADS', 'GLUTES', 'CALVES', 'CORE'], availableEquipment, fitnessLevel),
      buildSession('Full Body', ['CHEST', 'BACK', 'QUADS', 'SHOULDERS'], availableEquipment, fitnessLevel),
      buildSession('Accessoires', ['BICEPS', 'TRICEPS', 'CORE', 'CALVES'], availableEquipment, fitnessLevel),
    ].slice(0, trainingDaysPerWeek)
  }

  return {
    id:          `local-program`,
    name:        `Programme ${fitnessLevel} — ${fitnessGoal === 'MUSCLE_GAIN' ? 'Prise de masse' : fitnessGoal === 'WEIGHT_LOSS' ? 'Perte de poids' : 'Fitness général'}`,
    fitnessGoal: fitnessGoal as never,
    fitnessLevel: fitnessLevel as never,
    weeksTotal:  8,
    currentWeek: 1,
    isActive:    true,
    sessions,
  }
}
