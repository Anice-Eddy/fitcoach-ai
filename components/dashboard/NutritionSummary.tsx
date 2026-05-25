'use client'
// Résumé nutrition du dashboard — anneaux + barres de progression macros

import { MacroRing } from '@/components/ui/MacroRing'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { useNutritionStore } from '@/stores/nutritionStore'
import { useUserStore } from '@/stores/userStore'
import Link from 'next/link'

export function NutritionSummary() {
  const { getTodayTotals } = useNutritionStore()
  const { profile }        = useUserStore()
  const totals = getTodayTotals()

  const target = {
    calories: profile?.recommendedCalories ?? 2000,
    proteinG: profile?.recommendedProteinG ?? 150,
    carbsG:   profile?.recommendedCarbsG ?? 200,
    fatG:     profile?.recommendedFatG ?? 65,
  }

  return (
    <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-white">Nutrition du jour</h3>
        <Link href="/nutrition" className="text-xs text-[#C8F135] hover:underline">Voir tout</Link>
      </div>

      <MacroRing
        proteinG={totals.proteinG}
        carbsG={totals.carbsG}
        fatG={totals.fatG}
        targetCalories={Math.round(target.calories)}
      />

      <div className="space-y-3 mt-4">
        <ProgressBar value={totals.proteinG} max={target.proteinG} label="Protéines" sublabel={`${totals.proteinG}/${Math.round(target.proteinG)}g`} color="#C8F135" size="sm" />
        <ProgressBar value={totals.carbsG}   max={target.carbsG}   label="Glucides"  sublabel={`${totals.carbsG}/${Math.round(target.carbsG)}g`}   color="#38bdf8" size="sm" />
        <ProgressBar value={totals.fatG}     max={target.fatG}     label="Lipides"   sublabel={`${totals.fatG}/${Math.round(target.fatG)}g`}     color="#f472b6" size="sm" />
      </div>
    </div>
  )
}
