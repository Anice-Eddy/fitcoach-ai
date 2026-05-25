// Utilitaires nutrition : calcul des totaux, pourcentages, ajustements

import type { Meal, Macros } from '@/types'

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

export function getMealsForDay(meals: Meal[], dayOfWeek: number): Meal[] {
  return meals.filter((m) => m.dayOfWeek === dayOfWeek)
}

export function generateShoppingList(meals: Meal[]): Record<string, { name: string; totalGrams: number; category: string }> {
  const list: Record<string, { name: string; totalGrams: number; category: string }> = {}
  meals.forEach((meal) => {
    meal.foodItems.forEach((item) => {
      if (list[item.name]) {
        list[item.name].totalGrams += item.gramsAmount
      } else {
        list[item.name] = { name: item.name, totalGrams: item.gramsAmount, category: 'Aliment' }
      }
    })
  })
  return list
}
