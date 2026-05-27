'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Search, User, CalendarPlus, Mail, FileText, Activity, Calendar,
  Send, Scale, Target, Clock, CheckCircle, XCircle, AlertCircle,
  ChevronRight, Trash2, Plus, X, Pin, Eye, EyeOff, Lock, Unlock,
  MessageSquare, ChevronDown, ChevronUp, Pencil, Check, PlusCircle,
} from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { cn } from '@/lib/utils'

// ─── Types ───────────────────────────────────────────────────────────────────

interface MemberItem {
  member: {
    id: string; name: string | null; email: string; image: string | null
    profile?: { weightKg: number; fitnessGoal: string; fitnessLevel: string } | null
    bodyMetrics: Array<{ date: string; weightKg: number }>
  }
  assignedAt: string
}

interface NoteReply {
  id: string; content: string; memberId: string
  memberName: string; createdAt: string
}

interface Note {
  id: string; title: string; content: string; category: string | null
  priority: string; status: string; isPinned: boolean; isSharedWithMember: boolean
  isImportant: boolean; tags: string[]; createdAt: string; followUpAt: string | null
  replies?: NoteReply[]
}

interface Session {
  id: string; name: string; status: string
  completedAt: string | null; durationMinutes: number | null; caloriesBurned: number | null
  scheduledAt: string | null; notes: string | null
}

interface Metric {
  id: string; date: string; weightKg: number
  bodyFatPct: number | null; waistCm: number | null
}

interface Appointment {
  id: string; title: string; scheduledAt: string; duration: number
  status: string; description: string | null; coachNote: string | null
  memberNote: string | null; meetLink: string | null
}

interface MemberDetail {
  id: string; name: string | null; email: string; image: string | null; assignedAt: string
  profile: {
    firstName: string; age: number; gender: string; weightKg: number; heightCm: number
    targetWeightKg: number | null; fitnessGoal: string; fitnessLevel: string
    activityLevel: string; trainingDaysPerWeek: number; bmi: number | null; tdee: number | null
    recommendedCalories: number | null; recommendedProteinG: number | null
    recommendedCarbsG: number | null; recommendedFatG: number | null
  } | null
  bodyMetrics: Metric[]
  workoutSessions: Session[]
  coachNotes: Note[]
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const GOAL_LABELS: Record<string, string> = {
  WEIGHT_LOSS: 'Perte de poids', MUSCLE_GAIN: 'Prise de masse',
  MAINTENANCE: 'Maintien', ENDURANCE: 'Endurance',
  FLEXIBILITY: 'Flexibilité', GENERAL_FITNESS: 'Forme générale',
}
const LEVEL_LABELS: Record<string, string> = {
  BEGINNER: 'Débutant', INTERMEDIATE: 'Intermédiaire', ADVANCED: 'Avancé',
}
const STATUS_STYLE: Record<string, { dot: string; text: string; label: string }> = {
  CONFIRMED: { dot: 'bg-[#C8F135]',  text: 'text-[#C8F135]',  label: 'Confirmé' },
  PENDING:   { dot: 'bg-yellow-400', text: 'text-yellow-400', label: 'En attente' },
  PROPOSED:  { dot: 'bg-blue-400',   text: 'text-blue-400',   label: 'Proposé' },
  CANCELLED: { dot: 'bg-red-400',    text: 'text-red-400',    label: 'Annulé' },
  COMPLETED: { dot: 'bg-zinc-500',   text: 'text-zinc-500',   label: 'Terminé' },
}
const SESSION_STYLE: Record<string, { dot: string; label: string }> = {
  COMPLETED:   { dot: 'bg-emerald-400', label: 'Complété' },
  IN_PROGRESS: { dot: 'bg-[#C8F135]',  label: 'En cours' },
  PLANNED:     { dot: 'bg-zinc-500',    label: 'Planifié' },
  SKIPPED:     { dot: 'bg-red-400',     label: 'Manqué' },
}

// Returns 2-letter uppercase initials from a display name or email fallback.
function initials(name: string | null, email: string) {
  if (name) return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  return email.slice(0, 2).toUpperCase()
}

// Tab toggle button with active highlight style.
function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'px-4 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap',
        active ? 'bg-[#C8F135] text-zinc-900' : 'text-zinc-400 hover:text-white hover:bg-zinc-800',
      )}
    >
      {children}
    </button>
  )
}

// Small stat card with label, bold value, and optional sub-text.
function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
      <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1">{label}</p>
      <p className="text-xl font-bold text-white">{value}</p>
      {sub && <p className="text-xs text-zinc-500 mt-0.5">{sub}</p>}
    </div>
  )
}

