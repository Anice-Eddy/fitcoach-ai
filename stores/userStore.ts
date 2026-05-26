// Store utilisateur : profil, métriques, mode stockage
// deps: npm install zustand

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { UserProfile } from '@/lib/storage/StorageAdapter'

interface UserState {
  profile:     UserProfile | null
  isLoading:   boolean
  error:       string | null
  storageMode: 'local' | 'cloud'
  accompanimentMode: 'AI' | 'COACH'
  coachName: string | null
  nextCoachSession: string | null
  timezone: string

  setProfile:     (profile: UserProfile) => void
  updateProfile:  (data: Partial<UserProfile>) => void
  setStorageMode: (mode: 'local' | 'cloud') => void
  setAccompanimentMode: (mode: 'AI' | 'COACH') => void
  setCoach:       (coach: { name: string | null; nextSession?: string | null }) => void
  setTimezone:    (timezone: string) => void
  setLoading:     (loading: boolean) => void
  setError:       (error: string | null) => void
  reset:          () => void
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      profile:     null,
      isLoading:   false,
      error:       null,
      storageMode: 'local',
      accompanimentMode: 'AI',
      coachName: null,
      nextCoachSession: null,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone ?? 'Europe/Paris',

      setProfile:    (profile) => set({ profile, error: null }),
      updateProfile: (data)    => set((s) => ({ profile: s.profile ? { ...s.profile, ...data } : null })),
      setStorageMode:(mode)    => set({ storageMode: mode }),
      setAccompanimentMode: (mode) => set({ accompanimentMode: mode }),
      setCoach: (coach) => set({ coachName: coach.name, nextCoachSession: coach.nextSession ?? null }),
      setTimezone: (timezone) => set({ timezone }),
      setLoading:    (isLoading) => set({ isLoading }),
      setError:      (error)   => set({ error }),
      reset:         ()        => set({ profile: null, error: null, storageMode: 'local', accompanimentMode: 'AI', coachName: null, nextCoachSession: null }),
    }),
    {
      name: 'fitcoach:user',
      partialize: (s) => ({
        profile: s.profile,
        storageMode: s.storageMode,
        accompanimentMode: s.accompanimentMode,
        coachName: s.coachName,
        nextCoachSession: s.nextCoachSession,
        timezone: s.timezone,
      }),
    },
  ),
)
