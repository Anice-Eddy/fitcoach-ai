// Nutrition utilities: totals, percentages, and adjustments.

import type { Meal, Macros } from '@/types'
export { generateShoppingList } from './shopping-list'

/** Sums the calories and macros of all provided meals into a single aggregate object. */
export function sumMacros(meals: Meal[]): Macros & { calories: number } {
  return meals.reduce(
    (acc, meal) => ({
      calories: acc.calories + meal.totalCalories,
      proteinG: acc.proteinG + meal.totalProteinG,
      carbsG:   acc.carbsG   + meal.totalCarbsG,
      fatG:     acc.fatG     + meal.totalFatG,
    }),
    { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 },
  )
}

/** Converts macros and total calories into percentage-of-energy values for protein, carbs, and fat. */
export function macroPct(
  macros: Macros & { calories: number },
): { proteinPct: number; carbsPct: number; fatPct: number } {
  const { calories } = macros
  if (calories === 0) return { proteinPct: 0, carbsPct: 0, fatPct: 0 }
  return {
    proteinPct: Math.round((macros.proteinG * 4 / calories) * 100),
    carbsPct:   Math.round((macros.carbsG   * 4 / calories) * 100),
    fatPct:     Math.round((macros.fatG     * 9 / calories) * 100),
  }
}

/** Filters meals to only those scheduled for the given dayOfWeek (0 = Monday). */
export function getMealsForDay(meals: Meal[], dayOfWeek: number): Meal[] {
  return meals.filter((m) => m.dayOfWeek === dayOfWeek)
}
