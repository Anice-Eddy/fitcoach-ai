// Weekly nutrition plan generator.
// Rotates 3 templates per meal across 7 days so each day has different meals.
// Respects dietary restrictions such as vegetarian, vegan, gluten-free, etc.

import type { NutritionPlan, Meal, FoodItem } from '@/types'
import { filterFoodsByRestrictions, foodDisplayName } from './food-database'
import { FOOD_DATABASE } from './food-database'

interface PlanParams {
  targetCalories:       number
  targetProteinG:       number
  targetCarbsG:         number
  targetFatG:           number
  fitnessGoal:          string
  dietaryRestrictions:  string[]
  locale?:              'fr' | 'en'
}

const DAY_NAMES: Record<NonNullable<PlanParams['locale']>, string[]> = {
  fr: ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'],
  en: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
}

const TEMPLATE_NAME_FR: Record<string, string> = {
  'Oats & yogurt': 'Flocons d\'avoine et yaourt',
  'Eggs & whole-grain bread': 'Œufs et pain complet',
  'Skyr & berries': 'Skyr et fruits rouges',
  'Almonds & apple': 'Amandes et pomme',
  'Yogurt & banana': 'Yaourt et banane',
  'Walnuts & pear': 'Noix et poire',
  'Chicken rice broccoli': 'Poulet, riz et brocoli',
  'Salmon quinoa spinach': 'Saumon, quinoa et épinards',
  'Turkey sweet potato': 'Dinde et patate douce',
  'Lentils rice vegetables': 'Lentilles, riz et légumes',
  'Tofu stir-fried rice': 'Tofu sauté et riz',
  'Chickpeas quinoa': 'Pois chiches et quinoa',
  'Banana & yogurt': 'Banane et yaourt',
  'Bread & peanut butter': 'Pain et beurre de cacahuète',
  'Oats & skyr': 'Flocons d\'avoine et skyr',
  'Salmon sweet potato spinach': 'Saumon, patate douce et épinards',
  'Cod rice vegetables': 'Cabillaud, riz et légumes',
  'Mackerel potato salad': 'Maquereau, pomme de terre et salade',
  'Tempeh sweet potato': 'Tempeh et patate douce',
  'Tofu beans rice': 'Tofu, haricots verts et riz',
  'Eggs zucchini cheese': 'Œufs, courgette et fromage',
}

