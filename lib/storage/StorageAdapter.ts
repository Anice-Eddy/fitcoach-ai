// Interface abstraite du système de stockage
// Permet de basculer entre local (IndexedDB) et cloud (Prisma) sans changer le code appelant

import type { OnboardingData, BodyMetricInput } from '@/utils/validators'

export type StorageMode = 'local' | 'cloud'

export interface UserProfile {
  id: string
  firstName: string
  age: number
  gender: string
  weightKg: number
  heightCm: number
  waistCm?: number
  hipsCm?: number
  weightUnit: 'KG' | 'LB'
  heightUnit: 'CM' | 'FT_IN'
  activityLevel: string
  availableEquipment: string[]
  trainingDaysPerWeek: number
  fitnessGoal: string
  targetWeightKg?: number
  fitnessLevel: string
  dietaryRestrictions: string[]
  foodPreferences: string[]
  bmi?: number
  bmr?: number
  tdee?: number
  recommendedCalories?: number
  recommendedProteinG?: number
  recommendedCarbsG?: number
  recommendedFatG?: number
  language: string
  darkMode: boolean
  onboardingCompleted: boolean
}

export interface StorageAdapter {
  // Profil
  getProfile(): Promise<UserProfile | null>
  saveProfile(data: Partial<UserProfile>): Promise<UserProfile>

  // Métriques corporelles
  getBodyMetrics(limit?: number): Promise<BodyMetricInput[]>
  addBodyMetric(metric: BodyMetricInput): Promise<void>

  // Onboarding
  saveOnboardingProgress(step: number, data: Partial<OnboardingData>): Promise<void>
  getOnboardingProgress(): Promise<{ step: number; data: Partial<OnboardingData> } | null>
  clearOnboardingProgress(): Promise<void>

  // Utilitaires
  getMode(): StorageMode
  isReady(): boolean
  clear(): Promise<void>
}
