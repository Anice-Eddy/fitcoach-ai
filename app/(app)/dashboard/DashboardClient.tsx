'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useUserStore } from '@/stores/userStore'
import { MetricsGrid }      from '@/components/dashboard/MetricsGrid'
import { WeightChart }      from '@/components/dashboard/WeightChart'
import { NutritionSummary } from '@/components/dashboard/NutritionSummary'
import { QuickActions }     from '@/components/dashboard/QuickActions'
import Link from 'next/link'
import { Dumbbell, ArrowRight, UserCheck, Calendar, MapPin, Star, Zap } from 'lucide-react'
import { format } from 'date-fns'
import { enUS, fr } from 'date-fns/locale'
import { useLocale } from '@/contexts/LocaleContext'

interface WeightPoint { date: string; weight: number }
interface Metric { id: string; weightKg?: number | null; waterLiters?: number | null; date: string }

interface CoachRelation {
  relationId:      string
  assignedAt:      string
  coachProfileId:  string
  coach: {
    id:              string
    name:            string | null
    email:           string
    image:           string | null
    firstName:       string
    lastName:        string
    bio:             string | null
    avatarUrl:       string | null
    specialties:     string[]
    yearsExperience: number | null
    publicRating:    number | null
    publicRatingCount: number
    city:            string | null
  }
  nextAppointment: {
    id: string; title: string; scheduledAt: string
    duration: number; status: string; meetLink: string | null
  } | null
  totalAppointments: number
}

const GOAL_SESSION: Record<string, string> = {
  WEIGHT_LOSS:     'dashboard.goalSessions.weightLoss',
  MUSCLE_GAIN:     'dashboard.goalSessions.muscleGain',
  MAINTENANCE:     'dashboard.goalSessions.maintenance',
  ENDURANCE:       'dashboard.goalSessions.endurance',
  FLEXIBILITY:     'dashboard.goalSessions.flexibility',
  GENERAL_FITNESS: 'dashboard.goalSessions.generalFitness',
}

const STATUS_COLOR: Record<string, string> = {
  PENDING:   'text-amber-400 bg-amber-400/10',
  PROPOSED:  'text-blue-400 bg-blue-400/10',
  CONFIRMED: 'text-emerald-400 bg-emerald-400/10',
}
const STATUS_LABEL: Record<string, string> = {
  PENDING: 'coaching.pending', PROPOSED: 'coaching.proposed', CONFIRMED: 'coaching.confirmed',
}

