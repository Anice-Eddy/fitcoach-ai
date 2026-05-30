'use client'

import { useState, useEffect } from 'react'
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

interface DBSession { id: string; name: string; status: string; durationMinutes: number | null }

/** Active workout session page: tracks exercise sets, rest timer, and session completion; syncs status to the API. */
export default function SessionPage({ params }: { params: { sessionId: string } }) {
  const router       = useRouter()
  const { profile }  = useUserStore()
  const { activeSession, startSession, endSession } = useTrainingStore()
  const [showSummary, setShowSummary] = useState(false)
  const [elapsed, setElapsed]         = useState(0)

  useEffect(() => {
    const interval = setInterval(() => setElapsed(e => e + 1), 1000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (!params.sessionId || !profile) return
    if (!profile.fitnessGoal || !profile.fitnessLevel) return

    // Skip if already active for this session
    if (activeSession?.sessionId === params.sessionId) return

    const buildProgram = () => generateProgram({
      fitnessGoal: profile.fitnessGoal!,
      fitnessLevel: profile.fitnessLevel!,
      trainingDaysPerWeek: profile.trainingDaysPerWeek ?? 3,
      availableEquipment: profile.availableEquipment ?? [],
    })

    // Fetch session from DB to get the name and mark as IN_PROGRESS
    fetch(`/api/user/training/sessions/${params.sessionId}`)
      .then(res => res.ok ? res.json() as Promise<DBSession> : null)
      .then(sess => {
        if (!sess) {
          // Fallback: try local ID match (for offline use)
          const program = buildProgram()
          const local = program.sessions.find(s => s.id === params.sessionId) ?? program.sessions[0]
          if (local) startSession({ sessionId: params.sessionId, name: local.name, exercises: local.exercises, currentExercise: 0, restTimerActive: false, restSecondsLeft: 0 })
          return
        }

        // Generate exercises from session name
        const program = buildProgram()
        const matching = program.sessions.find(s => s.name === sess.name) ?? program.sessions[0]
        if (matching) {
          startSession({ sessionId: params.sessionId, name: sess.name, exercises: matching.exercises, currentExercise: 0, restTimerActive: false, restSecondsLeft: 0 })
        }

        // Mark as IN_PROGRESS if PLANNED
        if (sess.status === 'PLANNED') {
          fetch(`/api/user/training/sessions/${params.sessionId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'IN_PROGRESS' }),
          }).catch(() => {})
        }
      })
      .catch(() => {
        // Offline fallback
        if (!profile) return
        const program = buildProgram()
        const s = program.sessions[0]
        if (s) startSession({ sessionId: params.sessionId, name: s.name, exercises: s.exercises, currentExercise: 0, restTimerActive: false, restSecondsLeft: 0 })
      })
  }, [
    params.sessionId,
    profile,
    profile?.fitnessGoal,
    profile?.fitnessLevel,
    profile?.trainingDaysPerWeek,
    profile?.availableEquipment,
    activeSession?.sessionId,
    startSession,
  ])

  if (!activeSession) return null

  const completedCount = activeSession.exercises.filter(e => e.isCompleted).length
  const allDone        = completedCount === activeSession.exercises.length
  const minutes        = Math.floor(elapsed / 60)
  const secs           = elapsed % 60

  const handleFinish = async () => {
    // Save completion to DB
    await fetch(`/api/user/training/sessions/${params.sessionId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'COMPLETED',
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

        <div className="space-y-3 mb-6">
          {activeSession.exercises.map((ex, i) => (
            <ExerciseItem key={ex.id ?? i} exercise={ex} index={i} />
          ))}
        </div>

        <button
          onClick={handleFinish}
          disabled={!allDone}
          className="w-full py-3 rounded-xl bg-[#C8F135] text-zinc-900 font-bold disabled:opacity-40 hover:bg-[#d4f54d] transition-colors"
        >
          {allDone ? 'Terminer la séance 🎉' : `${activeSession.exercises.length - completedCount} exercice(s) restant(s)`}
        </button>

        <RestTimer />

        {showSummary && (
          <WorkoutSummary session={activeSession} onClose={handleClose} />
        )}
      </PageWrapper>
    </>
  )
}
