'use client'
// Client du dashboard — récupère les données et orchestre les widgets

import { useEffect, useState } from 'react'
import { useUserStore } from '@/stores/userStore'
import { useSubscriptionStore } from '@/stores/subscriptionStore'
import { LocalStorageAdapter } from '@/lib/storage/LocalStorageAdapter'
import { MetricsGrid }      from '@/components/dashboard/MetricsGrid'
import { WeightChart }      from '@/components/dashboard/WeightChart'
import { NutritionSummary } from '@/components/dashboard/NutritionSummary'
import { QuickActions }     from '@/components/dashboard/QuickActions'
import { UpgradePrompt }    from '@/components/ui/UpgradePrompt'
import { MacroRing }        from '@/components/ui/MacroRing'
import Link from 'next/link'
import { Dumbbell, ArrowRight } from 'lucide-react'

// Données mockées poids pour la démo
const MOCK_WEIGHT_DATA = Array.from({ length: 30 }, (_, i) => ({
  date:   new Date(Date.now() - (29 - i) * 86400000).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }),
  weight: Math.round((80 - i * 0.12 + (Math.random() - 0.5) * 0.8) * 10) / 10,
}))

export function DashboardClient() {
  const { profile }  = useUserStore()
  const { plan }     = useSubscriptionStore()
  const [loading, setLoading]     = useState(true)
  const [lastWeight, setLastWeight] = useState<number | null>(null)

  useEffect(() => {
    const storage = new LocalStorageAdapter()
    storage.getBodyMetrics(1).then((metrics) => {
      if (metrics[0]) setLastWeight(metrics[0].weightKg)
      setLoading(false)
    })
  }, [])

  // Calcul du streak (mocké à 7 jours pour la démo)
  const streak = 7

  return (
    <div className="space-y-6">
      {/* Message de bienvenue */}
      <div>
        <h2 className="text-xl font-bold text-white">
          Bonjour {profile?.firstName ?? 'Athlète'} 👋
        </h2>
        <p className="text-sm text-zinc-400 mt-0.5">
          {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
      </div>

      {/* Bannière upgrade si plan Free */}
      {plan === 'FREE' && (
        <UpgradePrompt
          feature="Synchronisation cloud + Export PDF"
          description="Passez à Pro pour sauvegarder vos données sur tous vos appareils et exporter vos programmes en PDF."
        />
      )}

      {/* Métriques */}
      <MetricsGrid profile={profile} lastWeight={lastWeight} streak={streak} isLoading={loading} />

      {/* Graphique poids */}
      <WeightChart data={MOCK_WEIGHT_DATA} targetWeight={profile?.targetWeightKg} />

      {/* Grid : nutrition + prochaine séance + actions rapides */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <NutritionSummary />
        </div>

        <div className="space-y-4">
          {/* Prochaine séance */}
          <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-5">
            <h3 className="text-sm font-semibold text-white mb-3">Prochaine séance</h3>
            <div className="flex items-center gap-3 mb-3">
              <div className="size-10 rounded-xl bg-[#C8F135]/10 flex items-center justify-center">
                <Dumbbell className="size-5 text-[#C8F135]" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">Push Day — Pectoraux</p>
                <p className="text-xs text-zinc-400">6 exercices · ~55 min</p>
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
