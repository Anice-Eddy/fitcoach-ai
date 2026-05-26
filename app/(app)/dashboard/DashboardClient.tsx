'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useUserStore } from '@/stores/userStore'
import { MetricsGrid }      from '@/components/dashboard/MetricsGrid'
import { WeightChart }      from '@/components/dashboard/WeightChart'
import { NutritionSummary } from '@/components/dashboard/NutritionSummary'
import { QuickActions }     from '@/components/dashboard/QuickActions'
import Link from 'next/link'
import { Dumbbell, ArrowRight, UserCheck, Calendar, MapPin, Star } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

interface WeightPoint { date: string; weight: number }
interface Metric { id: string; weightKg: number; date: string }

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
    city:            string | null
  }
  nextAppointment: {
    id: string; title: string; scheduledAt: string
    duration: number; status: string; meetLink: string | null
  } | null
  totalAppointments: number
}

const GOAL_SESSION: Record<string, string> = {
  WEIGHT_LOSS:     'Cardio + circuit training',
  MUSCLE_GAIN:     'Séance de force',
  MAINTENANCE:     'Séance équilibrée',
  ENDURANCE:       'Séance cardio-endurance',
  FLEXIBILITY:     'Mobilité & étirements',
  GENERAL_FITNESS: 'Séance complète',
}

const STATUS_COLOR: Record<string, string> = {
  PENDING:   'text-amber-400 bg-amber-400/10',
  PROPOSED:  'text-blue-400 bg-blue-400/10',
  CONFIRMED: 'text-emerald-400 bg-emerald-400/10',
}
const STATUS_LABEL: Record<string, string> = {
  PENDING:   'En attente', PROPOSED: 'Proposé', CONFIRMED: 'Confirmé',
}

function initials(name: string | null, email: string) {
  if (name) return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  return email.slice(0, 2).toUpperCase()
}

function CoachCard({ relation }: { relation: CoachRelation }) {
  const { coach, nextAppointment, totalAppointments, assignedAt } = relation
  const displayName = coach.name ?? `${coach.firstName} ${coach.lastName}`
  const avatar      = coach.avatarUrl ?? coach.image

  return (
    <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <UserCheck className="size-4 text-[#C8F135]" />
          Mon coach
        </h3>
        <span className="text-[10px] text-zinc-500">
          depuis {format(new Date(assignedAt), 'MMM yyyy', { locale: fr })}
        </span>
      </div>

      {/* Coach identity */}
      <div className="flex items-center gap-3">
        {avatar ? (
          <img src={avatar} alt={displayName} className="size-12 rounded-full object-cover" />
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
            <p className="text-[10px] text-zinc-500">ans exp.</p>
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
          <p className="text-[10px] text-zinc-500">rendez-vous</p>
        </div>
        <div className="rounded-xl bg-zinc-800 p-3 text-center">
          <p className="text-lg font-bold text-[#C8F135]">
            {nextAppointment ? format(new Date(nextAppointment.scheduledAt), 'd MMM', { locale: fr }) : '—'}
          </p>
          <p className="text-[10px] text-zinc-500">prochain RDV</p>
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
              {STATUS_LABEL[nextAppointment.status] ?? nextAppointment.status}
            </span>
          </div>
          <p className="text-[10px] text-zinc-500 mt-1 ml-5">
            {format(new Date(nextAppointment.scheduledAt), "d MMM yyyy 'à' HH:mm", { locale: fr })} · {nextAppointment.duration} min
          </p>
        </div>
      )}

      <Link
        href="/appointments"
        className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-zinc-700 text-zinc-300 text-xs font-medium hover:border-[#C8F135] hover:text-[#C8F135] transition-colors"
      >
        Voir mes rendez-vous <ArrowRight className="size-3.5" />
      </Link>
    </div>
  )
}

export function DashboardClient() {
  const { data: session }             = useSession()
  const { profile }                   = useUserStore()
  const [weightData, setWeightData]   = useState<WeightPoint[]>([])
  const [lastWeight, setLastWeight]   = useState<number | null>(null)
  const [loading, setLoading]         = useState(true)
  const [coaches, setCoaches]         = useState<CoachRelation[]>([])
  const [coachLoading, setCoachLoading] = useState(true)

  useEffect(() => {
    fetch('/api/user/metrics?limit=30')
      .then(res => res.json())
      .then((metrics: Metric[]) => {
        if (Array.isArray(metrics) && metrics.length > 0) {
          setLastWeight(metrics[0].weightKg)
          const sorted = [...metrics].reverse()
          setWeightData(sorted.map(m => ({
            date:   new Date(m.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }),
            weight: m.weightKg,
          })))
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  useEffect(() => {
    fetch('/api/user/my-coach')
      .then(r => r.ok ? r.json() : { coaches: [] })
      .then(d => setCoaches(Array.isArray(d.coaches) ? d.coaches : []))
      .catch(() => {})
      .finally(() => setCoachLoading(false))
  }, [])

  const streak      = 7
  const firstName   = profile?.firstName ?? session?.user?.name?.split(' ')[0] ?? 'Membre'
  const nextSession = profile?.fitnessGoal ? GOAL_SESSION[profile.fitnessGoal] : 'Séance du jour'

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">Bonjour {firstName} 👋</h2>
        <p className="text-sm text-zinc-400 mt-0.5">
          {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
      </div>

      <MetricsGrid profile={profile} lastWeight={lastWeight} streak={streak} isLoading={loading} />

      {weightData.length > 0 && (
        <WeightChart data={weightData} targetWeight={profile?.targetWeightKg} />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <NutritionSummary />
        </div>

        <div className="space-y-4">
          {/* Coach card — shown when a relation exists */}
          {!coachLoading && coaches.length > 0 && (
            coaches.map(rel => <CoachCard key={rel.relationId} relation={rel} />)
          )}

          {/* No coach yet — CTA */}
          {!coachLoading && coaches.length === 0 && (
            <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-5 text-center space-y-3">
              <Star className="size-8 text-zinc-600 mx-auto" />
              <p className="text-sm font-medium text-white">Pas encore de coach</p>
              <p className="text-xs text-zinc-500">Trouve un coach pour te faire accompagner.</p>
              <Link
                href="/coaches"
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-[#C8F135] text-zinc-900 text-sm font-bold hover:bg-[#d4f54d] transition-colors"
              >
                Trouver un coach <ArrowRight className="size-4" />
              </Link>
            </div>
          )}

          <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-5">
            <h3 className="text-sm font-semibold text-white mb-3">Prochaine séance</h3>
            <div className="flex items-center gap-3 mb-3">
              <div className="size-10 rounded-xl bg-[#C8F135]/10 flex items-center justify-center">
                <Dumbbell className="size-5 text-[#C8F135]" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">{nextSession}</p>
                <p className="text-xs text-zinc-400">
                  Niveau {profile?.fitnessLevel?.toLowerCase() ?? 'débutant'}
                </p>
              </div>
            </div>
            <Link
              href="/training"
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-[#C8F135] text-zinc-900 text-sm font-bold hover:bg-[#d4f54d] transition-colors"
            >
              Commencer <ArrowRight className="size-4" />
            </Link>
          </div>

          <QuickActions />
        </div>
      </div>
    </div>
  )
}
