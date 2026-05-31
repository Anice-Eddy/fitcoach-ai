'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { AlertTriangle, Bot, Brain, Dumbbell, Loader2, MessageSquare, Send, Sparkles, Utensils, Users } from 'lucide-react'
import { InsightCards, MemoryStrip } from '@/components/ai/InsightCards'
import type { InsightsPayload } from '@/app/api/ai/insights/route'

type AgentType = 'TRAINING' | 'NUTRITION' | 'PROGRESSION' | 'MOTIVATION' | 'COACH_REPORT'

type ChatMessage = {
  role: 'user' | 'assistant'
  content: string
}

type CoachMember = {
  memberId: string
  member: {
    id: string
    name: string | null
    email: string
    profile?: { firstName?: string | null } | null
  }
}

const AGENTS: { value: AgentType; label: string; desc: string; icon: React.ElementType }[] = [
  { value: 'TRAINING',     label: 'Entraînement', desc: 'Charges, volume, programme',      icon: Dumbbell },
  { value: 'NUTRITION',    label: 'Nutrition',    desc: 'Calories, macros, repas',          icon: Utensils },
  { value: 'PROGRESSION',  label: 'Progression',  desc: 'Tendances, stagnation',            icon: Brain },
  { value: 'MOTIVATION',   label: 'Motivation',   desc: 'Conseils et adhérence',            icon: Sparkles },
  { value: 'COACH_REPORT', label: 'Rapport coach', desc: 'Synthèse complète',               icon: Users },
]

const QUICK_ACTIONS = [
  { label: 'Générer un programme',       endpoint: '/api/ai/generate-workout-plan' },
  { label: 'Générer un plan nutritionnel', endpoint: '/api/ai/generate-nutrition-plan' },
  { label: 'Analyse IA complète',         endpoint: '/api/ai/member-analysis' },
]

