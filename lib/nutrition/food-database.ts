// Base de données alimentaire — 20 aliments courants avec macros réels (pour 100g)

export interface FoodDB {
  id:       string
  name:     string
  brand?:   string
  calories: number  // kcal/100g
  proteinG: number
  carbsG:   number
  fatG:     number
  fiberG:   number
  category: 'protein' | 'carb' | 'fat' | 'vegetable' | 'fruit' | 'dairy'
}

export const FOOD_DATABASE: FoodDB[] = [
  { id: 'chicken-breast',   name: 'Blanc de poulet',       calories: 165, proteinG: 31, carbsG: 0,  fatG: 3.6, fiberG: 0,   category: 'protein' },
  { id: 'salmon',           name: 'Saumon',                calories: 208, proteinG: 20, carbsG: 0,  fatG: 13,  fiberG: 0,   category: 'protein' },
  { id: 'eggs',             name: 'Œufs entiers',          calories: 155, proteinG: 13, carbsG: 1,  fatG: 11,  fiberG: 0,   category: 'protein' },
  { id: 'whey',             name: 'Whey protéine',         calories: 380, proteinG: 80, carbsG: 5,  fatG: 5,   fiberG: 0,   category: 'protein', brand: 'Générique' },
  { id: 'tuna',             name: 'Thon en conserve',      calories: 116, proteinG: 26, carbsG: 0,  fatG: 1,   fiberG: 0,   category: 'protein' },
  { id: 'rice',             name: 'Riz blanc cuit',        calories: 130, proteinG: 2.7,carbsG: 28, fatG: 0.3, fiberG: 0.4, category: 'carb' },
  { id: 'oats',             name: 'Flocons d\'avoine',     calories: 389, proteinG: 17, carbsG: 66, fatG: 7,   fiberG: 11,  category: 'carb' },
  { id: 'pasta',            name: 'Pâtes cuites',          calories: 158, proteinG: 6,  carbsG: 31, fatG: 0.9, fiberG: 1.8, category: 'carb' },
  { id: 'potato',           name: 'Pomme de terre cuite',  calories: 87,  proteinG: 1.9,carbsG: 20, fatG: 0.1, fiberG: 1.8, category: 'carb' },
  { id: 'sweet-potato',     name: 'Patate douce cuite',    calories: 86,  proteinG: 1.6,carbsG: 20, fatG: 0.1, fiberG: 3,   category: 'carb' },
  { id: 'olive-oil',        name: 'Huile d\'olive',        calories: 884, proteinG: 0,  carbsG: 0,  fatG: 100, fiberG: 0,   category: 'fat' },
  { id: 'almonds',          name: 'Amandes',               calories: 579, proteinG: 21, carbsG: 22, fatG: 50,  fiberG: 12,  category: 'fat' },
  { id: 'avocado',          name: 'Avocat',                calories: 160, proteinG: 2,  carbsG: 9,  fatG: 15,  fiberG: 7,   category: 'fat' },
  { id: 'broccoli',         name: 'Brocoli cuit',          calories: 35,  proteinG: 2.4,carbsG: 7,  fatG: 0.4, fiberG: 2.6, category: 'vegetable' },
  { id: 'spinach',          name: 'Épinards',              calories: 23,  proteinG: 2.9,carbsG: 3.6,fatG: 0.4, fiberG: 2.2, category: 'vegetable' },
  { id: 'banana',           name: 'Banane',                calories: 89,  proteinG: 1.1,carbsG: 23, fatG: 0.3, fiberG: 2.6, category: 'fruit' },
  { id: 'apple',            name: 'Pomme',                 calories: 52,  proteinG: 0.3,carbsG: 14, fatG: 0.2, fiberG: 2.4, category: 'fruit' },
  { id: 'greek-yogurt',     name: 'Yaourt grec (0%)',      calories: 59,  proteinG: 10, carbsG: 3.6,fatG: 0.4, fiberG: 0,   category: 'dairy' },
  { id: 'cottage-cheese',   name: 'Fromage blanc (0%)',    calories: 72,  proteinG: 12, carbsG: 3.4,fatG: 0.4, fiberG: 0,   category: 'dairy' },
  { id: 'milk',             name: 'Lait demi-écrémé',      calories: 46,  proteinG: 3.4,carbsG: 4.7,fatG: 1.5, fiberG: 0,   category: 'dairy' },
]

export function calculateFoodMacros(foodId: string, grams: number) {
  const food = FOOD_DATABASE.find((f) => f.id === foodId)
  if (!food) return null
  const factor = grams / 100
  return {
    name:     food.name,
    calories: Math.round(food.calories * factor),
    proteinG: Math.round(food.proteinG * factor * 10) / 10,
    carbsG:   Math.round(food.carbsG * factor * 10) / 10,
    fatG:     Math.round(food.fatG * factor * 10) / 10,
  }
}
