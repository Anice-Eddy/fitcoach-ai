'use client'

import { useEffect, useState } from 'react'
import { Calendar, Clock, User, Plus, Check, X, MessageSquare, Edit3, Link2, Send } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { cn } from '@/lib/utils'

interface Member {
  id:    string
  name:  string
  email: string
}

interface Appointment {
  id:          string
  title:       string
  description: string | null
  scheduledAt: string
  duration:    number
  status:      'PENDING' | 'PROPOSED' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW'
  meetLink:    string | null
  coachNote:   string | null
  memberNote:  string | null
  member:      Member
}

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  PENDING:   { label: 'En attente',      color: 'text-amber-400   bg-amber-400/10  border-amber-400/20' },
  PROPOSED:  { label: 'Date proposée',   color: 'text-blue-400    bg-blue-400/10   border-blue-400/20' },
  CONFIRMED: { label: 'Confirmé',        color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20' },
  COMPLETED: { label: 'Terminé',         color: 'text-zinc-400    bg-zinc-800       border-zinc-700' },
  CANCELLED: { label: 'Annulé',          color: 'text-red-400     bg-red-400/10     border-red-400/20' },
  NO_SHOW:   { label: 'Absent',          color: 'text-red-400     bg-red-400/10     border-red-400/20' },
}

