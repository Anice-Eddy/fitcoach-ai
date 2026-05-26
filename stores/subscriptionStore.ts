// Store abonnement : plan actif, vérification des droits d'accès
// deps: npm install zustand

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Plan = 'FREE' | 'PRO' | 'ELITE' | 'BUSINESS'
export type SubStatus = 'ACTIVE' | 'INACTIVE' | 'CANCELED' | 'PAST_DUE' | 'TRIALING'

interface SubscriptionState {
  plan:               Plan
  status:             SubStatus
  currentPeriodEnd:   string | null
  cancelAtPeriodEnd:  boolean
  isLoading:          boolean

  setPlan:    (plan: Plan, status: SubStatus, periodEnd?: string) => void
  setLoading: (loading: boolean) => void

  // Helpers d'accès aux fonctionnalités
  isPro:      () => boolean
  isElite:    () => boolean
  isBusiness: () => boolean
  canExportPDF:    () => boolean
  canSyncCloud:    () => boolean
  canUseIntegrations: () => boolean
}

export const useSubscriptionStore = create<SubscriptionState>()(
  persist(
    (set, get) => ({
      plan:              'FREE',
      status:            'INACTIVE',
      currentPeriodEnd:  null,
      cancelAtPeriodEnd: false,
      isLoading:         false,

      setPlan: (plan, status, periodEnd) =>
        set({ plan, status, currentPeriodEnd: periodEnd ?? null }),

      setLoading: (isLoading) => set({ isLoading }),

      isPro:      () => ['PRO', 'ELITE', 'BUSINESS'].includes(get().plan) && get().status === 'ACTIVE',
      isElite:    () => ['ELITE', 'BUSINESS'].includes(get().plan) && get().status === 'ACTIVE',
      isBusiness: () => get().plan === 'BUSINESS' && get().status === 'ACTIVE',

      canExportPDF:       () => get().isPro(),
      canSyncCloud:       () => get().isPro(),
      canUseIntegrations: () => get().isPro(),
    }),
    { name: 'BodyOps:subscription', skipHydration: true, partialize: (s) => ({ plan: s.plan, status: s.status, currentPeriodEnd: s.currentPeriodEnd }) },
  ),
)
