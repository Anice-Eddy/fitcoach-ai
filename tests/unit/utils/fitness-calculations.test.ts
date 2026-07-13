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
  it('calculates BMI correctly', () => {
    const bmi = calculateBMI(70, 175)
    expect(bmi).toBe(23)
  })

  it('returns a clear error when height is out of bounds', () => {
    expect(() => calculateBMI(70, 0)).toThrow(/Taille hors limites/)
  })

  it('rounds to the nearest integer', () => {
    const bmi = calculateBMI(80, 180)
    expect(Number.isInteger(bmi)).toBe(true)
  })
})

describe('getBMICategory', () => {
  it('identifies underweight BMI below 18.5', () => {
    const cat = getBMICategory(16)
    expect(cat.label).toBe('Underweight')
    expect(cat.color).toBeTruthy()
  })

  it('identifies normal weight BMI between 18.5 and 25', () => {
    const cat = getBMICategory(22)
    expect(cat.label).toBe('Normal weight')
    expect(cat.color).toBeTruthy()
  })

  it('identifies overweight BMI between 25 and 30', () => {
    const cat = getBMICategory(27)
    expect(cat.label).toBe('Overweight')
    expect(cat.color).toBeTruthy()
  })

  it('identifies obesity BMI at 30 or above', () => {
    const cat = getBMICategory(32)
    expect(cat.label).toBe('Obesity')
    expect(cat.color).toBeTruthy()
  })

  it('returns French labels when requested', () => {
    expect(getBMICategory(22, 'fr').label).toBe('Poids normal')
    expect(getBMICategory(32, 'fr').label).toBe('Obésité')
  })

  it('always returns a range', () => {
    expect(getBMICategory(22).range).toBeTruthy()
    expect(getBMICategory(27).range).toBeTruthy()
  })
})

describe('calculateBMR', () => {
  it('uses the male Mifflin-St Jeor formula', () => {
    // Male, 30 years old, 80 kg, 180 cm -> (10x80) + (6.25x180) - (5x30) + 5 = 1780.
    const bmr = calculateBMR(80, 180, 30, 'MALE')
    expect(bmr).toBeCloseTo(1780, 0)
  })

  it('uses the female Mifflin-St Jeor formula', () => {
    // Female, 28 years old, 62 kg, 167 cm -> (10x62) + (6.25x167) - (5x28) - 161 ~= 1363.
    const bmr = calculateBMR(62, 167, 28, 'FEMALE')
    expect(bmr).toBeCloseTo(1363, 0)
  })

  it('returns a positive integer', () => {
    const bmr = calculateBMR(70, 175, 25, 'MALE')
    expect(bmr).toBeGreaterThan(0)
    expect(Number.isInteger(bmr)).toBe(true)
  })
})

describe('calculateTDEE', () => {
  const bmr = 1800

  it('SEDENTARY x 1.2', () => {
    expect(calculateTDEE(bmr, 'SEDENTARY')).toBeCloseTo(bmr * 1.2, 0)
  })

  it('LIGHTLY_ACTIVE x 1.375', () => {
    expect(calculateTDEE(bmr, 'LIGHTLY_ACTIVE')).toBeCloseTo(bmr * 1.375, 0)
  })

  it('MODERATELY_ACTIVE x 1.55', () => {
    expect(calculateTDEE(bmr, 'MODERATELY_ACTIVE')).toBeCloseTo(bmr * 1.55, 0)
  })

  it('VERY_ACTIVE x 1.725', () => {
    expect(calculateTDEE(bmr, 'VERY_ACTIVE')).toBeCloseTo(bmr * 1.725, 0)
  })

  it('EXTREMELY_ACTIVE x 1.9', () => {
    expect(calculateTDEE(bmr, 'EXTREMELY_ACTIVE')).toBeCloseTo(bmr * 1.9, 0)
  })
})

describe('calculateRecommendedCalories', () => {
  const tdee = 2000

  it('applies a 500 kcal deficit for WEIGHT_LOSS', () => {
    expect(calculateRecommendedCalories(tdee, 'WEIGHT_LOSS')).toBe(tdee - 500)
  })

  it('applies a 300 kcal surplus for MUSCLE_GAIN', () => {
    expect(calculateRecommendedCalories(tdee, 'MUSCLE_GAIN')).toBe(tdee + 300)
  })

  it('keeps exact maintenance calories for MAINTENANCE', () => {
    expect(calculateRecommendedCalories(tdee, 'MAINTENANCE')).toBe(tdee)
  })

  it('keeps exact maintenance calories for GENERAL_FITNESS', () => {
    expect(calculateRecommendedCalories(tdee, 'GENERAL_FITNESS')).toBe(tdee)
  })

  it('does not go below 1200 kcal', () => {
    const veryLow = calculateRecommendedCalories(1500, 'WEIGHT_LOSS')
    expect(veryLow).toBeGreaterThanOrEqual(1200)
  })
})

describe('calculateMacros', () => {
  it('returns positive macros for MUSCLE_GAIN', () => {
    const { proteinG, carbsG, fatG } = calculateMacros(2300, 'MUSCLE_GAIN')
    expect(proteinG).toBeGreaterThan(0)
    expect(carbsG).toBeGreaterThan(0)
    expect(fatG).toBeGreaterThan(0)
    const totalKcal = proteinG * 4 + carbsG * 4 + fatG * 9
    expect(totalKcal).toBeCloseTo(2300, -1)
  })

  it('returns a coherent kcal total for WEIGHT_LOSS', () => {
    const { proteinG, carbsG, fatG } = calculateMacros(1500, 'WEIGHT_LOSS')
    const total = proteinG * 4 + carbsG * 4 + fatG * 9
    expect(total).toBeCloseTo(1500, -1)
  })

  it('returns positive values for all goals', () => {
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

  it('returns all expected fields', () => {
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

  it('keeps BMI coherent with weight and height', () => {
    const result = calculateFitnessProfile(input)
    expect(result.bmi).toBe(23)
  })

  it('keeps TDEE above BMR', () => {
    const result = calculateFitnessProfile(input)
    expect(result.tdee).toBeGreaterThan(result.bmr)
  })
})
