'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  Filter, Lock, MessageSquare, MessageSquareText, NotebookPen,
  Pin, Plus, Search, Send, Trash2, X, Eye, ChevronDown, ChevronUp,
} from 'lucide-react'
import { format } from 'date-fns'
import { enUS, fr } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { Header } from '@/components/layout/Header'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { useLocale } from '@/contexts/LocaleContext'

// Types

interface UserNote {
  id:        string
  title:     string
  content:   string
  category:  string | null
  tags:      string[]
  isPinned:  boolean
  createdAt: string
}

interface NoteReply {
  id:         string
  content:    string
  memberId:   string | null
  memberName?: string
  authorRole?: string
  authorName?: string
  createdAt:  string
}

interface CoachNote {
  id:          string
  title:       string
  content:     string
  category:    string | null
  tags:        string[]
  isPinned:    boolean
  isImportant: boolean
  createdAt:   string
  coachName:   string
  replies:     NoteReply[]
}

// Constants

const CATEGORIES = [
  { value: 'TRAINING',   labelKey: 'notes.categories.training' },
  { value: 'NUTRITION',  labelKey: 'notes.categories.nutrition' },
  { value: 'PROGRESS',   labelKey: 'notes.categories.progress' },
  { value: 'MOTIVATION', labelKey: 'notes.categories.motivation' },
  { value: 'OTHER',      labelKey: 'notes.categories.other' },
]

const EMPTY_FORM = { title: '', content: '', category: 'TRAINING', tags: '', isPinned: false }

// Shared helpers

// Formats a date string with the active UI locale.
function formatDate(v: string, locale: 'fr' | 'en') {
  return locale === 'fr'
    ? format(new Date(v), "d MMM yyyy 'à' HH:mm", { locale: fr })
    : format(new Date(v), 'd MMM yyyy · HH:mm', { locale: enUS })
}

function formatReplyDate(v: string, locale: 'fr' | 'en') {
  return locale === 'fr'
    ? format(new Date(v), "d MMM 'à' HH:mm", { locale: fr })
    : format(new Date(v), 'd MMM · HH:mm', { locale: enUS })
}

function categoryLabel(category: string, t: (key: string) => string) {
  const item = CATEGORIES.find(c => c.value === category)
  return item ? t(item.labelKey) : category
}

function targetNoteIdFromUrl() {
  if (typeof window === 'undefined') return null
  return new URLSearchParams(window.location.search).get('noteId')
}

function initialTabFromUrl(): Tab {
  if (typeof window === 'undefined') return 'mine'
  return new URLSearchParams(window.location.search).get('tab') === 'coach' ? 'coach' : 'mine'
}

// Labeled form field wrapper that renders a small uppercase label above its children.
function Field({ label, className, children }: { label: string; className?: string; children: React.ReactNode }) {
  return (
    <label className={cn('grid gap-1.5', className)}>
      <span className="text-xs uppercase tracking-widest text-zinc-500">{label}</span>
      {children}
    </label>
  )
}

// Generic empty-state card with icon, title, and description text.
function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-900 p-10 text-center">
      <MessageSquareText className="mx-auto mb-3 size-9 text-zinc-600" />
      <p className="font-semibold text-white">{title}</p>
      <p className="mt-1 text-sm text-zinc-500">{description}</p>
    </div>
  )
}

