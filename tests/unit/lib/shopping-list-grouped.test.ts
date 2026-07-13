import { describe, it, expect } from 'vitest'
import {
  foodCategoryLabel,
  generateShoppingList,
  groupShoppingList,
  shoppingListToText,
} from '@/lib/nutrition/shopping-list'
import type { Meal } from '@/types'

const makeMeal = (foodItems: Meal['foodItems']): Meal => ({
  id:             'meal-1',
  dayOfWeek:      0,
  type:           'LUNCH',
  name:           'Test',
  scheduledTime:  '12:00',
  totalCalories:  500,
  totalProteinG:  40,
  totalCarbsG:    50,
  totalFatG:      10,
  isLogged:       false,
  foodItems,
})

const makeFoodItem = (name: string, grams: number): Meal['foodItems'][number] => ({
  id:          `item-${name}`,
  name,
  gramsAmount: grams,
  calories:    100,
  proteinG:    20,
  carbsG:      10,
  fatG:        5,
})

describe('generateShoppingList', () => {
  it('aggregates grams for the same food across multiple meals', () => {
    const meals = [
      makeMeal([makeFoodItem('Blanc de poulet', 150)]),
      makeMeal([makeFoodItem('Blanc de poulet', 120)]),
    ]
    const list = generateShoppingList(meals)
    expect(list['Blanc de poulet'].totalGrams).toBe(270)
  })

  it('assigns the right category from the food database', () => {
    const meals = [makeMeal([makeFoodItem('Blanc de poulet', 150)])]
    const list = generateShoppingList(meals)
    expect(list['Blanc de poulet'].category).toBe('protein')
  })

  it('classifies unknown foods as Other', () => {
    const meals = [makeMeal([makeFoodItem('Aliment inconnu', 50)])]
    const list = generateShoppingList(meals)
    expect(list['Aliment inconnu'].category).toBe('other')
  })

  it('assigns categories when meal foods use English display names', () => {
    const meals = [makeMeal([makeFoodItem('Chicken breast', 150)])]
    const list = generateShoppingList(meals)
    expect(list['Chicken breast'].category).toBe('protein')
  })

  it('returns an empty object for meals without food items', () => {
    const meals = [makeMeal([])]
    expect(generateShoppingList(meals)).toEqual({})
  })
})

describe('groupShoppingList', () => {
  it('groups foods by category', () => {
    const flat = {
      'Blanc de poulet': { name: 'Blanc de poulet', totalGrams: 150, category: 'protein' as const },
      'Riz blanc cuit':  { name: 'Riz blanc cuit',  totalGrams: 200, category: 'carb'  as const },
    }
    const grouped = groupShoppingList(flat)
    expect(grouped.protein).toHaveLength(1)
    expect(grouped.carb).toHaveLength(1)
    expect(grouped.vegetable).toHaveLength(0)
  })

  it('sorts items alphabetically in each category', () => {
    const flat = {
      'Saumon':          { name: 'Saumon',          totalGrams: 100, category: 'protein' as const },
      'Blanc de poulet': { name: 'Blanc de poulet', totalGrams: 150, category: 'protein' as const },
    }
    const grouped = groupShoppingList(flat)
    expect(grouped.protein[0].name).toBe('Blanc de poulet')
    expect(grouped.protein[1].name).toBe('Saumon')
  })
})

describe('shoppingListToText', () => {
  it('produces a readable English string by default', () => {
    const grouped = groupShoppingList({
      'Blanc de poulet': { name: 'Blanc de poulet', totalGrams: 300, category: 'protein' as const },
    })
    const text = shoppingListToText(grouped)
    expect(text).toContain('Protein')
    expect(text).toContain('Chicken breast')
    expect(text).toContain('300 g')
  })

  it('produces a readable French string when requested', () => {
    const grouped = groupShoppingList({
      'Blanc de poulet': { name: 'Blanc de poulet', totalGrams: 300, category: 'protein' as const },
    })
    const text = shoppingListToText(grouped, undefined, 'fr')
    expect(text).toContain('Liste de courses')
    expect(text).toContain('Protéines')
    expect(text).toContain('Blanc de poulet')
  })

  it('includes the week title when provided', () => {
    const grouped = groupShoppingList({})
    const text = shoppingListToText(grouped, '26 mai 2025')
    expect(text).toContain('26 mai 2025')
  })

  it('does not include empty categories', () => {
    const grouped = groupShoppingList({
      'Banane': { name: 'Banane', totalGrams: 100, category: 'fruit' as const },
    })
    const text = shoppingListToText(grouped)
    expect(text).not.toContain('Protein:')
    expect(text).toContain('Fruits:')
  })
})

describe('foodCategoryLabel', () => {
  it('keeps legacy category values while returning localized labels', () => {
    expect(foodCategoryLabel('dairy', 'fr')).toBe('Produits laitiers')
    expect(foodCategoryLabel('dairy', 'en')).toBe('Dairy')
  })
})
