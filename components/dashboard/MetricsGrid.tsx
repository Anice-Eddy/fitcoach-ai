'use client'
// Grid of the main dashboard metrics.

import { MetricCard } from '@/components/ui/MetricCard'
import { Scale, Flame, Dumbbell, Zap, Droplets } from 'lucide-react'
import type { UserProfile } from '@/lib/storage/StorageAdapter'
import { useNutritionStore } from '@/stores/nutritionStore'
import { useEffect } from 'react'
import { useLocale } from '@/contexts/LocaleContext'

interface Props {
  profile:    UserProfile | null
  lastWeight: number | null
  lastWaterLiters: number | null
  streak:     number
  isLoading:  boolean
}

/** Renders the four main dashboard metric cards: current weight, today's calories, workout status, and consecutive-day streak. */
export function MetricsGrid({ profile, lastWeight, lastWaterLiters, streak, isLoading }: Props) {
  const { t } = useLocale()
  const { ensureTodayLog, getTodayTotals } = useNutritionStore()

  useEffect(() => { ensureTodayLog() }, [ensureTodayLog])

  const totals = getTodayTotals()

  const weightDelta = profile?.targetWeightKg && lastWeight
    ? Math.round((lastWeight - profile.targetWeightKg) * 10) / 10
    : undefined

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
      <MetricCard
        title={t('dashboard.currentWeight')}
        value={lastWeight ?? '—'}
        unit="kg"
        subtitle={profile?.targetWeightKg ? `${t('dashboard.target')} : ${profile.targetWeightKg} kg` : undefined}
        trend={weightDelta}
        trendLabel={t('dashboard.vsTarget')}
        icon={<Scale className="size-4" />}
        isLoading={isLoading}
      />
      <MetricCard
        title={t('dashboard.todayCalories')}
        value={totals.calories}
        unit="kcal"
        subtitle={profile?.recommendedCalories ? `/ ${Math.round(profile.recommendedCalories)} kcal` : undefined}
        icon={<Flame className="size-4" />}
        isLoading={isLoading}
      />
      <MetricCard
        title={t('dashboard.todayWorkout')}
        value={t('dashboard.toDo')}
        subtitle={t('dashboard.activeProgram')}
        icon={<Dumbbell className="size-4" />}
        isLoading={isLoading}
      />
      <MetricCard
        title={t('dashboard.waterLiters')}
        value={lastWaterLiters ?? '—'}
        unit={lastWaterLiters ? 'L' : ''}
        subtitle={t('dashboard.lastMeasure')}
        icon={<Droplets className="size-4" />}
        accentColor="#22d3ee"
        isLoading={isLoading}
      />
      <MetricCard
        title={t('dashboard.streakLabel')}
        value={streak}
        unit={t('dashboard.daysUnit')}
        subtitle={t('dashboard.consecutiveDays')}
        icon={<Zap className="size-4" />}
        accentColor="#f59e0b"
        isLoading={isLoading}
      />
    </div>
  )
}
