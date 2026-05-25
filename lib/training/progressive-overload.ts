// Logique de surcharge progressive — calcule la charge de la semaine suivante
// Règle : si toutes les séries sont complétées → +2.5 kg (haltères) ou +5 kg (barre)

interface OverloadParams {
  previousWeightKg: number | null
  previousReps:     number
  targetReps:       number
  isCompound:       boolean
  allSetsCompleted: boolean
}

export function calculateNextWeight(params: OverloadParams): number | null {
  const { previousWeightKg, previousReps, targetReps, isCompound, allSetsCompleted } = params

  if (!previousWeightKg) return null
  if (!allSetsCompleted) return previousWeightKg

  // Augmentation si le nombre de reps cibles est atteint
  if (previousReps >= targetReps) {
    const increment = isCompound ? 2.5 : 1.25
    return Math.round((previousWeightKg + increment) * 4) / 4 // arrondi au 0.25 kg
  }

  return previousWeightKg
}

export function getProgressionMessage(
  currentWeight: number | null,
  previousWeight: number | null,
): string {
  if (!currentWeight || !previousWeight) return ''
  const delta = currentWeight - previousWeight
  if (delta > 0)  return `+${delta} kg cette semaine 💪`
  if (delta < 0)  return `${delta} kg — ajustement`
  return 'Même charge — continue comme ça !'
}
