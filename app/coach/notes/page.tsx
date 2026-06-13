'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { AlertCircle, CalendarClock, CheckCircle2, ChevronDown, Clock3, Filter, Lock, MessageSquareText, Pencil, Pin, Plus, Search, Send, Share2, Trash2, X } from 'lucide-react'
import { format, isBefore, isToday } from 'date-fns'
import { fr } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { CoachPageHeader } from '@/components/coach/CoachPageHeader'

type NoteStatus = 'OPEN' | 'IN_PROGRESS' | 'DONE'
type NotePriority = 'LOW' | 'MEDIUM' | 'HIGH'

interface CoachNote {
  id: string
  title: string
  content: string
  category: string | null
  status: NoteStatus
  priority: NotePriority
  tags: string[]
  followUpAt: string | null
  isPinned: boolean
  isSharedWithMember: boolean
  createdAt: string
  updatedAt: string
}

interface NoteReply {
  id: string
  content: string
  memberId: string | null
  authorRole: 'MEMBER' | 'COACH' | string
  member?: { name: string | null } | null
  createdAt: string
}

interface CoachMember {
  id: string
  member: {
    id: string
    name: string | null
    email: string
    profile?: { firstName?: string | null } | null
  }
}

const CATEGORIES = [
  { value: 'FEEDBACK', label: 'Retours' },
  { value: 'WORKOUT', label: 'Entraînement' },
  { value: 'NUTRITION', label: 'Nutrition' },
  { value: 'PROGRESS', label: 'Progression' },
  { value: 'OTHER', label: 'Autre' },
]

