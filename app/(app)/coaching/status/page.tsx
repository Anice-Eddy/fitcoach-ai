'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Calendar, CheckCircle, Clock, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { ListSkeleton } from '@/components/ui/LoadingSkeleton'

interface Appointment {
  id: string
  title: string
  scheduledAt: string
  duration: number
  status: string
  meetLink?: string | null
  description?: string | null
  coachProfile: {
    user: { id: string; name: string | null; image: string | null }
  }
}

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  PENDING:    { label: 'En attente',         color: 'text-amber-400 bg-amber-400/10' },
  CONFIRMED:  { label: 'Confirmé',           color: 'text-emerald-400 bg-emerald-400/10' },
  COMPLETED:  { label: 'Terminé',            color: 'text-zinc-400 bg-zinc-800' },
  CANCELLED:  { label: 'Annulé',             color: 'text-red-400 bg-red-400/10' },
  NO_SHOW:    { label: 'Absent',             color: 'text-red-400 bg-red-400/10' },
}

function addToGoogle(appt: Appointment) {
  const start = new Date(appt.scheduledAt)
  const end   = new Date(start.getTime() + appt.duration * 60000)
  const fmt   = (d: Date) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
  const url   = new URL('https://calendar.google.com/calendar/render')
  url.searchParams.set('action', 'TEMPLATE')
  url.searchParams.set('text',   appt.title)
  url.searchParams.set('dates',  `${fmt(start)}/${fmt(end)}`)
  if (appt.meetLink) url.searchParams.set('location', appt.meetLink)
  window.open(url.toString(), '_blank')
}

function downloadICS(appt: Appointment) {
  const start = new Date(appt.scheduledAt)
  const end   = new Date(start.getTime() + appt.duration * 60000)
  const fmt   = (d: Date) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
  const ics   = [
    'BEGIN:VCALENDAR', 'VERSION:2.0',
    'BEGIN:VEVENT',
    `DTSTART:${fmt(start)}`, `DTEND:${fmt(end)}`,
    `SUMMARY:${appt.title}`,
    `DESCRIPTION:${appt.description ?? 'BodyOps Coaching'}`,
    appt.meetLink ? `LOCATION:${appt.meetLink}` : '',
    'END:VEVENT', 'END:VCALENDAR',
  ].filter(Boolean).join('\r\n')
  const a = Object.assign(document.createElement('a'), {
    href:     URL.createObjectURL(new Blob([ics], { type: 'text/calendar' })),
    download: 'coaching.ics',
  })
  a.click()
}

