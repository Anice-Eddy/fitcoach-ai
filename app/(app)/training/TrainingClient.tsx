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

interface DBSession { id: string; name: string; status: string; dayOfWeek: number | null; durationMinutes: number | null }
interface DBProgram { id: string; name: string; currentWeek: number; weeksTotal: number; sessions: DBSession[] }

/** Interactive training view: fetches the active workout program and renders each session with exercise details and status controls. */
export function TrainingClient() {
  const { profile }     = useUserStore()
  const { programCache, setProgramCache, clearProgramCache, isProgramCacheFresh } = useTrainingStore()

  const [sessions,     setSessions]     = useState<WorkoutSession[]>(programCache?.sessions ?? [])
  const [programName,  setProgramName]  = useState(programCache?.programName ?? '')
  const [programWeek,  setProgramWeek]  = useState(programCache?.programWeek ?? { current: 1, total: 8 })
  const [loading,      setLoading]      = useState(!isProgramCacheFresh())
  const [error,        setError]        = useState<string | null>(null)

  // Ref pour éviter le double-fetch du React Strict Mode en développement
  const fetchingRef = useRef(false)

  // Sérialiser l'équipement — évite que la référence tableau déstabilise useCallback
  const equipmentKey = JSON.stringify(profile?.availableEquipment ?? [])

  const fetchAndCache = useCallback((force = false) => {
    if (!profile?.fitnessGoal || !profile?.fitnessLevel) {
      setLoading(false)
      return
    }
    // Utiliser le cache si frais et pas de forçage
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
        })

        const combined: WorkoutSession[] = program.sessions.map(dbSess => {
          const gen = generated.sessions.find(s => s.name === dbSess.name)
            ?? generated.sessions[dbSess.dayOfWeek ?? 0]
            ?? generated.sessions[0]
          return {
            ...gen,
            id:              dbSess.id,
            status:          dbSess.status as WorkoutSession['status'],
            durationMinutes: dbSess.durationMinutes ?? gen.durationMinutes,
          }
        })

        const cache = {
          sessions:    combined,
          programName: program.name,
          programWeek: { current: program.currentWeek, total: program.weeksTotal },
          cachedAt:    Date.now(),
        }
        setProgramCache(cache)
        setSessions(combined)
        setProgramName(program.name)
        setProgramWeek({ current: program.currentWeek, total: program.weeksTotal })
        setLoading(false)
      })
      .catch(() => {
        setError('Impossible de charger le programme.')
        setLoading(false)
      })
      .finally(() => { fetchingRef.current = false })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.fitnessGoal, profile?.fitnessLevel, profile?.trainingDaysPerWeek, equipmentKey])

  useEffect(() => { fetchAndCache() }, [fetchAndCache])

  const regenerate = async () => {
    clearProgramCache()
    setLoading(true)
    await fetch('/api/user/training', { method: 'DELETE' })
    fetchAndCache(true)
  }

  // Mise à jour de l'état local si le cache change (ex: autre onglet)
  useEffect(() => {
    if (programCache && isProgramCacheFresh()) {
      setSessions(programCache.sessions)
      setProgramName(programCache.programName)
      setProgramWeek(programCache.programWeek)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [programCache])

  if (loading) return <ListSkeleton rows={4} />

  if (!profile?.fitnessGoal || !profile?.fitnessLevel) {
    return (
      <EmptyState
        icon={<Dumbbell className="size-6" />}
        title="Complète ton profil d'abord"
        description="L'onboarding te permet de générer un programme personnalisé en 2 minutes."
        action={{ label: 'Commencer l\'onboarding', href: '/onboarding' }}
      />
    )
  }

  if (error) {
    return (
      <EmptyState
        icon={<Dumbbell className="size-6" />}
        title="Erreur de chargement"
        description={error}
        action={{ label: 'Réessayer', href: '/training' }}
      />
    )
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-5">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-base font-bold text-white">{programName}</h2>
            <p className="text-sm text-zinc-400 mt-0.5">Semaine {programWeek.current} / {programWeek.total}</p>
          </div>
          <button
            type="button"
            onClick={regenerate}
            aria-label="Régénérer le programme d'entraînement"
            className="flex items-center gap-1.5 text-xs text-zinc-400 transition-colors hover:text-white"
          >
            <RefreshCw className="size-3.5" /> Régénérer
          </button>
        </div>
        <div className="mt-4 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
          <div className="h-full bg-[#C8F135] rounded-full"
            style={{ width: `${(programWeek.current / programWeek.total) * 100}%` }} />
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-white mb-3">
          Séances ({sessions.length})
        </h3>
        {sessions.length === 0 ? (
          <EmptyState
            icon={<Dumbbell className="size-6" />}
            title="Aucune séance planifiée"
            description="Vérifiez votre profil."
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
