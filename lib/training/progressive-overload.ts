// Logique de surcharge progressive — calcule la charge de la semaine suivante
// Règle : si toutes les séries sont complétées → +2.5 kg (compound) ou +1.25 kg (isolation)

interface ExerciseForOverload {
  weightKg:    number | null
  reps?:       number
  isCompound:  boolean
}

export interface OverloadResult {
  nextWeightKg: number | null
  progressed:   boolean
}

export function calculateNextWeight(
  exercise:        ExerciseForOverload,
  allSetsCompleted: boolean,
): OverloadResult {
  const { weightKg, isCompound } = exercise

  if (weightKg === null || weightKg === undefined) {
    return { nextWeightKg: null, progressed: false }
  }

  if (!allSetsCompleted) {
    return { nextWeightKg: weightKg, progressed: false }
  }

  const increment   = isCompound ? 2.5 : 1.25
  const nextWeight  = Math.round((weightKg + increment) * 4) / 4 // arrondi au 0.25 kg
  return { nextWeightKg: nextWeight, progressed: true }
}

export function getProgressionMessage(
  progressed:    boolean,
  previousWeight: number,
  nextWeight:    number,
): string {
  if (!progressed) {
    return `Maintien à ${previousWeight} kg — continue comme ça !`
  }
  const delta = Math.round((nextWeight - previousWeight) * 100) / 100
  return `Progression : ${previousWeight} kg → ${nextWeight} kg (+${delta} kg)`
}
