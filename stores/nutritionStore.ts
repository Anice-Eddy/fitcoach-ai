// Store nutrition : plan actif, repas du jour, macros consommées
// deps: npm install zustand

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface LoggedMeal {
  mealId:    string
  name:      string
  type:      string
  calories:  number
  proteinG:  number
  carbsG:    number
  fatG:      number
  loggedAt:  string // ISO date
}

interface NutritionState {
  activePlanId:  string | null
  todayMeals:    LoggedMeal[]
  isLoading:     boolean
  error:         string | null

  setActivePlan:  (id: string | null) => void
  logMeal:        (meal: LoggedMeal) => void
  toggleMeal:     (meal: LoggedMeal) => void
  removeMeal:     (mealId: string) => void
  clearTodayLog:  () => void
  setLoading:     (loading: boolean) => void
  setError:       (error: string | null) => void

  // Getters calculés
  getTodayTotals: () => { calories: number; proteinG: number; carbsG: number; fatG: number }
}

export const useNutritionStore = create<NutritionState>()(
  persist(
    (set, get) => ({
      activePlanId: null,
      todayMeals:   [],
      isLoading:    false,
      error:        null,

      setActivePlan: (id) => set({ activePlanId: id }),

      logMeal: (meal) =>
        set((s) => ({ todayMeals: [...s.todayMeals.filter((m) => m.mealId !== meal.mealId), meal] })),

      toggleMeal: (meal) =>
        set((s) => s.todayMeals.some((m) => m.mealId === meal.mealId)
          ? { todayMeals: s.todayMeals.filter((m) => m.mealId !== meal.mealId) }
          : { todayMeals: [...s.todayMeals, meal] }),

      removeMeal: (mealId) =>
        set((s) => ({ todayMeals: s.todayMeals.filter((m) => m.mealId !== mealId) })),

      clearTodayLog: () => set({ todayMeals: [] }),
      setLoading:    (isLoading) => set({ isLoading }),
      setError:      (error) => set({ error }),

      getTodayTotals: () => {
        const meals = get().todayMeals
        return meals.reduce(
          (acc, m) => ({
            calories: acc.calories + m.calories,
            proteinG: acc.proteinG + m.proteinG,
            carbsG:   acc.carbsG   + m.carbsG,
            fatG:     acc.fatG     + m.fatG,
          }),
          { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 },
        )
      },
    }),
    {
      name: 'BodyOps:nutrition',
      partialize: (s) => ({ activePlanId: s.activePlanId, todayMeals: s.todayMeals }),
    },
  ),
)
