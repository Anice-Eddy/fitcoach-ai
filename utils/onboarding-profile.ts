import type { OnboardingData } from '@/utils/validators'
import type { UserProfile } from '@/lib/storage/StorageAdapter'

// Keep the onboarding form in sync with an existing user profile.
export function profileToOnboardingData(profile: UserProfile): Partial<OnboardingData> & {
  weightUnit: 'KG' | 'LB'
  heightUnit: 'CM' | 'FT_IN'
} {
  return {
    firstName: profile.firstName,
    age: profile.age,
    gender: profile.gender as OnboardingData['gender'],
    weightKg: profile.weightKg,
    heightCm: profile.heightCm,
    waistCm: profile.waistCm,
    hipsCm: profile.hipsCm,
    weightUnit: profile.weightUnit,
    heightUnit: profile.heightUnit,
    activityLevel: profile.activityLevel as OnboardingData['activityLevel'],
    availableEquipment: profile.availableEquipment as OnboardingData['availableEquipment'],
    trainingDaysPerWeek: profile.trainingDaysPerWeek,
    fitnessGoal: profile.fitnessGoal as OnboardingData['fitnessGoal'],
    targetWeightKg: profile.targetWeightKg,
    fitnessLevel: profile.fitnessLevel as OnboardingData['fitnessLevel'],
    dietaryRestrictions: profile.dietaryRestrictions,
    foodPreferences: profile.foodPreferences,
  }
}

// A completed profile opens the summary step so the next action is choosing AI or a real coach.
export function getInitialOnboardingStep(params: {
  completed?: boolean
  savedStep?: number | null
  totalSteps: number
}) {
  if (params.completed) return params.totalSteps - 1
  return Math.min(Math.max(params.savedStep ?? 0, 0), params.totalSteps - 1)
}
