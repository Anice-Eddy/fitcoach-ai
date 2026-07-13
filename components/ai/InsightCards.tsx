'use client'

import type { LucideIcon } from 'lucide-react'
import { AlertTriangle, CheckCircle, Info, TrendingDown, Target, Dumbbell, Scale } from 'lucide-react'
import type { Insight, InsightMemory, InsightType } from '@/app/api/ai/insights/route'
import { useLocale } from '@/contexts/LocaleContext'
import { GOAL_LABEL_KEYS, MUSCLE_GROUP_LABEL_KEYS } from '@/lib/i18n/profile-label-keys'

const TYPE_STYLES: Record<InsightType, { bg: string; border: string; text: string; icon: LucideIcon }> = {
  success: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-400', icon: CheckCircle },
  warning: { bg: 'bg-amber-500/10',   border: 'border-amber-500/30',   text: 'text-amber-400',   icon: AlertTriangle },
  alert:   { bg: 'bg-red-500/10',     border: 'border-red-500/30',     text: 'text-red-400',     icon: AlertTriangle },
  info:    { bg: 'bg-zinc-800',        border: 'border-zinc-700',       text: 'text-zinc-400',    icon: Info },
}

const INSIGHT_LABEL_KEYS: Record<string, string> = {
  Consistency:       'aiAssistant.insights.labels.consistency',
  'Low consistency': 'aiAssistant.insights.labels.lowConsistency',
  Sessions:          'aiAssistant.insights.labels.sessions',
  Inactivity:        'aiAssistant.insights.labels.inactivity',
  'Weigh-in':        'aiAssistant.insights.labels.weighIn',
  'Missing weigh-in': 'aiAssistant.insights.labels.missingWeighIn',
  Nutrition:         'aiAssistant.insights.labels.nutrition',
  Stagnation:        'aiAssistant.insights.labels.stagnation',
  Progression:       'aiAssistant.insights.labels.progression',
}

const INSIGHT_VALUE_KEYS: Record<string, string> = {
  'None recorded':  'aiAssistant.insights.values.noneRecorded',
  'No measurement': 'aiAssistant.insights.values.noMeasurement',
  'No active plan': 'aiAssistant.insights.values.noActivePlan',
  'Active plan':    'aiAssistant.insights.values.activePlan',
  'Stable weight':  'aiAssistant.insights.values.stableWeight',
}

function translateInsightLabel(label: string, t: (key: string) => string) {
  const key = INSIGHT_LABEL_KEYS[label]
  return key ? t(key) : label
}

function translateInsightValue(value: string, t: (key: string) => string) {
  const staticKey = INSIGHT_VALUE_KEYS[value]
  if (staticKey) return t(staticKey)

  const inactivityMatch = value.match(/^(\d+)d without training$/)
  if (inactivityMatch) {
    return t('aiAssistant.insights.values.daysWithoutTraining').replace('{days}', inactivityMatch[1])
  }

  return value
}

function formatMemoryDate(value: string, locale: 'fr' | 'en') {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', {
    day:   '2-digit',
    month: '2-digit',
  })
}

function translateMuscleGroup(group: string, t: (key: string) => string) {
  const key = MUSCLE_GROUP_LABEL_KEYS[group]
  return key ? t(key) : group
}

/** Renders a compact row of insight badge cards derived from member fitness data. */
export function InsightCards({ insights }: { insights: Insight[] }) {
  const { t } = useLocale()
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
            <span className="text-zinc-300">{translateInsightLabel(insight.label, t)}</span>
            <span className={`font-semibold ${s.text}`}>{translateInsightValue(insight.value, t)}</span>
          </div>
        )
      })}
    </div>
  )
}

/** Renders the persistent memory strip showing current weight, goal, last session, and last weigh-in. */
export function MemoryStrip({ memory }: { memory: InsightMemory }) {
  const { locale, t } = useLocale()
  type MemoryItem = { icon: LucideIcon; label: string; value: string }
  const items: MemoryItem[] = [
    memory.currentWeight   ? { icon: Scale,        label: t('coachMembers.overview.currentWeight'), value: `${memory.currentWeight} kg` } : null,
    memory.targetWeight    ? { icon: Target,        label: t('coachMembers.overview.goal'), value: `${memory.targetWeight} kg` } : null,
    memory.currentGoal     ? { icon: TrendingDown,  label: t('aiAssistant.memory.program'), value: GOAL_LABEL_KEYS[memory.currentGoal] ? t(GOAL_LABEL_KEYS[memory.currentGoal]) : memory.currentGoal } : null,
    memory.lastSessionDate ? { icon: Dumbbell,      label: t('aiAssistant.memory.lastSession'), value: formatMemoryDate(memory.lastSessionDate, locale) + (memory.lastSessionMuscles.length ? ` · ${memory.lastSessionMuscles.map(group => translateMuscleGroup(group, t)).join('+')}` : '') } : null,
    memory.lastWeighinDate ? { icon: Scale,         label: t('aiAssistant.memory.lastWeighIn'), value: formatMemoryDate(memory.lastWeighinDate, locale) } : null,
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
