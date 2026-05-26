// Coach dashboard: mocked global metrics.

import { Users, TrendingUp, Calendar, Star } from 'lucide-react'

const STATS = [
  { label: 'Membres actifs',   value: '24',    icon: Users,       color: 'text-[#C8F135]' },
  { label: 'Séances ce mois',  value: '186',   icon: Calendar,    color: 'text-blue-400'  },
  { label: 'Progression moy.', value: '+4.2%', icon: TrendingUp,  color: 'text-emerald-400' },
  { label: 'Note moyenne',     value: '4.8★',  icon: Star,        color: 'text-amber-400' },
]

export default function CoachDashboard() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Tableau de bord coach</h1>
        <p className="text-zinc-400 text-sm mt-1">Vue d&apos;ensemble de vos membres et programmes.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STATS.map((s) => (
          <div key={s.label} className="rounded-2xl bg-zinc-900 border border-zinc-800 p-5">
            <s.icon className={`size-5 mb-3 ${s.color}`} />
            <div className="text-2xl font-bold">{s.value}</div>
            <div className="text-xs text-zinc-400 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-6">
        <h2 className="text-base font-semibold mb-4">Activité récente</h2>
        <div className="space-y-3">
          {['Alice Martin a terminé sa séance pectoraux', 'Bob Durand a atteint son objectif poids', 'Clara Petit a démarré son programme'].map((msg) => (
            <div key={msg} className="flex items-center gap-3 text-sm text-zinc-300 py-2 border-b border-zinc-800 last:border-0">
              <div className="size-2 rounded-full bg-[#C8F135] shrink-0" />
              {msg}
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl bg-amber-500/10 border border-amber-500/20 p-5 text-sm text-amber-300">
        Interface coach en développement — disponible dans l'offre entreprise.
      </div>
    </div>
  )
}
