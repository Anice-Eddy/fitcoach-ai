// Générateur de plan nutritionnel hebdomadaire
// Rotation sur 3 templates par repas × 7 jours — chaque jour a des repas différents.
// Respecte les restrictions alimentaires (végétarien, vegan, sans gluten, etc.)

import type { NutritionPlan, Meal, FoodItem } from '@/types'
import { filterFoodsByRestrictions } from './food-database'
import { FOOD_DATABASE } from './food-database'

interface PlanParams {
  targetCalories:       number
  targetProteinG:       number
  targetCarbsG:         number
  targetFatG:           number
  fitnessGoal:          string
  dietaryRestrictions:  string[]
}

const DAY_NAMES = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche']

// Construit un FoodItem à partir d'un id et d'une quantité en grammes.
function makeFoodItem(foodId: string, grams: number): FoodItem | null {
  const food = FOOD_DATABASE.find((f) => f.id === foodId)
  if (!food) return null
  const factor = grams / 100
  return {
    id:          `${foodId}-${Math.random().toString(36).slice(2)}`,
    name:        food.name,
    gramsAmount: grams,
    calories:    Math.round(food.calories * factor),
    proteinG:    Math.round(food.proteinG * factor * 10) / 10,
    carbsG:      Math.round(food.carbsG * factor * 10) / 10,
    fatG:        Math.round(food.fatG * factor * 10) / 10,
  }
}

function buildMeal(
  dayOfWeek: number,
  type: Meal['type'],
  name: string,
  time: string,
  items: { foodId: string; grams: number }[],
): Meal {
  const foodItems = items
    .map(({ foodId, grams }) => makeFoodItem(foodId, grams))
    .filter((f): f is FoodItem => f !== null)
  return {
    id:            `meal-${dayOfWeek}-${type}-${Date.now()}-${Math.random()}`,
    dayOfWeek,
    type,
    name,
    scheduledTime: time,
    totalCalories: foodItems.reduce((a, f) => a + f.calories, 0),
    totalProteinG: foodItems.reduce((a, f) => a + f.proteinG, 0),
    totalCarbsG:   foodItems.reduce((a, f) => a + f.carbsG, 0),
    totalFatG:     foodItems.reduce((a, f) => a + f.fatG, 0),
    isLogged:      false,
    foodItems,
  }
}

// ── Templates par type de repas ────────────────────────────────────────────
// 3 variantes par repas pour la rotation. Chaque jour utilise template[day % 3].

const BREAKFAST_TEMPLATES: { name: string; items: { foodId: string; grams: number }[] }[] = [
  { name: 'Avoine & yaourt',    items: [{ foodId: 'oats', grams: 80 }, { foodId: 'greek-yogurt', grams: 150 }, { foodId: 'banana', grams: 100 }] },
  { name: 'Œufs & pain complet',items: [{ foodId: 'eggs', grams: 150 }, { foodId: 'bread-whole', grams: 60 }, { foodId: 'tomato', grams: 100 }] },
  { name: 'Skyr & fruits rouges',items: [{ foodId: 'skyr', grams: 200 }, { foodId: 'blueberry', grams: 80 }, { foodId: 'oats', grams: 40 }] },
]

const MORNING_SNACK_TEMPLATES: { name: string; items: { foodId: string; grams: number }[] }[] = [
  { name: 'Amandes & pomme',    items: [{ foodId: 'almonds', grams: 30 }, { foodId: 'apple', grams: 150 }] },
  { name: 'Yaourt & banane',    items: [{ foodId: 'greek-yogurt', grams: 150 }, { foodId: 'banana', grams: 100 }] },
  { name: 'Noix & poire',       items: [{ foodId: 'walnuts', grams: 30 }, { foodId: 'pear', grams: 150 }] },
]

const LUNCH_TEMPLATES: { name: string; items: { foodId: string; grams: number }[] }[] = [
  { name: 'Poulet riz brocoli',   items: [{ foodId: 'chicken-breast', grams: 150 }, { foodId: 'rice-white', grams: 150 }, { foodId: 'broccoli', grams: 200 }, { foodId: 'olive-oil', grams: 10 }] },
  { name: 'Saumon quinoa épinards',items: [{ foodId: 'salmon', grams: 140 }, { foodId: 'quinoa', grams: 150 }, { foodId: 'spinach', grams: 100 }, { foodId: 'olive-oil', grams: 10 }] },
  { name: 'Dinde patate douce',   items: [{ foodId: 'turkey-breast', grams: 150 }, { foodId: 'sweet-potato', grams: 200 }, { foodId: 'green-beans', grams: 150 }, { foodId: 'olive-oil', grams: 10 }] },
]

