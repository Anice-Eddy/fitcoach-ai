'use client'

import { useEffect, useMemo, useState } from 'react'
import { Bot, Brain, Dumbbell, Loader2, MessageSquare, Send, Sparkles, Utensils, Users } from 'lucide-react'

type AgentType = 'TRAINING' | 'NUTRITION' | 'PROGRESSION' | 'MOTIVATION' | 'COACH_REPORT'

type ChatMessage = {
  role: 'user' | 'assistant'
  content: string
  provider?: string
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
  { value: 'TRAINING',     label: 'Entraînement', desc: 'Volume, exercices, charges, progression', icon: Dumbbell },
  { value: 'NUTRITION',    label: 'Nutrition',    desc: 'Calories, macros, repas, cohérence objectif', icon: Utensils },
  { value: 'PROGRESSION',  label: 'Progression',  desc: 'Tendances, stagnation, régularité', icon: Brain },
  { value: 'MOTIVATION',   label: 'Motivation',   desc: 'Conseils pratiques et adhérence', icon: Sparkles },
  { value: 'COACH_REPORT', label: 'Rapport coach', desc: 'Synthèse complète pour le coach', icon: Users },
]

const QUICK_ACTIONS = [
  { label: 'Générer une analyse IA', endpoint: '/api/ai/member-analysis' },
  { label: 'Générer un programme', endpoint: '/api/ai/generate-workout-plan' },
  { label: 'Générer un plan nutritionnel', endpoint: '/api/ai/generate-nutrition-plan' },
]

