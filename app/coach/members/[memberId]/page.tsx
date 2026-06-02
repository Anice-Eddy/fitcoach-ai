import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, MessageSquare, CalendarPlus, Heart, HeartPulse, Wind, Activity, Zap, Droplets } from 'lucide-react'
import { auth } from '@/lib/auth/auth'
import { prisma } from '@/lib/prisma/client'
import { NotesEditor } from './NotesEditor'
import { ProfileEditor } from './ProfileEditor'

type WorkoutStatus = 'done' | 'rest' | 'active' | 'planned' | 'missed'

const STATUS_STYLE: Record<WorkoutStatus, { dot: string; text: string; badge: string; bg: string }> = {
  done:    { dot: 'bg-emerald-400', text: 'text-emerald-400', badge: 'Complété',  bg: 'bg-emerald-400/5' },
  rest:    { dot: 'bg-zinc-600',    text: 'text-zinc-500',    badge: 'Repos',     bg: '' },
  active:  { dot: 'bg-[#C8F135]',  text: 'text-[#C8F135]',  badge: 'En cours',  bg: 'bg-[#C8F135]/5' },
  planned: { dot: 'bg-zinc-600',    text: 'text-zinc-400',   badge: 'Planifié',  bg: '' },
  missed:  { dot: 'bg-red-400',     text: 'text-red-400',    badge: 'Manqué',    bg: 'bg-red-400/5' },
}

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border border-zinc-700 bg-[#1a1d17] ${className}`}>
      {children}
    </div>
  )
}

function Label({ children }: { children: React.ReactNode }) {
  return <p className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase mb-3">{children}</p>
}

