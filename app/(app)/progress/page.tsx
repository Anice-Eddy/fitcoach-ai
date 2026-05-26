'use client'
import { useState, useEffect, useCallback } from 'react'
import { Header }       from '@/components/layout/Header'
import { PageWrapper }  from '@/components/layout/PageWrapper'
import { WeightChart }  from '@/components/dashboard/WeightChart'
import { useUserStore } from '@/stores/userStore'
import { toast } from 'sonner'
import { Plus, Scale, Target, TrendingDown, TrendingUp, Activity, Trash2, Ruler } from 'lucide-react'
import { MetricCard } from '@/components/ui/MetricCard'

interface BodyMetric { id: string; weightKg: number; date: string; bodyFatPct?: number | null }
interface WeightPoint { date: string; weight: number }

const GOAL_LABELS: Record<string, string> = {
  WEIGHT_LOSS: 'Perte de poids', MUSCLE_GAIN: 'Prise de masse',
  MAINTENANCE: 'Maintien du poids', ENDURANCE: 'Endurance',
  GENERAL_FITNESS: 'Forme générale', FLEXIBILITY: 'Flexibilité',
}

export default function ProgressPage() {
  const { profile }         = useUserStore()
  const [weight, setWeight]         = useState('')
  const [saving, setSaving]         = useState(false)
  const [metrics, setMetrics]       = useState<BodyMetric[]>([])
  const [loading, setLoading]       = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const fetchMetrics = useCallback(() => {
    fetch('/api/user/metrics?limit=90')
      .then(res => res.json())
      .then((data: BodyMetric[]) => {
        if (Array.isArray(data)) setMetrics(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  useEffect(() => { fetchMetrics() }, [fetchMetrics])

  const handleAddWeight = async () => {
    const val = parseFloat(weight)
    if (isNaN(val) || val < 30 || val > 300) { toast.error('Poids invalide (30–300 kg)'); return }
    setSaving(true)
    try {
      const res = await fetch('/api/user/metrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weightKg: val }),
      })
      if (res.ok) {
        toast.success('Poids enregistré !')
        setWeight('')
        fetchMetrics()
      } else {
        toast.error('Erreur lors de l\'ajout')
      }
    } catch { toast.error('Erreur réseau') }
    finally { setSaving(false) }
  }

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    try {
      const res = await fetch(`/api/user/metrics?id=${id}`, { method: 'DELETE' })
      if (res.ok) { toast.success('Mesure supprimée'); fetchMetrics() }
      else toast.error('Erreur lors de la suppression')
    } catch { toast.error('Erreur réseau') }
    finally { setDeletingId(null) }
  }

  const sortedAsc = [...metrics].reverse()
  const chartData: WeightPoint[] = sortedAsc.map(m => ({
    date:   new Date(m.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }),
    weight: m.weightKg,
  }))

  const lastWeight  = metrics[0]?.weightKg ?? null
  const firstWeight = metrics[metrics.length - 1]?.weightKg ?? null
  const delta = lastWeight !== null && firstWeight !== null && metrics.length > 1
    ? Math.round((lastWeight - firstWeight) * 10) / 10
    : null
  const bmi = profile?.bmi ?? null

  return (
    <>
      <Header title="Progression" />
      <PageWrapper>
        <div className="space-y-6">

          {/* Objectif */}
          {profile?.fitnessGoal && (
            <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-5">
              <div className="flex items-center gap-2 mb-4">
                <Target className="size-4 text-[#C8F135]" />
                <h3 className="text-sm font-semibold text-white">Objectif principal</h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-xs text-zinc-500 mb-0.5">Objectif</p>
                  <p className="font-medium text-[#C8F135]">{GOAL_LABELS[profile.fitnessGoal] ?? profile.fitnessGoal}</p>
                </div>
                {profile.targetWeightKg ? (
                  <div>
                    <p className="text-xs text-zinc-500 mb-0.5">Poids cible</p>
                    <p className="font-medium text-white">{profile.targetWeightKg} kg</p>
                  </div>
                ) : null}
                {profile.tdee ? (
                  <div>
                    <p className="text-xs text-zinc-500 mb-0.5">Dépense calorique</p>
                    <p className="font-medium text-white">{Math.round(profile.tdee)} kcal/jour</p>
                  </div>
                ) : null}
                {profile.recommendedCalories ? (
                  <div>
                    <p className="text-xs text-zinc-500 mb-0.5">Calories recommandées</p>
                    <p className="font-medium text-white">{Math.round(profile.recommendedCalories)} kcal/jour</p>
                  </div>
                ) : null}
              </div>
            </div>
          )}

          {/* Métriques */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <MetricCard
              title="Poids actuel"
              value={lastWeight ?? '—'}
              unit={lastWeight ? 'kg' : ''}
              icon={<Scale className="size-4" />}
              isLoading={loading}
            />
            <MetricCard
              title="Objectif poids"
              value={profile?.targetWeightKg ?? '—'}
              unit={profile?.targetWeightKg ? 'kg' : ''}
              icon={<Target className="size-4" />}
              accentColor="#38bdf8"
            />
            <MetricCard
              title="Progression"
              value={delta !== null ? (delta > 0 ? `+${delta}` : String(delta)) : '—'}
              unit={delta !== null ? 'kg' : ''}
              icon={delta !== null
                ? (delta < 0 ? <TrendingDown className="size-4" /> : <TrendingUp className="size-4" />)
                : <Activity className="size-4" />
              }
              accentColor={delta !== null && delta < 0 ? '#4ade80' : delta !== null ? '#f87171' : '#C8F135'}
              isLoading={loading}
            />
            <MetricCard
              title="IMC"
              value={bmi ? bmi.toFixed(1) : '—'}
              unit={bmi
                ? (bmi < 18.5 ? 'Insuffisant' : bmi < 25 ? 'Normal' : bmi < 30 ? 'Surpoids' : 'Obésité')
                : ''
              }
              icon={<Ruler className="size-4" />}
              accentColor={bmi
                ? (bmi < 18.5 || bmi >= 30 ? '#f87171' : bmi < 25 ? '#4ade80' : '#fbbf24')
                : '#C8F135'
              }
            />
          </div>

          {/* Ajout poids */}
          <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-5">
            <h3 className="text-sm font-semibold text-white mb-3">Ajouter une mesure</h3>
            <div className="flex gap-3">
              <input
                type="number" step="0.1" min="30" max="300"
                placeholder="Poids en kg" value={weight}
                onChange={e => setWeight(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddWeight()}
                className="flex-1 px-4 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-white focus:outline-none focus:border-[#C8F135] transition-colors"
              />
              <button
                type="button" onClick={handleAddWeight}
                disabled={saving || !weight}
                aria-label="Enregistrer mon poids"
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#C8F135] text-zinc-900 font-bold disabled:opacity-50 hover:bg-[#d4f54d] transition-colors"
              >
                <Plus className="size-4" /> Enregistrer
              </button>
            </div>
          </div>

          {/* Graphique */}
          {chartData.length > 0 ? (
            <WeightChart data={chartData} targetWeight={profile?.targetWeightKg} />
          ) : !loading ? (
            <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-8 text-center">
              <Scale className="size-8 text-zinc-600 mx-auto mb-3" />
              <p className="text-zinc-400 font-medium">Aucune mesure enregistrée</p>
              <p className="text-sm text-zinc-600 mt-1">Saisis ton poids ci-dessus pour voir ta progression.</p>
            </div>
          ) : null}

          {/* Macros */}
          {profile?.recommendedProteinG ? (
            <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-5">
              <h3 className="text-sm font-semibold text-white mb-4">Macronutriments recommandés</h3>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: 'Protéines', value: Math.round(profile.recommendedProteinG), color: 'text-[#C8F135]', bg: 'bg-[#C8F135]/10' },
                  { label: 'Glucides',  value: Math.round(profile.recommendedCarbsG ?? 0), color: 'text-blue-400', bg: 'bg-blue-400/10' },
                  { label: 'Lipides',   value: Math.round(profile.recommendedFatG ?? 0), color: 'text-pink-400', bg: 'bg-pink-400/10' },
                ].map(m => (
                  <div key={m.label} className={`rounded-xl p-4 text-center ${m.bg}`}>
                    <p className={`text-2xl font-bold ${m.color}`}>{m.value}g</p>
                    <p className="text-xs text-zinc-400 mt-1">{m.label}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {/* Historique */}
          {metrics.length > 0 && (
            <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-5">
              <h3 className="text-sm font-semibold text-white mb-3">Historique</h3>
              <div className="space-y-1">
                {metrics.map((m, i) => (
                  <div key={m.id ?? i} className="flex items-center justify-between py-2 border-b border-zinc-800 last:border-0 group">
                    <span className="text-xs text-zinc-400">
                      {new Date(m.date).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-white">{m.weightKg} kg</span>
                      {m.bodyFatPct ? <span className="text-xs text-zinc-500">{m.bodyFatPct}% MG</span> : null}
                      <button
                        type="button"
                        onClick={() => handleDelete(m.id)}
                        disabled={deletingId === m.id}
                        aria-label="Supprimer cette mesure"
                        className="opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-red-400 transition-all disabled:opacity-50"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
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
