'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useUserStore } from '@/stores/userStore'
import { MetricsGrid }      from '@/components/dashboard/MetricsGrid'
import { WeightChart }      from '@/components/dashboard/WeightChart'
import { NutritionSummary } from '@/components/dashboard/NutritionSummary'
import { QuickActions }     from '@/components/dashboard/QuickActions'
import Link from 'next/link'
import { Dumbbell, ArrowRight } from 'lucide-react'

interface WeightPoint { date: string; weight: number }
interface Metric { id: string; weightKg: number; date: string }

const GOAL_SESSION: Record<string, string> = {
  WEIGHT_LOSS:     'Cardio + circuit training',
  MUSCLE_GAIN:     'Séance de force',
  MAINTENANCE:     'Séance équilibrée',
  ENDURANCE:       'Séance cardio-endurance',
  FLEXIBILITY:     'Mobilité & étirements',
  GENERAL_FITNESS: 'Séance complète',
}

export function DashboardClient() {
  const { data: session }           = useSession()
  const { profile }                 = useUserStore()
  const [weightData, setWeightData] = useState<WeightPoint[]>([])
  const [lastWeight, setLastWeight] = useState<number | null>(null)
  const [loading, setLoading]       = useState(true)

  useEffect(() => {
    fetch('/api/user/metrics?limit=30')
      .then(res => res.json())
      .then((metrics: Metric[]) => {
        if (Array.isArray(metrics) && metrics.length > 0) {
          setLastWeight(metrics[0].weightKg)
          const sorted = [...metrics].reverse()
          setWeightData(sorted.map(m => ({
            date:   new Date(m.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }),
            weight: m.weightKg,
          })))
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const streak    = 7
  const firstName = profile?.firstName ?? session?.user?.name?.split(' ')[0] ?? 'Athlète'
  const nextSession = profile?.fitnessGoal ? GOAL_SESSION[profile.fitnessGoal] : 'Séance du jour'

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">
          Bonjour {firstName} 👋
        </h2>
        <p className="text-sm text-zinc-400 mt-0.5">
          {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
      </div>

      <MetricsGrid profile={profile} lastWeight={lastWeight} streak={streak} isLoading={loading} />

      {weightData.length > 0 && (
        <WeightChart data={weightData} targetWeight={profile?.targetWeightKg} />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <NutritionSummary />
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-5">
            <h3 className="text-sm font-semibold text-white mb-3">Prochaine séance</h3>
            <div className="flex items-center gap-3 mb-3">
              <div className="size-10 rounded-xl bg-[#C8F135]/10 flex items-center justify-center">
                <Dumbbell className="size-5 text-[#C8F135]" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">{nextSession}</p>
                <p className="text-xs text-zinc-400">
                  Niveau {profile?.fitnessLevel?.toLowerCase() ?? 'débutant'}
                </p>
              </div>
            </div>
            <Link
              href="/training"
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-[#C8F135] text-zinc-900 text-sm font-bold hover:bg-[#d4f54d] transition-colors"
            >
              Commencer <ArrowRight className="size-4" />
            </Link>
          </div>

          <QuickActions />
        </div>
      </div>
    </div>
  )
}
