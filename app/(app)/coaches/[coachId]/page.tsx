'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useUserStore } from '@/stores/userStore'
import { toast } from 'sonner'
import { Star, Square } from 'lucide-react'

// Mock coach data.

const COACH = {
  initials: 'SB',
  name:     'Sarah B.',
  title:    'Coach certifiée · Nutrition & Perte de poids',
  rating:   4.8,
  reviews:  89,
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
const CALENDAR_CELLS = [
  { day: 26, muted: true }, { day: 27, muted: true }, { day: 28 }, { day: 29 }, { day: 30 }, { day: 31, muted: true }, { day: 1, muted: true },
  { day: 2 }, { day: 3 }, { day: 4 }, { day: 5 }, { day: 6 }, { day: 7, muted: true }, { day: 8, muted: true },
]

// Booking page component.

export default function CoachBookingPage() {
  const router      = useRouter()
  const { profile } = useUserStore()

  const [day,   setDay]   = useState<number | null>(28)
  const [slot,  setSlot]  = useState<string | null>('11h30')
  const [msg,   setMsg]   = useState('')
  const [busy,  setBusy]  = useState(false)

  const selectedLabel = useMemo(() => {
    if (!day) return null
    return `Mercredi ${day} mai`
  }, [day])

  const handleConfirm = async () => {
    if (!day || !slot) return
    setBusy(true)
    await new Promise(r => setTimeout(r, 700))
    toast.success('Demande envoyée avec succès !')
    setBusy(false)
    router.push('/coaching/status')
  }

  const pickable = new Set([28, 29, 30, 2, 3, 4, 5, 6])

  const goalLabel: Record<string, string> = {
    WEIGHT_LOSS: 'Perte de poids', MUSCLE_GAIN: 'Prise de masse',
    MAINTENANCE: 'Maintien', ENDURANCE: 'Endurance',
    GENERAL_FITNESS: 'Forme générale', FLEXIBILITY: 'Flexibilité',
  }
  const levelLabel: Record<string, string> = {
    BEGINNER: 'Débutant', INTERMEDIATE: 'Intermédiaire',
    ADVANCED: 'Avancé', ATHLETE: 'Athlète',
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
    <div className="min-h-screen bg-black text-white">
      <section className="mx-auto max-w-6xl rounded-lg bg-[#0b0d09] px-9 py-10">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[470px_1fr]">

          {/* Left panel */}
          <div className="space-y-4">

            {/* Coach card */}
            <div className="border-b border-zinc-700 pb-7">
              <div className="flex items-center gap-4">
                <div className="flex size-[58px] shrink-0 items-center justify-center rounded-full border border-blue-400/50 bg-blue-500/10 text-xl font-medium text-blue-300">
                  {COACH.initials}
                </div>
                <div>
                  <p className="text-xl font-medium text-white">{COACH.name}</p>
                  <p className="text-xs text-zinc-400">{COACH.title}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    {Array.from({length: 5}).map((_,i) => (
                      <Star key={i} className={`size-3.5 ${i < Math.floor(COACH.rating) ? 'fill-[#C8F135] text-[#C8F135]' : 'text-zinc-600'}`} />
                    ))}
                    <span className="text-xs text-zinc-500 ml-1">{COACH.reviews} avis</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Discovery call */}
            <div className="rounded-xl border border-[#C8F135]/25 bg-[#C8F135]/5 p-6">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[1px] text-[#C8F135]">Entretien découverte</p>
              <p className="text-sm font-medium text-white">30 minutes · Visio · Gratuit</p>
              <p className="mt-3 text-xs leading-relaxed text-zinc-400">
                Le coach analyse ton profil et définit ton plan avec toi.
              </p>
            </div>

            {/* Shared profile */}
            {profile && (
              <div>
                <p className="mb-4 text-xs font-semibold uppercase tracking-[2px] text-zinc-500">
                  Ton profil partagé avec le coach
                </p>
                <div className="rounded-xl border border-zinc-700 bg-[#1a1d17] p-5">
                  {[
                    { label: 'Objectif',       value: goalLabel[profile.fitnessGoal] ?? profile.fitnessGoal },
                    { label: 'Niveau',         value: levelLabel[profile.fitnessLevel] ?? profile.fitnessLevel },
                    { label: 'Poids / Taille', value: `${profile.weightKg} kg · ${profile.heightCm} cm` },
                    { label: 'Équipement',     value: placeFromEquip() },
                    { label: 'Disponibilités', value: `${profile.trainingDaysPerWeek} jours / semaine` },
                  ].map(r => (
                    <div key={r.label} className="flex justify-between py-1.5 text-xs">
                      <span className="text-zinc-500">{r.label}</span>
                      <span className="max-w-[55%] text-right font-medium text-white">{r.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right panel */}
          <div className="space-y-4">
            <div>
              <div className="mb-6">
                <p className="text-base font-medium uppercase tracking-[2px] text-zinc-400">
                  Disponibilités — Juin 2025
                </p>
              </div>
              <div className="grid grid-cols-7 gap-2">
                {DOW.map(d => (
                  <div key={d} className="py-1 text-center text-xs font-medium text-zinc-600">{d}</div>
                ))}
                {CALENDAR_CELLS.map((cell, i) => {
                  const avail = pickable.has(cell.day) && !cell.muted
                  const selected = day === cell.day && !cell.muted
                  return (
                    <button
                      key={`${cell.day}-${i}`}
                      type="button"
                      disabled={!avail}
                      onClick={() => { setDay(cell.day); setSlot(null) }}
                      aria-label={`Choisir le ${cell.day}`}
                      className={`h-10 rounded-lg text-sm font-medium transition-all ${
                        selected ? 'bg-[#C8F135] text-black'
                        : avail ? 'border border-zinc-700 bg-[#1a1d17] text-white hover:border-[#C8F135]/50'
                        : 'text-zinc-800'
                      }`}
                    >
                      {cell.day}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Time slots */}
            {day && (
              <div>
                <p className="mb-4 text-sm font-medium capitalize text-[#C8F135]">
                  {selectedLabel} — Créneaux disponibles
                </p>
                <div className="grid grid-cols-3 gap-3">
                  {COACH.slots.map(s => (
                    <button
                      key={s.time}
                      type="button"
                      disabled={s.disabled}
                      onClick={() => setSlot(s.time)}
                      aria-label={`Choisir le créneau ${s.time}`}
                      className={`rounded-xl border py-4 text-center transition-all ${
                        s.disabled
                          ? 'border-zinc-800 bg-[#1a1d17] text-zinc-700 cursor-not-allowed'
                          : slot === s.time
                          ? 'border-[#C8F135] bg-[#C8F135]/10'
                          : 'border-zinc-700 bg-[#1a1d17] hover:border-zinc-600'
                      }`}
                    >
                      <p className={`text-base font-medium ${s.disabled ? 'text-zinc-700' : slot === s.time ? 'text-[#C8F135]' : 'text-white'}`}>
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

            {/* Confirmation, message, and CTA */}
            {day && slot && (
              <div className="space-y-4">
                {/* Summary box */}
                <div className="flex items-center gap-4 rounded-xl border border-[#C8F135]/35 bg-[#C8F135]/5 p-5">
                  <Square className="size-4 shrink-0 text-[#C8F135]" />
                  <div className="text-sm">
                    <p className="font-medium text-[#C8F135]">Rendez-vous sélectionné</p>
                    <p className="text-white capitalize">{selectedLabel} à {slot} (heure de Montréal)</p>
                  </div>
                </div>

                {/* Message */}
                <textarea
                  value={msg}
                  onChange={e => setMsg(e.target.value)}
                  rows={3}
                  placeholder="Message optionnel pour le coach…"
                  className="w-full resize-none rounded-xl border border-zinc-700 bg-[#1a1d17] px-4 py-3 text-sm text-white placeholder-zinc-500 transition-colors focus:border-[#C8F135] focus:outline-none"
                />

                {/* CTA */}
                <button
                  onClick={handleConfirm}
                  disabled={busy}
                  aria-label="Confirmer le rendez-vous"
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#C8F135] py-4 text-base font-medium text-black transition-colors hover:bg-[#d4f54d] disabled:opacity-60"
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
      </section>
    </div>
  )
}
