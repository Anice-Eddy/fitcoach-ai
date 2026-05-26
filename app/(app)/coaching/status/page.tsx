'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PageWrapper } from '@/components/layout/PageWrapper'
import {
  Clock, CheckCircle2, XCircle, AlertCircle,
  Calendar, Video, ArrowLeft, ExternalLink,
} from 'lucide-react'

// Booking data would come from the database in production
// Using mock data for now — the status can be 'pending' | 'confirmed' | 'rejected' | 'expired'
const MOCK_BOOKING = {
  status:    'pending' as 'pending' | 'confirmed' | 'rejected' | 'expired',
  coach:     'Alexandre Moreau',
  date:      new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  }),
  time:      '14:00',
  timezone:  Intl.DateTimeFormat().resolvedOptions().timeZone,
  format:    'Visioconférence (Zoom)',
  meetLink:  'https://zoom.us/j/example',
}

const STATUS_CONFIG = {
  pending: {
    icon:    Clock,
    color:   'text-amber-400',
    bg:      'bg-amber-400/10 border-amber-400/20',
    label:   'En attente de confirmation',
    desc:    'Le coach a reçu ta demande et confirmera sous 24h.',
  },
  confirmed: {
    icon:    CheckCircle2,
    color:   'text-emerald-400',
    bg:      'bg-emerald-400/10 border-emerald-400/20',
    label:   'Rendez-vous confirmé',
    desc:    'Ton rendez-vous est confirmé ! Prépare tes questions.',
  },
  rejected: {
    icon:    XCircle,
    color:   'text-red-400',
    bg:      'bg-red-400/10 border-red-400/20',
    label:   'Demande refusée',
    desc:    'Le coach n\'est plus disponible à ce créneau. Essaie un autre horaire.',
  },
  expired: {
    icon:    AlertCircle,
    color:   'text-zinc-400',
    bg:      'bg-zinc-800 border-zinc-700',
    label:   'Demande expirée',
    desc:    'La demande n\'a pas reçu de réponse dans les temps. Fais une nouvelle réservation.',
  },
}

function addToGoogleCalendar(booking: typeof MOCK_BOOKING) {
  const start = new Date()
  start.setDate(start.getDate() + 2)
  start.setHours(14, 0, 0, 0)
  const end = new Date(start)
  end.setMinutes(end.getMinutes() + 30)

  const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
  const url = new URL('https://calendar.google.com/calendar/render')
  url.searchParams.set('action', 'TEMPLATE')
  url.searchParams.set('text',  `Coaching avec ${booking.coach}`)
  url.searchParams.set('dates', `${fmt(start)}/${fmt(end)}`)
  url.searchParams.set('details', `Entretien découverte avec ${booking.coach}`)
  window.open(url.toString(), '_blank')
}

function downloadICS(booking: typeof MOCK_BOOKING) {
  const start = new Date()
  start.setDate(start.getDate() + 2)
  start.setHours(14, 0, 0, 0)
  const end = new Date(start)
  end.setMinutes(end.getMinutes() + 30)

  const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'BEGIN:VEVENT',
    `DTSTART:${fmt(start)}`,
    `DTEND:${fmt(end)}`,
    `SUMMARY:Coaching avec ${booking.coach}`,
    `DESCRIPTION:Entretien découverte — FitCoach AI`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')

  const blob = new Blob([ics], { type: 'text/calendar' })
  const a    = document.createElement('a')
  a.href     = URL.createObjectURL(blob)
  a.download = 'coaching.ics'
  a.click()
}

export default function CoachingStatusPage() {
  const router = useRouter()
  const booking = MOCK_BOOKING
  const cfg     = STATUS_CONFIG[booking.status]
  const StatusIcon = cfg.icon

  return (
    <PageWrapper>
      <div className="max-w-lg mx-auto space-y-6 pb-10">
        {/* Back */}
        <button onClick={() => router.push('/dashboard')}
          className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white transition-colors">
          <ArrowLeft className="size-4" /> Dashboard
        </button>

        {/* Status badge */}
        <div className={`flex items-center gap-3 p-4 rounded-2xl border ${cfg.bg}`}>
          <StatusIcon className={`size-6 shrink-0 ${cfg.color}`} />
          <div>
            <p className={`text-sm font-semibold ${cfg.color}`}>{cfg.label}</p>
            <p className="text-xs text-zinc-400 mt-0.5">{cfg.desc}</p>
          </div>
        </div>

        {/* Booking details */}
        <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-5 space-y-3">
          <h2 className="text-sm font-semibold text-zinc-300 mb-3">Détails du rendez-vous</h2>
          {[
            { label: 'Coach',      value: booking.coach },
            { label: 'Date',       value: booking.date },
            { label: 'Heure',      value: booking.time },
            { label: 'Fuseau',     value: booking.timezone },
            { label: 'Format',     value: booking.format },
          ].map(r => (
            <div key={r.label} className="flex items-center justify-between py-1.5 border-b border-zinc-800 last:border-0">
              <span className="text-xs text-zinc-500">{r.label}</span>
              <span className="text-sm text-zinc-200">{r.value}</span>
            </div>
          ))}
        </div>

        {/* Actions depending on status */}
        {booking.status === 'confirmed' && (
          <>
            {/* Visio link */}
            <a
              href={booking.meetLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-4 rounded-2xl bg-zinc-900 border border-[#C8F135]/30 hover:border-[#C8F135]/60 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <Video className="size-5 text-[#C8F135]" />
                <span className="text-sm font-medium text-white">Rejoindre la visio</span>
              </div>
              <ExternalLink className="size-4 text-zinc-500 group-hover:text-white transition-colors" />
            </a>

            {/* Calendar exports */}
            <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-5 space-y-3">
              <h2 className="text-sm font-semibold text-zinc-300">Ajouter à mon calendrier</h2>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => addToGoogleCalendar(booking)}
                  className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-sm text-zinc-300 hover:border-zinc-600 hover:text-white transition-colors"
                >
                  <Calendar className="size-4" /> Google
                </button>
                <button
                  onClick={() => downloadICS(booking)}
                  className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-sm text-zinc-300 hover:border-zinc-600 hover:text-white transition-colors"
                >
                  <Calendar className="size-4" /> Apple / .ics
                </button>
              </div>
            </div>
          </>
        )}

        {(booking.status === 'rejected' || booking.status === 'expired') && (
          <button
            onClick={() => router.push('/coaches/coach-1')}
            className="w-full py-3.5 rounded-xl bg-[#C8F135] text-zinc-900 font-bold hover:bg-[#d4f54d] transition-colors"
          >
            Prendre un nouveau rendez-vous
          </button>
        )}

        {booking.status === 'pending' && (
          <div className="flex items-start gap-3 p-4 rounded-2xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-400">
            <Clock className="size-4 shrink-0 mt-0.5 text-amber-400" />
            Tu recevras une notification email dès que le coach aura confirmé ou proposé un autre créneau.
          </div>
        )}

        <button
          onClick={() => router.push('/dashboard')}
          className="w-full py-3 rounded-xl border border-zinc-700 text-zinc-300 font-medium hover:bg-zinc-800 transition-colors"
        >
          Retour au dashboard
        </button>
      </div>
    </PageWrapper>
  )
}