// Simple inline markdown renderer — handles **bold**, bullet lists, headings, line breaks.
function MarkdownContent({ text }: { text: string }) {
  const lines = text.split('\n')
  return (
    <div className="space-y-0.5">
      {lines.map((line, i) => {
        if (!line.trim()) return <div key={i} className="h-1.5" />

        const isBullet  = /^[-*•]\s/.test(line)
        const isH3      = line.startsWith('### ')
        const isH2      = line.startsWith('## ')
        const clean     = line.replace(/^[-*•]\s/, '').replace(/^#{2,3}\s/, '')

        const renderInline = (raw: string) => {
          const parts = raw.split(/(\*\*[^*]+\*\*)/g)
          return parts.map((p, j) =>
            p.startsWith('**') && p.endsWith('**')
              ? <strong key={j} className="font-semibold text-white">{p.slice(2, -2)}</strong>
              : <span key={j}>{p}</span>,
          )
        }

        if (isH2 || isH3) {
          return <p key={i} className="mt-2 font-semibold text-white text-sm">{renderInline(clean)}</p>
        }
        if (isBullet) {
          return (
            <div key={i} className="flex gap-2 items-start">
              <span className="mt-[3px] shrink-0 size-1.5 rounded-full bg-[#C8F135]" />
              <span>{renderInline(clean)}</span>
            </div>
          )
        }
        return <p key={i}>{renderInline(line)}</p>
      })}
    </div>
  )
}

/** Full AI assistant with insight cards, memory strip, agent tabs, quick actions, and markdown-rendered chat. */
export function AIAssistantClient({ mode }: { mode: 'member' | 'coach' }) {
  const [agent, setAgent]               = useState<AgentType>(mode === 'coach' ? 'COACH_REPORT' : 'TRAINING')
  const [message, setMessage]           = useState('')
  const [messages, setMessages]         = useState<ChatMessage[]>([])
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [loading, setLoading]           = useState(false)
  const [error, setError]               = useState('')
  const [members, setMembers]           = useState<CoachMember[]>([])
  const [memberId, setMemberId]         = useState('')
  const [insights, setInsights]         = useState<InsightsPayload | null>(null)
  const bottomRef                       = useRef<HTMLDivElement>(null)

  // Fetch coach member list
  useEffect(() => {
    if (mode !== 'coach') return
    fetch('/api/coach/members')
      .then(res => res.ok ? res.json() : [])
      .then((data) => {
        const list = Array.isArray(data) ? data : []
        setMembers(list)
        setMemberId(list[0]?.memberId ?? '')
      })
      .catch(() => setMembers([]))
  }, [mode])

  // Fetch insights (re-runs when coach switches member)
  useEffect(() => {
    const id    = mode === 'coach' ? memberId : undefined
    if (mode === 'coach' && !id) return
    const url   = id ? `/api/ai/insights?memberId=${id}` : '/api/ai/insights'
    fetch(url)
      .then(r => r.ok ? r.json() : null)
      .then(d => d && setInsights(d))
      .catch(() => null)
  }, [mode, memberId])

  // Scroll to latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const selectedMemberName = useMemo(() => {
    const found = members.find(m => m.memberId === memberId)
    return found?.member.name ?? found?.member.email ?? ''
  }, [members, memberId])

  const requestBody = (extra?: Record<string, unknown>) => ({
    ...extra,
    ...(mode === 'coach' ? { memberId } : {}),
  })

  const canSend = message.trim().length > 0 && !loading && (mode === 'member' || !!memberId)

  const showError = (msg: string) => {
    setError(msg)
    setTimeout(() => setError(''), 5000)
  }

  const sendMessage = async () => {
    if (!canSend) return
    const text = message.trim()
    setMessage('')
    setError('')
    setMessages(prev => [...prev, { role: 'user', content: text }])
    setLoading(true)
    try {
      const res  = await fetch('/api/ai/chat', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody({ agentType: agent, message: text, conversationId, provider: 'AUTO' })),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error ?? 'Erreur IA')
      setConversationId(data.conversationId)
      setMessages(prev => [...prev, { role: 'assistant', content: data.response }])
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Erreur IA')
    } finally {
      setLoading(false)
    }
  }

  const runAction = async (endpoint: string) => {
    setError('')
    setLoading(true)
    try {
      const res  = await fetch(endpoint, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody()),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error ?? 'Erreur IA')
      setMessages(prev => [...prev, { role: 'assistant', content: data.response }])
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Erreur IA')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4 sm:space-y-5">

      {/* ── Header ───────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-white sm:text-2xl">Assistant IA</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Analyse personnalisée basée sur tes données réelles.{' '}
            <span className="text-zinc-600">L'IA est un outil d'aide, pas un substitut à un professionnel de santé.</span>
          </p>
        </div>
        {mode === 'coach' && (
          <label className="min-w-64">
            <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-zinc-500">Membre analysé</span>
            <select
              value={memberId}
              onChange={(e) => {
                setMemberId(e.target.value)
                setMessages([])
                setConversationId(null)
              }}
              className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-sm text-white outline-none focus:border-[#C8F135]"
            >
              {members.length === 0
                ? <option value="">Aucun membre assigné</option>
                : members.map(m => (
                    <option key={m.memberId} value={m.memberId}>{m.member.name ?? m.member.email}</option>
                  ))
              }
            </select>
          </label>
        )}
      </div>

      {/* ── AI disclaimer ─────────────────────────────────────── */}
      {mode === 'member' && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-500/25 bg-amber-500/8 px-4 py-3">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-400" />
          <p className="text-xs text-amber-200/75 leading-relaxed">
            <strong className="text-amber-300 font-semibold">Information importante —</strong>{' '}
            L'assistant IA de BodyOps est un outil d'aide à la planification et ne remplace pas un coach certifié,
            un nutritionniste ou un médecin. Consultez un professionnel de santé avant tout changement significatif
            de régime alimentaire ou d'entraînement.{' '}
            <a href="/terms" target="_blank" className="underline hover:text-amber-300 transition-colors">CGU</a>
            {' · '}
            <a href="/privacy" target="_blank" className="underline hover:text-amber-300 transition-colors">Confidentialité</a>
          </p>
        </div>
      )}

      {/* ── Insight badges ────────────────────────────────────── */}
      {insights && <InsightCards insights={insights.insights} />}

      {/* ── Memory strip ──────────────────────────────────────── */}
      {insights?.memory && <MemoryStrip memory={insights.memory} />}

      {/* ── Assistant topic ───────────────────────────────────── */}
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">Sujet de l'assistant</p>
          <p className="text-xs text-zinc-600">{AGENTS.find(a => a.value === agent)?.desc}</p>
        </div>
        <div className="-mx-4 flex snap-x gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:grid sm:px-0 sm:pb-0 md:grid-cols-5">
          {AGENTS.filter(a => mode === 'coach' || a.value !== 'COACH_REPORT').map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              type="button"
              onClick={() => setAgent(value)}
              className={`flex min-w-[140px] snap-start items-center gap-2 rounded-xl border px-3 py-3 text-left transition-colors sm:min-w-0 ${
                agent === value
                  ? 'border-[#C8F135] bg-[#C8F135]/10 text-white'
                  : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-700 hover:text-white'
              }`}
              aria-pressed={agent === value}
            >
              <Icon className={`size-4 shrink-0 ${agent === value ? 'text-[#C8F135]' : 'text-zinc-500'}`} />
              <span className="truncate text-sm font-semibold">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Quick actions ─────────────────────────────────────── */}
      <div className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">Actions rapides</p>
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:grid sm:grid-cols-3 sm:px-0 sm:pb-0">
          {QUICK_ACTIONS.map(action => (
            <button
              key={action.endpoint}
              type="button"
              disabled={loading || (mode === 'coach' && !memberId)}
              onClick={() => runAction(action.endpoint)}
              className="min-w-[190px] rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-2.5 text-sm font-medium text-zinc-300 transition-colors hover:border-[#C8F135]/50 hover:text-white disabled:cursor-not-allowed disabled:opacity-50 sm:min-w-0"
            >
              {action.label}
            </button>
          ))}
          {mode === 'coach' && (
            <button
              type="button"
              disabled={loading || !memberId}
              onClick={() => runAction('/api/ai/coach-report')}
              className="min-w-[220px] rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-2.5 text-sm font-medium text-zinc-300 transition-colors hover:border-[#C8F135]/50 hover:text-white disabled:cursor-not-allowed disabled:opacity-50 sm:col-span-3 sm:min-w-0"
            >
              Rapport coach — {selectedMemberName || 'ce membre'}
            </button>
          )}
        </div>
      </div>

      {/* ── Chat ─────────────────────────────────────────────── */}
      <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900">

        <div className="border-b border-zinc-800 px-4 py-3.5 sm:px-5">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <Bot className="size-4 text-[#C8F135]" />
              <p className="text-sm font-semibold text-white">Chat</p>
            </div>
          </div>
        </div>

        <div className="min-h-[260px] max-h-[50svh] overflow-y-auto px-4 py-4 space-y-3 overscroll-contain sm:min-h-[360px] sm:max-h-[500px] sm:px-5">
          {messages.length === 0 ? (
            <div className="flex min-h-56 flex-col items-center justify-center text-center">
              <MessageSquare className="mb-3 size-7 text-zinc-700" />
              <p className="text-sm font-medium text-zinc-400">Posez une question à votre coach IA.</p>
              <p className="mt-1 max-w-64 text-xs leading-relaxed text-zinc-600 sm:max-w-none">
                "Fais-moi un programme cette semaine" · "Comment améliorer mes macros ?"
              </p>
            </div>
          ) : (
            messages.map((m, idx) => (
              <div key={idx} className={m.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
                <div className={`max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  m.role === 'user'
                    ? 'bg-[#C8F135] text-zinc-950 font-medium'
                    : 'border border-zinc-800 bg-zinc-950 text-zinc-300'
                }`}>
                  {m.role === 'assistant'
                    ? <MarkdownContent text={m.content} />
                    : <p>{m.content}</p>
                  }
                </div>
              </div>
            ))
          )}
          {loading && (
            <div className="flex items-center gap-2 text-xs text-zinc-500 pl-1">
              <Loader2 className="size-3.5 animate-spin" />
              <span>Analyse en cours…</span>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {error && (
          <div className="mx-5 mb-3 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        <div className="sticky bottom-0 flex gap-2 border-t border-zinc-800 bg-zinc-900 p-3 sm:gap-3 sm:p-4">
          <input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
            placeholder={mode === 'coach' && !memberId ? 'Sélectionnez un membre...' : 'Votre message…'}
            disabled={loading || (mode === 'coach' && !memberId)}
            className="min-w-0 flex-1 rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-3 text-base text-white outline-none transition-colors placeholder:text-zinc-600 focus:border-[#C8F135] disabled:opacity-50 sm:px-4 sm:text-sm"
          />
          <button
            type="button"
            disabled={!canSend}
            onClick={sendMessage}
            className="inline-flex size-12 shrink-0 items-center justify-center rounded-xl bg-[#C8F135] text-zinc-950 transition-colors hover:bg-[#d4f54d] disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Envoyer"
          >
            {loading ? <Loader2 className="size-5 animate-spin" /> : <Send className="size-5" />}
          </button>
        </div>
      </div>

    </div>
  )
}