const STATUS_META: Record<NoteStatus, { label: string; className: string }> = {
  OPEN: { label: 'À traiter', className: 'border-sky-500/30 bg-sky-500/10 text-sky-200' },
  IN_PROGRESS: { label: 'En cours', className: 'border-amber-500/30 bg-amber-500/10 text-amber-200' },
  DONE: { label: 'Terminé', className: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200' },
}

const PRIORITY_META: Record<NotePriority, { label: string; className: string }> = {
  LOW: { label: 'Basse', className: 'text-zinc-400' },
  MEDIUM: { label: 'Normale', className: 'text-[#C8F135]' },
  HIGH: { label: 'Haute', className: 'text-red-300' },
}

const EMPTY_FORM = {
  title: '',
  content: '',
  category: 'FEEDBACK',
  status: 'OPEN' as NoteStatus,
  priority: 'MEDIUM' as NotePriority,
  tags: '',
  followUpAt: '',
  isPinned: false,
  isSharedWithMember: false,
}

type CoachNoteFormState = typeof EMPTY_FORM

// Returns a 2-letter uppercase initials string from a display name or email.
function initials(name?: string | null, email?: string) {
  const source = name?.trim() || email || '?'
  return source.split(/\s|@/).filter(Boolean).map((part) => part[0]).join('').slice(0, 2).toUpperCase()
}

// Formats a followUpAt date string as "Aujourd'hui" or a French short date.
function formatFollowUp(value: string | null) {
  if (!value) return null
  const date = new Date(value)
  if (isToday(date)) return "Aujourd'hui"
  return format(date, 'd MMM yyyy', { locale: fr })
}

function targetNoteIdFromUrl() {
  if (typeof window === 'undefined') return null
  return new URLSearchParams(window.location.search).get('noteId')
}

// Returns true if the followUpAt date is in the past (not today).
function isLate(value: string | null) {
  return Boolean(value && isBefore(new Date(value), new Date()) && !isToday(new Date(value)))
}

/** Coach notes management page: select a member, create/edit/delete notes with status, priority, tags, and optional member sharing. */
export default function NotesPage() {
  const [members, setMembers] = useState<CoachMember[]>([])
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null)
  const [notes, setNotes] = useState<CoachNote[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [notesLoading, setNotesLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'ALL' | NoteStatus>('ALL')
  const [formData, setFormData] = useState(EMPTY_FORM)
  const [targetNoteId] = useState(() => targetNoteIdFromUrl())

  const fetchMembers = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/coach/members')
      const data = await res.json()
      setMembers(Array.isArray(data) ? data : [])
      if (Array.isArray(data)) {
        if (targetNoteId) {
          for (const item of data) {
            const memberId = item?.member?.id
            if (!memberId) continue
            const notesRes = await fetch(`/api/coach/notes?memberId=${memberId}`)
            const memberNotes = await notesRes.json().catch(() => [])
            if (Array.isArray(memberNotes) && memberNotes.some((note) => note.id === targetNoteId)) {
              setSelectedMemberId(memberId)
              return
            }
          }
        }
        if (data[0]?.member?.id) setSelectedMemberId((current) => current ?? data[0].member.id)
      }
    } finally {
      setIsLoading(false)
    }
  }, [targetNoteId])

  useEffect(() => {
    fetchMembers()
  }, [fetchMembers])

  useEffect(() => {
    if (selectedMemberId) fetchNotes(selectedMemberId)
  }, [selectedMemberId])

  const fetchNotes = async (memberId: string) => {
    setNotesLoading(true)
    try {
      const res = await fetch(`/api/coach/notes?memberId=${memberId}`)
      const data = await res.json()
      setNotes(Array.isArray(data) ? data : [])
    } finally {
      setNotesLoading(false)
    }
  }

  const selectedMember = members.find((m) => m.member.id === selectedMemberId)
  const visibleNotes = useMemo(() => {
    const term = search.trim().toLowerCase()
    return notes.filter((note) => {
      const matchesStatus = statusFilter === 'ALL' || note.status === statusFilter
      const matchesSearch = !term
        || note.title.toLowerCase().includes(term)
        || note.content.toLowerCase().includes(term)
        || note.tags.some((tag) => tag.toLowerCase().includes(term))
      return matchesStatus && matchesSearch
    })
  }, [notes, search, statusFilter])

  const stats = useMemo(() => ({
    total: notes.length,
    open: notes.filter((note) => note.status !== 'DONE').length,
    due: notes.filter((note) => note.followUpAt && note.status !== 'DONE').length,
    shared: notes.filter((note) => note.isSharedWithMember).length,
  }), [notes])

  const saveNote = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedMemberId) return
    setIsSaving(true)
    try {
      const res = await fetch('/api/coach/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberId: selectedMemberId,
          ...formData,
          tags: formData.tags.split(',').map((tag) => tag.trim()).filter(Boolean),
          followUpAt: formData.followUpAt ? new Date(formData.followUpAt).toISOString() : null,
        }),
      })
      if (!res.ok) throw new Error('save')
      setFormData(EMPTY_FORM)
      setShowForm(false)
      await fetchNotes(selectedMemberId)
    } finally {
      setIsSaving(false)
    }
  }

  const updateNote = async (noteId: string, patch: Partial<CoachNote>): Promise<{ ok: boolean; error?: string }> => {
    if (!selectedMemberId) return { ok: false }
    const res = await fetch('/api/coach/notes', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ noteId, ...patch }),
    })
    if (res.ok) {
      await fetchNotes(selectedMemberId)
      return { ok: true }
    }
    const body = await res.json().catch(() => ({}))
    return { ok: false, error: body.error }
  }

  const deleteNote = async (noteId: string) => {
    if (!selectedMemberId) return
    const res = await fetch('/api/coach/notes', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ noteId }),
    })
    if (res.ok) await fetchNotes(selectedMemberId)
  }

  return (
    <div className="space-y-8">
      <CoachPageHeader
        title="Journal coach"
        description="Centralisez les observations, actions à faire et points sensibles pour chaque membre suivi."
        actions={
        <button
          type="button"
          onClick={() => setShowForm(true)}
          disabled={!selectedMemberId}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#C8F135] px-4 py-3 text-sm font-bold text-zinc-900 transition-colors hover:bg-[#d4f54d] disabled:opacity-50"
        >
          <Plus className="size-4" />
          Nouvelle note
        </button>
        }
      />

      <div className="grid gap-5 xl:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="self-start rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">Membres suivis</h2>
            <span className="rounded-full bg-zinc-800 px-2 py-1 text-xs text-zinc-400">{members.length}</span>
          </div>
          {isLoading ? (
            <div className="space-y-2">
              {[0, 1, 2].map((item) => <div key={item} className="h-16 animate-pulse rounded-xl bg-zinc-800" />)}
            </div>
          ) : members.length === 0 ? (
            <div className="rounded-xl border border-dashed border-zinc-700 p-5 text-center text-sm text-zinc-500">
              Aucun membre suivi
            </div>
          ) : (
            <div className="space-y-2">
              {members.map((item) => {
                const active = selectedMemberId === item.member.id
                return (
                  <button
                    key={item.member.id}
                    type="button"
                    onClick={() => setSelectedMemberId(item.member.id)}
                    className={`flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-left transition-colors ${
                      active ? 'border-[#C8F135]/60 bg-[#C8F135]/10' : 'border-zinc-800 bg-zinc-950/40 hover:border-zinc-700'
                    }`}
                  >
                    <span className={`flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                      active ? 'bg-[#C8F135] text-zinc-950' : 'bg-zinc-800 text-zinc-300'
                    }`}>
                      {initials(item.member.name, item.member.email)}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-white">{item.member.name ?? item.member.email}</span>
                      <span className="block truncate text-xs text-zinc-500">{item.member.email}</span>
                    </span>
                  </button>
                )
              })}
            </div>
          )}
        </aside>

        <main className="space-y-5">
          <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.5px] text-zinc-500">Dossier membre</p>
                <h2 className="mt-1 text-xl font-semibold text-white">
                  {selectedMember ? selectedMember.member.name ?? selectedMember.member.email : 'Sélectionnez un membre'}
                </h2>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <Stat label="Notes" value={stats.total} />
                <Stat label="Ouvertes" value={stats.open} />
                <Stat label="Suivis" value={stats.due} />
                <Stat label="Partagées" value={stats.shared} />
              </div>
            </div>
          </section>

          {selectedMemberId && (
            <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
              <div className="grid gap-3 md:grid-cols-[1fr_auto]">
                <label className="relative block">
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-500" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Rechercher une note, un tag, une observation..."
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-950 py-3 pl-10 pr-4 text-sm text-white outline-none transition-colors placeholder:text-zinc-600 focus:border-[#C8F135]"
                  />
                </label>
                <div className="flex items-center gap-2">
                  <Filter className="size-4 text-zinc-500" />
                  {(['ALL', 'OPEN', 'IN_PROGRESS', 'DONE'] as const).map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => setStatusFilter(status)}
                      className={`rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
                        statusFilter === status ? 'bg-[#C8F135] text-zinc-950' : 'bg-zinc-800 text-zinc-400 hover:text-white'
                      }`}
                    >
                      {status === 'ALL' ? 'Tout' : STATUS_META[status].label}
                    </button>
                  ))}
                </div>
              </div>
            </section>
          )}

          {showForm && selectedMemberId && (
            <section className="rounded-2xl border border-[#C8F135]/30 bg-zinc-900 p-5">
              <div className="mb-5 flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-white">Nouvelle note de suivi</h3>
                  <p className="mt-1 text-sm text-zinc-500">Ajoutez une observation actionnable pour ce membre.</p>
                </div>
                <button type="button" onClick={() => setShowForm(false)} className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-800 hover:text-white">
                  <X className="size-5" />
                </button>
              </div>

              <CoachNoteForm
                form={formData}
                onChange={setFormData}
                onSubmit={saveNote}
                isSaving={isSaving}
                submitLabel="Ajouter la note"
                savingLabel="Enregistrement..."
              />
            </section>
          )}

          <section className="space-y-3">
            {!selectedMemberId ? (
              <EmptyState title="Aucun membre sélectionné" description="Choisissez un membre à gauche pour ouvrir son journal de suivi." />
            ) : notesLoading ? (
              [0, 1, 2].map((item) => <div key={item} className="h-36 animate-pulse rounded-2xl bg-zinc-900" />)
            ) : visibleNotes.length === 0 ? (
              <EmptyState title="Aucune note trouvée" description="Ajoutez une note ou changez vos filtres de recherche." />
            ) : (
              visibleNotes.map((note) => (
                <NoteCard
                  key={note.id}
                  note={note}
                  highlighted={note.id === targetNoteId}
                  onPatch={(patch) => updateNote(note.id, patch)}
                  onDelete={() => deleteNote(note.id)}
                />
              ))
            )}
          </section>
        </main>
      </div>

      <style jsx>{`
        /* Style for date picker */
        input[type="date"] {
          color-scheme: dark;
        }

        input[type="date"]::-webkit-calendar-picker-indicator {
          filter: invert(0.8);
          cursor: pointer;
        }

        input[type="date"]::-webkit-calendar-picker-indicator:hover {
          filter: invert(1);
        }
      `}</style>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="min-w-24 rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2">
      <p className="text-[11px] uppercase tracking-[0.5px] text-zinc-500">{label}</p>
      <p className="mt-1 text-lg font-semibold text-white">{value}</p>
    </div>
  )
}

