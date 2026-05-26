// Rapports coach — métriques agrégées mockées

import { BarChart2, TrendingUp, Users, Award } from 'lucide-react'

export default function CoachReports() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Rapports</h1>
        <p className="text-zinc-400 text-sm mt-1">Analyse des performances de vos membres.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Taux de complétion séances', value: '82%',  icon: BarChart2,  color: 'text-[#C8F135]' },
          { label: 'Progression poids moyenne',  value: '+1.8kg', icon: TrendingUp, color: 'text-emerald-400' },
          { label: 'Membres actifs cette semaine', value: '19',  icon: Users,      color: 'text-blue-400'   },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl bg-zinc-900 border border-zinc-800 p-5">
            <s.icon className={`size-5 mb-3 ${s.color}`} />
            <div className="text-2xl font-bold">{s.value}</div>
            <div className="text-xs text-zinc-400 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Award className="size-5 text-amber-400" />
          <h2 className="font-semibold">Top performers ce mois</h2>
        </div>
        <div className="space-y-3">
          {['David Roux — 31 séances', 'Alice Martin — 24 séances', 'Bob Durand — 18 séances'].map((m, i) => (
            <div key={m} className="flex items-center gap-3 text-sm">
              <span className="size-6 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-300">
                {i + 1}
              </span>
              <span className="text-zinc-300">{m}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl bg-amber-500/10 border border-amber-500/20 p-5 text-sm text-amber-300">
        Export PDF des rapports en développement — disponible dans l'offre entreprise.
      </div>
    </div>
  )
}
