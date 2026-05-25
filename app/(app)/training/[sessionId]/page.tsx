'use client'
// Page détail séance — exercices interactifs + chronomètre repos + résumé fin
// deps: npm install framer-motion

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Header }         from '@/components/layout/Header'
import { PageWrapper }    from '@/components/layout/PageWrapper'
import { ExerciseItem }   from '@/components/training/ExerciseItem'
import { RestTimer }      from '@/components/training/RestTimer'
import { WorkoutSummary } from '@/components/training/WorkoutSummary'
import { useTrainingStore } from '@/stores/trainingStore'
import { generateProgram }  from '@/lib/training/generate-program'
import { useUserStore }     from '@/stores/userStore'
import { Clock, ChevronLeft } from 'lucide-react'
import Link from 'next/link'
import { useEffect } from 'react'

export default function SessionPage({ params }: { params: { sessionId: string } }) {
  const router       = useRouter()
  const { profile }  = useUserStore()
  const { activeSession, startSession, endSession } = useTrainingStore()
  const [showSummary, setShowSummary] = useState(false)
  const [elapsed, setElapsed]         = useState(0)

  // Chrono global de séance
  useEffect(() => {
    const interval = setInterval(() => setElapsed((e) => e + 1), 1000)
    return () => clearInterval(interval)
  }, [])

  // Charge la séance depuis le programme généré si pas de séance active
  useEffect(() => {
    if (activeSession?.sessionId === params.sessionId || !profile) return
    const program = generateProgram({
      fitnessGoal: profile.fitnessGoal, fitnessLevel: profile.fitnessLevel,
      trainingDaysPerWeek: profile.trainingDaysPerWeek, availableEquipment: profile.availableEquipment,
    })
    const session = program.sessions.find((s) => s.id === params.sessionId) ?? program.sessions[0]
    if (session) {
      startSession({ sessionId: session.id, name: session.name, exercises: session.exercises as never, currentExercise: 0 })
    }
  }, [params.sessionId, profile])

  if (!activeSession) return null

  const completedCount  = activeSession.exercises.filter((e) => e.isCompleted).length
  const allDone         = completedCount === activeSession.exercises.length
  const minutes         = Math.floor(elapsed / 60)
  const secs            = elapsed % 60

  const handleFinish = () => {
    setShowSummary(true)
  }

  const handleClose = () => {
    endSession()
    router.push('/training')
  }

  return (
    <>
      <Header title={activeSession.name} />
      <PageWrapper>
        {/* Barre de progression séance */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <Link href="/training" className="flex items-center gap-1 text-sm text-zinc-400 hover:text-white">
              <ChevronLeft className="size-4" /> Retour
            </Link>
            <div className="flex items-center gap-2 text-xs text-zinc-400">
              <Clock className="size-3.5" />
              {minutes}:{String(secs).padStart(2, '0')}
              <span className="text-zinc-600">·</span>
              {completedCount}/{activeSession.exercises.length} exercices
            </div>
          </div>
          <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#C8F135] rounded-full transition-all"
              style={{ width: `${(completedCount / activeSession.exercises.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Exercices */}
        <div className="space-y-3 mb-6">
          {activeSession.exercises.map((ex, i) => (
            <ExerciseItem key={ex.id} exercise={ex} index={i} />
          ))}
        </div>

        {/* Bouton terminer */}
        <button
          onClick={handleFinish}
          disabled={!allDone}
          className="w-full py-3 rounded-xl bg-[#C8F135] text-zinc-900 font-bold disabled:opacity-40 hover:bg-[#d4f54d] transition-colors"
        >
          {allDone ? 'Terminer la séance 🎉' : `${activeSession.exercises.length - completedCount} exercice(s) restant(s)`}
        </button>

        {/* Timer repos */}
        <RestTimer />

        {/* Résumé fin de séance */}
        {showSummary && (
          <WorkoutSummary session={activeSession} onClose={handleClose} />
        )}
      </PageWrapper>
    </>
  )
}
