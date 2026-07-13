import { describe, expect, it } from 'vitest'
import { FOOD_DATABASE, calculateFoodMacros, filterFoodsByRestrictions, foodDisplayName } from '@/lib/nutrition/food-database'
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
  it('calculates macros proportionally to grams', () => {
    expect(calculateFoodMacros('rice-white', 50)).toMatchObject({
      name:     'Riz blanc cuit',
      grams:    50,
      calories: 65,
      carbsG:   14,
    })
  })

  it('filters foods that conflict with vegan nutrition', () => {
    const foods = filterFoodsByRestrictions(['VEGAN'])
    expect(foods.some(food => food.id === 'chicken-breast')).toBe(false)
    expect(foods.some(food => food.id === 'tofu-firm')).toBe(true)
  })

  it('keeps legacy food names stable while exposing English display names', () => {
    const chicken = FOOD_DATABASE.find(food => food.id === 'chicken-breast')
    expect(chicken?.name).toBe('Blanc de poulet')
    expect(foodDisplayName('Blanc de poulet', 'en')).toBe('Chicken breast')
    expect(foodDisplayName('Blanc de poulet', 'fr')).toBe('Blanc de poulet')
  })

  it('does not expose obvious French food names in English mode', () => {
    const frenchFoodPattern = /[éèêëàâùûçîïôöœÉÈÊËÀÂÙÛÇÎÏÔÖŒ]|\b(Poulet|Riz|Blanc|Bœuf|Oeuf|Œuf|Patate|Pâtes|Lait|Fromage|Beurre|Huile|Épinards|Haricots|Légumes|Saumon|Thon|Cabillaud|Dinde|avoine|cuit|cuits|cuites|protéine)\b/i

    const untranslated = FOOD_DATABASE
      .map((food) => [food.id, foodDisplayName(food, 'en')] as const)
      .filter(([, name]) => frenchFoodPattern.test(name))

    expect(untranslated).toEqual([])
  })
})

describe('generateMealPlan', () => {
  it('generates a week of meals without unknown database foods', () => {
    const knownFoodNames = new Set(FOOD_DATABASE.map(food => food.name))
    const plan = generateMealPlan(baseParams)

    expect(plan.meals.length).toBeGreaterThan(0)
    for (const meal of plan.meals) {
      // Every item must come from the database to avoid silently incomplete meals.
      expect(meal.foodItems.length).toBeGreaterThan(0)
      for (const item of meal.foodItems) {
        expect(knownFoodNames.has(item.name)).toBe(true)
      }
    }
  })

  it('respects vegan restrictions in generated meals', () => {
    const veganFoods = new Set(filterFoodsByRestrictions(['VEGAN']).map(food => food.name))
    const plan = generateMealPlan({ ...baseParams, dietaryRestrictions: ['VEGAN'] })

    for (const meal of plan.meals) {
      for (const item of meal.foodItems) {
        expect(veganFoods.has(item.name)).toBe(true)
      }
    }
  })

  it('localizes the generated plan name without changing meal data', () => {
    expect(generateMealPlan(baseParams).name).toBe('Mon plan nutritionnel')
    expect(generateMealPlan({ ...baseParams, locale: 'en' }).name).toBe('My nutrition plan')
  })

  it('uses polished French meal names when French is requested', () => {
    const plan = generateMealPlan(baseParams)

    expect(plan.meals.some(meal => meal.name.includes('Œufs'))).toBe(true)
    expect(plan.meals.some(meal => meal.name.includes('épinards'))).toBe(true)
    expect(plan.meals.some(meal => meal.name.includes('epinards'))).toBe(false)
  })

  it('localizes generated meal and food names when English is requested', () => {
    const plan = generateMealPlan({ ...baseParams, locale: 'en' })

    expect(plan.meals[0]?.name).toContain('Monday')
    expect(plan.meals.flatMap(meal => meal.foodItems).some(item => item.name === 'Rolled oats')).toBe(true)
    expect(plan.meals.flatMap(meal => meal.foodItems).some(item => item.name === 'Flocons d\'avoine')).toBe(false)
  })
})
