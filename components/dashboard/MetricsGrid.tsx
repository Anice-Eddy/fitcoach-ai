'use client'
// Grille des métriques principales du dashboard

import { MetricCard } from '@/components/ui/MetricCard'
import { Scale, Flame, Dumbbell, Zap } from 'lucide-react'
import type { UserProfile } from '@/lib/storage/StorageAdapter'
import { useNutritionStore } from '@/stores/nutritionStore'

interface Props {
  profile:    UserProfile | null
  lastWeight: number | null
  streak:     number
  isLoading:  boolean
}

/** Renders the four main dashboard metric cards: current weight, today's calories, workout status, and consecutive-day streak. */
export function MetricsGrid({ profile, lastWeight, streak, isLoading }: Props) {
  const { getTodayTotals } = useNutritionStore()
  const totals = getTodayTotals()

  const weightDelta = profile?.targetWeightKg && lastWeight
    ? Math.round((lastWeight - profile.targetWeightKg) * 10) / 10
    : undefined

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <MetricCard
        title="Poids actuel"
        value={lastWeight ?? '—'}
        unit="kg"
        subtitle={profile?.targetWeightKg ? `Objectif : ${profile.targetWeightKg} kg` : undefined}
        trend={weightDelta}
        trendLabel="vs objectif"
        icon={<Scale className="size-4" />}
        isLoading={isLoading}
      />
      <MetricCard
        title="Calories du jour"
        value={totals.calories}
        unit="kcal"
        subtitle={profile?.recommendedCalories ? `/ ${Math.round(profile.recommendedCalories)} kcal` : undefined}
        icon={<Flame className="size-4" />}
        isLoading={isLoading}
      />
      <MetricCard
        title="Séance du jour"
        value="À faire"
        subtitle="Programme actif"
        icon={<Dumbbell className="size-4" />}
        isLoading={isLoading}
      />
      <MetricCard
        title="Streak"
        value={streak}
        unit="jours"
        subtitle="Jours consécutifs"
        icon={<Zap className="size-4" />}
        accentColor="#f59e0b"
        isLoading={isLoading}
      />
    </div>
  )
}
