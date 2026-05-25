import { describe, it, expect } from 'vitest'
import { calculateNextWeight, getProgressionMessage } from '@/lib/training/progressive-overload'

const baseExercise = {
  id:          'ex-bench-press',
  name:        'Développé couché',
  instructions: [],
  muscleGroups: ['CHEST' as const],
  equipment:   ['BARBELL' as const],
  imageUrl:    undefined,
  isCompound:  true,
  order:       0,
  sets:        4,
  reps:        10,
  weightKg:    60,
  restSeconds: 120,
  isCompleted: true,
}

describe('calculateNextWeight — exercice compound', () => {
  it('augmente de 2.5 kg si tous les sets complétés', () => {
    const result = calculateNextWeight(baseExercise, true)
    expect(result.nextWeightKg).toBe(62.5)
  })

  it('maintient le poids si les sets ne sont pas tous complétés', () => {
    const result = calculateNextWeight(baseExercise, false)
    expect(result.nextWeightKg).toBe(60)
  })

  it('retourne progression = true si augmentation', () => {
    const result = calculateNextWeight(baseExercise, true)
    expect(result.progressed).toBe(true)
  })

  it('retourne progression = false si maintien', () => {
    const result = calculateNextWeight(baseExercise, false)
    expect(result.progressed).toBe(false)
  })

  it('arrondit à 0.25 kg près', () => {
    const ex = { ...baseExercise, weightKg: 61.75 }
    const result = calculateNextWeight(ex, true)
    const decimals = ((result.nextWeightKg! * 100) % 25)
    expect(decimals).toBe(0)
  })
})

describe('calculateNextWeight — exercice isolation', () => {
  it('augmente de 1.25 kg si tous les sets complétés', () => {
    const isolation = { ...baseExercise, isCompound: false, weightKg: 20 }
    const result    = calculateNextWeight(isolation, true)
    expect(result.nextWeightKg).toBe(21.25)
  })
})

describe('calculateNextWeight — sans poids (bodyweight)', () => {
  it('retourne null si weightKg est null', () => {
    const bw = { ...baseExercise, weightKg: null }
    const result = calculateNextWeight(bw, true)
    expect(result.nextWeightKg).toBeNull()
  })
})

describe('getProgressionMessage', () => {
  it('retourne un message pour progression', () => {
    const msg = getProgressionMessage(true, 60, 62.5)
    expect(msg).toContain('62.5')
  })

  it('retourne un message pour maintien', () => {
    const msg = getProgressionMessage(false, 60, 60)
    expect(typeof msg).toBe('string')
    expect(msg.length).toBeGreaterThan(0)
  })
})
