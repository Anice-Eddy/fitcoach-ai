import { describe, it, expect } from 'vitest'
import {
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
  it('agrège les grammes du même aliment sur plusieurs repas', () => {
    const meals = [
      makeMeal([makeFoodItem('Blanc de poulet', 150)]),
      makeMeal([makeFoodItem('Blanc de poulet', 120)]),
    ]
    const list = generateShoppingList(meals)
    expect(list['Blanc de poulet'].totalGrams).toBe(270)
  })

  it('attribue la bonne catégorie depuis la food database', () => {
    const meals = [makeMeal([makeFoodItem('Blanc de poulet', 150)])]
    const list = generateShoppingList(meals)
    expect(list['Blanc de poulet'].category).toBe('Protéines')
  })

  it('classe les aliments inconnus en Autres', () => {
    const meals = [makeMeal([makeFoodItem('Aliment inconnu', 50)])]
    const list = generateShoppingList(meals)
    expect(list['Aliment inconnu'].category).toBe('Autres')
  })

  it('retourne un objet vide pour une liste de repas sans aliments', () => {
    const meals = [makeMeal([])]
    expect(generateShoppingList(meals)).toEqual({})
  })
})

describe('groupShoppingList', () => {
  it('groupe les aliments par catégorie', () => {
    const flat = {
      'Blanc de poulet': { name: 'Blanc de poulet', totalGrams: 150, category: 'Protéines' as const },
      'Riz blanc cuit':  { name: 'Riz blanc cuit',  totalGrams: 200, category: 'Glucides'  as const },
    }
    const grouped = groupShoppingList(flat)
    expect(grouped['Protéines']).toHaveLength(1)
    expect(grouped['Glucides']).toHaveLength(1)
    expect(grouped['Légumes']).toHaveLength(0)
  })

  it('trie les articles par ordre alphabétique dans chaque catégorie', () => {
    const flat = {
      'Saumon':          { name: 'Saumon',          totalGrams: 100, category: 'Protéines' as const },
      'Blanc de poulet': { name: 'Blanc de poulet', totalGrams: 150, category: 'Protéines' as const },
    }
    const grouped = groupShoppingList(flat)
    expect(grouped['Protéines'][0].name).toBe('Blanc de poulet')
    expect(grouped['Protéines'][1].name).toBe('Saumon')
  })
})

describe('shoppingListToText', () => {
  it('produit une chaîne lisible par un humain', () => {
    const grouped = groupShoppingList({
      'Blanc de poulet': { name: 'Blanc de poulet', totalGrams: 300, category: 'Protéines' as const },
    })
    const text = shoppingListToText(grouped)
    expect(text).toContain('Protéines')
    expect(text).toContain('Blanc de poulet')
    expect(text).toContain('300 g')
  })

  it('inclut le titre de la semaine si fourni', () => {
    const grouped = groupShoppingList({})
    const text = shoppingListToText(grouped, '26 mai 2025')
    expect(text).toContain('26 mai 2025')
  })

  it('n\'inclut pas les catégories vides', () => {
    const grouped = groupShoppingList({
      'Banane': { name: 'Banane', totalGrams: 100, category: 'Fruits' as const },
    })
    const text = shoppingListToText(grouped)
    expect(text).not.toContain('Protéines:')
    expect(text).toContain('Fruits:')
  })
})
