'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useUserStore } from '@/stores/userStore'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { toast } from 'sonner'
import {
  ChevronLeft, ChevronRight, Clock, Globe,
  Bell, Mail, MessageSquare, Star, ArrowLeft,
} from 'lucide-react'

// ─── Mock coach data ──────────────────────────────────────────────────────────

const MOCK_COACH = {
  id:         'coach-1',
  name:       'Alexandre Moreau',
  title:      'Coach sportif certifié',
  rating:     4.9,
  reviews:    127,
  bio:        'Spécialisé en prise de masse et en rééducation sportive. 8 ans d\'expérience auprès de clients allant du débutant à l\'athlète de haut niveau.',
  avatar:     null as null,
  languages:  ['Français', 'English'],
  // Days with available slots: map day-of-month to true
  availableDays: [2, 3, 5, 6, 9, 10, 12, 13, 16, 17, 19, 20, 23, 24, 26, 27, 30],
  slots: ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00'],
}

const DAYS_OF_WEEK = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
const MONTHS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year: number, month: number) {
  // 0=Sun → convert to Mon-first: (0→6, 1→0, ..., 6→5)
  const d = new Date(year, month, 1).getDay()
  return d === 0 ? 6 : d - 1
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function CoachBookingPage() {
  const router        = useRouter()
  const { profile }   = useUserStore()
  const userTz        = Intl.DateTimeFormat().resolvedOptions().timeZone

  const now = new Date()
  const [viewYear,  setViewYear]  = useState(now.getFullYear())
  const [viewMonth, setViewMonth] = useState(now.getMonth())
  const [selectedDay,  setSelectedDay]  = useState<number | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null)
  const [message,   setMessage]   = useState('')
  const [reminders, setReminders] = useState<string[]>(['email'])
  const [submitting, setSubmitting] = useState(false)

  const daysInMonth  = getDaysInMonth(viewYear, viewMonth)
  const firstDayOfMn = getFirstDayOfMonth(viewYear, viewMonth)

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11) }
    else setViewMonth(m => m - 1)
    setSelectedDay(null); setSelectedSlot(null)
  }
  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0) }
    else setViewMonth(m => m + 1)
    setSelectedDay(null); setSelectedSlot(null)
  }

  const isPast = (day: number) => {
    const d = new Date(viewYear, viewMonth, day)
    d.setHours(0, 0, 0, 0)
    const today = new Date(); today.setHours(0, 0, 0, 0)
    return d < today
  }

  const isAvailable = (day: number) =>
    MOCK_COACH.availableDays.includes(day) && !isPast(day)

  const toggleReminder = (val: string) => {
    setReminders(prev => prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val])
  }

  const selectedDate = useMemo(() => {
    if (!selectedDay) return null
    return new Date(viewYear, viewMonth, selectedDay).toLocaleDateString('fr-FR', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    })
  }, [selectedDay, viewMonth, viewYear])

  const handleConfirm = async () => {
    if (!selectedDay || !selectedSlot) return
    setSubmitting(true)
    await new Promise(r => setTimeout(r, 800)) // simulate API
    toast.success('Demande envoyée ! Le coach confirmera sous 24h.')
    setSubmitting(false)
    router.push('/coaching/status')
  }

  // Grid cells: empty prefix + day cells
  const cells = [
    ...Array(firstDayOfMn).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  return (
    <PageWrapper>
      <div className="max-w-2xl mx-auto space-y-6 pb-10">
        {/* Back */}
        <button onClick={() => router.back()}
          className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white transition-colors">
          <ArrowLeft className="size-4" /> Retour
        </button>

        {/* Coach header */}
        <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-5 flex items-start gap-4">
          <div className="size-14 rounded-xl bg-zinc-800 flex items-center justify-center shrink-0 text-2xl font-bold text-zinc-400">
            {MOCK_COACH.name[0]}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg font-bold text-white">{MOCK_COACH.name}</h1>
              <div className="flex items-center gap-1 text-xs text-amber-400">
                <Star className="size-3 fill-amber-400" />
                {MOCK_COACH.rating} ({MOCK_COACH.reviews} avis)
              </div>
            </div>
            <p className="text-sm text-[#C8F135] font-medium">{MOCK_COACH.title}</p>
            <p className="text-xs text-zinc-400 mt-1 leading-relaxed">{MOCK_COACH.bio}</p>
          </div>
        </div>

        {/* Timezone notice */}
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <Globe className="size-3.5" />
          Horaires affichés en <span className="text-zinc-300 font-medium ml-1">{userTz}</span>
        </div>

        {/* Calendar */}
        <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-5">
          {/* Month nav */}
          <div className="flex items-center justify-between mb-5">
            <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors">
              <ChevronLeft className="size-5" />
            </button>
            <span className="text-base font-semibold text-white">
              {MONTHS[viewMonth]} {viewYear}
            </span>
            <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors">
              <ChevronRight className="size-5" />
            </button>
          </div>

          {/* Day-of-week header */}
          <div className="grid grid-cols-7 mb-2">
            {DAYS_OF_WEEK.map(d => (
              <div key={d} className="text-center text-xs text-zinc-600 font-medium py-1">{d}</div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {cells.map((day, i) => {
              if (!day) return <div key={`e-${i}`} />
              const avail   = isAvailable(day)
              const past    = isPast(day)
              const selected = selectedDay === day
              return (
                <button
                  key={day}
                  type="button"
                  disabled={!avail}
                  onClick={() => { setSelectedDay(day); setSelectedSlot(null) }}
                  className={`aspect-square rounded-lg text-sm font-medium transition-all ${
                    selected
                      ? 'bg-[#C8F135] text-zinc-900'
                      : avail
                      ? 'hover:bg-zinc-800 text-white'
                      : past
                      ? 'text-zinc-700 cursor-not-allowed'
                      : 'text-zinc-600 cursor-not-allowed'
                  }`}
                >
                  {day}
                  {avail && !selected && (
                    <div className="w-1 h-1 rounded-full bg-[#C8F135] mx-auto mt-0.5" />
                  )}
                </button>
              )
            })}
          </div>

          <div className="flex items-center gap-2 mt-4 text-xs text-zinc-500">
            <div className="size-2 rounded-full bg-[#C8F135]" />
            Disponible
          </div>
        </div>

        {/* Time slots */}
        {selectedDay && (
          <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-5">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="size-4 text-zinc-400" />
              <h2 className="text-sm font-semibold text-white">
                Créneaux disponibles — {selectedDate}
              </h2>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {MOCK_COACH.slots.map(slot => (
                <button
                  key={slot}
                  type="button"
                  onClick={() => setSelectedSlot(slot)}
                  className={`py-2.5 rounded-xl border text-sm font-medium transition-all ${
                    selectedSlot === slot
                      ? 'border-[#C8F135] bg-[#C8F135]/10 text-[#C8F135]'
                      : 'border-zinc-700 bg-zinc-800 text-zinc-300 hover:border-zinc-600'
                  }`}
                >
                  {slot}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Summary + message + reminders */}
        {selectedDay && selectedSlot && (
          <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-5 space-y-4">
            {/* Summary */}
            <div className="p-4 rounded-xl bg-zinc-800/60 border border-zinc-700 space-y-1.5">
              <p className="text-xs text-zinc-500 uppercase tracking-wide font-semibold">Récapitulatif</p>
              <p className="text-sm text-white font-medium">{MOCK_COACH.name}</p>
              <p className="text-sm text-zinc-300">{selectedDate} à {selectedSlot}</p>
              <p className="text-xs text-zinc-500">Fuseau : {userTz}</p>
              {profile && (
                <p className="text-xs text-zinc-500">
                  Profil partagé : {profile.firstName}, {profile.age} ans · {profile.fitnessGoal}
                </p>
              )}
            </div>

            {/* Message */}
            <div>
              <label className="block text-xs text-zinc-500 mb-1.5 flex items-center gap-1.5">
                <MessageSquare className="size-3.5" /> Message au coach <span className="text-zinc-600">(optionnel)</span>
              </label>
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                rows={3}
                placeholder="Présente-toi, parle de tes objectifs ou pose une question…"
                className="w-full px-4 py-3 rounded-xl bg-zinc-800 border border-zinc-700 text-white text-sm placeholder-zinc-500 focus:outline-none focus:border-[#C8F135] transition-colors resize-none"
              />
            </div>

            {/* Reminders */}
            <div>
              <label className="block text-xs text-zinc-500 mb-2 flex items-center gap-1.5">
                <Bell className="size-3.5" /> Rappels
              </label>
              <div className="flex gap-3">
                {[
                  { id: 'email', label: 'Email', icon: Mail },
                  { id: 'sms',   label: 'SMS',   icon: MessageSquare },
                ].map(r => {
                  const active = reminders.includes(r.id)
                  return (
                    <button key={r.id} type="button"
                      onClick={() => toggleReminder(r.id)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-all ${
                        active ? 'border-[#C8F135] bg-[#C8F135]/10 text-[#C8F135]' : 'border-zinc-700 bg-zinc-800 text-zinc-300 hover:border-zinc-600'
                      }`}
                    >
                      <r.icon className="size-3.5" /> {r.label}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Confirm */}
            <button
              onClick={handleConfirm}
              disabled={submitting}
              className="w-full py-4 rounded-xl bg-[#C8F135] text-zinc-900 font-bold hover:bg-[#d4f54d] transition-colors disabled:opacity-60 text-base"
            >
              {submitting ? 'Envoi en cours…' : 'Confirmer la demande'}
            </button>
            <p className="text-xs text-center text-zinc-600">
              Entretien découverte 30 min · Aucun engagement
            </p>
          </div>
        )}
      </div>
    </PageWrapper>
  )
}