/** Server component for the member detail view: fetches member data from the API and renders ProfileEditor and NotesEditor. */
export default async function MemberDetailPage({ params }: { params: { memberId: string } }) {
  const session = await auth()
  if (!session?.user?.id) redirect('/auth/signin')

  const coach = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { coachProfile: true },
  })
  if (!coach?.coachProfile) redirect('/dashboard')

  // Verify membership
  const membership = await prisma.coachMember.findUnique({
    where: { coachId_memberId: { coachId: coach.coachProfile.id, memberId: params.memberId } },
  })
  if (!membership) notFound()

  const member = await prisma.user.findUnique({
    where: { id: params.memberId },
    include: {
      profile: true,
      bodyMetrics: { orderBy: { date: 'desc' }, take: 1 },
      workoutSessions: {
        orderBy: { createdAt: 'desc' },
        take: 7,
        select: { id: true, name: true, status: true, completedAt: true, scheduledAt: true, startedAt: true, durationMinutes: true, caloriesBurned: true },
      },
    },
  })
  if (!member) notFound()

  const notes = await prisma.coachNote.findMany({
    where: { coachId: coach.coachProfile.id, memberId: params.memberId },
    orderBy: { createdAt: 'desc' },
  })

  const p = member.profile
  const lastWeight = member.bodyMetrics.find(metric => typeof metric.weightKg === 'number')?.weightKg ?? null

  // Map sessions to display format
  const sessions = member.workoutSessions.map(s => {
    let status: WorkoutStatus = 'planned'
    if (s.status === 'COMPLETED') status = 'done'
    else if (s.status === 'IN_PROGRESS') status = 'active'
    else if (s.status === 'SKIPPED') status = 'missed'
    return { ...s, displayStatus: status }
  })

  const GOAL_LABELS: Record<string, string> = {
    WEIGHT_LOSS: 'Perte de poids', MUSCLE_GAIN: 'Prise de masse',
    MAINTENANCE: 'Maintien', ENDURANCE: 'Endurance',
    FLEXIBILITY: 'Flexibilité', GENERAL_FITNESS: 'Forme générale',
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <section className="rounded-lg bg-[#0b0d09] p-8">
        {/* Header */}
        <div className="border-b border-zinc-700 pb-6">
          <Link href="/coach/members" className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-white mb-4 transition-colors">
            <ArrowLeft className="size-3.5" /> Retour aux membres
          </Link>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-[22px] font-medium text-white">Fiche client — {member.name ?? member.email}</h1>
              <p className="text-xs text-zinc-500 mt-0.5">
                Suivi depuis le {new Date(membership.assignedAt).toLocaleDateString('fr-FR')}
                {lastWeight && ` · Dernier poids: ${lastWeight} kg`}
              </p>
            </div>
            <div className="flex gap-2 shrink-0">
              <Link
                href={`/coach/appointments?memberId=${member.id}`}
                className="flex items-center gap-1.5 rounded-full border border-zinc-700 px-5 py-2 text-xs text-zinc-300 transition-colors hover:border-zinc-600 hover:text-white"
              >
                <CalendarPlus className="size-3.5" /> Planifier RDV
              </Link>
              <a
                href={`mailto:${member.email}`}
                className="flex items-center gap-1.5 rounded-full bg-[#C8F135] px-5 py-2 text-xs font-medium text-black transition-colors hover:bg-[#d4f54d]"
              >
                <MessageSquare className="size-3.5" /> Contacter
              </a>
            </div>
          </div>
        </div>

        {/* Three-column grid */}
        <div className="mt-7 grid grid-cols-1 gap-7 lg:grid-cols-3">

          {/* Column 1: profile + notes */}
          <div className="space-y-4">
            <Card className="p-4">
              <ProfileEditor memberId={member.id} profile={p ? {
                firstName: p.firstName, age: p.age, gender: p.gender,
                weightKg: p.weightKg, heightCm: p.heightCm, targetWeightKg: p.targetWeightKg,
                activityLevel: p.activityLevel, fitnessGoal: p.fitnessGoal, fitnessLevel: p.fitnessLevel,
                trainingDaysPerWeek: p.trainingDaysPerWeek, availableEquipment: p.availableEquipment as string[],
                bmi: p.bmi, tdee: p.tdee,
              } : null} />
            </Card>

            <Card className="p-4">
              <NotesEditor
                memberId={member.id}
                initialNotes={notes.map(n => ({
                  id: n.id, title: n.title, content: n.content,
                  category: n.category, createdAt: n.createdAt.toISOString(),
                }))}
              />
            </Card>
          </div>

          {/* Column 2: nutrition plan */}
          <div className="space-y-4">
            <Card className="p-4">
              <Label>Plan nutrition recommandé</Label>
              {p ? (
                <>
                  <div className="mb-3">
                    <p className="text-xs text-zinc-500 mb-0.5">Calories cibles</p>
                    <p className="font-mono text-lg font-medium text-white">
                      {p.recommendedCalories
                        ? `${Math.round(p.recommendedCalories).toLocaleString('fr-FR')} kcal`
                        : '—'}
                    </p>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      TDEE: {p.tdee ? `${Math.round(p.tdee).toLocaleString('fr-FR')} kcal` : '—'}
                    </p>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: 'Protéines', value: p.recommendedProteinG, color: 'text-[#C8F135]' },
                      { label: 'Glucides',  value: p.recommendedCarbsG,   color: 'text-blue-400' },
                      { label: 'Lipides',   value: p.recommendedFatG,     color: 'text-pink-400' },
                    ].map(m => (
                      <div key={m.label} className="text-center p-2.5 rounded-lg bg-zinc-800/60 border border-zinc-700">
                        <p className={`font-mono text-base font-medium ${m.color}`}>
                          {m.value ? `${Math.round(m.value)}g` : '—'}
                        </p>
                        <p className="text-[10px] text-zinc-500 mt-0.5">{m.label}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 rounded-lg border border-zinc-700 px-3 py-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-zinc-500">Objectif</span>
                      <span className="text-[#C8F135] font-medium">{GOAL_LABELS[p.fitnessGoal] ?? p.fitnessGoal}</span>
                    </div>
                    {p.targetWeightKg && (
                      <div className="flex justify-between text-xs mt-1">
                        <span className="text-zinc-500">Poids cible</span>
                        <span className="text-white font-medium">{p.targetWeightKg} kg</span>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <p className="text-xs text-zinc-600 italic">Profil non renseigné — plan non calculé.</p>
              )}
            </Card>

            {/* Composition corporelle */}
            {member.bodyMetrics.length > 0 && (
              <Card className="p-4">
                <Label>Dernière mensuration</Label>
                <div className="space-y-1.5">
                  {[
                    { k: 'Poids',          v: member.bodyMetrics[0].weightKg    ? `${member.bodyMetrics[0].weightKg} kg`    : '—' },
                    { k: 'Masse grasse',   v: member.bodyMetrics[0].bodyFatPct  ? `${member.bodyMetrics[0].bodyFatPct}%`   : '—' },
                    { k: 'Masse musc.',    v: member.bodyMetrics[0].muscleMassKg ? `${member.bodyMetrics[0].muscleMassKg} kg` : '—' },
                    { k: 'Tour de taille', v: member.bodyMetrics[0].waistCm     ? `${member.bodyMetrics[0].waistCm} cm`    : '—' },
                    { k: 'Pas',            v: member.bodyMetrics[0].steps       ? member.bodyMetrics[0].steps.toLocaleString('fr-FR') : '—' },
                    { k: 'Sommeil',        v: member.bodyMetrics[0].sleepHours  ? `${member.bodyMetrics[0].sleepHours} h`  : '—' },
                    { k: 'Date',           v: new Date(member.bodyMetrics[0].date).toLocaleDateString('fr-FR') },
                  ].map(r => (
                    <div key={r.k} className="flex justify-between text-xs py-1 border-b border-zinc-800/60 last:border-0">
                      <span className="text-zinc-500">{r.k}</span>
                      <span className="text-white font-mono">{r.v}</span>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Apple Health — données cardiovasculaires */}
            {member.bodyMetrics.length > 0 && (
              member.bodyMetrics[0].heartRateAvg ||
              member.bodyMetrics[0].restingHeartRate ||
              member.bodyMetrics[0].vo2Max ||
              member.bodyMetrics[0].hrv ||
              member.bodyMetrics[0].spo2 ||
              member.bodyMetrics[0].caloriesActive
            ) && (
              <Card className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="size-4 rounded-full bg-red-500 flex items-center justify-center">
                    <Heart className="size-2.5 text-white fill-white" />
                  </div>
                  <Label>Apple Health</Label>
                </div>
                <div className="space-y-1.5">
                  {member.bodyMetrics[0].heartRateAvg && (
                    <div className="flex justify-between text-xs py-1 border-b border-zinc-800/60">
                      <span className="flex items-center gap-1.5 text-zinc-500">
                        <HeartPulse className="size-3 text-red-400" /> FC moyenne
                      </span>
                      <span className="text-red-300 font-mono">{member.bodyMetrics[0].heartRateAvg} bpm</span>
                    </div>
                  )}
                  {member.bodyMetrics[0].restingHeartRate && (
                    <div className="flex justify-between text-xs py-1 border-b border-zinc-800/60">
                      <span className="flex items-center gap-1.5 text-zinc-500">
                        <Heart className="size-3 text-orange-400" /> FC repos
                      </span>
                      <span className={`font-mono ${
                        member.bodyMetrics[0].restingHeartRate < 60 ? 'text-emerald-400' :
                        member.bodyMetrics[0].restingHeartRate < 70 ? 'text-amber-400' : 'text-red-400'
                      }`}>
                        {member.bodyMetrics[0].restingHeartRate} bpm
                        {member.bodyMetrics[0].restingHeartRate < 60 ? <span className="ml-1 text-emerald-400 text-[10px]">Bon</span> : member.bodyMetrics[0].restingHeartRate > 70 ? <span className="ml-1 text-amber-400 text-[10px]">Élevé</span> : null}
                      </span>
                    </div>
                  )}
                  {member.bodyMetrics[0].caloriesActive && (
                    <div className="flex justify-between text-xs py-1 border-b border-zinc-800/60">
                      <span className="flex items-center gap-1.5 text-zinc-500">
                        <Zap className="size-3 text-amber-400" /> Cal. actives
                      </span>
                      <span className="text-amber-300 font-mono">{member.bodyMetrics[0].caloriesActive} kcal</span>
                    </div>
                  )}
                  {member.bodyMetrics[0].vo2Max && (
                    <div className="flex justify-between text-xs py-1 border-b border-zinc-800/60">
                      <span className="flex items-center gap-1.5 text-zinc-500">
                        <Wind className="size-3 text-emerald-400" /> VO₂ max
                      </span>
                      <span className="text-emerald-300 font-mono">{member.bodyMetrics[0].vo2Max.toFixed(1)} ml/kg/min</span>
                    </div>
                  )}
                  {member.bodyMetrics[0].hrv && (
                    <div className="flex justify-between text-xs py-1 border-b border-zinc-800/60">
                      <span className="flex items-center gap-1.5 text-zinc-500">
                        <Activity className="size-3 text-violet-400" /> VFC / HRV
                      </span>
                      <span className={`font-mono ${
                        member.bodyMetrics[0].hrv >= 60 ? 'text-emerald-400' :
                        member.bodyMetrics[0].hrv >= 40 ? 'text-amber-400' : 'text-red-400'
                      }`}>
                        {Math.round(member.bodyMetrics[0].hrv)} ms
                        {member.bodyMetrics[0].hrv >= 60 ? <span className="ml-1 text-emerald-400 text-[10px]">Bon</span> : member.bodyMetrics[0].hrv < 40 ? <span className="ml-1 text-amber-400 text-[10px]">Faible</span> : null}
                      </span>
                    </div>
                  )}
                  {member.bodyMetrics[0].spo2 && (
                    <div className="flex justify-between text-xs py-1">
                      <span className="flex items-center gap-1.5 text-zinc-500">
                        <Droplets className="size-3 text-blue-400" /> SpO₂
                      </span>
                      <span className={`font-mono ${
                        member.bodyMetrics[0].spo2 >= 95 ? 'text-emerald-400' : 'text-red-400'
                      }`}>
                        {member.bodyMetrics[0].spo2.toFixed(1)}%
                        {member.bodyMetrics[0].spo2 < 95 ? <span className="ml-1 text-red-400 text-[10px]">Bas</span> : null}
                      </span>
                    </div>
                  )}
                </div>
              </Card>
            )}
          </div>

          {/* Column 3: recent sessions */}
          <div className="space-y-4">
            <Card className="p-4">
              <Label>Séances récentes</Label>
              {sessions.length === 0 ? (
                <p className="text-xs text-zinc-600 italic">Aucune séance enregistrée.</p>
              ) : (
                <div className="space-y-1.5">
                  {sessions.map(s => {
                    const st = STATUS_STYLE[s.displayStatus]
                    return (
                      <div key={s.id} className={`flex items-center justify-between rounded-lg bg-[#0b0d09] px-3 py-2 ${st.bg}`}>
                        <div className="flex items-center gap-2 min-w-0">
                          <div className={`size-1.5 rounded-full shrink-0 ${st.dot}`} />
                          <div className="min-w-0">
                            <p className="text-xs text-zinc-300 font-medium truncate">{s.name}</p>
                            {s.completedAt && (
                              <p className="text-[10px] text-zinc-600">
                                {new Date(s.completedAt).toLocaleDateString('fr-FR')}
                                {s.durationMinutes && ` · ${s.durationMinutes} min`}
                                {s.caloriesBurned && ` · ${s.caloriesBurned} kcal`}
                              </p>
                            )}
                          </div>
                        </div>
                        <span className={`text-[10px] font-semibold shrink-0 ml-2 ${st.text}`}>
                          {st.badge}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}
            </Card>
          </div>
        </div>
      </section>
    </div>
  )
}
