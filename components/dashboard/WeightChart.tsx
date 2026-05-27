'use client'
// Graphique progression du poids — Recharts + toggle 7/30/90 jours
// deps: npm install recharts

import { useState } from 'react'
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine } from 'recharts'
import { EmptyState } from '@/components/ui/EmptyState'
import { TrendingUp } from 'lucide-react'

interface DataPoint { date: string; weight: number }
interface Props     { data: DataPoint[]; targetWeight?: number }

const RANGES = [
  { label: '7j',  days: 7 },
  { label: '30j', days: 30 },
  { label: '90j', days: 90 },
]

/** Renders a Recharts line chart of weight progression with 7/30/90-day range toggle and an optional target-weight reference line. */
export function WeightChart({ data, targetWeight }: Props) {
  const [range, setRange] = useState(30)

  const filtered = data.slice(0, range).reverse()

  if (filtered.length === 0) {
    return (
      <EmptyState
        icon={<TrendingUp className="size-6" />}
        title="Aucune donnée de poids"
        description="Ajoutez votre poids quotidiennement pour voir votre progression."
        action={{ label: 'Ajouter une mesure', href: '/progress' }}
      />
    )
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null
    return (
      <div className="bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-sm">
        <p className="text-zinc-400 text-xs">{label}</p>
        <p className="text-white font-bold">{payload[0].value} kg</p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-5">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-sm font-semibold text-white">Évolution du poids</h3>
          <p className="text-xs text-zinc-400">
            {filtered.length > 0 ? `${filtered[0].weight} → ${filtered[filtered.length-1]?.weight} kg` : ''}
          </p>
        </div>
        <div className="flex rounded-lg overflow-hidden border border-zinc-700">
          {RANGES.map(({ label, days }) => (
            <button key={days} onClick={() => setRange(days)}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${range === days ? 'bg-[#C8F135] text-zinc-900' : 'bg-zinc-800 text-zinc-400 hover:text-white'}`}
            >{label}</button>
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={filtered} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
          <XAxis dataKey="date" tick={{ fill: '#71717a', fontSize: 11 }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fill: '#71717a', fontSize: 11 }} tickLine={false} axisLine={false} domain={['auto', 'auto']} />
          <Tooltip content={<CustomTooltip />} />
          {targetWeight && (
            <ReferenceLine y={targetWeight} stroke="#C8F135" strokeDasharray="4 2" label={{ value: `Objectif ${targetWeight}kg`, fill: '#C8F135', fontSize: 10 }} />
          )}
          <Line
            type="monotone" dataKey="weight"
            stroke="#C8F135" strokeWidth={2.5}
            dot={{ fill: '#C8F135', r: 3, strokeWidth: 0 }}
            activeDot={{ r: 5, fill: '#C8F135' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
