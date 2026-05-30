import type { Meal } from '@/types'
import { FOOD_DATABASE } from './food-database'

export type FoodCategory = 'Protéines' | 'Glucides' | 'Lipides' | 'Légumes' | 'Fruits' | 'Produits laitiers' | 'Autres'

export interface ShoppingItem {
  name:       string
  totalGrams: number
  category:   FoodCategory
}

export type GroupedShoppingList = Record<FoodCategory, ShoppingItem[]>

const CATEGORY_MAP: Record<string, FoodCategory> = {
  protein:   'Protéines',
  carb:      'Glucides',
  fat:       'Lipides',
  vegetable: 'Légumes',
  fruit:     'Fruits',
  dairy:     'Produits laitiers',
}

const CATEGORY_ORDER: FoodCategory[] = [
  'Protéines', 'Glucides', 'Produits laitiers', 'Légumes', 'Fruits', 'Lipides', 'Autres',
]

/** Aggregates food items from meals into a flat map, looking up categories from the food database. */
export function generateShoppingList(meals: Meal[]): Record<string, ShoppingItem> {
  const list: Record<string, ShoppingItem> = {}

  for (const meal of meals) {
    for (const item of meal.foodItems) {
      const dbEntry = FOOD_DATABASE.find(f => f.name === item.name)
      const category: FoodCategory = dbEntry ? (CATEGORY_MAP[dbEntry.category] ?? 'Autres') : 'Autres'

      if (list[item.name]) {
        list[item.name].totalGrams += item.gramsAmount
      } else {
        list[item.name] = { name: item.name, totalGrams: item.gramsAmount, category }
      }
    }
  }

  return list
}

/** Groups a flat shopping list by food category, sorted in CATEGORY_ORDER. */
export function groupShoppingList(items: Record<string, ShoppingItem>): GroupedShoppingList {
  const grouped = {} as GroupedShoppingList
  for (const cat of CATEGORY_ORDER) grouped[cat] = []

  for (const item of Object.values(items)) {
    const cat = item.category ?? 'Autres'
    if (!grouped[cat]) grouped[cat] = []
    grouped[cat].push(item)
  }

  // Sort alphabetically within each category
  for (const cat of CATEGORY_ORDER) {
    grouped[cat].sort((a, b) => a.name.localeCompare(b.name, 'fr'))
  }

  return grouped
}

/** Formats the grouped shopping list as a plain-text string suitable for copy/download. */
export function shoppingListToText(grouped: GroupedShoppingList, weekOf?: string): string {
  const header = weekOf ? `Liste de courses — semaine du ${weekOf}\n${'='.repeat(40)}\n` : `Liste de courses\n${'='.repeat(40)}\n`
  const body = CATEGORY_ORDER
    .filter(cat => grouped[cat]?.length > 0)
    .map(cat => {
      const lines = grouped[cat].map(i => `  - ${i.name} (${Math.round(i.totalGrams)} g)`)
      return `${cat}:\n${lines.join('\n')}`
    })
    .join('\n\n')

  return header + body
}
