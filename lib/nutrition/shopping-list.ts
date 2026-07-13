import type { Meal } from '@/types'
import type { Locale } from '@/lib/i18n'
import { findFoodByAnyName, foodDisplayName } from './food-database'

export type FoodCategory = 'protein' | 'carb' | 'fat' | 'vegetable' | 'fruit' | 'dairy' | 'other'

export interface ShoppingItem {
  name:       string
  totalGrams: number
  category:   FoodCategory
}

export type GroupedShoppingList = Record<FoodCategory, ShoppingItem[]>

const CATEGORY_MAP: Record<string, FoodCategory> = {
  protein:   'protein',
  carb:      'carb',
  fat:       'fat',
  vegetable: 'vegetable',
  fruit:     'fruit',
  dairy:     'dairy',
}

const CATEGORY_ORDER: FoodCategory[] = [
  'protein', 'carb', 'dairy', 'vegetable', 'fruit', 'fat', 'other',
]

const CATEGORY_LABELS: Record<Locale, Record<FoodCategory, string>> = {
  fr: {
    protein:   'Protéines',
    carb:      'Glucides',
    fat:       'Lipides',
    vegetable: 'Légumes',
    fruit:     'Fruits',
    dairy:     'Produits laitiers',
    other:     'Autres',
  },
  en: {
    protein:   'Protein',
    carb:      'Carbs',
    fat:       'Fats',
    vegetable: 'Vegetables',
    fruit:     'Fruits',
    dairy:     'Dairy',
    other:     'Other',
  },
}

/** Keeps stable category keys while exposing localized labels for user-facing exports. */
export function foodCategoryLabel(category: FoodCategory, locale: Locale = 'en'): string {
  return CATEGORY_LABELS[locale]?.[category] ?? category
}

/** Aggregates food items from meals into a flat map, looking up categories from the food database. */
export function generateShoppingList(meals: Meal[]): Record<string, ShoppingItem> {
  const list: Record<string, ShoppingItem> = {}

  for (const meal of meals) {
    for (const item of meal.foodItems) {
      const dbEntry = findFoodByAnyName(item.name)
      const category: FoodCategory = dbEntry ? (CATEGORY_MAP[dbEntry.category] ?? 'other') : 'other'

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
    const cat = item.category ?? 'other'
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
export function shoppingListToText(grouped: GroupedShoppingList, weekOf?: string, locale: Locale = 'en'): string {
  const title = locale === 'fr' ? 'Liste de courses' : 'Shopping list'
  const weekLabel = locale === 'fr' ? 'semaine du' : 'week of'
  const header = weekOf ? `${title} - ${weekLabel} ${weekOf}\n${'='.repeat(40)}\n` : `${title}\n${'='.repeat(40)}\n`
  const body = CATEGORY_ORDER
    .filter(cat => grouped[cat]?.length > 0)
    .map(cat => {
      const lines = grouped[cat].map(i => `  - ${foodDisplayName(i.name, locale)} (${Math.round(i.totalGrams)} g)`)
      return `${foodCategoryLabel(cat, locale)}:\n${lines.join('\n')}`
    })
    .join('\n\n')

  return header + body
}
