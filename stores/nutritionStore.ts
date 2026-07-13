// Nutrition store: active plan, daily meals, and consumed macros.
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

function localDateKey(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function isLoggedToday(meal: LoggedMeal) {
  return localDateKey(new Date(meal.loggedAt)) === localDateKey()
}

interface NutritionState {
  activePlanId:  string | null
  currentDate:   string
  todayMeals:    LoggedMeal[]
  isLoading:     boolean
  error:         string | null

  setActivePlan:  (id: string | null) => void
  logMeal:        (meal: LoggedMeal) => void
  toggleMeal:     (meal: LoggedMeal) => void
  removeMeal:     (mealId: string) => void
  setTodayMeals:  (meals: LoggedMeal[]) => void
  clearTodayLog:  () => void
  ensureTodayLog: () => void
  setLoading:     (loading: boolean) => void
  setError:       (error: string | null) => void

  // Derived getters.
  getTodayTotals: () => { calories: number; proteinG: number; carbsG: number; fatG: number }
}

export const useNutritionStore = create<NutritionState>()(
  persist(
    (set, get) => ({
      activePlanId: null,
      currentDate:  localDateKey(),
      todayMeals:   [],
      isLoading:    false,
      error:        null,

      setActivePlan: (id) => set({ activePlanId: id }),

      logMeal: (meal) =>
        set((s) => {
          const today = localDateKey()
          // Each new day starts with an empty nutrition log.
          const baseMeals = s.currentDate === today ? s.todayMeals.filter(isLoggedToday) : []
          return { currentDate: today, todayMeals: [...baseMeals.filter((m) => m.mealId !== meal.mealId), meal] }
        }),

      toggleMeal: (meal) =>
        set((s) => {
          const today = localDateKey()
          const baseMeals = s.currentDate === today ? s.todayMeals.filter(isLoggedToday) : []
          return baseMeals.some((m) => m.mealId === meal.mealId)
            ? { currentDate: today, todayMeals: baseMeals.filter((m) => m.mealId !== meal.mealId) }
            : { currentDate: today, todayMeals: [...baseMeals, meal] }
        }),

      removeMeal: (mealId) =>
        set((s) => ({ currentDate: localDateKey(), todayMeals: s.todayMeals.filter(isLoggedToday).filter((m) => m.mealId !== mealId) })),

      setTodayMeals: (meals) =>
        set({ currentDate: localDateKey(), todayMeals: meals.filter(isLoggedToday) }),

      clearTodayLog: () => set({ currentDate: localDateKey(), todayMeals: [] }),
      ensureTodayLog: () => set((s) => {
        const today = localDateKey()
        return s.currentDate === today
          ? { todayMeals: s.todayMeals.filter(isLoggedToday) }
          : { currentDate: today, todayMeals: [] }
      }),
      setLoading:    (isLoading) => set({ isLoading }),
      setError:      (error) => set({ error }),

      getTodayTotals: () => {
        const state = get()
        const meals = state.currentDate === localDateKey()
          ? state.todayMeals.filter(isLoggedToday)
          : []
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
      skipHydration: true,
      version: 2,
      partialize: (s) => ({ activePlanId: s.activePlanId, currentDate: s.currentDate, todayMeals: s.todayMeals.filter(isLoggedToday) }),
      migrate: (persisted) => {
        const state = persisted as Partial<NutritionState>
        const today = localDateKey()
        return {
          activePlanId: state.activePlanId ?? null,
          currentDate: today,
          todayMeals: state.currentDate === today ? (state.todayMeals ?? []).filter(isLoggedToday) : [],
        }
      },
    },
  ),
)
