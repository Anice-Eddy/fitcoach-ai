'use client'

import { useEffect, useState } from 'react'
import {
  BarChart2, TrendingUp, TrendingDown, Users, Calendar, MessageSquare,
  CheckCircle, Award, Activity, RefreshCw, Minus,
} from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

interface ReportData {
  totalMembers:         number
  appointmentsCompleted: number
  appointmentsUpcoming: number
  notesSent:            number
  repliesReceived:      number
  sessionsThisMonth:    number
  sessionsThisWeek:     number
  completionRate:       number | null
  avgWeightDelta:       number | null
  topPerformers:        { memberId: string; name: string | null; email: string; count: number }[]
  recentActivity:       { memberId: string; name: string | null; lastSessionAt: string | null }[]
}

function StatCard({
  label, value, icon: Icon, color, sub,
}: {
  label: string
  value: string | number
  icon: React.ElementType
  color: string
  sub?: string
}) {
  return (
    <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-5">
      <Icon className={`size-5 mb-3 ${color}`} />
      <div className="text-2xl font-bold text-white">{value}</div>
      <div className="text-xs text-zinc-400 mt-1">{label}</div>
      {sub && <div className="text-xs text-zinc-600 mt-0.5">{sub}</div>}
    </div>
  )
}

function EmptySection({ message }: { message: string }) {
  return (
    <p className="text-sm text-zinc-500 italic py-4 text-center">{message}</p>
  )
}

export default function CoachReports() {
  const [data, setData]       = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/coach/reports')
      if (!res.ok) throw new Error('Erreur serveur')
      setData(await res.json())
    } catch {
      setError('Impossible de charger les rapports.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Rapports</h1>
          <p className="text-zinc-400 text-sm mt-1">Analyse des performances de vos membres.</p>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[0,1,2,3].map(i => <div key={i} className="h-28 animate-pulse rounded-2xl bg-zinc-900" />)}
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Rapports</h1>
        <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-6 text-center">
          <p className="text-sm text-zinc-500">{error ?? 'Aucune donnée disponible.'}</p>
          <button
            onClick={load}
            className="mt-3 inline-flex items-center gap-2 text-xs text-zinc-400 hover:text-white transition-colors"
          >
            <RefreshCw className="size-3.5" /> Réessayer
          </button>
        </div>
      </div>
    )
  }

  const weightDeltaColor = data.avgWeightDelta === null
    ? 'text-zinc-400'
    : data.avgWeightDelta > 0 ? 'text-emerald-400' : data.avgWeightDelta < 0 ? 'text-red-400' : 'text-zinc-400'

  const weightDeltaIcon = data.avgWeightDelta === null
    ? Minus
    : data.avgWeightDelta > 0 ? TrendingUp : data.avgWeightDelta < 0 ? TrendingDown : Minus

  const weightDeltaLabel = data.avgWeightDelta === null
    ? '—'
    : `${data.avgWeightDelta > 0 ? '+' : ''}${data.avgWeightDelta} kg`

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Rapports</h1>
          <p className="text-zinc-400 text-sm mt-1">Statistiques réelles de vos membres.</p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors border border-zinc-800 rounded-lg px-3 py-2 hover:border-zinc-600"
        >
          <RefreshCw className="size-3.5" /> Actualiser
        </button>
      </div>

      {/* ── Chiffres clés ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Membres suivis"
          value={data.totalMembers}
          icon={Users}
          color="text-[#C8F135]"
        />
        <StatCard
          label="Rendez-vous réalisés"
          value={data.appointmentsCompleted}
          icon={Calendar}
          color="text-blue-400"
          sub={`${data.appointmentsUpcoming} à venir`}
        />
        <StatCard
          label="Séances ce mois"
          value={data.sessionsThisMonth}
          icon={Activity}
          color="text-emerald-400"
          sub={`${data.sessionsThisWeek} cette semaine`}
        />
        <StatCard
          label="Notes envoyées"
          value={data.notesSent}
          icon={MessageSquare}
          color="text-purple-400"
          sub={`${data.repliesReceived} réponse${data.repliesReceived !== 1 ? 's' : ''} reçue${data.repliesReceived !== 1 ? 's' : ''}`}
        />
      </div>

      {/* ── Indicateurs de performance ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-5">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle className="size-4 text-[#C8F135]" />
            <h2 className="text-sm font-semibold text-white">Taux de complétion des séances</h2>
          </div>
          {data.completionRate !== null ? (
            <div>
              <div className="text-3xl font-bold text-white mb-2">{data.completionRate}%</div>
              <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#C8F135] rounded-full transition-all"
                  style={{ width: `${Math.min(data.completionRate, 100)}%` }}
                />
              </div>
              <p className="text-xs text-zinc-500 mt-2">
                Basé sur {data.sessionsThisMonth} séances ce mois
              </p>
            </div>
          ) : (
            <EmptySection message="Pas encore assez de données de séances." />
          )}
        </div>

        <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-5">
          <div className="flex items-center gap-2 mb-3">
            {(() => {
              const Icon = weightDeltaIcon
              return <Icon className={`size-4 ${weightDeltaColor}`} />
            })()}
            <h2 className="text-sm font-semibold text-white">Évolution du poids (moyenne)</h2>
          </div>
          {data.avgWeightDelta !== null ? (
            <div>
              <div className={`text-3xl font-bold mb-1 ${weightDeltaColor}`}>
                {weightDeltaLabel}
              </div>
              <p className="text-xs text-zinc-500">
                Variation moyenne entre la première et la dernière pesée de vos membres
              </p>
            </div>
          ) : (
            <EmptySection message="Pas assez de données de poids pour calculer la progression." />
          )}
        </div>
      </div>

      {/* ── Top performers ce mois ── */}
      <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Award className="size-5 text-amber-400" />
          <h2 className="text-base font-semibold">Top performers ce mois</h2>
        </div>
        {data.topPerformers.length === 0 ? (
          <EmptySection message="Aucune séance complétée ce mois parmi vos membres." />
        ) : (
          <div className="space-y-3">
            {data.topPerformers.map((p, i) => (
              <div key={p.memberId} className="flex items-center gap-3">
                <span className={`size-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                  i === 0 ? 'bg-amber-500/20 text-amber-400' :
                  i === 1 ? 'bg-zinc-700 text-zinc-300' :
                  'bg-zinc-800 text-zinc-500'
                }`}>
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-zinc-200 truncate">{p.name ?? p.email}</p>
                </div>
                <span className="text-sm font-bold text-[#C8F135] shrink-0">
                  {p.count} séance{p.count !== 1 ? 's' : ''}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Activité récente des membres ── */}
      <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="size-5 text-blue-400" />
          <h2 className="text-base font-semibold">Dernière activité</h2>
        </div>
        {data.recentActivity.length === 0 ? (
          <EmptySection message="Aucun membre suivi pour le moment." />
        ) : (
          <div className="space-y-2">
            {data.recentActivity.map(m => (
              <div key={m.memberId} className="flex items-center justify-between py-2 border-b border-zinc-800 last:border-0 gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="size-8 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-300 shrink-0">
                    {(m.name ?? '?').charAt(0).toUpperCase()}
                  </div>
                  <p className="text-sm text-zinc-300 truncate">{m.name ?? 'Membre'}</p>
                </div>
                <p className="text-xs text-zinc-500 shrink-0">
                  {m.lastSessionAt
                    ? `Dernière séance : ${format(new Date(m.lastSessionAt), 'd MMM yyyy', { locale: fr })}`
                    : 'Aucune séance enregistrée'}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
