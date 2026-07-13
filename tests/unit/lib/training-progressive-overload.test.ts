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

describe('calculateNextWeight — compound exercise', () => {
  it('increases by 2.5 kg when all sets are completed', () => {
    const result = calculateNextWeight(baseExercise, true)
    expect(result.nextWeightKg).toBe(62.5)
  })

  it('keeps weight when all sets are not completed', () => {
    const result = calculateNextWeight(baseExercise, false)
    expect(result.nextWeightKg).toBe(60)
  })

  it('returns progressed=true when weight increases', () => {
    const result = calculateNextWeight(baseExercise, true)
    expect(result.progressed).toBe(true)
  })

  it('returns progressed=false when weight is maintained', () => {
    const result = calculateNextWeight(baseExercise, false)
    expect(result.progressed).toBe(false)
  })

  it('rounds to the nearest 0.25 kg', () => {
    const ex = { ...baseExercise, weightKg: 61.75 }
    const result = calculateNextWeight(ex, true)
    const decimals = ((result.nextWeightKg! * 100) % 25)
    expect(decimals).toBe(0)
  })
})

describe('calculateNextWeight — isolation exercise', () => {
  it('increases by 1.25 kg when all sets are completed', () => {
    const isolation = { ...baseExercise, isCompound: false, weightKg: 20 }
    const result    = calculateNextWeight(isolation, true)
    expect(result.nextWeightKg).toBe(21.25)
  })
})

describe('calculateNextWeight — bodyweight exercise', () => {
  it('returns null when weightKg is null', () => {
    const bw = { ...baseExercise, weightKg: null }
    const result = calculateNextWeight(bw, true)
    expect(result.nextWeightKg).toBeNull()
  })
})

describe('getProgressionMessage', () => {
  it('returns a progression message', () => {
    const msg = getProgressionMessage(true, 60, 62.5)
    expect(msg).toContain('62.5')
  })

  it('returns a maintenance message', () => {
    const msg = getProgressionMessage(false, 60, 60)
    expect(typeof msg).toBe('string')
    expect(msg.length).toBeGreaterThan(0)
  })
})
