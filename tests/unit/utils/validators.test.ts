import { describe, it, expect } from 'vitest'
import {
  identitySchema,
  measurementsSchema,
  activitySchema,
  goalsSchema,
  dietSchema,
  bodyMetricSchema,
  affiliateClickSchema,
} from '@/utils/validators'

describe('identitySchema', () => {
  const valid = { firstName: 'Alice', age: 28, gender: 'FEMALE' }

  it('validates a correct object', () => {
    expect(() => identitySchema.parse(valid)).not.toThrow()
  })

  it('rejects an empty first name', () => {
    expect(() => identitySchema.parse({ ...valid, firstName: '' })).toThrow()
  })

  it('rejects age below 10', () => {
    expect(() => identitySchema.parse({ ...valid, age: 9 })).toThrow()
  })

  it('rejects age above 100', () => {
    expect(() => identitySchema.parse({ ...valid, age: 101 })).toThrow()
  })

  it('rejects an invalid gender', () => {
    expect(() => identitySchema.parse({ ...valid, gender: 'UNKNOWN' })).toThrow()
  })
})

describe('measurementsSchema', () => {
  const valid = { weightKg: 70, heightCm: 175, weightUnit: 'KG', heightUnit: 'CM' }

  it('validates correct measurements', () => {
    expect(() => measurementsSchema.parse(valid)).not.toThrow()
  })

  it('rejects negative weight', () => {
    expect(() => measurementsSchema.parse({ ...valid, weightKg: -1 })).toThrow()
  })

  it('rejects zero height', () => {
    expect(() => measurementsSchema.parse({ ...valid, heightCm: 0 })).toThrow()
  })

  it('accepts optional waist and hip fields', () => {
    expect(() => measurementsSchema.parse({ ...valid, waistCm: 80, hipsCm: 95 })).not.toThrow()
  })
})

describe('activitySchema', () => {
  const valid = {
    activityLevel: 'MODERATELY_ACTIVE',
    availableEquipment: ['BARBELL', 'DUMBBELL'],
    trainingDaysPerWeek: 4,
  }

  it('validates a correct object', () => {
    expect(() => activitySchema.parse(valid)).not.toThrow()
  })

  it('rejects trainingDaysPerWeek below 1', () => {
    expect(() => activitySchema.parse({ ...valid, trainingDaysPerWeek: 0 })).toThrow()
  })

  it('rejects trainingDaysPerWeek above 7', () => {
    expect(() => activitySchema.parse({ ...valid, trainingDaysPerWeek: 8 })).toThrow()
  })

  it('rejects an empty equipment list', () => {
    expect(() => activitySchema.parse({ ...valid, availableEquipment: [] })).toThrow()
  })
})

describe('goalsSchema', () => {
  const valid = { fitnessGoal: 'MUSCLE_GAIN', fitnessLevel: 'INTERMEDIATE' }

  it('validates a correct goal', () => {
    expect(() => goalsSchema.parse(valid)).not.toThrow()
  })

  it('rejects an unknown goal', () => {
    expect(() => goalsSchema.parse({ ...valid, fitnessGoal: 'FLY_TO_THE_MOON' })).toThrow()
  })

  it('rejects an unknown level', () => {
    expect(() => goalsSchema.parse({ ...valid, fitnessLevel: 'SUPERHERO' })).toThrow()
  })

  it('accepts an optional target weight', () => {
    expect(() => goalsSchema.parse({ ...valid, targetWeightKg: 68 })).not.toThrow()
  })
})

describe('dietSchema', () => {
  it('validates empty preferences', () => {
    expect(() => dietSchema.parse({ dietaryRestrictions: [], foodPreferences: [] })).not.toThrow()
  })

  it('validates non-empty restrictions', () => {
    expect(() => dietSchema.parse({ dietaryRestrictions: ['VEGETARIAN'], foodPreferences: ['HIGH_PROTEIN'] })).not.toThrow()
  })
})

describe('bodyMetricSchema', () => {
  it('validates a correct metric', () => {
    expect(() => bodyMetricSchema.parse({ weightKg: 70.5, date: '2025-01-01' })).not.toThrow()
  })

  it('rejects negative weight', () => {
    expect(() => bodyMetricSchema.parse({ weightKg: -1, date: '2025-01-01' })).toThrow()
  })

  it('accepts optional fields', () => {
    expect(() => bodyMetricSchema.parse({ weightKg: 70, date: '2025-01-01', bodyFatPct: 15, muscleMassKg: 40 })).not.toThrow()
  })
})

describe('affiliateClickSchema', () => {
  it('validates a correct affiliate click', () => {
    expect(() => affiliateClickSchema.parse({ productId: 'aff-whey-optimum' })).not.toThrow()
  })

  it('rejects an empty productId', () => {
    expect(() => affiliateClickSchema.parse({ productId: '' })).toThrow()
  })
})
