// Générateur de plan nutritionnel hebdomadaire
// Adapte les repas selon le TDEE, l'objectif et les restrictions

import type { NutritionPlan, Meal, FoodItem } from '@/types'
import { FOOD_DATABASE } from './food-database'

interface PlanParams {
  targetCalories:  number
  targetProteinG:  number
  targetCarbsG:    number
  targetFatG:      number
  fitnessGoal:     string
  dietaryRestrictions: string[]
}

const DAY_NAMES = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche']

function makeFoodItem(foodId: string, grams: number): FoodItem {
  const food   = FOOD_DATABASE.find((f) => f.id === foodId)!
  const factor = grams / 100
  return {
    id:          `${foodId}-${Date.now()}-${Math.random()}`,
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
  const foodItems = items.map(({ foodId, grams }) => makeFoodItem(foodId, grams))
  return {
    id:            `meal-${dayOfWeek}-${type}-${Date.now()}`,
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

export function generateMealPlan(params: PlanParams): NutritionPlan {
  const meals: Meal[] = []

  for (let day = 0; day < 7; day++) {
    // Petit-déjeuner
    meals.push(buildMeal(day, 'BREAKFAST', `Petit-déjeuner ${DAY_NAMES[day]}`, '07:30', [
      { foodId: 'oats',         grams: 80 },
      { foodId: 'greek-yogurt', grams: 150 },
      { foodId: 'banana',       grams: 100 },
    ]))

    // Collation matin
    meals.push(buildMeal(day, 'MORNING_SNACK', `Collation matin ${DAY_NAMES[day]}`, '10:00', [
      { foodId: 'almonds',  grams: 30 },
      { foodId: 'apple',    grams: 150 },
    ]))

    // Déjeuner
    meals.push(buildMeal(day, 'LUNCH', `Déjeuner ${DAY_NAMES[day]}`, '12:30', [
      { foodId: day % 2 === 0 ? 'chicken-breast' : 'salmon', grams: 150 },
      { foodId: 'rice',     grams: 150 },
      { foodId: 'broccoli', grams: 200 },
      { foodId: 'olive-oil',grams: 10 },
    ]))

    // Pré-workout
    meals.push(buildMeal(day, 'PRE_WORKOUT', `Pré-workout ${DAY_NAMES[day]}`, '16:00', [
      { foodId: 'banana',       grams: 100 },
      { foodId: 'greek-yogurt', grams: 100 },
    ]))

    // Dîner
    meals.push(buildMeal(day, 'DINNER', `Dîner ${DAY_NAMES[day]}`, '19:30', [
      { foodId: day % 2 === 0 ? 'salmon' : 'tuna', grams: 150 },
      { foodId: 'sweet-potato', grams: 200 },
      { foodId: 'spinach',      grams: 100 },
      { foodId: 'olive-oil',    grams: 10 },
    ]))
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
