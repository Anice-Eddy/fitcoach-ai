'use client'

import { useEffect, useMemo, useState } from 'react'
import { AlertCircle, CalendarClock, CheckCircle2, Clock3, Filter, Lock, MessageSquareText, Pencil, Pin, Plus, Search, Share2, Trash2, X } from 'lucide-react'
import { format, isBefore, isToday } from 'date-fns'
import { fr } from 'date-fns/locale'

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

  useEffect(() => {
    fetchMembers()
  }, [])

  useEffect(() => {
    if (selectedMemberId) fetchNotes(selectedMemberId)
  }, [selectedMemberId])

  const fetchMembers = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/coach/members')
      const data = await res.json()
      setMembers(Array.isArray(data) ? data : [])
      if (Array.isArray(data) && data[0]?.member?.id) setSelectedMemberId((current) => current ?? data[0].member.id)
    } finally {
      setIsLoading(false)
    }
  }

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
    <div className="space-y-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-[#C8F135]/30 bg-[#C8F135]/10 px-3 py-1 text-xs font-semibold text-[#C8F135]">
            <MessageSquareText className="size-3.5" />
            Notes de suivi
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-white">Journal coach</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
            Centralisez les observations, actions à faire et points sensibles pour chaque membre suivi.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm(true)}
          disabled={!selectedMemberId}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#C8F135] px-4 py-3 text-sm font-bold text-zinc-900 transition-colors hover:bg-[#d4f54d] disabled:opacity-50"
        >
          <Plus className="size-4" />
          Nouvelle note
        </button>
      </header>

      <div className="grid gap-5 lg:grid-cols-[300px_1fr]">
        <aside className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
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

              <form onSubmit={saveNote} className="grid gap-4 lg:grid-cols-2">
                <Field label="Titre">
                  <input required value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="Ex: Charge deadlift à surveiller" className="input" />
                </Field>
                <Field label="Catégorie">
                  <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="input">
                    {CATEGORIES.map((category) => <option key={category.value} value={category.value}>{category.label}</option>)}
                  </select>
                </Field>
                <Field label="Priorité">
                  <select value={formData.priority} onChange={(e) => setFormData({ ...formData, priority: e.target.value as NotePriority })} className="input">
                    <option value="LOW">Basse</option>
                    <option value="MEDIUM">Normale</option>
                    <option value="HIGH">Haute</option>
                  </select>
                </Field>
                <Field label="Date de suivi">
                  <input type="date" value={formData.followUpAt} onChange={(e) => setFormData({ ...formData, followUpAt: e.target.value })} className="input" />
                </Field>
                <Field label="Tags" className="lg:col-span-2">
                  <input value={formData.tags} onChange={(e) => setFormData({ ...formData, tags: e.target.value })} placeholder="mobilité, squat, sommeil" className="input" />
                </Field>
                <Field label="Contenu" className="lg:col-span-2">
                  <textarea required value={formData.content} onChange={(e) => setFormData({ ...formData, content: e.target.value })} placeholder="Observation, décision, prochaine action..." className="input min-h-36 resize-none" />
                </Field>
                <div className="flex flex-wrap items-center gap-3 lg:col-span-2">
                  <Toggle active={formData.isPinned} label="Épingler" icon={<Pin className="size-4" />} onClick={() => setFormData({ ...formData, isPinned: !formData.isPinned })} />
                  <Toggle active={formData.isSharedWithMember} label="Partager au membre" icon={<Share2 className="size-4" />} onClick={() => setFormData({ ...formData, isSharedWithMember: !formData.isSharedWithMember })} />
                  <button disabled={isSaving} className="ml-auto rounded-xl bg-[#C8F135] px-5 py-3 text-sm font-bold text-zinc-950 transition-colors hover:bg-[#d4f54d] disabled:opacity-50">
                    {isSaving ? 'Enregistrement...' : 'Ajouter la note'}
                  </button>
                </div>
              </form>
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
                  onPatch={(patch) => updateNote(note.id, patch)}
                  onDelete={() => deleteNote(note.id)}
                />
              ))
            )}
          </section>
        </main>
      </div>

      <style jsx>{`
        .input {
          width: 100%;
          border-radius: 0.75rem;
          border: 1px solid rgb(63 63 70);
          background: rgb(24 24 27);
          padding: 0.75rem 1rem;
          color: white;
          font-size: 0.875rem;
          outline: none;
        }
        .input:focus {
          border-color: #C8F135;
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

function Toggle({ active, label, icon, onClick }: { active: boolean; label: string; icon: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold transition-colors ${
        active ? 'border-[#C8F135]/50 bg-[#C8F135]/10 text-[#C8F135]' : 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-white'
      }`}
    >
      {icon}
      {label}
    </button>
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

