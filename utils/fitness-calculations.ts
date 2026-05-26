// Calculs fitness validés : IMC OMS, BMR Mifflin-St Jeor (1990),
// TDEE avec multiplicateurs Harris-Benedict révisés, macros par objectif.

import type { ActivityLevel, FitnessGoal, Gender } from '@prisma/client'
import { z } from 'zod'

const anthropometricsSchema = z.object({
  weightKg: z.number().min(30, 'Poids hors limites : 30 à 300 kg').max(300, 'Poids hors limites : 30 à 300 kg'),
  heightCm: z.number().min(100, 'Taille hors limites : 100 à 250 cm').max(250, 'Taille hors limites : 100 à 250 cm'),
})

const bmrSchema = anthropometricsSchema.extend({
  age: z.number().int('Âge invalide : nombre entier requis').min(13, 'Âge hors limites : 13 à 100 ans').max(100, 'Âge hors limites : 13 à 100 ans'),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']),
})

const tdeeSchema = z.object({
  bmr: z.number().min(500, 'BMR hors limites').max(5000, 'BMR hors limites'),
  activityLevel: z.enum(['SEDENTARY', 'LIGHTLY_ACTIVE', 'MODERATELY_ACTIVE', 'VERY_ACTIVE', 'EXTREMELY_ACTIVE']),
})

const caloriesSchema = z.object({
  tdee: z.number().min(800, 'TDEE hors limites').max(8000, 'TDEE hors limites'),
  goal: z.enum(['WEIGHT_LOSS', 'MUSCLE_GAIN', 'MAINTENANCE', 'ENDURANCE', 'FLEXIBILITY', 'GENERAL_FITNESS']),
})

const macroSchema = caloriesSchema.extend({
  calories: z.number().min(800, 'Calories hors limites').max(8000, 'Calories hors limites'),
  weightKg: z.number().min(30, 'Poids hors limites : 30 à 300 kg').max(300, 'Poids hors limites : 30 à 300 kg'),
}).omit({ tdee: true })

const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  SEDENTARY: 1.2,
  LIGHTLY_ACTIVE: 1.375,
  MODERATELY_ACTIVE: 1.55,
  VERY_ACTIVE: 1.725,
  EXTREMELY_ACTIVE: 1.9,
}

export type BMICategory = {
  label: string
  color: string
  range: string
}

function assertValid<T>(schema: z.ZodSchema<T>, value: unknown): T {
  const parsed = schema.safeParse(value)
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? 'Valeur invalide'
    throw new Error(message)
  }
  return parsed.data
}

// IMC OMS : poids(kg) / taille(m)^2, arrondi à l'entier le plus proche.
export function calculateBMI(weightKg: number, heightCm: number): number {
  const value = assertValid(anthropometricsSchema, { weightKg, heightCm })
  const heightM = value.heightCm / 100
  return Math.round(value.weightKg / (heightM * heightM))
}

// Classification OMS : <18.5 insuffisance, 18.5-24.9 normal, 25-29.9 surpoids, >=30 obésité.
export function getBMICategory(bmi: number): BMICategory {
  if (bmi < 18.5) return { label: 'Insuffisance pondérale', color: '#60a5fa', range: '< 18.5' }
  if (bmi < 25) return { label: 'Poids normal', color: '#4ade80', range: '18.5 à 24.9' }
  if (bmi < 30) return { label: 'Surpoids', color: '#facc15', range: '25 à 29.9' }
  return { label: 'Obésité', color: '#f87171', range: '≥ 30' }
}

// Mifflin-St Jeor (1990), référence actuelle pour estimer le métabolisme de base.
export function calculateBMR(weightKg: number, heightCm: number, age: number, gender: Gender): number {
  const value = assertValid(bmrSchema, { weightKg, heightCm, age, gender })
  const base = 10 * value.weightKg + 6.25 * value.heightCm - 5 * value.age
  if (value.gender === 'MALE') return Math.round(base + 5)
  if (value.gender === 'FEMALE') return Math.round(base - 161)
  return Math.round(base - 78)
}

// TDEE : BMR multiplié par les facteurs d'activité Harris-Benedict révisés.
export function calculateTDEE(bmr: number, activityLevel: ActivityLevel): number {
  const value = assertValid(tdeeSchema, { bmr, activityLevel })
  return Math.round(value.bmr * ACTIVITY_MULTIPLIERS[value.activityLevel])
}

