'use client'
// Client de la page training — génère et affiche le programme

import { useEffect, useState } from 'react'
import { useUserStore } from '@/stores/userStore'
import { generateProgram } from '@/lib/training/generate-program'
import { WorkoutCard }     from '@/components/training/WorkoutCard'
import { EmptyState }      from '@/components/ui/EmptyState'
import { ListSkeleton }    from '@/components/ui/LoadingSkeleton'
import type { WorkoutProgram } from '@/types'
import { Dumbbell, RefreshCw } from 'lucide-react'

export function TrainingClient() {
  const { profile }  = useUserStore()
  const [program, setProgram]   = useState<WorkoutProgram | null>(null)
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    if (!profile) { setLoading(false); return }
    const generated = generateProgram({
      fitnessGoal:         profile.fitnessGoal,
      fitnessLevel:        profile.fitnessLevel,
      trainingDaysPerWeek: profile.trainingDaysPerWeek,
      availableEquipment:  profile.availableEquipment,
    })
    setProgram(generated)
    setLoading(false)
  }, [profile])

  if (loading) return <ListSkeleton rows={4} />

  if (!profile?.onboardingCompleted) {
    return (
      <EmptyState
        icon={<Dumbbell className="size-6" />}
        title="Complète ton profil d'abord"
        description="L'onboarding te permet de générer un programme personnalisé en 2 minutes."
        action={{ label: 'Commencer l\'onboarding', href: '/onboarding' }}
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* En-tête programme */}
      {program && (
        <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-5">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-base font-bold text-white">{program.name}</h2>
              <p className="text-sm text-zinc-400 mt-0.5">Semaine {program.currentWeek} / {program.weeksTotal}</p>
            </div>
            <button className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors">
              <RefreshCw className="size-3.5" /> Régénérer
            </button>
          </div>

          {/* Barre progression semaine */}
          <div className="mt-4 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
            <div className="h-full bg-[#C8F135] rounded-full" style={{ width: `${(program.currentWeek / program.weeksTotal) * 100}%` }} />
          </div>
        </div>
      )}

      {/* Séances */}
      <div>
        <h3 className="text-sm font-semibold text-white mb-3">
          Séances cette semaine ({program?.sessions.length ?? 0})
        </h3>
        {program?.sessions.length === 0 ? (
          <EmptyState
            icon={<Dumbbell className="size-6" />}
            title="Aucune séance planifiée"
            description="Votre programme n'a pas encore de séances. Vérifiez votre profil."
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {program?.sessions.map((session, i) => (
              <WorkoutCard key={session.id} session={session} index={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