function NoteCard({
  note, onPatch, onDelete,
}: {
  note: CoachNote
  onPatch: (patch: Partial<CoachNote>) => Promise<{ ok: boolean; error?: string }>
  onDelete: () => void
}) {
  const followUp = formatFollowUp(note.followUpAt)
  const late = isLate(note.followUpAt)
  const canEdit = note.status !== 'DONE'

  const [editing, setEditing] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [editForm, setEditForm] = useState({
    title: note.title,
    content: note.content,
    category: note.category ?? 'FEEDBACK',
    priority: note.priority,
    tags: note.tags.join(', '),
    followUpAt: note.followUpAt ? note.followUpAt.slice(0, 10) : '',
    isSharedWithMember: note.isSharedWithMember,
  })

  const openEdit = () => {
    setEditForm({
      title: note.title,
      content: note.content,
      category: note.category ?? 'FEEDBACK',
      priority: note.priority,
      tags: note.tags.join(', '),
      followUpAt: note.followUpAt ? note.followUpAt.slice(0, 10) : '',
      isSharedWithMember: note.isSharedWithMember,
    })
    setEditError(null)
    setEditing(true)
  }

  const cancelEdit = () => { setEditing(false); setEditError(null) }

  const handleSave = async () => {
    setIsSaving(true)
    setEditError(null)
    const result = await onPatch({
      title: editForm.title,
      content: editForm.content,
      category: editForm.category,
      priority: editForm.priority as NotePriority,
      tags: editForm.tags.split(',').map((t) => t.trim()).filter(Boolean),
      followUpAt: editForm.followUpAt ? new Date(editForm.followUpAt).toISOString() : null,
      isSharedWithMember: editForm.isSharedWithMember,
    })
    setIsSaving(false)
    if (result.ok) {
      setEditing(false)
    } else {
      setEditError(result.error ?? 'Erreur lors de la sauvegarde.')
    }
  }

  if (editing) {
    return (
      <article className="rounded-2xl border border-[#C8F135]/30 bg-zinc-900 p-5">
        <div className="mb-4 flex items-center justify-between gap-4">
          <h3 className="text-sm font-semibold text-white">Modifier la note</h3>
          <button type="button" onClick={cancelEdit} className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-800 hover:text-white">
            <X className="size-4" />
          </button>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <Field label="Titre">
            <input value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} className="input" />
          </Field>
          <Field label="Catégorie">
            <select value={editForm.category} onChange={(e) => setEditForm({ ...editForm, category: e.target.value })} className="input">
              {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </Field>
          <Field label="Priorité">
            <select value={editForm.priority} onChange={(e) => setEditForm({ ...editForm, priority: e.target.value as NotePriority })} className="input">
              <option value="LOW">Basse</option>
              <option value="MEDIUM">Normale</option>
              <option value="HIGH">Haute</option>
            </select>
          </Field>
          <Field label="Date de suivi">
            <input type="date" value={editForm.followUpAt} onChange={(e) => setEditForm({ ...editForm, followUpAt: e.target.value })} className="input" />
          </Field>
          <Field label="Tags" className="lg:col-span-2">
            <input value={editForm.tags} onChange={(e) => setEditForm({ ...editForm, tags: e.target.value })} placeholder="mobilité, squat, sommeil" className="input" />
          </Field>
          <Field label="Contenu" className="lg:col-span-2">
            <textarea value={editForm.content} onChange={(e) => setEditForm({ ...editForm, content: e.target.value })} className="input min-h-36 resize-none" />
          </Field>
          <div className="flex flex-wrap items-center gap-3 lg:col-span-2">
            <Toggle active={editForm.isSharedWithMember} label="Partager au membre" icon={<Share2 className="size-4" />} onClick={() => setEditForm({ ...editForm, isSharedWithMember: !editForm.isSharedWithMember })} />
            {editError && <p className="text-xs text-red-400">{editError}</p>}
            <button type="button" onClick={cancelEdit} className="ml-auto rounded-xl border border-zinc-700 px-4 py-2.5 text-sm text-zinc-400 hover:text-white transition-colors">
              Annuler
            </button>
            <button type="button" onClick={handleSave} disabled={isSaving} className="rounded-xl bg-[#C8F135] px-5 py-2.5 text-sm font-bold text-zinc-950 hover:bg-[#d4f54d] disabled:opacity-50 transition-colors">
              {isSaving ? 'Sauvegarde...' : 'Sauvegarder'}
            </button>
          </div>
        </div>
      </article>
    )
  }

  return (
    <article className={`rounded-2xl border bg-zinc-900 p-5 transition-colors hover:border-zinc-700 ${
      note.isPinned ? 'border-[#C8F135]/50' : 'border-zinc-800'
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
    </article>
  )
}
