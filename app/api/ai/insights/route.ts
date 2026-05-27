export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { getAIAccess } from '@/app/api/ai/_utils'
import { getMemberAIContext } from '@/lib/ai/context'
import type { MemberAIContext } from '@/lib/ai/types'

export type InsightType = 'success' | 'warning' | 'alert' | 'info'
export type Insight = { type: InsightType; label: string; value: string }
export type InsightMemory = {
  currentWeight:      number | null
  targetWeight:       number | null
  currentGoal:        string | null
  lastSessionDate:    string | null
  lastSessionMuscles: string[]
  lastWeighinDate:    string | null
  daysWithoutSession: number | null
  daysWithoutWeighin: number | null
}
export type InsightsPayload = {
  insights:      Insight[]
  memory:        InsightMemory
  adherenceRate: number | null
}

type SessionLike = Record<string, unknown>
type MetricLike  = { weightKg?: number | null; date?: Date | string | null }
type LogLike     = { exercise?: { muscleGroups?: string[] } }

function daysAgo(date: Date | string | null | undefined): number | null {
  if (!date) return null
  return Math.floor((Date.now() - new Date(date).getTime()) / 86_400_000)
}

/** Derives structured fitness insights from member context without calling any AI provider. */
function computeInsights(context: MemberAIContext): InsightsPayload {
  const now        = Date.now()
  const cutoff28   = new Date(now - 28 * 86_400_000)
  const sessions   = context.workoutSessions  as SessionLike[]
  const metrics    = context.bodyMetrics      as MetricLike[]
  const { userFacts, nutritionPlans } = context
  const insights: Insight[] = []

  // ── Adherence ────────────────────────────────────────────────
  const recentDone  = sessions.filter(s =>
    s['status'] === 'COMPLETED' &&
    s['completedAt'] &&
    new Date(s['completedAt'] as string) >= cutoff28,
  )
  const target      = (userFacts.trainingDaysPerWeek ?? 3) * 4
  const adherence   = target > 0 ? Math.min(100, Math.round((recentDone.length / target) * 100)) : null

  if (adherence !== null) {
    if      (adherence >= 80) insights.push({ type: 'success', label: 'Régularité',      value: `${adherence}%` })
    else if (adherence >= 50) insights.push({ type: 'warning', label: 'Régularité',      value: `${adherence}%` })
    else                      insights.push({ type: 'alert',   label: 'Régularité faible', value: `${adherence}%` })
  }

  // ── Last session ─────────────────────────────────────────────
  const lastSession = sessions.find(s => s['status'] === 'COMPLETED' && s['completedAt'])
  const daysSinceSession = daysAgo(lastSession?.['completedAt'] as string | null)

  if (daysSinceSession === null) {
    insights.push({ type: 'info', label: 'Séances', value: 'Aucune enregistrée' })
  } else if (daysSinceSession > 7) {
    insights.push({ type: 'warning', label: 'Inactivité', value: `${daysSinceSession}j sans séance` })
  }

  // ── Weigh-in ─────────────────────────────────────────────────
  const daysSinceWeighin = daysAgo(metrics[0]?.date)

  if (daysSinceWeighin === null) {
    insights.push({ type: 'info', label: 'Pesée', value: 'Aucune mesure' })
  } else if (daysSinceWeighin > 10) {
    insights.push({ type: 'warning', label: 'Pesée manquante', value: `${daysSinceWeighin}j` })
  }

  // ── Nutrition ─────────────────────────────────────────────────
  if (!nutritionPlans.length) {
    insights.push({ type: 'warning', label: 'Nutrition', value: 'Aucun plan actif' })
  } else {
    insights.push({ type: 'success', label: 'Nutrition', value: 'Plan actif' })
  }

  // ── Weight trend ─────────────────────────────────────────────
  const weights = metrics
    .slice(0, 4)
    .map(m => m.weightKg)
    .filter((w): w is number => typeof w === 'number')

  if (weights.length >= 3) {
    const delta  = weights[0] - weights[weights.length - 1]
    const goal   = userFacts.primaryGoal
    const stagnant = Math.abs(delta) < 0.3

    if (stagnant && (goal === 'WEIGHT_LOSS' || goal === 'MUSCLE_GAIN')) {
      insights.push({ type: 'info', label: 'Stagnation', value: 'Poids stable' })
    } else if (goal === 'WEIGHT_LOSS' && delta > 0.5) {
      insights.push({ type: 'success', label: 'Progression', value: `-${delta.toFixed(1)} kg` })
    } else if (goal === 'MUSCLE_GAIN' && delta < -0.5) {
      insights.push({ type: 'success', label: 'Progression', value: `+${Math.abs(delta).toFixed(1)} kg` })
    }
  }

  // ── Memory state ──────────────────────────────────────────────
  const lastSessionMuscles = lastSession
    ? Array.from(new Set(
        ((lastSession['exerciseLogs'] as LogLike[] | undefined) ?? [])
          .flatMap(l => l.exercise?.muscleGroups ?? []),
      )).slice(0, 3) as string[]
    : []

  const memory: InsightMemory = {
    currentWeight:      userFacts.currentWeightKg,
    targetWeight:       userFacts.targetWeightKg,
    currentGoal:        userFacts.primaryGoal,
    lastSessionDate:    lastSession?.['completedAt']
      ? new Date(lastSession['completedAt'] as string).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })
      : null,
    lastSessionMuscles,
    lastWeighinDate:    metrics[0]?.date
      ? new Date(metrics[0].date as string).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })
      : null,
    daysWithoutSession: daysSinceSession,
    daysWithoutWeighin: daysSinceWeighin,
  }

  return { insights, memory, adherenceRate: adherence }
}

/** Returns structured fitness insights and memory state for the current member without calling any AI. */
export async function GET(req: Request) {
  const url      = new URL(req.url)
  const memberId = url.searchParams.get('memberId') ?? undefined

  const { access, error } = await getAIAccess(memberId)
  if (error) return error

  const context = await getMemberAIContext(access!.memberId, access!.coachId)
  if (!context) return NextResponse.json({ error: 'Membre introuvable' }, { status: 404 })

  return NextResponse.json(computeInsights(context))
}
