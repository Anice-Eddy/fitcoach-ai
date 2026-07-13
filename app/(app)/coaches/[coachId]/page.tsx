'use client'

import { useState, useEffect, useMemo } from 'react'
import Image from 'next/image'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import { useUserStore } from '@/stores/userStore'
import { toast } from 'sonner'
import { Star, CheckCircle, ArrowLeft, CalendarDays, MapPin, Award } from 'lucide-react'
import Link from 'next/link'
import { ListSkeleton } from '@/components/ui/LoadingSkeleton'
import { useLocale } from '@/contexts/LocaleContext'
import { GOAL_LABEL_KEYS, LEVEL_LABEL_KEYS } from '@/lib/i18n/profile-label-keys'

interface CoachData {
  id: string
  name: string | null
  image: string | null
  coachProfile: {
    id:              string
    bio:             string | null
    specialties:     string[]
    certifications:  string[]
    isVerified:      boolean
    city:            string | null
    country:         string | null
    yearsExperience: number | null
    publicRating:    number | null
    publicRatingCount: number
    discoveryCallTitle: string | null
    discoveryCallDuration: number | null
    avatarUrl:       string | null
    _count: { coachMembers: number | null; appointments: number }
  }
}

// Returns the next `count` days starting from tomorrow.
function buildNextDays(count = 14) {
  const days: { date: Date }[] = []
  const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() + 1)
  for (let i = 0; i < count; i++) {
    days.push({
      date:      new Date(d),
    })
    d.setDate(d.getDate() + 1)
  }
  return days
}

type AvailableSlot = { datetime: string; duration: number }

