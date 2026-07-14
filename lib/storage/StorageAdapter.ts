// Abstract storage system interface.
// Allows switching between local (IndexedDB) and cloud (Prisma) storage without changing callers.

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
  bodyFocus?: 'UPPER_BODY' | 'LOWER_BODY' | 'FULL_BODY'
  injuries?: Array<{ bodyPart: string; severity: 'MILD' | 'MODERATE' | 'SEVERE'; description: string }>
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
  healthDataConsentAccepted?: boolean
  healthDataConsentAt?: string | Date
  healthDataConsentVersion?: string
  healthDataConsentLocale?: string
}

export interface StorageAdapter {
  // Profil
  getProfile(): Promise<UserProfile | null>
  saveProfile(data: Partial<UserProfile>): Promise<UserProfile>

  // Body metrics
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
