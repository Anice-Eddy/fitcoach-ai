'use client'
// Carte d'un repas — aliments, macros, bouton logger

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, Check, RefreshCw, Sun, Apple, Salad, Zap, Moon, Dumbbell } from 'lucide-react'
import type { Meal } from '@/types'
import { useNutritionStore } from '@/stores/nutritionStore'
import { FOOD_DATABASE } from '@/lib/nutrition/food-database'

const MEAL_ICONS: Record<string, React.ElementType> = {
  BREAKFAST:     Sun,
  MORNING_SNACK: Apple,
  LUNCH:         Salad,
  PRE_WORKOUT:   Zap,
  DINNER:        Moon,
  POST_WORKOUT:  Dumbbell,
}

const MEAL_COLORS: Record<string, string> = {
  BREAKFAST:     'text-amber-400',
  MORNING_SNACK: 'text-green-400',
  LUNCH:         'text-emerald-400',
  PRE_WORKOUT:   'text-yellow-400',
  DINNER:        'text-violet-400',
  POST_WORKOUT:  'text-sky-400',
}

interface Props { meal: Meal }

/** Expandable meal card showing food items and macros; toggling logs locally and in the cloud nutrition journal. */
export function MealCard({ meal }: Props) {
  const [expanded, setExpanded] = useState(false)
  const [substituteOpen, setSubstituteOpen] = useState(false)
  const { ensureTodayLog, toggleMeal, todayMeals } = useNutritionStore()
  useEffect(() => { ensureTodayLog() }, [ensureTodayLog])
  const isLogged = todayMeals.some((m) => m.mealId === meal.id)

  const handleLog = () => {
    const mealLog = {
      mealId:   meal.id,
      name:     meal.name,
      type:     meal.type,
      calories: Math.round(meal.totalCalories),
      proteinG: Math.round(meal.totalProteinG),
      carbsG:   Math.round(meal.totalCarbsG),
      fatG:     Math.round(meal.totalFatG),
      loggedAt: new Date().toISOString(),
    }
    toggleMeal(mealLog)

    // L'UI reste instantanée, puis l'API garde le journal fiable pour coach/dashboard/IA.
    const payload = {
      clientKey: `meal:${meal.id}`,
      source:    'PLANNED',
      mealType:  meal.type,
      name:      meal.name,
      calories:  Math.round(meal.totalCalories),
      proteinG:  Math.round(meal.totalProteinG),
      carbsG:    Math.round(meal.totalCarbsG),
      fatG:      Math.round(meal.totalFatG),
      items:     meal.foodItems.map(item => ({
        name:        item.name,
        gramsAmount: item.gramsAmount,
        calories:    item.calories,
        proteinG:    item.proteinG,
        carbsG:      item.carbsG,
        fatG:        item.fatG,
      })),
    }

    fetch('/api/user/nutrition/logs', {
      method:  isLogged ? 'DELETE' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(isLogged ? { clientKey: payload.clientKey } : payload),
    }).catch(() => {})
  }

  return (
    <motion.div
      layout
      animate={{ backgroundColor: isLogged ? 'rgba(200, 241, 53, 0.06)' : 'rgb(24, 24, 27)' }}
      className={`rounded-2xl border transition-colors ${isLogged ? 'border-[#C8F135]/30' : 'border-zinc-800'}`}
    >
      <button onClick={() => setExpanded(!expanded)} className="w-full flex items-center gap-3 p-4 text-left">
        {(() => { const Icon = MEAL_ICONS[meal.type] ?? Salad; return <Icon className={`size-5 ${MEAL_COLORS[meal.type] ?? 'text-zinc-400'}`} /> })()}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white truncate">{meal.name}</p>
          <p className="text-xs text-zinc-400">{meal.scheduledTime} · {Math.round(meal.totalCalories)} kcal</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <div className="hidden sm:flex gap-3 text-xs text-zinc-500">
            <span>P: {Math.round(meal.totalProteinG)}g</span>
            <span>G: {Math.round(meal.totalCarbsG)}g</span>
            <span>L: {Math.round(meal.totalFatG)}g</span>
          </div>
          <ChevronDown className={`size-4 text-zinc-500 transition-transform ${expanded ? 'rotate-180' : ''}`} />
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
            <div className="px-4 pb-4 space-y-3 border-t border-zinc-800 pt-3">
              {meal.foodItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between text-sm">
                  <span className="text-zinc-300">{item.name}</span>
                  <div className="flex items-center gap-3 text-xs text-zinc-500">
                    <span>{item.gramsAmount}g</span>
                    <span>{item.calories} kcal</span>
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={() => setSubstituteOpen(true)}
                aria-label={`Substituer un aliment du repas ${meal.name}`}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-700 py-2 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-white disabled:opacity-50"
              >
                <RefreshCw className="size-4" /> Substituer aliment
              </button>
              <button
                type="button"
                onClick={handleLog}
                aria-label={isLogged ? `Marquer ${meal.name} comme à faire` : `Marquer ${meal.name} comme terminé`}
                className={`w-full py-2 rounded-xl text-sm font-bold transition-colors ${
                  isLogged
                    ? 'bg-zinc-800 text-zinc-200 hover:bg-zinc-700'
                    : 'bg-[#C8F135] text-zinc-900 hover:bg-[#d4f54d]'
                }`}
              >
                {isLogged ? <><Check className="inline size-3.5 mr-1" />À faire</> : 'Marquer comme terminé'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {substituteOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
            <motion.div initial={{ y: 16 }} animate={{ y: 0 }} exit={{ y: 16 }} className="w-full max-w-md rounded-2xl border border-zinc-700 bg-zinc-900 p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h3 className="text-base font-medium text-white">Aliments équivalents</h3>
                <button type="button" onClick={() => setSubstituteOpen(false)} aria-label="Fermer les substitutions" className="rounded-lg px-2 py-1 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-white">Fermer</button>
              </div>
              <div className="space-y-2">
                {FOOD_DATABASE.slice(0, 6).map((food) => (
                  <button key={food.id} type="button" onClick={() => setSubstituteOpen(false)} aria-label={`Choisir ${food.name}`} className="w-full rounded-xl border border-zinc-800 bg-zinc-950 p-3 text-left transition-colors hover:border-[#C8F135]/50 hover:bg-zinc-800">
                    <p className="text-sm font-medium text-white">{food.name}</p>
                    <p className="mt-1 text-xs text-zinc-500">{food.calories} kcal · P {food.proteinG}g · G {food.carbsG}g · L {food.fatG}g / 100g</p>
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
