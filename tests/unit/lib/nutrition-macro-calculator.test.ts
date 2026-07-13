import { describe, it, expect } from 'vitest'
import { sumMacros, macroPct, getMealsForDay, generateShoppingList } from '@/lib/nutrition/macro-calculator'
import type { Meal, FoodItem } from '@/types'

const makeFoodItem = (overrides: Partial<FoodItem> = {}): FoodItem => ({
  id:          'f1',
  name:        'Poulet',
  gramsAmount: 100,
  calories:    165,
  proteinG:    31,
  carbsG:      0,
  fatG:        3.6,
  ...overrides,
})

const makeMeal = (overrides: Partial<Meal> = {}): Meal => ({
  id:            'm1',
  dayOfWeek:     1,
  type:          'LUNCH',
  name:          'Déjeuner',
  totalCalories: 500,
  totalProteinG: 40,
  totalCarbsG:   50,
  totalFatG:     10,
  isLogged:      false,
  foodItems:     [makeFoodItem()],
  ...overrides,
})

describe('sumMacros', () => {
  it('sums macros from multiple meals', () => {
    const meals = [
      makeMeal({ totalProteinG: 30, totalCarbsG: 50, totalFatG: 10, totalCalories: 410 }),
      makeMeal({ totalProteinG: 20, totalCarbsG: 30, totalFatG: 5,  totalCalories: 245 }),
    ]
    const result = sumMacros(meals)
    expect(result.proteinG).toBe(50)
    expect(result.carbsG).toBe(80)
    expect(result.fatG).toBe(15)
    expect(result.calories).toBe(655)
  })

  it('returns zero values for an empty list', () => {
    const result = sumMacros([])
    expect(result.proteinG).toBe(0)
    expect(result.carbsG).toBe(0)
    expect(result.fatG).toBe(0)
    expect(result.calories).toBe(0)
  })
})

describe('macroPct', () => {
  it('calculates percentages correctly from macros and calories', () => {
    // macroPct accepts an object with { proteinG, carbsG, fatG, calories }.
    const macros = { proteinG: 100, carbsG: 200, fatG: 50, calories: 1650 }
    const pct = macroPct(macros)
    // Rounding per macro: 24+48+27=99 or 24+49+27=100 depending on rounding
    expect(pct.proteinPct + pct.carbsPct + pct.fatPct).toBeGreaterThanOrEqual(98)
    expect(pct.proteinPct + pct.carbsPct + pct.fatPct).toBeLessThanOrEqual(102)
    expect(pct.proteinPct).toBeGreaterThan(0)
  })

  it('returns 0/0/0 when calories are 0', () => {
    const pct = macroPct({ proteinG: 0, carbsG: 0, fatG: 0, calories: 0 })
    expect(pct.proteinPct).toBe(0)
    expect(pct.carbsPct).toBe(0)
    expect(pct.fatPct).toBe(0)
  })

  it('works with sumMacros', () => {
    const meals = [makeMeal({ totalProteinG: 100, totalCarbsG: 200, totalFatG: 50, totalCalories: 1650 })]
    const pct = macroPct(sumMacros(meals))
    // Allow ±2% due to per-macro integer rounding
    expect(pct.proteinPct + pct.carbsPct + pct.fatPct).toBeGreaterThanOrEqual(98)
    expect(pct.proteinPct + pct.carbsPct + pct.fatPct).toBeLessThanOrEqual(102)
  })
})

describe('getMealsForDay', () => {
  it('filters meals by day', () => {
    const meals = [
      makeMeal({ dayOfWeek: 1 }),
      makeMeal({ id: 'm2', dayOfWeek: 2 }),
      makeMeal({ id: 'm3', dayOfWeek: 1 }),
    ]
    const result = getMealsForDay(meals, 1)
    expect(result).toHaveLength(2)
    result.forEach((m) => expect(m.dayOfWeek).toBe(1))
  })

  it('returns an empty array when there are no meals that day', () => {
    const meals = [makeMeal({ dayOfWeek: 3 })]
    expect(getMealsForDay(meals, 5)).toHaveLength(0)
  })
})

describe('generateShoppingList', () => {
  it('generates a shopping object from meals', () => {
    const meals = [
      makeMeal({ foodItems: [
        makeFoodItem({ name: 'Poulet', gramsAmount: 200 }),
        makeFoodItem({ name: 'Riz', gramsAmount: 100, calories: 130, proteinG: 3, carbsG: 28, fatG: 0.3 }),
      ]}),
    ]
    const list = generateShoppingList(meals)
    expect(Object.keys(list).length).toBeGreaterThan(0)
    expect(list['Poulet']).toBeDefined()
    expect(list['Poulet'].totalGrams).toBe(200)
  })

  it('aggregates grams for the same food', () => {
    const meals = [
      makeMeal({ id: 'm1', foodItems: [makeFoodItem({ name: 'Poulet', gramsAmount: 150 })] }),
      makeMeal({ id: 'm2', foodItems: [makeFoodItem({ name: 'Poulet', gramsAmount: 100 })] }),
    ]
    const list = generateShoppingList(meals)
    expect(list['Poulet'].totalGrams).toBe(250)
  })

  it('returns an empty object for meals without food items', () => {
    const meals = [makeMeal({ foodItems: [] })]
    expect(Object.keys(generateShoppingList(meals))).toHaveLength(0)
  })
})
