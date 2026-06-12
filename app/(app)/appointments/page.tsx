'use client'

import { useEffect, useRef, useState } from 'react'
import { Calendar, Clock, ExternalLink, Plus, MessageSquare, ChevronDown, ChevronUp } from 'lucide-react'
import Link from 'next/link'
import { Header } from '@/components/layout/Header'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { ListSkeleton } from '@/components/ui/LoadingSkeleton'
import { cn } from '@/lib/utils'

interface Appointment {
  id:          string
  title:       string
  description: string | null
  scheduledAt: string
  duration:    number
  status:      string
  meetLink:    string | null
  coachNote:   string | null
  memberNote:  string | null
  coachProfile: {
    user: { id: string; name: string | null }
  }
}

const STATUS_STYLE: Record<string, { label: string; color: string }> = {
  PENDING:   { label: 'En attente de votre coach', color: 'text-amber-400  bg-amber-400/10' },
  PROPOSED:  { label: 'Date proposée par le coach', color: 'text-blue-400   bg-blue-400/10' },
  CONFIRMED: { label: 'Confirmé',                   color: 'text-emerald-400 bg-emerald-400/10' },
  COMPLETED: { label: 'Terminé',                    color: 'text-zinc-400    bg-zinc-800' },
  CANCELLED: { label: 'Annulé',                     color: 'text-red-400     bg-red-400/10' },
  NO_SHOW:   { label: 'Absent',                     color: 'text-red-400     bg-red-400/10' },
}

function targetAppointmentIdFromUrl() {
  if (typeof window === 'undefined') return null
  return new URLSearchParams(window.location.search).get('id')
}

