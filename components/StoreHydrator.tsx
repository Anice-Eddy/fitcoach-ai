'use client'

import { useEffect } from 'react'
import { useUserStore }         from '@/stores/userStore'
import { useTrainingStore }     from '@/stores/trainingStore'
import { useUIStore }           from '@/stores/uiStore'
import { useSubscriptionStore } from '@/stores/subscriptionStore'
import { useNutritionStore }    from '@/stores/nutritionStore'

// Rehydrates all persisted Zustand stores after first client render.
// Prevents SSR/client hydration mismatches caused by localStorage data.
export function StoreHydrator() {
  useEffect(() => {
    useUserStore.persist.rehydrate()
    useTrainingStore.persist.rehydrate()
    useUIStore.persist.rehydrate()
    useSubscriptionStore.persist.rehydrate()
    useNutritionStore.persist.rehydrate()
  }, [])

  return null
}
