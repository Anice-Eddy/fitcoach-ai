'use client'

import type { LucideIcon } from 'lucide-react'
import { AlertTriangle, CheckCircle, Info, TrendingDown, Target, Dumbbell, Scale } from 'lucide-react'
import type { Insight, InsightMemory, InsightType } from '@/app/api/ai/insights/route'

const GOAL_LABELS: Record<string, string> = {
  WEIGHT_LOSS:    'Perte de poids',
  MUSCLE_GAIN:    'Prise de masse',
  GENERAL_FITNESS:'Forme générale',
  ENDURANCE:      'Endurance',
  FLEXIBILITY:    'Flexibilité',
}

const TYPE_STYLES: Record<InsightType, { bg: string; border: string; text: string; icon: LucideIcon }> = {
  success: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-400', icon: CheckCircle },
  warning: { bg: 'bg-amber-500/10',   border: 'border-amber-500/30',   text: 'text-amber-400',   icon: AlertTriangle },
  alert:   { bg: 'bg-red-500/10',     border: 'border-red-500/30',     text: 'text-red-400',     icon: AlertTriangle },
  info:    { bg: 'bg-zinc-800',        border: 'border-zinc-700',       text: 'text-zinc-400',    icon: Info },
}

/** Renders a compact row of insight badge cards derived from member fitness data. */
export function InsightCards({ insights }: { insights: Insight[] }) {
  if (!insights.length) return null

  return (
    <div className="flex flex-wrap gap-2">
      {insights.map((insight, i) => {
        const s    = TYPE_STYLES[insight.type]
        const Icon = s.icon
        return (
          <div
            key={i}
            className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-medium ${s.bg} ${s.border} ${s.text}`}
          >
            <Icon className="size-3.5 shrink-0" />
            <span className="text-zinc-300">{insight.label}</span>
            <span className={`font-semibold ${s.text}`}>{insight.value}</span>
          </div>
        )
      })}
    </div>
  )
}

/** Renders the persistent memory strip showing current weight, goal, last session, and last weigh-in. */
export function MemoryStrip({ memory }: { memory: InsightMemory }) {
  type MemoryItem = { icon: LucideIcon; label: string; value: string }
  const items: MemoryItem[] = [
    memory.currentWeight   ? { icon: Scale,        label: 'Poids actuel',    value: `${memory.currentWeight} kg` } : null,
    memory.targetWeight    ? { icon: Target,        label: 'Objectif',        value: `${memory.targetWeight} kg` } : null,
    memory.currentGoal     ? { icon: TrendingDown,  label: 'Programme',       value: GOAL_LABELS[memory.currentGoal] ?? memory.currentGoal } : null,
    memory.lastSessionDate ? { icon: Dumbbell,      label: 'Dernière séance', value: memory.lastSessionDate + (memory.lastSessionMuscles.length ? ` · ${memory.lastSessionMuscles.join('+')}` : '') } : null,
    memory.lastWeighinDate ? { icon: Scale,         label: 'Dernière pesée',  value: memory.lastWeighinDate } : null,
  ].filter((x): x is MemoryItem => x !== null)

  if (!items.length) return null

  return (
    <div className="flex flex-wrap gap-x-5 gap-y-1 rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2.5">
      {items.map(({ icon: Icon, label, value }, i) => (
        <div key={i} className="flex items-center gap-1.5 text-xs">
          <Icon className="size-3 text-zinc-600 shrink-0" />
          <span className="text-zinc-600">{label}:</span>
          <span className="font-medium text-zinc-300">{value}</span>
        </div>
      ))}
    </div>
  )
}
