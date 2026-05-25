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

  setProfile:     (profile: UserProfile) => void
  updateProfile:  (data: Partial<UserProfile>) => void
  setStorageMode: (mode: 'local' | 'cloud') => void
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

      setProfile:    (profile) => set({ profile, error: null }),
      updateProfile: (data)    => set((s) => ({ profile: s.profile ? { ...s.profile, ...data } : null })),
      setStorageMode:(mode)    => set({ storageMode: mode }),
      setLoading:    (isLoading) => set({ isLoading }),
      setError:      (error)   => set({ error }),
      reset:         ()        => set({ profile: null, error: null, storageMode: 'local' }),
    }),
    { name: 'fitcoach:user', partialize: (s) => ({ profile: s.profile, storageMode: s.storageMode }) },
  ),
)
