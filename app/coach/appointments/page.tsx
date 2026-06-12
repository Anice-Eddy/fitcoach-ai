'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import {
  Calendar, Clock, User, Plus, Check, X, MessageSquare,
  Edit3, Link2, Send, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Settings2,
} from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

// ─── Types ───────────────────────────────────────────────────────────────────

interface Member { id: string; name: string | null; email: string }

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

interface AvailabilityRule {
  id: string; dayOfWeek: number
  startHour: number; startMinute: number
  endHour: number; endMinute: number
  slotDuration: number
}

type Panel = 'propose' | 'note' | 'edit' | null

// ─── Constants ───────────────────────────────────────────────────────────────

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  PENDING:   { label: 'En attente',    color: 'text-amber-400   bg-amber-400/10  border-amber-400/20' },
  PROPOSED:  { label: 'Date proposée', color: 'text-blue-400    bg-blue-400/10   border-blue-400/20' },
  CONFIRMED: { label: 'Confirmé',      color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20' },
  COMPLETED: { label: 'Terminé',       color: 'text-zinc-400    bg-zinc-800       border-zinc-700' },
  CANCELLED: { label: 'Annulé',        color: 'text-red-400     bg-red-400/10     border-red-400/20' },
  NO_SHOW:   { label: 'Absent',        color: 'text-red-400     bg-red-400/10     border-red-400/20' },
}

const DAY_SHORT = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
const DAY_FULL  = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche']
const HOURS     = Array.from({ length: 14 }, (_, i) => i + 7) // 7h–20h

// ─── Calendar helpers ─────────────────────────────────────────────────────────

function getMonday(date: Date) {
  const d = new Date(date); d.setHours(0, 0, 0, 0)
  const day = d.getDay(); d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day))
  return d
}
function getWeekDays(monday: Date) {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday); d.setDate(d.getDate() + i); return d
  })
}
function isoDay(date: Date) { const d = date.getDay(); return d === 0 ? 7 : d }
function fmtTime(h: number, m: number) {
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}
function fmtShortDate(d: Date) {
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}
function initials(name: string | null, email: string) {
  if (name) {
    const p = name.trim().split(' ')
    return p.length >= 2 ? (p[0][0] + p[1][0]).toUpperCase() : p[0].slice(0, 2).toUpperCase()
  }
  return email.slice(0, 2).toUpperCase()
}
function isHourAvailable(day: Date, hour: number, rules: AvailabilityRule[]) {
  const iso = isoDay(day)
  return rules.some(r =>
    r.dayOfWeek === iso &&
    hour * 60 >= r.startHour * 60 + r.startMinute &&
    (hour + 1) * 60 <= r.endHour * 60 + r.endMinute,
  )
}
function findAvailabilityRuleForHour(day: Date, hour: number, rules: AvailabilityRule[]) {
  const iso = isoDay(day)
  const start = hour * 60
  const end = (hour + 1) * 60
  return rules.find(r =>
    r.dayOfWeek === iso &&
    start >= r.startHour * 60 + r.startMinute &&
    end <= r.endHour * 60 + r.endMinute,
  )
}
function availabilityCellKey(day: Date, hour: number) {
  return `${day.toISOString().slice(0, 10)}-${hour}`
}
function targetAppointmentIdFromUrl() {
  if (typeof window === 'undefined') return null
  return new URLSearchParams(window.location.search).get('id')
}

// ─── Shared sub-components ────────────────────────────────────────────────────

function DateRow({ scheduledAt, duration }: { scheduledAt: string; duration: number }) {
  return (
    <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-400">
      <span className="flex items-center gap-1"><Calendar className="size-3" />{format(new Date(scheduledAt), 'PPP', { locale: fr })}</span>
      <span className="flex items-center gap-1"><Clock className="size-3" />{format(new Date(scheduledAt), 'HH:mm')} · {duration} min</span>
    </div>
  )
}
function MemberNoteBlock({ note }: { note: string }) {
  return (
    <div className="rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500 mb-0.5">Note du membre</p>
      <p className="text-xs text-zinc-300">{note}</p>
    </div>
  )
}
function CoachNoteBlock({ note }: { note: string }) {
  return (
    <div className="rounded-lg bg-zinc-800/60 px-3 py-2">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500 mb-0.5">Votre note</p>
      <p className="text-xs text-zinc-300">{note}</p>
    </div>
  )
}

// ─── Appointment cards ────────────────────────────────────────────────────────

