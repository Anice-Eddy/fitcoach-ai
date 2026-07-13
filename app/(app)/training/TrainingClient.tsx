'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useUserStore }      from '@/stores/userStore'
import { useTrainingStore }  from '@/stores/trainingStore'
import { generateProgram }   from '@/lib/training/generate-program'
import { WorkoutCard }       from '@/components/training/WorkoutCard'
import { EmptyState }        from '@/components/ui/EmptyState'
import { ListSkeleton }      from '@/components/ui/LoadingSkeleton'
import type { WorkoutSession } from '@/types'
import { Dumbbell, RefreshCw } from 'lucide-react'
import { useLocale } from '@/contexts/LocaleContext'

interface DBExercise {
  id: string
  name: string
  description: string | null
  instructions: string[]
  muscleGroups: string[]
  equipment: string[]
  imageUrl: string | null
  videoUrl: string | null
  isCompound: boolean
}
interface DBExerciseLog {
  id: string
  order: number
  sets: number
  reps: number
  weightKg: number | null
  restSeconds: number | null
  tempo: string | null
  rpe: number | null
  isCompleted: boolean
  exercise: DBExercise
}
interface DBSession {
  id: string
  name: string
  status: string
  dayOfWeek: number | null
  durationMinutes: number | null
  exerciseLogs?: DBExerciseLog[]
}
interface DBProgram {
  id: string
  name: string
  description: string | null
  currentWeek: number
  weeksTotal: number
  sessions: DBSession[]
  ai?: { generated: boolean; provider: string }
}

function mapPersistedExercises(session: DBSession): WorkoutSession['exercises'] {
  return (session.exerciseLogs ?? []).map((log) => ({
    id:           log.exercise.id,
    name:         log.exercise.name,
    description:  log.exercise.description ?? undefined,
    instructions: log.exercise.instructions,
    muscleGroups: log.exercise.muscleGroups as WorkoutSession['exercises'][number]['muscleGroups'],
    equipment:    log.exercise.equipment as WorkoutSession['exercises'][number]['equipment'],
    imageUrl:     log.exercise.imageUrl ?? undefined,
    videoUrl:     log.exercise.videoUrl ?? undefined,
    isCompound:   log.exercise.isCompound,
    order:        log.order,
    sets:         log.sets,
    reps:         log.reps,
    weightKg:     log.weightKg,
    restSeconds:  log.restSeconds ?? 90,
    tempo:        log.tempo ?? undefined,
    rpe:          log.rpe ?? undefined,
    isCompleted:  log.isCompleted,
    // Persisted cardio exercises use session duration as a fallback.
    durationMinutes: log.exercise.muscleGroups.includes('CARDIO') ? session.durationMinutes ?? undefined : undefined,
  }))
}

