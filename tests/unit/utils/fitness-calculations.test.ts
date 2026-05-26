import { describe, it, expect } from 'vitest'
import {
  calculateBMI,
  getBMICategory,
  calculateBMR,
  calculateTDEE,
  calculateRecommendedCalories,
  calculateMacros,
  calculateFitnessProfile,
} from '@/utils/fitness-calculations'

describe('calculateBMI', () => {
  it('calcule le BMI correctement', () => {
    const bmi = calculateBMI(70, 175)
    expect(bmi).toBe(23)
  })

  it('retourne une erreur claire si la taille est hors limites', () => {
    expect(() => calculateBMI(70, 0)).toThrow(/Taille hors limites/)
  })

  it('arrondit à l’entier le plus proche', () => {
    const bmi = calculateBMI(80, 180)
    expect(Number.isInteger(bmi)).toBe(true)
  })
})

describe('getBMICategory', () => {
  it('identifie la sous-nutrition (BMI < 18.5)', () => {
    const cat = getBMICategory(16)
    expect(cat.label).toMatch(/Insuffisance|sous/i)
    expect(cat.color).toBeTruthy()
  })

  it('identifie le poids normal (18.5 <= BMI < 25)', () => {
    const cat = getBMICategory(22)
    expect(cat.label).toMatch(/normal/i)
    expect(cat.color).toBeTruthy()
  })

  it('identifie le surpoids (25 <= BMI < 30)', () => {
    const cat = getBMICategory(27)
    expect(cat.label).toMatch(/surpoids/i)
    expect(cat.color).toBeTruthy()
  })

  it('identifie l\'obésité (BMI >= 30)', () => {
    const cat = getBMICategory(32)
    expect(cat.label).toMatch(/obés/i)
    expect(cat.color).toBeTruthy()
  })

  it('retourne toujours un range', () => {
    expect(getBMICategory(22).range).toBeTruthy()
    expect(getBMICategory(27).range).toBeTruthy()
  })
})

describe('calculateBMR', () => {
  it('formule Mifflin-St Jeor homme', () => {
    // Homme 30 ans, 80kg, 180cm → (10×80) + (6.25×180) - (5×30) + 5 = 1780
    const bmr = calculateBMR(80, 180, 30, 'MALE')
    expect(bmr).toBeCloseTo(1780, 0)
  })

  it('formule Mifflin-St Jeor femme', () => {
    // Femme 28 ans, 62kg, 167cm → (10×62) + (6.25×167) - (5×28) - 161 ≈ 1363
    const bmr = calculateBMR(62, 167, 28, 'FEMALE')
    expect(bmr).toBeCloseTo(1363, 0)
  })

  it('retourne un entier positif', () => {
    const bmr = calculateBMR(70, 175, 25, 'MALE')
    expect(bmr).toBeGreaterThan(0)
    expect(Number.isInteger(bmr)).toBe(true)
  })
})

describe('calculateTDEE', () => {
  const bmr = 1800

  it('SEDENTARY × 1.2', () => {
    expect(calculateTDEE(bmr, 'SEDENTARY')).toBeCloseTo(bmr * 1.2, 0)
  })

  it('LIGHTLY_ACTIVE × 1.375', () => {
    expect(calculateTDEE(bmr, 'LIGHTLY_ACTIVE')).toBeCloseTo(bmr * 1.375, 0)
  })

  it('MODERATELY_ACTIVE × 1.55', () => {
    expect(calculateTDEE(bmr, 'MODERATELY_ACTIVE')).toBeCloseTo(bmr * 1.55, 0)
  })

  it('VERY_ACTIVE × 1.725', () => {
    expect(calculateTDEE(bmr, 'VERY_ACTIVE')).toBeCloseTo(bmr * 1.725, 0)
  })

  it('EXTREMELY_ACTIVE × 1.9', () => {
    expect(calculateTDEE(bmr, 'EXTREMELY_ACTIVE')).toBeCloseTo(bmr * 1.9, 0)
  })
})

describe('calculateRecommendedCalories', () => {
  const tdee = 2000

  it('WEIGHT_LOSS : déficit de 500 kcal', () => {
    expect(calculateRecommendedCalories(tdee, 'WEIGHT_LOSS')).toBe(tdee - 500)
  })

  it('MUSCLE_GAIN : surplus de 300 kcal', () => {
    expect(calculateRecommendedCalories(tdee, 'MUSCLE_GAIN')).toBe(tdee + 300)
  })

  it('MAINTENANCE : maintien exact', () => {
    expect(calculateRecommendedCalories(tdee, 'MAINTENANCE')).toBe(tdee)
  })

  it('GENERAL_FITNESS : maintien exact', () => {
    expect(calculateRecommendedCalories(tdee, 'GENERAL_FITNESS')).toBe(tdee)
  })

  it('ne descend pas en dessous de 1200 kcal', () => {
    const veryLow = calculateRecommendedCalories(1500, 'WEIGHT_LOSS')
    expect(veryLow).toBeGreaterThanOrEqual(1200)
  })
})

describe('calculateMacros', () => {
  it('MUSCLE_GAIN : toutes les macros positives', () => {
    const { proteinG, carbsG, fatG } = calculateMacros(2300, 'MUSCLE_GAIN')
    expect(proteinG).toBeGreaterThan(0)
    expect(carbsG).toBeGreaterThan(0)
    expect(fatG).toBeGreaterThan(0)
    const totalKcal = proteinG * 4 + carbsG * 4 + fatG * 9
    expect(totalKcal).toBeCloseTo(2300, -1)
  })

  it('WEIGHT_LOSS : total kcal cohérent', () => {
    const { proteinG, carbsG, fatG } = calculateMacros(1500, 'WEIGHT_LOSS')
    const total = proteinG * 4 + carbsG * 4 + fatG * 9
    expect(total).toBeCloseTo(1500, -1)
  })

  it('valeurs positives pour tous les objectifs', () => {
    const goals = ['WEIGHT_LOSS', 'MUSCLE_GAIN', 'MAINTENANCE', 'ENDURANCE', 'FLEXIBILITY', 'GENERAL_FITNESS'] as const
    for (const goal of goals) {
      const { proteinG, carbsG, fatG } = calculateMacros(2000, goal)
      expect(proteinG).toBeGreaterThan(0)
      expect(carbsG).toBeGreaterThan(0)
      expect(fatG).toBeGreaterThan(0)
    }
  })
})

describe('calculateFitnessProfile', () => {
  const input = { weightKg: 70, heightCm: 175, age: 30, gender: 'MALE' as const, activityLevel: 'MODERATELY_ACTIVE' as const, fitnessGoal: 'MAINTENANCE' as const }

  it('retourne tous les champs attendus', () => {
    const result = calculateFitnessProfile(input)
    expect(result).toHaveProperty('bmi')
    expect(result).toHaveProperty('bmiCategory')
    expect(result).toHaveProperty('bmr')
    expect(result).toHaveProperty('tdee')
    expect(result).toHaveProperty('recommendedCalories')
    expect(result).toHaveProperty('proteinG')
    expect(result).toHaveProperty('carbsG')
    expect(result).toHaveProperty('fatG')
  })

  it('BMI cohérent avec le poids et la taille', () => {
    const result = calculateFitnessProfile(input)
    expect(result.bmi).toBe(23)
  })

  it('TDEE > BMR toujours', () => {
    const result = calculateFitnessProfile(input)
    expect(result.tdee).toBeGreaterThan(result.bmr)
  })
})