function PendingCard({ appt, onPatch, selected, aptRef }: {
  appt: Appointment; onPatch: (id: string, b: object) => Promise<void>
  selected: boolean; aptRef: React.RefObject<HTMLDivElement>
}) {
  const [panel, setPanel]     = useState<Panel>(null)
  const [newDate, setNewDate] = useState(appt.scheduledAt.slice(0, 16))
  const [newDur,  setNewDur]  = useState(appt.duration)
  const [newMeet, setNewMeet] = useState(appt.meetLink ?? '')
  const [note,    setNote]    = useState(appt.coachNote ?? '')
  const [saving,  setSaving]  = useState(false)
  const save = async (body: object) => { setSaving(true); await onPatch(appt.id, body); setSaving(false); setPanel(null) }

  return (
    <div ref={aptRef} className={cn('rounded-xl border overflow-hidden transition-colors', selected ? 'border-amber-400/60 bg-amber-500/5' : 'border-amber-400/20 bg-zinc-900')}>
      <div className="p-3">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div><p className="text-sm font-semibold text-white">{appt.title}</p>
            {appt.description && <p className="text-xs text-zinc-500 mt-0.5 line-clamp-1">{appt.description}</p>}
          </div>
          <span className="shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full border text-amber-400 bg-amber-400/10 border-amber-400/20">En attente</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-zinc-400 mb-2">
          <User className="size-3" />{appt.member.name ?? appt.member.email}
        </div>
        <DateRow scheduledAt={appt.scheduledAt} duration={appt.duration} />
        {appt.memberNote && <div className="mt-2"><MemberNoteBlock note={appt.memberNote} /></div>}
        <div className="flex flex-wrap gap-1.5 mt-3">
          <button onClick={() => save({ status: 'CONFIRMED' })} disabled={saving}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-500/15 text-emerald-400 text-xs font-semibold hover:bg-emerald-500/25 disabled:opacity-50">
            <Check className="size-3" /> Accepter
          </button>
          <button onClick={() => setPanel(p => p === 'propose' ? null : 'propose')}
            className={cn('flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold', panel === 'propose' ? 'bg-blue-500/15 text-blue-400' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700')}>
            <Send className="size-3" /> Proposer date
          </button>
          <button onClick={() => save({ status: 'CANCELLED' })} disabled={saving}
            className="ml-auto flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-500/10 text-red-400 text-xs font-semibold hover:bg-red-500/20 disabled:opacity-50">
            <X className="size-3" /> Refuser
          </button>
        </div>
      </div>
      {panel === 'propose' && (
        <div className="border-t border-zinc-800 bg-zinc-950 px-3 py-4 space-y-3">
          <p className="text-xs font-semibold text-white">Proposer une date</p>
          <div className="grid grid-cols-2 gap-2">
            <div><label className="block text-[11px] text-zinc-500 mb-1">Date et heure</label>
              <input type="datetime-local" value={newDate} onChange={e => setNewDate(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-xs focus:outline-none focus:border-[#C8F135]" /></div>
            <div><label className="block text-[11px] text-zinc-500 mb-1">Durée (min)</label>
              <input type="number" value={newDur} onChange={e => setNewDur(+e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-xs focus:outline-none focus:border-[#C8F135]" /></div>
            <div className="col-span-2"><label className="block text-[11px] text-zinc-500 mb-1">Lien réunion</label>
              <input type="url" value={newMeet} onChange={e => setNewMeet(e.target.value)} placeholder="https://meet.google.com/…"
                className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-xs placeholder-zinc-600 focus:outline-none focus:border-[#C8F135]" /></div>
            <div className="col-span-2"><label className="block text-[11px] text-zinc-500 mb-1">Note membre</label>
              <textarea value={note} onChange={e => setNote(e.target.value)} rows={2}
                className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-xs placeholder-zinc-600 focus:outline-none focus:border-[#C8F135] resize-none" /></div>
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setPanel(null)} className="px-3 py-1.5 text-xs rounded-lg bg-zinc-800 text-zinc-400 hover:bg-zinc-700">Annuler</button>
            <button disabled={saving || !newDate} onClick={() => save({ status: 'PROPOSED', scheduledAt: newDate, duration: newDur, meetLink: newMeet || null, coachNote: note || null })}
              className="flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg bg-blue-500 text-white font-semibold hover:bg-blue-400 disabled:opacity-50">
              <Send className="size-3" />{saving ? 'Envoi…' : 'Envoyer'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function ProposedCard({ appt, onPatch, selected, aptRef }: {
  appt: Appointment; onPatch: (id: string, b: object) => Promise<void>
  selected: boolean; aptRef: React.RefObject<HTMLDivElement>
}) {
  const [panel, setPanel]     = useState<Panel>(null)
  const [newDate, setNewDate] = useState(appt.scheduledAt.slice(0, 16))
  const [newDur,  setNewDur]  = useState(appt.duration)
  const [newMeet, setNewMeet] = useState(appt.meetLink ?? '')
  const [note,    setNote]    = useState(appt.coachNote ?? '')
  const [saving,  setSaving]  = useState(false)
  const save = async (body: object) => { setSaving(true); await onPatch(appt.id, body); setSaving(false); setPanel(null) }

  return (
    <div ref={aptRef} className={cn('rounded-xl border overflow-hidden transition-colors', selected ? 'border-blue-400/60 bg-blue-500/5' : 'border-blue-400/20 bg-zinc-900')}>
      <div className="p-3">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div><p className="text-sm font-semibold text-white">{appt.title}</p></div>
          <span className="shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full border text-blue-400 bg-blue-400/10 border-blue-400/20">Date proposée</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-zinc-400 mb-2">
          <User className="size-3" />{appt.member.name ?? appt.member.email}
        </div>
        <DateRow scheduledAt={appt.scheduledAt} duration={appt.duration} />
        {appt.meetLink && <a href={appt.meetLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[11px] text-[#C8F135] hover:underline mt-1"><Link2 className="size-3" />Lien réunion</a>}
        {appt.coachNote && <div className="mt-2"><CoachNoteBlock note={appt.coachNote} /></div>}
        {appt.memberNote && <div className="mt-2"><MemberNoteBlock note={appt.memberNote} /></div>}
        <div className="flex flex-wrap gap-1.5 mt-3">
          <button onClick={() => save({ status: 'CONFIRMED' })} disabled={saving}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-500/15 text-emerald-400 text-xs font-semibold hover:bg-emerald-500/25 disabled:opacity-50">
            <Check className="size-3" /> Confirmer
          </button>
          <button onClick={() => setPanel(p => p === 'edit' ? null : 'edit')}
            className={cn('flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold', panel === 'edit' ? 'bg-blue-500/15 text-blue-400' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700')}>
            <Edit3 className="size-3" /> Modifier
          </button>
          <button onClick={() => save({ status: 'CANCELLED' })} disabled={saving}
            className="ml-auto flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-500/10 text-red-400 text-xs font-semibold hover:bg-red-500/20 disabled:opacity-50">
            <X className="size-3" /> Annuler
          </button>
        </div>
      </div>
      {panel === 'edit' && (
        <div className="border-t border-zinc-800 bg-zinc-950 px-3 py-4 space-y-3">
          <p className="text-xs font-semibold text-white">Modifier la proposition</p>
          <div className="grid grid-cols-2 gap-2">
            <div><label className="block text-[11px] text-zinc-500 mb-1">Date et heure</label>
              <input type="datetime-local" value={newDate} onChange={e => setNewDate(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-xs focus:outline-none focus:border-[#C8F135]" /></div>
            <div><label className="block text-[11px] text-zinc-500 mb-1">Durée (min)</label>
              <input type="number" value={newDur} onChange={e => setNewDur(+e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-xs focus:outline-none focus:border-[#C8F135]" /></div>
            <div className="col-span-2"><label className="block text-[11px] text-zinc-500 mb-1">Lien réunion</label>
              <input type="url" value={newMeet} onChange={e => setNewMeet(e.target.value)} placeholder="https://meet.google.com/…"
                className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-xs placeholder-zinc-600 focus:outline-none focus:border-[#C8F135]" /></div>
            <div className="col-span-2"><label className="block text-[11px] text-zinc-500 mb-1">Note membre</label>
              <textarea value={note} onChange={e => setNote(e.target.value)} rows={2}
                className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-xs resize-none focus:outline-none focus:border-[#C8F135]" /></div>
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setPanel(null)} className="px-3 py-1.5 text-xs rounded-lg bg-zinc-800 text-zinc-400 hover:bg-zinc-700">Annuler</button>
            <button disabled={saving} onClick={() => save({ scheduledAt: newDate, duration: newDur, meetLink: newMeet || null, coachNote: note || null })}
              className="flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg bg-blue-500 text-white font-semibold hover:bg-blue-400 disabled:opacity-50">
              <Send className="size-3" />{saving ? 'Envoi…' : 'Renvoyer'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function ConfirmedCard({ appt, onPatch, selected, aptRef }: {
  appt: Appointment; onPatch: (id: string, b: object) => Promise<void>
  selected: boolean; aptRef: React.RefObject<HTMLDivElement>
}) {
  const [panel, setPanel]     = useState<Panel>(null)
  const [note,    setNote]    = useState(appt.coachNote ?? '')
  const [newDate, setNewDate] = useState(appt.scheduledAt.slice(0, 16))
  const [newDur,  setNewDur]  = useState(appt.duration)
  const [newMeet, setNewMeet] = useState(appt.meetLink ?? '')
  const [saving,  setSaving]  = useState(false)
  const save = async (body: object) => { setSaving(true); await onPatch(appt.id, body); setSaving(false); setPanel(null) }

  return (
    <div ref={aptRef} className={cn('rounded-xl border overflow-hidden transition-colors', selected ? 'border-[#C8F135]/60 bg-[#C8F135]/5' : 'border-zinc-800 bg-zinc-900')}>
      <div className="p-3">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div><p className="text-sm font-semibold text-white">{appt.title}</p>
            {appt.description && <p className="text-xs text-zinc-500 mt-0.5 line-clamp-1">{appt.description}</p>}
          </div>
          <span className="shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full border text-emerald-400 bg-emerald-400/10 border-emerald-400/20">Confirmé</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-zinc-400 mb-2">
          <User className="size-3" />{appt.member.name ?? appt.member.email}
        </div>
        <DateRow scheduledAt={appt.scheduledAt} duration={appt.duration} />
        {appt.meetLink && <a href={appt.meetLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[11px] text-[#C8F135] hover:underline mt-1"><Link2 className="size-3" />Rejoindre</a>}
        {(appt.coachNote || appt.memberNote) && (
          <div className="mt-2 space-y-1.5">
            {appt.coachNote  && <CoachNoteBlock note={appt.coachNote} />}
            {appt.memberNote && <MemberNoteBlock note={appt.memberNote} />}
          </div>
        )}
        <div className="flex flex-wrap gap-1.5 mt-3">
          <button onClick={() => setPanel(p => p === 'edit' ? null : 'edit')}
            className={cn('flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium', panel === 'edit' ? 'bg-[#C8F135]/15 text-[#C8F135]' : 'bg-zinc-800 text-zinc-400 hover:text-white')}>
            <Edit3 className="size-3" /> Modifier
          </button>
          <button onClick={() => setPanel(p => p === 'note' ? null : 'note')}
            className={cn('flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium', panel === 'note' ? 'bg-[#C8F135]/15 text-[#C8F135]' : 'bg-zinc-800 text-zinc-400 hover:text-white')}>
            <MessageSquare className="size-3" />{appt.coachNote ? 'Modifier note' : 'Note'}
          </button>
          <button onClick={() => save({ status: 'COMPLETED' })} disabled={saving}
            className="ml-auto flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-zinc-800 text-zinc-400 text-xs font-medium hover:text-white disabled:opacity-50">
            <Check className="size-3" /> Terminé
          </button>
        </div>
      </div>
      {panel === 'edit' && (
        <div className="border-t border-zinc-800 bg-zinc-950 px-3 py-3 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div><label className="block text-[11px] text-zinc-500 mb-1">Date et heure</label>
              <input type="datetime-local" value={newDate} onChange={e => setNewDate(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-xs focus:outline-none focus:border-[#C8F135]" /></div>
            <div><label className="block text-[11px] text-zinc-500 mb-1">Durée (min)</label>
              <input type="number" value={newDur} onChange={e => setNewDur(+e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-xs focus:outline-none focus:border-[#C8F135]" /></div>
            <div className="col-span-2"><label className="block text-[11px] text-zinc-500 mb-1">Lien réunion</label>
              <input type="url" value={newMeet} onChange={e => setNewMeet(e.target.value)} placeholder="https://meet.google.com/…"
                className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-xs placeholder-zinc-600 focus:outline-none focus:border-[#C8F135]" /></div>
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
        <div className="border-t border-zinc-800 bg-zinc-950 px-3 py-3 space-y-2">
          <textarea value={note} onChange={e => setNote(e.target.value)} rows={3}
            placeholder="Consignes, objectifs, préparation…"
            className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-xs placeholder-zinc-600 focus:outline-none focus:border-[#C8F135] resize-none" />
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

function HistoryCard({ appt, selected, aptRef }: {
  appt: Appointment; selected: boolean; aptRef: React.RefObject<HTMLDivElement>
}) {
  const st = STATUS_LABEL[appt.status]
  return (
    <div ref={aptRef} className={cn('rounded-xl border p-3 opacity-60 transition-opacity hover:opacity-90', selected ? 'border-zinc-600 opacity-90' : 'border-zinc-800/60 bg-zinc-900/50')}>
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <p className="text-xs font-medium text-zinc-300">{appt.title}</p>
        <span className={cn('shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full border', st?.color ?? 'text-zinc-400 bg-zinc-800 border-zinc-700')}>
          {st?.label ?? appt.status}
        </span>
      </div>
      <div className="flex items-center gap-1.5 text-xs text-zinc-500">
        <User className="size-3" />{appt.member.name ?? appt.member.email}
        <span className="text-zinc-700 mx-1">·</span>
        {format(new Date(appt.scheduledAt), 'PPP', { locale: fr })}
        <span className="text-zinc-700 mx-1">·</span>
        {format(new Date(appt.scheduledAt), 'HH:mm')}
      </div>
    </div>
  )
}

// ─── New appointment form ─────────────────────────────────────────────────────

function NewAptForm({ members, onCreated, onClose, prefill }: {
  members: Member[]; onCreated: () => void; onClose: () => void
  prefill?: { scheduledAt: string }
}) {
  const [form, setForm]     = useState({ memberId: '', title: '', description: '', scheduledAt: prefill?.scheduledAt ?? '', duration: 60, meetLink: '' })
  const [creating, setCreating] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setCreating(true)
    const res = await fetch('/api/coach/appointments', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
    })
    if (res.ok) { onCreated(); onClose() }
    setCreating(false)
  }

  const inp = 'w-full px-2.5 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-xs placeholder-zinc-600 focus:outline-none focus:border-[#C8F135]'
  const lbl = 'block text-[11px] text-zinc-500 mb-1'

  return (
    <form onSubmit={submit} className="border-b border-zinc-800 bg-zinc-950 px-4 py-4 space-y-3">
      <div className="flex items-center justify-between mb-1">
        <p className="text-sm font-semibold text-white">Nouveau rendez-vous</p>
        <button type="button" onClick={onClose} className="text-zinc-500 hover:text-white"><X className="size-4" /></button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="col-span-2">
          <label className={lbl}>Membre</label>
          <select value={form.memberId} onChange={e => setForm(f => ({ ...f, memberId: e.target.value }))} required className={inp}>
            <option value="">Sélectionner…</option>
            {members.map(m => <option key={m.id} value={m.id}>{m.name ?? m.email}</option>)}
          </select>
        </div>
        <div className="col-span-2">
          <label className={lbl}>Titre</label>
          <input type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required placeholder="Ex: Bilan mensuel" className={inp} />
        </div>
        <div>
          <label className={lbl}>Date et heure</label>
          <input type="datetime-local" value={form.scheduledAt} onChange={e => setForm(f => ({ ...f, scheduledAt: e.target.value }))} required className={inp} />
        </div>
        <div>
          <label className={lbl}>Durée (min)</label>
          <input type="number" value={form.duration} onChange={e => setForm(f => ({ ...f, duration: +e.target.value }))} className={inp} />
        </div>
        <div className="col-span-2">
          <label className={lbl}>Lien réunion</label>
          <input type="url" value={form.meetLink} onChange={e => setForm(f => ({ ...f, meetLink: e.target.value }))} placeholder="https://meet.google.com/…" className={inp} />
        </div>
      </div>
      <div className="flex gap-2 justify-end">
        <button type="button" onClick={onClose} className="px-3 py-1.5 text-xs rounded-lg bg-zinc-800 text-zinc-400 hover:bg-zinc-700">Annuler</button>
        <button type="submit" disabled={creating} className="px-3 py-1.5 text-xs rounded-lg bg-[#C8F135] text-zinc-900 font-semibold hover:bg-[#d4f54d] disabled:opacity-50">
          {creating ? 'Création…' : 'Créer'}
        </button>
      </div>
    </form>
  )
}

// ─── Availability panel ───────────────────────────────────────────────────────

function AvailabilityPanel({ rules, onRefresh }: { rules: AvailabilityRule[]; onRefresh: () => void }) {
  const [form, setForm]   = useState({ dayOfWeek: 1, startHour: 9, startMinute: 0, endHour: 18, endMinute: 0, slotDuration: 60 })
  const [adding, setAdding]   = useState(false)
  const [saving, setSaving]   = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  const save = async () => {
    setSaving(true)
    await fetch('/api/coach/availability', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    setSaving(false); setAdding(false); onRefresh()
  }
  const del = async (id: string) => {
    setDeleting(id)
    await fetch(`/api/coach/availability/${id}`, { method: 'DELETE' })
    setDeleting(null); onRefresh()
  }

  const sel = 'px-2 py-1.5 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-xs focus:outline-none focus:border-[#C8F135]'

  return (
    <div className="px-4 pb-4 pt-3 space-y-3">
      {rules.length === 0 && !adding ? (
        <p className="text-xs text-zinc-500">Aucune disponibilité. Ajoutez des créneaux pour que vos membres puissent réserver.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {rules.map(r => (
            <div key={r.id} className="flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800/50 px-2.5 py-1.5 text-xs">
              <span className="font-medium text-white">{DAY_SHORT[r.dayOfWeek - 1]}</span>
              <span className="text-zinc-400">{fmtTime(r.startHour, r.startMinute)}–{fmtTime(r.endHour, r.endMinute)}</span>
              <span className="text-zinc-600">·{r.slotDuration}min</span>
              <button onClick={() => del(r.id)} disabled={deleting === r.id} className="text-zinc-600 hover:text-red-400 ml-1 disabled:opacity-40">
                <X className="size-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {adding ? (
        <div className="rounded-lg border border-zinc-700 bg-zinc-800/40 p-3 space-y-2">
          <div className="grid grid-cols-3 gap-2">
            <div><label className="block text-[10px] text-zinc-500 mb-1">Jour</label>
              <select className={sel} value={form.dayOfWeek} onChange={e => setForm(f => ({ ...f, dayOfWeek: +e.target.value }))}>
                {DAY_FULL.map((n, i) => <option key={i + 1} value={i + 1}>{n}</option>)}
              </select></div>
            <div><label className="block text-[10px] text-zinc-500 mb-1">Début</label>
              <select className={sel} value={form.startHour * 60 + form.startMinute}
                onChange={e => { const v = +e.target.value; setForm(f => ({ ...f, startHour: Math.floor(v / 60), startMinute: v % 60 })) }}>
                {Array.from({ length: 28 }, (_, i) => { const h = Math.floor(i / 2) + 7, m = (i % 2) * 30; return <option key={i} value={h * 60 + m}>{fmtTime(h, m)}</option> })}
              </select></div>
            <div><label className="block text-[10px] text-zinc-500 mb-1">Fin</label>
              <select className={sel} value={form.endHour * 60 + form.endMinute}
                onChange={e => { const v = +e.target.value; setForm(f => ({ ...f, endHour: Math.floor(v / 60), endMinute: v % 60 })) }}>
                {Array.from({ length: 28 }, (_, i) => { const h = Math.floor(i / 2) + 7, m = (i % 2) * 30; return <option key={i} value={h * 60 + m}>{fmtTime(h, m)}</option> })}
              </select></div>
          </div>
          <div><label className="block text-[10px] text-zinc-500 mb-1">Durée créneau</label>
            <select className={sel} value={form.slotDuration} onChange={e => setForm(f => ({ ...f, slotDuration: +e.target.value }))}>
              {[30, 45, 60, 90, 120].map(v => <option key={v} value={v}>{v} min</option>)}
            </select></div>
          <div className="flex gap-2 justify-end pt-1">
            <button onClick={() => setAdding(false)} className="px-2.5 py-1.5 text-xs rounded-lg bg-zinc-700 text-zinc-300 hover:bg-zinc-600">Annuler</button>
            <button onClick={save} disabled={saving} className="px-2.5 py-1.5 text-xs rounded-lg bg-[#C8F135] text-zinc-900 font-semibold hover:bg-[#d4f54d] disabled:opacity-50">
              {saving ? '…' : 'Ajouter'}
            </button>
          </div>
        </div>
      ) : (
        <button onClick={() => setAdding(true)}
          className="flex items-center gap-1 text-xs text-zinc-500 hover:text-[#C8F135] transition-colors">
          <Plus className="size-3" /> Ajouter un créneau
        </button>
      )}
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

/** Merged agenda page: weekly calendar grid on the left with availability management, full appointment list on the right. Clicking a calendar cell highlights the matching appointment. */
export default function AgendaPage() {
  const [monday,       setMonday]       = useState<Date>(() => getMonday(new Date()))
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [rules,        setRules]        = useState<AvailabilityRule[]>([])
  const [members,      setMembers]      = useState<Member[]>([])
  const [loading,      setLoading]      = useState(true)
  const [showNew,      setShowNew]      = useState(false)
  const [prefillDate,  setPrefillDate]  = useState<string | undefined>()
  const [selectedId,   setSelectedId]   = useState<string | null>(() => targetAppointmentIdFromUrl())
  const [targetAppointmentId]           = useState(() => targetAppointmentIdFromUrl())
  const [showAvail,    setShowAvail]    = useState(false)
  const [addingAvailability, setAddingAvailability] = useState<string | null>(null)
  const aptRefs = useRef<Record<string, React.RefObject<HTMLDivElement>>>({})
  const listRef = useRef<HTMLDivElement>(null)

  const days = getWeekDays(monday)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    const res  = await fetch('/api/coach/appointments')
    const data = await res.json()
    setAppointments(Array.isArray(data) ? data : [])
    setLoading(false)
  }, [])

  const fetchRules = useCallback(async () => {
    const res = await fetch('/api/coach/availability')
    if (res.ok) setRules(await res.json())
  }, [])

  const fetchMembers = useCallback(async () => {
    const res  = await fetch('/api/coach/members')
    const data = res.ok ? await res.json() : []
    setMembers(Array.isArray(data) ? data.map((m: { member: Member }) => m.member) : [])
  }, [])

  useEffect(() => { fetchAll(); fetchRules(); fetchMembers() }, [fetchAll, fetchRules, fetchMembers])

  useEffect(() => {
    if (!targetAppointmentId || loading || !appointments.some((appt) => appt.id === targetAppointmentId)) return
    window.setTimeout(() => selectApt(targetAppointmentId), 80)
  }, [appointments, loading, targetAppointmentId])

  const patch = async (id: string, body: object) => {
    await fetch(`/api/coach/appointments/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    await fetchAll()
  }

  // Ensure each appointment has a stable ref
  appointments.forEach(a => { if (!aptRefs.current[a.id]) aptRefs.current[a.id] = { current: null } as React.RefObject<HTMLDivElement> })

  const selectApt = (id: string) => {
    setSelectedId(id)
    const ref = aptRefs.current[id]
    if (ref?.current && listRef.current) {
      ref.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }

  const addAvailabilityFromCalendar = async (day: Date, hour: number) => {
    const key = availabilityCellKey(day, hour)
    setAddingAvailability(key)
    try {
      // A calendar click creates a simple one-hour weekly availability rule.
      const res = await fetch('/api/coach/availability', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          dayOfWeek:    isoDay(day),
          startHour:    hour,
          startMinute:  0,
          endHour:      hour + 1,
          endMinute:    0,
          slotDuration: 60,
        }),
      })
      if (!res.ok) throw new Error('availability')
      await fetchRules()
      toast.success(`Disponibilité ajoutée ${DAY_FULL[isoDay(day) - 1]} à ${fmtTime(hour, 0)}`)
    } catch {
      toast.error("Impossible d'ajouter cette disponibilité")
    } finally {
      setAddingAvailability(null)
    }
  }

  const saveAvailabilityRule = async (rule: Omit<AvailabilityRule, 'id'>) => {
    return fetch('/api/coach/availability', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(rule),
    })
  }

  const removeAvailabilityFromCalendar = async (day: Date, hour: number) => {
    const key = availabilityCellKey(day, hour)
    const rule = findAvailabilityRuleForHour(day, hour, rules)
    if (!rule) return

    setAddingAvailability(key)
    try {
      // If the clicked hour is inside a larger rule, delete the original and
      // recreate the remaining parts around the removed hour.
      const removedStart = hour * 60
      const removedEnd = (hour + 1) * 60
      const ruleStart = rule.startHour * 60 + rule.startMinute
      const ruleEnd = rule.endHour * 60 + rule.endMinute

      const del = await fetch(`/api/coach/availability/${rule.id}`, { method: 'DELETE' })
      if (!del.ok) throw new Error('delete-availability')

      const remainingRules: Omit<AvailabilityRule, 'id'>[] = []
      if (ruleStart < removedStart) {
        remainingRules.push({
          dayOfWeek:    rule.dayOfWeek,
          startHour:    rule.startHour,
          startMinute:  rule.startMinute,
          endHour:      Math.floor(removedStart / 60),
          endMinute:    removedStart % 60,
          slotDuration: rule.slotDuration,
        })
      }
      if (removedEnd < ruleEnd) {
        remainingRules.push({
          dayOfWeek:    rule.dayOfWeek,
          startHour:    Math.floor(removedEnd / 60),
          startMinute:  removedEnd % 60,
          endHour:      rule.endHour,
          endMinute:    rule.endMinute,
          slotDuration: rule.slotDuration,
        })
      }

      for (const remaining of remainingRules) {
        const res = await saveAvailabilityRule(remaining)
        if (!res.ok) throw new Error('restore-availability')
      }

      await fetchRules()
      toast.success(`Disponibilité retirée ${DAY_FULL[isoDay(day) - 1]} à ${fmtTime(hour, 0)}`)
    } catch {
      toast.error("Impossible de retirer cette disponibilité")
      await fetchRules()
    } finally {
      setAddingAvailability(null)
    }
  }

  const pending  = appointments.filter(a => a.status === 'PENDING')
  const proposed = appointments.filter(a => a.status === 'PROPOSED')
  const upcoming = appointments.filter(a => a.status === 'CONFIRMED' && new Date(a.scheduledAt) > new Date())
  const history  = appointments.filter(a =>
    ['COMPLETED', 'CANCELLED', 'NO_SHOW'].includes(a.status) ||
    (a.status === 'CONFIRMED' && new Date(a.scheduledAt) <= new Date()),
  )

  const todayStr = new Date().toDateString()
  const weekLabel = `${fmtShortDate(days[0])} – ${fmtShortDate(days[6])} ${days[6].getFullYear()}`

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden -m-6">

      {/* ── LEFT: Calendar ───────────────────────────────────────── */}
      <div className="flex flex-col border-r border-zinc-800 overflow-hidden" style={{ width: '62%' }}>

        {/* Week nav */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-800 shrink-0">
          <h1 className="text-base font-bold text-white">Agenda</h1>
          <div className="flex items-center gap-2">
            <button onClick={() => setMonday(d => { const n = new Date(d); n.setDate(n.getDate() - 7); return n })}
              className="rounded-lg border border-zinc-700 p-1.5 text-zinc-400 hover:text-white transition-colors">
              <ChevronLeft className="size-3.5" />
            </button>
            <span className="text-xs text-zinc-300 min-w-40 text-center">{weekLabel}</span>
            <button onClick={() => setMonday(d => { const n = new Date(d); n.setDate(n.getDate() + 7); return n })}
              className="rounded-lg border border-zinc-700 p-1.5 text-zinc-400 hover:text-white transition-colors">
              <ChevronRight className="size-3.5" />
            </button>
          </div>
        </div>

        {/* Availability accordion */}
        <div className="border-b border-zinc-800 shrink-0 bg-zinc-950">
          <button
            onClick={() => setShowAvail(v => !v)}
            className="flex w-full items-center justify-between px-4 py-2.5 text-xs font-medium text-zinc-300 hover:text-white transition-colors"
          >
            <span className="flex items-center gap-1.5"><Settings2 className="size-3.5 text-[#C8F135]" /> Disponibilités hebdomadaires</span>
            {showAvail ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
          </button>
          {showAvail && <AvailabilityPanel rules={rules} onRefresh={fetchRules} />}
        </div>

        {/* Calendar grid */}
        <div className="flex-1 overflow-y-auto">
          <table className="w-full border-collapse text-xs">
            <thead className="sticky top-0 z-10 bg-zinc-950">
              <tr className="border-b border-zinc-800">
                <th className="w-10 py-2.5 text-zinc-600 font-normal" />
                {days.map((day, i) => (
                  <th key={i} className={cn('py-2.5 px-1 font-medium text-center border-l border-zinc-800', day.toDateString() === todayStr ? 'text-[#C8F135]' : 'text-zinc-400')}>
                    <span className="text-[10px] block">{DAY_SHORT[i]}</span>
                    <span className={cn('mt-0.5 flex size-5 items-center justify-center rounded-full text-xs font-bold mx-auto', day.toDateString() === todayStr ? 'bg-[#C8F135] text-zinc-950' : '')}>
                      {day.getDate()}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {HOURS.map(hour => (
                <tr key={hour} className="border-b border-zinc-800/40">
                  <td className="py-0 pr-2 text-right text-[10px] text-zinc-600 font-mono align-top pt-1.5 w-10">
                    {fmtTime(hour, 0)}
                  </td>
                  {days.map((day, di) => {
                    const avail = isHourAvailable(day, hour, rules)
                    const cellKey = availabilityCellKey(day, hour)
                    const apt   = appointments.find(a => {
                      const d = new Date(a.scheduledAt)
                      return d.toDateString() === day.toDateString() && d.getHours() === hour
                    })
                    return (
                      <td key={di}
                        onClick={() => apt ? selectApt(apt.id) : avail ? removeAvailabilityFromCalendar(day, hour) : addAvailabilityFromCalendar(day, hour)}
                        aria-label={apt ? 'Voir le rendez-vous' : avail ? 'Retirer cette disponibilité' : 'Ajouter une disponibilité'}
                        className={cn(
                          'group border-l border-zinc-800/40 h-10 px-0.5 py-0.5 align-top cursor-pointer',
                          avail && !apt ? 'bg-[#C8F135]/5 cursor-pointer hover:bg-red-500/10' : '',
                          !avail && !apt ? 'hover:bg-[#C8F135]/5' : '',
                          apt ? 'cursor-pointer' : '',
                          addingAvailability === cellKey ? 'bg-[#C8F135]/10 opacity-70' : '',
                        )}
                      >
                        {apt ? (
                          <div className={cn(
                            'rounded border px-1 py-0.5 text-[9px] leading-tight h-full',
                            selectedId === apt.id ? 'ring-1 ring-white/30' : '',
                            apt.status === 'CONFIRMED' ? 'bg-[#C8F135]/20 border-[#C8F135]/40 text-[#C8F135]' :
                            apt.status === 'PENDING'   ? 'bg-amber-500/20 border-amber-500/40 text-amber-300' :
                            apt.status === 'PROPOSED'  ? 'bg-blue-500/20 border-blue-500/40 text-blue-300' :
                            'bg-zinc-700 border-zinc-600 text-zinc-400',
                          )}>
                            <span className="font-bold block truncate">{initials(apt.member.name, apt.member.email)}</span>
                            <span className="opacity-70 truncate block">{apt.title.slice(0, 12)}</span>
                          </div>
                        ) : avail ? (
                          <div className="flex h-full items-center justify-center rounded border border-dashed border-[#C8F135]/15 text-[10px] text-red-300/0 transition-colors group-hover:border-red-400/30 group-hover:text-red-300/80">
                            {addingAvailability === cellKey ? '...' : '×'}
                          </div>
                        ) : (
                          <div className="flex h-full items-center justify-center rounded border border-transparent text-[10px] text-[#C8F135]/0 transition-colors group-hover:border-[#C8F135]/20 group-hover:text-[#C8F135]/70">
                            {addingAvailability === cellKey ? '...' : '+'}
                          </div>
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>

      {/* ── RIGHT: Appointments list ──────────────────────────────── */}
      <div className="flex flex-col overflow-hidden" style={{ width: '38%' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 shrink-0">
          <p className="text-sm font-semibold text-white">Rendez-vous</p>
          <button
            onClick={() => { setPrefillDate(undefined); setShowNew(v => !v) }}
            className="flex items-center gap-1.5 rounded-lg bg-[#C8F135] px-3 py-1.5 text-xs font-semibold text-zinc-950 hover:bg-[#d4f54d] transition-colors"
          >
            <Plus className="size-3.5" /> Nouveau
          </button>
        </div>

        {/* New apt form */}
        {showNew && (
          <NewAptForm
            members={members}
            prefill={prefillDate ? { scheduledAt: prefillDate } : undefined}
            onCreated={fetchAll}
            onClose={() => setShowNew(false)}
          />
        )}

        {/* List */}
        <div ref={listRef} className="flex-1 overflow-y-auto px-3 py-3 space-y-5">
          {loading ? (
            <p className="text-xs text-zinc-500 text-center py-8">Chargement…</p>
          ) : (
            <>
              {pending.length > 0 && (
                <section>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-amber-400 mb-2 flex items-center gap-2">
                    En attente <span className="rounded-full bg-amber-400/15 px-1.5 py-0.5">{pending.length}</span>
                  </p>
                  <div className="space-y-2">
                    {pending.map(a => <PendingCard key={a.id} appt={a} onPatch={patch} selected={selectedId === a.id} aptRef={aptRefs.current[a.id]!} />)}
                  </div>
                </section>
              )}

              {proposed.length > 0 && (
                <section>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-blue-400 mb-2 flex items-center gap-2">
                    Proposé <span className="rounded-full bg-blue-400/15 px-1.5 py-0.5">{proposed.length}</span>
                  </p>
                  <div className="space-y-2">
                    {proposed.map(a => <ProposedCard key={a.id} appt={a} onPatch={patch} selected={selectedId === a.id} aptRef={aptRefs.current[a.id]!} />)}
                  </div>
                </section>
              )}

              <section>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 mb-2 flex items-center gap-2">
                  À venir <span className="rounded-full bg-zinc-800 px-1.5 py-0.5 text-zinc-400">{upcoming.length}</span>
                </p>
                {upcoming.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-zinc-800 py-5 text-center text-xs text-zinc-600">Aucun rendez-vous confirmé</div>
                ) : (
                  <div className="space-y-2">
                    {upcoming.map(a => <ConfirmedCard key={a.id} appt={a} onPatch={patch} selected={selectedId === a.id} aptRef={aptRefs.current[a.id]!} />)}
                  </div>
                )}
              </section>

              {history.length > 0 && (
                <section>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-600 mb-2 flex items-center gap-2">
                    Historique <span className="rounded-full bg-zinc-800 px-1.5 py-0.5">{history.length}</span>
                  </p>
                  <div className="space-y-1.5">
                    {history.map(a => <HistoryCard key={a.id} appt={a} selected={selectedId === a.id} aptRef={aptRefs.current[a.id]!} />)}
                  </div>
                </section>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