/** Interactive training view: fetches the active workout program and renders each session with exercise details and status controls. */
export function TrainingClient() {
  const { t, locale } = useLocale()
  const { profile }     = useUserStore()
  const { programCache, setProgramCache, clearProgramCache, isProgramCacheFresh } = useTrainingStore()

  const [sessions,     setSessions]     = useState<WorkoutSession[]>(programCache?.sessions ?? [])
  const [programName,  setProgramName]  = useState(programCache?.programName ?? '')
  const [programDescription, setProgramDescription] = useState<string | null>(programCache?.programDescription ?? null)
  const [aiMeta, setAiMeta] = useState<DBProgram['ai'] | null>(programCache?.ai ?? null)
  const [programWeek,  setProgramWeek]  = useState(programCache?.programWeek ?? { current: 1, total: 8 })
  const [loading,      setLoading]      = useState(!isProgramCacheFresh())
  const [error,        setError]        = useState<string | null>(null)

  // Ref to avoid double-fetch in React Strict Mode during development.
  const fetchingRef = useRef(false)

  // Serialize equipment to prevent array reference changes from destabilizing useCallback.
  const equipmentKey = JSON.stringify(profile?.availableEquipment ?? [])

  const fetchAndCache = useCallback((force = false) => {
    if (!profile?.fitnessGoal || !profile?.fitnessLevel) {
      setLoading(false)
      return
    }
    // Use cache when fresh and not forced.
    if (!force && isProgramCacheFresh() && programCache) {
      setSessions(programCache.sessions)
      setProgramName(programCache.programName)
      setProgramWeek(programCache.programWeek)
      setLoading(false)
      return
    }
    if (fetchingRef.current) return
    fetchingRef.current = true
    setLoading(true)
    setError(null)

    fetch('/api/user/training')
      .then(res => {
        if (!res.ok) throw new Error('Failed')
        return res.json() as Promise<DBProgram>
      })
      .then(program => {
        const generated = generateProgram({
          fitnessGoal:         profile.fitnessGoal!,
          fitnessLevel:        profile.fitnessLevel!,
          trainingDaysPerWeek: profile.trainingDaysPerWeek ?? 3,
          availableEquipment:  profile.availableEquipment ?? [],
          locale,
        })

        const combined: WorkoutSession[] = program.sessions.map(dbSess => {
          const gen = generated.sessions.find(s => s.name === dbSess.name)
            ?? generated.sessions[dbSess.dayOfWeek ?? 0]
            ?? generated.sessions[0]
          const persistedExercises = mapPersistedExercises(dbSess)
          return {
            ...gen,
            id:              dbSess.id,
            status:          dbSess.status as WorkoutSession['status'],
            durationMinutes: dbSess.durationMinutes ?? gen.durationMinutes,
            exercises:       persistedExercises.length > 0 ? persistedExercises : gen.exercises,
          }
        })

        const cache = {
          sessions:    combined,
          programName: program.name,
          programDescription: program.description ?? null,
          ai:          program.ai ?? null,
          programWeek: { current: program.currentWeek, total: program.weeksTotal },
          cachedAt:    Date.now(),
        }
        setProgramCache(cache)
        setSessions(combined)
        setProgramName(program.name)
        setProgramDescription(program.description ?? null)
        setAiMeta(program.ai ?? null)
        setProgramWeek({ current: program.currentWeek, total: program.weeksTotal })
        setLoading(false)
      })
      .catch(() => {
        setError(t('training.loadError'))
        setLoading(false)
      })
      .finally(() => { fetchingRef.current = false })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.fitnessGoal, profile?.fitnessLevel, profile?.trainingDaysPerWeek, equipmentKey, locale, t])

  useEffect(() => { fetchAndCache() }, [fetchAndCache])

  const regenerate = async () => {
    clearProgramCache()
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/user/training', { method: 'POST' })
      if (!res.ok) throw new Error('Failed')
      const program = await res.json() as DBProgram
      const generated = generateProgram({
        fitnessGoal:         profile!.fitnessGoal!,
        fitnessLevel:        profile!.fitnessLevel!,
        trainingDaysPerWeek: profile!.trainingDaysPerWeek ?? 3,
        availableEquipment:  profile!.availableEquipment ?? [],
        locale,
      })
      const combined: WorkoutSession[] = program.sessions.map(dbSess => {
        const gen = generated.sessions.find(s => s.name === dbSess.name)
          ?? generated.sessions[dbSess.dayOfWeek ?? 0]
          ?? generated.sessions[0]
        const persistedExercises = mapPersistedExercises(dbSess)
        return {
          ...gen,
          id:              dbSess.id,
          status:          dbSess.status as WorkoutSession['status'],
          durationMinutes: dbSess.durationMinutes ?? gen.durationMinutes,
          exercises:       persistedExercises.length > 0 ? persistedExercises : gen.exercises,
        }
      })
      const cache = {
        sessions:    combined,
        programName: program.name,
        programDescription: program.description ?? null,
        ai:          program.ai ?? null,
        programWeek: { current: program.currentWeek, total: program.weeksTotal },
        cachedAt:    Date.now(),
      }
      setProgramCache(cache)
      setSessions(combined)
      setProgramName(program.name)
      setProgramDescription(program.description ?? null)
      setAiMeta(program.ai ?? null)
      setProgramWeek({ current: program.currentWeek, total: program.weeksTotal })
      setLoading(false)
    } catch {
      setError(t('training.regenerationError'))
      setLoading(false)
    }
  }

  // Update local state if the cache changes, for example from another tab.
  useEffect(() => {
    if (programCache && isProgramCacheFresh()) {
      setSessions(programCache.sessions)
      setProgramName(programCache.programName)
      setProgramDescription(programCache.programDescription ?? null)
      setAiMeta(programCache.ai ?? null)
      setProgramWeek(programCache.programWeek)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [programCache])

  if (loading) return <ListSkeleton rows={4} />

  if (!profile?.fitnessGoal || !profile?.fitnessLevel) {
    return (
      <EmptyState
        icon={<Dumbbell className="size-6" />}
        title={t('training.noProfile')}
        description={t('training.noProfileDescription')}
        action={{ label: t('training.startOnboarding'), href: '/onboarding' }}
      />
    )
  }

  if (error) {
    return (
      <EmptyState
        icon={<Dumbbell className="size-6" />}
        title={t('training.loadingErrorTitle')}
        description={error}
        action={{ label: t('common.retry'), href: '/training' }}
      />
    )
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-5">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-base font-bold text-white">{programName}</h2>
            <p className="text-sm text-zinc-400 mt-0.5">{t('training.week')} {programWeek.current} / {programWeek.total}</p>
            {programDescription && (
              <p className="mt-2 max-w-3xl text-xs leading-5 text-zinc-500">{programDescription}</p>
            )}
            {aiMeta && (
              <span className="mt-3 inline-flex rounded-full border border-[#C8F135]/30 bg-[#C8F135]/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-[#C8F135]">
                {aiMeta.generated ? `${t('training.aiAssisted')} · ${aiMeta.provider}` : t('training.localGeneration')}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={regenerate}
            aria-label={t('training.regenerateAria')}
            className="flex items-center gap-1.5 text-xs text-zinc-400 transition-colors hover:text-white"
          >
            <RefreshCw className="size-3.5" /> {t('training.regenerate')}
          </button>
        </div>
        <div className="mt-4 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
          <div className="h-full bg-[#C8F135] rounded-full"
            style={{ width: `${(programWeek.current / programWeek.total) * 100}%` }} />
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-white mb-3">
          {t('training.sessions')} ({sessions.length})
        </h3>
        {sessions.length === 0 ? (
          <EmptyState
            icon={<Dumbbell className="size-6" />}
            title={t('training.noSessionsTitle')}
            description={t('training.noSessionsDescription')}
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {(() => {
              const todayIdx = sessions.findIndex(s => s.status === 'IN_PROGRESS' || s.status === 'PLANNED')
              return sessions.map((s, i) => (
                <WorkoutCard key={s.id} session={s} index={i} isToday={i === todayIdx} />
              ))
            })()}
          </div>
        )}
      </div>
    </div>
  )
}