export function AIAssistantClient({ mode }: { mode: 'member' | 'coach' }) {
  const [agent, setAgent] = useState<AgentType>(mode === 'coach' ? 'COACH_REPORT' : 'TRAINING')
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [members, setMembers] = useState<CoachMember[]>([])
  const [memberId, setMemberId] = useState('')

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

  const selectedMemberName = useMemo(() => {
    const found = members.find(m => m.memberId === memberId)
    return found?.member.name ?? found?.member.email ?? ''
  }, [members, memberId])

  const requestBody = (extra?: Record<string, unknown>) => ({
    ...extra,
    ...(mode === 'coach' ? { memberId } : {}),
  })

  const canSend = message.trim().length > 0 && !loading && (mode === 'member' || !!memberId)

  const sendMessage = async () => {
    if (!canSend) return
    const text = message.trim()
    setMessage('')
    setError('')
    setMessages(prev => [...prev, { role: 'user', content: text }])
    setLoading(true)

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody({ agentType: agent, message: text, conversationId })),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error ?? 'Erreur IA')
      setConversationId(data.conversationId)
      setMessages(prev => [...prev, { role: 'assistant', content: data.response, provider: data.provider }])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur IA')
    } finally {
      setLoading(false)
    }
  }

  const runAction = async (endpoint: string) => {
    setError('')
    setLoading(true)
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody()),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error ?? 'Erreur IA')
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: data.response,
          provider: data.provider,
        },
      ])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur IA')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Assistant IA</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Agents spécialisés entraînement, nutrition, progression, motivation et rapports coach.
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
              {members.length === 0 ? (
                <option value="">Aucun membre assigné</option>
              ) : members.map(m => (
                <option key={m.memberId} value={m.memberId}>
                  {m.member.name ?? m.member.email}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      <div className="grid gap-3 md:grid-cols-5">
        {AGENTS.filter(a => mode === 'coach' || a.value !== 'COACH_REPORT').map(({ value, label, desc, icon: Icon }) => (
          <button
            key={value}
            type="button"
            onClick={() => {
              setAgent(value)
              setMessages([])
              setConversationId(null)
            }}
            className={`rounded-xl border p-4 text-left transition-colors ${
              agent === value
                ? 'border-[#C8F135] bg-[#C8F135]/10'
                : 'border-zinc-800 bg-zinc-900 hover:border-zinc-700'
            }`}
          >
            <Icon className={agent === value ? 'mb-3 size-5 text-[#C8F135]' : 'mb-3 size-5 text-zinc-500'} />
            <p className="text-sm font-semibold text-white">{label}</p>
            <p className="mt-1 text-xs leading-relaxed text-zinc-500">{desc}</p>
          </button>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {QUICK_ACTIONS.map(action => (
          <button
            key={action.endpoint}
            type="button"
            disabled={loading || (mode === 'coach' && !memberId)}
            onClick={() => runAction(action.endpoint)}
            className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm font-medium text-zinc-200 transition-colors hover:border-[#C8F135]/60 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {action.label}
          </button>
        ))}
        {mode === 'coach' && (
          <button
            type="button"
            disabled={loading || !memberId}
            onClick={() => runAction('/api/ai/coach-report')}
            className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm font-medium text-zinc-200 transition-colors hover:border-[#C8F135]/60 hover:text-white disabled:cursor-not-allowed disabled:opacity-50 sm:col-span-3"
          >
            Générer un rapport coach pour {selectedMemberName || 'ce membre'}
          </button>
        )}
      </div>

      <div className="min-h-[420px] rounded-2xl border border-zinc-800 bg-zinc-900">
        <div className="border-b border-zinc-800 px-5 py-4">
          <div className="flex items-center gap-2">
            <Bot className="size-5 text-[#C8F135]" />
            <p className="text-sm font-semibold text-white">Chat IA</p>
          </div>
          <p className="mt-1 text-xs text-zinc-500">
            Les réponses utilisent uniquement les données disponibles en base. Ce n’est pas un avis médical.
          </p>
        </div>

        <div className="max-h-[520px] space-y-4 overflow-y-auto px-5 py-5">
          {messages.length === 0 ? (
            <div className="flex min-h-64 flex-col items-center justify-center text-center">
              <MessageSquare className="mb-3 size-8 text-zinc-700" />
              <p className="text-sm font-medium text-zinc-300">Posez une question à un agent spécialisé.</p>
              <p className="mt-1 max-w-md text-xs leading-relaxed text-zinc-500">
                Exemple: “Analyse ma progression sur les 4 dernières semaines” ou “Quel ajustement nutrition me conseilles-tu ?”
              </p>
            </div>
          ) : messages.map((m, idx) => (
            <div key={idx} className={m.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
              <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                m.role === 'user'
                  ? 'bg-[#C8F135] text-zinc-950'
                  : 'border border-zinc-800 bg-zinc-950 text-zinc-200'
              }`}>
                <p className="whitespace-pre-wrap">{m.content}</p>
                {m.provider && <p className="mt-2 text-[10px] uppercase tracking-wider text-zinc-500">Provider: {m.provider}</p>}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex items-center gap-2 text-sm text-zinc-500">
              <Loader2 className="size-4 animate-spin" /> L’agent analyse les données...
            </div>
          )}
        </div>

        {error && (
          <div className="mx-5 mb-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        <div className="flex gap-3 border-t border-zinc-800 p-4">
          <input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                sendMessage()
              }
            }}
            placeholder={mode === 'coach' && !memberId ? 'Sélectionnez un membre...' : 'Écrivez votre message...'}
            disabled={loading || (mode === 'coach' && !memberId)}
            className="min-w-0 flex-1 rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-white outline-none transition-colors placeholder:text-zinc-600 focus:border-[#C8F135] disabled:opacity-50"
          />
          <button
            type="button"
            disabled={!canSend}
            onClick={sendMessage}
            className="inline-flex size-12 shrink-0 items-center justify-center rounded-xl bg-[#C8F135] text-zinc-950 transition-colors hover:bg-[#d4f54d] disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Envoyer le message IA"
          >
            {loading ? <Loader2 className="size-5 animate-spin" /> : <Send className="size-5" />}
          </button>
        </div>
      </div>
    </div>
  )
}