/** Member appointments page: fetches and displays upcoming and past appointments, with inline note editing. */
export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading]           = useState(true)
  const [now, setNow]                   = useState<Date | null>(null)
  const [targetAppointmentId]            = useState(() => targetAppointmentIdFromUrl())
  const appointmentRefs = useRef<Record<string, HTMLDivElement | null>>({})

  const fetchAppointments = () => {
    setNow(new Date())
    return fetch('/api/user/appointments')
      .then(r => r.ok ? r.json() as Promise<Appointment[]> : [])
      .then(data => { setAppointments(data); setLoading(false) })
      .catch(() => setLoading(false))
  }

  useEffect(() => { fetchAppointments() }, [])

  useEffect(() => {
    if (!targetAppointmentId || loading) return
    window.setTimeout(() => {
      appointmentRefs.current[targetAppointmentId]?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 80)
  }, [loading, targetAppointmentId, appointments])

  const proposed = appointments.filter(a => a.status === 'PROPOSED')
  const upcoming = now ? appointments.filter(a =>
    new Date(a.scheduledAt) >= now &&
    (a.status === 'PENDING' || a.status === 'CONFIRMED'),
  ) : []
  const past = now ? appointments.filter(a =>
    new Date(a.scheduledAt) < now ||
    a.status === 'COMPLETED' ||
    a.status === 'CANCELLED',
  ) : []

  return (
    <>
      <Header title="Mes rendez-vous" />
      <PageWrapper>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-lg font-bold text-white">Mes rendez-vous</h1>
            <p className="text-xs text-zinc-400 mt-0.5">Suivi de vos séances avec votre coach</p>
          </div>
          <Link
            href="/coaches"
            className="flex items-center gap-1.5 rounded-xl bg-[#C8F135] px-4 py-2 text-xs font-medium text-black hover:bg-[#d4f54d] transition-colors"
          >
            <Plus className="size-3.5" /> Réserver
          </Link>
        </div>

        {loading ? (
          <ListSkeleton rows={3} />
        ) : appointments.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-8">

            {/* Contre-propositions du coach — à voir en priorité */}
            {proposed.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <p className="text-xs font-semibold uppercase tracking-widest text-blue-400">
                    Proposition de votre coach
                  </p>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-400/15 text-blue-400">
                    {proposed.length}
                  </span>
                </div>
                <div className="space-y-3">
                  {proposed.map(appt => (
                    <AppointmentCard
                      key={appt.id}
                      appt={appt}
                      onNoteUpdated={fetchAppointments}
                      selected={appt.id === targetAppointmentId}
                      aptRef={(node) => { appointmentRefs.current[appt.id] = node }}
                      highlight
                    />
                  ))}
                </div>
              </div>
            )}

            {upcoming.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-3">
                  À venir ({upcoming.length})
                </p>
                <div className="space-y-3">
                  {upcoming.map(appt => (
                    <AppointmentCard
                      key={appt.id}
                      appt={appt}
                      onNoteUpdated={fetchAppointments}
                      selected={appt.id === targetAppointmentId}
                      aptRef={(node) => { appointmentRefs.current[appt.id] = node }}
                    />
                  ))}
                </div>
              </div>
            )}

            {past.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-3">
                  Historique ({past.length})
                </p>
                <div className="space-y-3 opacity-60">
                  {past.map(appt => (
                    <AppointmentCard
                      key={appt.id}
                      appt={appt}
                      onNoteUpdated={fetchAppointments}
                      selected={appt.id === targetAppointmentId}
                      aptRef={(node) => { appointmentRefs.current[appt.id] = node }}
                      past
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </PageWrapper>
    </>
  )
}

// ─── Empty state ─────────────────────────────────────────────────────────────

// Renders a CTA to find a coach when no appointments exist.
function EmptyState() {
  return (
    <div className="text-center py-16 space-y-4">
      <div className="flex justify-center">
        <div className="flex size-16 items-center justify-center rounded-2xl bg-zinc-900 border border-zinc-800">
          <Calendar className="size-7 text-zinc-600" />
        </div>
      </div>
      <div>
        <p className="text-white font-semibold">Aucun rendez-vous</p>
        <p className="text-sm text-zinc-400 mt-1">Réservez une séance avec un coach certifié.</p>
      </div>
      <Link
        href="/coaches"
        className="inline-flex items-center gap-2 rounded-xl bg-[#C8F135] px-5 py-2.5 text-sm font-medium text-black hover:bg-[#d4f54d] transition-colors"
      >
        Trouver un coach →
      </Link>
    </div>
  )
}

// Renders an appointment card with status badge, date, meet link, coach notes, and an inline member note editor.
function AppointmentCard({
  appt,
  onNoteUpdated,
  past,
  highlight,
  selected = false,
  aptRef,
}: {
  appt: Appointment
  onNoteUpdated: () => void
  past?: boolean
  highlight?: boolean
  selected?: boolean
  aptRef?: (node: HTMLDivElement | null) => void
}) {
  const st      = STATUS_STYLE[appt.status]
  const date    = new Date(appt.scheduledAt)
  const dayStr  = date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
  const timeStr = date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })

  const [showNote, setShowNote] = useState(false)
  const [note, setNote]         = useState(appt.memberNote ?? '')
  const [saving, setSaving]     = useState(false)

  const saveNote = async () => {
    setSaving(true)
    await fetch(`/api/user/appointments/${appt.id}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ memberNote: note }),
    })
    setSaving(false)
    setShowNote(false)
    onNoteUpdated()
  }

  return (
    <div ref={aptRef} className={cn(
      'rounded-2xl bg-zinc-900 border overflow-hidden transition-colors',
      selected ? 'border-[#C8F135] shadow-[0_0_0_1px_rgba(200,241,53,0.35),0_0_28px_rgba(200,241,53,0.12)]' : highlight ? 'border-blue-400/30' : 'border-zinc-800',
    )}>
      {highlight && (
        <div className="px-4 py-2 bg-blue-500/10 border-b border-blue-400/20 flex items-center gap-2">
          <div className="size-1.5 rounded-full bg-blue-400 animate-pulse" />
          <p className="text-xs font-medium text-blue-400">
            Votre coach a proposé une nouvelle date — ajoutez une note si besoin
          </p>
        </div>
      )}
      {/* Header row */}
      <div className="p-4">
        <div className="flex items-start gap-3 justify-between mb-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white truncate">{appt.title}</p>
            <p className="text-xs text-zinc-500 mt-0.5">{appt.coachProfile.user.name ?? 'Coach'}</p>
          </div>
          <span className={cn('text-[10px] font-semibold px-2.5 py-1 rounded-full shrink-0', st?.color ?? 'text-zinc-400 bg-zinc-800')}>
            {st?.label ?? appt.status}
          </span>
        </div>

        {/* Date / time / duration */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-400">
          <span className="flex items-center gap-1.5 capitalize">
            <Calendar className="size-3.5 shrink-0" />
            {dayStr}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="size-3.5 shrink-0" />
            {timeStr} · {appt.duration} min
          </span>
          {appt.meetLink && !past && (
            <a href={appt.meetLink} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1 text-[#C8F135] hover:underline ml-auto">
              Rejoindre <ExternalLink className="size-3" />
            </a>
          )}
        </div>

        {appt.description && (
          <p className="text-xs text-zinc-600 mt-2">{appt.description}</p>
        )}
      </div>

      {/* Coach note */}
      {appt.coachNote && (
        <div className={cn(
          'mx-4 mb-3 rounded-xl px-3 py-2.5 border',
          highlight
            ? 'bg-blue-500/10 border-blue-400/25'
            : 'bg-[#C8F135]/8 border-[#C8F135]/20',
        )}>
          <p className={cn(
            'text-[10px] font-semibold uppercase tracking-widest mb-1',
            highlight ? 'text-blue-400/80' : 'text-[#C8F135]/70',
          )}>
            Note de votre coach
          </p>
          <p className="text-sm text-zinc-200">{appt.coachNote}</p>
        </div>
      )}

      {/* Member note — show / add (available on PENDING, PROPOSED, CONFIRMED) */}
      {!past && (
        <div className="border-t border-zinc-800/60 px-4 py-3">
          {appt.memberNote && !showNote ? (
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-600 mb-0.5">Votre note</p>
                <p className="text-xs text-zinc-400">{appt.memberNote}</p>
              </div>
              <button onClick={() => { setNote(appt.memberNote ?? ''); setShowNote(true) }}
                className="text-[10px] text-zinc-500 hover:text-[#C8F135] transition-colors shrink-0">
                Modifier
              </button>
            </div>
          ) : !showNote ? (
            <button onClick={() => setShowNote(true)}
              className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-[#C8F135] transition-colors">
              <MessageSquare className="size-3.5" />
              Ajouter une note pour le coach
              <ChevronDown className="size-3" />
            </button>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-zinc-400">Votre note</p>
                <button onClick={() => setShowNote(false)} className="text-zinc-600 hover:text-zinc-400">
                  <ChevronUp className="size-3.5" />
                </button>
              </div>
              <textarea
                value={note}
                onChange={e => setNote(e.target.value)}
                rows={3}
                placeholder="Questions, remarques pour votre coach…"
                className="w-full px-3 py-2 rounded-xl bg-zinc-800 border border-zinc-700 text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-[#C8F135] resize-none"
              />
              <div className="flex gap-2 justify-end">
                <button onClick={() => setShowNote(false)}
                  className="px-3 py-1.5 text-xs rounded-lg bg-zinc-800 text-zinc-400 hover:bg-zinc-700">
                  Annuler
                </button>
                <button onClick={saveNote} disabled={saving}
                  className="px-3 py-1.5 text-xs rounded-lg bg-[#C8F135] text-zinc-900 font-semibold hover:bg-[#d4f54d] disabled:opacity-50">
                  {saving ? 'Enregistrement…' : 'Envoyer'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
