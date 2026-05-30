'use client'

import { signOut } from 'next-auth/react'
import { useUserStore } from '@/stores/userStore'

const ACCOUNT_STORAGE_KEYS = [
  'BodyOps:user',
  'BodyOps:profile',
  'BodyOps:onboarding',
  'BodyOps:onboarding:cloud',
  'BodyOps:training',
  'BodyOps:nutrition',
  'BodyOps:subscription',
]

/** Clears client-side account data so a new login cannot display stale data from the previous user. */
export function clearClientAccountState() {
  useUserStore.getState().reset()
  if (typeof window === 'undefined') return

  for (const key of ACCOUNT_STORAGE_KEYS) {
    window.localStorage.removeItem(key)
  }
  window.sessionStorage.removeItem('bodyops:last-auth-context')
}

/** Signs out through NextAuth after clearing local account caches. */
export async function signOutAndClear(callbackUrl = '/') {
  clearClientAccountState()
  await signOut({ callbackUrl })
}
