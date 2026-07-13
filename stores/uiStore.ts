// UI store: theme, language, sidebar, toasts, and global state.
// deps: npm install zustand

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface UIState {
  darkMode:       boolean
  language:       'fr' | 'en'
  sidebarOpen:    boolean
  onboardingStep: number

  toggleDarkMode:     () => void
  setLanguage:        (lang: 'fr' | 'en') => void
  setSidebarOpen:     (open: boolean) => void
  toggleSidebar:      () => void
  setOnboardingStep:  (step: number) => void
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      darkMode:       true,
      language:       'fr',
      sidebarOpen:    true,
      onboardingStep: 0,

      toggleDarkMode:    () => set((s) => ({ darkMode: !s.darkMode })),
      setLanguage:       (language) => set({ language }),
      setSidebarOpen:    (sidebarOpen) => set({ sidebarOpen }),
      toggleSidebar:     () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
      setOnboardingStep: (onboardingStep) => set({ onboardingStep }),
    }),
    { name: 'BodyOps:ui', skipHydration: true },
  ),
)
