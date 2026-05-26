'use client'

import { useRouter } from 'next/navigation'
import { Calendar, Clock } from 'lucide-react'

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
    'DESCRIPTION:Entretien découverte — FitCoach AI',
    'END:VEVENT', 'END:VCALENDAR',
  ].join('\r\n')
  const a  = Object.assign(document.createElement('a'), { href: URL.createObjectURL(new Blob([ics], { type: 'text/calendar' })), download: 'coaching.ics' })
  a.click()
}

export default function CoachingStatusPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">

        {/* Icon */}
        <div className="flex justify-center">
          <div className="size-20 rounded-full border-2 border-[#C8F135]/40 bg-[#C8F135]/5 flex items-center justify-center">
            <div className="size-10 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center">
              <div className="size-5 rounded-md border-2 border-zinc-500" />
            </div>
          </div>
        </div>

        {/* Title */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-white">Demande envoyée !</h1>
          <p className="text-sm text-zinc-400 leading-relaxed">
            {BOOKING.coach} a reçu ta demande. Elle confirmera ton entretien sous 48h. Tu
            recevras un email et un SMS de confirmation.
          </p>
        </div>

        {/* Summary table */}
        <div className="rounded-2xl bg-zinc-900 border border-zinc-800 overflow-hidden">
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
            <div key={r.label} className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-800 last:border-0">
              <span className="text-xs text-zinc-500 w-20 shrink-0">{r.label}</span>
              <span className={`text-sm font-medium text-right flex-1 ${r.color || 'text-zinc-200'}`}>
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
              onClick={b.action}
              className="flex flex-col items-center gap-1.5 py-3 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-colors"
            >
              <Calendar className="size-4 text-zinc-400" />
              <span className="text-[11px] text-zinc-400 text-center leading-tight">{b.label}</span>
            </button>
          ))}
        </div>

        {/* Main CTA */}
        <button
          onClick={() => router.push('/dashboard')}
          className="w-full py-4 rounded-xl bg-[#C8F135] text-zinc-900 font-bold text-base hover:bg-[#d4f54d] transition-colors"
        >
          Aller sur mon dashboard →
        </button>
      </div>
    </div>
  )
}