const LUNCH_VEGETARIAN_TEMPLATES: { name: string; items: { foodId: string; grams: number }[] }[] = [
  { name: 'Lentilles riz légumes', items: [{ foodId: 'lentils-cooked', grams: 150 }, { foodId: 'rice-brown', grams: 120 }, { foodId: 'carrot', grams: 100 }, { foodId: 'olive-oil', grams: 10 }] },
  { name: 'Tofu riz sauté',       items: [{ foodId: 'tofu-firm', grams: 150 }, { foodId: 'rice-white', grams: 150 }, { foodId: 'broccoli', grams: 150 }, { foodId: 'olive-oil', grams: 10 }] },
  { name: 'Pois chiches quinoa',   items: [{ foodId: 'chickpeas-cooked', grams: 150 }, { foodId: 'quinoa', grams: 150 }, { foodId: 'spinach', grams: 100 }, { foodId: 'olive-oil', grams: 10 }] },
]

const PRE_WORKOUT_TEMPLATES: { name: string; items: { foodId: string; grams: number }[] }[] = [
  { name: 'Banane & yaourt',     items: [{ foodId: 'banana', grams: 100 }, { foodId: 'greek-yogurt', grams: 100 }] },
  { name: 'Pain & beurre de cacahuète', items: [{ foodId: 'bread-whole', grams: 50 }, { foodId: 'peanut-butter', grams: 20 }] },
  { name: 'Avoine & skyr',       items: [{ foodId: 'oats', grams: 60 }, { foodId: 'skyr', grams: 100 }, { foodId: 'strawberry', grams: 80 }] },
]

const DINNER_TEMPLATES: { name: string; items: { foodId: string; grams: number }[] }[] = [
  { name: 'Saumon patate douce épinards',  items: [{ foodId: 'salmon', grams: 150 }, { foodId: 'sweet-potato', grams: 200 }, { foodId: 'spinach', grams: 100 }, { foodId: 'olive-oil', grams: 10 }] },
  { name: 'Cabillaud riz légumes',          items: [{ foodId: 'cod', grams: 180 }, { foodId: 'rice-brown', grams: 150 }, { foodId: 'zucchini', grams: 150 }, { foodId: 'olive-oil', grams: 10 }] },
  { name: 'Maquereau pomme de terre salade',items: [{ foodId: 'mackerel', grams: 140 }, { foodId: 'potato', grams: 200 }, { foodId: 'lettuce', grams: 80 }, { foodId: 'olive-oil', grams: 10 }] },
]

const DINNER_VEGETARIAN_TEMPLATES: { name: string; items: { foodId: string; grams: number }[] }[] = [
  { name: 'Tempeh patate douce',   items: [{ foodId: 'tempeh', grams: 150 }, { foodId: 'sweet-potato', grams: 200 }, { foodId: 'spinach', grams: 100 }, { foodId: 'olive-oil', grams: 10 }] },
  { name: 'Tofu haricots riz',     items: [{ foodId: 'tofu-firm', grams: 150 }, { foodId: 'green-beans', grams: 150 }, { foodId: 'rice-white', grams: 120 }, { foodId: 'olive-oil', grams: 10 }] },
  { name: 'Œufs courgette fromage',items: [{ foodId: 'eggs', grams: 150 }, { foodId: 'zucchini', grams: 200 }, { foodId: 'mozzarella', grams: 60 }, { foodId: 'olive-oil', grams: 10 }] },
]

/** Retourne le template pour un jour donné en utilisant la rotation (day % nb_templates). */
function pickTemplate<T>(templates: T[], day: number): T {
  return templates[day % templates.length]
}

/** Vérifie si tous les aliments d'un template sont compatibles avec les restrictions. */
function templateIsCompatible(
  items: { foodId: string }[],
  allowedIds: Set<string>,
): boolean {
  return items.every(({ foodId }) => allowedIds.has(foodId))
}

