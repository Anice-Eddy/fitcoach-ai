'use client'

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useUserStore } from '@/stores/userStore'
import { useLocale } from '@/contexts/LocaleContext'
import type { UserProfile } from '@/lib/storage/StorageAdapter'

/** Invisible component that fetches and syncs the cloud profile into the Zustand store after the user authenticates. */
export function ProfileSync() {
  const { data: session, status }              = useSession()
  const { profile, setProfile, setProfileChecked } = useUserStore()
  const { setLocale }                          = useLocale()

  useEffect(() => {
    if (status !== 'authenticated') return
    if (profile?.fitnessGoal && profile?.fitnessLevel && profile?.onboardingCompleted) {
      setProfileChecked(true)
      return
    }

    fetch('/api/user/profile')
      .then(res => res.json())
      .then((p: Record<string, unknown> | null) => {
        if (!p || !p.fitnessGoal) {
          setProfileChecked(true)
          return
        }
        const up: UserProfile = {
          id:                  (p.userId as string) ?? '',
          firstName:           (p.firstName as string) ?? '',
          age:                 (p.age as number) ?? 0,
          gender:              (p.gender as string) ?? 'MALE',
          weightKg:            (p.weightKg as number) ?? 0,
          heightCm:            (p.heightCm as number) ?? 0,
          waistCm:             p.waistCm   as number | undefined,
          hipsCm:              p.hipsCm    as number | undefined,
          weightUnit:          ((p.weightUnit  as string) ?? 'KG')  as 'KG' | 'LB',
          heightUnit:          ((p.heightUnit  as string) ?? 'CM')  as 'CM' | 'FT_IN',
          activityLevel:       (p.activityLevel       as string) ?? 'MODERATELY_ACTIVE',
          availableEquipment:  (p.availableEquipment  as string[]) ?? [],
          trainingDaysPerWeek: (p.trainingDaysPerWeek as number) ?? 3,
          fitnessGoal:         (p.fitnessGoal         as string) ?? 'GENERAL_FITNESS',
          targetWeightKg:      p.targetWeightKg as number | undefined,
          fitnessLevel:        (p.fitnessLevel         as string) ?? 'BEGINNER',
          dietaryRestrictions: (p.dietaryRestrictions  as string[]) ?? [],
          foodPreferences:     (p.foodPreferences      as string[]) ?? [],
          bmi:                 p.bmi                as number | undefined,
          bmr:                 p.bmr                as number | undefined,
          tdee:                p.tdee               as number | undefined,
          recommendedCalories: p.recommendedCalories as number | undefined,
          recommendedProteinG: p.recommendedProteinG as number | undefined,
          recommendedCarbsG:   p.recommendedCarbsG   as number | undefined,
          recommendedFatG:     p.recommendedFatG     as number | undefined,
          language:            (p.language   as string)  ?? 'fr',
          darkMode:            (p.darkMode   as boolean) ?? true,
          onboardingCompleted: (p.onboardingCompleted as boolean) ?? false,
        }
        setProfile(up)
        setProfileChecked(true)
        const lang = up.language as 'fr' | 'en'
        if (lang === 'fr' || lang === 'en') setLocale(lang)
      })
      .catch(() => { setProfileChecked(true) })
  }, [status, session?.user?.id])

  return null
}
