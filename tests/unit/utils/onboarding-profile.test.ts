import { describe, expect, it } from 'vitest'
import { getInitialOnboardingStep, profileToOnboardingData } from '@/utils/onboarding-profile'
import type { UserProfile } from '@/lib/storage/StorageAdapter'

const profile: UserProfile = {
  id: 'profile-1',
  firstName: 'Alex',
  age: 28,
  gender: 'MALE',
  weightKg: 78.4,
  heightCm: 178,
  waistCm: 82,
  hipsCm: 96,
  weightUnit: 'KG',
  heightUnit: 'CM',
  activityLevel: 'MODERATELY_ACTIVE',
  availableEquipment: ['BARBELL', 'DUMBBELL'],
  trainingDaysPerWeek: 4,
  fitnessGoal: 'MUSCLE_GAIN',
  targetWeightKg: 82,
  fitnessLevel: 'INTERMEDIATE',
  dietaryRestrictions: [],
  foodPreferences: ['Riz'],
  language: 'fr',
  darkMode: true,
  onboardingCompleted: true,
}

describe('profileToOnboardingData', () => {
  it('prefills onboarding fields from an existing profile', () => {
    const data = profileToOnboardingData(profile)
    expect(data.firstName).toBe('Alex')
    expect(data.weightKg).toBe(78.4)
    expect(data.availableEquipment).toContain('BARBELL')
    expect(data.fitnessGoal).toBe('MUSCLE_GAIN')
  })
})

describe('getInitialOnboardingStep', () => {
  it('opens the summary step when the profile is already complete', () => {
    expect(getInitialOnboardingStep({ completed: true, savedStep: 2, totalSteps: 7 })).toBe(6)
  })

  it('uses saved progress for an incomplete profile', () => {
    expect(getInitialOnboardingStep({ completed: false, savedStep: 3, totalSteps: 7 })).toBe(3)
  })

  it('keeps the step inside valid bounds', () => {
    expect(getInitialOnboardingStep({ completed: false, savedStep: 99, totalSteps: 7 })).toBe(6)
    expect(getInitialOnboardingStep({ completed: false, savedStep: -2, totalSteps: 7 })).toBe(0)
  })
})