function Field({ label, className, children }: { label: string; className?: string; children: React.ReactNode }) {
  return (
    <label className={`grid gap-1.5 ${className ?? ''}`}>
      <span className="text-xs uppercase tracking-[0.5px] text-zinc-500">{label}</span>
      {children}
    </label>
  )
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-900 p-10 text-center">
      <MessageSquareText className="mx-auto mb-3 size-9 text-zinc-600" />
      <p className="font-semibold text-white">{title}</p>
      <p className="mt-1 text-sm text-zinc-500">{description}</p>
    </div>
  )
}

function CoachNoteForm({
  form, onChange, onSubmit, isSaving, submitLabel, savingLabel, error, onCancel,
}: {
  form: CoachNoteFormState
  onChange: (form: CoachNoteFormState) => void
  onSubmit: (e: React.FormEvent) => void
  isSaving: boolean
  submitLabel: string
  savingLabel: string
  error?: string | null
  onCancel?: () => void
}) {
  return (
    <form onSubmit={onSubmit} className="grid gap-4 lg:grid-cols-2">
      <Field label="Titre" className="lg:col-span-2">
        <input
          required
          value={form.title}
          onChange={(e) => onChange({ ...form, title: e.target.value })}
          placeholder="Ex: Charge deadlift à surveiller"
          className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-3 text-sm text-white placeholder-zinc-500 outline-none focus:border-[#C8F135]"
        />
      </Field>
      <Field label="Catégorie">
        <select
          value={form.category}
          onChange={(e) => onChange({ ...form, category: e.target.value })}
          className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-3 text-sm text-white outline-none focus:border-[#C8F135]"
        >
          {CATEGORIES.map((category) => <option key={category.value} value={category.value}>{category.label}</option>)}
        </select>
      </Field>
      <Field label="Priorité">
        <select
          value={form.priority}
          onChange={(e) => onChange({ ...form, priority: e.target.value as NotePriority })}
          className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-3 text-sm text-white outline-none focus:border-[#C8F135]"
        >
          <option value="LOW">Basse</option>
          <option value="MEDIUM">Normale</option>
          <option value="HIGH">Haute</option>
        </select>
      </Field>
      <Field label="Date de suivi">
        <input
          type="date"
          value={form.followUpAt}
          onChange={(e) => onChange({ ...form, followUpAt: e.target.value })}
          className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-3 text-sm text-white outline-none focus:border-[#C8F135]"
        />
      </Field>
      <Field label="Tags (séparés par des virgules)" className="lg:col-span-2">
        <input
          value={form.tags}
          onChange={(e) => onChange({ ...form, tags: e.target.value })}
          placeholder="mobilité, squat, sommeil"
          className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-3 text-sm text-white placeholder-zinc-500 outline-none focus:border-[#C8F135]"
        />
      </Field>
      <Field label="Contenu" className="lg:col-span-2">
        <textarea
          required
          value={form.content}
          onChange={(e) => onChange({ ...form, content: e.target.value })}
          placeholder="Observation, décision, prochaine action..."
          rows={5}
          className="w-full resize-none rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-3 text-sm text-white placeholder-zinc-500 outline-none focus:border-[#C8F135]"
        />
      </Field>
      <div className="flex flex-wrap items-center gap-3 lg:col-span-2">
        <button
          type="button"
          onClick={() => onChange({ ...form, isPinned: !form.isPinned })}
          className={cn(
            'inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold transition-colors',
            form.isPinned ? 'border-[#C8F135]/50 bg-[#C8F135]/10 text-[#C8F135]' : 'border-zinc-800 text-zinc-400 hover:text-white',
          )}
        >
          <Pin className="size-4" /> Épingler
        </button>
        <button
          type="button"
          onClick={() => onChange({ ...form, isSharedWithMember: !form.isSharedWithMember })}
          className={cn(
            'inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold transition-colors',
            form.isSharedWithMember ? 'border-[#C8F135]/50 bg-[#C8F135]/10 text-[#C8F135]' : 'border-zinc-800 text-zinc-400 hover:text-white',
          )}
        >
          <Share2 className="size-4" /> Partager
        </button>
        {error && <p className="text-xs text-red-400">{error}</p>}
        <div className="flex gap-3 lg:ml-auto">
          {onCancel && (
            <button type="button" onClick={onCancel} className="rounded-xl border border-zinc-700 px-4 py-2 text-sm text-zinc-400 transition-colors hover:text-white">
              Annuler
            </button>
          )}
          <button
            type="submit"
            disabled={isSaving}
            className="rounded-xl bg-[#C8F135] px-5 py-2 text-sm font-bold text-zinc-900 transition-colors hover:bg-[#d4f54d] disabled:opacity-50"
          >
            {isSaving ? savingLabel : submitLabel}
          </button>
        </div>
      </div>
    </form>
  )
}

function NoteCard({
  note, highlighted = false, onPatch, onDelete,
}: {
  note: CoachNote
  highlighted?: boolean
  onPatch: (patch: Partial<CoachNote>) => Promise<{ ok: boolean; error?: string }>
  onDelete: () => void
}) {
  const followUp = formatFollowUp(note.followUpAt)
  const late = isLate(note.followUpAt)
  const canEdit = note.status !== 'DONE'

  const [editing, setEditing] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [replies, setReplies] = useState<NoteReply[]>([])
  const [showReplies, setShowReplies] = useState(false)
  const [loadingReplies, setLoadingReplies] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [sendingReply, setSendingReply] = useState(false)
  const [editForm, setEditForm] = useState({
    title: note.title,
    content: note.content,
    category: note.category ?? 'FEEDBACK',
    status: note.status,
    priority: note.priority,
    tags: note.tags.join(', '),
    followUpAt: note.followUpAt ? note.followUpAt.slice(0, 10) : '',
    isPinned: note.isPinned,
    isSharedWithMember: note.isSharedWithMember,
  })

  useEffect(() => {
    if (!highlighted) return
    document.getElementById(`coach-note-${note.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [highlighted, note.id])

  const openEdit = () => {
    setEditForm({
      title: note.title,
      content: note.content,
      category: note.category ?? 'FEEDBACK',
      status: note.status,
      priority: note.priority,
      tags: note.tags.join(', '),
      followUpAt: note.followUpAt ? note.followUpAt.slice(0, 10) : '',
      isPinned: note.isPinned,
      isSharedWithMember: note.isSharedWithMember,
    })
    setEditError(null)
    setEditing(true)
  }

  const cancelEdit = () => { setEditing(false); setEditError(null) }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setEditError(null)
    const result = await onPatch({
      title: editForm.title,
      content: editForm.content,
      category: editForm.category,
      status: editForm.status,
      priority: editForm.priority as NotePriority,
      tags: editForm.tags.split(',').map((t) => t.trim()).filter(Boolean),
      followUpAt: editForm.followUpAt ? new Date(editForm.followUpAt).toISOString() : null,
      isPinned: editForm.isPinned,
      isSharedWithMember: editForm.isSharedWithMember,
    })
    setIsSaving(false)
    if (result.ok) {
      setEditing(false)
    } else {
      setEditError(result.error ?? 'Erreur lors de la sauvegarde.')
    }
  }

  const fetchReplies = useCallback(async () => {
    if (!note.isSharedWithMember) return
    setLoadingReplies(true)
    try {
      const res = await fetch(`/api/coach/notes/${note.id}/replies`)
      if (res.ok) {
        const data = await res.json()
        setReplies(Array.isArray(data) ? data : [])
      }
    } catch {
      // silent
    } finally {
      setLoadingReplies(false)
    }
  }, [note.id, note.isSharedWithMember])

  useEffect(() => {
    if (!showReplies) return
    fetchReplies()
  }, [fetchReplies, showReplies])

  const submitReply = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!replyText.trim()) return
    setSendingReply(true)
    const res = await fetch(`/api/coach/notes/${note.id}/replies`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: replyText }),
    })
    if (res.ok) {
      const newReply = await res.json()
      setReplies(prev => [...prev, newReply])
      setReplyText('')
      setShowReplies(true)
    }
    setSendingReply(false)
  }

  if (editing) {
    return (
      <article className="rounded-2xl border border-[#C8F135]/30 bg-zinc-900 p-5">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-white">Modifier la note de suivi</h3>
            <p className="mt-1 text-sm text-zinc-500">Gardez le même format que la création pour modifier rapidement cette note.</p>
          </div>
          <button type="button" onClick={cancelEdit} className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-800 hover:text-white">
            <X className="size-5" />
          </button>
        </div>
        <CoachNoteForm
          form={editForm}
          onChange={setEditForm}
          onSubmit={handleSave}
          isSaving={isSaving}
          submitLabel="Sauvegarder"
          savingLabel="Sauvegarde..."
          error={editError}
          onCancel={cancelEdit}
        />
      </article>
    )
  }

  return (
    <article id={`coach-note-${note.id}`} className={`rounded-2xl border bg-zinc-900 p-5 transition-colors hover:border-zinc-700 ${
      highlighted ? 'border-[#C8F135] shadow-[0_0_0_1px_rgba(200,241,53,0.35),0_0_28px_rgba(200,241,53,0.12)]' : note.isPinned ? 'border-[#C8F135]/50' : 'border-zinc-800'
    }`}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            {note.isPinned && <Pin className="size-4 fill-[#C8F135] text-[#C8F135]" />}
            <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${STATUS_META[note.status].className}`}>{STATUS_META[note.status].label}</span>
            <span className={`text-xs font-semibold ${PRIORITY_META[note.priority].className}`}>Priorité {PRIORITY_META[note.priority].label.toLowerCase()}</span>
            {note.isSharedWithMember ? <Share2 className="size-4 text-zinc-400" /> : <Lock className="size-4 text-zinc-600" />}
          </div>
          <h3 className="text-lg font-semibold text-white">{note.title}</h3>
          <p className="mt-1 text-xs text-zinc-500">
            {format(new Date(note.createdAt), 'd MMM yyyy à HH:mm', { locale: fr })}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {canEdit && (
            <button type="button" onClick={openEdit} className="rounded-lg bg-zinc-800 p-2 text-zinc-400 hover:text-[#C8F135]" aria-label="Modifier la note">
              <Pencil className="size-4" />
            </button>
          )}
          <button type="button" onClick={() => onPatch({ isPinned: !note.isPinned })} className="rounded-lg bg-zinc-800 p-2 text-zinc-400 hover:text-[#C8F135]" aria-label="Épingler la note">
            <Pin className="size-4" />
          </button>
          <button type="button" onClick={() => onPatch({ status: note.status === 'DONE' ? 'OPEN' : 'DONE' })} className="rounded-lg bg-zinc-800 p-2 text-zinc-400 hover:text-emerald-300" aria-label="Changer le statut">
            {note.status === 'DONE' ? <Clock3 className="size-4" /> : <CheckCircle2 className="size-4" />}
          </button>
          <button type="button" onClick={onDelete} className="rounded-lg bg-zinc-800 p-2 text-zinc-400 hover:text-red-300" aria-label="Supprimer la note">
            <Trash2 className="size-4" />
          </button>
        </div>
      </div>

      <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-zinc-300">{note.content}</p>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {note.category && <span className="rounded-lg bg-zinc-800 px-2.5 py-1 text-xs text-zinc-300">{CATEGORIES.find((item) => item.value === note.category)?.label ?? note.category}</span>}
        {note.tags.map((tag) => <span key={tag} className="rounded-lg bg-zinc-950 px-2.5 py-1 text-xs text-zinc-500">#{tag}</span>)}
        {followUp && (
          <span className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs ${late ? 'bg-red-500/10 text-red-200' : 'bg-zinc-800 text-zinc-300'}`}>
            {late ? <AlertCircle className="size-3.5" /> : <CalendarClock className="size-3.5" />}
            Suivi: {followUp}
          </span>
        )}
      </div>

      {note.isSharedWithMember && (
        <div className="mt-4 border-t border-zinc-800 pt-4">
          <button
            type="button"
            onClick={() => setShowReplies(!showReplies)}
            className="flex items-center gap-2 text-sm font-semibold text-zinc-400 hover:text-white transition-colors"
          >
            <ChevronDown className={`size-4 transition-transform ${showReplies ? 'rotate-180' : ''}`} />
            {replies.length > 0 ? `${replies.length} réponse${replies.length !== 1 ? 's' : ''}` : 'Aucune réponse'}
          </button>

          {showReplies && (
            <div className="mt-3 space-y-2">
              {loadingReplies ? (
                <div className="px-3 py-2 text-xs text-zinc-500">Chargement…</div>
              ) : replies.length === 0 ? (
                <div className="px-3 py-2 text-xs text-zinc-500">Aucune réponse pour le moment</div>
              ) : (
                replies.map((reply) => (
                  <div key={reply.id} className="rounded-lg bg-zinc-800/50 p-3 text-sm">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <p className="font-semibold text-zinc-200">
                        {reply.authorRole === 'COACH' ? 'Coach' : reply.member?.name ?? 'Membre'}
                      </p>
                      <p className="text-xs text-zinc-500">
                        {format(new Date(reply.createdAt), "d MMM 'à' HH:mm", { locale: fr })}
                      </p>
                    </div>
                    <p className="text-zinc-300 whitespace-pre-wrap">{reply.content}</p>
                  </div>
                ))
              )}
              <form onSubmit={submitReply} className="flex items-end gap-2 pt-2">
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Répondre au membre..."
                  rows={2}
                  className="min-h-11 flex-1 resize-none rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-[#C8F135]"
                />
                <button
                  type="submit"
                  disabled={sendingReply || !replyText.trim()}
                  className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#C8F135] text-zinc-950 transition-colors hover:bg-[#d4f54d] disabled:opacity-50"
                  aria-label="Répondre"
                >
                  <Send className="size-4" />
                </button>
              </form>
            </div>
          )}
        </div>
      )}
    </article>
  )
}
