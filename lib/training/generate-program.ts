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

function filterByEquipment(exercises: typeof EXERCISE_DATABASE, equipment: string[]) {
  return exercises.filter((ex) => ex.equipment.some((eq) => equipment.includes(eq)))
}

function buildSession(
  name: string,
  muscleGroups: string[],
  equipment: string[],
  level: string,
): WorkoutSession {
  const available = filterByEquipment(EXERCISE_DATABASE, equipment)
  const exercises: SessionExercise[] = muscleGroups
    .flatMap((muscle) => available.filter((ex) => ex.muscleGroups.includes(muscle as never)))
    .slice(0, level === 'BEGINNER' ? 4 : level === 'INTERMEDIATE' ? 5 : 6)
    .map((ex, i) => ({
      ...ex,
      order:       i,
      sets:        level === 'BEGINNER' ? 3 : 4,
      reps:        12,
      weightKg:    null,
      restSeconds: 90,
      isCompleted: false,
    }))

  return {
    id:              `session-${name.toLowerCase().replace(/\s/g, '-')}-${Date.now()}`,
    name,
    status:          'PLANNED',
    exercises,
    durationMinutes: exercises.length * 10 + 10,
  }
}

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
    id:          `program-${Date.now()}`,
    name:        `Programme ${fitnessLevel} — ${fitnessGoal === 'MUSCLE_GAIN' ? 'Prise de masse' : fitnessGoal === 'WEIGHT_LOSS' ? 'Perte de poids' : 'Fitness général'}`,
    fitnessGoal: fitnessGoal as never,
    fitnessLevel: fitnessLevel as never,
    weeksTotal:  8,
    currentWeek: 1,
    isActive:    true,
    sessions,
  }
}
