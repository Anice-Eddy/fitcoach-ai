'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useUserStore } from '@/stores/userStore'
import { toast } from 'sonner'
import { Star, ChevronLeft, ChevronRight, Video, Clock } from 'lucide-react'

// ─── Mock coach ───────────────────────────────────────────────────────────────

const COACH = {
  initials: 'SB',
  name:     'Sarah B.',
  title:    'Coach certifiée · Nutrition & Perte de poids',
  rating:   4.8,
  reviews:  89,
  // days of the month that have slots
  available: [2, 5, 6, 9, 12, 13, 16, 19, 20, 23, 26, 27, 28],
  slots: [
    { time: '9h00',  disabled: false },
    { time: '11h30', disabled: false },
    { time: '14h00', disabled: false },
    { time: '15h30', disabled: false },
    { time: '17h00', disabled: true  },
    { time: '18h30', disabled: false },
  ],
}

const DOW = ['L', 'M', 'Me', 'J', 'V', 'S', 'D']
const MONTHS = [
  'Janvier','Février','Mars','Avril','Mai','Juin',
  'Juillet','Août','Septembre','Octobre','Novembre','Décembre',
]

function getDaysInMonth(y: number, m: number) { return new Date(y, m + 1, 0).getDate() }
function getFirstDow(y: number, m: number) {
  const d = new Date(y, m, 1).getDay()
  return d === 0 ? 6 : d - 1
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function CoachBookingPage() {
  const router      = useRouter()
  const { profile } = useUserStore()
  const tz          = Intl.DateTimeFormat().resolvedOptions().timeZone

  const now = new Date()
  const [year,  setYear]  = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())
  const [day,   setDay]   = useState<number | null>(null)
  const [slot,  setSlot]  = useState<string | null>(null)
  const [msg,   setMsg]   = useState('')
  const [busy,  setBusy]  = useState(false)

  const daysCount = getDaysInMonth(year, month)
  const firstDow  = getFirstDow(year, month)

  const prevMonth = () => {
    if (month === 0) { setYear(y => y - 1); setMonth(11) } else setMonth(m => m - 1)
    setDay(null); setSlot(null)
  }
  const nextMonth = () => {
    if (month === 11) { setYear(y => y + 1); setMonth(0) } else setMonth(m => m + 1)
    setDay(null); setSlot(null)
  }

  const isPast = (d: number) => {
    const dt = new Date(year, month, d); dt.setHours(0,0,0,0)
    const t  = new Date(); t.setHours(0,0,0,0)
    return dt < t
  }

  const isAvail = (d: number) => COACH.available.includes(d) && !isPast(d)

  const selectedLabel = useMemo(() => {
    if (!day) return null
    return new Date(year, month, day).toLocaleDateString('fr-FR', {
      weekday: 'long', day: 'numeric', month: 'long',
    })
  }, [day, month, year])

  const handleConfirm = async () => {
    if (!day || !slot) return
    setBusy(true)
    await new Promise(r => setTimeout(r, 700))
    toast.success('Demande envoyée avec succès !')
    setBusy(false)
    router.push('/coaching/status')
  }

  // calendar grid cells
  const cells = [...Array(firstDow).fill(null), ...Array.from({length: daysCount}, (_, i) => i + 1)]

  const goalLabel: Record<string, string> = {
    WEIGHT_LOSS: 'Perte de poids', MUSCLE_GAIN: 'Prise de masse',
    MAINTENANCE: 'Maintien', ENDURANCE: 'Endurance',
    GENERAL_FITNESS: 'Forme générale', FLEXIBILITY: 'Flexibilité',
  }
  const levelLabel: Record<string, string> = {
    BEGINNER: 'Débutant', INTERMEDIATE: 'Intermédiaire',
    ADVANCED: 'Avancé', ATHLETE: 'Athlète',
  }
  const equipLabel: Record<string, string> = {
    BODYWEIGHT: 'Poids du corps', DUMBBELL: 'Haltères',
    BARBELL: 'Barre', KETTLEBELL: 'Kettlebell',
    BENCH: 'Banc', CABLE_MACHINE: 'Poulie', PULL_UP_BAR: 'Barre traction',
    SMITH_MACHINE: 'Smith machine', CARDIO_MACHINE: 'Cardio', RESISTANCE_BAND: 'Bandes',
  }

  const placeFromEquip = () => {
    const eq = profile?.availableEquipment as string[] | undefined
    if (!eq?.length) return '—'
    if (eq.includes('BARBELL')) return 'Salle de sport'
    if (eq.includes('DUMBBELL')) return 'Maison (matériel)'
    if (eq.length === 1 && eq[0] === 'BODYWEIGHT') return 'Maison (poids du corps)'
    return 'Extérieur'
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">

          {/* ── LEFT PANEL ─────────────────────────────────────────────────── */}
          <div className="space-y-4">

            {/* Coach card */}
            <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="size-12 rounded-full bg-zinc-700 flex items-center justify-center text-base font-bold text-white shrink-0">
                  {COACH.initials}
                </div>
                <div>
                  <p className="font-semibold text-white text-sm">{COACH.name}</p>
                  <p className="text-xs text-zinc-400">{COACH.title}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    {Array.from({length: 5}).map((_,i) => (
                      <Star key={i} className={`size-3 ${i < Math.floor(COACH.rating) ? 'fill-amber-400 text-amber-400' : 'text-zinc-600'}`} />
                    ))}
                    <span className="text-xs text-zinc-500 ml-1">{COACH.reviews} avis</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Entretien découverte */}
            <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-5">
              <p className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase mb-3">Entretien découverte</p>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-zinc-300">
                  <Clock className="size-3.5 text-zinc-500 shrink-0" />
                  30 minutes
                </div>
                <div className="flex items-center gap-2 text-sm text-zinc-300">
                  <Video className="size-3.5 text-zinc-500 shrink-0" />
                  Visio · <span className="text-[#C8F135] font-medium">Gratuit</span>
                </div>
              </div>
              <p className="text-xs text-zinc-500 mt-3 leading-relaxed">
                Le coach analyse ton profil et définit ton plan avec toi.
              </p>
            </div>

            {/* Profile shared */}
            {profile && (
              <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-5">
                <p className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase mb-3">
                  Ton profil partagé avec le coach
                </p>
                <div className="space-y-2">
                  {[
                    { label: 'Objectif',       value: goalLabel[profile.fitnessGoal] ?? profile.fitnessGoal },
                    { label: 'Niveau',         value: levelLabel[profile.fitnessLevel] ?? profile.fitnessLevel },
                    { label: 'Poids / Taille', value: `${profile.weightKg} kg · ${profile.heightCm} cm` },
                    { label: 'Équipement',     value: placeFromEquip() },
                    { label: 'Disponibilités', value: `${profile.trainingDaysPerWeek} jours / semaine` },
                  ].map(r => (
                    <div key={r.label} className="flex justify-between text-xs py-1 border-b border-zinc-800 last:border-0">
                      <span className="text-zinc-500">{r.label}</span>
                      <span className="text-zinc-200 font-medium text-right max-w-[55%]">{r.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── RIGHT PANEL ────────────────────────────────────────────────── */}
          <div className="space-y-4">
            <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-5">

              {/* Month nav */}
              <div className="flex items-center justify-between mb-4">
                <p className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase">
                  Disponibilités — {MONTHS[month]} {year}
                </p>
                <div className="flex items-center gap-1">
                  <button onClick={prevMonth} className="p-1 rounded-lg hover:bg-zinc-800 text-zinc-500 hover:text-white transition-colors">
                    <ChevronLeft className="size-4" />
                  </button>
                  <button onClick={nextMonth} className="p-1 rounded-lg hover:bg-zinc-800 text-zinc-500 hover:text-white transition-colors">
                    <ChevronRight className="size-4" />
                  </button>
                </div>
              </div>

              {/* DOW header */}
              <div className="grid grid-cols-7 mb-1">
                {DOW.map(d => (
                  <div key={d} className="text-center text-[11px] text-zinc-600 font-medium py-1">{d}</div>
                ))}
              </div>

              {/* Calendar grid */}
              <div className="grid grid-cols-7 gap-0.5">
                {cells.map((d, i) => {
                  if (!d) return <div key={`e-${i}`} className="aspect-square" />
                  const avail    = isAvail(d)
                  const past     = isPast(d)
                  const selected = day === d
                  return (
                    <button
                      key={d}
                      type="button"
                      disabled={!avail}
                      onClick={() => { setDay(d); setSlot(null) }}
                      className={`aspect-square rounded-lg text-xs font-medium flex items-center justify-center transition-all ${
                        selected ? 'bg-[#C8F135] text-zinc-900 font-bold'
                        : avail  ? 'hover:bg-zinc-800 text-white'
                        : past   ? 'text-zinc-700 cursor-default'
                                 : 'text-zinc-700 cursor-default'
                      }`}
                    >
                      {d}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Time slots */}
            {day && (
              <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-5">
                <p className="text-sm font-semibold text-white mb-4 capitalize">
                  {selectedLabel} — Créneaux disponibles
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {COACH.slots.map(s => (
                    <button
                      key={s.time}
                      type="button"
                      disabled={s.disabled}
                      onClick={() => setSlot(s.time)}
                      className={`py-3 rounded-xl border text-center transition-all ${
                        s.disabled
                          ? 'border-zinc-800 bg-zinc-900 text-zinc-700 cursor-not-allowed'
                          : slot === s.time
                          ? 'border-[#C8F135] bg-[#C8F135]/10'
                          : 'border-zinc-700 bg-zinc-800 hover:border-zinc-600'
                      }`}
                    >
                      <p className={`text-sm font-bold ${s.disabled ? 'text-zinc-700' : slot === s.time ? 'text-[#C8F135]' : 'text-white'}`}>
                        {s.time}
                      </p>
                      <p className={`text-[11px] mt-0.5 ${s.disabled ? 'text-zinc-800' : 'text-zinc-500'}`}>30 min</p>
                      {slot === s.time && (
                        <p className="text-[10px] text-[#C8F135] font-medium mt-0.5">Sélectionné</p>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Confirmation + message + CTA */}
            {day && slot && (
              <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-5 space-y-4">
                {/* Summary box */}
                <div className="flex items-center gap-3 p-4 rounded-xl bg-zinc-800/70 border border-zinc-700">
                  <div className="size-2 rounded-full bg-[#C8F135] shrink-0" />
                  <div className="text-sm">
                    <span className="text-white font-medium">Rendez-vous sélectionné</span>
                    <span className="text-zinc-400 ml-2 capitalize">{selectedLabel} à {slot}</span>
                    <span className="text-zinc-600 text-xs ml-2">({tz})</span>
                  </div>
                </div>

                {/* Message */}
                <textarea
                  value={msg}
                  onChange={e => setMsg(e.target.value)}
                  rows={3}
                  placeholder="Message optionnel pour le coach…"
                  className="w-full px-4 py-3 rounded-xl bg-zinc-800 border border-zinc-700 text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-[#C8F135] transition-colors resize-none"
                />

                {/* CTA */}
                <button
                  onClick={handleConfirm}
                  disabled={busy}
                  className="w-full py-4 rounded-xl bg-[#C8F135] text-zinc-900 font-bold text-base hover:bg-[#d4f54d] transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {busy ? 'Envoi en cours…' : 'Confirmer le rendez-vous →'}
                </button>
                <p className="text-center text-xs text-zinc-600">
                  Confirmation par email et SMS · 100% gratuit
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
