'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Header }              from '@/components/layout/Header'
import { PageWrapper }         from '@/components/layout/PageWrapper'
import { FocusExerciseView }   from '@/components/training/FocusExerciseView'
import { RestTimer }           from '@/components/training/RestTimer'
import { WorkoutSummary }      from '@/components/training/WorkoutSummary'
import { useTrainingStore }    from '@/stores/trainingStore'
import { generateProgram }     from '@/lib/training/generate-program'
import { useUserStore }        from '@/stores/userStore'
import { Clock, ChevronLeft }  from 'lucide-react'
import Link from 'next/link'
import type { SessionExercise } from '@/types'

interface DBSession { id: string; name: string; status: string; durationMinutes: number | null }

/** Focus-mode workout session: one exercise at a time, set-by-set tracking, auto rest timer. */
export default function SessionPage({ params }: { params: { sessionId: string } }) {
  const router      = useRouter()
  const { profile } = useUserStore()
  const {
    activeSession, startSession, setCurrentExercise,
    toggleExercise, startRestTimer, endSession, updateExerciseField,
  } = useTrainingStore()

  const [showSummary, setShowSummary] = useState(false)
  const [elapsed, setElapsed]         = useState(0)

  // Per-exercise local state (weight, reps, sets done)
  const [weights,     setWeights]     = useState<number[]>([])
  const [repsArr,     setRepsArr]     = useState<number[]>([])
  const [setProgress, setSetProgress] = useState<number[]>([])

  // Elapsed timer
  useEffect(() => {
    const id = setInterval(() => setElapsed(e => e + 1), 1000)
    return () => clearInterval(id)
  }, [])

  // Load session
  useEffect(() => {
    if (!params.sessionId || !profile?.fitnessGoal || !profile?.fitnessLevel) return
    if (activeSession?.sessionId === params.sessionId) return

    const buildProgram = () => generateProgram({
      fitnessGoal:         profile.fitnessGoal!,
      fitnessLevel:        profile.fitnessLevel!,
      trainingDaysPerWeek: profile.trainingDaysPerWeek ?? 3,
      availableEquipment:  profile.availableEquipment ?? [],
    })

    fetch(`/api/user/training/sessions/${params.sessionId}`)
      .then(res => res.ok ? res.json() as Promise<DBSession> : null)
      .then(sess => {
        const program  = buildProgram()
        const matching = sess
          ? (program.sessions.find(s => s.name === sess.name) ?? program.sessions[0])
          : (program.sessions.find(s => s.id === params.sessionId) ?? program.sessions[0])

        if (matching) {
          startSession({
            sessionId:       params.sessionId,
            name:            sess?.name ?? matching.name,
            exercises:       matching.exercises,
            currentExercise: 0,
            restTimerActive: false,
            restSecondsLeft: 0,
          })
        }

        if (sess?.status === 'PLANNED') {
          fetch(`/api/user/training/sessions/${params.sessionId}`, {
            method:  'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ status: 'IN_PROGRESS' }),
          }).catch(() => {})
        }
      })
      .catch(() => {
        const program = buildProgram()
        const s = program.sessions[0]
        if (s) startSession({
          sessionId: params.sessionId, name: s.name, exercises: s.exercises,
          currentExercise: 0, restTimerActive: false, restSecondsLeft: 0,
        })
      })
  }, [params.sessionId, profile, activeSession?.sessionId, startSession])

  // Init per-exercise local state once session is ready
  useEffect(() => {
    if (!activeSession || weights.length > 0) return
    setWeights(activeSession.exercises.map(e => e.weightKg ?? 0))
    setRepsArr(activeSession.exercises.map(e => e.reps))
    setSetProgress(activeSession.exercises.map(e => e.isCompleted ? e.sets : 0))
  }, [activeSession, weights.length])

  if (!activeSession || weights.length === 0) return null

  const currentIdx    = activeSession.currentExercise
  const exercise      = activeSession.exercises[currentIdx]
  const totalEx       = activeSession.exercises.length
  const completedExs  = activeSession.exercises.filter(e => e.isCompleted).length
  const minutes       = Math.floor(elapsed / 60)
  const secs          = elapsed % 60

  const handleSetComplete = () => {
    const isCardio = exercise.muscleGroups[0] === 'CARDIO'
    const done     = (setProgress[currentIdx] ?? 0) + 1
    const next     = [...setProgress]
    next[currentIdx] = done
    setSetProgress(next)

    if (done >= exercise.sets) {
      toggleExercise(currentIdx, { weightKg: weights[currentIdx], reps: repsArr[currentIdx] })
    }
    // Pour le cardio, pas de timer de repos automatique
    if (!isCardio) {
      startRestTimer(exercise.restSeconds)
    }
  }

  const handleSetsChange = (newSets: number) => {
    updateExerciseField(currentIdx, { sets: newSets })
    // Si des séries déjà faites dépassent le nouveau total, cap
    setSetProgress(prev => {
      const next = [...prev]
      next[currentIdx] = Math.min(prev[currentIdx] ?? 0, newSets)
      return next
    })
  }

  const handleRestChange = (newRest: number) => {
    updateExerciseField(currentIdx, { restSeconds: newRest })
  }

  const handleCardioChange = (fields: Partial<Pick<SessionExercise, 'durationMinutes' | 'distanceKm' | 'speedKmH' | 'inclinePct'>>) => {
    updateExerciseField(currentIdx, fields)
  }

  const handleNext = () => {
    if (currentIdx + 1 < totalEx) {
      setCurrentExercise(currentIdx + 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      handleFinish()
    }
  }

  const handlePrev = () => {
    if (currentIdx > 0) {
      setCurrentExercise(currentIdx - 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handleFinish = async () => {
    await fetch(`/api/user/training/sessions/${params.sessionId}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        status:         'COMPLETED',
        durationMinutes: minutes,
        caloriesBurned: Math.round(minutes * 6.5),
      }),
    }).catch(() => {})
    setShowSummary(true)
  }

  const handleClose = () => { endSession(); router.push('/training') }

  return (
    <>
      <Header title={activeSession.name} />
      <PageWrapper>
        {/* Top bar: back + timer + progress */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-2">
            <Link href="/training" className="flex items-center gap-1 text-sm text-zinc-400 hover:text-white transition-colors">
              <ChevronLeft className="size-4" /> Retour
            </Link>
            <div className="flex items-center gap-2 text-xs text-zinc-400">
              <Clock className="size-3.5" />
              <span className="tabular-nums font-mono">
                {minutes}:{String(secs).padStart(2, '0')}
              </span>
              <span className="text-zinc-600">·</span>
              {completedExs}/{totalEx} terminés
            </div>
          </div>
          <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#C8F135] rounded-full transition-all duration-500"
              style={{ width: `${(completedExs / totalEx) * 100}%` }}
            />
          </div>
        </div>

        <FocusExerciseView
          exercise={exercise}
          exerciseIndex={currentIdx}
          totalExercises={totalEx}
          completedSets={setProgress[currentIdx] ?? 0}
          weight={weights[currentIdx] ?? 0}
          reps={repsArr[currentIdx] ?? exercise.reps}
          onWeightChange={w => { const n = [...weights]; n[currentIdx] = w; setWeights(n) }}
          onRepsChange={r => { const n = [...repsArr]; n[currentIdx] = r; setRepsArr(n) }}
          onSetsChange={handleSetsChange}
          onRestChange={handleRestChange}
          onCardioChange={handleCardioChange}
          onSetComplete={handleSetComplete}
          onPrev={handlePrev}
          onNext={handleNext}
          hasPrev={currentIdx > 0}
          hasNext={currentIdx < totalEx - 1}
        />

        <RestTimer />

        {showSummary && (
          <WorkoutSummary session={activeSession} onClose={handleClose} />
        )}
      </PageWrapper>
    </>
  )
}
