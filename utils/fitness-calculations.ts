// ============================================================
// Calculs fitness : IMC, BMR, TDEE, calories, macros
// Formule BMR : Mifflin-St Jeor (référence scientifique actuelle)
// ============================================================

import type { ActivityLevel, FitnessGoal, Gender } from '@prisma/client'

// Multiplicateurs d'activité Mifflin-St Jeor
const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  SEDENTARY:         1.2,
  LIGHTLY_ACTIVE:    1.375,
  MODERATELY_ACTIVE: 1.55,
  VERY_ACTIVE:       1.725,
  EXTREMELY_ACTIVE:  1.9,
}

// Répartition macros selon objectif (protéines / glucides / lipides)
const MACRO_RATIOS: Record<FitnessGoal, { protein: number; carbs: number; fat: number }> = {
  WEIGHT_LOSS:     { protein: 0.35, carbs: 0.35, fat: 0.30 },
  MUSCLE_GAIN:     { protein: 0.30, carbs: 0.45, fat: 0.25 },
  ENDURANCE:       { protein: 0.20, carbs: 0.55, fat: 0.25 },
  MAINTENANCE:     { protein: 0.25, carbs: 0.45, fat: 0.30 },
  GENERAL_FITNESS: { protein: 0.25, carbs: 0.45, fat: 0.30 },
  FLEXIBILITY:     { protein: 0.25, carbs: 0.45, fat: 0.30 },
}

export type BMICategory = {
  label: string
  color: string      // couleur Tailwind / hex
  range: string
}

// Calcul de l'IMC
export function calculateBMI(weightKg: number, heightCm: number): number {
  if (heightCm === 0) return 0
  const heightM = heightCm / 100
  return Math.round((weightKg / (heightM * heightM)) * 10) / 10
}

// Interprétation IMC avec code couleur
export function getBMICategory(bmi: number): BMICategory {
  if (bmi < 18.5) return { label: 'Insuffisance pondérale', color: '#60a5fa', range: '< 18.5' }
  if (bmi < 25)   return { label: 'Poids normal',           color: '#4ade80', range: '18.5 – 24.9' }
  if (bmi < 30)   return { label: 'Surpoids',               color: '#facc15', range: '25 – 29.9' }
  if (bmi < 35)   return { label: 'Obésité modérée',        color: '#fb923c', range: '30 – 34.9' }
  return                  { label: 'Obésité sévère',         color: '#f87171', range: '≥ 35' }
}

// BMR via Mifflin-St Jeor
export function calculateBMR(
  weightKg: number,
  heightCm: number,
  age: number,
  gender: Gender,
): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age
  if (gender === 'MALE')   return Math.round(base + 5)
  if (gender === 'FEMALE') return Math.round(base - 161)
  // OTHER : moyenne des deux formules
  return Math.round(base - 78)
}

// TDEE (dépense énergétique totale journalière)
export function calculateTDEE(bmr: number, activityLevel: ActivityLevel): number {
  return Math.round(bmr * ACTIVITY_MULTIPLIERS[activityLevel])
}

// Calories recommandées selon objectif
// Perte de poids : déficit -500 kcal | Prise de masse : surplus +300 kcal
export function calculateRecommendedCalories(tdee: number, goal: FitnessGoal): number {
  switch (goal) {
    case 'WEIGHT_LOSS': return Math.max(1200, Math.round(tdee - 500))
    case 'MUSCLE_GAIN': return Math.round(tdee + 300)
    default:            return Math.round(tdee)
  }
}

// Macros recommandées en grammes (protéines=4kcal/g, glucides=4kcal/g, lipides=9kcal/g)
export function calculateMacros(
  calories: number,
  goal: FitnessGoal,
): { proteinG: number; carbsG: number; fatG: number } {
  const ratio = MACRO_RATIOS[goal]
  return {
    proteinG: Math.round((calories * ratio.protein) / 4),
    carbsG:   Math.round((calories * ratio.carbs) / 4),
    fatG:     Math.round((calories * ratio.fat) / 9),
  }
}

export type FitnessProfileResult = {
  bmi:                number
  bmiCategory:        BMICategory
  bmr:                number
  tdee:               number
  recommendedCalories: number
  proteinG:           number
  carbsG:             number
  fatG:               number
}

// Calcul complet — appelé à la fin de l'onboarding (étape résumé)
export function calculateFitnessProfile(params: {
  weightKg:      number
  heightCm:      number
  age:           number
  gender:        Gender
  activityLevel: ActivityLevel
  fitnessGoal:   FitnessGoal
}): FitnessProfileResult {
  const bmi                = calculateBMI(params.weightKg, params.heightCm)
  const bmr                = calculateBMR(params.weightKg, params.heightCm, params.age, params.gender)
  const tdee               = calculateTDEE(bmr, params.activityLevel)
  const recommendedCalories = calculateRecommendedCalories(tdee, params.fitnessGoal)
  const macros             = calculateMacros(recommendedCalories, params.fitnessGoal)

  return {
    bmi,
    bmiCategory: getBMICategory(bmi),
    bmr,
    tdee,
    recommendedCalories,
    ...macros,
  }
}
