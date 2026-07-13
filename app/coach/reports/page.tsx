'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  TrendingUp, TrendingDown, Users, Calendar, MessageSquare,
  CheckCircle, Award, Activity, RefreshCw, Minus, Bot, Loader2,
} from 'lucide-react'
import { format } from 'date-fns'
import { enUS, fr } from 'date-fns/locale'
import { useLocale } from '@/contexts/LocaleContext'

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

// KPI stat card with icon, numeric value, label, and optional sub-label.
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

// Renders a centred italic message for an empty report section.
function EmptySection({ message }: { message: string }) {
  return (
    <p className="text-sm text-zinc-500 italic py-4 text-center">{message}</p>
  )
}

/** Coach analytics page: fetches and displays KPI stats, member completion rates, top performers, and recent activity. */
export default function CoachReports() {
  const { locale, t } = useLocale()
  const [data, setData]       = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState('')
  const [aiReport, setAiReport] = useState<{ response: string; provider?: string } | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/coach/reports')
      if (!res.ok) throw new Error(t('coachReports.serverError'))
      setData(await res.json())
    } catch {
      setError(t('coachReports.loadError'))
    } finally {
      setLoading(false)
    }
  }, [t])

  useEffect(() => { load() }, [load])

  const generateAIReport = async () => {
    setAiLoading(true)
    setAiError('')
    setAiReport(null)
    try {
      const res = await fetch('/api/ai/coach-report', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ memberId: data?.recentActivity[0]?.memberId ?? '' }),
      })
      const payload = await res.json()
      if (!res.ok) throw new Error(payload?.error ?? t('coachReports.aiError'))
      setAiReport({ response: payload.response, provider: payload.provider })
    } catch (err) {
      setAiError(err instanceof Error ? err.message : t('coachReports.aiGenerateError'))
    } finally {
      setAiLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">{t('coachReports.title')}</h1>
          <p className="text-zinc-400 text-sm mt-1">{t('coachReports.loadingDescription')}</p>
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
        <h1 className="text-2xl font-bold">{t('coachReports.title')}</h1>
        <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-6 text-center">
          <p className="text-sm text-zinc-500">{error ?? t('coachReports.noData')}</p>
          <button
            onClick={load}
            className="mt-3 inline-flex items-center gap-2 text-xs text-zinc-400 hover:text-white transition-colors"
          >
            <RefreshCw className="size-3.5" /> {t('coachReports.retry')}
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
          <h1 className="text-2xl font-bold">{t('coachReports.title')}</h1>
          <p className="text-zinc-400 text-sm mt-1">{t('coachReports.description')}</p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors border border-zinc-800 rounded-lg px-3 py-2 hover:border-zinc-600"
        >
          <RefreshCw className="size-3.5" /> {t('coachReports.refresh')}
        </button>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label={t('coachReports.kpi.members')}
          value={data.totalMembers}
          icon={Users}
          color="text-[#C8F135]"
        />
        <StatCard
          label={t('coachReports.kpi.completedAppointments')}
          value={data.appointmentsCompleted}
          icon={Calendar}
          color="text-blue-400"
          sub={`${data.appointmentsUpcoming} ${t('coachReports.kpi.upcoming')}`}
        />
        <StatCard
          label={t('coachReports.kpi.sessionsThisMonth')}
          value={data.sessionsThisMonth}
          icon={Activity}
          color="text-emerald-400"
          sub={`${data.sessionsThisWeek} ${t('coachReports.kpi.thisWeek')}`}
        />
        <StatCard
          label={t('coachReports.kpi.sentNotes')}
          value={data.notesSent}
          icon={MessageSquare}
          color="text-purple-400"
          sub={`${data.repliesReceived} ${data.repliesReceived !== 1 ? t('coachReports.kpi.repliesReceived') : t('coachReports.kpi.replyReceived')}`}
        />
      </div>

      {/* Performance indicators */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-5">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle className="size-4 text-[#C8F135]" />
            <h2 className="text-sm font-semibold text-white">{t('coachReports.completionRate')}</h2>
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
                {t('coachReports.basedOn')} {data.sessionsThisMonth} {t('coachReports.sessionsThisMonthLower')}
              </p>
            </div>
          ) : (
            <EmptySection message={t('coachReports.notEnoughSessionData')} />
          )}
        </div>

        <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-5">
          <div className="flex items-center gap-2 mb-3">
            {(() => {
              const Icon = weightDeltaIcon
              return <Icon className={`size-4 ${weightDeltaColor}`} />
            })()}
            <h2 className="text-sm font-semibold text-white">{t('coachReports.avgWeightEvolution')}</h2>
          </div>
          {data.avgWeightDelta !== null ? (
            <div>
              <div className={`text-3xl font-bold mb-1 ${weightDeltaColor}`}>
                {weightDeltaLabel}
              </div>
              <p className="text-xs text-zinc-500">
                {t('coachReports.avgWeightDescription')}
              </p>
            </div>
          ) : (
            <EmptySection message={t('coachReports.notEnoughWeightData')} />
          )}
        </div>
      </div>

      {/* Top performers this month */}
      <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Bot className="size-5 text-[#C8F135]" />
            <div>
              <h2 className="text-base font-semibold">{t('coachReports.aiTitle')}</h2>
              <p className="text-xs text-zinc-500">{t('coachReports.aiDescription')}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={generateAIReport}
            disabled={aiLoading || data.recentActivity.length === 0}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#C8F135] px-4 py-2.5 text-sm font-bold text-zinc-950 transition-colors hover:bg-[#d4f54d] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {aiLoading ? <Loader2 className="size-4 animate-spin" /> : <Bot className="size-4" />}
            {t('coachReports.generateAI')}
          </button>
        </div>

        {data.recentActivity.length === 0 ? (
          <EmptySection message={t('coachReports.aiInsufficientData')} />
        ) : aiError ? (
          <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {aiError}
          </div>
        ) : aiReport ? (
          <div className="mt-4 rounded-xl border border-zinc-800 bg-zinc-950 p-4">
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-200">{aiReport.response}</p>
            {aiReport.provider && <p className="mt-3 text-[10px] uppercase tracking-wider text-zinc-600">{t('coachReports.provider')}: {aiReport.provider}</p>}
          </div>
        ) : (
          <p className="mt-4 text-sm text-zinc-500">
            {t('coachReports.aiEmpty')}
          </p>
        )}
      </div>

      {/* Top performers this month */}
      <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Award className="size-5 text-amber-400" />
          <h2 className="text-base font-semibold">{t('coachReports.topPerformers')}</h2>
        </div>
        {data.topPerformers.length === 0 ? (
          <EmptySection message={t('coachReports.noCompletedSessionThisMonth')} />
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
                  {p.count} {p.count !== 1 ? t('coachReports.sessions') : t('coachReports.session')}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent member activity */}
      <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="size-5 text-blue-400" />
          <h2 className="text-base font-semibold">{t('coachReports.latestActivity')}</h2>
        </div>
        {data.recentActivity.length === 0 ? (
          <EmptySection message={t('coachReports.noTrackedMemberYet')} />
        ) : (
          <div className="space-y-2">
            {data.recentActivity.map(m => (
              <div key={m.memberId} className="flex items-center justify-between py-2 border-b border-zinc-800 last:border-0 gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="size-8 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-300 shrink-0">
                    {(m.name ?? '?').charAt(0).toUpperCase()}
                  </div>
                  <p className="text-sm text-zinc-300 truncate">{m.name ?? t('messagesPage.member')}</p>
                </div>
                <p className="text-xs text-zinc-500 shrink-0">
                  {m.lastSessionAt
                    ? `${t('coachReports.lastSession')}: ${format(new Date(m.lastSessionAt), locale === 'fr' ? 'd MMM yyyy' : 'MMM d, yyyy', { locale: locale === 'fr' ? fr : enUS })}`
                    : t('coachMembers.activityTab.noSession')}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
