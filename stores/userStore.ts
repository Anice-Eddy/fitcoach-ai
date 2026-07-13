// User store: profile, metrics, and storage mode.
// deps: npm install zustand

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { UserProfile } from '@/lib/storage/StorageAdapter'

interface UserState {
  profile:        UserProfile | null
  profileChecked: boolean
  isLoading:      boolean
  error:          string | null
  storageMode:    'local' | 'cloud'
  timezone:       string

  setProfile:        (profile: UserProfile) => void
  setProfileChecked: (checked: boolean) => void
  updateProfile:     (data: Partial<UserProfile>) => void
  setStorageMode:    (mode: 'local' | 'cloud') => void
  setTimezone:       (timezone: string) => void
  setLoading:        (loading: boolean) => void
  setError:          (error: string | null) => void
  reset:             () => void
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      profile:        null,
      profileChecked: false,
      isLoading:      false,
      error:          null,
      storageMode:    'local',
      timezone:       Intl.DateTimeFormat().resolvedOptions().timeZone ?? 'Europe/Paris',

      setProfile:        (profile) => set({ profile, error: null }),
      setProfileChecked: (checked) => set({ profileChecked: checked }),
      updateProfile:     (data)    => set((s) => ({ profile: s.profile ? { ...s.profile, ...data } : null })),
      setStorageMode:    (mode)    => set({ storageMode: mode }),
      setTimezone:       (timezone) => set({ timezone }),
      setLoading:        (isLoading) => set({ isLoading }),
      setError:          (error)   => set({ error }),
      reset:             ()        => set({ profile: null, profileChecked: false, error: null, storageMode: 'local' }),
    }),
    {
      name: 'BodyOps:user',
      version: 2,
      skipHydration: true,
      migrate: (persistedState) => {
        if (!persistedState || typeof persistedState !== 'object') return persistedState
        // Coach data now comes from /api/user/my-coach; remove stale local coach fields.
        const state = { ...(persistedState as Record<string, unknown>) }
        delete state.accompanimentMode
        delete state.coachName
        delete state.nextCoachSession
        return state
      },
      partialize: (s) => ({
        profile: s.profile,
        storageMode: s.storageMode,
        timezone: s.timezone,
      }),
    },
  ),
)