/** Génère un plan nutritionnel hebdomadaire (7 jours × 5 repas) avec rotation et respect des restrictions. */
export function generateMealPlan(params: PlanParams): NutritionPlan {
  const { dietaryRestrictions = [], fitnessGoal } = params

  // Construire l'ensemble des aliments autorisés selon les restrictions
  const allowedFoods  = filterFoodsByRestrictions(dietaryRestrictions)
  const allowedIds    = new Set(allowedFoods.map(f => f.id))

  const isVegetarian = dietaryRestrictions.includes('VEGETARIAN') || dietaryRestrictions.includes('VEGAN')
  const isWeightLoss = fitnessGoal === 'WEIGHT_LOSS'
  const isMuscleGain = fitnessGoal === 'MUSCLE_GAIN'

  const meals: Meal[] = []

  for (let day = 0; day < 7; day++) {
    // ── Petit-déjeuner ────────────────────────────────────────────────────
    const bk = pickTemplate(BREAKFAST_TEMPLATES, day)
    if (templateIsCompatible(bk.items, allowedIds)) {
      meals.push(buildMeal(day, 'BREAKFAST', `${bk.name} — ${DAY_NAMES[day]}`, '07:30', bk.items))
    } else {
      // Fallback : flocons d'avoine + fruit (compatible avec tout)
      meals.push(buildMeal(day, 'BREAKFAST', `Petit-déjeuner — ${DAY_NAMES[day]}`, '07:30', [
        { foodId: 'oats', grams: 80 }, { foodId: 'banana', grams: 100 },
      ]))
    }

    // ── Collation matin (uniquement si objectif muscu ou calories élevées) ──
    if (!isWeightLoss) {
      const sn = pickTemplate(MORNING_SNACK_TEMPLATES, day)
      const snCompatible = templateIsCompatible(sn.items, allowedIds)
      meals.push(buildMeal(day, 'MORNING_SNACK', `Collation — ${DAY_NAMES[day]}`, '10:00',
        snCompatible ? sn.items : [{ foodId: 'apple', grams: 150 }],
      ))
    }

    // ── Déjeuner ──────────────────────────────────────────────────────────
    const lunchTemplates = isVegetarian ? LUNCH_VEGETARIAN_TEMPLATES : LUNCH_TEMPLATES
    const ln = pickTemplate(lunchTemplates, day)
    const lnCompatible = templateIsCompatible(ln.items, allowedIds)
    meals.push(buildMeal(day, 'LUNCH', `${ln.name} — ${DAY_NAMES[day]}`, '12:30',
      lnCompatible ? ln.items : [
        { foodId: isVegetarian ? 'lentils-cooked' : 'chicken-breast', grams: 150 },
        { foodId: 'rice-white', grams: 150 },
        { foodId: 'broccoli', grams: 200 },
      ],
    ))

    // ── Pré-workout ───────────────────────────────────────────────────────
    const pw = pickTemplate(PRE_WORKOUT_TEMPLATES, day)
    const pwCompatible = templateIsCompatible(pw.items, allowedIds)
    meals.push(buildMeal(day, 'PRE_WORKOUT', `Pré-workout — ${DAY_NAMES[day]}`, '16:00',
      pwCompatible ? pw.items : [{ foodId: 'banana', grams: 120 }],
    ))

    // ── Dîner ─────────────────────────────────────────────────────────────
    const dinnerTemplates = isVegetarian ? DINNER_VEGETARIAN_TEMPLATES : DINNER_TEMPLATES
    const dn = pickTemplate(dinnerTemplates, day)
    const dnCompatible = templateIsCompatible(dn.items, allowedIds)
    // Le samedi et dimanche : repas un peu plus riche (muscle gain) ou allégé (weight loss)
    const dinnerProtein = isMuscleGain ? (day >= 5 ? 180 : 150) : isWeightLoss ? 130 : 150
    meals.push(buildMeal(day, 'DINNER', `${dn.name} — ${DAY_NAMES[day]}`, '19:30',
      dnCompatible
        ? dn.items.map(item => item.foodId === dn.items[0].foodId ? { ...item, grams: dinnerProtein } : item)
        : [
          { foodId: isVegetarian ? 'tofu-firm' : 'salmon', grams: dinnerProtein },
          { foodId: 'sweet-potato', grams: 200 },
          { foodId: 'spinach', grams: 100 },
        ],
    ))
  }

  const weekStartDate = new Date()
  weekStartDate.setDate(weekStartDate.getDate() - weekStartDate.getDay() + 1)

  return {
    id:             `plan-${Date.now()}`,
    name:           'Mon plan nutritionnel',
    targetCalories: params.targetCalories,
    targetProteinG: params.targetProteinG,
    targetCarbsG:   params.targetCarbsG,
    targetFatG:     params.targetFatG,
    weekStartDate:  weekStartDate.toISOString(),
    isActive:       true,
    meals,
  }
}