function localDateKey(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// Returns a 2-letter uppercase initials string from a display name or email fallback.
function initials(name: string | null, email: string) {
  if (name) return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  return email.slice(0, 2).toUpperCase()
}

// Renders a card showing assigned coach info, next appointment, total sessions, and a booking link.
function CoachCard({ relation }: { relation: CoachRelation }) {
  const { locale, t } = useLocale()
  const { coach, nextAppointment, totalAppointments, assignedAt } = relation
  const dateLocale = locale === 'fr' ? fr : enUS
  const displayName = coach.name ?? `${coach.firstName} ${coach.lastName}`
  const avatar      = coach.avatarUrl ?? coach.image

  return (
    <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <UserCheck className="size-4 text-[#C8F135]" />
          {t('dashboard.coach')}
        </h3>
        <span className="text-[10px] text-zinc-500">
          {t('dashboard.since')} {format(new Date(assignedAt), 'MMM yyyy', { locale: dateLocale })}
        </span>
      </div>

      {/* Coach identity */}
      <div className="flex items-center gap-3">
        {avatar ? (
          <Image src={avatar} alt={displayName} width={48} height={48} className="size-12 rounded-full object-cover" />
        ) : (
          <div className="size-12 rounded-full bg-[#C8F135]/10 flex items-center justify-center text-sm font-bold text-[#C8F135]">
            {initials(coach.name, coach.email)}
          </div>
        )}
        <div className="min-w-0">
          <p className="text-base font-semibold text-white truncate">{displayName}</p>
          {coach.city && (
            <p className="text-xs text-zinc-400 flex items-center gap-1">
              <MapPin className="size-3" /> {coach.city}
            </p>
          )}
        </div>
      {coach.yearsExperience != null && (
        <div className="ml-auto text-right shrink-0">
          <p className="text-lg font-bold text-[#C8F135]">{coach.yearsExperience}</p>
          <p className="text-[10px] text-zinc-500">{t('dashboard.yearsExperienceShort')}</p>
        </div>
      )}
      {coach.yearsExperience == null && coach.publicRating != null && (
        <div className="ml-auto text-right shrink-0">
          <p className="text-lg font-bold text-[#C8F135]">{coach.publicRating.toFixed(1)}</p>
          <p className="text-[10px] text-zinc-500">{t('dashboard.stars')}</p>
        </div>
      )}
      </div>

      {/* Specialties */}
      {coach.specialties.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {coach.specialties.slice(0, 3).map(s => (
            <span key={s} className="text-[10px] bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded-full">{s}</span>
          ))}
          {coach.specialties.length > 3 && (
            <span className="text-[10px] text-zinc-500">+{coach.specialties.length - 3}</span>
          )}
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-xl bg-zinc-800 p-3 text-center">
          <p className="text-lg font-bold text-white">{totalAppointments}</p>
          <p className="text-[10px] text-zinc-500">{t('dashboard.appointments')}</p>
        </div>
        <div className="rounded-xl bg-zinc-800 p-3 text-center">
          <p className="text-lg font-bold text-[#C8F135]">
            {nextAppointment ? format(new Date(nextAppointment.scheduledAt), 'd MMM', { locale: dateLocale }) : '—'}
          </p>
          <p className="text-[10px] text-zinc-500">{t('dashboard.nextAppointment')}</p>
        </div>
      </div>

      {/* Next appointment */}
      {nextAppointment && (
        <div className="rounded-xl border border-zinc-700 bg-zinc-800/60 px-3 py-2.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <Calendar className="size-3.5 text-zinc-400 shrink-0" />
              <p className="text-xs text-white font-medium truncate">{nextAppointment.title}</p>
            </div>
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${STATUS_COLOR[nextAppointment.status] ?? 'text-zinc-400 bg-zinc-700'}`}>
              {STATUS_LABEL[nextAppointment.status] ? t(STATUS_LABEL[nextAppointment.status]) : nextAppointment.status}
            </span>
          </div>
          <p className="text-[10px] text-zinc-500 mt-1 ml-5">
            {format(new Date(nextAppointment.scheduledAt), 'd MMM yyyy', { locale: dateLocale })} {t('dashboard.dateAt')} {format(new Date(nextAppointment.scheduledAt), 'HH:mm', { locale: dateLocale })} · {nextAppointment.duration} min
          </p>
        </div>
      )}

      <Link
        href="/appointments"
        className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-zinc-700 text-zinc-300 text-xs font-medium hover:border-[#C8F135] hover:text-[#C8F135] transition-colors"
      >
        {t('dashboard.viewAppointments')} <ArrowRight className="size-3.5" />
      </Link>
    </div>
  )
}

/** Member dashboard: fetches and displays daily tasks, metrics, weight chart, nutrition summary, quick actions, and assigned coach cards. */
export function DashboardClient() {
  const { locale, t } = useLocale()
  const { data: session, status }     = useSession()
  const { profile, profileChecked }   = useUserStore()
  const router                        = useRouter()
  const [weightData, setWeightData]   = useState<WeightPoint[]>([])
  const [lastWeight, setLastWeight]   = useState<number | null>(null)
  const [lastWaterLiters, setLastWaterLiters] = useState<number | null>(null)
  const [loading, setLoading]         = useState(true)
  const [coaches, setCoaches]         = useState<CoachRelation[]>([])
  const [coachLoading, setCoachLoading] = useState(true)

  useEffect(() => {
    if (status === 'authenticated' && profileChecked && !profile) {
      router.replace('/onboarding')
    }
  }, [status, profileChecked, profile, router])

  useEffect(() => {
    fetch('/api/user/metrics?limit=30')
      .then(res => res.json())
      .then((metrics: Metric[]) => {
        if (Array.isArray(metrics) && metrics.length > 0) {
          const todayKey = localDateKey(new Date())
          const todayMetric = metrics.find(metric => localDateKey(new Date(metric.date)) === todayKey)
          const latestWeightMetric = metrics.find(metric => typeof metric.weightKg === 'number')
          setLastWeight(latestWeightMetric?.weightKg ?? null)
          setLastWaterLiters(todayMetric?.waterLiters ?? null)
          // Weightless metrics remain useful elsewhere, but the weight chart ignores them.
          const sorted = [...metrics].reverse().filter((metric): metric is Metric & { weightKg: number } => typeof metric.weightKg === 'number')
          setWeightData(sorted.map(m => ({
            date:   new Date(m.date).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', { day: '2-digit', month: '2-digit' }),
            weight: m.weightKg,
          })))
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [locale])

  useEffect(() => {
    fetch('/api/user/my-coach')
      .then(r => r.ok ? r.json() : { coaches: [] })
      .then(d => setCoaches(Array.isArray(d.coaches) ? d.coaches : []))
      .catch(() => {})
      .finally(() => setCoachLoading(false))
  }, [])

  const streak      = 7
  const firstName   = profile?.firstName ?? session?.user?.name?.split(' ')[0] ?? t('auth.member')
  const nextSession = profile?.fitnessGoal ? t(GOAL_SESSION[profile.fitnessGoal] ?? 'dashboard.goalSessions.fallback') : t('dashboard.goalSessions.fallback')
  const fitnessLevel = profile?.fitnessLevel ? t(`dashboard.fitnessLevels.${profile.fitnessLevel.toLowerCase()}`) : t('dashboard.fitnessLevels.beginner')

  return (
    <div className="space-y-6">
      <div>
        <h2 className="flex items-center gap-2 text-xl font-bold text-white">
          {t('dashboard.greeting')} {firstName}
          <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-xl border border-[#C8F135]/30 bg-[#C8F135]/10 text-[#C8F135] shadow-[0_0_18px_rgba(200,241,53,0.18)]">
            <Zap className="size-4" aria-hidden="true" />
          </span>
        </h2>
        <p className="text-sm text-zinc-400 mt-0.5">
          {new Date().toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
      </div>

      <MetricsGrid profile={profile} lastWeight={lastWeight} lastWaterLiters={lastWaterLiters} streak={streak} isLoading={loading} />

      {weightData.length > 0 && (
        <WeightChart data={weightData} targetWeight={profile?.targetWeightKg} />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <NutritionSummary />
        </div>

        <div className="space-y-4">
          {/* Coach card shown when a relation exists */}
          {!coachLoading && coaches.length > 0 && (
            coaches.map(rel => <CoachCard key={rel.relationId} relation={rel} />)
          )}

          {/* Empty coach state with CTA */}
          {!coachLoading && coaches.length === 0 && (
            <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-5 text-center space-y-3">
              <Star className="size-8 text-zinc-600 mx-auto" />
              <p className="text-sm font-medium text-white">{t('dashboard.noCoach')}</p>
              <p className="text-xs text-zinc-500">{t('dashboard.noCoachDescription')}</p>
              <Link
                href="/coaches"
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-[#C8F135] text-zinc-900 text-sm font-bold hover:bg-[#d4f54d] transition-colors"
              >
                {t('dashboard.findCoach')} <ArrowRight className="size-4" />
              </Link>
            </div>
          )}

          <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-5">
            <h3 className="text-sm font-semibold text-white mb-3">{t('dashboard.nextSession')}</h3>
            <div className="flex items-center gap-3 mb-3">
              <div className="size-10 rounded-xl bg-[#C8F135]/10 flex items-center justify-center">
                <Dumbbell className="size-5 text-[#C8F135]" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">{nextSession}</p>
                <p className="text-xs text-zinc-400">
                  {t('dashboard.level')} {fitnessLevel}
                </p>
              </div>
            </div>
            <Link
              href="/training"
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-[#C8F135] text-zinc-900 text-sm font-bold hover:bg-[#d4f54d] transition-colors"
            >
              {t('dashboard.start')} <ArrowRight className="size-4" />
            </Link>
          </div>

          <QuickActions />
        </div>
      </div>
    </div>
  )
}