type Panel = 'propose' | 'note' | 'edit' | null

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading]           = useState(true)
  const [showNew, setShowNew]           = useState(false)
  const [creating, setCreating]         = useState(false)
  const [members, setMembers]           = useState<Member[]>([])
  const [newForm, setNewForm] = useState({
    memberId: '', title: '', description: '', scheduledAt: '', duration: 60, meetLink: '',
  })

  useEffect(() => {
    fetchAll()
    fetch('/api/coach/members')
      .then(r => r.ok ? r.json() : { members: [] })
      .then(d => setMembers(d.members ?? []))
  }, [])

  const fetchAll = async () => {
    setLoading(true)
    const res  = await fetch('/api/coach/appointments')
    const data = await res.json()
    setAppointments(data || [])
    setLoading(false)
  }

  const patch = async (id: string, body: object) => {
    await fetch(`/api/coach/appointments/${id}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(body),
    })
    await fetchAll()
  }

  const createAppointment = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)
    const res = await fetch('/api/coach/appointments', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(newForm),
    })
    if (res.ok) {
      setShowNew(false)
      setNewForm({ memberId: '', title: '', description: '', scheduledAt: '', duration: 60, meetLink: '' })
      await fetchAll()
    }
    setCreating(false)
  }

  const pending   = appointments.filter(a => a.status === 'PENDING')
  const proposed  = appointments.filter(a => a.status === 'PROPOSED')
  const upcoming  = appointments.filter(a => a.status === 'CONFIRMED' && new Date(a.scheduledAt) > new Date())
  const history   = appointments.filter(a =>
    ['COMPLETED', 'CANCELLED', 'NO_SHOW'].includes(a.status) ||
    (a.status === 'CONFIRMED' && new Date(a.scheduledAt) <= new Date()),
  )

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Calendar className="size-6 text-[#C8F135]" />
            Agenda
          </h1>
          <p className="text-sm text-zinc-400 mt-1">Gérez vos rendez-vous et demandes</p>
        </div>
        <button
          onClick={() => setShowNew(v => !v)}
          className="flex items-center gap-2 px-4 py-2 bg-[#C8F135] text-zinc-900 rounded-xl hover:bg-[#d4f54d] transition-colors font-semibold text-sm"
        >
          <Plus className="size-4" /> Nouveau rendez-vous
        </button>
      </div>

      {/* Formulaire nouveau RDV */}
      {showNew && (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 mb-8">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-semibold text-white">Créer un rendez-vous</h2>
            <button onClick={() => setShowNew(false)} className="text-zinc-500 hover:text-white"><X className="size-4" /></button>
          </div>
          <form onSubmit={createAppointment} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">Membre</label>
                <select value={newForm.memberId} onChange={e => setNewForm(f => ({ ...f, memberId: e.target.value }))} required
                  className="w-full px-3 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-white text-sm focus:outline-none focus:border-[#C8F135]">
                  <option value="">Sélectionner un membre</option>
                  {members.map(m => <option key={m.id} value={m.id}>{m.name} ({m.email})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">Titre</label>
                <input type="text" value={newForm.title} onChange={e => setNewForm(f => ({ ...f, title: e.target.value }))}
                  required placeholder="Ex: Bilan de mi-parcours"
                  className="w-full px-3 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-[#C8F135]" />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">Date et heure</label>
                <input type="datetime-local" value={newForm.scheduledAt} onChange={e => setNewForm(f => ({ ...f, scheduledAt: e.target.value }))}
                  required className="w-full px-3 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-white text-sm focus:outline-none focus:border-[#C8F135]" />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">Durée (min)</label>
                <input type="number" value={newForm.duration} onChange={e => setNewForm(f => ({ ...f, duration: parseInt(e.target.value) }))}
                  className="w-full px-3 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-white text-sm focus:outline-none focus:border-[#C8F135]" />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">Lien de réunion</label>
                <input type="url" value={newForm.meetLink} onChange={e => setNewForm(f => ({ ...f, meetLink: e.target.value }))}
                  placeholder="https://meet.google.com/…"
                  className="w-full px-3 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-[#C8F135]" />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">Description</label>
                <textarea value={newForm.description} onChange={e => setNewForm(f => ({ ...f, description: e.target.value }))}
                  rows={3} placeholder="Objectifs de la séance…"
                  className="w-full px-3 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-[#C8F135] resize-none" />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button type="button" onClick={() => setShowNew(false)} className="px-4 py-2 text-sm rounded-xl bg-zinc-800 text-zinc-300 hover:bg-zinc-700">Annuler</button>
              <button type="submit" disabled={creating} className="px-4 py-2 text-sm rounded-xl bg-[#C8F135] text-zinc-900 font-semibold hover:bg-[#d4f54d] disabled:opacity-50">
                {creating ? 'Création…' : 'Créer'}
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="text-center py-16 text-zinc-500">Chargement…</div>
      ) : (
        <div className="space-y-10">

          {/* ── Demandes en attente ── */}
          {pending.length > 0 && (
            <Section title="Demandes en attente" count={pending.length} accent="amber">
              {pending.map(appt => (
                <PendingCard key={appt.id} appt={appt} onPatch={patch} />
              ))}
            </Section>
          )}

          {/* ── Contre-propositions envoyées ── */}
          {proposed.length > 0 && (
            <Section title="En attente de confirmation membre" count={proposed.length} accent="blue">
              {proposed.map(appt => (
                <ProposedCard key={appt.id} appt={appt} onPatch={patch} />
              ))}
            </Section>
          )}

          {/* ── À venir ── */}
          <Section title="À venir" count={upcoming.length}>
            {upcoming.length === 0 ? (
              <EmptyState label="Aucun rendez-vous confirmé à venir" />
            ) : (
              upcoming.map(appt => (
                <ConfirmedCard key={appt.id} appt={appt} onPatch={patch} />
              ))
            )}
          </Section>

          {/* ── Historique ── */}
          {history.length > 0 && (
            <Section title="Historique" count={history.length} muted>
              {history.map(appt => (
                <HistoryCard key={appt.id} appt={appt} />
              ))}
            </Section>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function Section({ title, count, accent, muted, children }: {
  title: string; count: number; accent?: 'amber' | 'blue'; muted?: boolean; children: React.ReactNode
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <p className={cn('text-xs font-semibold uppercase tracking-widest', muted ? 'text-zinc-600' : 'text-zinc-400')}>
          {title}
        </p>
        <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full', {
          'bg-amber-400/15 text-amber-400': accent === 'amber',
          'bg-blue-400/15 text-blue-400':   accent === 'blue',
          'bg-zinc-800 text-zinc-400':       !accent,
        })}>
          {count}
        </span>
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  )
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-zinc-800 p-6 text-center text-sm text-zinc-600">
      {label}
    </div>
  )
}

function DateRow({ scheduledAt, duration }: { scheduledAt: string; duration: number }) {
  return (
    <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-400">
      <span className="flex items-center gap-1.5">
        <Calendar className="size-3.5" />
        {format(new Date(scheduledAt), 'PPP', { locale: fr })}
      </span>
      <span className="flex items-center gap-1.5">
        <Clock className="size-3.5" />
        {format(new Date(scheduledAt), 'HH:mm')} · {duration} min
      </span>
    </div>
  )
}

function MemberNoteBlock({ note }: { note: string }) {
  return (
    <div className="rounded-xl bg-zinc-800 border border-zinc-700 px-3 py-2.5">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500 mb-1">Note du membre</p>
      <p className="text-sm text-zinc-300">{note}</p>
    </div>
  )
}

function CoachNoteBlock({ note }: { note: string }) {
  return (
    <div className="rounded-xl bg-zinc-800/60 px-3 py-2">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500 mb-0.5">Votre note</p>
      <p className="text-xs text-zinc-300">{note}</p>
    </div>
  )
}

// ─── PENDING card : Accepter / Proposer une date+note / Refuser ────────────

function PendingCard({ appt, onPatch }: { appt: Appointment; onPatch: (id: string, body: object) => Promise<void> }) {
  const [panel, setPanel]   = useState<Panel>(null)
  const [newDate, setNewDate] = useState(appt.scheduledAt.slice(0, 16))
  const [newDur, setNewDur] = useState(appt.duration)
  const [newMeet, setNewMeet] = useState(appt.meetLink ?? '')
  const [note, setNote]     = useState(appt.coachNote ?? '')
  const [saving, setSaving] = useState(false)

  const save = async (body: object) => {
    setSaving(true)
    await onPatch(appt.id, body)
    setSaving(false)
    setPanel(null)
  }

  return (
    <div className="rounded-2xl border border-amber-400/20 bg-zinc-900 overflow-hidden">
      <div className="p-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <p className="font-semibold text-white">{appt.title}</p>
            {appt.description && <p className="text-xs text-zinc-500 mt-0.5">{appt.description}</p>}
          </div>
          <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full border text-amber-400 bg-amber-400/10 border-amber-400/20 shrink-0">
            En attente
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-zinc-400 mb-3">
          <User className="size-3.5" />{appt.member.name}
          <span className="text-zinc-700 mx-1">·</span>
          <Calendar className="size-3.5" />{format(new Date(appt.scheduledAt), 'PPP', { locale: fr })}
          <span className="text-zinc-700 mx-1">·</span>
          <Clock className="size-3.5" />{format(new Date(appt.scheduledAt), 'HH:mm')} · {appt.duration} min
        </div>

        {appt.memberNote && <MemberNoteBlock note={appt.memberNote} />}

        {/* Actions */}
        <div className="flex flex-wrap gap-2 mt-4">
          <button onClick={() => save({ status: 'CONFIRMED' })} disabled={saving}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-500/15 text-emerald-400 text-xs font-semibold hover:bg-emerald-500/25 transition-colors disabled:opacity-50">
            <Check className="size-3.5" /> Accepter
          </button>

          <button onClick={() => setPanel(p => p === 'propose' ? null : 'propose')}
            className={cn('flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors',
              panel === 'propose' ? 'bg-blue-500/15 text-blue-400' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700')}>
            <Send className="size-3.5" /> Proposer une date
          </button>

          <button onClick={() => save({ status: 'CANCELLED' })} disabled={saving}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-500/10 text-red-400 text-xs font-semibold hover:bg-red-500/20 transition-colors ml-auto disabled:opacity-50">
            <X className="size-3.5" /> Refuser
          </button>
        </div>
      </div>

      {/* Panneau "Proposer une date" — modifie la date + ajoute note, envoie statut PROPOSED */}
      {panel === 'propose' && (
        <div className="border-t border-zinc-800 bg-zinc-950 px-4 py-5 space-y-4">
          <div>
            <p className="text-sm font-semibold text-white mb-1">Proposer une date et ajouter une note</p>
            <p className="text-xs text-zinc-500">Le membre recevra votre proposition et pourra ajouter une note avant que vous confirmiez.</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-zinc-400 mb-1.5">Date et heure</label>
              <input type="datetime-local" value={newDate} onChange={e => setNewDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-sm focus:outline-none focus:border-[#C8F135]" />
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1.5">Durée (min)</label>
              <input type="number" value={newDur} onChange={e => setNewDur(parseInt(e.target.value))}
                className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-sm focus:outline-none focus:border-[#C8F135]" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs text-zinc-400 mb-1.5">Lien de réunion</label>
              <input type="url" value={newMeet} onChange={e => setNewMeet(e.target.value)} placeholder="https://meet.google.com/…"
                className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-[#C8F135]" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs text-zinc-400 mb-1.5">Note pour le membre <span className="text-zinc-600">(visible dans son espace)</span></label>
              <textarea value={note} onChange={e => setNote(e.target.value)} rows={3}
                placeholder="Préparez votre tenue, nous travaillerons sur…"
                className="w-full px-3 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-[#C8F135] resize-none" />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setPanel(null)} className="px-3 py-1.5 text-xs rounded-lg bg-zinc-800 text-zinc-400 hover:bg-zinc-700">Annuler</button>
            <button disabled={saving || !newDate}
              onClick={() => save({ status: 'PROPOSED', scheduledAt: newDate, duration: newDur, meetLink: newMeet || null, coachNote: note || null })}
              className="flex items-center gap-1.5 px-4 py-1.5 text-xs rounded-lg bg-blue-500 text-white font-semibold hover:bg-blue-400 disabled:opacity-50">
              <Send className="size-3.5" />
              {saving ? 'Envoi…' : 'Envoyer au membre'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── PROPOSED card : contre-proposition envoyée, attente du membre ─────────

function ProposedCard({ appt, onPatch }: { appt: Appointment; onPatch: (id: string, body: object) => Promise<void> }) {
  const [panel, setPanel]     = useState<Panel>(null)
  const [newDate, setNewDate] = useState(appt.scheduledAt.slice(0, 16))
  const [newDur, setNewDur]   = useState(appt.duration)
  const [newMeet, setNewMeet] = useState(appt.meetLink ?? '')
  const [note, setNote]       = useState(appt.coachNote ?? '')
  const [saving, setSaving]   = useState(false)

  const save = async (body: object) => {
    setSaving(true)
    await onPatch(appt.id, body)
    setSaving(false)
    setPanel(null)
  }

  return (
    <div className="rounded-2xl border border-blue-400/20 bg-zinc-900 overflow-hidden">
      <div className="p-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <p className="font-semibold text-white">{appt.title}</p>
            {appt.description && <p className="text-xs text-zinc-500 mt-0.5">{appt.description}</p>}
          </div>
          <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full border text-blue-400 bg-blue-400/10 border-blue-400/20 shrink-0">
            Date proposée
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-zinc-400 mb-3">
          <User className="size-3.5" />{appt.member.name}
          <span className="text-zinc-700 mx-1">·</span>
          <Calendar className="size-3.5" />{format(new Date(appt.scheduledAt), 'PPP', { locale: fr })}
          <span className="text-zinc-700 mx-1">·</span>
          <Clock className="size-3.5" />{format(new Date(appt.scheduledAt), 'HH:mm')} · {appt.duration} min
          {appt.meetLink && (
            <a href={appt.meetLink} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1 text-[#C8F135] hover:underline ml-2">
              <Link2 className="size-3.5" /> Lien
            </a>
          )}
        </div>

        {appt.coachNote && <CoachNoteBlock note={appt.coachNote} />}
        {appt.memberNote && <div className="mt-2"><MemberNoteBlock note={appt.memberNote} /></div>}

        <div className="flex flex-wrap gap-2 mt-4">
          <button onClick={() => save({ status: 'CONFIRMED' })} disabled={saving}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-500/15 text-emerald-400 text-xs font-semibold hover:bg-emerald-500/25 disabled:opacity-50">
            <Check className="size-3.5" /> Confirmer le rendez-vous
          </button>
          <button onClick={() => setPanel(p => p === 'edit' ? null : 'edit')}
            className={cn('flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors',
              panel === 'edit' ? 'bg-blue-500/15 text-blue-400' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700')}>
            <Edit3 className="size-3.5" /> Modifier la proposition
          </button>
          <button onClick={() => save({ status: 'CANCELLED' })} disabled={saving}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-500/10 text-red-400 text-xs font-semibold hover:bg-red-500/20 ml-auto disabled:opacity-50">
            <X className="size-3.5" /> Annuler
          </button>
        </div>
      </div>

      {panel === 'edit' && (
        <div className="border-t border-zinc-800 bg-zinc-950 px-4 py-5 space-y-4">
          <p className="text-sm font-semibold text-white">Modifier la proposition</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-zinc-400 mb-1.5">Date et heure</label>
              <input type="datetime-local" value={newDate} onChange={e => setNewDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-sm focus:outline-none focus:border-[#C8F135]" />
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1.5">Durée (min)</label>
              <input type="number" value={newDur} onChange={e => setNewDur(parseInt(e.target.value))}
                className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-sm focus:outline-none focus:border-[#C8F135]" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs text-zinc-400 mb-1.5">Lien de réunion</label>
              <input type="url" value={newMeet} onChange={e => setNewMeet(e.target.value)} placeholder="https://meet.google.com/…"
                className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-[#C8F135]" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs text-zinc-400 mb-1.5">Note pour le membre</label>
              <textarea value={note} onChange={e => setNote(e.target.value)} rows={3}
                className="w-full px-3 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-[#C8F135] resize-none" />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setPanel(null)} className="px-3 py-1.5 text-xs rounded-lg bg-zinc-800 text-zinc-400 hover:bg-zinc-700">Annuler</button>
            <button disabled={saving}
              onClick={() => save({ scheduledAt: newDate, duration: newDur, meetLink: newMeet || null, coachNote: note || null })}
              className="flex items-center gap-1.5 px-4 py-1.5 text-xs rounded-lg bg-blue-500 text-white font-semibold hover:bg-blue-400 disabled:opacity-50">
              <Send className="size-3.5" /> {saving ? 'Envoi…' : 'Renvoyer au membre'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── CONFIRMED card : modifier / ajouter note / marquer terminé ───────────

function ConfirmedCard({ appt, onPatch }: { appt: Appointment; onPatch: (id: string, body: object) => Promise<void> }) {
  const [panel, setPanel]     = useState<Panel>(null)
  const [note, setNote]       = useState(appt.coachNote ?? '')
  const [newDate, setNewDate] = useState(appt.scheduledAt.slice(0, 16))
  const [newDur, setNewDur]   = useState(appt.duration)
  const [newMeet, setNewMeet] = useState(appt.meetLink ?? '')
  const [saving, setSaving]   = useState(false)

  const save = async (body: object) => {
    setSaving(true)
    await onPatch(appt.id, body)
    setSaving(false)
    setPanel(null)
  }

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 overflow-hidden">
      <div className="p-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <p className="font-semibold text-white">{appt.title}</p>
            {appt.description && <p className="text-xs text-zinc-500 mt-0.5">{appt.description}</p>}
          </div>
          <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full border text-emerald-400 bg-emerald-400/10 border-emerald-400/20 shrink-0">
            Confirmé
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-400 mb-3">
          <span className="flex items-center gap-1.5"><User className="size-3.5" />{appt.member.name}</span>
          <DateRow scheduledAt={appt.scheduledAt} duration={appt.duration} />
          {appt.meetLink && (
            <a href={appt.meetLink} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1 text-[#C8F135] hover:underline ml-auto">
              <Link2 className="size-3.5" /> Rejoindre
            </a>
          )}
        </div>

        {(appt.coachNote || appt.memberNote) && (
          <div className="space-y-2 mb-3">
            {appt.coachNote   && <CoachNoteBlock note={appt.coachNote} />}
            {appt.memberNote  && <MemberNoteBlock note={appt.memberNote} />}
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <button onClick={() => setPanel(p => p === 'edit' ? null : 'edit')}
            className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
              panel === 'edit' ? 'bg-[#C8F135]/15 text-[#C8F135]' : 'bg-zinc-800 text-zinc-400 hover:text-white')}>
            <Edit3 className="size-3.5" /> Modifier
          </button>
          <button onClick={() => setPanel(p => p === 'note' ? null : 'note')}
            className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
              panel === 'note' ? 'bg-[#C8F135]/15 text-[#C8F135]' : 'bg-zinc-800 text-zinc-400 hover:text-white')}>
            <MessageSquare className="size-3.5" /> {appt.coachNote ? 'Modifier note' : 'Ajouter note'}
          </button>
          <button onClick={() => save({ status: 'COMPLETED' })} disabled={saving}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-400 text-xs font-medium hover:text-white transition-colors ml-auto disabled:opacity-50">
            <Check className="size-3.5" /> Marquer terminé
          </button>
        </div>
      </div>

      {panel === 'edit' && (
        <div className="border-t border-zinc-800 bg-zinc-950 px-4 py-4 space-y-3">
          <p className="text-xs font-semibold text-zinc-400">Modifier le rendez-vous</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-zinc-500 mb-1">Date et heure</label>
              <input type="datetime-local" value={newDate} onChange={e => setNewDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-sm focus:outline-none focus:border-[#C8F135]" />
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-1">Durée (min)</label>
              <input type="number" value={newDur} onChange={e => setNewDur(parseInt(e.target.value))}
                className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-sm focus:outline-none focus:border-[#C8F135]" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs text-zinc-500 mb-1">Lien de réunion</label>
              <input type="url" value={newMeet} onChange={e => setNewMeet(e.target.value)} placeholder="https://meet.google.com/…"
                className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-[#C8F135]" />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setPanel(null)} className="px-3 py-1.5 text-xs rounded-lg bg-zinc-800 text-zinc-400 hover:bg-zinc-700">Annuler</button>
            <button disabled={saving} onClick={() => save({ scheduledAt: newDate, duration: newDur, meetLink: newMeet || null })}
              className="px-3 py-1.5 text-xs rounded-lg bg-[#C8F135] text-zinc-900 font-semibold hover:bg-[#d4f54d] disabled:opacity-50">
              {saving ? 'Enregistrement…' : 'Sauvegarder'}
            </button>
          </div>
        </div>
      )}

      {panel === 'note' && (
        <div className="border-t border-zinc-800 bg-zinc-950 px-4 py-4 space-y-3">
          <p className="text-xs font-semibold text-zinc-400">Note pour le membre</p>
          <textarea value={note} onChange={e => setNote(e.target.value)} rows={4}
            placeholder="Consignes, objectifs, préparation…"
            className="w-full px-3 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-[#C8F135] resize-none" />
          <div className="flex gap-2 justify-end">
            <button onClick={() => setPanel(null)} className="px-3 py-1.5 text-xs rounded-lg bg-zinc-800 text-zinc-400 hover:bg-zinc-700">Annuler</button>
            <button disabled={saving} onClick={() => save({ coachNote: note })}
              className="px-3 py-1.5 text-xs rounded-lg bg-[#C8F135] text-zinc-900 font-semibold hover:bg-[#d4f54d] disabled:opacity-50">
              {saving ? 'Enregistrement…' : 'Enregistrer'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── History card ─────────────────────────────────────────────────────────────

function HistoryCard({ appt }: { appt: Appointment }) {
  const st = STATUS_LABEL[appt.status]
  return (
    <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/50 p-4 opacity-70">
      <div className="flex items-start justify-between gap-3 mb-2">
        <p className="text-sm font-medium text-zinc-300">{appt.title}</p>
        <span className={cn('text-[10px] font-semibold px-2.5 py-1 rounded-full border shrink-0', st?.color ?? 'text-zinc-400 bg-zinc-800 border-zinc-700')}>
          {st?.label ?? appt.status}
        </span>
      </div>
      <div className="flex items-center gap-1.5 text-xs text-zinc-500">
        <User className="size-3.5" />{appt.member.name}
        <span className="text-zinc-700 mx-1">·</span>
        <Calendar className="size-3.5" />{format(new Date(appt.scheduledAt), 'PPP', { locale: fr })}
        <span className="text-zinc-700 mx-1">·</span>
        <Clock className="size-3.5" />{format(new Date(appt.scheduledAt), 'HH:mm')}
      </div>
      {(appt.coachNote || appt.memberNote) && (
        <div className="mt-2 space-y-1.5">
          {appt.coachNote  && <CoachNoteBlock note={appt.coachNote} />}
          {appt.memberNote && <MemberNoteBlock note={appt.memberNote} />}
        </div>
      )}
    </div>
  )
}