// Displays a summary of the member's profile: physical stats, goals, BMI, latest metrics, and active program.
function OverviewTab({ detail }: { detail: MemberDetail }) {
  const p = detail.profile
  const last = detail.bodyMetrics[0]
  const doneSessions = detail.workoutSessions.filter(s => s.status === 'COMPLETED').length
  const totalMin = detail.workoutSessions.reduce((a, s) => a + (s.durationMinutes ?? 0), 0)

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Poids actuel" value={last ? `${last.weightKg} kg` : '—'} sub={p?.targetWeightKg ? `Objectif : ${p.targetWeightKg} kg` : undefined} />
        <StatCard label="IMC" value={p?.bmi ? p.bmi.toFixed(1) : '—'} sub={p ? `${p.heightCm} cm` : undefined} />
        <StatCard label="Séances complétées" value={String(doneSessions)} sub={totalMin ? `${totalMin} min total` : undefined} />
        <StatCard label="Objectif" value={p ? (GOAL_LABELS[p.fitnessGoal] ?? p.fitnessGoal) : '—'} sub={p ? (LEVEL_LABELS[p.fitnessLevel] ?? p.fitnessLevel) : undefined} />
      </div>

      {p && (p.recommendedCalories || p.tdee) && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-3">Plan nutritionnel recommandé</p>
          <div className="grid grid-cols-4 gap-3">
            <div className="text-center p-3 rounded-lg bg-zinc-800 border border-zinc-700">
              <p className="text-lg font-bold text-white font-mono">{p.recommendedCalories ? Math.round(p.recommendedCalories).toLocaleString('fr-FR') : '—'}</p>
              <p className="text-[10px] text-zinc-500 mt-0.5">kcal / jour</p>
            </div>
            {[
              { label: 'Protéines', v: p.recommendedProteinG, color: 'text-[#C8F135]' },
              { label: 'Glucides',  v: p.recommendedCarbsG,   color: 'text-blue-400' },
              { label: 'Lipides',   v: p.recommendedFatG,     color: 'text-pink-400' },
            ].map(m => (
              <div key={m.label} className="text-center p-3 rounded-lg bg-zinc-800 border border-zinc-700">
                <p className={`text-lg font-bold font-mono ${m.color}`}>{m.v ? `${Math.round(m.v)}g` : '—'}</p>
                <p className="text-[10px] text-zinc-500 mt-0.5">{m.label}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {detail.bodyMetrics.length > 0 && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-3">Historique de poids (récent)</p>
          <div className="space-y-1.5">
            {detail.bodyMetrics.slice(0, 5).map(m => (
              <div key={m.id} className="flex justify-between items-center text-sm border-b border-zinc-800/60 pb-1.5 last:border-0">
                <span className="text-zinc-400">{format(new Date(m.date), 'd MMM yyyy', { locale: fr })}</span>
                <span className="font-mono text-white font-medium">{m.weightKg} kg</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Notes Tab ────────────────────────────────────────────────────────────────

// Expandable section showing existing replies on a coach note and allowing the coach to fetch the latest replies.
function NoteRepliesSection({ noteId, replies: initialReplies }: { noteId: string; replies: NoteReply[] }) {
  const [expanded, setExpanded]   = useState(false)
  const [replies, setReplies]     = useState<NoteReply[]>(initialReplies)
  const [loading, setLoading]     = useState(false)

  const fetchReplies = async () => {
    setLoading(true)
    const res = await fetch(`/api/coach/notes/${noteId}/replies`).catch(() => null)
    const data = res ? await res.json().catch(() => []) : []
    if (Array.isArray(data)) setReplies(data.map((r: { id: string; content: string; memberId: string; member?: { name?: string }; createdAt: string }) => ({
      id: r.id, content: r.content, memberId: r.memberId,
      memberName: r.member?.name ?? 'Membre', createdAt: r.createdAt,
    })))
    setLoading(false)
  }

  const deleteReply = async (replyId: string) => {
    if (!confirm('Supprimer cette réponse ?')) return
    await fetch(`/api/coach/notes/${noteId}/replies`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ replyId }),
    })
    await fetchReplies()
  }

  const handleToggle = () => {
    if (!expanded) fetchReplies()
    setExpanded(v => !v)
  }

  if (replies.length === 0 && !expanded) return null

  return (
    <div className="mt-3 border-t border-zinc-700/50 pt-3">
      <button
        onClick={handleToggle}
        className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
      >
        <MessageSquare className="size-3.5" />
        {replies.length} réponse{replies.length !== 1 ? 's' : ''}
        {expanded ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
      </button>

      {expanded && (
        <div className="mt-2 space-y-2">
          {loading ? (
            <p className="text-xs text-zinc-600 italic">Chargement…</p>
          ) : replies.length === 0 ? (
            <p className="text-xs text-zinc-600 italic">Aucune réponse</p>
          ) : replies.map(r => (
            <div key={r.id} className="flex items-start gap-2 bg-zinc-800/50 rounded-lg px-3 py-2">
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-semibold text-zinc-400">{r.memberName}</p>
                <p className="text-xs text-zinc-300 mt-0.5">{r.content}</p>
                <p className="text-[10px] text-zinc-600 mt-0.5">
                  {format(new Date(r.createdAt), "d MMM 'à' HH:mm", { locale: fr })}
                </p>
              </div>
              <button
                onClick={() => deleteReply(r.id)}
                className="text-zinc-600 hover:text-red-400 transition-colors shrink-0 mt-0.5"
              >
                <Trash2 className="size-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// Notes management tab: create, share, pin, and delete coach notes for this member.
function NotesTab({ detail, onRefresh }: { detail: MemberDetail; onRefresh: () => void }) {
  const [notes, setNotes]       = useState<Note[]>(detail.coachNotes)
  const [form, setForm]         = useState({ title: '', content: '', shared: false, important: false })
  const [saving, setSaving]     = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [toggling, setToggling] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  useEffect(() => setNotes(detail.coachNotes), [detail.coachNotes])

  const submit = async () => {
    if (!form.title.trim() || !form.content.trim()) return
    setSaving(true)
    await fetch('/api/coach/notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        memberId:          detail.id,
        title:             form.title,
        content:           form.content,
        isSharedWithMember: form.shared,
        isImportant:       form.important,
        status:            'OPEN',
        priority:          'MEDIUM',
        tags:              [],
        isPinned:          false,
      }),
    })
    setForm({ title: '', content: '', shared: false, important: false })
    setShowForm(false)
    setSaving(false)
    onRefresh()
  }

  const toggleImportant = async (note: Note) => {
    setToggling(note.id)
    await fetch('/api/coach/notes', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ noteId: note.id, isImportant: !note.isImportant }),
    })
    setNotes(prev => prev.map(n => n.id === note.id ? { ...n, isImportant: !n.isImportant } : n))
    setToggling(null)
  }

  const deleteNote = async (noteId: string) => {
    if (!confirm('Supprimer cette note définitivement ?')) return
    setDeleting(noteId)
    await fetch('/api/coach/notes', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ noteId }),
    })
    setNotes(prev => prev.filter(n => n.id !== noteId))
    setDeleting(null)
  }

  const PRIORITY_COLOR: Record<string, string> = { HIGH: 'text-red-400', MEDIUM: 'text-yellow-400', LOW: 'text-zinc-500' }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-zinc-400">{notes.length} note{notes.length !== 1 ? 's' : ''}</p>
        <button
          onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-1.5 text-xs font-medium text-zinc-900 bg-[#C8F135] hover:bg-[#d4f54d] px-3 py-1.5 rounded-lg transition-colors"
        >
          {showForm ? <X className="size-3.5" /> : <Plus className="size-3.5" />}
          {showForm ? 'Annuler' : 'Nouvelle note'}
        </button>
      </div>

      {showForm && (
        <div className="rounded-xl border border-zinc-700 bg-zinc-900 p-4 space-y-3">
          <input
            placeholder="Titre de la note"
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#C8F135]"
          />
          <textarea
            placeholder="Contenu de la note…"
            value={form.content}
            onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
            rows={4}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#C8F135] resize-none"
          />
          <div className="flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-2 text-xs text-zinc-400 cursor-pointer">
              <input type="checkbox" checked={form.shared} onChange={e => setForm(f => ({ ...f, shared: e.target.checked }))} className="accent-[#C8F135]" />
              Partager avec le membre
            </label>
            <label className="flex items-center gap-2 text-xs text-amber-400 cursor-pointer">
              <input type="checkbox" checked={form.important} onChange={e => setForm(f => ({ ...f, important: e.target.checked }))} className="accent-amber-400" />
              Marquer comme importante
            </label>
          </div>
          <div className="flex justify-end">
            <button
              onClick={submit}
              disabled={saving || !form.title.trim() || !form.content.trim()}
              className="flex items-center gap-1.5 text-xs font-medium text-zinc-900 bg-[#C8F135] hover:bg-[#d4f54d] px-3 py-1.5 rounded-lg disabled:opacity-50 transition-colors"
            >
              <Send className="size-3.5" />
              {saving ? 'Enregistrement…' : 'Enregistrer'}
            </button>
          </div>
        </div>
      )}

      {notes.length === 0 && !showForm ? (
        <div className="py-10 text-center">
          <FileText className="size-8 text-zinc-700 mx-auto mb-2" />
          <p className="text-sm text-zinc-500">Aucune note pour ce membre</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notes.map(n => (
            <div key={n.id} className={cn(
              'rounded-xl border p-4',
              n.isImportant ? 'border-amber-500/40 bg-amber-500/5' : n.isPinned ? 'border-[#C8F135]/30 bg-[#C8F135]/5' : 'border-zinc-800 bg-zinc-900',
            )}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    {n.isImportant && (
                      <span className="flex items-center gap-1 text-[10px] font-semibold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full">
                        <Lock className="size-2.5" /> Importante
                      </span>
                    )}
                    {n.isPinned && <Pin className="size-3 text-[#C8F135] shrink-0" />}
                    <p className="text-sm font-medium text-white truncate">{n.title}</p>
                    <span className={cn('text-[10px] font-semibold shrink-0', PRIORITY_COLOR[n.priority])}>{n.priority}</span>
                  </div>
                  <p className="text-xs text-zinc-400 line-clamp-3">{n.content}</p>
                  <div className="flex items-center gap-3 mt-2 flex-wrap">
                    <span className="text-[10px] text-zinc-600">{format(new Date(n.createdAt), 'd MMM yyyy', { locale: fr })}</span>
                    {n.isSharedWithMember && (
                      <span className="flex items-center gap-1 text-[10px] text-[#C8F135]">
                        <Eye className="size-3" /> Partagée
                      </span>
                    )}
                    {n.category && <span className="text-[10px] bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded">{n.category}</span>}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => toggleImportant(n)}
                    disabled={toggling === n.id}
                    title={n.isImportant ? 'Retirer l\'importance' : 'Marquer comme importante'}
                    className={cn(
                      'p-1.5 rounded-lg transition-colors disabled:opacity-50',
                      n.isImportant ? 'text-amber-400 bg-amber-400/10 hover:bg-amber-400/20' : 'text-zinc-500 hover:text-amber-400 hover:bg-zinc-800',
                    )}
                  >
                    {n.isImportant ? <Lock className="size-3.5" /> : <Unlock className="size-3.5" />}
                  </button>
                  <button
                    onClick={() => deleteNote(n.id)}
                    disabled={deleting === n.id}
                    className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-zinc-800 transition-colors disabled:opacity-50"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </div>

              {/* Replies */}
              <NoteRepliesSection noteId={n.id} replies={n.replies ?? []} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// Activity tab: displays and manages body metrics and workout sessions for the member, with add/delete and session status editing.
function ActivityTab({ detail, memberId, onRefresh }: { detail: MemberDetail; memberId: string; onRefresh: () => void }) {
  const [metrics, setMetrics]             = useState<Metric[]>(detail.bodyMetrics)
  const [sessions, setSessions]           = useState<Session[]>(detail.workoutSessions)
  const [showMetricForm, setShowMetricForm] = useState(false)
  const [metricForm, setMetricForm]       = useState({ weightKg: '', bodyFatPct: '', waistCm: '', notes: '' })
  const [savingMetric, setSavingMetric]   = useState(false)
  const [deletingMetric, setDeletingMetric] = useState<string | null>(null)
  const [editingSession, setEditingSession] = useState<string | null>(null)
  const [sessionNotes, setSessionNotes]   = useState<Record<string, string>>({})
  const [savingSession, setSavingSession] = useState<string | null>(null)

  useEffect(() => { setMetrics(detail.bodyMetrics); setSessions(detail.workoutSessions) }, [detail])

  const addMetric = async () => {
    if (!metricForm.weightKg) return
    setSavingMetric(true)
    const res = await fetch(`/api/coach/members/${memberId}/metrics`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        weightKg:   Number(metricForm.weightKg),
        bodyFatPct: metricForm.bodyFatPct ? Number(metricForm.bodyFatPct) : null,
        waistCm:    metricForm.waistCm    ? Number(metricForm.waistCm)    : null,
        notes:      metricForm.notes || null,
      }),
    })
    if (res.ok) {
      const newMetric = await res.json()
      setMetrics(prev => [newMetric, ...prev])
      setMetricForm({ weightKg: '', bodyFatPct: '', waistCm: '', notes: '' })
      setShowMetricForm(false)
      onRefresh()
    }
    setSavingMetric(false)
  }

  const deleteMetric = async (metricId: string) => {
    if (!confirm('Supprimer cette mesure ?')) return
    setDeletingMetric(metricId)
    await fetch(`/api/coach/members/${memberId}/metrics`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ metricId }),
    })
    setMetrics(prev => prev.filter(m => m.id !== metricId))
    setDeletingMetric(null)
  }

  const updateSessionStatus = async (session: Session, newStatus: string) => {
    setSavingSession(session.id)
    const res = await fetch(`/api/coach/members/${memberId}/sessions`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: session.id, status: newStatus }),
    })
    if (res.ok) {
      const updated = await res.json()
      setSessions(prev => prev.map(s => s.id === session.id ? { ...s, ...updated } : s))
    }
    setSavingSession(null)
  }

  const saveSessionNote = async (sessionId: string) => {
    const note = sessionNotes[sessionId]
    if (note === undefined) return
    setSavingSession(sessionId)
    await fetch(`/api/coach/members/${memberId}/sessions`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, notes: note }),
    })
    setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, notes: note } : s))
    setEditingSession(null)
    setSavingSession(null)
  }

  return (
    <div className="space-y-5">
      {/* Body Metrics */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Mensurations</p>
          <button
            onClick={() => setShowMetricForm(v => !v)}
            className="flex items-center gap-1 text-xs text-zinc-400 hover:text-[#C8F135] transition-colors"
          >
            <PlusCircle className="size-3.5" /> Ajouter
          </button>
        </div>

        {showMetricForm && (
          <div className="mb-4 p-3 rounded-lg bg-zinc-800 border border-zinc-700 space-y-2">
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-[10px] text-zinc-500 block mb-1">Poids (kg) *</label>
                <input
                  type="number" step="0.1" placeholder="70.5"
                  value={metricForm.weightKg}
                  onChange={e => setMetricForm(f => ({ ...f, weightKg: e.target.value }))}
                  className="w-full bg-zinc-700 border border-zinc-600 rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:border-[#C8F135]"
                />
              </div>
              <div>
                <label className="text-[10px] text-zinc-500 block mb-1">% Masse grasse</label>
                <input
                  type="number" step="0.1" placeholder="20.0"
                  value={metricForm.bodyFatPct}
                  onChange={e => setMetricForm(f => ({ ...f, bodyFatPct: e.target.value }))}
                  className="w-full bg-zinc-700 border border-zinc-600 rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:border-[#C8F135]"
                />
              </div>
              <div>
                <label className="text-[10px] text-zinc-500 block mb-1">Tour de taille (cm)</label>
                <input
                  type="number" step="0.5" placeholder="80"
                  value={metricForm.waistCm}
                  onChange={e => setMetricForm(f => ({ ...f, waistCm: e.target.value }))}
                  className="w-full bg-zinc-700 border border-zinc-600 rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:border-[#C8F135]"
                />
              </div>
            </div>
            <input
              placeholder="Note optionnelle"
              value={metricForm.notes}
              onChange={e => setMetricForm(f => ({ ...f, notes: e.target.value }))}
              className="w-full bg-zinc-700 border border-zinc-600 rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:border-[#C8F135]"
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowMetricForm(false)} className="text-xs text-zinc-400 hover:text-white px-3 py-1.5">Annuler</button>
              <button
                onClick={addMetric}
                disabled={savingMetric || !metricForm.weightKg}
                className="flex items-center gap-1 text-xs font-medium text-zinc-900 bg-[#C8F135] hover:bg-[#d4f54d] px-3 py-1.5 rounded disabled:opacity-50 transition-colors"
              >
                {savingMetric ? 'Enregistrement…' : 'Ajouter'}
              </button>
            </div>
          </div>
        )}

        {metrics.length === 0 ? (
          <p className="text-xs text-zinc-600 italic">Aucune mensuration enregistrée.</p>
        ) : (
          <div className="space-y-1">
            {metrics.slice(0, 15).map(m => (
              <div key={m.id} className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-2 py-1.5 border-b border-zinc-800/60 last:border-0 text-xs items-center">
                <span className="text-zinc-400">{format(new Date(m.date), 'd MMM yyyy', { locale: fr })}</span>
                <span className="font-mono text-white">{m.weightKg} kg</span>
                <span className="text-zinc-500">{m.bodyFatPct ? `${m.bodyFatPct}% MG` : '—'}</span>
                <span className="text-zinc-500">{m.waistCm ? `${m.waistCm} cm` : '—'}</span>
                <button
                  onClick={() => deleteMetric(m.id)}
                  disabled={deletingMetric === m.id}
                  className="text-zinc-700 hover:text-red-400 transition-colors disabled:opacity-50"
                >
                  <Trash2 className="size-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Workout Sessions */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-3">Séances d'entraînement</p>
        {sessions.length === 0 ? (
          <p className="text-xs text-zinc-600 italic">Aucune séance enregistrée.</p>
        ) : (
          <div className="space-y-3">
            {sessions.slice(0, 15).map(s => {
              const st = SESSION_STYLE[s.status] ?? SESSION_STYLE.PLANNED
              const isEditing = editingSession === s.id
              return (
                <div key={s.id} className="rounded-lg border border-zinc-800 bg-zinc-800/40 p-3">
                  <div className="flex items-center gap-3">
                    <div className={cn('size-2 rounded-full shrink-0', st.dot)} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white font-medium truncate">{s.name}</p>
                      {s.completedAt && (
                        <p className="text-xs text-zinc-500">
                          {format(new Date(s.completedAt), 'd MMM', { locale: fr })}
                          {s.durationMinutes && ` · ${s.durationMinutes} min`}
                          {s.caloriesBurned && ` · ${s.caloriesBurned} kcal`}
                        </p>
                      )}
                    </div>

                    {/* Status selector */}
                    <select
                      value={s.status}
                      onChange={e => updateSessionStatus(s, e.target.value)}
                      disabled={savingSession === s.id}
                      className="text-xs bg-zinc-700 border border-zinc-600 text-zinc-300 rounded px-2 py-1 focus:outline-none focus:border-[#C8F135] disabled:opacity-50"
                    >
                      {Object.entries(SESSION_STYLE).map(([k, v]) => (
                        <option key={k} value={k}>{v.label}</option>
                      ))}
                    </select>

                    <button
                      onClick={() => {
                        setEditingSession(isEditing ? null : s.id)
                        if (!isEditing) setSessionNotes(prev => ({ ...prev, [s.id]: s.notes ?? '' }))
                      }}
                      className="text-zinc-500 hover:text-[#C8F135] transition-colors"
                    >
                      <Pencil className="size-3.5" />
                    </button>
                  </div>

                  {/* Inline note editor */}
                  {isEditing && (
                    <div className="mt-2 space-y-2">
                      <textarea
                        value={sessionNotes[s.id] ?? ''}
                        onChange={e => setSessionNotes(prev => ({ ...prev, [s.id]: e.target.value }))}
                        placeholder="Note sur la séance…"
                        rows={2}
                        className="w-full bg-zinc-700 border border-zinc-600 rounded px-2 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#C8F135] resize-none"
                      />
                      <div className="flex justify-end gap-2">
                        <button onClick={() => setEditingSession(null)} className="text-xs text-zinc-400 hover:text-white">Annuler</button>
                        <button
                          onClick={() => saveSessionNote(s.id)}
                          disabled={savingSession === s.id}
                          className="flex items-center gap-1 text-xs font-medium text-zinc-900 bg-[#C8F135] hover:bg-[#d4f54d] px-2 py-1 rounded disabled:opacity-50 transition-colors"
                        >
                          <Check className="size-3" /> Sauvegarder
                        </button>
                      </div>
                    </div>
                  )}

                  {s.notes && !isEditing && (
                    <p className="mt-1.5 text-xs text-zinc-500 italic ml-5">"{s.notes}"</p>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

// Appointments tab: lists all appointments for this member with status badges, date, and a link to the appointments page.
function AppointmentsTab({ memberId }: { memberId: string }) {
  const [appts, setAppts]     = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [now, setNow]         = useState<Date | null>(null)

  useEffect(() => {
    setNow(new Date())
    fetch(`/api/coach/appointments?memberId=${memberId}`)
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setAppts(d) })
      .finally(() => setLoading(false))
  }, [memberId])

  const upcoming = now ? appts.filter(a => new Date(a.scheduledAt) >= now && a.status !== 'CANCELLED') : []
  const past     = now ? appts.filter(a => new Date(a.scheduledAt) < now || a.status === 'CANCELLED' || a.status === 'COMPLETED') : []

  if (loading) return <div className="py-10 text-center text-sm text-zinc-500">Chargement…</div>

  if (appts.length === 0) return (
    <div className="py-10 text-center">
      <Calendar className="size-8 text-zinc-700 mx-auto mb-2" />
      <p className="text-sm text-zinc-500">Aucun rendez-vous avec ce membre</p>
    </div>
  )

  const ApptCard = ({ a }: { a: Appointment }) => {
    const st = STATUS_STYLE[a.status] ?? STATUS_STYLE.PENDING
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <div className={cn('size-2 rounded-full shrink-0', st.dot)} />
              <p className="text-sm font-medium text-white">{a.title}</p>
              <span className={cn('text-[10px] font-semibold', st.text)}>{st.label}</span>
            </div>
            <p className="text-xs text-zinc-400">
              {format(new Date(a.scheduledAt), "d MMM yyyy 'à' HH:mm", { locale: fr })} · {a.duration} min
            </p>
            {a.coachNote  && <p className="mt-2 text-xs text-zinc-300 italic">"{a.coachNote}"</p>}
            {a.memberNote && <p className="mt-1 text-xs text-zinc-500">Note membre : {a.memberNote}</p>}
          </div>
          {a.meetLink && (
            <a href={a.meetLink} target="_blank" rel="noreferrer"
              className="text-xs text-[#C8F135] hover:underline shrink-0">
              Rejoindre
            </a>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {upcoming.length > 0 && (
        <div className="space-y-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">À venir</p>
          {upcoming.map(a => <ApptCard key={a.id} a={a} />)}
        </div>
      )}
      {past.length > 0 && (
        <div className="space-y-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Historique</p>
          {past.map(a => <ApptCard key={a.id} a={a} />)}
        </div>
      )}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

type Tab = 'overview' | 'notes' | 'activity' | 'appointments'

/** Coach members management page: sidebar member list with search, and a detail panel with Overview/Notes/Activity/Appointments tabs. */
export default function CoachMembers() {
  const [members, setMembers]               = useState<MemberItem[]>([])
  const [search, setSearch]                 = useState('')
  const [selectedId, setSelectedId]         = useState<string | null>(null)
  const [detail, setDetail]                 = useState<MemberDetail | null>(null)
  const [tab, setTab]                       = useState<Tab>('overview')
  const [listLoading, setListLoading]       = useState(true)
  const [detailLoading, setDetailLoading]   = useState(false)
  const [removing, setRemoving]             = useState(false)

  const fetchMembers = useCallback(async () => {
    setListLoading(true)
    const res = await fetch('/api/coach/members').catch(() => null)
    const data = res ? await res.json().catch(() => []) : []
    setMembers(Array.isArray(data) ? data : [])
    setListLoading(false)
  }, [])

  const fetchDetail = useCallback(async (id: string) => {
    setDetailLoading(true)
    const res = await fetch(`/api/coach/members/${id}`).catch(() => null)
    const data = res ? await res.json().catch(() => null) : null
    setDetail(data)
    setDetailLoading(false)
  }, [])

  useEffect(() => { fetchMembers() }, [fetchMembers])

  const selectMember = (id: string) => {
    setSelectedId(id)
    setTab('overview')
    fetchDetail(id)
  }

  const removeMember = async () => {
    if (!selectedId || !confirm('Retirer ce membre de votre liste ?')) return
    setRemoving(true)
    try {
      const res = await fetch(`/api/coach/members/${selectedId}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        alert(data?.error ?? 'Erreur lors de la suppression')
        return
      }
      setSelectedId(null)
      setDetail(null)
      await fetchMembers()
    } finally {
      setRemoving(false)
    }
  }

  const filtered = members.filter(m =>
    (m.member.name ?? m.member.email).toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden">

      {/* ── Left panel ── */}
      <aside className="w-72 shrink-0 flex flex-col border-r border-zinc-800 bg-zinc-950">
        <div className="p-4 border-b border-zinc-800">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-white">Membres</h2>
            <span className="text-xs text-zinc-500">{members.length}</span>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-zinc-500" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher…"
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-8 pr-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#C8F135]"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {listLoading ? (
            <div className="py-8 text-center text-xs text-zinc-500">Chargement…</div>
          ) : filtered.length === 0 ? (
            <div className="py-8 text-center">
              <User className="size-8 text-zinc-700 mx-auto mb-2" />
              <p className="text-xs text-zinc-500">
                {search ? 'Aucun résultat' : 'Aucun membre suivi'}
              </p>
            </div>
          ) : filtered.map(m => {
            const isSelected = m.member.id === selectedId
            return (
              <button
                key={m.member.id}
                onClick={() => selectMember(m.member.id)}
                className={cn(
                  'w-full text-left flex items-center gap-3 p-3 rounded-xl mb-1 transition-colors',
                  isSelected ? 'bg-[#C8F135]/10 border border-[#C8F135]/30' : 'hover:bg-zinc-900 border border-transparent',
                )}
              >
                <div className={cn(
                  'size-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0',
                  isSelected ? 'bg-[#C8F135] text-zinc-900' : 'bg-zinc-800 text-zinc-300',
                )}>
                  {initials(m.member.name, m.member.email)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{m.member.name ?? m.member.email}</p>
                  <p className="text-[10px] text-zinc-500 truncate">
                    {m.member.profile
                      ? `${GOAL_LABELS[m.member.profile.fitnessGoal] ?? m.member.profile.fitnessGoal}`
                      : 'Profil non renseigné'}
                  </p>
                </div>
                {isSelected && <ChevronRight className="size-3.5 text-[#C8F135] shrink-0" />}
              </button>
            )
          })}
        </div>
      </aside>

      {/* ── Right panel ── */}
      <main className="flex-1 overflow-y-auto bg-zinc-950">
        {!selectedId ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <User className="size-12 text-zinc-700 mx-auto mb-3" />
              <p className="text-sm text-zinc-500">Sélectionnez un membre pour voir son espace de coaching</p>
            </div>
          </div>
        ) : detailLoading ? (
          <div className="h-full flex items-center justify-center">
            <div className="size-8 rounded-full border-2 border-zinc-700 border-t-[#C8F135] animate-spin" />
          </div>
        ) : detail ? (
          <div className="p-6 space-y-6">

            {/* ── Member header ── */}
            <div className="flex items-start justify-between gap-4 pb-5 border-b border-zinc-800">
              <div className="flex items-center gap-4">
                <div className="size-14 rounded-full bg-[#C8F135]/10 flex items-center justify-center text-lg font-bold text-[#C8F135]">
                  {initials(detail.name, detail.email)}
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">{detail.name ?? detail.email}</h1>
                  <p className="text-sm text-zinc-400">{detail.email}</p>
                  <p className="text-xs text-zinc-600 mt-0.5">
                    Suivi depuis le {format(new Date(detail.assignedAt), 'd MMMM yyyy', { locale: fr })}
                    {detail.profile && ` · ${detail.profile.weightKg} kg · ${detail.profile.heightCm} cm`}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={`/coach/appointments?memberId=${detail.id}`}
                  className="flex items-center gap-1.5 text-xs font-medium border border-zinc-700 text-zinc-300 hover:border-zinc-600 hover:text-white px-3 py-2 rounded-lg transition-colors"
                >
                  <CalendarPlus className="size-3.5" /> Planifier RDV
                </a>
                <a
                  href={`mailto:${detail.email}`}
                  className="flex items-center gap-1.5 text-xs font-medium bg-[#C8F135] text-zinc-900 hover:bg-[#d4f54d] px-3 py-2 rounded-lg transition-colors"
                >
                  <Mail className="size-3.5" /> Contacter
                </a>
                <button
                  onClick={removeMember}
                  disabled={removing}
                  className="flex items-center gap-1.5 text-xs font-medium border border-red-800 text-red-400 hover:bg-red-500/10 px-3 py-2 rounded-lg transition-colors disabled:opacity-50"
                >
                  <Trash2 className="size-3.5" />
                  {removing ? '…' : 'Retirer'}
                </button>
              </div>
            </div>

            {/* ── Tabs ── */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1">
              <TabBtn active={tab === 'overview'}     onClick={() => setTab('overview')}>Vue d'ensemble</TabBtn>
              <TabBtn active={tab === 'notes'}        onClick={() => setTab('notes')}>Notes</TabBtn>
              <TabBtn active={tab === 'activity'}     onClick={() => setTab('activity')}>Activité</TabBtn>
              <TabBtn active={tab === 'appointments'} onClick={() => setTab('appointments')}>Rendez-vous</TabBtn>
            </div>

            {/* ── Tab content ── */}
            <div>
              {tab === 'overview'     && <OverviewTab detail={detail} />}
              {tab === 'notes'        && <NotesTab detail={detail} onRefresh={() => fetchDetail(detail.id)} />}
              {tab === 'activity'     && <ActivityTab detail={detail} memberId={detail.id} onRefresh={() => fetchDetail(detail.id)} />}
              {tab === 'appointments' && <AppointmentsTab memberId={detail.id} />}
            </div>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center">
            <p className="text-sm text-zinc-500">Membre introuvable</p>
          </div>
        )}
      </main>
    </div>
  )
}
