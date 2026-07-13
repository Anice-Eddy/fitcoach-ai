// Progressive overload rules for calculating the next session's load.
// Rule: if all sets are completed, increase by 2.5 kg for compound lifts or 1.25 kg for isolation work.

interface ExerciseForOverload {
  weightKg:    number | null
  reps?:       number
  isCompound:  boolean
}

export interface OverloadResult {
  nextWeightKg: number | null
  progressed:   boolean
}

/** Calculates the next session's weight for an exercise; increments by 2.5 kg (compound) or 1.25 kg (isolation) only when all sets were completed. */
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
  const nextWeight  = Math.round((weightKg + increment) * 4) / 4 // Round to the nearest 0.25 kg.
  return { nextWeightKg: nextWeight, progressed: true }
}

/** Returns a human-readable string describing whether the load increased or was maintained this session. */
export function getProgressionMessage(
  progressed:    boolean,
  previousWeight: number,
  nextWeight:    number,
): string {
  if (!progressed) {
    return `Hold at ${previousWeight} kg — keep going.`
  }
  const delta = Math.round((nextWeight - previousWeight) * 100) / 100
  return `Progression : ${previousWeight} kg → ${nextWeight} kg (+${delta} kg)`
}
