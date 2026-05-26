'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, CheckCircle2, Circle, ExternalLink, RefreshCw, Youtube } from 'lucide-react'
import type { SessionExercise } from '@/types'
import { useTrainingStore } from '@/stores/trainingStore'
import { useUserStore } from '@/stores/userStore'
import { EXERCISE_DATABASE } from '@/lib/training/exercise-database'

// Rest time based on fitness goal and exercise type
function calcRestSeconds(goal: string | undefined, isCompound: boolean): number {
  const base: Record<string, number> = {
    MUSCLE_GAIN:     120,
    WEIGHT_LOSS:     45,
    ENDURANCE:       30,
    GENERAL_FITNESS: 75,
    MAINTENANCE:     60,
    FLEXIBILITY:     45,
  }
  const b = base[goal ?? 'GENERAL_FITNESS'] ?? 75
  return isCompound ? b + 30 : b
}

interface Props { exercise: SessionExercise; index: number }

export function ExerciseItem({ exercise, index }: Props) {
  const [expanded, setExpanded] = useState(false)
  const [showAlternatives, setShowAlternatives] = useState(false)
  const [weight, setWeight]     = useState(exercise.weightKg ?? 0)
  const [weightInput, setWeightInput] = useState(String(exercise.weightKg ?? 0))
  const [reps, setReps]         = useState(exercise.reps)
  const [repsInput, setRepsInput] = useState(String(exercise.reps))
  const { toggleExercise, replaceExercise, startRestTimer } = useTrainingStore()
  const { profile } = useUserStore()

  const handleComplete = () => {
    toggleExercise(index, { weightKg: weight, reps })
    if (!exercise.isCompleted) {
      const restSecs = exercise.restSeconds && exercise.restSeconds > 0
        ? exercise.restSeconds
        : calcRestSeconds(profile?.fitnessGoal, exercise.isCompound)
      startRestTimer(restSecs)
    }
  }

  const handleWeightInput = (val: string) => {
    setWeightInput(val)
    const n = parseFloat(val)
    if (!isNaN(n) && n >= 0) setWeight(n)
  }

  const handleRepsInput = (val: string) => {
    setRepsInput(val)
    const n = parseInt(val, 10)
    if (!isNaN(n) && n >= 1) setReps(n)
  }

  const alternatives = EXERCISE_DATABASE.filter((item) =>
    item.id !== exercise.id && item.muscleGroups.some((group) => exercise.muscleGroups.includes(group)),
  ).slice(0, 5)

  const chooseAlternative = (item: typeof EXERCISE_DATABASE[number]) => {
    replaceExercise(index, {
      ...item,
      order: exercise.order,
      sets: exercise.sets,
      reps: exercise.reps,
      weightKg: exercise.weightKg,
      restSeconds: exercise.restSeconds,
      tempo: exercise.tempo,
      isCompleted: false,
    })
    setShowAlternatives(false)
  }

  return (
    <motion.div
      layout
      animate={{ backgroundColor: exercise.isCompleted ? 'rgba(200, 241, 53, 0.06)' : 'rgb(24, 24, 27)' }}
      className={`rounded-xl border transition-colors ${exercise.isCompleted ? 'border-[#C8F135]/30' : 'border-zinc-800'}`}
    >
      {/* En-tête */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 p-4 text-left"
      >
        {exercise.isCompleted
          ? <CheckCircle2 className="size-5 text-[#C8F135] shrink-0" />
          : <Circle className="size-5 text-zinc-600 shrink-0" />
        }
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium truncate ${exercise.isCompleted ? 'text-[#C8F135]' : 'text-white'}`}>{exercise.name}</p>
          <p className="text-xs text-zinc-500">{exercise.sets} séries × {reps} reps · {weight > 0 ? `${weight} kg` : 'au poids du corps'}</p>
        </div>
        <ChevronDown className={`size-4 text-zinc-500 transition-transform shrink-0 ${expanded ? 'rotate-180' : ''}`} />
      </button>

      {/* Détails expandés */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3 border-t border-zinc-800 pt-3">
              {/* Ajustement charge et reps */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-zinc-400 mb-1.5">Charge (kg)</label>
                  <div className="flex items-center gap-1.5">
                    <button type="button" aria-label="Diminuer la charge"
                      onClick={() => { const v = Math.max(0, weight - 2.5); setWeight(v); setWeightInput(String(v)) }}
                      className="size-8 rounded-lg bg-zinc-800 text-white font-bold hover:bg-zinc-700 shrink-0">−</button>
                    <input
                      type="number" min="0" step="0.5"
                      value={weightInput}
                      onChange={e => handleWeightInput(e.target.value)}
                      onBlur={() => setWeightInput(String(weight))}
                      className="flex-1 min-w-0 text-center text-sm font-bold text-white bg-zinc-800 border border-zinc-700 rounded-lg py-1.5 focus:outline-none focus:border-[#C8F135]"
                    />
                    <button type="button" aria-label="Augmenter la charge"
                      onClick={() => { const v = weight + 2.5; setWeight(v); setWeightInput(String(v)) }}
                      className="size-8 rounded-lg bg-zinc-800 text-white font-bold hover:bg-zinc-700 shrink-0">+</button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-zinc-400 mb-1.5">Répétitions</label>
                  <div className="flex items-center gap-1.5">
                    <button type="button" aria-label="Diminuer les répétitions"
                      onClick={() => { const v = Math.max(1, reps - 1); setReps(v); setRepsInput(String(v)) }}
                      className="size-8 rounded-lg bg-zinc-800 text-white font-bold hover:bg-zinc-700 shrink-0">−</button>
                    <input
                      type="number" min="1" step="1"
                      value={repsInput}
                      onChange={e => handleRepsInput(e.target.value)}
                      onBlur={() => setRepsInput(String(reps))}
                      className="flex-1 min-w-0 text-center text-sm font-bold text-white bg-zinc-800 border border-zinc-700 rounded-lg py-1.5 focus:outline-none focus:border-[#C8F135]"
                    />
                    <button type="button" aria-label="Augmenter les répétitions"
                      onClick={() => { const v = reps + 1; setReps(v); setRepsInput(String(v)) }}
                      className="size-8 rounded-lg bg-zinc-800 text-white font-bold hover:bg-zinc-700 shrink-0">+</button>
                  </div>
                </div>
              </div>

              {/* Instructions */}
              {exercise.instructions.length > 0 && (
                <div className="rounded-lg bg-zinc-800 p-3">
                  <p className="text-xs font-medium text-zinc-300 mb-2">Instructions</p>
                  <ol className="space-y-1">
                    {exercise.instructions.map((inst, i) => (
                      <li key={i} className="text-xs text-zinc-400 flex gap-2">
                        <span className="text-[#C8F135] font-bold shrink-0">{i+1}.</span>
                        {inst}
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {exercise.videoUrl && (
                <a
                  href={exercise.videoUrl}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`Voir une vidéo explicative YouTube pour ${exercise.name}`}
                  className="flex w-full items-center justify-between gap-3 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2.5 text-left transition-colors hover:border-red-400/50 hover:bg-red-500/15"
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <Youtube className="size-4 shrink-0 text-red-400" />
                    <span className="truncate text-sm font-medium text-white">Vidéo explicative YouTube</span>
                  </span>
                  <ExternalLink className="size-4 shrink-0 text-red-300" />
                </a>
              )}

              <button
                type="button"
                onClick={() => setShowAlternatives(true)}
                aria-label={`Remplacer exercice ${exercise.name}`}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-700 py-2 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-white disabled:opacity-50"
              >
                <RefreshCw className="size-4" /> Remplacer exercice
              </button>

              <button
                type="button"
                onClick={handleComplete}
                aria-label={exercise.isCompleted ? `Marquer ${exercise.name} comme à faire` : `Marquer ${exercise.name} comme terminé`}
                className={`w-full py-2 rounded-xl text-sm font-bold transition-colors ${
                  exercise.isCompleted
                    ? 'bg-zinc-800 text-zinc-200 hover:bg-zinc-700'
                    : 'bg-[#C8F135] text-zinc-900 hover:bg-[#d4f54d]'
                }`}
              >
                {exercise.isCompleted ? 'À faire' : 'Marquer comme terminé'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAlternatives && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
            <motion.div initial={{ y: 16 }} animate={{ y: 0 }} exit={{ y: 16 }} className="w-full max-w-md rounded-2xl border border-zinc-700 bg-zinc-900 p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h3 className="text-base font-medium text-white">Exercices alternatifs</h3>
                <button type="button" onClick={() => setShowAlternatives(false)} aria-label="Fermer les alternatives" className="rounded-lg px-2 py-1 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-white">Fermer</button>
              </div>
              <div className="space-y-2">
                {alternatives.map((item) => (
                  <button key={item.id} type="button" onClick={() => chooseAlternative(item)} aria-label={`Choisir ${item.name}`} className="w-full rounded-xl border border-zinc-800 bg-zinc-950 p-3 text-left transition-colors hover:border-[#C8F135]/50 hover:bg-zinc-800">
                    <p className="text-sm font-medium text-white">{item.name}</p>
                    <p className="mt-1 text-xs text-zinc-500">{item.muscleGroups.join(', ')}</p>
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
