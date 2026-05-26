'use client'
// Page progression — graphiques poids, ajout de mesures, historique
import { useState, useEffect } from 'react'
import { Header }       from '@/components/layout/Header'
import { PageWrapper }  from '@/components/layout/PageWrapper'
import { WeightChart }  from '@/components/dashboard/WeightChart'
import { useUserStore } from '@/stores/userStore'
import { LocalStorageAdapter } from '@/lib/storage/LocalStorageAdapter'
import { bodyMetricSchema }    from '@/utils/validators'
import { toast } from 'sonner'
import { Plus, Scale } from 'lucide-react'
import { MetricCard } from '@/components/ui/MetricCard'

// Données mockées pour la démo
const MOCK_DATA = Array.from({ length: 60 }, (_, i) => ({
  date:   new Date(Date.now() - (59 - i) * 86400000).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }),
  weight: Math.round((82 - i * 0.15 + (Math.random() - 0.5)) * 10) / 10,
}))

export default function ProgressPage() {
  const { profile }      = useUserStore()
  const [weight, setWeight]   = useState('')
  const [saving, setSaving]   = useState(false)
  const [metrics, setMetrics] = useState<{ weightKg: number; date?: Date }[]>([])

  useEffect(() => {
    new LocalStorageAdapter().getBodyMetrics(90).then(setMetrics)
  }, [])

  const handleAddWeight = async () => {
    const parsed = bodyMetricSchema.safeParse({ weightKg: parseFloat(weight) })
    if (!parsed.success) { toast.error('Entrez un poids valide (30 – 300 kg)'); return }
    setSaving(true)
    await new LocalStorageAdapter().addBodyMetric(parsed.data)
    toast.success('Poids ajouté !')
    setWeight('')
    setSaving(false)
    new LocalStorageAdapter().getBodyMetrics(90).then(setMetrics)
  }

  const lastWeight  = metrics[0]?.weightKg ?? null
  const firstWeight = metrics[metrics.length - 1]?.weightKg ?? null
  const delta       = lastWeight && firstWeight ? Math.round((lastWeight - firstWeight) * 10) / 10 : null

  return (
    <>
      <Header title="Progression" />
      <PageWrapper>
        <div className="space-y-6">
          {/* Métriques rapides */}
          <div className="grid grid-cols-3 gap-4">
            <MetricCard title="Poids actuel" value={lastWeight ?? '—'} unit="kg" icon={<Scale className="size-4" />} />
            <MetricCard title="Objectif"     value={profile?.targetWeightKg ?? '—'} unit="kg" accentColor="#38bdf8" />
            <MetricCard title="Progression"  value={delta !== null ? (delta > 0 ? `+${delta}` : delta) : '—'} unit="kg"
              accentColor={delta !== null && delta < 0 ? '#4ade80' : '#f87171'} />
          </div>

          {/* Ajout poids */}
          <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-5">
            <h3 className="text-sm font-semibold text-white mb-3">Ajouter une mesure</h3>
            <div className="flex gap-3">
              <input
                type="number" step="0.1" placeholder="Poids en kg" value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className="flex-1 px-4 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-white focus:outline-none focus:border-[#C8F135] transition-colors"
              />
              <button
                type="button"
                onClick={handleAddWeight}
                disabled={saving || !weight}
                aria-label="Enregistrer mon poids"
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#C8F135] text-zinc-900 font-bold disabled:opacity-50 hover:bg-[#d4f54d] transition-colors"
              >
                <Plus className="size-4" /> Enregistrer mon poids
              </button>
            </div>
          </div>

          {/* Graphique */}
          <WeightChart data={MOCK_DATA} targetWeight={profile?.targetWeightKg} />

          {/* Historique récent */}
          {metrics.length > 0 && (
            <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-5">
              <h3 className="text-sm font-semibold text-white mb-3">Historique récent</h3>
              <div className="space-y-2">
                {metrics.slice(0, 7).map((m, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-zinc-800 last:border-0">
                    <span className="text-xs text-zinc-400">
                      {m.date ? new Date(m.date).toLocaleDateString('fr-FR') : 'Aujourd\'hui'}
                    </span>
                    <span className="text-sm font-semibold text-white">{m.weightKg} kg</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </PageWrapper>
    </>
  )
}
