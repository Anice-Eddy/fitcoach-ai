// Training store: active program, current session, and logs.
// deps: npm install zustand

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { SessionExercise, WorkoutSession } from '@/types'

export interface ActiveSession {
  sessionId:       string
  name:            string
  startedAt:       Date
  exercises:       SessionExercise[]
  currentExercise: number
  restTimerActive: boolean
  restSecondsLeft: number
}

export interface ProgramCache {
  sessions:      WorkoutSession[]
  programName:   string
  programDescription?: string | null
  ai?:            { generated: boolean; provider: string } | null
  programWeek:   { current: number; total: number }
  cachedAt:      number // timestamp ms
}

const PROGRAM_CACHE_TTL = 5 * 60 * 1000 // 5 minutes

interface TrainingState {
  activeProgramId: string | null
  activeSession:   ActiveSession | null
  programCache:    ProgramCache | null
  isLoading:       boolean
  error:           string | null

  setActiveProgram:    (id: string | null) => void
  setProgramCache:     (cache: ProgramCache) => void
  clearProgramCache:   () => void
  isProgramCacheFresh: () => boolean
  startSession:        (session: Omit<ActiveSession, 'startedAt'>) => void
  completeExercise:    (index: number, log: Partial<SessionExercise>) => void
  toggleExercise:      (index: number, log?: Partial<SessionExercise>) => void
  replaceExercise:     (index: number, exercise: SessionExercise) => void
  updateExerciseField: (index: number, fields: Partial<SessionExercise>) => void
  setCurrentExercise:  (index: number) => void
  startRestTimer:      (seconds: number) => void
  tickRestTimer:       () => void
  stopRestTimer:       () => void
  endSession:          () => void
  setLoading:          (loading: boolean) => void
  setError:            (error: string | null) => void
}

export const useTrainingStore = create<TrainingState>()(
  persist(
    (set, get) => ({
      activeProgramId: null,
      activeSession:   null,
      programCache:    null,
      isLoading:       false,
      error:           null,

      setActiveProgram:  (id) => set({ activeProgramId: id }),
      setProgramCache:   (cache) => set({ programCache: cache }),
      clearProgramCache: () => set({ programCache: null }),
      isProgramCacheFresh: () => {
        const c = get().programCache
        return !!c && Date.now() - c.cachedAt < PROGRAM_CACHE_TTL
      },

      startSession: (session) =>
        set({ activeSession: { ...session, startedAt: new Date(), restTimerActive: false, restSecondsLeft: 0 } }),

      completeExercise: (index, log) =>
        set((s) => {
          if (!s.activeSession) return s
          const exercises = [...s.activeSession.exercises]
          exercises[index] = { ...exercises[index], ...log, isCompleted: true }
          return { activeSession: { ...s.activeSession, exercises } }
        }),

      toggleExercise: (index, log = {}) =>
        set((s) => {
          if (!s.activeSession) return s
          const exercises = [...s.activeSession.exercises]
          const current = exercises[index]
          exercises[index] = { ...current, ...log, isCompleted: !current.isCompleted }
          return { activeSession: { ...s.activeSession, exercises } }
        }),

      replaceExercise: (index, exercise) =>
        set((s) => {
          if (!s.activeSession) return s
          const exercises = [...s.activeSession.exercises]
          exercises[index] = exercise
          return { activeSession: { ...s.activeSession, exercises } }
        }),

      updateExerciseField: (index, fields) =>
        set((s) => {
          if (!s.activeSession) return s
          const exercises = [...s.activeSession.exercises]
          exercises[index] = { ...exercises[index], ...fields }
          return { activeSession: { ...s.activeSession, exercises } }
        }),

      setCurrentExercise: (index) =>
        set((s) => s.activeSession ? { activeSession: { ...s.activeSession, currentExercise: index } } : s),

      startRestTimer: (seconds) =>
        set((s) => s.activeSession
          ? { activeSession: { ...s.activeSession, restTimerActive: true, restSecondsLeft: seconds } }
          : s),

      tickRestTimer: () =>
        set((s) => {
          if (!s.activeSession) return s
          const next = s.activeSession.restSecondsLeft - 1
          return {
            activeSession: {
              ...s.activeSession,
              restSecondsLeft: Math.max(0, next),
              restTimerActive: next > 0,
            },
          }
        }),

      stopRestTimer: () =>
        set((s) => s.activeSession
          ? { activeSession: { ...s.activeSession, restTimerActive: false, restSecondsLeft: 0 } }
          : s),

      endSession:  () => set({ activeSession: null }),
      setLoading:  (isLoading) => set({ isLoading }),
      setError:    (error) => set({ error }),
    }),
    { name: 'BodyOps:training', skipHydration: true, partialize: (s) => ({ activeProgramId: s.activeProgramId, activeSession: s.activeSession, programCache: s.programCache }) },
  ),
)