// Calories selon objectif : déficit/surplus modéré pour préserver adhérence et masse maigre.
export function calculateRecommendedCalories(tdee: number, goal: FitnessGoal): number {
  const value = assertValid(caloriesSchema, { tdee, goal })
  switch (value.goal) {
    case 'WEIGHT_LOSS':
      return Math.max(1200, Math.round(value.tdee - 500))
    case 'MUSCLE_GAIN':
      return Math.round(value.tdee + 300)
    case 'ENDURANCE':
      return Math.round(value.tdee + 200)
    case 'GENERAL_FITNESS':
    case 'MAINTENANCE':
    case 'FLEXIBILITY':
    default:
      return Math.round(value.tdee)
  }
}

// Macros : protéines en g/kg selon objectif, lipides/glucides répartis selon les recommandations sportives.
export function calculateMacros(
  calories: number,
  goal: FitnessGoal,
  weightKg = 70,
): { proteinG: number; carbsG: number; fatG: number } {
  const value = assertValid(macroSchema, { calories, goal, weightKg })
  let proteinG: number
  let fatG: number
  let carbsG: number

  if (value.goal === 'MUSCLE_GAIN') {
    proteinG = Math.round(value.weightKg * 2.1)
    fatG = Math.round((value.calories * 0.25) / 9)
    carbsG = Math.round((value.calories - proteinG * 4 - fatG * 9) / 4)
  } else if (value.goal === 'WEIGHT_LOSS') {
    proteinG = Math.round(value.weightKg * 2.3)
    fatG = Math.round((value.calories * 0.225) / 9)
    carbsG = Math.round((value.calories - proteinG * 4 - fatG * 9) / 4)
  } else if (value.goal === 'ENDURANCE') {
    proteinG = Math.round(value.weightKg * 1.7)
    carbsG = Math.round((value.calories * 0.575) / 4)
    fatG = Math.round((value.calories - proteinG * 4 - carbsG * 4) / 9)
  } else {
    proteinG = Math.round(value.weightKg * 2.2)
    fatG = Math.round((value.calories * 0.25) / 9)
    carbsG = Math.round((value.calories - proteinG * 4 - fatG * 9) / 4)
  }

  return {
    proteinG: Math.max(0, proteinG),
    carbsG: Math.max(0, carbsG),
    fatG: Math.max(0, fatG),
  }
}

export function calculateProgressiveOverload(params: {
  previousWeightKg: number
  previousReps: number
  completedAllSets: boolean
  preference?: 'weight' | 'reps'
}) {
  const schema = z.object({
    previousWeightKg: z.number().min(0, 'Charge invalide').max(500, 'Charge invalide'),
    previousReps: z.number().int().min(1, 'Répétitions invalides').max(100, 'Répétitions invalides'),
    completedAllSets: z.boolean(),
    preference: z.enum(['weight', 'reps']).optional(),
  })
  const value = assertValid(schema, params)
  if (!value.completedAllSets) return { weightKg: value.previousWeightKg, reps: value.previousReps }

  // Surcharge progressive : +2.5 à 5% de charge OU +1 à 2 reps, jamais les deux simultanément.
  if (value.preference === 'reps') {
    return { weightKg: value.previousWeightKg, reps: value.previousReps + 1 }
  }
  return { weightKg: Math.round(value.previousWeightKg * 1.025), reps: value.previousReps }
}

export type FitnessProfileResult = {
  bmi: number
  bmiCategory: BMICategory
  bmr: number
  tdee: number
  recommendedCalories: number
  proteinG: number
  carbsG: number
  fatG: number
}

export function calculateFitnessProfile(params: {
  weightKg: number
  heightCm: number
  age: number
  gender: Gender
  activityLevel: ActivityLevel
  fitnessGoal: FitnessGoal
}): FitnessProfileResult {
  const bmi = calculateBMI(params.weightKg, params.heightCm)
  const bmr = calculateBMR(params.weightKg, params.heightCm, params.age, params.gender)
  const tdee = calculateTDEE(bmr, params.activityLevel)
  const recommendedCalories = calculateRecommendedCalories(tdee, params.fitnessGoal)
  const macros = calculateMacros(recommendedCalories, params.fitnessGoal, params.weightKg)

  return {
    bmi,
    bmiCategory: getBMICategory(bmi),
    bmr,
    tdee,
    recommendedCalories,
    ...macros,
  }
}