export default function CoachingStatusPage() {
  const router = useRouter()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading]           = useState(true)

  useEffect(() => {
    fetch('/api/user/appointments')
      .then(r => r.ok ? r.json() as Promise<Appointment[]> : [])
      .then(data => { setAppointments(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const upcoming = appointments.filter(a => new Date(a.scheduledAt) >= new Date() && a.status !== 'CANCELLED')
  const past     = appointments.filter(a => new Date(a.scheduledAt) < new Date() || a.status === 'COMPLETED')

  if (loading) {
    return (
      <div className="min-h-screen bg-black px-4 py-12 text-white">
        <section className="mx-auto max-w-2xl"><ListSkeleton rows={3} /></section>
      </div>
    )
  }

  if (appointments.length === 0) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center space-y-6 max-w-sm px-4">
          <div className="flex justify-center">
            <div className="flex size-20 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900">
              <Calendar className="size-8 text-zinc-500" />
            </div>
          </div>
          <h1 className="text-2xl font-medium">Aucun rendez-vous</h1>
          <p className="text-zinc-400 text-sm">Tu n&apos;as pas encore de rendez-vous planifié.</p>
          <Link
            href="/coaches"
            className="inline-flex items-center gap-2 rounded-xl bg-[#C8F135] px-6 py-3 text-sm font-medium text-black hover:bg-[#d4f54d] transition-colors"
          >
            Trouver un coach →
          </Link>
        </div>
      </div>
    )
  }

  // Show most recent upcoming appointment prominently
  const next = upcoming[0]

  return (
    <div className="min-h-screen bg-black px-4 py-12 text-white">
      <section className="mx-auto flex min-h-[500px] max-w-2xl flex-col gap-8 rounded-lg bg-[#0b0d09] px-6 py-10">

        {next && (
          <>
            <div className="flex justify-center">
              <div className="flex size-20 items-center justify-center rounded-full border border-[#C8F135]/45 bg-[#C8F135]/10">
                <CheckCircle className="size-8 text-[#C8F135]" />
              </div>
            </div>

            <div className="text-center space-y-2">
              <h1 className="text-2xl font-medium">
                {next.status === 'PENDING' ? 'Demande envoyée !' : 'Rendez-vous confirmé'}
              </h1>
              <p className="text-zinc-400 text-sm">
                {next.status === 'PENDING'
                  ? `${next.coachProfile.user.name ?? 'Votre coach'} a reçu ta demande et confirmera sous 48h.`
                  : `Ton rendez-vous avec ${next.coachProfile.user.name ?? 'ton coach'} est confirmé.`}
              </p>
            </div>

            <div className="overflow-hidden rounded-xl border border-zinc-700 bg-[#1a1d17]">
              {[
                { label: 'Coach',  value: next.coachProfile.user.name ?? '—' },
                { label: 'Séance', value: next.title },
                { label: 'Date',   value: new Date(next.scheduledAt).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }) },
                { label: 'Heure',  value: new Date(next.scheduledAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) },
                { label: 'Durée',  value: `${next.duration} min` },
                { label: 'Statut', value: STATUS_LABEL[next.status]?.label ?? next.status, colorClass: STATUS_LABEL[next.status]?.color },
              ].map(r => (
                <div key={r.label} className="flex items-center justify-between px-6 py-2.5 border-b border-zinc-800 last:border-0">
                  <span className="text-sm text-zinc-500 w-20 shrink-0">{r.label}</span>
                  {r.colorClass ? (
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${r.colorClass}`}>{r.value}</span>
                  ) : (
                    <span className="text-sm font-medium text-white flex-1 text-right">{r.value}</span>
                  )}
                </div>
              ))}
              {next.meetLink && (
                <div className="flex items-center justify-between px-6 py-2.5">
                  <span className="text-sm text-zinc-500 w-20 shrink-0">Lien</span>
                  <a href={next.meetLink} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1 text-sm text-[#C8F135] hover:underline">
                    Rejoindre <ExternalLink className="size-3" />
                  </a>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button type="button" onClick={() => addToGoogle(next)}
                className="flex items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-[#1a1d17] py-3 text-xs text-zinc-400 hover:border-zinc-600 hover:text-white transition-colors">
                <Calendar className="size-4" /> Google Calendar
              </button>
              <button type="button" onClick={() => downloadICS(next)}
                className="flex items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-[#1a1d17] py-3 text-xs text-zinc-400 hover:border-zinc-600 hover:text-white transition-colors">
                <Calendar className="size-4" /> Apple / .ics
              </button>
            </div>
          </>
        )}

        {/* Past or all appointments list */}
        {appointments.length > 1 && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-3">
              Tous les rendez-vous ({appointments.length})
            </p>
            <div className="space-y-2">
              {appointments.map(appt => {
                const isPast = new Date(appt.scheduledAt) < new Date()
                const st = STATUS_LABEL[appt.status]
                return (
                  <div key={appt.id} className={`flex items-center gap-3 rounded-xl border border-zinc-800 bg-[#1a1d17] p-3 ${isPast ? 'opacity-60' : ''}`}>
                    <Clock className="size-4 text-zinc-500 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white font-medium truncate">{appt.title}</p>
                      <p className="text-xs text-zinc-500">
                        {new Date(appt.scheduledAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} à {new Date(appt.scheduledAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} · {appt.coachProfile.user.name}
                      </p>
                    </div>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${st?.color ?? 'text-zinc-400 bg-zinc-800'}`}>
                      {st?.label ?? appt.status}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={() => router.push('/dashboard')}
          className="w-full rounded-xl bg-[#C8F135] py-4 text-base font-medium text-black hover:bg-[#d4f54d] transition-colors"
        >
          Aller sur mon dashboard →
        </button>
      </section>
    </div>
  )
}
