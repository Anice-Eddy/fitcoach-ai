// Store entraînement : programme actif, séance en cours, logs
// deps: npm install zustand

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface ExerciseLogEntry {
  exerciseId:  string
  name:        string
  sets:        number
  reps:        number
  weightKg:    number | null
  isCompleted: boolean
  rpe?:        number
}

export interface ActiveSession {
  sessionId:      string
  name:           string
  startedAt:      Date
  exercises:      ExerciseLogEntry[]
  currentExercise: number
  restTimerActive: boolean
  restSecondsLeft: number
}

interface TrainingState {
  activeProgramId: string | null
  activeSession:   ActiveSession | null
  isLoading:       boolean
  error:           string | null

  setActiveProgram:    (id: string | null) => void
  startSession:        (session: Omit<ActiveSession, 'startedAt'>) => void
  completeExercise:    (index: number, log: Partial<ExerciseLogEntry>) => void
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
    (set) => ({
      activeProgramId: null,
      activeSession:   null,
      isLoading:       false,
      error:           null,

      setActiveProgram: (id) => set({ activeProgramId: id }),

      startSession: (session) =>
        set({ activeSession: { ...session, startedAt: new Date(), restTimerActive: false, restSecondsLeft: 0 } }),

      completeExercise: (index, log) =>
        set((s) => {
          if (!s.activeSession) return s
          const exercises = [...s.activeSession.exercises]
          exercises[index] = { ...exercises[index], ...log, isCompleted: true }
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
    { name: 'fitcoach:training', partialize: (s) => ({ activeProgramId: s.activeProgramId, activeSession: s.activeSession }) },
  ),
)