// Search and category filter toolbar for the notes list.
function FilterBar({
  search, onSearch, catFilter, onCatFilter,
}: {
  search: string; onSearch: (v: string) => void
  catFilter: string; onCatFilter: (v: string) => void
}) {
  const { t } = useLocale()

  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-500" />
          <input
            value={search}
            onChange={e => onSearch(e.target.value)}
            placeholder={t('notes.searchPlaceholder')}
            className="w-full rounded-xl border border-zinc-800 bg-zinc-950 py-3 pl-10 pr-4 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-[#C8F135]"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Filter className="size-4 shrink-0 text-zinc-500" />
          {[{ value: 'ALL', labelKey: 'notes.filters.all' }, ...CATEGORIES].map(c => (
            <button
              key={c.value}
              type="button"
              onClick={() => onCatFilter(c.value)}
              className={cn(
                'rounded-lg px-3 py-2 text-xs font-semibold transition-colors',
                catFilter === c.value ? 'bg-[#C8F135] text-zinc-950' : 'bg-zinc-800 text-zinc-400 hover:text-white',
              )}
            >
              {t(c.labelKey)}
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}

// Tab displaying the user's personal notes with CRUD functionality and search/category filtering.
function MyNotesTab() {
  const { t } = useLocale()
  const [notes, setNotes]         = useState<UserNote[]>([])
  const [loading, setLoading]     = useState(true)
  const [showForm, setShowForm]   = useState(false)
  const [saving, setSaving]       = useState(false)
  const [search, setSearch]       = useState('')
  const [catFilter, setCatFilter] = useState('ALL')
  const [form, setForm]           = useState(EMPTY_FORM)

  const fetchNotes = async () => {
    const res = await fetch('/api/user/notes').catch(() => null)
    const data = res ? await res.json().catch(() => []) : []
    setNotes(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  useEffect(() => { fetchNotes() }, [])

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase()
    return notes.filter(n => {
      const matchesCat    = catFilter === 'ALL' || n.category === catFilter
      const matchesSearch = !term
        || n.title.toLowerCase().includes(term)
        || n.content.toLowerCase().includes(term)
        || n.tags.some(t => t.toLowerCase().includes(term))
      return matchesCat && matchesSearch
    })
  }, [notes, search, catFilter])

  const pinned   = visible.filter(n => n.isPinned)
  const unpinned = visible.filter(n => !n.isPinned)

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim() || !form.content.trim()) return
    setSaving(true)
    await fetch('/api/user/notes', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title:    form.title,
        content:  form.content,
        category: form.category || null,
        tags:     form.tags.split(',').map(t => t.trim()).filter(Boolean),
        isPinned: form.isPinned,
      }),
    })
    setForm(EMPTY_FORM)
    setShowForm(false)
    setSaving(false)
    await fetchNotes()
  }

  const togglePin = async (note: UserNote) => {
    await fetch('/api/user/notes', {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: note.id, isPinned: !note.isPinned }),
    })
    await fetchNotes()
  }

  const del = async (id: string) => {
    if (!confirm(t('notes.confirmDeleteNote'))) return
    await fetch('/api/user/notes', {
      method:  'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    await fetchNotes()
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-zinc-400">
          {notes.length} {notes.length !== 1 ? t('notes.notesPlural') : t('notes.noteSingular')}
          {notes.filter(n => n.isPinned).length > 0 && ` · ${notes.filter(n => n.isPinned).length} ${notes.filter(n => n.isPinned).length !== 1 ? t('notes.pinnedPlural') : t('notes.pinnedSingular')}`}
        </p>
        <button
          type="button"
          onClick={() => setShowForm(v => !v)}
          className="inline-flex items-center gap-2 rounded-xl bg-[#C8F135] px-4 py-2.5 text-sm font-bold text-zinc-900 transition-colors hover:bg-[#d4f54d]"
        >
          {showForm ? <X className="size-4" /> : <Plus className="size-4" />}
          {showForm ? t('common.cancel') : t('notes.newNote')}
        </button>
      </div>

      {showForm && (
        <section className="rounded-2xl border border-[#C8F135]/30 bg-zinc-900 p-5">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-base font-semibold text-white">{t('notes.newNote')}</h2>
            <button type="button" onClick={() => setShowForm(false)} className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-800 hover:text-white">
              <X className="size-4" />
            </button>
          </div>
          <form onSubmit={save} className="grid gap-4 lg:grid-cols-2">
            <Field label={t('notes.titleField')} className="lg:col-span-2">
              <input
                required
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder={t('notes.titlePlaceholder')}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-3 text-sm text-white placeholder-zinc-500 outline-none focus:border-[#C8F135]"
              />
            </Field>
            <Field label={t('notes.categoryField')}>
              <select
                value={form.category}
                onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-3 text-sm text-white outline-none focus:border-[#C8F135]"
              >
                {CATEGORIES.map(c => <option key={c.value} value={c.value}>{t(c.labelKey)}</option>)}
              </select>
            </Field>
            <Field label={t('notes.tagsField')}>
              <input
                value={form.tags}
                onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
                placeholder={t('notes.tagsPlaceholder')}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-3 text-sm text-white placeholder-zinc-500 outline-none focus:border-[#C8F135]"
              />
            </Field>
            <Field label={t('notes.contentField')} className="lg:col-span-2">
              <textarea
                required
                value={form.content}
                onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                placeholder={t('notes.contentPlaceholder')}
                rows={5}
                className="w-full resize-none rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-3 text-sm text-white placeholder-zinc-500 outline-none focus:border-[#C8F135]"
              />
            </Field>
            <div className="flex items-center justify-between gap-3 lg:col-span-2">
              <button
                type="button"
                onClick={() => setForm(f => ({ ...f, isPinned: !f.isPinned }))}
                className={cn(
                  'inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold transition-colors',
                  form.isPinned ? 'border-[#C8F135]/50 bg-[#C8F135]/10 text-[#C8F135]' : 'border-zinc-800 text-zinc-400 hover:text-white',
                )}
              >
                <Pin className="size-4" /> {t('notes.pin')}
              </button>
              <button
                type="submit"
                disabled={saving || !form.title.trim() || !form.content.trim()}
                className="rounded-xl bg-[#C8F135] px-5 py-2.5 text-sm font-bold text-zinc-900 transition-colors hover:bg-[#d4f54d] disabled:opacity-50"
              >
                {saving ? t('notes.saving') : t('common.add')}
              </button>
            </div>
          </form>
        </section>
      )}

      <FilterBar search={search} onSearch={setSearch} catFilter={catFilter} onCatFilter={setCatFilter} />

      {loading ? (
        <div className="space-y-3">
          {[0, 1, 2].map(i => <div key={i} className="h-32 animate-pulse rounded-2xl bg-zinc-900" />)}
        </div>
      ) : visible.length === 0 ? (
        <EmptyState
          title={search || catFilter !== 'ALL' ? t('notes.noNoteFound') : t('notes.noNoteYet')}
          description={search || catFilter !== 'ALL' ? t('notes.tryOtherFilters') : t('notes.createFirstNote')}
        />
      ) : (
        <div className="space-y-6">
          {pinned.length > 0 && (
            <div className="space-y-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">{t('notes.pinnedSection')}</p>
              {pinned.map(n => (
                <NoteCard key={n.id} note={n} onPin={() => togglePin(n)} onDelete={() => del(n.id)} />
              ))}
            </div>
          )}
          <div className="space-y-3">
            {pinned.length > 0 && <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">{t('notes.allNotes')}</p>}
            {unpinned.map(n => (
              <NoteCard key={n.id} note={n} onPin={() => togglePin(n)} onDelete={() => del(n.id)} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// Renders a single personal note card with pin/delete actions and tag badges.
function NoteCard({ note, onPin, onDelete }: { note: UserNote; onPin: () => void; onDelete: () => void }) {
  const { locale, t } = useLocale()

  return (
    <article className={cn(
      'rounded-2xl border bg-zinc-900 p-5 transition-colors hover:border-zinc-700',
      note.isPinned ? 'border-[#C8F135]/40' : 'border-zinc-800',
    )}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            {note.isPinned && <Pin className="size-4 fill-[#C8F135] text-[#C8F135]" />}
            {note.category && (
              <span className="rounded-full border border-zinc-700 bg-zinc-800 px-2.5 py-0.5 text-xs text-zinc-300">
                {categoryLabel(note.category, t)}
              </span>
            )}
          </div>
          <h3 className="text-base font-semibold text-white">{note.title}</h3>
          <p className="mt-0.5 text-xs text-zinc-500">{formatDate(note.createdAt, locale)}</p>
        </div>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={onPin}
            className={cn(
              'rounded-lg p-2 transition-colors',
              note.isPinned ? 'bg-[#C8F135]/10 text-[#C8F135]' : 'bg-zinc-800 text-zinc-400 hover:text-[#C8F135]',
            )}
          >
            <Pin className="size-4" />
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="rounded-lg bg-zinc-800 p-2 text-zinc-400 transition-colors hover:text-red-300"
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      </div>
      <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-zinc-300">{note.content}</p>
      {note.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {note.tags.map(tag => (
            <span key={tag} className="rounded-lg bg-zinc-950 px-2.5 py-1 text-xs text-zinc-500">#{tag}</span>
          ))}
        </div>
      )}
    </article>
  )
}

// Tab displaying notes shared by the coach, with inline reply thread and delete (hide) support.
function CoachNotesTab({ targetNoteId }: { targetNoteId: string | null }) {
  const { t } = useLocale()
  const [notes, setNotes]         = useState<CoachNote[]>([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [catFilter, setCatFilter] = useState('ALL')

  const fetchNotes = async () => {
    const res = await fetch('/api/user/coach-notes').catch(() => null)
    const data = res ? await res.json().catch(() => []) : []
    if (Array.isArray(data)) setNotes(data)
    setLoading(false)
  }

  useEffect(() => { fetchNotes() }, [])

  useEffect(() => {
    if (!targetNoteId || !notes.some((note) => note.id === targetNoteId)) return
    setSearch('')
    setCatFilter('ALL')
  }, [notes, targetNoteId])

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase()
    return notes.filter(n => {
      const matchesCat    = catFilter === 'ALL' || n.category === catFilter
      const matchesSearch = !term
        || n.title.toLowerCase().includes(term)
        || n.content.toLowerCase().includes(term)
        || n.tags.some(t => t.toLowerCase().includes(term))
      return matchesCat && matchesSearch
    })
  }, [notes, search, catFilter])

  const pinned   = visible.filter(n => n.isPinned)
  const unpinned = visible.filter(n => !n.isPinned)

  const handleDelete = async (note: CoachNote) => {
    if (note.isImportant) {
      alert(t('notes.importantCannotDelete'))
      return
    }
    if (!confirm(t('notes.confirmHideCoachNote'))) return
    const res = await fetch('/api/user/coach-notes', {
      method:  'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ noteId: note.id }),
    })
    if (res.ok) {
      setNotes(prev => prev.filter(n => n.id !== note.id))
    } else {
      const body = await res.json().catch(() => ({}))
      alert(body.error ?? t('notes.deleteError'))
    }
  }

  return (
    <div className="space-y-5">
      <p className="text-sm text-zinc-400">
        {notes.length} {notes.length !== 1 ? t('notes.notesPlural') : t('notes.noteSingular')} {notes.length !== 1 ? t('notes.sharedPlural') : t('notes.sharedSingular')} {t('notes.byYourCoach')}
      </p>

      <FilterBar search={search} onSearch={setSearch} catFilter={catFilter} onCatFilter={setCatFilter} />

      {loading ? (
        <div className="space-y-3">
          {[0, 1, 2].map(i => <div key={i} className="h-32 animate-pulse rounded-2xl bg-zinc-900" />)}
        </div>
      ) : visible.length === 0 ? (
        <EmptyState
          title={search || catFilter !== 'ALL' ? t('notes.noNoteFound') : t('notes.noCoachNote')}
          description={search || catFilter !== 'ALL' ? t('notes.tryOtherFilters') : t('notes.noCoachNoteDescription')}
        />
      ) : (
        <div className="space-y-6">
          {pinned.length > 0 && (
            <div className="space-y-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">{t('notes.pinnedByCoach')}</p>
              {pinned.map(n => (
                <CoachNoteCard
                  key={n.id}
                  note={n}
                  highlighted={n.id === targetNoteId}
                  onDelete={() => handleDelete(n)}
                  onReplyAdded={fetchNotes}
                />
              ))}
            </div>
          )}
          <div className="space-y-3">
            {pinned.length > 0 && <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">{t('notes.allNotes')}</p>}
            {unpinned.map(n => (
              <CoachNoteCard
                key={n.id}
                note={n}
                highlighted={n.id === targetNoteId}
                onDelete={() => handleDelete(n)}
                onReplyAdded={fetchNotes}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// Renders a shared coach note card with expandable reply thread and inline reply submission.
function CoachNoteCard({
  note, highlighted = false, onDelete, onReplyAdded,
}: {
  note: CoachNote
  highlighted?: boolean
  onDelete: () => void
  onReplyAdded: () => void
}) {
  const { locale, t } = useLocale()
  const [showReplies, setShowReplies]   = useState(false)
  const [replyText, setReplyText]       = useState('')
  const [submitting, setSubmitting]     = useState(false)
  const [replies, setReplies]           = useState<NoteReply[]>(note.replies ?? [])
  const [deletingReply, setDeletingReply] = useState<string | null>(null)

  useEffect(() => setReplies(note.replies ?? []), [note.replies])

  useEffect(() => {
    if (!highlighted) return
    setShowReplies(true)
    document.getElementById(`member-coach-note-${note.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [highlighted, note.id])

  const submitReply = async () => {
    if (!replyText.trim()) return
    setSubmitting(true)
    const res = await fetch(`/api/user/coach-notes/${note.id}/replies`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ content: replyText }),
    })
    if (res.ok) {
      const newReply = await res.json()
      setReplies(prev => [...prev, {
        id:         newReply.id,
        content:    newReply.content,
        memberId:   newReply.memberId,
        memberName: newReply.member?.name ?? t('messagesPage.you'),
        authorRole: newReply.authorRole ?? 'MEMBER',
        authorName: newReply.authorRole === 'COACH' ? t('messagesPage.coach') : newReply.member?.name ?? t('messagesPage.you'),
        createdAt:  newReply.createdAt,
      }])
      setReplyText('')
      onReplyAdded()
    }
    setSubmitting(false)
  }

  const deleteReply = async (replyId: string) => {
    if (!confirm(t('notes.confirmDeleteReply'))) return
    setDeletingReply(replyId)
    await fetch(`/api/user/coach-notes/${note.id}/replies`, {
      method:  'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ replyId }),
    })
    setReplies(prev => prev.filter(r => r.id !== replyId))
    setDeletingReply(null)
  }

  return (
    <article id={`member-coach-note-${note.id}`} className={cn(
      'rounded-2xl border bg-zinc-900 p-5 transition-colors',
      highlighted
        ? 'border-[#C8F135] shadow-[0_0_0_1px_rgba(200,241,53,0.35),0_0_28px_rgba(200,241,53,0.12)]'
        : note.isImportant ? 'border-amber-500/40' : note.isPinned ? 'border-[#C8F135]/40' : 'border-zinc-800',
    )}>
      <div className="flex items-start gap-4">
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            {note.isPinned && <Pin className="size-4 fill-[#C8F135] text-[#C8F135]" />}
            {note.isImportant && (
              <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/40 bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-400">
                <Lock className="size-3" /> {t('notes.important')}
              </span>
            )}
            <span className="inline-flex items-center gap-1 rounded-full border border-blue-500/30 bg-blue-500/10 px-2.5 py-0.5 text-xs text-blue-300">
              <Eye className="size-3" /> {t('notes.sharedBy')} {note.coachName}
            </span>
            {note.category && (
              <span className="rounded-full border border-zinc-700 bg-zinc-800 px-2.5 py-0.5 text-xs text-zinc-300">
                {categoryLabel(note.category, t)}
              </span>
            )}
          </div>
          <h3 className="text-base font-semibold text-white">{note.title}</h3>
          <p className="mt-0.5 text-xs text-zinc-500">{formatDate(note.createdAt, locale)}</p>
        </div>

        {/* Delete button, disabled with a tooltip when the note is important. */}
        <div className="shrink-0">
          {note.isImportant ? (
            <div
              title={t('notes.importantCannotDelete')}
              className="rounded-lg bg-zinc-800 p-2 text-zinc-600 cursor-not-allowed"
            >
              <Lock className="size-4" />
            </div>
          ) : (
            <button
              type="button"
              onClick={onDelete}
              className="rounded-lg bg-zinc-800 p-2 text-zinc-400 transition-colors hover:text-red-300"
              title={t('notes.hideNote')}
            >
              <Trash2 className="size-4" />
            </button>
          )}
        </div>
      </div>

      <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-zinc-300">{note.content}</p>

      {note.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {note.tags.map(tag => (
            <span key={tag} className="rounded-lg bg-zinc-950 px-2.5 py-1 text-xs text-zinc-500">#{tag}</span>
          ))}
        </div>
      )}

      {/* Replies section */}
      <div className="mt-4 border-t border-zinc-800 pt-4 space-y-3">
        <button
          type="button"
          onClick={() => setShowReplies(v => !v)}
          className="flex items-center gap-2 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          <MessageSquare className="size-3.5" />
          {replies.length > 0 ? `${replies.length} ${replies.length !== 1 ? t('notes.repliesPlural') : t('notes.replySingular')}` : t('notes.reply')}
          {replies.length > 0 && (showReplies ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />)}
        </button>

        {showReplies && (
          <div className="space-y-2">
            {replies.map(r => (
              <div key={r.id} className="flex items-start gap-2 bg-zinc-800/60 rounded-xl px-3 py-2.5">
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-semibold text-zinc-400">
                    {r.authorRole === 'COACH' ? r.authorName ?? t('messagesPage.coach') : r.authorName ?? r.memberName ?? t('messagesPage.you')}
                  </p>
                  <p className="text-sm text-zinc-300 mt-0.5">{r.content}</p>
                  <p className="text-[10px] text-zinc-600 mt-1">
                    {formatReplyDate(r.createdAt, locale)}
                  </p>
                </div>
                {r.authorRole !== 'COACH' && (
                  <button
                    type="button"
                    onClick={() => deleteReply(r.id)}
                    disabled={deletingReply === r.id}
                    className="mt-0.5 text-zinc-600 hover:text-red-400 transition-colors disabled:opacity-50 shrink-0"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                )}
              </div>
            ))}

            {/* Reply input */}
            <div className="flex gap-2 mt-1">
              <input
                value={replyText}
                onChange={e => setReplyText(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitReply() } }}
                placeholder={t('notes.writeReply')}
                className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#C8F135]"
              />
              <button
                type="button"
                onClick={submitReply}
                disabled={submitting || !replyText.trim()}
                className="flex items-center gap-1 text-xs font-medium text-zinc-900 bg-[#C8F135] hover:bg-[#d4f54d] px-3 py-2 rounded-xl disabled:opacity-50 transition-colors shrink-0"
              >
                <Send className="size-3.5" />
                {submitting ? '…' : t('common.send')}
              </button>
            </div>
          </div>
        )}
      </div>
    </article>
  )
}

type Tab = 'mine' | 'coach'

/** Notes page with two tabs: the member's own personal notes and notes shared by their coach. */
export default function NotesPage() {
  const { t } = useLocale()
  const [tab, setTab] = useState<Tab>(() => initialTabFromUrl())
  const [targetNoteId] = useState(() => targetNoteIdFromUrl())

  return (
    <>
      <Header titleKey="nav.notes" />
      <PageWrapper>
        <div className="space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-lg font-bold text-white">{t('notes.title')}</p>
              <p className="mt-0.5 text-xs text-zinc-400">{t('notes.subtitle')}</p>
            </div>

            <div className="grid w-full grid-cols-2 gap-1 rounded-xl border border-zinc-800 bg-zinc-900 p-1 sm:w-auto">
              <button
                type="button"
                onClick={() => setTab('mine')}
                className={cn(
                  'flex min-w-0 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors sm:px-4',
                  tab === 'mine' ? 'bg-[#C8F135] text-zinc-900' : 'text-zinc-400 hover:text-white',
                )}
              >
                <NotebookPen className="size-4 shrink-0" />
                <span className="truncate">{t('notes.myNotes')}</span>
              </button>
              <button
                type="button"
                onClick={() => setTab('coach')}
                className={cn(
                  'flex min-w-0 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors sm:px-4',
                  tab === 'coach' ? 'bg-[#C8F135] text-zinc-900' : 'text-zinc-400 hover:text-white',
                )}
              >
                <Eye className="size-4 shrink-0" />
                <span className="truncate">{t('notes.coachNotes')}</span>
              </button>
            </div>
          </div>

          {tab === 'mine'  && <MyNotesTab />}
          {tab === 'coach' && <CoachNotesTab targetNoteId={targetNoteId} />}
        </div>
      </PageWrapper>
    </>
  )
}
