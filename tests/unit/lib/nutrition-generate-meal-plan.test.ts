import { describe, expect, it } from 'vitest'
import { FOOD_DATABASE, calculateFoodMacros, filterFoodsByRestrictions } from '@/lib/nutrition/food-database'
import { generateMealPlan } from '@/lib/nutrition/generate-meal-plan'

const baseParams = {
  targetCalories:      2200,
  targetProteinG:      160,
  targetCarbsG:        240,
  targetFatG:          70,
  fitnessGoal:         'MAINTENANCE',
  dietaryRestrictions: [] as string[],
}

describe('food database helpers', () => {
  it('calcule les macros proportionnellement au grammage', () => {
    expect(calculateFoodMacros('rice-white', 50)).toMatchObject({
      name:     'Riz blanc cuit',
      grams:    50,
      calories: 65,
      carbsG:   14,
    })
  })

  it('filtre les aliments incompatibles avec une alimentation vegan', () => {
    const foods = filterFoodsByRestrictions(['VEGAN'])
    expect(foods.some(food => food.id === 'chicken-breast')).toBe(false)
    expect(foods.some(food => food.id === 'tofu-firm')).toBe(true)
  })
})

describe('generateMealPlan', () => {
  it('génère une semaine de repas sans aliment introuvable dans la base', () => {
    const knownFoodNames = new Set(FOOD_DATABASE.map(food => food.name))
    const plan = generateMealPlan(baseParams)

    expect(plan.meals.length).toBeGreaterThan(0)
    for (const meal of plan.meals) {
      // Chaque item doit venir de la base afin d'éviter des repas incomplets silencieux.
      expect(meal.foodItems.length).toBeGreaterThan(0)
      for (const item of meal.foodItems) {
        expect(knownFoodNames.has(item.name)).toBe(true)
      }
    }
  })

  it('respecte les restrictions vegan dans les repas principaux', () => {
    const veganFoods = new Set(filterFoodsByRestrictions(['VEGAN']).map(food => food.name))
    const plan = generateMealPlan({ ...baseParams, dietaryRestrictions: ['VEGAN'] })

    for (const meal of plan.meals) {
      for (const item of meal.foodItems) {
        expect(veganFoods.has(item.name)).toBe(true)
      }
    }
  })
})
