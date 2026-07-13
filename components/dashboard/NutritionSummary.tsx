'use client'
// Dashboard nutrition summary: macro rings and progress bars.

import { MacroRing } from '@/components/ui/MacroRing'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { useNutritionStore } from '@/stores/nutritionStore'
import { useUserStore } from '@/stores/userStore'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useLocale } from '@/contexts/LocaleContext'

type ActiveNutritionTarget = {
  targetCalories: number
  targetProteinG: number
  targetCarbsG: number
  targetFatG: number
}

/** Displays today's macro consumption as a ring chart and three progress bars compared to the user's daily targets. */
export function NutritionSummary() {
  const { t } = useLocale()
  const { ensureTodayLog, getTodayTotals, setTodayMeals } = useNutritionStore()
  const { profile }        = useUserStore()
  const [coachTarget, setCoachTarget] = useState<ActiveNutritionTarget | null>(null)

  useEffect(() => {
    ensureTodayLog()
    fetch('/api/user/nutrition/logs')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (!data || !Array.isArray(data.logs)) return
        setTodayMeals(data.logs.map((log: {
          clientKey: string; name: string; mealType: string | null; calories: number
          proteinG: number; carbsG: number; fatG: number; loggedAt: string
        }) => ({
          mealId:   log.clientKey.replace(/^meal:|^manual:/, ''),
          name:     log.name,
          type:     log.mealType ?? 'MANUAL',
          calories:  Math.round(log.calories),
          proteinG:  Math.round(log.proteinG),
          carbsG:    Math.round(log.carbsG),
          fatG:      Math.round(log.fatG),
          loggedAt:  log.loggedAt,
        })))
      })
      .catch(() => {})
    fetch('/api/user/nutrition/plan')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (!data?.targetCalories) return
        setCoachTarget({
          targetCalories: data.targetCalories,
          targetProteinG: data.targetProteinG,
          targetCarbsG:   data.targetCarbsG,
          targetFatG:     data.targetFatG,
        })
      })
      .catch(() => {})
  }, [ensureTodayLog, setTodayMeals])

  const totals = getTodayTotals()

  const target = {
    calories: coachTarget?.targetCalories ?? profile?.recommendedCalories ?? 2000,
    proteinG: coachTarget?.targetProteinG ?? profile?.recommendedProteinG ?? 150,
    carbsG:   coachTarget?.targetCarbsG ?? profile?.recommendedCarbsG ?? 200,
    fatG:     coachTarget?.targetFatG ?? profile?.recommendedFatG ?? 65,
  }

  return (
    <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-white">{t('dashboard.nutritionToday')}</h3>
          {coachTarget ? <p className="text-[11px] text-zinc-500">{t('dashboard.activeCoachTarget')}</p> : null}
        </div>
        <Link href="/nutrition" className="text-xs text-[#C8F135] hover:underline">{t('dashboard.viewAll')}</Link>
      </div>

      <MacroRing
        proteinG={totals.proteinG}
        carbsG={totals.carbsG}
        fatG={totals.fatG}
        targetCalories={Math.round(target.calories)}
      />

      <div className="space-y-3 mt-4">
        <ProgressBar value={totals.proteinG} max={target.proteinG} label={t('nutrition.protein')} sublabel={`${totals.proteinG}/${Math.round(target.proteinG)}g`} color="#C8F135" size="sm" />
        <ProgressBar value={totals.carbsG}   max={target.carbsG}   label={t('nutrition.carbs')}  sublabel={`${totals.carbsG}/${Math.round(target.carbsG)}g`}   color="#38bdf8" size="sm" />
        <ProgressBar value={totals.fatG}     max={target.fatG}     label={t('nutrition.fat')}   sublabel={`${totals.fatG}/${Math.round(target.fatG)}g`}     color="#f472b6" size="sm" />
      </div>
    </div>
  )
}