// Builds a FoodItem from an id and a quantity in grams.
function makeFoodItem(foodId: string, grams: number, locale: NonNullable<PlanParams['locale']>): FoodItem | null {
  const food = FOOD_DATABASE.find((f) => f.id === foodId)
  if (!food) return null
  const factor = grams / 100
  return {
    id:          `${foodId}-${Math.random().toString(36).slice(2)}`,
    name:        foodDisplayName(food, locale),
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
  locale: NonNullable<PlanParams['locale']>,
): Meal {
  const foodItems = items
    .map(({ foodId, grams }) => makeFoodItem(foodId, grams, locale))
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

function templateName(name: string, locale: NonNullable<PlanParams['locale']>) {
  return locale === 'fr' ? (TEMPLATE_NAME_FR[name] ?? name) : name
}

// Meal-type templates.
// Three variants per meal rotate with template[day % 3].

const BREAKFAST_TEMPLATES: { name: string; items: { foodId: string; grams: number }[] }[] = [
  { name: 'Oats & yogurt',    items: [{ foodId: 'oats', grams: 80 }, { foodId: 'greek-yogurt', grams: 150 }, { foodId: 'banana', grams: 100 }] },
  { name: 'Eggs & whole-grain bread',items: [{ foodId: 'eggs', grams: 150 }, { foodId: 'bread-whole', grams: 60 }, { foodId: 'tomato', grams: 100 }] },
  { name: 'Skyr & berries',items: [{ foodId: 'skyr', grams: 200 }, { foodId: 'blueberry', grams: 80 }, { foodId: 'oats', grams: 40 }] },
]

const MORNING_SNACK_TEMPLATES: { name: string; items: { foodId: string; grams: number }[] }[] = [
  { name: 'Almonds & apple',    items: [{ foodId: 'almonds', grams: 30 }, { foodId: 'apple', grams: 150 }] },
  { name: 'Yogurt & banana',    items: [{ foodId: 'greek-yogurt', grams: 150 }, { foodId: 'banana', grams: 100 }] },
  { name: 'Walnuts & pear',       items: [{ foodId: 'walnuts', grams: 30 }, { foodId: 'pear', grams: 150 }] },
]

const LUNCH_TEMPLATES: { name: string; items: { foodId: string; grams: number }[] }[] = [
  { name: 'Chicken rice broccoli',   items: [{ foodId: 'chicken-breast', grams: 150 }, { foodId: 'rice-white', grams: 150 }, { foodId: 'broccoli', grams: 200 }, { foodId: 'olive-oil', grams: 10 }] },
  { name: 'Salmon quinoa spinach',items: [{ foodId: 'salmon', grams: 140 }, { foodId: 'quinoa', grams: 150 }, { foodId: 'spinach', grams: 100 }, { foodId: 'olive-oil', grams: 10 }] },
  { name: 'Turkey sweet potato',   items: [{ foodId: 'turkey-breast', grams: 150 }, { foodId: 'sweet-potato', grams: 200 }, { foodId: 'green-beans', grams: 150 }, { foodId: 'olive-oil', grams: 10 }] },
]

const LUNCH_VEGETARIAN_TEMPLATES: { name: string; items: { foodId: string; grams: number }[] }[] = [
  { name: 'Lentils rice vegetables', items: [{ foodId: 'lentils-cooked', grams: 150 }, { foodId: 'rice-brown', grams: 120 }, { foodId: 'carrot', grams: 100 }, { foodId: 'olive-oil', grams: 10 }] },
  { name: 'Tofu stir-fried rice',       items: [{ foodId: 'tofu-firm', grams: 150 }, { foodId: 'rice-white', grams: 150 }, { foodId: 'broccoli', grams: 150 }, { foodId: 'olive-oil', grams: 10 }] },
  { name: 'Chickpeas quinoa',   items: [{ foodId: 'chickpeas-cooked', grams: 150 }, { foodId: 'quinoa', grams: 150 }, { foodId: 'spinach', grams: 100 }, { foodId: 'olive-oil', grams: 10 }] },
]

const PRE_WORKOUT_TEMPLATES: { name: string; items: { foodId: string; grams: number }[] }[] = [
  { name: 'Banana & yogurt',     items: [{ foodId: 'banana', grams: 100 }, { foodId: 'greek-yogurt', grams: 100 }] },
  { name: 'Bread & peanut butter', items: [{ foodId: 'bread-whole', grams: 50 }, { foodId: 'peanut-butter', grams: 20 }] },
  { name: 'Oats & skyr',       items: [{ foodId: 'oats', grams: 60 }, { foodId: 'skyr', grams: 100 }, { foodId: 'strawberry', grams: 80 }] },
]

const DINNER_TEMPLATES: { name: string; items: { foodId: string; grams: number }[] }[] = [
  { name: 'Salmon sweet potato spinach',  items: [{ foodId: 'salmon', grams: 150 }, { foodId: 'sweet-potato', grams: 200 }, { foodId: 'spinach', grams: 100 }, { foodId: 'olive-oil', grams: 10 }] },
  { name: 'Cod rice vegetables',          items: [{ foodId: 'cod', grams: 180 }, { foodId: 'rice-brown', grams: 150 }, { foodId: 'zucchini', grams: 150 }, { foodId: 'olive-oil', grams: 10 }] },
  { name: 'Mackerel potato salad',items: [{ foodId: 'mackerel', grams: 140 }, { foodId: 'potato', grams: 200 }, { foodId: 'lettuce', grams: 80 }, { foodId: 'olive-oil', grams: 10 }] },
]

const DINNER_VEGETARIAN_TEMPLATES: { name: string; items: { foodId: string; grams: number }[] }[] = [
  { name: 'Tempeh sweet potato',   items: [{ foodId: 'tempeh', grams: 150 }, { foodId: 'sweet-potato', grams: 200 }, { foodId: 'spinach', grams: 100 }, { foodId: 'olive-oil', grams: 10 }] },
  { name: 'Tofu beans rice',     items: [{ foodId: 'tofu-firm', grams: 150 }, { foodId: 'green-beans', grams: 150 }, { foodId: 'rice-white', grams: 120 }, { foodId: 'olive-oil', grams: 10 }] },
  { name: 'Eggs zucchini cheese',items: [{ foodId: 'eggs', grams: 150 }, { foodId: 'zucchini', grams: 200 }, { foodId: 'mozzarella', grams: 60 }, { foodId: 'olive-oil', grams: 10 }] },
]

/** Returns the template for a given day using rotation (day % template count). */
function pickTemplate<T>(templates: T[], day: number): T {
  return templates[day % templates.length]
}

/** Checks whether all foods in a template are compatible with restrictions. */
function templateIsCompatible(
  items: { foodId: string }[],
  allowedIds: Set<string>,
): boolean {
  return items.every(({ foodId }) => allowedIds.has(foodId))
}

/** Generates a weekly nutrition plan (7 days x 5 meals) with rotation and restriction support. */
export function generateMealPlan(params: PlanParams): NutritionPlan {
  const { dietaryRestrictions = [], fitnessGoal, locale = 'fr' } = params

  // Build the set of allowed foods based on restrictions.
  const allowedFoods  = filterFoodsByRestrictions(dietaryRestrictions)
  const allowedIds    = new Set(allowedFoods.map(f => f.id))

  const isVegetarian = dietaryRestrictions.includes('VEGETARIAN') || dietaryRestrictions.includes('VEGAN')
  const isWeightLoss = fitnessGoal === 'WEIGHT_LOSS'
  const isMuscleGain = fitnessGoal === 'MUSCLE_GAIN'

  const meals: Meal[] = []

  for (let day = 0; day < 7; day++) {
    // --- Breakfast -----------------------------------------------------------
    const bk = pickTemplate(BREAKFAST_TEMPLATES, day)
    if (templateIsCompatible(bk.items, allowedIds)) {
      meals.push(buildMeal(day, 'BREAKFAST', `${templateName(bk.name, locale)} - ${DAY_NAMES[locale][day]}`, '07:30', bk.items, locale))
    } else {
      // Fallback: oats + fruit, compatible with every restriction set.
      meals.push(buildMeal(day, 'BREAKFAST', `${locale === 'fr' ? 'Petit-déjeuner' : 'Breakfast'} - ${DAY_NAMES[locale][day]}`, '07:30', [
        { foodId: 'oats', grams: 80 }, { foodId: 'banana', grams: 100 },
      ], locale))
    }

    // --- Morning snack, only for muscle gain or high-calorie targets ---------
    if (!isWeightLoss) {
      const sn = pickTemplate(MORNING_SNACK_TEMPLATES, day)
      const snCompatible = templateIsCompatible(sn.items, allowedIds)
      meals.push(buildMeal(day, 'MORNING_SNACK', `${locale === 'fr' ? 'Collation' : 'Snack'} - ${DAY_NAMES[locale][day]}`, '10:00',
        snCompatible ? sn.items : [{ foodId: 'apple', grams: 150 }],
        locale,
      ))
    }

    // --- Lunch ---------------------------------------------------------------
    const lunchTemplates = isVegetarian ? LUNCH_VEGETARIAN_TEMPLATES : LUNCH_TEMPLATES
    const ln = pickTemplate(lunchTemplates, day)
    const lnCompatible = templateIsCompatible(ln.items, allowedIds)
    meals.push(buildMeal(day, 'LUNCH', `${templateName(ln.name, locale)} - ${DAY_NAMES[locale][day]}`, '12:30',
      lnCompatible ? ln.items : [
        { foodId: isVegetarian ? 'lentils-cooked' : 'chicken-breast', grams: 150 },
        { foodId: 'rice-white', grams: 150 },
        { foodId: 'broccoli', grams: 200 },
      ],
      locale,
    ))

    // --- Pre-workout ---------------------------------------------------------
    const pw = pickTemplate(PRE_WORKOUT_TEMPLATES, day)
    const pwCompatible = templateIsCompatible(pw.items, allowedIds)
    meals.push(buildMeal(day, 'PRE_WORKOUT', `${locale === 'fr' ? 'Pré-entraînement' : 'Pre-workout'} - ${DAY_NAMES[locale][day]}`, '16:00',
      pwCompatible ? pw.items : [{ foodId: 'banana', grams: 120 }],
      locale,
    ))

    // --- Dinner --------------------------------------------------------------
    const dinnerTemplates = isVegetarian ? DINNER_VEGETARIAN_TEMPLATES : DINNER_TEMPLATES
    const dn = pickTemplate(dinnerTemplates, day)
    const dnCompatible = templateIsCompatible(dn.items, allowedIds)
    // Saturday and Sunday: slightly richer meals for muscle gain or lighter meals for weight loss.
    const dinnerProtein = isMuscleGain ? (day >= 5 ? 180 : 150) : isWeightLoss ? 130 : 150
    meals.push(buildMeal(day, 'DINNER', `${templateName(dn.name, locale)} - ${DAY_NAMES[locale][day]}`, '19:30',
      dnCompatible
        ? dn.items.map(item => item.foodId === dn.items[0].foodId ? { ...item, grams: dinnerProtein } : item)
        : [
          { foodId: isVegetarian ? 'tofu-firm' : 'salmon', grams: dinnerProtein },
          { foodId: 'sweet-potato', grams: 200 },
          { foodId: 'spinach', grams: 100 },
        ],
      locale,
    ))
  }

  const weekStartDate = new Date()
  weekStartDate.setDate(weekStartDate.getDate() - weekStartDate.getDay() + 1)

  return {
    id:             `plan-${Date.now()}`,
    name:           locale === 'en' ? 'My nutrition plan' : 'Mon plan nutritionnel',
    targetCalories: params.targetCalories,
    targetProteinG: params.targetProteinG,
    targetCarbsG:   params.targetCarbsG,
    targetFatG:     params.targetFatG,
    weekStartDate:  weekStartDate.toISOString(),
    isActive:       true,
    meals,
  }
}
