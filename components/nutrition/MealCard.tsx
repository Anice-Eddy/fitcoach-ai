'use client'
// Carte d'un repas — aliments, macros, bouton logger

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, Check } from 'lucide-react'
import type { Meal } from '@/types'
import { useNutritionStore } from '@/stores/nutritionStore'

const MEAL_EMOJIS: Record<string, string> = {
  BREAKFAST: '🌅', MORNING_SNACK: '🍎', LUNCH: '🥗',
  PRE_WORKOUT: '⚡', DINNER: '🍽️', POST_WORKOUT: '🥛',
}

interface Props { meal: Meal }

export function MealCard({ meal }: Props) {
  const [expanded, setExpanded] = useState(false)
  const { logMeal, todayMeals } = useNutritionStore()
  const isLogged = todayMeals.some((m) => m.mealId === meal.id)

  const handleLog = () => {
    logMeal({
      mealId:   meal.id,
      name:     meal.name,
      type:     meal.type,
      calories: Math.round(meal.totalCalories),
      proteinG: Math.round(meal.totalProteinG),
      carbsG:   Math.round(meal.totalCarbsG),
      fatG:     Math.round(meal.totalFatG),
      loggedAt: new Date().toISOString(),
    })
  }

  return (
    <div className={`rounded-2xl border transition-colors ${isLogged ? 'border-[#C8F135]/30 bg-[#C8F135]/5' : 'border-zinc-800 bg-zinc-900'}`}>
      <button onClick={() => setExpanded(!expanded)} className="w-full flex items-center gap-3 p-4 text-left">
        <span className="text-2xl">{MEAL_EMOJIS[meal.type] ?? '🍴'}</span>
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
                onClick={handleLog}
                disabled={isLogged}
                className={`w-full py-2 rounded-xl text-sm font-bold transition-colors ${
                  isLogged
                    ? 'bg-[#C8F135]/10 text-[#C8F135] border border-[#C8F135]/30 cursor-default'
                    : 'bg-[#C8F135] text-zinc-900 hover:bg-[#d4f54d]'
                }`}
              >
                {isLogged ? <><Check className="inline size-3.5 mr-1" />Consommé</> : 'Marquer consommé'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
