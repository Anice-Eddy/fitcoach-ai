'use client'

import { useRouter } from 'next/navigation'
import { Calendar, Square } from 'lucide-react'

const BOOKING = {
  coach:  'Sarah',
  date:   'Mercredi 28 mai',
  time:   '11h30 (heure de Montréal)',
  format: 'Visio · 30 min · Gratuit',
  status: 'pending' as const,
}

function addToGoogle() {
  const start = new Date(); start.setDate(start.getDate() + 2); start.setHours(11, 30, 0, 0)
  const end   = new Date(start); end.setMinutes(end.getMinutes() + 30)
  const fmt   = (d: Date) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
  const url   = new URL('https://calendar.google.com/calendar/render')
  url.searchParams.set('action', 'TEMPLATE')
  url.searchParams.set('text',   `Coaching avec ${BOOKING.coach}`)
  url.searchParams.set('dates',  `${fmt(start)}/${fmt(end)}`)
  window.open(url.toString(), '_blank')
}

function downloadICS() {
  const start = new Date(); start.setDate(start.getDate() + 2); start.setHours(11, 30, 0, 0)
  const end   = new Date(start); end.setMinutes(end.getMinutes() + 30)
  const fmt   = (d: Date) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
  const ics = [
    'BEGIN:VCALENDAR', 'VERSION:2.0',
    'BEGIN:VEVENT',
    `DTSTART:${fmt(start)}`, `DTEND:${fmt(end)}`,
    `SUMMARY:Coaching avec ${BOOKING.coach}`,
    'DESCRIPTION:Entretien découverte — fitcoach',
    'END:VEVENT', 'END:VCALENDAR',
  ].join('\r\n')
  const a  = Object.assign(document.createElement('a'), { href: URL.createObjectURL(new Blob([ics], { type: 'text/calendar' })), download: 'coaching.ics' })
  a.click()
}

export default function CoachingStatusPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-black px-0 py-10 text-white">
      <section className="mx-auto flex min-h-[620px] max-w-6xl flex-col items-center justify-center rounded-lg bg-[#0b0d09] px-4 py-16">
      <div className="w-full max-w-[670px] space-y-7">

        {/* Icon */}
        <div className="flex justify-center">
          <div className="flex size-[92px] items-center justify-center rounded-full border border-[#C8F135]/45 bg-[#C8F135]/10">
            <Square className="size-7 text-[#C8F135]" />
          </div>
        </div>

        {/* Title */}
        <div className="text-center space-y-2">
          <h1 className="text-[28px] font-medium text-white">Demande envoyée !</h1>
          <p className="mx-auto max-w-xl text-base leading-relaxed text-zinc-400">
            {BOOKING.coach} a reçu ta demande. Elle confirmera ton entretien sous 48h. Tu
            recevras un email et un SMS de confirmation.
          </p>
        </div>

        {/* Summary table */}
        <div className="overflow-hidden rounded-xl border border-zinc-700 bg-[#1a1d17]">
          {[
            { label: 'Coach',   value: BOOKING.coach,  color: '' },
            { label: 'Date',    value: BOOKING.date,   color: '' },
            { label: 'Heure',   value: BOOKING.time,   color: '' },
            { label: 'Format',  value: BOOKING.format, color: '' },
            {
              label: 'Statut',
              value: '⏳ En attente de confirmation',
              color: 'text-amber-400',
            },
          ].map(r => (
            <div key={r.label} className="flex items-center justify-between px-7 py-2.5">
              <span className="w-24 shrink-0 text-sm text-zinc-500">{r.label}</span>
              <span className={`flex-1 text-right text-sm font-medium ${r.color || 'text-white'}`}>
                {r.value}
              </span>
            </div>
          ))}
        </div>

        {/* Calendar buttons */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Google Calendar', action: addToGoogle },
            { label: 'Apple Calendar',  action: downloadICS  },
            { label: '.ics',            action: downloadICS  },
          ].map(b => (
            <button
              key={b.label}
              type="button"
              onClick={b.action}
              aria-label={`Ajouter à ${b.label}`}
              className="flex items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-[#1a1d17] py-4 text-xs text-zinc-400 transition-colors hover:border-zinc-600 hover:text-white disabled:opacity-50"
            >
              <Calendar className="size-4" />
              <span className="text-center leading-tight">{b.label}</span>
            </button>
          ))}
        </div>

        {/* Main CTA */}
        <button
          type="button"
          onClick={() => router.push('/dashboard')}
          aria-label="Aller sur mon dashboard"
          className="w-full rounded-xl bg-[#C8F135] py-5 text-base font-medium text-black transition-colors hover:bg-[#d4f54d] disabled:opacity-50"
        >
          Aller sur mon dashboard →
        </button>
      </div>
      </section>
    </div>
  )
}
