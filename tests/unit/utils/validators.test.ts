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

  it('valide un objet correct', () => {
    expect(() => identitySchema.parse(valid)).not.toThrow()
  })

  it('rejette un prénom vide', () => {
    expect(() => identitySchema.parse({ ...valid, firstName: '' })).toThrow()
  })

  it('rejette un âge < 10', () => {
    expect(() => identitySchema.parse({ ...valid, age: 9 })).toThrow()
  })

  it('rejette un âge > 100', () => {
    expect(() => identitySchema.parse({ ...valid, age: 101 })).toThrow()
  })

  it('rejette un genre invalide', () => {
    expect(() => identitySchema.parse({ ...valid, gender: 'UNKNOWN' })).toThrow()
  })
})

describe('measurementsSchema', () => {
  const valid = { weightKg: 70, heightCm: 175, weightUnit: 'KG', heightUnit: 'CM' }

  it('valide des mensurations correctes', () => {
    expect(() => measurementsSchema.parse(valid)).not.toThrow()
  })

  it('rejette un poids négatif', () => {
    expect(() => measurementsSchema.parse({ ...valid, weightKg: -1 })).toThrow()
  })

  it('rejette une taille de 0', () => {
    expect(() => measurementsSchema.parse({ ...valid, heightCm: 0 })).toThrow()
  })

  it('accepte les champs optionnels (tour de taille, hanches)', () => {
    expect(() => measurementsSchema.parse({ ...valid, waistCm: 80, hipsCm: 95 })).not.toThrow()
  })
})

describe('activitySchema', () => {
  const valid = {
    activityLevel: 'MODERATELY_ACTIVE',
    availableEquipment: ['BARBELL', 'DUMBBELL'],
    trainingDaysPerWeek: 4,
  }

  it('valide un objet correct', () => {
    expect(() => activitySchema.parse(valid)).not.toThrow()
  })

  it('rejette trainingDaysPerWeek < 1', () => {
    expect(() => activitySchema.parse({ ...valid, trainingDaysPerWeek: 0 })).toThrow()
  })

  it('rejette trainingDaysPerWeek > 7', () => {
    expect(() => activitySchema.parse({ ...valid, trainingDaysPerWeek: 8 })).toThrow()
  })

  it('rejette une liste d\'équipement vide (min 1)', () => {
    expect(() => activitySchema.parse({ ...valid, availableEquipment: [] })).toThrow()
  })
})

describe('goalsSchema', () => {
  const valid = { fitnessGoal: 'MUSCLE_GAIN', fitnessLevel: 'INTERMEDIATE' }

  it('valide un objectif correct', () => {
    expect(() => goalsSchema.parse(valid)).not.toThrow()
  })

  it('rejette un objectif inconnu', () => {
    expect(() => goalsSchema.parse({ ...valid, fitnessGoal: 'FLY_TO_THE_MOON' })).toThrow()
  })

  it('rejette un niveau inconnu', () => {
    expect(() => goalsSchema.parse({ ...valid, fitnessLevel: 'SUPERHERO' })).toThrow()
  })

  it('accepte un poids cible optionnel', () => {
    expect(() => goalsSchema.parse({ ...valid, targetWeightKg: 68 })).not.toThrow()
  })
})

describe('dietSchema', () => {
  it('valide des préférences vides', () => {
    expect(() => dietSchema.parse({ dietaryRestrictions: [], foodPreferences: [] })).not.toThrow()
  })

  it('valide des restrictions non vides', () => {
    expect(() => dietSchema.parse({ dietaryRestrictions: ['VEGETARIAN'], foodPreferences: ['HIGH_PROTEIN'] })).not.toThrow()
  })
})

describe('bodyMetricSchema', () => {
  it('valide une métrique correcte', () => {
    expect(() => bodyMetricSchema.parse({ weightKg: 70.5, date: '2025-01-01' })).not.toThrow()
  })

  it('rejette un poids négatif', () => {
    expect(() => bodyMetricSchema.parse({ weightKg: -1, date: '2025-01-01' })).toThrow()
  })

  it('accepte les champs optionnels', () => {
    expect(() => bodyMetricSchema.parse({ weightKg: 70, date: '2025-01-01', bodyFatPct: 15, muscleMassKg: 40 })).not.toThrow()
  })
})

describe('affiliateClickSchema', () => {
  it('valide un clic affilié correct', () => {
    expect(() => affiliateClickSchema.parse({ productId: 'aff-whey-optimum' })).not.toThrow()
  })

  it('rejette un productId vide', () => {
    expect(() => affiliateClickSchema.parse({ productId: '' })).toThrow()
  })
})
