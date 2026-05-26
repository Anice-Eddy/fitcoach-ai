'use client'
// Client page nutrition — génère et affiche le plan hebdomadaire

import { useEffect, useState } from 'react'
import { useUserStore }        from '@/stores/userStore'
import { generateMealPlan }    from '@/lib/nutrition/generate-meal-plan'
import { getMealsForDay, sumMacros } from '@/lib/nutrition/macro-calculator'
import { MealCard }            from '@/components/nutrition/MealCard'
import { MacroRing }           from '@/components/ui/MacroRing'
import { ProgressBar }         from '@/components/ui/ProgressBar'
import { ListSkeleton }        from '@/components/ui/LoadingSkeleton'
import type { NutritionPlan } from '@/types'
import Link from 'next/link'
import { ShoppingCart } from 'lucide-react'

const DAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

export function NutritionClient() {
  const { profile }  = useUserStore()
  const [plan, setPlan]       = useState<NutritionPlan | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedDay, setDay] = useState(() => {
    const d = new Date().getDay()
    return d === 0 ? 6 : d - 1 // Convertit 0=dimanche en 6
  })

  useEffect(() => {
    if (!profile) { setLoading(false); return }
    const generated = generateMealPlan({
      targetCalories:      profile.recommendedCalories ?? 2000,
      targetProteinG:      profile.recommendedProteinG ?? 150,
      targetCarbsG:        profile.recommendedCarbsG ?? 200,
      targetFatG:          profile.recommendedFatG ?? 65,
      fitnessGoal:         profile.fitnessGoal,
      dietaryRestrictions: profile.dietaryRestrictions,
    })
    setPlan(generated)
    setLoading(false)
  }, [profile])

  if (loading) return <ListSkeleton rows={5} />

  const todayMeals = plan ? getMealsForDay(plan.meals, selectedDay) : []
  const todayTotals = sumMacros(todayMeals)
  const availableDays = 7

  return (
    <div className="space-y-6">
      {/* Résumé macros du jour */}
      {plan && (
        <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-white">Résumé du jour</h2>
              <p className="text-xs text-zinc-400 mt-0.5">Objectif : {Math.round(plan.targetCalories)} kcal</p>
            </div>
            <Link href="/nutrition/shopping-list"
              className="flex items-center gap-1.5 text-xs text-[#C8F135] hover:underline"
            >
              <ShoppingCart className="size-3.5" /> Liste de courses
            </Link>
          </div>
          <MacroRing
            proteinG={Math.round(todayTotals.proteinG)}
            carbsG={Math.round(todayTotals.carbsG)}
            fatG={Math.round(todayTotals.fatG)}
            targetCalories={Math.round(plan.targetCalories)}
          />
          <div className="space-y-2 mt-4">
            <ProgressBar value={todayTotals.proteinG} max={plan.targetProteinG} label="Protéines" sublabel={`${Math.round(todayTotals.proteinG)}/${Math.round(plan.targetProteinG)}g`} color="#C8F135" size="sm" />
            <ProgressBar value={todayTotals.carbsG}   max={plan.targetCarbsG}   label="Glucides"  sublabel={`${Math.round(todayTotals.carbsG)}/${Math.round(plan.targetCarbsG)}g`}   color="#38bdf8" size="sm" />
            <ProgressBar value={todayTotals.fatG}     max={plan.targetFatG}     label="Lipides"   sublabel={`${Math.round(todayTotals.fatG)}/${Math.round(plan.targetFatG)}g`}     color="#f472b6" size="sm" />
          </div>
        </div>
      )}

      {/* Sélecteur de jour */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {DAYS.slice(0, availableDays).map((day, i) => (
          <button key={i} onClick={() => setDay(i)}
            className={`flex-1 min-w-[44px] py-2 rounded-xl text-xs font-medium transition-colors ${
              selectedDay === i ? 'bg-[#C8F135] text-zinc-900' : 'bg-zinc-800 text-zinc-400 hover:text-white'
            }`}
          >{day}</button>
        ))}
      </div>

      {/* Repas du jour */}
      <div className="space-y-3">
        {todayMeals.length === 0 ? (
          <p className="text-sm text-zinc-400 text-center py-8">Aucun repas planifié pour ce jour.</p>
        ) : (
          todayMeals.map((meal) => <MealCard key={meal.id} meal={meal} />)
        )}
      </div>
    </div>
  )
}