/** Coach profile and appointment booking page: shows coach info, specialty, and a date/time slot picker to request an appointment. */
export default function CoachBookingPage() {
  const { locale, t } = useLocale()
  const router      = useRouter()
  const params      = useParams<{ coachId: string }>()
  const searchParams = useSearchParams()
  const coachId     = params?.coachId
  const { profile } = useUserStore()
  const days = useMemo(() => buildNextDays(14), [])

  const [coachData,    setCoachData]    = useState<CoachData | null>(null)
  const [loading,      setLoading]      = useState(true)
  const [allSlots,     setAllSlots]     = useState<AvailableSlot[]>([])
  const [slotsLoading, setSlotsLoading] = useState(false)
  const [selectedDay,  setSelectedDay]  = useState<Date | null>(() => days[0]?.date ?? null)
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null)
  const [msg,  setMsg]  = useState('')
  const [busy, setBusy] = useState(false)
  const returnTo = searchParams?.get('returnTo') ?? ''
  // Preserve the original account page when navigating list -> coach detail -> list.
  const safeReturnTo = returnTo.startsWith('/') && !returnTo.startsWith('//') && returnTo !== '/choose'
    ? returnTo
    : ''
  const coachesHref = `/coaches${safeReturnTo ? `?returnTo=${encodeURIComponent(safeReturnTo)}` : ''}`

  useEffect(() => {
    if (!coachId) { setLoading(false); return }
    fetch(`/api/coaches/${coachId}`)
      .then(r => r.ok ? r.json() as Promise<CoachData> : null)
      .then(data => { setCoachData(data); setLoading(false) })
      .catch(() => { setCoachData(null); setLoading(false) })
  }, [coachId])

  // Fetch real availability slots for the next 14 days once the coach is known.
  useEffect(() => {
    if (!coachData) return

    setSlotsLoading(true)
    const from = new Date(); from.setDate(from.getDate() + 1); from.setHours(0, 0, 0, 0)
    const to   = new Date(from.getTime() + 13 * 86_400_000)
    fetch(`/api/coaches/${coachData.coachProfile.id}/slots?from=${from.toISOString().slice(0, 10)}&to=${to.toISOString().slice(0, 10)}`)
      .then(r => r.ok ? r.json() : [])
      .then((data: AvailableSlot[]) => { setAllSlots(data); setSlotsLoading(false) })
      .catch(() => setSlotsLoading(false))
  }, [coachData])

  const placeFromEquip = () => {
    const eq = profile?.availableEquipment as string[] | undefined
    if (!eq?.length) return '—'
    if (eq.includes('BARBELL')) return t('coaches.gym')
    if (eq.includes('DUMBBELL')) return t('coaches.homeGear')
    if (eq.length === 1 && eq[0] === 'BODYWEIGHT') return t('coaches.homeBodyweight')
    return t('coaches.outdoor')
  }

  const daysWithSlots = new Set(allSlots.map(s => new Date(s.datetime).toDateString()))
  const daySlots = selectedDay
    ? allSlots.filter(s => new Date(s.datetime).toDateString() === selectedDay.toDateString())
    : []

  const handleConfirm = async () => {
    if (!selectedDay || !selectedSlot || !coachData) return
    setBusy(true)

    // Slots come from the availability API, so the selected value is already a full datetime.
    const scheduledAt = new Date(selectedSlot)
    const slotDuration = allSlots.find(s => s.datetime === selectedSlot)?.duration ?? 60

    try {
      const res = await fetch('/api/user/appointments', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          coachProfileId: coachData.coachProfile.id,
          title:          coachData.coachProfile.discoveryCallTitle ?? t('coaches.discoveryFallback'),
          description:    msg || undefined,
          memberNote:     msg || undefined,
          scheduledAt:    scheduledAt.toISOString(),
          duration:       slotDuration,
        }),
      })
      if (!res.ok) throw new Error()

      toast.success(t('coaches.requestSent'))
      // After booking, return to the page that initiated coach selection.
      // Without an explicit origin, the coaching status page is the natural confirmation screen.
      router.replace(safeReturnTo || '/coaching/status')
    } catch {
      toast.error(t('coaches.bookingError'))
      setBusy(false)
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-black text-white">
      <section className="mx-auto max-w-6xl px-4 py-12"><ListSkeleton rows={4} /></section>
    </div>
  )

  if (!coachData) return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="text-center">
        <p className="text-zinc-400 mb-4">{t('coaches.notFound')}</p>
        <Link href="/coaches" className="text-[#C8F135] hover:underline">{t('coaches.viewCoaches')}</Link>
      </div>
    </div>
  )

  const coach = coachData

  return (
    <div className="min-h-screen bg-black text-white">
      <section className="mx-auto max-w-6xl rounded-lg bg-[#0b0d09] px-6 py-10">
        <Link href={coachesHref} className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-white mb-8 transition-colors">
          <ArrowLeft className="size-3.5" /> {t('coaches.chooseAnother')}
        </Link>

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[420px_1fr]">
          {/* Left panel */}
          <div className="space-y-5">
            {/* Coach card */}
            <div className="border-b border-zinc-700 pb-6">
              <div className="flex items-center gap-4">
                {coach.image ? (
                  <Image src={coach.image} alt={coach.name ?? ''} width={58} height={58} className="size-[58px] rounded-full object-cover shrink-0" />
                ) : (
                  <div className="size-[58px] rounded-full bg-zinc-700 flex items-center justify-center text-xl font-bold text-white shrink-0">
                    {(coach.name ?? '?').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-xl font-medium text-white">{coach.name}</p>
                    {coach.coachProfile.isVerified && <CheckCircle className="size-4 text-[#C8F135]" />}
                  </div>
                  {coach.coachProfile.specialties.length > 0 && (
                    <p className="text-xs text-zinc-400">{coach.coachProfile.specialties.join(' · ')}</p>
                  )}
                  <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                    {coach.coachProfile.publicRating != null && (
                      <>
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className={`size-3.5 ${i < Math.round(coach.coachProfile.publicRating ?? 0) ? 'fill-[#C8F135] text-[#C8F135]' : 'text-zinc-600'}`} />
                        ))}
                        <span className="text-xs text-zinc-500 ml-1">
                          {coach.coachProfile.publicRating.toFixed(1)}
                          {coach.coachProfile.publicRatingCount > 0 ? ` (${coach.coachProfile.publicRatingCount})` : ''}
                        </span>
                      </>
                    )}
                    {coach.coachProfile._count.coachMembers != null && (
                      <span className="text-xs text-zinc-500 ml-1">{coach.coachProfile._count.coachMembers} {t('coaches.members')}</span>
                    )}
                    {(coach.coachProfile.city || coach.coachProfile.country) && (
                      <span className="flex items-center gap-1 text-xs text-zinc-500 ml-2">
                        <MapPin className="size-3" />
                        {[coach.coachProfile.city, coach.coachProfile.country].filter(Boolean).join(', ')}
                      </span>
                    )}
                    {coach.coachProfile.yearsExperience != null && (
                      <span className="flex items-center gap-1 text-xs text-zinc-500 ml-2">
                        <Award className="size-3" />
                        {coach.coachProfile.yearsExperience} {t('coaches.yearsExperience')}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              {coach.coachProfile.bio && (
                <p className="text-sm text-zinc-400 mt-3 leading-relaxed">{coach.coachProfile.bio}</p>
              )}
            </div>

            {/* Discovery call info */}
            {coach.coachProfile.discoveryCallTitle && coach.coachProfile.discoveryCallDuration && (
              <div className="rounded-xl border border-[#C8F135]/25 bg-[#C8F135]/5 p-5">
                <p className="mb-2 text-xs font-semibold uppercase tracking-[1px] text-[#C8F135]">
                  {coach.coachProfile.discoveryCallTitle}
                </p>
                <p className="text-sm font-medium text-white">{coach.coachProfile.discoveryCallDuration} minutes · {t('coaches.video')} · {t('coaches.free')}</p>
                <p className="mt-2 text-xs leading-relaxed text-zinc-400">
                  {t('coaches.discoveryDescription')}
                </p>
              </div>
            )}

            {/* Shared profile */}
            {profile && (
              <div>
                <p className="mb-3 text-xs font-semibold uppercase tracking-[2px] text-zinc-500">
                  {t('coaches.sharedProfile')}
                </p>
                <div className="rounded-xl border border-zinc-700 bg-[#1a1d17] p-4 space-y-1.5">
                  {[
                    { label: t('coaches.objective'),       value: GOAL_LABEL_KEYS[profile.fitnessGoal] ? t(GOAL_LABEL_KEYS[profile.fitnessGoal]) : profile.fitnessGoal },
                    { label: t('coaches.level'),         value: LEVEL_LABEL_KEYS[profile.fitnessLevel] ? t(LEVEL_LABEL_KEYS[profile.fitnessLevel]) : profile.fitnessLevel },
                    { label: t('coaches.weightHeight'), value: `${profile.weightKg} kg · ${profile.heightCm} cm` },
                    { label: t('coaches.place'),           value: placeFromEquip() },
                    { label: t('coaches.availability'), value: `${profile.trainingDaysPerWeek} ${t('coaches.daysPerWeek')}` },
                  ].map(r => (
                    <div key={r.label} className="flex justify-between text-xs">
                      <span className="text-zinc-500">{r.label}</span>
                      <span className="text-right font-medium text-white max-w-[55%]">{r.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right panel - calendar + slots */}
          <div className="space-y-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[2px] text-zinc-400 mb-4">
                <CalendarDays className="inline size-3.5 mr-1" />
                {t('coaches.chooseDate')}
              </p>
              <div className="grid grid-cols-7 gap-2">
                {days.map(({ date }) => {
                  const selected  = selectedDay?.toDateString() === date.toDateString()
                  const hasSlots  = daysWithSlots.has(date.toDateString())
                  const dayLabel = date.toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', { weekday: 'short' })
                  return (
                    <button
                      key={date.toISOString()}
                      type="button"
                      disabled={!hasSlots && !slotsLoading}
                      onClick={() => { setSelectedDay(date); setSelectedSlot(null) }}
                      className={`flex flex-col items-center py-2 rounded-xl text-xs font-medium transition-all disabled:opacity-30 disabled:cursor-not-allowed ${
                        selected
                          ? 'bg-[#C8F135] text-black'
                          : 'border border-zinc-700 bg-[#1a1d17] text-zinc-300 hover:border-[#C8F135]/50'
                      }`}
                    >
                      <span className="text-[10px] opacity-70">{dayLabel}</span>
                      <span className="text-sm font-bold mt-0.5">{date.getDate()}</span>
                      {hasSlots && !selected && (
                        <span className="mt-1 size-1 rounded-full bg-[#C8F135]/60" />
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            {selectedDay && (
              <div>
                <p className="text-sm font-medium text-[#C8F135] mb-4 capitalize">
                  {selectedDay.toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', { weekday: 'long', day: 'numeric', month: 'long' })} — {t('coaches.availableSlots')}
                </p>
                {slotsLoading ? (
                  <p className="text-xs text-zinc-500">{t('coaches.loadingSlots')}</p>
                ) : daySlots.length === 0 ? (
                  <p className="text-xs text-zinc-500">{t('coaches.noSlots')}</p>
                ) : (
                  <div className="grid grid-cols-3 gap-3">
                    {daySlots.map(slot => {
                      const d    = new Date(slot.datetime)
                      const time = d.toLocaleTimeString(locale === 'fr' ? 'fr-FR' : 'en-US', { hour: '2-digit', minute: '2-digit' })
                      return (
                        <button
                          key={slot.datetime}
                          type="button"
                          onClick={() => setSelectedSlot(slot.datetime)}
                          className={`rounded-xl border py-4 text-center transition-all ${
                            selectedSlot === slot.datetime
                              ? 'border-[#C8F135] bg-[#C8F135]/10'
                              : 'border-zinc-700 bg-[#1a1d17] hover:border-zinc-600'
                          }`}
                        >
                          <p className={`text-base font-medium ${selectedSlot === slot.datetime ? 'text-[#C8F135]' : 'text-white'}`}>{time}</p>
                          <p className="text-[11px] mt-0.5 text-zinc-500">{slot.duration} min</p>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {selectedDay && selectedSlot && (
              <div className="space-y-4">
                <div className="flex items-start gap-3 rounded-xl border border-[#C8F135]/35 bg-[#C8F135]/5 p-4">
                  <CheckCircle className="size-4 shrink-0 text-[#C8F135] mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-[#C8F135]">{t('coaches.selectedAppointment')}</p>
                    <p className="text-white capitalize">
                      {selectedDay.toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', { weekday: 'long', day: 'numeric', month: 'long' })} {t('coaches.at')} {selectedSlot ? new Date(selectedSlot).toLocaleTimeString(locale === 'fr' ? 'fr-FR' : 'en-US', { hour: '2-digit', minute: '2-digit' }) : ''}
                    </p>
                  </div>
                </div>

                <textarea
                  value={msg}
                  onChange={e => setMsg(e.target.value)}
                  rows={3}
                  placeholder={t('coaches.optionalMessage')}
                  className="w-full resize-none rounded-xl border border-zinc-700 bg-[#1a1d17] px-4 py-3 text-sm text-white placeholder-zinc-500 focus:border-[#C8F135] focus:outline-none transition-colors"
                />

                <button
                  onClick={handleConfirm}
                  disabled={busy}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#C8F135] py-4 text-base font-medium text-black transition-colors hover:bg-[#d4f54d] disabled:opacity-60"
                >
                  {busy ? t('coaches.sending') : t('coaches.confirm')}
                </button>
                <p className="text-center text-xs text-zinc-600">
                  {t('coaches.emailConfirmation')}
                </p>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
